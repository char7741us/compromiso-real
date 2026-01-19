import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useVoters, type VoterData } from '../../context/VoterContext';
import { Search, Save, ExternalLink, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminHeader from '../../components/AdminHeader';
import SkeletonLoader from '../../components/SkeletonLoader';

export default function MissingDataPage() {
    const { updateVoter, fetchVoters } = useVoters();
    const [searchParams] = useSearchParams();

    // Server-side state
    const [voters, setVoters] = useState<VoterData[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(20);
    const [loading, setLoading] = useState(false);

    // Filters
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');

    // Debounce Search
    useEffect(() => {
        const handler = setTimeout(() => {
            setDebouncedSearch(searchTerm);
            setPage(1);
        }, 500);
        return () => clearTimeout(handler);
    }, [searchTerm]);

    // Apply filters from URL
    useEffect(() => {
        const urlFilter = searchParams.get('filter');
        if (urlFilter === 'invalid_cc') {
            setFilter('invalid_cc');
        }
    }, [searchParams]);

    // Fetch Logic
    const loadData = async () => {
        setLoading(true);
        try {
            const filters: any = {};

            if (filter === 'phone') filters['phone'] = null;
            if (filter === 'address') filters['address'] = null;
            if (filter === 'voting_post') filters['voting_post'] = null;
            if (filter === 'invalid_cc') filters['is_invalid_cc'] = true;

            const { data, count } = await fetchVoters({
                page,
                pageSize,
                search: debouncedSearch,
                filters
            });

            setVoters(data);
            setTotalCount(count);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, [page, pageSize, debouncedSearch, filter]);

    const totalPages = Math.ceil(totalCount / pageSize);

    const handleUpdateById = (id: string, field: string, value: any) => {
        const index = voters.findIndex(v => v._id === id);
        if (index === -1) return;

        const newVoters = [...voters];
        newVoters[index] = {
            ...newVoters[index],
            [field]: value
        };
        setVoters(newVoters);
    };

    const handleManualSave = async (voter: VoterData) => {
        try {
            const updates: Partial<VoterData> = {
                'No DE CÉDULA SIN PUNTOS': voter['No DE CÉDULA SIN PUNTOS'] || '',
                'INVALIDA': voter['INVALIDA'] || false,
                'TELÉFONO': voter['TELÉFONO'] || '',
                'DIRECCIÓN DE RESIDENCIA': voter['DIRECCIÓN DE RESIDENCIA'] || '',
                'MUNICIPIO VOTACIÓN': voter['MUNICIPIO VOTACIÓN'] || '',
                'PUESTO DE VOTACIÓN': voter['PUESTO DE VOTACIÓN'] || '',
                'DIRECCIÓN (Pto de votación)': voter['DIRECCIÓN (Pto de votación)'] || '',
                'MESA': voter['MESA'] || ''
            };

            const result = await updateVoter(voter._id, updates);

            if (result.success) {
                toast.success(`Datos de ${voter['NOMBRES']} guardados`);
                loadData();
            } else {
                toast.error(`Error: ${result.error}`);
            }
        } catch (error) {
            toast.error('Error inesperado al guardar');
            console.error(error);
        }
    };

    return (
        <div>
            <AdminHeader
                title="Gestión y Corrección de Datos"
                description={`Total de registros encontrados: ${totalCount}.`}
            >
                <div className="flex-wrap">
                    <a
                        href="https://wsp.registraduria.gov.co/censo/consultar"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn"
                        style={{ backgroundColor: '#004884', color: 'white' }}
                    >
                        <ExternalLink size={18} />
                        Consultar Registraduría
                    </a>
                </div>
            </AdminHeader>

            {/* FILTERS SECTION */}
            <div className="card" style={{ marginBottom: '20px' }}>
                <div className="flex-between flex-wrap">
                    <div style={{ display: 'flex', gap: '15px', flex: 1, minWidth: '300px' }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <input
                                type="text"
                                placeholder="Buscar por nombre o cédula..."
                                className="search-input"
                                style={{ paddingLeft: '40px' }}
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="flex-wrap" style={{ gap: '10px' }}>
                        <button
                            className={`btn ${filter === 'invalid_cc' ? 'btn-danger' : 'btn-outline-danger'}`}
                            onClick={() => { setFilter(filter === 'invalid_cc' ? 'all' : 'invalid_cc'); setPage(1); }}
                            style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '5px' }}
                        >
                            <AlertCircle size={16} /> CC Inválida
                        </button>
                        {['all', 'phone', 'address', 'voting_post'].map(type => (
                            <button
                                key={type}
                                className={`btn ${filter === type ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => { setFilter(type); setPage(1); }}
                                style={{ fontSize: '0.85rem' }}
                            >
                                {type === 'all' ? 'Ver Todos' : type === 'phone' ? 'Sin Tel.' : type === 'address' ? 'Sin Dir.' : 'Sin Puesto'}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* DATA TABLE */}
            <div className="card">
                <div className="table-container">
                    {loading ? (
                         <div style={{ padding: '20px' }}>
                            <SkeletonLoader type="table" count={5} />
                        </div>
                    ) : (
                        <table>
                            <thead>
                                <tr>
                                    <th>Líder / Votante</th>
                                    <th>Residencia y Contacto</th>
                                    <th>Info de Votación (Registraduría)</th>
                                    <th style={{ width: '80px', textAlign: 'center' }}>Acción</th>
                                </tr>
                            </thead>
                            <tbody>
                                {voters.map((v) => (
                                    <tr key={v._id} style={{ backgroundColor: v['INVALIDA'] ? '#fff1f2' : '' }}>
                                        <td>
                                            <div style={{ fontWeight: '600', color: 'var(--primary)', fontSize: '0.9rem' }}>{v['LÍDER'] || 'Sin Asignar'}</div>
                                            <div style={{ marginTop: '5px' }}>
                                                <div style={{ fontWeight: '600', fontSize: '1rem' }}>{v['NOMBRES']} {v['APELLIDOS']}</div>

                                                {/* CC Correction Area */}
                                                <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                    <div style={{ position: 'relative' }}>
                                                        <span style={{ position: 'absolute', left: '8px', top: '50%', transform: 'translateY(-50%)', fontSize: '0.75rem', fontWeight: 'bold', color: 'var(--text-muted)' }}>CC.</span>
                                                        <input
                                                            type="text"
                                                            className="search-input"
                                                            style={{ padding: '4px 8px 4px 28px', fontSize: '0.85rem', width: '100%', fontWeight: '600' }}
                                                            value={v['No DE CÉDULA SIN PUNTOS'] || ''}
                                                            onChange={(e) => handleUpdateById(v._id, 'No DE CÉDULA SIN PUNTOS', e.target.value)}
                                                        />
                                                    </div>
                                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.75rem', cursor: 'pointer', color: v['INVALIDA'] ? 'var(--danger)' : 'var(--text-muted)' }}>
                                                        <input
                                                            type="checkbox"
                                                            style={{ width: '16px', height: '16px' }}
                                                            checked={v['INVALIDA'] || false}
                                                            onChange={(e) => handleUpdateById(v._id, 'INVALIDA', e.target.checked)}
                                                        />
                                                        <strong>Cédula Inválida</strong>
                                                    </label>
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                <div style={{ position: 'relative' }}>
                                                    <input
                                                        type="text"
                                                        placeholder="Teléfono"
                                                        className="search-input"
                                                        style={{ padding: '6px 10px', fontSize: '0.8rem', width: '100%' }}
                                                        value={v['TELÉFONO'] || ''}
                                                        onChange={(e) => handleUpdateById(v._id, 'TELÉFONO', e.target.value)}
                                                    />
                                                </div>
                                                <div style={{ position: 'relative' }}>
                                                    <input
                                                        type="text"
                                                        placeholder="Dirección Residencia"
                                                        className="search-input"
                                                        style={{ padding: '6px 10px', fontSize: '0.8rem', width: '100%' }}
                                                        value={v['DIRECCIÓN DE RESIDENCIA'] || ''}
                                                        onChange={(e) => handleUpdateById(v._id, 'DIRECCIÓN DE RESIDENCIA', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
                                                    <input
                                                        type="text"
                                                        placeholder="Municipio"
                                                        className="search-input"
                                                        style={{ padding: '6px', fontSize: '0.8rem' }}
                                                        value={v['MUNICIPIO VOTACIÓN'] || ''}
                                                        onChange={(e) => handleUpdateById(v._id, 'MUNICIPIO VOTACIÓN', e.target.value)}
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder="Puesto de Votación"
                                                        className="search-input"
                                                        style={{ padding: '6px', fontSize: '0.8rem' }}
                                                        value={v['PUESTO DE VOTACIÓN'] || ''}
                                                        onChange={(e) => handleUpdateById(v._id, 'PUESTO DE VOTACIÓN', e.target.value)}
                                                    />
                                                </div>
                                                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '5px' }}>
                                                    <input
                                                        type="text"
                                                        placeholder="Dirección Puesto"
                                                        className="search-input"
                                                        style={{ padding: '6px', fontSize: '0.8rem' }}
                                                        value={v['DIRECCIÓN (Pto de votación)'] || ''}
                                                        onChange={(e) => handleUpdateById(v._id, 'DIRECCIÓN (Pto de votación)', e.target.value)}
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder="Mesa"
                                                        className="search-input"
                                                        style={{ padding: '6px', fontSize: '0.8rem' }}
                                                        value={v['MESA'] || ''}
                                                        onChange={(e) => handleUpdateById(v._id, 'MESA', e.target.value)}
                                                    />
                                                </div>
                                            </div>
                                        </td>
                                        <td style={{ verticalAlign: 'middle', textAlign: 'center' }}>
                                            <button
                                                className="btn btn-primary"
                                                style={{ width: '100%', padding: '10px 5px', display: 'flex', justifyContent: 'center' }}
                                                onClick={() => handleManualSave(v)}
                                                title="Guardar Cambios"
                                            >
                                                <Save size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>

                {voters.length === 0 && !loading && (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        No se encontraron registros que coincidan con la búsqueda.
                    </div>
                )}

                {/* PAGINATION CONTROLS */}
                {totalCount > 0 && (
                    <div className="flex items-center justify-between mt-4 px-4 py-2">
                        <div className="text-sm text-gray-500">
                            Mostrando {((page - 1) * pageSize) + 1} a {Math.min(page * pageSize, totalCount)} de {totalCount} registros
                        </div>
                        <div className="flex gap-2">
                            <button
                                className="btn btn-secondary p-2"
                                onClick={() => setPage(p => Math.max(1, p - 1))}
                                disabled={page === 1 || loading}
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <span className="flex items-center px-2">
                                Página {page} de {totalPages}
                            </span>
                            <button
                                className="btn btn-secondary p-2"
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages || loading}
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
