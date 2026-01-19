import { supabase } from '../supabase';

export const validateCedula = async (cedula: string, currentId?: string, table: 'leaders' | 'voters' = 'leaders'): Promise<string | null> => {
    if (!/^\d{7,10}$/.test(cedula)) return "La cédula debe tener entre 7 y 10 dígitos numéricos.";

    // Check uniqueness in DB
    const query = supabase.from(table).select('id').eq('document_number', cedula);
    if (currentId) query.neq('id', currentId);

    const { data, error } = await query;
    if (error) return "Error validando cédula.";
    if (data && data.length > 0) return "Esta cédula ya está registrada.";

    return null; // Valid
};

export const validateEmail = async (email: string, currentId?: string): Promise<string | null> => {
    if (!email) return null; // Optional
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return "Formato de email inválido.";

    const query = supabase.from('leaders').select('id').eq('email', email);
    if (currentId) query.neq('id', currentId);

    const { data, error } = await query;
    if (error) return "Error validando email.";
    if (data && data.length > 0) return "Este email ya está registrado.";

    return null;
};

export const validatePhone = (phone: string): string | null => {
    if (!phone) return null; // Optional
    if (!/^3\d{9}$/.test(phone)) return "El teléfono debe ser celular (10 dígitos, empieza por 3).";
    return null;
};

export const validateRequired = (value: string, fieldName: string): string | null => {
    if (!value || value.trim().length === 0) return `${fieldName} es obligatorio.`;
    if (value.trim().length < 3) return `${fieldName} debe tener al menos 3 caracteres.`;
    return null;
};
