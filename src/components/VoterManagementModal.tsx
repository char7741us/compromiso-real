import { useState, useEffect } from 'react';
import { X, Search, UserPlus, Download, Trash2 } from 'lucide-react';
import type { Leader, Voter } from '../types/leader.types';
import { leaderService } from '../services/leaderService';
import toast from 'react-hot-toast';
import ExcelImportModal from './ExcelImportModal';

interface VoterManagementModalProps {
    leader: Leader;
    onClose: () => void;
}

export default function VoterManagementModal({ leader, onClose }: VoterManagementModalProps) {
    const [voters, setVoters] = useState<Voter[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [showImport, setShowImport] = useState(false);
    const [isAdding, setIsAdding] = useState(false);

    // Quick Add Form State
    const [newVoter, setNewVoter] = useState({
        first_name: '',
        last_name: '',
        document_number: '',
        phone: '',
        address: '',
        voting_post: '',
        voting_table: '',
        neighborhood: ''
    });

    const fetchVoters = async () => {
        setIsLoading(true);
        try {
            const data = await leaderService.getVotersByLeader(leader.id);
            setVoters(data);
        } catch (error) {
            toast.error('Error cargando votantes');
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchVoters();
    }, [leader.id]);

    const handleAddVoter = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            await leaderService.addVoterToLeader(leader.id, newVoter);
            toast.success('Votante agregado');
            setNewVoter({ first_name: '', last_name: '', document_number: '', phone: '', address: '', voting_post: '', voting_table: '', neighborhood: '' });
            setIsAdding(false);
            fetchVoters();
        } catch (error) {
            toast.error('Error guardando votante');
        }
    };

    const handleDeleteVoter = async (id: string) => {
        if (!confirm('¿Eliminar votante de este líder?')) return;
        try {
            await leaderService.removeVoterFromLeader(id);
            toast.success('Votante eliminado');
            fetchVoters();
        } catch (error) {
            toast.error('Error eliminando');
        }
    };

    const filteredVoters = voters.filter(v =>
        v.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        v.document_number.includes(searchTerm)
    );

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white border border-slate-200 rounded-xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-200 bg-slate-50/50">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <span className="text-teal-600">{leader.full_name}</span>
                            <span className="text-sm font-normal text-slate-500 bg-slate-100 px-2 py-1 rounded-full border border-slate-200">
                                {voters.length} Votantes
                            </span>
                        </h2>
                        <div className="mt-2 w-full max-w-md bg-slate-200 h-2 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-teal-500"
                                style={{ width: `${Math.min((voters.length / (leader.goal || 1)) * 100, 100)}%` }}
                            ></div>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full" title="Cerrar"><X className="text-slate-500" /></button>
                </div>

                {/* Toolbar */}
                <div className="p-4 border-b border-slate-200 flex flex-wrap gap-4 items-center justify-between">
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-2.5 text-slate-400" size={16} />
                        <input
                            placeholder="Buscar votante..."
                            className="bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-4 py-2 text-sm w-full text-slate-800 focus:border-teal-500 outline-none placeholder:text-slate-400"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setIsAdding(!isAdding)}
                            className="btn btn-secondary bg-white border-slate-200 text-slate-700 hover:bg-slate-50 text-sm flex items-center gap-2"
                        >
                            <UserPlus size={16} /> {isAdding ? 'Cancelar' : 'Agregar Manual'}
                        </button>
                        <button
                            onClick={() => setShowImport(true)}
                            className="btn btn-secondary text-sm flex items-center gap-2 text-green-700 border-green-200 hover:bg-green-50 bg-white"
                        >
                            <Download size={16} /> Importar Excel
                        </button>
                    </div>
                </div>

                {/* Manual Add Form - Expandable */}
                {isAdding && (
                    <form onSubmit={handleAddVoter} className="p-4 bg-slate-50 border-b border-slate-200 animate-in slide-in-from-top-2">
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                            <input required placeholder="Nombre *" className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 outline-none focus:border-teal-500 text-sm h-10" value={newVoter.first_name} onChange={e => setNewVoter({ ...newVoter, first_name: e.target.value })} title="Nombre" />
                            <input required placeholder="Apellidos *" className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 outline-none focus:border-teal-500 text-sm h-10" value={newVoter.last_name} onChange={e => setNewVoter({ ...newVoter, last_name: e.target.value })} title="Apellidos" />
                            <input required placeholder="Cédula *" className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 outline-none focus:border-teal-500 text-sm h-10" value={newVoter.document_number} onChange={e => setNewVoter({ ...newVoter, document_number: e.target.value })} title="Cédula" />
                            <input placeholder="Teléfono" className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 outline-none focus:border-teal-500 text-sm h-10" value={newVoter.phone} onChange={e => setNewVoter({ ...newVoter, phone: e.target.value })} title="Teléfono" />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                            <input placeholder="Dirección" className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 outline-none focus:border-teal-500 text-sm h-10" value={newVoter.address} onChange={e => setNewVoter({ ...newVoter, address: e.target.value })} title="Dirección" />
                            <input placeholder="Barrio" className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 outline-none focus:border-teal-500 text-sm h-10" value={newVoter.neighborhood} onChange={e => setNewVoter({ ...newVoter, neighborhood: e.target.value })} title="Barrio" />
                            <input placeholder="Puesto de Votación" className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 outline-none focus:border-teal-500 text-sm h-10" value={newVoter.voting_post} onChange={e => setNewVoter({ ...newVoter, voting_post: e.target.value })} title="Puesto de Votación" />
                            <input placeholder="Mesa" className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-800 outline-none focus:border-teal-500 text-sm h-10" value={newVoter.voting_table} onChange={e => setNewVoter({ ...newVoter, voting_table: e.target.value })} title="Mesa" />
                        </div>
                        <div className="flex justify-end">
                            <button type="submit" className="bg-teal-600 hover:bg-teal-500 text-white rounded-lg font-bold px-6 py-2">Guardar Votante</button>
                        </div>
                    </form>
                )}

                {/* Voters List */}
                <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
                    {isLoading ? (
                        <div className="text-center py-10 text-slate-500">Cargando votantes...</div>
                    ) : filteredVoters.length === 0 ? (
                        <div className="text-center py-10 text-slate-500 italic">No hay votantes registrados.</div>
                    ) : (
                        <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm text-left whitespace-nowrap">
                                    <thead className="text-xs uppercase bg-slate-50 text-slate-500 border-b border-slate-200">
                                        <tr>
                                            <th className="px-4 py-3 font-semibold">Nombre</th>
                                            <th className="px-4 py-3 font-semibold">Cédula</th>
                                            <th className="px-4 py-3 font-semibold">Teléfono</th>
                                            <th className="px-4 py-3 text-right font-semibold">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {filteredVoters.map(voter => (
                                            <tr key={voter.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="px-4 py-3 font-medium text-slate-700">{voter.first_name} {voter.last_name}</td>
                                                <td className="px-4 py-3 text-slate-500 font-mono text-xs">{voter.document_number}</td>
                                                <td className="px-4 py-3 text-slate-500">{voter.phone || '-'}</td>
                                                <td className="px-4 py-3 text-right">
                                                    <button
                                                        onClick={() => handleDeleteVoter(voter.id)}
                                                        className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-full transition-all"
                                                        title="Eliminar votante"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {showImport && (
                <ExcelImportModal
                    type="voters"
                    leaderId={leader.id}
                    onClose={() => setShowImport(false)}
                    onSuccess={() => {
                        setShowImport(false);
                        fetchVoters();
                    }}
                />
            )}
        </div>
    );
}
