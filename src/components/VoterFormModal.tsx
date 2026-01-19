import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { X, Save, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';

interface VoterFormModalProps {
    isOpen: boolean;
    onClose: () => void;
    initialData?: any | null; // If provided, we are in Edit mode
    preSelectedLeaderId?: string; // If provided, leader is locked
    onSuccess: () => void;
}

export default function VoterFormModal({ isOpen, onClose, initialData, preSelectedLeaderId, onSuccess }: VoterFormModalProps) {
    const [loading, setLoading] = useState(false);
    const [leaders, setLeaders] = useState<{ id: string, full_name: string }[]>([]);
    const [errors, setErrors] = useState<Record<string, string>>({});

    const [formData, setFormData] = useState({
        first_name: '',
        last_name: '',
        document_number: '',
        phone: '',
        address: '',
        neighborhood: '',
        municipality: 'Barranquilla', // Default
        department: 'Atlántico',      // Default
        voting_post: '',
        voting_table: '',
        leader_id: '',
    });

    useEffect(() => {
        if (isOpen) {
            fetchLeaders();
            if (initialData) {
                // Populate form for editing
                setFormData({
                    first_name: initialData.first_name || '',
                    last_name: initialData.last_name || '',
                    document_number: initialData.document_number || '',
                    phone: initialData.phone || '',
                    address: initialData.address || '',
                    neighborhood: initialData.neighborhood || '',
                    municipality: initialData.municipality || 'Barranquilla',
                    department: initialData.department || 'Atlántico',
                    voting_post: initialData.voting_post || '',
                    voting_table: initialData.voting_table || '',
                    leader_id: initialData.leader_id || '',
                });
            } else {
                // Reset for new entry
                setFormData({
                    first_name: '',
                    last_name: '',
                    document_number: '',
                    phone: '',
                    address: '',
                    neighborhood: '',
                    municipality: 'Barranquilla',
                    department: 'Atlántico',
                    voting_post: '',
                    voting_table: '',
                    leader_id: preSelectedLeaderId || '',
                });
            }
            setErrors({});
        }
    }, [isOpen, initialData, preSelectedLeaderId]);

    const fetchLeaders = async () => {
        const { data } = await supabase.from('leaders').select('id, full_name').order('full_name');
        if (data) setLeaders(data);
    };

    const validate = () => {
        const newErrors: Record<string, string> = {};
        if (!formData.first_name.trim()) newErrors.first_name = 'Nombre requerido';
        if (!formData.document_number.trim()) newErrors.document_number = 'Cédula requerida';
        if (!formData.leader_id) newErrors.leader_id = 'Debe asignar un líder';

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!validate()) return;

        setLoading(true);
        try {
            // Check for duplicate CC if creating new
            if (!initialData) {
                const { data: existing } = await supabase
                    .from('voters')
                    .select('id')
                    .eq('document_number', formData.document_number)
                    .maybeSingle();

                if (existing) {
                    setErrors({ ...errors, document_number: 'Esta cédula ya está registrada.' });
                    setLoading(false);
                    return;
                }
            }

            const payload = { ...formData };

            let error;
            if (initialData) {
                // Update
                const { error: updateError } = await supabase
                    .from('voters')
                    .update(payload)
                    .eq('id', initialData.id); // Assuming initialData has the UUID 'id'
                error = updateError;
            } else {
                // Insert
                const { error: insertError } = await supabase
                    .from('voters')
                    .insert([payload]);
                error = insertError;
            }

            if (error) throw error;

            toast.success(initialData ? 'Votante actualizado' : 'Votante creado exitosamente');
            onSuccess();
            onClose();
        } catch (err: any) {
            console.error(err);
            toast.error(err.message || 'Error guardando votante');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-white dark:bg-slate-900 border border-slate-700 p-6 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative shadow-2xl">
                <button
                    onClick={onClose}
                    className="absolute right-4 top-4 p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
                >
                    <X size={20} />
                </button>

                <h2 className="text-xl font-bold mb-6 border-b pb-2">
                    {initialData ? 'Editar Votante' : 'Nuevo Votante'}
                </h2>

                <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* Sección Líder */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium mb-1">Líder Asignado *</label>
                        <select
                            className={`w-full p-2 rounded border bg-transparent ${errors.leader_id ? 'border-red-500' : 'border-slate-600'}`}
                            value={formData.leader_id}
                            onChange={e => setFormData({...formData, leader_id: e.target.value})}
                            disabled={!!preSelectedLeaderId}
                        >
                            <option value="">-- Seleccionar Líder --</option>
                            {leaders.map(l => (
                                <option key={l.id} value={l.id}>{l.full_name}</option>
                            ))}
                        </select>
                        {errors.leader_id && <p className="text-red-500 text-xs mt-1">{errors.leader_id}</p>}
                    </div>

                    {/* Datos Personales */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Nombres *</label>
                        <input
                            className={`w-full p-2 rounded border bg-transparent ${errors.first_name ? 'border-red-500' : 'border-slate-600'}`}
                            value={formData.first_name}
                            onChange={e => setFormData({...formData, first_name: e.target.value})}
                        />
                        {errors.first_name && <p className="text-red-500 text-xs mt-1">{errors.first_name}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Apellidos</label>
                        <input
                            className="w-full p-2 rounded border border-slate-600 bg-transparent"
                            value={formData.last_name}
                            onChange={e => setFormData({...formData, last_name: e.target.value})}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Cédula *</label>
                        <input
                            className={`w-full p-2 rounded border bg-transparent ${errors.document_number ? 'border-red-500' : 'border-slate-600'}`}
                            value={formData.document_number}
                            onChange={e => setFormData({...formData, document_number: e.target.value.replace(/\D/g, '')})}
                            placeholder="Solo números"
                        />
                        {errors.document_number && <p className="text-red-500 text-xs mt-1">{errors.document_number}</p>}
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Teléfono</label>
                        <input
                            className="w-full p-2 rounded border border-slate-600 bg-transparent"
                            value={formData.phone}
                            onChange={e => setFormData({...formData, phone: e.target.value})}
                        />
                    </div>

                    {/* Residencia */}
                    <div className="md:col-span-2 mt-2">
                        <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Ubicación y Puesto</h3>
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Dirección</label>
                        <input
                            className="w-full p-2 rounded border border-slate-600 bg-transparent"
                            value={formData.address}
                            onChange={e => setFormData({...formData, address: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Barrio</label>
                        <input
                            className="w-full p-2 rounded border border-slate-600 bg-transparent"
                            value={formData.neighborhood}
                            onChange={e => setFormData({...formData, neighborhood: e.target.value})}
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium mb-1">Municipio</label>
                        <input
                            className="w-full p-2 rounded border border-slate-600 bg-transparent"
                            value={formData.municipality}
                            onChange={e => setFormData({...formData, municipality: e.target.value})}
                        />
                    </div>

                    {/* Puesto de Votación */}
                    <div>
                        <label className="block text-sm font-medium mb-1">Puesto de Votación</label>
                        <input
                            className="w-full p-2 rounded border border-slate-600 bg-transparent"
                            value={formData.voting_post}
                            onChange={e => setFormData({...formData, voting_post: e.target.value})}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium mb-1">Mesa</label>
                        <input
                            className="w-full p-2 rounded border border-slate-600 bg-transparent"
                            value={formData.voting_table}
                            onChange={e => setFormData({...formData, voting_table: e.target.value})}
                        />
                    </div>

                    <div className="md:col-span-2 mt-4 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded bg-slate-700 hover:bg-slate-600 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="px-4 py-2 rounded bg-blue-600 hover:bg-blue-500 transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            {loading && <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>}
                            <Save size={18} />
                            {initialData ? 'Guardar Cambios' : 'Registrar Votante'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
