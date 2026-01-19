import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import type { VoterData } from '../context/VoterContext';

interface LeaderStats {
    total: number;
    complete: number;
    missingInfo: number;
    invalidId: number;
}

export const calculateLeaderStats = (voters: VoterData[]): LeaderStats => {
    let total = voters.length;
    let complete = 0;
    let missingInfo = 0;
    let invalidId = 0;

    voters.forEach(v => {
        // Use the application's definition of Invalid ID (mapped from DB is_invalid_cc)
        const isInvalidCC = v['INVALIDA'] === true;
        const hasVotingPost = !!v.voting_post;

        if (isInvalidCC) {
            invalidId++;
        }

        if (!hasVotingPost) {
            missingInfo++;
        }

        // A record is complete if it has a valid ID and a voting post
        if (!isInvalidCC && hasVotingPost) {
            complete++;
        }
    });

    return { total, complete, missingInfo, invalidId };
};

const getVoterStatus = (voter: VoterData): string => {
    const issues = [];
    if (voter['INVALIDA'] === true) issues.push("CC Inválida");
    if (!voter.voting_post) issues.push("Falta Puesto");

    return issues.length === 0 ? "OK" : issues.join(", ");
};

// --- PDF GENERATOR ---
export const generateLeaderPDF = (leaderName: string, voters: VoterData[]): jsPDF => {
    const doc = new jsPDF();
    const stats = calculateLeaderStats(voters);
    const date = new Date().toLocaleDateString('es-CO');

    // Header
    doc.setFontSize(18);
    doc.setTextColor(41, 128, 185); // Primary Blue
    doc.text(`Reporte de Equipo: ${leaderName}`, 14, 20);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Fecha de Corte: ${date}`, 14, 28);

    // Stats Card (Simple representation)
    doc.setFillColor(240, 242, 246);
    doc.rect(14, 35, 180, 25, 'F');

    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Total Votantes: ${stats.total}`, 20, 48);
    doc.text(`Datos Completos: ${stats.complete} (${((stats.complete / stats.total) * 100).toFixed(0)}%)`, 70, 48);
    doc.setTextColor(200, 0, 0); // Red for warning
    doc.text(`Datos Faltantes: ${stats.missingInfo}`, 140, 48);

    // Table
    const tableBody = voters.map(v => [
        `${v.first_name || ''} ${v.last_name || ''}`,
        v.document_number,
        v.phone || '-',
        v.voting_post || 'POR DEFINIR',
        v.voting_table || '-',
        getVoterStatus(v)
    ]);

    autoTable(doc, {
        startY: 65,
        head: [['Nombre Completo', 'Cédula', 'Teléfono', 'Puesto de Votación', 'Mesa', 'Estado']],
        body: tableBody,
        theme: 'grid',
        headStyles: { fillColor: [44, 62, 80], textColor: 255 },
        styles: { fontSize: 9, cellPadding: 3 },
        columnStyles: {
            0: { cellWidth: 50 },
            5: { fontStyle: 'bold', textColor: [200, 0, 0] } // Highlight Status
        },
        didParseCell: function (data) {
            if (data.section === 'body' && data.column.index === 5) {
                if (data.cell.raw === 'OK') {
                    data.cell.styles.textColor = [0, 128, 0]; // Green for OK
                }
            }
        }
    });

    return doc;
};

// --- EXCEL GENERATOR ---
export const generateLeaderExcel = (leaderName: string, voters: VoterData[]): Uint8Array => {
    const stats = calculateLeaderStats(voters);

    // Sheet 1: Summary
    const summaryData = [
        ["Reporte de Gestión", leaderName],
        ["Fecha", new Date().toLocaleDateString('es-CO')],
        ["", ""],
        ["Total Votantes", stats.total],
        ["Datos Completos", stats.complete],
        ["Faltantes Información", stats.missingInfo],
        ["Cédulas Inválidas", stats.invalidId]
    ];
    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);

    // Sheet 2: Detailed List
    const detailData = voters.map(v => ({
        "Nombre Completo": `${v.first_name || ''} ${v.last_name || ''}`,
        "Cédula": v.document_number,
        "Teléfono": v.phone || '',
        "Dirección": v.address || '',
        "Barrio": v.neighborhood || '',
        "Puesto Votación": v.voting_post || '',
        "Mesa": v.voting_table || '',
        "Estado": getVoterStatus(v)
    }));
    const detailSheet = XLSX.utils.json_to_sheet(detailData);

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, summarySheet, "Resumen");
    XLSX.utils.book_append_sheet(wb, detailSheet, "Listado Detallado");

    const excelBuffer = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
    return excelBuffer;
};

// --- ZIP GENERATOR (BULK) ---
export const generateAllReportsZip = async (
    groupedVoters: Record<string, VoterData[]>,
    format: 'pdf' | 'xlsx'
): Promise<Blob> => {
    const zip = new JSZip();
    const dateStr = new Date().toISOString().split('T')[0];
    const folderName = `Reportes_Lideres_${dateStr}`;
    const folder = zip.folder(folderName);

    if (!folder) throw new Error("Could not create ZIP folder");

    Object.entries(groupedVoters).forEach(([leaderName, voters]) => {
        const safeName = leaderName.replace(/[^a-z0-9]/gi, '_').substring(0, 30);

        if (format === 'pdf') {
            const doc = generateLeaderPDF(leaderName, voters);
            const pdfBlob = doc.output('blob');
            folder.file(`${safeName}_Reporte.pdf`, pdfBlob);
        } else {
            const excelBuffer = generateLeaderExcel(leaderName, voters);
            folder.file(`${safeName}_Reporte.xlsx`, excelBuffer);
        }
    });

    return await zip.generateAsync({ type: 'blob' });
};
