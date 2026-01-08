import { useMemo } from 'react';
import { useVoters } from '../../context/VoterContext';
import { BarChart3, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import AdminHeader from '../../components/AdminHeader';
import SkeletonLoader from '../../components/SkeletonLoader';

interface LeaderStats {
    name: string;
    voterCount: number;
    withPhone: number;
    withAddress: number;
    withVotingPost: number;
}

export default function AnalysisPage() {
    const { voters, isLoading } = useVoters();

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

        return Array.from(statsMap.values()).sort((a, b) => b.voterCount - a.voterCount);
    }, [voters]);

    const totalVoters = voters.length;
    const topLeaders = leaderData.slice(0, 5);
    const maxVotes = topLeaders[0]?.voterCount || 1;

    if (isLoading && voters.length === 0) {
        return (
            <div style={{ padding: '20px' }}>
                <SkeletonLoader type="text" count={2} />
                <SkeletonLoader type="kpi" count={2} />
                <SkeletonLoader type="card" count={1} />
                <SkeletonLoader type="table" count={5} />
            </div>
        );
    }

    return (
        <div>
            <AdminHeader
                title="Análisis de Líderes y Cumplimiento"
                description="Detalle de rendimiento por estructura y calidad de datos."
            />

            {/* TOP METRICS */}
            <div className="grid-stats">
                <div className="card kpi-card" style={{ borderLeft: '5px solid var(--success)' }}>
                    <div className="kpi-icon" style={{ background: '#f0fdf4' }}>
                        <TrendingUp color="var(--success)" size={32} />
                    </div>
                    <div>
                        <h3 className="kpi-value">{topLeaders[0]?.name || 'N/A'}</h3>
                        <p className="kpi-label">Líder con Mayor Gestión ({topLeaders[0]?.voterCount || 0} registros)</p>
                    </div>
                </div>

                <div className="card kpi-card" style={{ borderLeft: '5px solid var(--primary)' }}>
                    <div className="kpi-icon" style={{ background: '#eff6ff' }}>
                        <BarChart3 color="var(--primary)" size={32} />
                    </div>
                    <div>
                        <h3 className="kpi-value">
                            {totalVoters > 0 ? Math.round((voters.filter(v => v['TELÉFONO']?.trim()).length / totalVoters) * 100) : 0}%
                        </h3>
                        <p className="kpi-label">Calidad de Datos Global (Teléfonos)</p>
                    </div>
                </div>
            </div>

            {/* TOP 5 CHART */}
            <div className="card" style={{ marginBottom: '30px', padding: '25px' }}>
                <h3 style={{ marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Top 5 Líderes</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {topLeaders.map(l => (
                        <div key={l.name}>
                            <div className="flex-between" style={{ marginBottom: '5px', fontSize: '0.9rem' }}>
                                <span style={{ fontWeight: '500' }}>{l.name}</span>
                                <span style={{ color: 'var(--text-muted)' }}>{l.voterCount} votantes</span>
                            </div>
                            <div style={{ width: '100%', backgroundColor: '#f3f4f6', borderRadius: '4px', height: '12px', overflow: 'hidden' }}>
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
                    <p style={{ margin: '5px 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
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
                                        <td style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
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
            <div className="card" style={{ marginTop: '20px', backgroundColor: '#f8fafc' }}>
                <div style={{ padding: '20px' }}>
                    <h3 style={{ margin: '0 0 10px 0', color: 'var(--primary-dark)' }}>ℹ️ Resumen de Información Faltante</h3>
                    <p style={{ lineHeight: '1.6', color: 'var(--text-main)' }}>
                        Para asegurar el éxito de la logística el día D, necesitamos completar la siguiente información prioritaria:
                    </p>
                    <ul style={{ marginTop: '10px', paddingLeft: '20px', color: 'var(--text-main)' }}>
                        <li style={{ marginBottom: '5px' }}>
                            <strong>Teléfonos de Contacto:</strong> Faltan <strong>{voters.length - voters.filter(v => v['TELÉFONO']?.trim()).length}</strong> números.
                        </li>
                        <li style={{ marginBottom: '5px' }}>
                            <strong>Direcciones Exactas:</strong> Faltan <strong>{voters.length - voters.filter(v => v['DIRECCIÓN DE RESIDENCIA']?.trim()).length}</strong> direcciones.
                        </li>
                        <li>
                            <strong>Puesto de Votación:</strong> Faltan <strong>{voters.length - voters.filter(v => v['PUESTO DE VOTACIÓN']?.trim()).length}</strong> asignaciones.
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
