import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useVoters } from '../../context/VoterContext';
import type { Voter } from '../../types';
import { Search, Save, ExternalLink, Filter, AlertCircle, ChevronDown, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import AdminHeader from '../../components/AdminHeader';
import SkeletonLoader from '../../components/SkeletonLoader';
import { generateInvalidCCReport } from '../../utils/reportUtils';

export default function MissingDataPage() {
    const { voters, setVoters, updateVoter, isLoading } = useVoters();
    const [searchParams] = useSearchParams();
    const [filter, setFilter] = useState(searchParams.get('filter') === 'invalid_cc' ? 'invalid_cc' : 'all');
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLeader, setSelectedLeader] = useState('all');
    const [visibleCount, setVisibleCount] = useState(50);

    if (isLoading) {
        return (
            <div style={{ padding: '20px' }}>
                <SkeletonLoader type="text" count={2} />
                <SkeletonLoader type="table" count={10} />
            </div>
        );
    }

    // Filter and Search logic
    const filteredVoters = voters.filter(v => {
        // Leader Filter
        if (selectedLeader !== 'all' && v['LÍDER'] !== selectedLeader) return false;

        // Custom Data Filters
        if (filter === 'phone' && v['TELÉFONO']?.trim()) return false;
        if (filter === 'address' && v['DIRECCIÓN DE RESIDENCIA']?.trim()) return false;
        if (filter === 'voting_post' && (v['PUESTO DE VOTACIÓN']?.trim() && v['MESA']?.trim())) return false;
        if (filter === 'invalid_cc' && !v['INVALIDA']) return false;

        // Search Bar
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            const fullName = `${v['NOMBRES'] || ''} ${v['APELLIDOS'] || ''}`.toLowerCase();
            const cedula = v['No DE CÉDULA SIN PUNTOS']?.toLowerCase() || '';
            return fullName.includes(searchLower) || cedula.includes(searchLower);
        }

        return true;
    });

    const activeLeaders = Array.from(new Set(voters.map(v => v['LÍDER']))).filter(Boolean).sort();

    const handleUpdateById = (id: string, field: string, value: string | boolean) => {
        const index = voters.findIndex(v => v._id === id);
        if (index === -1) return;

        const newVoters = [...voters];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (newVoters[index] as any)[field] = value;
        setVoters(newVoters);
    };

    const handleManualSave = async (voter: Voter) => {
        try {
            const updates: Partial<Voter> = {
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

    // Pagination logic
    const handleLoadMore = () => {
        setVisibleCount(prev => prev + 50);
    };

    const visibleVoters = filteredVoters.slice(0, visibleCount);

    return (
        <div>
            <AdminHeader
                title="Gestión y Corrección de Datos"
                description={`Total de registros: ${voters.length}. Gestiona y corrige la información de todos los votantes.`}
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
                        onClick={() => {
                            console.log('Botón clickeado. Total de votantes:', voters.length);
                            const result = generateInvalidCCReport(voters);
                            console.log('Resultado de generación:', result);
                            if (!result.success) {
                                toast.error(result.message || 'Error al generar el PDF');
                            } else {
                                toast.success('Informe PDF generado correctamente');
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
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setSelectedLeader(val);
                                    setVisibleCount(val !== 'all' ? 10000 : 50);
                                }}
                            >
                                <option value="all">Todos los Líderes</option>
                                {activeLeaders.map((leader) => (
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
                <div className="table-container">
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
                            {visibleVoters.map((v) => (
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
                </div>

                {filteredVoters.length === 0 && !isLoading && (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                        No se encontraron registros que coincidan con la búsqueda.
                    </div>
                )}

                {/* LOAD MORE BUTTON */}
                {filteredVoters.length > visibleCount && (
                    <div style={{ textAlign: 'center', padding: '20px', borderTop: '1px solid var(--border-color)' }}>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '10px' }}>
                            Mostrando {visibleCount} de {filteredVoters.length} registros
                        </p>
                        <button
                            className="btn btn-secondary"
                            onClick={handleLoadMore}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}
                        >
                            <ChevronDown size={20} />
                            Cargar más resultados
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
