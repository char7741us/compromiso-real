import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import JSZip from 'jszip';
import type { VoterData } from '../context/VoterContext';
import { appConfig } from '../config/appConfig';

interface LeaderStats {
    total: number;
    complete: number;
    missingInfo: number;
    invalidId: number;
}

const getImageData = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.src = url;
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Could not get canvas context'));
                return;
            }
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = (error) => reject(error);
    });
};

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
export const generateLeaderPDF = async (leaderName: string, voters: VoterData[]): Promise<jsPDF> => {
    const doc = new jsPDF();
    const stats = calculateLeaderStats(voters);
    const date = new Date().toLocaleDateString('es-CO');

    try {
        const logoData = await getImageData(appConfig.assets.reportLogo);
        // Add Logo: x, y, width, height (Adjusted for logo aspect ratio)
        doc.addImage(logoData, 'PNG', 14, 10, 50, 25);
    } catch (error) {
        console.error("Error loading logo for PDF:", error);
    }

    // Header Text (Shifted down below logo)
    doc.setFontSize(18);
    doc.setTextColor(41, 128, 185); // Primary Blue
    doc.text(`Reporte de Equipo: ${leaderName}`, 14, 45); // Y moved down

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Fecha de Corte: ${date}`, 14, 55); // Y moved down

    // Stats Card
    doc.setFillColor(240, 242, 246);
    doc.rect(14, 65, 180, 25, 'F'); // Y moved down

    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text(`Total Votantes: ${stats.total}`, 20, 80); // Relative to rect
    doc.text(`Datos Completos: ${stats.complete} (${((stats.complete / stats.total) * 100).toFixed(0)}%)`, 70, 80);
    doc.setTextColor(200, 0, 0); // Red for warning
    doc.text(`Datos Faltantes: ${stats.missingInfo}`, 140, 80);

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
        startY: 100, // Shifted down
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

    const entries = Object.entries(groupedVoters);

    for (const [leaderName, voters] of entries) {
        const safeName = leaderName.replace(/[^a-z0-9]/gi, '_').substring(0, 30);

        if (format === 'pdf') {
            const doc = await generateLeaderPDF(leaderName, voters);
            const pdfBlob = doc.output('blob');
            folder.file(`${safeName}_Reporte.pdf`, pdfBlob);
        } else {
            const excelBuffer = generateLeaderExcel(leaderName, voters);
            folder.file(`${safeName}_Reporte.xlsx`, excelBuffer);
        }
    }

    return await zip.generateAsync({ type: 'blob' });
};
