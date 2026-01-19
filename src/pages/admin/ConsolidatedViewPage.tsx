import { useState, useEffect } from 'react';
import { useVoters, type VoterData } from '../../context/VoterContext';
import { Search, FileSpreadsheet, Loader2, ChevronLeft, ChevronRight } from 'lucide-react';
import AdminHeader from '../../components/AdminHeader';
import SkeletonLoader from '../../components/SkeletonLoader';
import toast from 'react-hot-toast';
import { supabase } from '../../supabase';

export default function ConsolidatedViewPage() {
    const { fetchVoters, isLoading } = useVoters();
    const [votersList, setVotersList] = useState<VoterData[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(20);
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);

    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setPage(1);
        }, 500);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    useEffect(() => {
        const loadData = async () => {
            const { data, count } = await fetchVoters({
                page,
                pageSize,
                search: debouncedSearch
            });
            setVotersList(data);
            setTotalCount(count);
        };
        loadData();
    }, [page, pageSize, debouncedSearch]);

    const totalPages = Math.ceil(totalCount / pageSize);

    const handleDownloadAll = async () => {
        setIsGenerating(true);
        const toastId = toast.loading('Generando CSV completo...');
        try {
            const { data, error } = await supabase.from('voters').select(`
                *,
                leaders (full_name)
            `).csv();

            if (error) throw error;

            const blob = new Blob([data], { type: 'text/csv;charset=utf-8;' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `Votantes_Consolidado_${new Date().toISOString().split('T')[0]}.csv`;
            link.click();
            toast.success('Descarga iniciada', { id: toastId });
        } catch (error) {
            console.error(error);
            toast.error('Error al descargar', { id: toastId });
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="consolidated-page">
            <AdminHeader
                title="Consolidado General"
                description="Vista unificada de todos los votantes registrados."
                actions={
                    <div className="flex gap-2">
                        <button
                            className="btn btn-success flex items-center gap-2"
                            onClick={handleDownloadAll}
                            disabled={isGenerating}
                            style={{ backgroundColor: '#217346', color: 'white', border: 'none' }}
                        >
                            {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <FileSpreadsheet size={18} />}
                            Descargar CSV Completo
                        </button>
                    </div>
                }
            />

            <div className="card mb-2">
                <div className="flex-wrap items-end" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                    <div className="flex-1 min-w-300">
                        <label className="section-title block mb-1 text-sm">
                            Buscar Votante
                        </label>
                        <div className="relative">
                            <Search size={20} className="search-icon-absolute" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
                            <input
                                type="text"
                                className="search-input pl-11"
                                style={{ paddingLeft: '2.5rem', width: '100%', padding: '0.5rem 0.5rem 0.5rem 2.5rem', borderRadius: '6px', border: '1px solid #ddd' }}
                                placeholder="Nombre o cédula..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="table-container">
                {isLoading ? (
                    <div className="container-padding">
                        <SkeletonLoader type="table" count={10} />
                    </div>
                ) : (
                    <>
                        <table>
                            <thead>
                                <tr>
                                    <th>Nombre Completo</th>
                                    <th>Cédula</th>
                                    <th>Líder Asignado</th>
                                    <th>Municipio</th>
                                    <th>Puesto</th>
                                    <th>Mesa</th>
                                </tr>
                            </thead>
                            <tbody>
                                {votersList.length > 0 ? (
                                    votersList.map((voter) => (
                                        <tr key={voter._id}>
                                            <td className="font-600">{voter.first_name || ''} {voter.last_name || ''}</td>
                                            <td className="text-muted">{voter.document_number}</td>
                                            <td>
                                                <span className="badge badge-success">
                                                    {voter.leader_name}
                                                </span>
                                            </td>
                                            <td>{voter.municipality || 'Atlántico'}</td>
                                            <td className="text-sm">{voter.voting_post || 'N/A'}</td>
                                            <td>
                                                <span className="badge badge-subtle">
                                                    {voter.voting_table || '-'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="text-center padding-3rem text-muted">
                                            No se encontraron votantes.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        {totalCount > 0 && (
                            <div className="flex items-center justify-between mt-4 px-2">
                                <div className="text-sm text-gray-500">
                                    Mostrando {((page - 1) * pageSize) + 1} a {Math.min(page * pageSize, totalCount)} de {totalCount} registros
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        className="btn btn-secondary p-2"
                                        onClick={() => setPage(p => Math.max(1, p - 1))}
                                        disabled={page === 1 || isLoading}
                                    >
                                        <ChevronLeft size={16} />
                                    </button>
                                    <span className="flex items-center px-2">
                                        Página {page} de {totalPages}
                                    </span>
                                    <button
                                        className="btn btn-secondary p-2"
                                        onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                        disabled={page === totalPages || isLoading}
                                    >
                                        <ChevronRight size={16} />
                                    </button>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
