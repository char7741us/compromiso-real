import * as XLSX from 'xlsx';

export const parseExcelData = async (
    input: string | File,
    type: 'leaders' | 'voters'
): Promise<any[]> => {
    let data: any[] = [];

    if (typeof input === 'string') {
        // Parse copy-pasted text (tab or comma separated)
        const workbook = XLSX.read(input, { type: 'string' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        data = XLSX.utils.sheet_to_json(sheet);
    } else {
        // Parse File object
        const buffer = await input.arrayBuffer();
        const workbook = XLSX.read(buffer);
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        data = XLSX.utils.sheet_to_json(sheet);
    }

    // Normalize keys to lowercase and trim
    return data.map(row => {
        const normalized: any = {};
        Object.keys(row).forEach(key => {
            const value = row[key];
            // Simple mapping based on expected columns
            const lowerKey = key.toLowerCase().trim();

            if (type === 'leaders') {
                if (lowerKey.includes('lider') || lowerKey.includes('líder') || lowerKey === 'nombres' || lowerKey.includes('nombre completo')) normalized.full_name = value;
                if (lowerKey.includes('cédula') || lowerKey.includes('cedula') || lowerKey.includes('documento')) normalized.document_number = String(value);
                if (lowerKey.includes('teléfono') || lowerKey.includes('telefono') || lowerKey.includes('celular') || lowerKey.includes('movil')) normalized.phone = String(value);
                if (lowerKey.includes('email') || lowerKey.includes('correo') || lowerKey.includes('e-mail')) normalized.email = value;
                if (lowerKey === 'meta' || lowerKey.includes('objetivo')) normalized.goal = Number(value) || 0;
                if (lowerKey === 'zona') normalized.zone = value;
                if (lowerKey === 'municipio') normalized.municipality = value;
                if (lowerKey === 'barrio') normalized.neighborhood = value;
            } else {
                // Voters
                if (lowerKey === 'nombre' || lowerKey === 'nombres') normalized.first_name = value;
                if (lowerKey === 'apellido' || lowerKey === 'apellidos') normalized.last_name = value;
                if (lowerKey.includes('cédula') || lowerKey.includes('cedula') || lowerKey.includes('documento')) normalized.document_number = String(value);
                if (lowerKey.includes('teléfono') || lowerKey.includes('telefono') || lowerKey.includes('celular') || lowerKey.includes('movil')) normalized.phone = String(value);
                if (lowerKey.includes('puesto') || lowerKey.includes('lugar de votacion')) normalized.voting_post = value;
                if (lowerKey.includes('mesa')) normalized.voting_table = value;
            }
        });

        // Fallback for Name splitting if needed (very basic)
        if (type === 'voters' && !normalized.first_name && normalized.full_name) {
            const parts = normalized.full_name.split(' ');
            normalized.first_name = parts[0];
            normalized.last_name = parts.slice(1).join(' ');
        }

        return normalized;
    });
};
