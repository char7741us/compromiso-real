import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../supabase';
import { Search, Filter, Download, ChevronLeft, ChevronRight, Plus, Edit2, Trash2 } from 'lucide-react';
import AdminHeader from '../../components/AdminHeader';
import SkeletonLoader from '../../components/SkeletonLoader';
import { getPagination } from '../../utils/supabaseHelpers';
import toast from 'react-hot-toast';
import VoterFormModal from '../../components/VoterFormModal';

// Debounce helper
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

export default function ConsolidatedViewPage() {
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<any[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(0);
    const pageSize = 20;

    // Filters
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 500);
    const [selectedLeader, setSelectedLeader] = useState('Todos');
    const [leadersList, setLeadersList] = useState<string[]>([]);

    // Actions State
    const [isExporting, setIsExporting] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingVoter, setEditingVoter] = useState<any>(null);

    // Load Leaders for filter
    useEffect(() => {
        const loadLeaders = async () => {
            const { data } = await supabase.from('leaders').select('full_name').order('full_name');
            if (data) {
                setLeadersList(data.map(l => l.full_name));
            }
        };
        loadLeaders();
    }, []);

    // Fetch Voters
    const fetchVoters = useCallback(async () => {
        setIsLoading(true);
        try {
            const { from, to } = getPagination(page, pageSize);

            // Build query
            const selectString = selectedLeader !== 'Todos'
                ? '*, leaders!inner(full_name)'
                : '*, leaders(full_name)';

            let query = supabase
                .from('voters')
                .select(selectString, { count: 'exact' })
                .order('created_at', { ascending: false })
                .range(from, to);

            // Apply Filters
            if (debouncedSearch) {
                query = query.or(`first_name.ilike.%${debouncedSearch}%,last_name.ilike.%${debouncedSearch}%,document_number.ilike.%${debouncedSearch}%`);
            }

            if (selectedLeader !== 'Todos') {
                query = query.eq('leaders.full_name', selectedLeader);
            }

            const { data: result, count, error } = await query;

            if (error) throw error;

            if (result) {
                const formatted = result.map((row: any) => ({
                    ...row,
                    leader_name: row.leaders?.full_name || 'Sin Asignar'
                }));
                setData(formatted);
                setTotalCount(count || 0);
            }
        } catch (err: any) {
            console.error(err);
            toast.error('Error cargando votantes');
        } finally {
            setIsLoading(false);
        }
    }, [page, debouncedSearch, selectedLeader]);

    useEffect(() => {
        fetchVoters();
    }, [fetchVoters]);

    // Reset page when filters change
    useEffect(() => {
        setPage(0);
    }, [debouncedSearch, selectedLeader]);

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro de eliminar este votante? Esta acción no se puede deshacer.')) return;

        try {
            const { error } = await supabase.from('voters').delete().eq('id', id);
            if (error) throw error;
            toast.success('Votante eliminado');
            fetchVoters();
        } catch (e) {
            console.error(e);
            toast.error('Error eliminando votante');
        }
    };

    const handleExportCSV = async () => {
        if (totalCount === 0) return;
        setIsExporting(true);

        try {
            let query = supabase
                .from('voters')
                .select('*, leaders(full_name)');

            if (selectedLeader !== 'Todos') {
                query = supabase.from('voters').select('*, leaders!inner(full_name)').eq('leaders.full_name', selectedLeader);
            }
             if (searchTerm) {
                query = query.or(`first_name.ilike.%${searchTerm}%,last_name.ilike.%${searchTerm}%,document_number.ilike.%${searchTerm}%`);
            }

            const { data: exportData, error } = await query.limit(5000);

            if (error || !exportData) throw new Error('Error fetching data for export');

            const headers = ["Líder", "Nombres", "Apellidos", "Cédula", "Teléfono", "Dirección", "Barrio", "Puesto", "Mesa"];
            const csvContent = [
                headers.join(','),
                ...exportData.map((v: any) => [
                    v.leaders?.full_name || 'Sin Asignar',
                    v.first_name,
                    v.last_name,
                    v.document_number,
                    v.phone || '',
                    v.address || '',
                    v.neighborhood || '',
                    v.voting_post || '',
                    v.voting_table || ''
                ].map(val => `"${val}"`).join(','))
            ].join('\n');

            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement("a");
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `consolidado_votantes_${new Date().toISOString().split('T')[0]}.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success(`Exportados ${exportData.length} registros`);

        } catch (e) {
            console.error(e);
            toast.error('Error exportando datos');
        } finally {
            setIsExporting(false);
        }
    };

    const totalPages = Math.ceil(totalCount / pageSize);

    return (
        <div className="consolidated-page">
            <AdminHeader
                title="Consolidado General"
                description="Vista unificada de todos los votantes registrados."
                actions={
                    <div className="flex gap-2">
                        <button
                            className="btn btn-primary"
                            onClick={() => { setEditingVoter(null); setIsModalOpen(true); }}
                        >
                            <Plus size={18} />
                            Nuevo Votante
                        </button>
                        <button
                            className="btn btn-secondary"
                            onClick={handleExportCSV}
                            disabled={isExporting || totalCount === 0}
                        >
                            <Download size={18} />
                            {isExporting ? '...' : 'CSV'}
                        </button>
                    </div>
                }
            />

            <div className="card mb-4 space-y-4">
                <div className="flex flex-wrap gap-4 items-end">
                    <div className="flex-1 min-w-[300px]">
                        <label className="text-sm font-medium mb-1 block">Buscar Votante</label>
                        <div className="relative">
                            <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                type="text"
                                className="search-input pl-10 w-full"
                                placeholder="Nombre o cédula..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="w-[250px]">
                        <label className="text-sm font-medium mb-1 block">Filtrar por Líder</label>
                        <div className="relative">
                            <Filter size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <select
                                className="search-input pl-10 w-full appearance-none"
                                value={selectedLeader}
                                onChange={(e) => setSelectedLeader(e.target.value)}
                            >
                                <option value="Todos">Todos los líderes</option>
                                {leadersList.map(leader => (
                                    <option key={leader} value={leader}>{leader}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div className="table-container min-h-[400px]">
                {isLoading ? (
                    <div className="p-4">
                        <SkeletonLoader type="table" count={10} />
                    </div>
                ) : (
                    <>
                        <table className="w-full">
                            <thead>
                                <tr>
                                    <th>Nombre Completo</th>
                                    <th>Cédula</th>
                                    <th>Líder Asignado</th>
                                    <th>Municipio</th>
                                    <th>Puesto</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {data.length > 0 ? (
                                    data.map((voter) => (
                                        <tr key={voter.id} className="hover:bg-slate-800/50 transition-colors">
                                            <td className="font-medium">
                                                <div>{voter.first_name} {voter.last_name}</div>
                                            </td>
                                            <td className="text-gray-400">{voter.document_number}</td>
                                            <td>
                                                <span className="badge badge-success">
                                                    {voter.leader_name}
                                                </span>
                                            </td>
                                            <td>{voter.municipality || 'Atlántico'}</td>
                                            <td className="text-sm">{voter.voting_post || 'N/A'}</td>
                                            <td className="flex gap-1">
                                                <button
                                                    className="p-1 hover:bg-slate-700 rounded text-blue-400 transition-colors"
                                                    onClick={() => { setEditingVoter(voter); setIsModalOpen(true); }}
                                                    title="Editar"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    className="p-1 hover:bg-slate-700 rounded text-red-400 transition-colors"
                                                    onClick={() => handleDelete(voter.id)}
                                                    title="Eliminar"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="text-center py-12 text-gray-500">
                                            No se encontraron votantes con los filtros seleccionados.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </>
                )}
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-4 text-sm text-gray-400">
                <div>
                    Mostrando {data.length} de {totalCount} registros
                </div>
                <div className="flex gap-2 items-center">
                    <button
                        className="btn btn-secondary p-2 disabled:opacity-50"
                        disabled={page === 0 || isLoading}
                        onClick={() => setPage(p => Math.max(0, p - 1))}
                    >
                        <ChevronLeft size={16} />
                    </button>
                    <span>Página {page + 1} de {totalPages || 1}</span>
                    <button
                        className="btn btn-secondary p-2 disabled:opacity-50"
                        disabled={page >= totalPages - 1 || isLoading}
                        onClick={() => setPage(p => p + 1)}
                    >
                        <ChevronRight size={16} />
                    </button>
                </div>
            </div>

            <VoterFormModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                initialData={editingVoter}
                onSuccess={() => { fetchVoters(); }}
            />
        </div>
    );
}
