import { useMemo } from 'react';
import { useVoters } from '../../context/VoterContext';
import { Users, UserCheck, FileSpreadsheet, AlertTriangle, TrendingUp, Activity } from 'lucide-react';
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';
import InfographicImage from '../../assets/infographic-stats.jpg';
import PlatformLogo from '../../assets/logo-compromiso-white.png';

export default function DashboardPage() {
    const { stats, voters, isLoading, refreshVoters } = useVoters();

    // Stats for Unique Leaders
    const uniqueLeaders = useMemo(() => {
        return new Set(voters.map(v => v['LÍDER']?.trim()).filter(Boolean)).size;
    }, [voters]);

    // Data for Pie Chart (Data Quality)
    const dataQuality = useMemo(() => {
        const total = stats.total;
        if (total === 0) return [];
        const missingOne = stats.missingPhone + stats.missingAddress + stats.missingVotingPost;
        // This is a rough approximation for visualization
        const complete = Math.max(0, total - (missingOne / 3));
        const incomplete = total - complete;

        return [
            { name: 'Datos Completos', value: Math.round(complete), color: '#10b981' }, // Success Green
            { name: 'Por Completar', value: Math.round(incomplete), color: '#fbbf24' },  // Warning Yellow
        ];
    }, [stats]);

    // Data for Bar Chart (Top 5 Leaders)
    const topLeaders = useMemo(() => {
        const counts: Record<string, number> = {};
        voters.forEach(v => {
            const l = v['LÍDER']?.trim() || 'Sin Asignar';
            counts[l] = (counts[l] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([name, count]) => ({ name, Votantes: count })) // Full name and mapped key
            .sort((a, b) => b.Votantes - a.Votantes)
            .slice(0, 5);
    }, [voters]);

    return (
        <div>
            {/* HER0 HEADER */}
            <div className="import-page-header">
                <div style={{ position: 'relative', zIndex: 2 }}>
                    <div style={{ marginBottom: '20px' }}>
                        <img
                            src={PlatformLogo}
                            alt="Logo Compromiso Real"
                            style={{ height: '180px', width: 'auto', display: 'block' }} // Increased size as requested
                        />
                    </div>
                    <h2 className="import-page-title" style={{ display: 'flex', alignItems: 'center', gap: '12px', fontSize: '1.8rem' }}>
                        Dashboard de Control
                        <Activity color="#60a5fa" size={28} />
                    </h2>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: '20px' }}>
                        <p className="import-description">
                            Monitoreo en tiempo real de la estructura y rendimiento.
                        </p>
                        <button
                            onClick={() => refreshVoters()}
                            className="btn btn-primary"
                            style={{ background: 'rgba(255,255,255,0.2)', border: '1px solid rgba(255,255,255,0.4)', backdropFilter: 'blur(4px)' }}
                        >
                            {isLoading ? 'Sincronizando...' : '🔄 Sincronizar Ahora'}
                        </button>
                    </div>
                </div>
            </div>

            {/* KPI CARDS - 3D Effect */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '24px', marginBottom: '30px' }}>
                <div className="card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px', borderLeft: '5px solid var(--primary)' }}>
                    <div style={{ background: '#eff6ff', padding: '15px', borderRadius: '50%' }}>
                        <Users size={32} color="var(--primary)" />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '2.5rem', fontWeight: '800', margin: 0, color: 'var(--text-main)', lineHeight: '1' }}>
                            {isLoading ? <span style={{ opacity: 0.5 }}>...</span> : stats.total}
                        </h3>
                        <p style={{ margin: 0, color: 'var(--text-muted)', fontWeight: '500' }}>Votantes Totales</p>
                    </div>
                </div>

                <div className="card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px', borderLeft: '5px solid var(--success)' }}>
                    <div style={{ background: '#f0fdf4', padding: '15px', borderRadius: '50%' }}>
                        <UserCheck size={32} color="var(--success)" />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '2.5rem', fontWeight: '800', margin: 0, color: 'var(--text-main)', lineHeight: '1' }}>
                            {isLoading ? <span style={{ opacity: 0.5 }}>...</span> : uniqueLeaders}
                        </h3>
                        <p style={{ margin: 0, color: 'var(--text-muted)', fontWeight: '500' }}>Líderes Activos</p>
                    </div>
                </div>

                <div className="card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: '20px', borderLeft: '5px solid var(--secondary)' }}>
                    <div style={{ background: '#f1f5f9', padding: '15px', borderRadius: '50%' }}>
                        <FileSpreadsheet size={32} color="var(--secondary)" />
                    </div>
                    <div>
                        <h3 style={{ fontSize: '2.5rem', fontWeight: '800', margin: 0, color: 'var(--text-main)', lineHeight: '1' }}>
                            {stats.missingPhone + stats.missingAddress}
                        </h3>
                        <p style={{ margin: 0, color: 'var(--text-muted)', fontWeight: '500' }}>Registros Incompletos</p>
                    </div>
                </div>
            </div>

            {/* CHARTS ROW */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>

                {/* Visual #1: Top Leaders */}
                <div className="card" style={{ minHeight: '400px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                        <h3 style={{ margin: 0 }}>🏆 Top 5 Gestión</h3>
                        <TrendingUp size={20} color="var(--text-muted)" />
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={topLeaders} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#e2e8f0" />
                            <XAxis type="number" hide />
                            <YAxis dataKey="name" type="category" width={150} tick={{ fontSize: 12 }} />
                            <Tooltip
                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                cursor={{ fill: 'transparent' }}
                            />
                            <Bar dataKey="Votantes" fill="var(--primary)" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Visual #2: Data Quality */}
                <div className="card" style={{ minHeight: '400px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                        <h3 style={{ margin: 0 }}>📊 Calidad de la Base</h3>
                        <Activity size={20} color="var(--text-muted)" />
                    </div>
                    <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                            <Pie
                                data={dataQuality}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={100}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {dataQuality.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                            <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

            </div>

            {/* QUICK ACTIONS */}
            <div className="card" style={{ marginTop: '24px', background: 'linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)' }}>
                <h3 style={{ marginBottom: '15px' }}>⚡ Acciones Rápidas</h3>
                <div style={{ display: 'flex', gap: '15px', flexWrap: 'wrap' }}>
                    <a href="/admin/import" className="btn btn-primary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <FileSpreadsheet size={18} />
                        Importar Nuevos Datos
                    </a>
                    <a href="/admin/missing-data" className="btn btn-secondary" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AlertTriangle size={18} />
                        Gestionar Faltantes
                    </a>
                </div>
            </div>

            {/* INFOGRAPHIC SECTION */}
            <div className="card" style={{ marginTop: '24px', overflow: 'hidden', padding: '0', border: 'none' }}>
                <div style={{ padding: '20px 20px 10px 20px', borderBottom: '1px solid var(--border-color, #e2e8f0)' }}>
                    <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        📊 Análisis Gráfico Detallado
                    </h3>
                </div>
                <img
                    src={InfographicImage}
                    alt="Infografía de Estadísticas"
                    style={{
                        width: '100%',
                        height: 'auto',
                        display: 'block'
                    }}
                />
            </div>
        </div>
    );
}
