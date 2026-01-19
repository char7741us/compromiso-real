import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useVoters, type VoterData } from '../../context/VoterContext';
import { Search, Save, ExternalLink, Filter, AlertCircle, ChevronLeft, ChevronRight, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminHeader from '../../components/AdminHeader';
import SkeletonLoader from '../../components/SkeletonLoader';
import { generateInvalidCCReport } from '../../utils/reportUtils';
import { supabase } from '../../supabase';
import { getPagination } from '../../utils/supabaseHelpers';

// Debounce helper
function useDebounce<T>(value: T, delay: number): T {
    const [debouncedValue, setDebouncedValue] = useState<T>(value);
    useEffect(() => {
        const handler = setTimeout(() => setDebouncedValue(value), delay);
        return () => clearTimeout(handler);
    }, [value, delay]);
    return debouncedValue;
}

export default function MissingDataPage() {
    const { updateVoter } = useVoters();
    const [searchParams] = useSearchParams();

    // State
    const [isLoading, setIsLoading] = useState(true);
    const [data, setData] = useState<VoterData[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(0);
    const pageSize = 20;

    // Filters
    const [filter, setFilter] = useState('all');
    const [searchTerm, setSearchTerm] = useState('');
    const debouncedSearch = useDebounce(searchTerm, 500);
    const [selectedLeader, setSelectedLeader] = useState('Todos');
    const [leadersList, setLeadersList] = useState<string[]>([]);

    // Check for URL params
    useEffect(() => {
        const urlFilter = searchParams.get('filter');
        if (urlFilter === 'invalid_cc') {
            setFilter('invalid_cc');
        }
    }, [searchParams]);

    // Load Leaders
    useEffect(() => {
        const loadLeaders = async () => {
            const { data } = await supabase.from('leaders').select('full_name').order('full_name');
            if (data) {
                setLeadersList(data.map(l => l.full_name));
            }
        };
        loadLeaders();
    }, []);

    // Fetch Logic
    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const { from, to } = getPagination(page, pageSize);

            // Base Query
            const selectString = selectedLeader !== 'Todos'
                ? '*, leaders!inner(full_name)'
                : '*, leaders(full_name)';

            let query = supabase
                .from('voters')
                .select(selectString, { count: 'exact' })
                .range(from, to);

            // Apply Filters
            if (selectedLeader !== 'Todos') {
                query = query.eq('leaders.full_name', selectedLeader);
            }

            if (debouncedSearch) {
                 query = query.or(`first_name.ilike.%${debouncedSearch}%,last_name.ilike.%${debouncedSearch}%,document_number.ilike.%${debouncedSearch}%`);
            }

            // Status Filters
            if (filter === 'invalid_cc') {
                query = query.eq('is_invalid_cc', true);
            } else if (filter === 'phone') {
                query = query.or('phone.is.null,phone.eq.""');
            } else if (filter === 'address') {
                query = query.or('address.is.null,address.eq.""');
            } else if (filter === 'voting_post') {
                query = query.or('voting_post.is.null,voting_post.eq.""');
            }

            const { data: result, count, error } = await query;
            if (error) throw error;

            if (result) {
                // Map to compatible structure
                 const formatted = result.map((row: any) => ({
                    ...row,
                    'LÍDER': row.leaders?.full_name || 'Sin Asignar', // For compatibility with existing UI code if needed
                    'NOMBRES': row.first_name,
                    'APELLIDOS': row.last_name,
                    'No DE CÉDULA SIN PUNTOS': row.document_number,
                    'TELÉFONO': row.phone,
                    'DIRECCIÓN DE RESIDENCIA': row.address,
                    'INVALIDA': row.is_invalid_cc,
                    'MUNICIPIO VOTACIÓN': row.voting_municipality,
                    'PUESTO DE VOTACIÓN': row.voting_post,
                    'DIRECCIÓN (Pto de votación)': row.voting_post_address,
                    'MESA': row.voting_table,
                    _id: row.id
                }));
                setData(formatted);
                setTotalCount(count || 0);
            }

        } catch (err: any) {
            console.error(err);
            toast.error('Error cargando datos');
        } finally {
            setIsLoading(false);
        }
    }, [page, debouncedSearch, selectedLeader, filter]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Reset page on filter change
    useEffect(() => {
        setPage(0);
    }, [debouncedSearch, selectedLeader, filter]);


    const handleUpdateById = (id: string, field: string, value: any) => {
        const index = data.findIndex(v => v._id === id);
        if (index === -1) return;

        const newData = [...data];
        newData[index] = {
            ...newData[index],
            [field]: value
        };
        setData(newData);
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
            } else {
                toast.error(`Error: ${result.error}`);
            }
        } catch (error) {
            toast.error('Error inesperado al guardar');
            console.error(error);
        }
    };

    const totalPages = Math.ceil(totalCount / pageSize);

    return (
        <div>
            <AdminHeader
                title="Gestión y Corrección de Datos"
                description={`Total de registros encontrados: ${totalCount}. Gestiona y corrige la información.`}
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
                    <button
                        className="btn"
                        style={{ backgroundColor: '#dc2626', color: 'white', display: 'flex', alignItems: 'center', gap: '8px' }}
                        onClick={async () => {
                            // Fetch all invalid CCs for report?
                            // Warning: client side generation needs all data.
                            // We can fetch them now on demand.
                            toast.loading('Generando reporte...');
                            const { data: allInvalid } = await supabase.from('voters').select('*, leaders(full_name)').eq('is_invalid_cc', true);
                            if (allInvalid) {
                                const formattedForReport = allInvalid.map((row:any) => ({
                                    ...row,
                                    'LÍDER': row.leaders?.full_name,
                                    'NOMBRES': row.first_name,
                                    'APELLIDOS': row.last_name,
                                    'No DE CÉDULA SIN PUNTOS': row.document_number,
                                    'INVALIDA': true
                                }));
                                const result = generateInvalidCCReport(formattedForReport);
                                toast.dismiss();
                                if (!result.success) toast.error('Error generando reporte');
                                else toast.success('Reporte generado');
                            }
                        }}
                    >
                        <FileText size={18} />
                        Descargar Informe de Cédulas Erróneas
                    </button>
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

                        <div style={{ position: 'relative', width: '220px' }}>
                            <Filter size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                            <select
                                className="search-input"
                                style={{ paddingLeft: '40px', appearance: 'none' }}
                                value={selectedLeader}
                                onChange={(e) => setSelectedLeader(e.target.value)}
                            >
                                <option value="Todos">Todos los Líderes</option>
                                {leadersList.map((leader: any) => (
                                    <option key={leader} value={leader}>{leader}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex-wrap" style={{ gap: '10px' }}>
                        <button
                            className={`btn ${filter === 'invalid_cc' ? 'btn-danger' : 'btn-outline-danger'}`}
                            onClick={() => setFilter(filter === 'invalid_cc' ? 'all' : 'invalid_cc')}
                            style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '5px' }}
                        >
                            <AlertCircle size={16} /> CC Inválida
                        </button>
                        {['all', 'phone', 'address', 'voting_post'].map(type => (
                            <button
                                key={type}
                                className={`btn ${filter === type ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setFilter(type)}
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
                {isLoading ? (
                    <div className="p-4">
                        <SkeletonLoader type="table" count={5} />
                    </div>
                ) : (
                    <div className="table-container min-h-[400px]">
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
                                {data.length > 0 ? (
                                    data.map((v) => (
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
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={4} className="text-center py-12 text-gray-500">
                                            No se encontraron votantes con los filtros seleccionados.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}

                {/* Pagination */}
                <div className="flex justify-between items-center mt-4 text-sm text-gray-400 p-4 border-t border-slate-700">
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
            </div>
        </div>
    );
}
