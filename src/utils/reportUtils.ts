import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { type VoterData } from '../context/VoterContext';

export const generateInvalidCCReport = (voters: VoterData[]) => {
    console.log('Iniciando generateInvalidCCReport con', voters.length, 'votantes');

    const invalidVoters = voters.filter(v => v['INVALIDA']);
    console.log('Votantes inválidos encontrados:', invalidVoters.length);

    if (invalidVoters.length === 0) {
        return { success: false, message: 'No hay personas con cédulas marcadas como inválidas.' };
    }

    try {
        const doc = new jsPDF();
        const dateStr = new Date().toLocaleDateString();
        const timeStr = new Date().toLocaleTimeString();

        console.log('Configurando encabezado del PDF');
        // Header
        doc.setFontSize(22);
        doc.setTextColor(0, 72, 132); // Primary color
        doc.text('Compromiso Real', 105, 15, { align: 'center' });

        doc.setFontSize(14);
        doc.setTextColor(100);
        doc.text('Informe Detallado de Cédulas Erróneas (Inválidas)', 105, 25, { align: 'center' });

        doc.setFontSize(10);
        doc.text(`Fecha: ${dateStr} - ${timeStr}`, 105, 32, { align: 'center' });
        doc.text(`Total de registros: ${invalidVoters.length}`, 105, 38, { align: 'center' });

        console.log('Preparando datos de la tabla');
        // Table
        const tableColumn = [
            "Líder",
            "Nombre y Apellidos",
            "Cédula",
            "Teléfono",
            "Municipio/Puesto",
            "Mesa"
        ];

        const tableRows = invalidVoters.map(v => [
            v['LÍDER'] || 'N/A',
            `${v['NOMBRES'] || ''} ${v['APELLIDOS'] || ''}`.trim(),
            v['No DE CÉDULA SIN PUNTOS'] || 'N/A',
            v['TELÉFONO'] || 'N/A',
            `${v['MUNICIPIO VOTACIÓN'] || '-'}\n${v['PUESTO DE VOTACIÓN'] || '-'}`,
            v['MESA'] || '-'
        ]);

        console.log('Llamando a autoTable');
        autoTable(doc, {
            startY: 45,
            head: [tableColumn],
            body: tableRows,
            theme: 'grid',
            headStyles: {
                fillColor: [0, 72, 132],
                textColor: [255, 255, 255],
                fontSize: 10,
                halign: 'center'
            },
            styles: {
                fontSize: 9,
                cellPadding: 3,
            },
            columnStyles: {
                0: { cellWidth: 25 }, // Líder
                1: { cellWidth: 45 }, // Nombre
                2: { cellWidth: 25 }, // Cédula
                3: { cellWidth: 25 }, // Teléfono
                4: { cellWidth: 50 }, // Municipio/Puesto
                5: { cellWidth: 15 }, // Mesa
            },
            alternateRowStyles: {
                fillColor: [245, 245, 245]
            }
        });

        console.log('Configurando numeración de páginas');
        // Footer - Page numbers
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150);
            doc.text(`Página ${i} de ${pageCount}`, 190, 285, { align: 'right' });
            doc.text('Generado por APP Comprimiso Real', 20, 285);
        }

        const fileName = `Informe_Cedulas_Erroneas_${dateStr.replace(/\//g, '-')}.pdf`;
        console.log('Guardando archivo:', fileName);
        doc.save(fileName);

        return { success: true };
    } catch (error: any) {
        console.error('Error durante la generación del PDF:', error);
        return { success: false, message: 'Error interno: ' + error.message };
    }
};
