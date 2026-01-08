import { useMemo } from 'react';
import { useVoters } from '../../context/VoterContext';
import { BarChart3, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';

interface LeaderStats {
    name: string;
    voterCount: number;
    withPhone: number;
    withAddress: number;
    withVotingPost: number;
}

export default function AnalysisPage() {
    const { voters } = useVoters();

    // Compute leader stats
    const leaderData = useMemo(() => {
        const statsMap = new Map<string, LeaderStats>();

        voters.forEach(v => {
            const rawName = v['LÍDER']?.trim();
            const leaderName = rawName || 'Sin Asignar';

            if (!statsMap.has(leaderName)) {
                statsMap.set(leaderName, {
                    name: leaderName,
                    voterCount: 0,
                    withPhone: 0,
                    withAddress: 0,
                    withVotingPost: 0
                });
            }

            const stats = statsMap.get(leaderName)!;
            stats.voterCount++;
            if (v['TELÉFONO']?.trim()) stats.withPhone++;
            if (v['DIRECCIÓN DE RESIDENCIA']?.trim()) stats.withAddress++;
            if (v['PUESTO DE VOTACIÓN']?.trim()) stats.withVotingPost++;
        });

        // Convert to array and sort by voter count (desc)
        return Array.from(statsMap.values()).sort((a, b) => b.voterCount - a.voterCount);
    }, [voters]);

    const totalVoters = voters.length;

    // Top 5 Leaders for chart
    const topLeaders = leaderData.slice(0, 5);
    const maxVotes = topLeaders[0]?.voterCount || 1;

    return (
        <div>
            <div className="import-page-header">
                <h2 className="import-page-title">Análisis de Líderes y Cumplimiento</h2>
                <p className="import-description">
                    Detalle de rendimiento por estructura y calidad de datos.
                </p>
            </div>

            {/* TOP METRICS */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <div className="card" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#666' }}>Líder con Mayor Gestión</h3>
                        <TrendingUp color="var(--success)" size={24} />
                    </div>
                    <p style={{ fontSize: '1.5rem', fontWeight: 'bold', margin: 0, color: 'var(--primary-dark)' }}>
                        {topLeaders[0]?.name || 'N/A'}
                    </p>
                    <p style={{ fontSize: '0.9rem', color: '#888', marginTop: '5px' }}>
                        {topLeaders[0]?.voterCount || 0} votantes registrados
                    </p>
                </div>

                <div className="card" style={{ padding: '20px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#666' }}>Calidad de Datos Global</h3>
                        <BarChart3 color="var(--primary)" size={24} />
                    </div>
                    <div style={{ marginTop: '10px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '0.9rem' }}>
                            <span>Teléfonos Válidos</span>
                            <strong>{Math.round((voters.filter(v => v['TELÉFONO']?.trim()).length / totalVoters) * 100)}%</strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                            <span>Puestos Asignados</span>
                            <strong>{Math.round((voters.filter(v => v['PUESTO DE VOTACIÓN']?.trim()).length / totalVoters) * 100)}%</strong>
                        </div>
                    </div>
                </div>
            </div>

            {/* TOP 5 CHART */}
            <div className="card" style={{ marginBottom: '30px', padding: '25px' }}>
                <h3 style={{ marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Top 5 Líderes</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {topLeaders.map(l => (
                        <div key={l.name}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px', fontSize: '0.9rem' }}>
                                <span style={{ fontWeight: '500' }}>{l.name}</span>
                                <span style={{ color: '#666' }}>{l.voterCount} votantes</span>
                            </div>
                            <div style={{ width: '100%', backgroundColor: '#f3f4f6', borderRadius: '4px', height: '10px', overflow: 'hidden' }}>
                                <div style={{
                                    width: `${(l.voterCount / maxVotes) * 100}%`,
                                    backgroundColor: 'var(--primary)',
                                    height: '100%',
                                    borderRadius: '4px'
                                }}></div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* DETAILED TABLE */}
            <div className="card">
                <div style={{ padding: '20px', borderBottom: '1px solid #eee' }}>
                    <h3 style={{ margin: 0 }}>Detalle por Líder</h3>
                    <p style={{ margin: '5px 0 0 0', color: '#888', fontSize: '0.9rem' }}>
                        Identifica qué líderes necesitan completar su información.
                    </p>
                </div>
                <div className="table-container">
                    <table>
                        <thead>
                            <tr>
                                <th>Líder</th>
                                <th style={{ textAlign: 'center' }}>Total Votantes</th>
                                <th style={{ textAlign: 'center' }}>% Contactabilidad</th>
                                <th style={{ textAlign: 'center' }}>Datos Faltantes (Resumen)</th>
                                <th>Estado</th>
                            </tr>
                        </thead>
                        <tbody>
                            {leaderData.map((leader) => {
                                const contactPercent = Math.round((leader.withPhone / leader.voterCount) * 100);
                                const isCritical = contactPercent < 50;

                                return (
                                    <tr key={leader.name}>
                                        <td style={{ fontWeight: '500' }}>{leader.name}</td>
                                        <td style={{ textAlign: 'center', fontSize: '1.1rem' }}>{leader.voterCount}</td>
                                        <td style={{ textAlign: 'center' }}>
                                            <span
                                                className={`badge ${isCritical ? 'badge-error' : contactPercent > 90 ? 'badge-success' : 'badge-warning'}`}
                                            >
                                                {contactPercent}%
                                            </span>
                                        </td>
                                        <td style={{ textAlign: 'center', color: '#666' }}>
                                            {/* Mini textual summary of what is missing */}
                                            <span style={{ fontSize: '0.85rem' }}>
                                                Faltan: {leader.voterCount - leader.withPhone} Tels, {leader.voterCount - leader.withAddress} Dirs
                                            </span>
                                        </td>
                                        <td>
                                            {isCritical ? (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--error)' }}>
                                                    <AlertCircle size={16} />
                                                    <span style={{ fontSize: '0.85rem' }}>Crítico</span>
                                                </div>
                                            ) : (
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '5px', color: 'var(--success)' }}>
                                                    <CheckCircle size={16} />
                                                    <span style={{ fontSize: '0.85rem' }}>OK</span>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* INFORMATION NEEDED SUMMARY */}
            <div className="card" style={{ marginTop: '20px', backgroundColor: '#f8fafc', border: '1px border #e2e8f0' }}>
                <div style={{ padding: '20px' }}>
                    <h3 style={{ margin: '0 0 10px 0', color: 'var(--primary-dark)' }}>ℹ️ Resumen de Información Faltante</h3>
                    <p style={{ lineHeight: '1.6', color: '#475569' }}>
                        Para asegurar el éxito de la logística el día D, necesitamos completar la siguiente información prioritaria:
                    </p>
                    <ul style={{ marginTop: '10px', paddingLeft: '20px', color: '#475569' }}>
                        <li style={{ marginBottom: '5px' }}>
                            <strong>Teléfonos de Contacto:</strong> Hay <strong>{voters.length - voters.filter(v => v['TELÉFONO']?.trim()).length}</strong> votantes sin número. Es vital para la confirmación.
                        </li>
                        <li style={{ marginBottom: '5px' }}>
                            <strong>Direcciones Exactas:</strong> Necesarias para coordinar el transporte. Faltan <strong>{voters.length - voters.filter(v => v['DIRECCIÓN DE RESIDENCIA']?.trim()).length}</strong> direcciones.
                        </li>
                        <li>
                            <strong>Puesto de Votación:</strong> Crítico para la zonificación. Faltan <strong>{voters.length - voters.filter(v => v['PUESTO DE VOTACIÓN']?.trim()).length}</strong> asignaciones.
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
