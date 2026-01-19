import { useState, useEffect } from 'react';
import { useVoters } from '../../context/VoterContext';
import { BarChart3, TrendingUp, AlertCircle, CheckCircle } from 'lucide-react';
import AdminHeader from '../../components/AdminHeader';
import SkeletonLoader from '../../components/SkeletonLoader';
import { leaderService } from '../../services/leaderService';
import { supabase } from '../../supabase';

interface LeaderStats {
    id: string;
    name: string;
    voterCount: number;
    withPhone?: number;
    withAddress?: number;
    withVotingPost?: number;
}

export default function AnalysisPage() {
    const { fetchGlobalStats, stats, isLoading: contextLoading } = useVoters();
    const [leaderStats, setLeaderStats] = useState<LeaderStats[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadAnalysis = async () => {
            setLoading(true);
            try {
                await fetchGlobalStats();

                const leaders = await leaderService.getLeaders();
                const sortedLeaders = leaders.sort((a, b) => (b.total_voters || 0) - (a.total_voters || 0));

                const top10 = sortedLeaders.slice(0, 10);

                const detailedStats = await Promise.all(top10.map(async (l) => {
                    const { count: withPhone } = await supabase
                        .from('voters')
                        .select('*', { count: 'exact', head: true })
                        .eq('leader_id', l.id)
                        .not('phone', 'is', null);

                    const { count: withAddress } = await supabase
                        .from('voters')
                        .select('*', { count: 'exact', head: true })
                        .eq('leader_id', l.id)
                        .not('address', 'is', null);

                    return {
                        id: l.id,
                        name: l.full_name,
                        voterCount: l.total_voters || 0,
                        withPhone: withPhone || 0,
                        withAddress: withAddress || 0
                    };
                }));

                setLeaderStats(detailedStats);

            } catch (error) {
                console.error(error);
            } finally {
                setLoading(false);
            }
        };

        loadAnalysis();
    }, []);

    const topLeader = leaderStats[0];
    const maxVotes = topLeader?.voterCount || 1;

    const totalVoters = stats.total;
    const globalWithPhone = totalVoters - stats.missingPhone;

    if (loading) {
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
                description="Detalle de rendimiento por estructura y calidad de datos (Top 10 Líderes)."
            />

            {/* TOP METRICS */}
            <div className="grid-stats">
                <div className="card kpi-card" style={{ borderLeft: '5px solid var(--success)' }}>
                    <div className="kpi-icon" style={{ background: '#f0fdf4' }}>
                        <TrendingUp color="var(--success)" size={32} />
                    </div>
                    <div>
                        <h3 className="kpi-value">{topLeader?.name || 'N/A'}</h3>
                        <p className="kpi-label">Líder con Mayor Gestión ({topLeader?.voterCount || 0} registros)</p>
                    </div>
                </div>

                <div className="card kpi-card" style={{ borderLeft: '5px solid var(--primary)' }}>
                    <div className="kpi-icon" style={{ background: '#eff6ff' }}>
                        <BarChart3 color="var(--primary)" size={32} />
                    </div>
                    <div>
                        <h3 className="kpi-value">
                            {totalVoters > 0 ? Math.round((globalWithPhone / totalVoters) * 100) : 0}%
                        </h3>
                        <p className="kpi-label">Calidad de Datos Global (Teléfonos)</p>
                    </div>
                </div>
            </div>

            {/* TOP 5 CHART */}
            <div className="card" style={{ marginBottom: '30px', padding: '25px' }}>
                <h3 style={{ marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>Top Líderes (Por volumen)</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {leaderStats.slice(0, 5).map(l => (
                        <div key={l.id}>
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
                    <h3 style={{ margin: 0 }}>Detalle por Líder (Top 10)</h3>
                    <p style={{ margin: '5px 0 0 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                        Análisis detallado de calidad de datos para los principales líderes.
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
                            {leaderStats.map((leader) => {
                                const withPhone = leader.withPhone || 0;
                                const withAddress = leader.withAddress || 0;
                                const contactPercent = leader.voterCount > 0 ? Math.round((withPhone / leader.voterCount) * 100) : 0;
                                const isCritical = contactPercent < 50;

                                return (
                                    <tr key={leader.id}>
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
                                                Faltan: {leader.voterCount - withPhone} Tels, {leader.voterCount - withAddress} Dirs
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
                    <h3 style={{ margin: '0 0 10px 0', color: 'var(--primary-dark)' }}>ℹ️ Resumen de Información Faltante Global</h3>
                    <p style={{ lineHeight: '1.6', color: 'var(--text-main)' }}>
                        Para asegurar el éxito de la logística el día D, necesitamos completar la siguiente información prioritaria:
                    </p>
                    <ul style={{ marginTop: '10px', paddingLeft: '20px', color: 'var(--text-main)' }}>
                        <li style={{ marginBottom: '5px' }}>
                            <strong>Teléfonos de Contacto:</strong> Faltan <strong>{stats.missingPhone}</strong> números.
                        </li>
                        <li style={{ marginBottom: '5px' }}>
                            <strong>Direcciones Exactas:</strong> Faltan <strong>{stats.missingAddress}</strong> direcciones.
                        </li>
                        <li>
                            <strong>Puesto de Votación:</strong> Faltan <strong>{stats.missingVotingPost}</strong> asignaciones.
                        </li>
                    </ul>
                </div>
            </div>
        </div>
    );
}
