export interface Voter {
    _id: string;
    id?: string;
    // CSV / Mapped Fields
    'LÍDER': string;
    leader_name?: string;
    'NOMBRES': string;
    'APELLIDOS': string;
    'No DE CÉDULA SIN PUNTOS': string;
    'TELÉFONO': string;
    'DIRECCIÓN DE RESIDENCIA': string;
    'BARRIO DE RESIDENCIA': string;
    'MUNICIPIO RESIDENCIA'?: string;
    'DEPARTAMENTO RESIDENCIA'?: string;
    'PUESTO DE VOTACIÓN': string;
    'DIRECCIÓN (Pto de votación)': string;
    'MESA': string;
    'MUNICIPIO VOTACIÓN': string;
    'DEPARTAMENTO VOTACIÓN'?: string;
    'INVALIDA': boolean;

    // Database Fields (kept for compatibility with some views)
    first_name?: string;
    last_name?: string;
    document_number?: string;
    phone?: string;
    address?: string;
    neighborhood?: string;
    voting_post?: string;
    voting_table?: string;
    voting_municipality?: string;
    municipality?: string;
    // Allow dynamic access for now to prevent build breakage in complex views
    [key: string]: any;
}

// Deprecated alias
export type VoterData = Voter;
