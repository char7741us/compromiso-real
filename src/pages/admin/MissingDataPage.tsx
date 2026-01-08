import { useState, useEffect } from 'react';
import { useVoters, type VoterData } from '../../context/VoterContext';
import { Search, CheckCircle, Save, ExternalLink, Filter } from 'lucide-react';
import PlatformLogo from '../../assets/logo-compromiso-white.png';

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

    if (isLoading) {
        return (
            <div style={{ padding: '40px', textAlign: 'center' }}>
                <div style={{
                    display: 'inline-block',
                    width: '40px',
                    height: '40px',
                    border: '4px solid #f3f3f3',
                    borderTop: '4px solid var(--primary)',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                }}></div>
                <p style={{ marginTop: '10px', color: '#666' }}>Cargando datos...</p>
                <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    // 1. Identify rows to show (based on visibleIds whitelist, NOT just current missing status)
    const incompleteVoters: ExtendedVoter[] = voters
        .filter(v => visibleIds.has(v._id)) // Only show items that were originally missing
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

    // 2. Filter and Search
    const filteredVoters = incompleteVoters.filter(v => {
        // Filter by Leader
        if (selectedLeader !== 'all' && v['LÍDER'] !== selectedLeader) return false;

        // Filter type
        if (filter === 'phone' && !v._missingFields.includes('Teléfono') && v._missingFields.length > 0) return false;
        // Note: Logic allows showing "fixed" rows (missingFields.length === 0) if they are in the whitelist

        if (filter === 'address' && !v._missingFields.includes('Dirección') && v._missingFields.length > 0) return false;
        if (filter === 'voting_post' && !v._missingFields.includes('Puesto Votación') && v._missingFields.length > 0) return false;

        // Search term
        if (searchTerm) {
            const searchLower = searchTerm.toLowerCase();
            const name = (v['NOMBRES'] + ' ' + v['APELLIDOS']).toLowerCase();
            const cedula = v['No DE CÉDULA SIN PUNTOS']?.toLowerCase() || '';
            return name.includes(searchLower) || cedula.includes(searchLower);
        }

        return true;
    });

    // Derive list of leaders who have missing data
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
        // Recalculate which IDs are STILL missing data
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
            {/* Success Notification */}
            {showSuccess && (
                <div style={{
                    position: 'fixed',
                    top: '20px',
                    right: '20px',
                    background: 'var(--success)',
                    color: 'white',
                    padding: '16px 24px',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    animation: 'slideIn 0.3s ease-out'
                }}>
                    <CheckCircle size={24} />
                    <div>
                        <div style={{ fontWeight: 'bold' }}>¡Lista Actualizada!</div>
                        <div>Se han removido los registros completados.</div>
                    </div>
                </div>
            )}
            <style>{`@keyframes slideIn { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>

            {/* Header ... */}
            <div className="import-page-header">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
                    <div>
                        <div style={{ marginBottom: '20px' }}>
                            <img
                                src={PlatformLogo}
                                alt="Logo Compromiso Real"
                                style={{ height: '150px', width: 'auto', display: 'block' }}
                            />
                        </div>
                        <h2 className="import-page-title">Gestión de Datos Faltantes</h2>
                        <p className="import-description">
                            Se encontraron <strong>{incompleteVoters.length}</strong> registros en esta sesión.
                        </p>
                    </div>

                    <a
                        href="https://wsp.registraduria.gov.co/censo/consultar"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn"
                        style={{
                            backgroundColor: '#004884', // Registraduria blue-ish tone or similar professional color
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '8px',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                            marginLeft: 'auto' // Push to right if space permits
                        }}
                    >
                        <ExternalLink size={18} />
                        Consultar Puesto de Votación (Registraduría)
                    </a>
                </div>
            </div>

            <div className="card" style={{ marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div className="search-box" style={{ flex: 1, minWidth: '250px' }}>
                        <Search size={20} className="search-icon" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o cédula..."
                            className="search-input"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {/* Leader Filter Dropdown */}
                    <div style={{ position: 'relative', minWidth: '200px' }}>
                        <Filter size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                        <select
                            className="search-input"
                            style={{
                                paddingLeft: '35px',
                                appearance: 'none',
                                cursor: 'pointer',
                                backgroundColor: 'white',
                                width: '100%'
                            }}
                            value={selectedLeader}
                            onChange={(e) => setSelectedLeader(e.target.value)}
                        >
                            <option value="all">Todos los Líderes</option>
                            {activeLeaders.map(leader => (
                                <option key={leader} value={leader}>{leader}</option>
                            ))}
                        </select>
                        {/* Custom arrow could be added with CSS or SVG absolute pos, but native is fine for now */}
                    </div>

                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                        <button
                            className={`btn ${filter === 'all' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setFilter('all')}
                        >
                            Todos
                        </button>
                        <button
                            className={`btn ${filter === 'phone' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setFilter('phone')}
                        >
                            Falta Teléfono
                        </button>
                        <button
                            className={`btn ${filter === 'address' ? 'btn-primary' : 'btn-secondary'}`}
                            onClick={() => setFilter('address')}
                        >
                            Falta Dirección
                        </button>

                        <div style={{ width: '1px', background: '#ccc', margin: '0 10px' }}></div>

                        <button
                            className="btn"
                            onClick={handleRefreshList}
                            style={{
                                backgroundColor: 'var(--success)',
                                color: 'white',
                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                            }}
                        >
                            <Save size={18} />
                            Actualizar Datos
                        </button>
                    </div>
                </div>
            </div>

            <div className="card">
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Líder</th>
                                <th>Votante</th>
                                <th>Info Votación</th>
                                <th>Datos Faltantes</th>
                                <th>Gestión Rápida</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredVoters.slice(0, 50).map((v) => (
                                <tr key={v['No DE CÉDULA SIN PUNTOS'] + ((v as any)._originalIndex || '')}>
                                    <td>
                                        <div style={{ fontSize: '0.9rem', fontWeight: 'bold' }}>{v['LÍDER']}</div>
                                    </td>
                                    <td>
                                        <div style={{ fontWeight: '600' }}>{v['NOMBRES']} {v['APELLIDOS']}</div>
                                        <div style={{ fontSize: '0.8rem', color: '#666' }}>CC: {v['No DE CÉDULA SIN PUNTOS']}</div>
                                    </td>
                                    <td>
                                        <div style={{ fontSize: '0.8rem' }}>
                                            <div><strong>Puesto:</strong> {v['PUESTO DE VOTACIÓN'] || '-'}</div>
                                            <div><strong>Dir Puesto:</strong> {v['DIRECCIÓN (Pto de votación)'] || '-'}</div>
                                            <div><strong>Mesa:</strong> {v['MESA'] || '-'}</div>
                                            <div><strong>Mun:</strong> {v['MUNICIPIO VOTACIÓN'] || '-'}</div>
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap' }}>
                                            {v._missingFields.map(f => (
                                                <span key={f} className="badge badge-warning" style={{ fontSize: '0.75rem' }}>
                                                    {f}
                                                </span>
                                            ))}
                                            {v._missingFields.length === 0 && (
                                                <span className="badge badge-success" style={{ fontSize: '0.75rem', backgroundColor: 'var(--success)', color: 'white' }}>
                                                    ¡Completo!
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            {/* Phone Input: Always show if it was originally designated as missing */}
                                            {v._missingFields.includes('Teléfono') && (
                                                <div className="input-group" style={{ position: 'relative' }}>
                                                    <input
                                                        type="text"
                                                        placeholder="Ingresar Teléfono"
                                                        className="search-input"
                                                        style={{
                                                            padding: '6px',
                                                            fontSize: '0.85rem',
                                                            borderColor: v['TELÉFONO']?.trim() ? 'var(--success)' : ''
                                                        }}
                                                        value={v['TELÉFONO'] || ''}
                                                        onChange={(e) => handleUpdateById(v._id, 'TELÉFONO', e.target.value)}
                                                        onBlur={(e) => handleSave(v._id, 'TELÉFONO', e.target.value)}
                                                    />
                                                    {v['TELÉFONO']?.trim() && (
                                                        <CheckCircle size={14} color="var(--success)" style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)' }} />
                                                    )}
                                                </div>
                                            )}

                                            {/* Address Input */}
                                            {v._missingFields.includes('Dirección') && (
                                                <div className="input-group" style={{ position: 'relative' }}>
                                                    <input
                                                        type="text"
                                                        placeholder="Ingresar Dirección"
                                                        className="search-input"
                                                        style={{
                                                            padding: '6px',
                                                            fontSize: '0.85rem',
                                                            borderColor: v['DIRECCIÓN DE RESIDENCIA']?.trim() ? 'var(--success)' : ''
                                                        }}
                                                        value={v['DIRECCIÓN DE RESIDENCIA'] || ''}
                                                        onChange={(e) => handleUpdateById(v._id, 'DIRECCIÓN DE RESIDENCIA', e.target.value)}
                                                        onBlur={(e) => handleSave(v._id, 'DIRECCIÓN DE RESIDENCIA', e.target.value)}
                                                    />
                                                    {v['DIRECCIÓN DE RESIDENCIA']?.trim() && (
                                                        <CheckCircle size={14} color="var(--success)" style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)' }} />
                                                    )}
                                                </div>
                                            )}

                                            {/* Voting Info Inputs */}
                                            {(v._missingFields.includes('Puesto Votación') || v._missingFields.includes('Datos Votación Inc.')) && (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                    <div style={{ display: 'flex', gap: '5px' }}>
                                                        <input
                                                            type="text"
                                                            placeholder="Puesto Votación"
                                                            className="search-input"
                                                            style={{ padding: '6px', fontSize: '0.85rem', flex: 1, borderColor: v['PUESTO DE VOTACIÓN']?.trim() ? 'var(--success)' : '' }}
                                                            value={v['PUESTO DE VOTACIÓN'] || ''}
                                                            onChange={(e) => handleUpdateById(v._id, 'PUESTO DE VOTACIÓN', e.target.value)}
                                                            onBlur={(e) => handleSave(v._id, 'PUESTO DE VOTACIÓN', e.target.value)}
                                                        />
                                                        <input
                                                            type="text"
                                                            placeholder="Dir. Puesto"
                                                            className="search-input"
                                                            style={{ padding: '6px', fontSize: '0.85rem', flex: 1, borderColor: v['DIRECCIÓN (Pto de votación)']?.trim() ? 'var(--success)' : '' }}
                                                            value={v['DIRECCIÓN (Pto de votación)'] || ''}
                                                            onChange={(e) => handleUpdateById(v._id, 'DIRECCIÓN (Pto de votación)', e.target.value)}
                                                            onBlur={(e) => handleSave(v._id, 'DIRECCIÓN (Pto de votación)', e.target.value)}
                                                        />
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '5px' }}>
                                                        <input
                                                            type="text"
                                                            placeholder="Mesa"
                                                            className="search-input"
                                                            style={{ padding: '6px', fontSize: '0.85rem', width: '50%', borderColor: v['MESA']?.trim() ? 'var(--success)' : '' }}
                                                            value={v['MESA'] || ''}
                                                            onChange={(e) => handleUpdateById(v._id, 'MESA', e.target.value)}
                                                            onBlur={(e) => handleSave(v._id, 'MESA', e.target.value)}
                                                        />
                                                        <input
                                                            type="text"
                                                            placeholder="Mun"
                                                            className="search-input"
                                                            style={{ padding: '6px', fontSize: '0.85rem', width: '50%', borderColor: v['MUNICIPIO VOTACIÓN']?.trim() ? 'var(--success)' : '' }}
                                                            value={v['MUNICIPIO VOTACIÓN'] || ''}
                                                            onChange={(e) => handleUpdateById(v._id, 'MUNICIPIO VOTACIÓN', e.target.value)}
                                                            onBlur={(e) => handleSave(v._id, 'MUNICIPIO VOTACIÓN', e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredVoters.length === 0 && (
                                <tr>
                                    <td colSpan={5} style={{ textAlign: 'center', padding: '20px' }}>
                                        <CheckCircle size={40} color="var(--success)" style={{ marginBottom: '10px' }} />
                                        <p>¡Excelente! No se encontraron registros faltantes con los filtros actuales.</p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {filteredVoters.length > 50 && (
                    <p className="preview-footer">Mostrando 50 de {filteredVoters.length} registros.</p>
                )}
            </div>
        </div>
    );
}
