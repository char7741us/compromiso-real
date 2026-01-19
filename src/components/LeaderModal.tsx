import { useState, useEffect } from 'react';
import { X, Save, Upload, AlertCircle, Check } from 'lucide-react';
import type { LeaderFormData, Leader } from '../types/leader.types';
import { validateCedula, validateEmail, validatePhone, validateRequired } from '../utils/validators';

interface LeaderModalProps {
    leader?: Leader | null;
    onClose: () => void;
    onSave: (data: LeaderFormData) => Promise<void>;
}

export default function LeaderModal({ leader, onClose, onSave }: LeaderModalProps) {
    const [formData, setFormData] = useState<LeaderFormData>({
        full_name: '',
        document_number: '',
        phone: '',
        email: '',
        goal: 100,
        active: true,
        zone: '',
        municipality: '',
        neighborhood: '',
        photoFile: null
    });

    const [errors, setErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    useEffect(() => {
        if (leader) {
            setFormData({
                full_name: leader.full_name,
                document_number: leader.document_number || '',
                phone: leader.phone || '',
                email: leader.email || '',
                goal: leader.goal || 100,
                active: leader.active ?? true,
                zone: leader.zone || '',
                municipality: leader.municipality || '',
                neighborhood: leader.neighborhood || '',
                photoFile: null
            });
            if (leader.photo_url) setPreviewUrl(leader.photo_url);
        }
    }, [leader]);

    const validateField = async (name: string, value: any) => {
        let error: string | null = null;
        if (name === 'full_name') error = validateRequired(value, 'Nombre');
        if (name === 'document_number') error = await validateCedula(value, leader?.id);
        if (name === 'email') error = await validateEmail(value, leader?.id);
        if (name === 'phone') error = validatePhone(value);

        setErrors(prev => ({ ...prev, [name]: error || '' }));
    };

    const handleChange = async (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const val = type === 'checkbox' ? (e.target as HTMLInputElement).checked : value;

        setFormData(prev => ({ ...prev, [name]: val }));

        // Debounced validation could be better, but simple async here works for now
        if (touched[name]) {
            await validateField(name, val);
        }
    };

    const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setTouched(prev => ({ ...prev, [name]: true }));
        validateField(name, value);
    };

    const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            setFormData(prev => ({ ...prev, photoFile: file }));
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        // Validate all
        await validateField('full_name', formData.full_name);
        await validateField('document_number', formData.document_number);

        // Check if any errors exist
        const hasErrors = Object.values(errors).some(err => err !== '') ||
            !formData.full_name || !formData.document_number;

        if (!hasErrors) {
            try {
                await onSave(formData);
                onClose();
            } catch (error) {
                console.error(error);
            }
        }
        setIsSubmitting(false);
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white border border-slate-200 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl animate-in fade-in zoom-in duration-300">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-200 bg-slate-50/50">
                    <h2 className="text-2xl font-bold text-slate-800">
                        {leader ? 'Editar Líder' : 'Nuevo Líder'}
                    </h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors" title="Cerrar"><X size={20} className="text-slate-500" /></button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">

                    {/* Top Section: Photo & Basic Info */}
                    <div className="flex flex-col md:flex-row gap-6">
                        {/* Photo Upload */}
                        <div className="flex flex-col items-center gap-3">
                            <div className="w-32 h-32 rounded-full border-2 border-dashed border-slate-300 flex items-center justify-center overflow-hidden bg-slate-100 relative group">
                                {previewUrl ? (
                                    <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                                ) : (
                                    <Upload className="text-slate-400" size={32} />
                                )}
                                <input
                                    type="file"
                                    className="absolute inset-0 opacity-0 cursor-pointer"
                                    accept="image/*"
                                    onChange={handlePhotoChange}
                                    aria-label="Subir foto de perfil"
                                    title="Subir foto de perfil"
                                />
                                <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                                    <span className="text-xs text-white">Cambiar Foto</span>
                                </div>
                            </div>
                            <span className="text-xs text-slate-500">Click para subir foto</span>
                        </div>

                        {/* Basic Fields */}
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <InputField
                                label="Nombre Completo"
                                name="full_name"
                                value={formData.full_name}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                error={errors.full_name}
                                required
                            />
                            <InputField
                                label="Cédula"
                                name="document_number"
                                value={formData.document_number}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                error={errors.document_number}
                                required
                            />
                            <InputField
                                label="Teléfono"
                                name="phone"
                                value={formData.phone}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                error={errors.phone}
                            />
                            <InputField
                                label="Email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                onBlur={handleBlur}
                                error={errors.email}
                            />
                        </div>
                    </div>

                    {/* Location & Meta */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 border-t border-slate-200 pt-6">
                        <InputField label="Zona" name="zone" value={formData.zone} onChange={handleChange} />
                        <InputField label="Municipio" name="municipality" value={formData.municipality} onChange={handleChange} />
                        <InputField label="Barrio" name="neighborhood" value={formData.neighborhood} onChange={handleChange} />
                    </div>

                    <div className="border-t border-slate-200 pt-6">
                        <div className="flex justify-between mb-2">
                            <label className="text-sm font-medium text-slate-700">Meta de Votantes: <span className="text-yellow-600 font-bold">{formData.goal}</span></label>
                        </div>
                        <input
                            type="range"
                            min="10"
                            max="5000"
                            step="10"
                            name="goal"
                            aria-label="Meta de votantes"
                            value={formData.goal}
                            onChange={(e) => setFormData({ ...formData, goal: Number(e.target.value) })}
                            className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-yellow-500"
                        />
                    </div>

                    {/* Active Toggle */}
                    <div className="flex items-center gap-3">
                        <input
                            type="checkbox"
                            id="active"
                            name="active"
                            checked={formData.active}
                            onChange={handleChange}
                            className="w-5 h-5 rounded border-slate-300 text-teal-600 focus:ring-teal-500 bg-slate-100"
                        />
                        <label htmlFor="active" className="text-sm text-slate-700">Líder Activo</label>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex justify-end gap-3 pt-6 border-t border-slate-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting || Object.values(errors).some(e => !!e)}
                            className="px-6 py-2 rounded-lg bg-gradient-to-r from-yellow-600 to-yellow-500 hover:from-yellow-500 hover:to-yellow-400 text-slate-900 font-bold shadow-lg shadow-yellow-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                        >
                            {isSubmitting ? <span className="loader"></span> : <Save size={18} />}
                            Guardar
                        </button>
                    </div>

                </form>
            </div>
        </div>
    );
}

// Helper Component for Inputs
const InputField = ({ label, name, value, onChange, onBlur, error, required = false }: any) => {
    const id = `input-${name}`;
    return (
        <div className="relative">
            <label htmlFor={id} className="block text-xs uppercase tracking-wider text-slate-500 mb-1 font-bold">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <div className="relative">
                <input
                    id={id}
                    name={name}
                    value={value}
                    onChange={onChange}
                    onBlur={onBlur}
                    className={`w-full bg-slate-50 border ${error ? 'border-red-500' : 'border-slate-300 focus:border-yellow-500'} rounded-lg px-3 py-2 text-slate-800 outline-none transition-colors`}
                />
                {error && <AlertCircle className="absolute right-3 top-2.5 text-red-500" size={16} />}
                {!error && value && <Check className="absolute right-3 top-2.5 text-green-500" size={16} />}
            </div>
            {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        </div>
    );
};
