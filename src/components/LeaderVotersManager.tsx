import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabase';
import { X, UserPlus, Save, Loader2, UserMinus } from 'lucide-react';
import toast from 'react-hot-toast';
import { useVoters } from '../context/VoterContext';

interface LeaderVotersManagerProps {
    leaderId: string;
    leaderName: string;
    isOpen: boolean;
    onClose: () => void;
}

interface Voter {
    id: string;
    first_name: string;
    last_name: string;
    document_number: string;
    phone: string;
}

export default function LeaderVotersManager({ leaderId, leaderName, isOpen, onClose }: LeaderVotersManagerProps) {
    const { refreshVoters } = useVoters();
    const [voters, setVoters] = useState<Voter[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [isAdding, setIsAdding] = useState(false);

    const [newVoter, setNewVoter] = useState({
        first_name: '',
        last_name: '',
        document_number: '',
        phone: ''
    });

    const fetchVoters = useCallback(async () => {
        if (!leaderId) return;
        setIsLoading(true);
        const { data, error } = await supabase
            .from('voters')
            .select('id, first_name, last_name, document_number, phone')
            .eq('leader_id', leaderId)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching voters:', error);
            toast.error('Error cargando votantes');
        } else {
            setVoters(data || []);
        }
        setIsLoading(false);
    }, [leaderId]);

    useEffect(() => {
        if (isOpen) {
            fetchVoters();
            setNewVoter({ first_name: '', last_name: '', document_number: '', phone: '' });
        }
    }, [isOpen, fetchVoters]);

    const handleAdd = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newVoter.document_number || !newVoter.first_name) {
            toast.error('Nombre y Cédula son obligatorios');
            return;
        }

        setIsAdding(true);
        try {
            // Check if voter exists
            const { data: existing } = await supabase
                .from('voters')
                .select('id')
                .eq('document_number', newVoter.document_number)
                .maybeSingle();

            if (existing) {
                 const { error } = await supabase.from('voters').upsert({
                    ...newVoter,
                    leader_id: leaderId
                }, { onConflict: 'document_number' });
                 if (error) throw error;
                 toast.success('Votante reasignado correctamente');
            } else {
                const { error } = await supabase.from('voters').insert([{
                    ...newVoter,
                    leader_id: leaderId
                }]);
                if (error) throw error;
                toast.success('Votante creado y asignado');
            }

            setNewVoter({ first_name: '', last_name: '', document_number: '', phone: '' });
            fetchVoters();
            refreshVoters(); // Update global context
        } catch (error) {
            console.error(error);
            toast.error('Error al guardar: ' + (error as Error).message);
        } finally {
            setIsAdding(false);
        }
    };

    const handleRemove = async (voterId: string) => {
        if(!confirm('¿Desvincular este votante del líder?')) return;

        try {
            const { error } = await supabase
                .from('voters')
                .update({ leader_id: null })
                .eq('id', voterId);

            if (error) throw error;

            toast.success('Votante desvinculado');
            fetchVoters();
            refreshVoters();
        } catch (error) {
            console.error(error);
            toast.error('Error: ' + (error as Error).message);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-slate-900 border border-slate-700 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                {/* Header */}
                <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-800/50">
                    <div>
                        <h2 className="text-xl font-bold text-white flex items-center gap-2">
                             <UserPlus className="text-primary" size={24} />
                             Gestión de Estructura
                        </h2>
                        <p className="text-slate-400 mt-1">
                            Líder: <span className="text-primary font-semibold">{leaderName}</span>
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right hidden sm:block">
                            <div className="text-2xl font-bold text-white">{voters.length}</div>
                            <div className="text-xs text-slate-400 uppercase tracking-wider">Votantes</div>
                        </div>
                        <button onClick={onClose} className="text-slate-400 hover:text-white p-2 hover:bg-slate-700 rounded-full transition-colors">
                            <X size={24} />
                        </button>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">

                    {/* Add Form */}
                    <div className="bg-slate-800/30 p-4 rounded-lg border border-slate-700/50">
                        <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wide flex items-center gap-2">
                            <UserPlus size={16} /> Agregar Nuevo Votante
                        </h3>
                        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <input
                                placeholder="Nombres"
                                className="login-input"
                                value={newVoter.first_name}
                                onChange={e => setNewVoter({...newVoter, first_name: e.target.value})}
                                required
                            />
                            <input
                                placeholder="Apellidos"
                                className="login-input"
                                value={newVoter.last_name}
                                onChange={e => setNewVoter({...newVoter, last_name: e.target.value})}
                            />
                            <input
                                placeholder="Cédula"
                                className="login-input"
                                value={newVoter.document_number}
                                onChange={e => setNewVoter({...newVoter, document_number: e.target.value})}
                                required
                            />
                            <input
                                placeholder="Teléfono"
                                className="login-input"
                                value={newVoter.phone}
                                onChange={e => setNewVoter({...newVoter, phone: e.target.value})}
                            />
                            <button
                                type="submit"
                                disabled={isAdding}
                                className="btn btn-primary md:col-span-2 flex justify-center items-center gap-2 mt-2"
                            >
                                {isAdding ? <Loader2 className="animate-spin" /> : <Save size={18} />}
                                Asignar Votante
                            </button>
                        </form>
                    </div>

                    {/* Voters List */}
                    <div>
                        <h3 className="text-sm font-semibold text-slate-300 mb-3 uppercase tracking-wide">
                            Listado Actual
                        </h3>
                        {isLoading ? (
                             <div className="text-center py-8 text-slate-500">Cargando votantes...</div>
                        ) : voters.length === 0 ? (
                            <div className="text-center py-8 text-slate-500 bg-slate-800/20 rounded-lg border border-dashed border-slate-700">
                                No hay votantes asignados a este líder aún.
                            </div>
                        ) : (
                            <div className="overflow-x-auto rounded-lg border border-slate-700">
                                <table className="w-full text-sm text-left">
                                    <thead className="text-xs text-slate-400 uppercase bg-slate-800">
                                        <tr>
                                            <th className="px-4 py-3">Nombre</th>
                                            <th className="px-4 py-3">Cédula</th>
                                            <th className="px-4 py-3">Teléfono</th>
                                            <th className="px-4 py-3 text-right">Acción</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-700">
                                        {voters.map(voter => (
                                            <tr key={voter.id} className="hover:bg-slate-800/50">
                                                <td className="px-4 py-3 font-medium text-white">
                                                    {voter.first_name} {voter.last_name}
                                                </td>
                                                <td className="px-4 py-3 text-slate-300">{voter.document_number}</td>
                                                <td className="px-4 py-3 text-slate-400">{voter.phone || '-'}</td>
                                                <td className="px-4 py-3 text-right">
                                                    <button
                                                        onClick={() => handleRemove(voter.id)}
                                                        className="text-red-400 hover:text-red-300 hover:bg-red-900/20 p-1 rounded transition-colors"
                                                        title="Desvincular"
                                                    >
                                                        <UserMinus size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
