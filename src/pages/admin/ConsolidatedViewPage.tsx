import { useState, useMemo } from 'react';
import { useVoters } from '../../context/VoterContext';
import { Filter, Download, Search } from 'lucide-react';
import PlatformLogo from '../../assets/logo-compromiso-white.png';

const TABLE_HEADERS = [
    'LÍDER',
    'NOMBRES',
    'APELLIDOS',
    'No DE CÉDULA SIN PUNTOS',
    'TELÉFONO',
    'DIRECCIÓN DE RESIDENCIA',
    'BARRIO DE RESIDENCIA',
    'PUESTO DE VOTACIÓN',
    'DIRECCIÓN (Pto de votación)',
    'MESA',
    'MUNICIPIO VOTACIÓN'
];

export default function ConsolidatedViewPage() {
    const { voters, isLoading } = useVoters();
    const [selectedLeader, setSelectedLeader] = useState<string>('Todos');
    const [searchTerm, setSearchTerm] = useState('');

    // Extract unique leaders for the filter dropdown
    const leaders = useMemo(() => {
        const unique = new Set(voters.map(v => v['LÍDER']?.trim()).filter(Boolean));
        return ['Todos', ...Array.from(unique).sort()];
    }, [voters]);

    // Filter data based on selection and search
    const filteredData = useMemo(() => {
        return voters.filter(voter => {
            const matchesLeader = selectedLeader === 'Todos' || (voter['LÍDER']?.trim() === selectedLeader);

            const searchLower = searchTerm.toLowerCase();
            const matchesSearch =
                (voter['NOMBRES']?.toLowerCase().includes(searchLower)) ||
                (voter['APELLIDOS']?.toLowerCase().includes(searchLower)) ||
                (voter['No DE CÉDULA SIN PUNTOS']?.includes(searchTerm));

            return matchesLeader && matchesSearch;
        });
    }, [voters, selectedLeader, searchTerm]);

    const handleExport = () => {
        // Simple CSV export logic reusing standard browser capabilities
        const csvContent = "data:text/csv;charset=utf-8,"
            + TABLE_HEADERS.join(";") + "\n"
            + filteredData.map(row => {
                return TABLE_HEADERS.map(header => {
                    const val = row[header] || '';
                    return `"${String(val).replace(/"/g, '""')}"`; // Escape quotes
                }).join(";");
            }).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `consolidado_${selectedLeader}_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div>
            {/* Header Section from ImportPage style */}
            <div className="import-page-header">
                <div style={{ marginBottom: '20px' }}>
                    <img
                        src={PlatformLogo}
                        alt="Logo Compromiso Real"
                        style={{ height: '150px', width: 'auto', display: 'block' }}
                    />
                </div>
                <h2 className="import-page-title">Información Consolidada</h2>
                <p className="import-description">
                    Vista general de toda la base de datos con filtros por líder.
                </p>
            </div>

            {/* Controls Card */}
            <div className="card" style={{ marginBottom: '24px' }}>
                <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', alignItems: 'flex-end' }}>

                    {/* Leader Filter */}
                    <div style={{ flex: 1, minWidth: '250px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: 'bold', color: 'var(--text-main)' }}>
                            <Filter size={18} />
                            Filtrar por Líder
                        </label>
                        <select
                            value={selectedLeader}
                            onChange={(e) => setSelectedLeader(e.target.value)}
                            title="Seleccionar Líder"
                            aria-label="Filtrar por Líder"
                            style={{
                                width: '100%',
                                padding: '10px 15px',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)',
                                fontSize: '1rem',
                                color: 'var(--text-main)',
                                backgroundColor: 'white'
                            }}
                        >
                            {leaders.map(leader => (
                                <option key={leader} value={leader}>{leader}</option>
                            ))}
                        </select>
                    </div>

                    {/* Search Box */}
                    <div style={{ flex: 1, minWidth: '250px' }}>
                        <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px', fontWeight: 'bold', color: 'var(--text-main)' }}>
                            <Search size={18} />
                            Buscar Votante
                        </label>
                        <input
                            type="text"
                            placeholder="Nombre, Apellido o Cédula..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '10px 15px',
                                borderRadius: '8px',
                                border: '1px solid var(--border-color)',
                                fontSize: '1rem'
                            }}
                        />
                    </div>

                    {/* Export Button */}
                    <div>
                        <button
                            onClick={handleExport}
                            className="btn btn-secondary"
                            style={{ height: '42px', display: 'flex', alignItems: 'center', gap: '8px' }}
                        >
                            <Download size={18} />
                            Exportar Vista
                        </button>
                    </div>
                </div>
            </div>

            {/* Data Table */}
            <div className="card" style={{ overflow: 'hidden' }}>
                <div style={{ marginBottom: '15px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <h3 style={{ margin: 0 }}>
                        {selectedLeader === 'Todos' ? 'Todos los Registros' : `Equipo de ${selectedLeader}`}
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 'normal', marginLeft: '10px' }}>
                            ({filteredData.length} registros encontrados)
                        </span>
                    </h3>
                </div>

                <div className="table-container" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                    {isLoading ? (
                        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Cargando datos...</div>
                    ) : filteredData.length > 0 ? (
                        <table style={{ width: '100%', minWidth: '1200px' }}>
                            <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
                                <tr>
                                    {TABLE_HEADERS.map(header => (
                                        <th key={header} style={{ whiteSpace: 'nowrap' }}>{header}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.map((row, idx) => (
                                    <tr key={row._id || idx}>
                                        {TABLE_HEADERS.map(col => (
                                            <td key={`${idx}-${col}`}>{row[col] || '-'}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    ) : (
                        <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>
                            No se encontraron registros coinciden con los filtros.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
