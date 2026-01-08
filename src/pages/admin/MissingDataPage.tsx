import { useState, useEffect } from 'react';
import { useVoters, type VoterData } from '../../context/VoterContext';
import { Search, CheckCircle, Save, ExternalLink, Filter } from 'lucide-react';
import AdminHeader from '../../components/AdminHeader';
import SkeletonLoader from '../../components/SkeletonLoader';

interface ExtendedVoter extends VoterData {
    _originalIndex: number;
    _missingFields: string[];
}

export default function MissingDataPage() {
    const { voters, setVoters, updateVoter, isLoading } = useVoters();
    const [filter, setFilter] = useState('all'); // all, phone, address, voting_post
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLeader, setSelectedLeader] = useState('all');
    const [showSuccess, setShowSuccess] = useState(false);

    // Whitelist to keep rows visible even after they are fixed, until manual refresh
    const [visibleIds, setVisibleIds] = useState<Set<string>>(new Set());
    const [isInitialized, setIsInitialized] = useState(false);

    // Initialize visible IDs once data is loaded
    useEffect(() => {
        if (!isLoading && voters.length > 0 && !isInitialized) {
            const initialMissing = voters.filter(v => {
                const missing = [];
                if (!v['TELÉFONO']?.trim()) missing.push('Teléfono');
                if (!v['DIRECCIÓN DE RESIDENCIA']?.trim()) missing.push('Dirección');
                if (!v['PUESTO DE VOTACIÓN']?.trim() || !v['DIRECCIÓN (Pto de votación)']?.trim() || !v['MESA']?.trim() || !v['MUNICIPIO VOTACIÓN']?.trim()) missing.push('Votación');
                return missing.length > 0;
            }).map(v => v._id);

            setVisibleIds(new Set(initialMissing));
            setIsInitialized(true);
        }
    }, [isLoading, voters, isInitialized]);

    if (isLoading && !isInitialized) {
        return (
            <div style={{ padding: '20px' }}>
                <SkeletonLoader type="text" count={2} />
                <SkeletonLoader type="table" count={10} />
            </div>
        );
    }

    // Identify rows to show
    const incompleteVoters: ExtendedVoter[] = voters
        .filter(v => visibleIds.has(v._id))
        .map((v, index) => {
            const missing: string[] = [];
            if (!v['TELÉFONO']?.trim()) missing.push('Teléfono');
            if (!v['DIRECCIÓN DE RESIDENCIA']?.trim()) missing.push('Dirección');
            if (!v['PUESTO DE VOTACIÓN']?.trim() || !v['DIRECCIÓN (Pto de votación)']?.trim() || !v['MESA']?.trim() || !v['MUNICIPIO VOTACIÓN']?.trim()) {
                if (!v['PUESTO DE VOTACIÓN']?.trim()) {
                    missing.push('Puesto Votación');
                } else {
                    missing.push('Datos Votación Inc.');
                }
            }

            return {
                ...v,
                _originalIndex: index,
                _missingFields: missing
            };
        });

    // Filter and Search
    const filteredVoters = incompleteVoters.filter(v => {
        if (selectedLeader !== 'all' && v['LÍDER'] !== selectedLeader) return false;
        if (filter === 'phone' && !v._missingFields.includes('Teléfono') && v._missingFields.length > 0) return false;
        if (filter === 'address' && !v._missingFields.includes('Dirección') && v._missingFields.length > 0) return false;
        if (filter === 'voting_post' && !v._missingFields.includes('Puesto Votación') && v._missingFields.length > 0) return false;

        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            const name = (v['NOMBRES'] + ' ' + v['APELLIDOS']).toLowerCase();
            const cedula = v['No DE CÉDULA SIN PUNTOS']?.toLowerCase() || '';
            return name.includes(searchLower) || cedula.includes(searchLower);
        }

        return true;
    });

    const activeLeaders = Array.from(new Set(incompleteVoters.map(v => v['LÍDER']))).filter(Boolean).sort();

    const handleUpdateById = (id: string, field: string, value: string) => {
        const index = voters.findIndex(v => v._id === id);
        if (index === -1) return;

        const newVoters = [...voters];
        newVoters[index] = {
            ...newVoters[index],
            [field]: value
        };
        setVoters(newVoters);
    };

    const handleSave = async (id: string, field: string, value: string) => {
        if (id) {
            await updateVoter(id, { [field]: value });
        }
    };

    const handleRefreshList = () => {
        const currentMissingIds = voters.filter(v => {
            const missing = [];
            if (!v['TELÉFONO']?.trim()) missing.push('Teléfono');
            if (!v['DIRECCIÓN DE RESIDENCIA']?.trim()) missing.push('Dirección');
            if (!v['PUESTO DE VOTACIÓN']?.trim() || !v['DIRECCIÓN (Pto de votación)']?.trim() || !v['MESA']?.trim() || !v['MUNICIPIO VOTACIÓN']?.trim()) missing.push('Votación');
            return missing.length > 0;
        }).map(v => v._id);

        setVisibleIds(new Set(currentMissingIds));
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
    };

    return (
        <div>
            {showSuccess && (
                <div className="toast toast-success" style={{
                    position: 'fixed', top: '20px', right: '20px', zIndex: 1000,
                    backgroundColor: 'var(--success)', color: 'white', padding: '15px 25px',
                    borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    display: 'flex', alignItems: 'center', gap: '10px'
                }}>
                    <CheckCircle size={24} />
                    <div>
                        <div style={{ fontWeight: 'bold' }}>¡Lista Actualizada!</div>
                        <div style={{ fontSize: '0.9rem' }}>Se han removido los registros completados.</div>
                    </div>
                </div>
            )}

            <AdminHeader
                title="Gestión de Datos Faltantes"
                description={`Se encontraron ${incompleteVoters.length} registros con información pendiente.`}
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
                    <button className="btn btn-primary" onClick={handleRefreshList}>
                        <Save size={18} />
                        Actualizar Lista
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
                                <option value="all">Todos los Líderes</option>
                                {activeLeaders.map(leader => (
                                    <option key={leader} value={leader}>{leader}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex-wrap" style={{ gap: '10px' }}>
                        {['all', 'phone', 'address', 'voting_post'].map(type => (
                            <button
                                key={type}
                                className={`btn ${filter === type ? 'btn-primary' : 'btn-secondary'}`}
                                onClick={() => setFilter(type)}
                                style={{ fontSize: '0.85rem' }}
                            >
                                {type === 'all' ? 'Todos' : type === 'phone' ? 'Falta Tel.' : type === 'address' ? 'Falta Dir.' : 'Falta Puesto'}
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
                                <th>Líder</th>
                                <th>Votante</th>
                                <th>Info Votación</th>
                                <th>Pendiente</th>
                                <th>Gestión Rápida</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredVoters.slice(0, 50).map((v) => (
                                <tr key={v._id}>
                                    <td style={{ fontWeight: '600' }}>{v['LÍDER'] || 'Sin Asignar'}</td>
                                    <td>
                                        <div style={{ fontWeight: '600' }}>{v['NOMBRES']} {v['APELLIDOS']}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>{v['No DE CÉDULA SIN PUNTOS']}</div>
                                    </td>
                                    <td>
                                        <div style={{ fontSize: '0.8rem' }}>
                                            <div><strong>Puesto:</strong> {v['PUESTO DE VOTACIÓN'] || '-'}</div>
                                            <div><strong>Mesa:</strong> {v['MESA'] || '-'}</div>
                                            <div><strong>Mun:</strong> {v['MUNICIPIO VOTACIÓN'] || '-'}</div>
                                        </div>
                                    </td>
                                    <td>
                                        <div className="flex-wrap" style={{ gap: '5px' }}>
                                            {v._missingFields.map(f => (
                                                <span key={f} className="badge badge-warning" style={{ fontSize: '0.7rem' }}>{f}</span>
                                            ))}
                                            {v._missingFields.length === 0 && (
                                                <span className="badge badge-success" style={{ fontSize: '0.7rem' }}>¡Ok!</span>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minWidth: '220px' }}>
                                            {v._missingFields.includes('Teléfono') && (
                                                <div style={{ position: 'relative' }}>
                                                    <input
                                                        type="text"
                                                        placeholder="Teléfono"
                                                        className="search-input"
                                                        style={{ padding: '6px 30px 6px 10px', fontSize: '0.8rem', width: '100%', borderColor: v['TELÉFONO']?.trim() ? 'var(--success)' : '' }}
                                                        value={v['TELÉFONO'] || ''}
                                                        onChange={(e) => handleUpdateById(v._id, 'TELÉFONO', e.target.value)}
                                                        onBlur={(e) => handleSave(v._id, 'TELÉFONO', e.target.value)}
                                                    />
                                                    {v['TELÉFONO']?.trim() && <CheckCircle size={14} color="var(--success)" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)' }} />}
                                                </div>
                                            )}
                                            {v._missingFields.includes('Dirección') && (
                                                <div style={{ position: 'relative' }}>
                                                    <input
                                                        type="text"
                                                        placeholder="Dirección"
                                                        className="search-input"
                                                        style={{ padding: '6px 30px 6px 10px', fontSize: '0.8rem', width: '100%', borderColor: v['DIRECCIÓN DE RESIDENCIA']?.trim() ? 'var(--success)' : '' }}
                                                        value={v['DIRECCIÓN DE RESIDENCIA'] || ''}
                                                        onChange={(e) => handleUpdateById(v._id, 'DIRECCIÓN DE RESIDENCIA', e.target.value)}
                                                        onBlur={(e) => handleSave(v._id, 'DIRECCIÓN DE RESIDENCIA', e.target.value)}
                                                    />
                                                    {v['DIRECCIÓN DE RESIDENCIA']?.trim() && <CheckCircle size={14} color="var(--success)" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)' }} />}
                                                </div>
                                            )}
                                            {(v._missingFields.includes('Puesto Votación') || v._missingFields.includes('Datos Votación Inc.')) && (
                                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
                                                    <input
                                                        type="text"
                                                        placeholder="Puesto"
                                                        className="search-input"
                                                        style={{ padding: '6px', fontSize: '0.8rem', borderColor: v['PUESTO DE VOTACIÓN']?.trim() ? 'var(--success)' : '' }}
                                                        value={v['PUESTO DE VOTACIÓN'] || ''}
                                                        onChange={(e) => handleUpdateById(v._id, 'PUESTO DE VOTACIÓN', e.target.value)}
                                                        onBlur={(e) => handleSave(v._id, 'PUESTO DE VOTACIÓN', e.target.value)}
                                                    />
                                                    <input
                                                        type="text"
                                                        placeholder="Mesa"
                                                        className="search-input"
                                                        style={{ padding: '6px', fontSize: '0.8rem', borderColor: v['MESA']?.trim() ? 'var(--success)' : '' }}
                                                        value={v['MESA'] || ''}
                                                        onChange={(e) => handleUpdateById(v._id, 'MESA', e.target.value)}
                                                        onBlur={(e) => handleSave(v._id, 'MESA', e.target.value)}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredVoters.length === 0 && (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', padding: '60px', color: 'var(--text-muted)' }}>
                                        <CheckCircle size={48} color="var(--success)" style={{ margin: '0 auto 15px', display: 'block' }} />
                                        <p style={{ fontSize: '1.2rem', fontWeight: '500' }}>¡Todo al día!</p>
                                        <p>No se encontraron registros pendientes con los filtros actuales.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {filteredVoters.length > 50 && (
                    <p className="preview-footer">Mostrando los primeros 50 registros de {filteredVoters.length}.</p>
                )}
            </div>
        </div>
    );
}
