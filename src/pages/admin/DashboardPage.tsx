import { useEffect, useMemo, useState } from 'react';
import { useVoters } from '../../context/VoterContext';
import { Users, UserCheck, FileSpreadsheet, AlertTriangle, TrendingUp, Activity } from 'lucide-react';
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
    Legend
} from 'recharts';
import InfographicImage from '../../assets/infographic-stats.jpg';
import AdminHeader from '../../components/AdminHeader';
import SkeletonLoader from '../../components/SkeletonLoader';
import { supabase } from '../../supabase';

export default function DashboardPage() {
    const { stats, fetchGlobalStats, isLoading } = useVoters();
    const [activeLeadersCount, setActiveLeadersCount] = useState(0);

    useEffect(() => {
        fetchGlobalStats();
        fetchActiveLeaders();
    }, []);

    const fetchActiveLeaders = async () => {
        const { count } = await supabase.from('leaders').select('*', { count: 'exact', head: true });
        if (count !== null) setActiveLeadersCount(count);
    };

    // Data for Pie Chart (Data Quality)
    const dataQuality = useMemo(() => {
        const total = stats.total;
        if (total === 0) return [];
        const missingOne = stats.missingPhone + stats.missingAddress + stats.missingVotingPost;
        const complete = Math.max(0, total - (missingOne / 3));
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
                    onClick={() => { fetchGlobalStats(); fetchActiveLeaders(); }}
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
                            {stats.total}
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
                            {activeLeadersCount}
                        </h3>
                        <p className="kpi-label">Líderes Registrados</p>
                    </div>
                </div>

                <div className="card kpi-card kpi-secondary">
                    <div className="kpi-icon icon-secondary">
                        <FileSpreadsheet size={32} />
                    </div>
                    <div>
                        <h3 className="kpi-value">
                            {stats.missingPhone + stats.missingAddress}
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
                            {stats.invalidIds}
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
                   <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '300px', color: '#64748b', textAlign: 'center' }}>
                       <p>Gráfica desactivada para optimizar rendimiento masivo.<br/>Consulte la sección de análisis.</p>
                   </div>
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
