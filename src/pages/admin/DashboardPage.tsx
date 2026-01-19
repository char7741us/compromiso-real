import { useMemo, useState, useEffect } from 'react';
import { useVoters } from '../../context/VoterContext';
import { supabase } from '../../supabase';
import { Users, UserCheck, FileSpreadsheet, AlertTriangle, TrendingUp, Activity } from 'lucide-react';
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';
import InfographicImage from '../../assets/infographic-stats.jpg';
import AdminHeader from '../../components/AdminHeader';
import SkeletonLoader from '../../components/SkeletonLoader';

export default function DashboardPage() {
    const { stats, isLoading, refreshVoters } = useVoters();
    const [topLeaders, setTopLeaders] = useState<{name: string, Votantes: number}[]>([]);
    const [uniqueLeadersCount, setUniqueLeadersCount] = useState(0);
    const [loadingExtras, setLoadingExtras] = useState(true);

    useEffect(() => {
        const fetchDashboardExtra = async () => {
            try {
                // Get Leader Stats
                const { data: leadersData } = await supabase
                    .from('leaders')
                    .select(`
                        full_name,
                        voters(count)
                    `);

                if (leadersData) {
                    setUniqueLeadersCount(leadersData.length);

                    // Sort client side (leaders list is usually manageable < 1000)
                    const formatted = leadersData.map((l: any) => ({
                        name: l.full_name,
                        Votantes: l.voters?.[0]?.count || 0
                    }));
                    formatted.sort((a, b) => b.Votantes - a.Votantes);
                    setTopLeaders(formatted.slice(0, 5));
                }
            } catch (e) {
                console.error("Error loading dashboard extras", e);
            } finally {
                setLoadingExtras(false);
            }
        };

        fetchDashboardExtra();
    }, []);

    // Data for Pie Chart (Data Quality)
    const dataQuality = useMemo(() => {
        const total = stats.total;
        if (total === 0) return [];
        const missingOne = stats.missingPhone + stats.missingAddress + stats.missingVotingPost;
        const complete = Math.max(0, total - (missingOne / 3)); // Approximation since we don't know overlap
        const incomplete = total - complete;

        return [
            { name: 'Datos Completos', value: Math.round(complete), color: '#10b981' },
            { name: 'Por Completar', value: Math.round(incomplete), color: '#fbbf24' },
        ];
    }, [stats]);

    if (isLoading && stats.total === 0) {
        return (
            <div className="container-padding">
                <SkeletonLoader type="text" count={3} />
                <SkeletonLoader type="kpi" count={3} />
                <SkeletonLoader type="card" count={2} />
            </div>
        );
    }

    return (
        <div>
            <AdminHeader
                title="Dashboard de Control"
                description="Monitoreo en tiempo real de la estructura y rendimiento."
            >
                <button
                    onClick={() => refreshVoters()}
                    className="btn btn-header-sync"
                >
                    {isLoading ? 'Sincronizando...' : '🔄 Sincronizar Ahora'}
                </button>
            </AdminHeader>

            {/* KPI CARDS */}
            <div className="grid-stats">
                <div className="card kpi-card kpi-primary">
                    <div className="kpi-icon icon-primary">
                        <Users size={32} />
                    </div>
                    <div>
                        <h3 className="kpi-value">
                            {isLoading ? <span className="opacity-60">...</span> : stats.total}
                        </h3>
                        <p className="kpi-label">Votantes Totales</p>
                    </div>
                </div>

                <div className="card kpi-card kpi-success">
                    <div className="kpi-icon icon-success">
                        <UserCheck size={32} />
                    </div>
                    <div>
                        <h3 className="kpi-value">
                            {loadingExtras ? <span className="opacity-60">...</span> : uniqueLeadersCount}
                        </h3>
                        <p className="kpi-label">Líderes Activos</p>
                    </div>
                </div>

                <div className="card kpi-card kpi-secondary">
                    <div className="kpi-icon icon-secondary">
                        <FileSpreadsheet size={32} />
                    </div>
                    <div>
                        <h3 className="kpi-value">
                            {isLoading ? <span className="opacity-60">...</span> : stats.missingPhone + stats.missingAddress}
                        </h3>
                        <p className="kpi-label">Registros Incompletos</p>
                    </div>
                </div>

                <div className="card kpi-card kpi-danger" style={{ cursor: 'pointer' }} onClick={() => window.location.href = '/admin/missing-data?filter=invalid_cc'}>
                    <div className="kpi-icon icon-danger">
                        <AlertTriangle size={32} />
                    </div>
                    <div>
                        <h3 className="kpi-value">
                            {isLoading ? <span className="opacity-60">...</span> : stats.invalidIds}
                        </h3>
                        <p className="kpi-label">Cédulas Erróneas</p>
                    </div>
                </div>
            </div>

            {/* CHARTS ROW */}
            <div className="grid-charts">
                <div className="card h-400">
                    <div className="flex-between mb-1">
                        <h3 className="m-0">🏆 Top 5 Gestión</h3>
                        <TrendingUp size={20} className="text-muted" />
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

                <div className="card h-400">
                    <div className="flex-between mb-1">
                        <h3 className="m-0">📊 Calidad de la Base</h3>
                        <Activity size={20} className="text-muted" />
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
            <div className="card mt-2 quick-actions-gradient">
                <h3 className="mb-1">⚡ Acciones Rápidas</h3>
                <div className="flex-wrap gap-3">
                    <a href="/admin/import" className="btn btn-primary no-underline">
                        <FileSpreadsheet size={18} />
                        Importar Nuevos Datos
                    </a>
                    <a href="/admin/missing-data" className="btn btn-secondary no-underline">
                        <AlertTriangle size={18} />
                        Gestionar Faltantes
                    </a>
                </div>
            </div>

            {/* INFOGRAPHIC SECTION */}
            <div className="card mt-2 p-0 overflow-hidden no-border">
                <div className="card-header-padding border-bottom">
                    <h3 className="m-0 flex items-center gap-2">
                        📊 Análisis Gráfico Detallado
                    </h3>
                </div>
                <img
                    src={InfographicImage}
                    alt="Infografía de Estadísticas"
                    className="w-full h-auto block"
                />
            </div>
        </div>
    );
}
