import { useMemo, useRef, useState } from 'react';
import { useVoters } from '../../context/VoterContext';
import { Users, UserCheck, FileSpreadsheet, AlertTriangle, TrendingUp, Activity, Download, MapPin, Target } from 'lucide-react';
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend
} from 'recharts';
import AdminHeader from '../../components/AdminHeader';
import SkeletonLoader from '../../components/SkeletonLoader';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { appConfig } from '../../config/appConfig';
import toast from 'react-hot-toast';
import DuplicateVotersModal from '../../components/DuplicateVotersModal';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export default function DashboardPage() {
    const { stats, voters, isLoading, refreshVoters } = useVoters();
    const dashboardRef = useRef<HTMLDivElement>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [isDuplicateModalOpen, setIsDuplicateModalOpen] = useState(false);

    // --- ANALYTICS DATA ---

    // 1. Unique Leaders Count
    const uniqueLeaders = useMemo(() => {
        return new Set(voters.map(v => v['LÍDER']?.trim()).filter(Boolean)).size;
    }, [voters]);

    // 2. Data Quality (Pie Chart)
    const dataQuality = useMemo(() => {
        const total = stats.total;
        if (total === 0) return [];
        const missingOne = stats.missingPhone + stats.missingAddress + stats.missingVotingPost;
        const complete = Math.max(0, total - (missingOne / 3)); // Aproximación
        const incomplete = total - complete;

        return [
            { name: 'Datos Completos', value: Math.round(complete), color: '#10b981' }, // Emerald
            { name: 'Por Completar', value: Math.round(incomplete), color: '#f59e0b' }, // Amber
        ];
    }, [stats]);

    // 3. Top Leaders Management (Bar Chart)
    const topLeaders = useMemo(() => {
        const counts: Record<string, number> = {};
        voters.forEach(v => {
            const l = v['LÍDER']?.trim() || 'Sin Asignar';
            counts[l] = (counts[l] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([name, count]) => ({ name, Votantes: count }))
            .sort((a, b) => b.Votantes - a.Votantes)
            .slice(0, 10);
    }, [voters]);

    // 4. Zone Distribution (Pie/Bar)
    const zoneStats = useMemo(() => {
        const counts: Record<string, number> = {};
        voters.forEach(v => {
            const z = v['leader_zone']?.trim() || 'Sin Zona';
            counts[z] = (counts[z] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 8); // Top 8 Zones
    }, [voters]);

    // 5. Voting Post Analysis (Bar)
    const votingPostStats = useMemo(() => {
        const counts: Record<string, number> = {};
        voters.forEach(v => {
            const p = v['PUESTO DE VOTACIÓN']?.trim() || 'Sin Puesto';
            counts[p] = (counts[p] || 0) + 1;
        });
        return Object.entries(counts)
            .map(([name, Votantes]) => ({ name, Votantes }))
            .sort((a, b) => b.Votantes - a.Votantes)
            .slice(0, 10);
    }, [voters]);

    // --- DUPLICATE CALCULATION ---
    const duplicatesCount = useMemo(() => {
        const map = new Map<string, number>();
        voters.forEach(v => {
            const doc = v['No DE CÉDULA SIN PUNTOS']?.toString().trim();
            if (doc) {
                map.set(doc, (map.get(doc) || 0) + 1);
            }
        });

        // Count how many records are involved in duplicates
        let count = 0;
        map.forEach((qty) => {
            if (qty > 1) {
                count += qty;
            }
        });
        return count;
    }, [voters]);


    // --- EXPORT FUNCTION ---
    const handleDownloadReport = async () => {
        if (!dashboardRef.current) return;
        setIsExporting(true);
        const toastId = toast.loading('Generando informe PDF...');

        try {
            // Wait for icons/fonts
            await new Promise(r => setTimeout(r, 800));

            const canvas = await html2canvas(dashboardRef.current, {
                scale: 2, // High resolution
                useCORS: true,
                logging: false,
                backgroundColor: '#f8fafc' // Slate-50
            });

            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: 'a4'
            });

            const imgWidth = 297; // A4 Landscape width
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            // Generate Filename
            const date = new Date().toISOString().split('T')[0];
            const filename = `Informe_Control_Electoral_${date}.pdf`;

            pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
            pdf.save(filename);

            toast.success('Informe descargado correctamente', { id: toastId });
        } catch (error) {
            console.error(error);
            toast.error('Error generando el informe', { id: toastId });
        } finally {
            setIsExporting(false);
        }
    };

    if (isLoading && voters.length === 0) {
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
                description="Análisis estratégico y rendimiento de la estructura."
            >
                <div className="flex gap-2">
                    <button
                        onClick={handleDownloadReport}
                        disabled={isExporting}
                        className="btn btn-secondary flex items-center gap-2"
                    >
                        {isExporting ? <span className="loader-sm"></span> : <Download size={18} />}
                        Descargar Informe
                    </button>
                    <button
                        onClick={() => refreshVoters()}
                        className="btn btn-header-sync"
                    >
                        🔄 Sincronizar
                    </button>
                </div>
            </AdminHeader>

            {/* REPORT CONTAINER */}
            <div ref={dashboardRef} className="pb-8 bg-slate-50 min-h-screen">

                {/* Header for PDF only (Visual context) */}
                <div className="hidden print-header mb-6 p-6 bg-white border-b border-slate-200">
                    <h1 className="text-3xl font-bold text-slate-800">{appConfig.brand.name}</h1>
                    <p className="text-slate-500">Informe de Estado Detallado - {new Date().toLocaleDateString()}</p>
                </div>

                {/* KPI CARDS */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="card p-4 flex items-center gap-4 border-l-4 border-l-blue-600 shadow-sm hover:shadow-md transition-shadow">
                        <div className="p-3 bg-blue-100 rounded-full text-blue-600 flex items-center justify-center flex-shrink-0">
                            <Users size={28} />
                        </div>
                        <div>
                            <h3 className="text-3xl font-bold text-slate-800">{stats.total.toLocaleString()}</h3>
                            <p className="text-sm font-medium text-slate-500">Votantes Totales</p>
                        </div>
                    </div>

                    <div className="card p-4 flex items-center gap-4 border-l-4 border-l-teal-500 shadow-sm hover:shadow-md transition-shadow">
                        <div className="p-3 bg-teal-100 rounded-full text-teal-600 flex items-center justify-center flex-shrink-0">
                            <UserCheck size={28} />
                        </div>
                        <div>
                            <h3 className="text-3xl font-bold text-slate-800">{uniqueLeaders.toLocaleString()}</h3>
                            <p className="text-sm font-medium text-slate-500">Líderes Activos</p>
                        </div>
                    </div>

                    <div className="card p-4 flex items-center gap-4 border-l-4 border-l-lime-500 shadow-sm hover:shadow-md transition-shadow">
                        <div className="p-3 bg-lime-100 rounded-full text-lime-600 flex items-center justify-center flex-shrink-0">
                            <Target size={28} />
                        </div>
                        <div>
                            <h3 className="text-3xl font-bold text-slate-800">
                                {dataQuality.find(d => d.name === 'Datos Completos')?.value.toLocaleString()}
                            </h3>
                            <p className="text-sm font-medium text-slate-500">Registros Completos</p>
                        </div>
                    </div>

                    <div className="card p-4 flex items-center gap-4 border-l-4 border-l-red-500 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => window.location.href = '/admin/missing-data'}>
                        <div className="p-3 bg-red-100 rounded-full text-red-600 flex items-center justify-center flex-shrink-0">
                            <AlertTriangle size={28} />
                        </div>
                        <div>
                            <h3 className="text-3xl font-bold text-slate-800">{stats.missingVotingPost.toLocaleString()}</h3>
                            <p className="text-sm font-medium text-slate-500">Sin Puesto Votación</p>
                        </div>
                    </div>
                </div>

                {/* MAIN CHARTS GRID */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* 1. TOP LEADERS */}
                    <div className="card p-5 h-[400px]">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                <TrendingUp size={20} className="text-yellow-600" /> Top Líderes
                            </h3>
                            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">Volumen</span>
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={topLeaders} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                                <XAxis type="number" hide />
                                <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 11, fill: '#64748b' }} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                    cursor={{ fill: '#f8fafc' }}
                                />
                                <Bar dataKey="Votantes" fill="#0f172a" radius={[0, 4, 4, 0]} barSize={18}>
                                    {topLeaders.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={index < 3 ? '#eab308' : '#334155'} />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* 2. ZONE DISTRIBUTION */}
                    <div className="card p-5 h-[400px]">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                <MapPin size={20} className="text-teal-600" /> Distribución por Zonas
                            </h3>
                            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">Top 8</span>
                        </div>
                        <div className="flex">
                            <div className="w-2/3 h-[300px]">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={zoneStats}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={2}
                                            dataKey="value"
                                        >
                                            {zoneStats.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                            <div className="w-1/3 flex flex-col justify-center gap-2 text-xs overflow-y-auto max-h-[300px] custom-scrollbar">
                                {zoneStats.map((z, i) => (
                                    <div key={i} className="flex items-center gap-2">
                                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }}></div>
                                        <span className="text-slate-600 truncate flex-1" title={z.name}>{z.name}</span>
                                        <span className="font-bold text-slate-800">{z.value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* 3. VOTING POSTS */}
                    <div className="card p-5 h-[400px]">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                <FileSpreadsheet size={20} className="text-blue-600" /> Puestos de Votación
                            </h3>
                            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">Top 10</span>
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={votingPostStats} margin={{ top: 20, right: 30, left: 20, bottom: 50 }}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                                <XAxis
                                    dataKey="name"
                                    angle={-45}
                                    textAnchor="end"
                                    height={80}
                                    tick={{ fontSize: 10, fill: '#64748b' }}
                                    interval={0}
                                />
                                <YAxis tick={{ fontSize: 11, fill: '#64748b' }} />
                                <Tooltip
                                    cursor={{ fill: '#f8fafc' }}
                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                />
                                <Bar dataKey="Votantes" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={30} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>

                    {/* 4. DATA QUALITY */}
                    <div className="card p-5 h-[400px]">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                                <Activity size={20} className="text-emerald-500" /> Calidad de Datos
                            </h3>
                            <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">Total</span>
                        </div>
                        <ResponsiveContainer width="100%" height={300}>
                            <PieChart>
                                <Pie
                                    data={dataQuality}
                                    cx="50%"
                                    cy="50%"
                                    startAngle={180}
                                    endAngle={0}
                                    innerRadius={80}
                                    outerRadius={120}
                                    paddingAngle={0}
                                    dataKey="value"
                                >
                                    {dataQuality.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                                <Legend verticalAlign="bottom" height={36} iconType="circle" />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="text-center mt-[-40px]">
                            <h4 className="text-2xl font-bold text-slate-800">{Math.round((dataQuality[0].value / stats.total) * 100) || 0}%</h4>
                            <p className="text-xs text-slate-500">Datos Completos</p>
                        </div>
                    </div>

                </div>

                {/* FOOTER METRICS */}
                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4 px-1">
                    <div className="bg-slate-100 rounded-lg p-3 text-center border border-slate-200">
                        <span className="block text-xs text-slate-500 uppercase font-bold">Sin Teléfono</span>
                        <span className="text-lg font-bold text-slate-700">{stats.missingPhone}</span>
                    </div>
                    <div className="bg-slate-100 rounded-lg p-3 text-center border border-slate-200">
                        <span className="block text-xs text-slate-500 uppercase font-bold">Sin Dirección</span>
                        <span className="text-lg font-bold text-slate-700">{stats.missingAddress}</span>
                    </div>
                    <div className="bg-red-50 rounded-lg p-3 text-center border border-red-100">
                        <span className="block text-xs text-red-500 uppercase font-bold">Cédulas Erróneas</span>
                        <span className="text-lg font-bold text-red-700">{stats.invalidIds}</span>
                    </div>
                    <div
                        className="bg-yellow-50 rounded-lg p-3 text-center border border-yellow-100 cursor-pointer hover:bg-yellow-100 transition-colors"
                        onClick={() => setIsDuplicateModalOpen(true)}
                    >
                        <span className="block text-xs text-yellow-600 uppercase font-bold">Duplicados Potenciales</span>
                        <span className="text-lg font-bold text-yellow-700">{duplicatesCount}</span>
                    </div>
                </div>

            </div>

            {/* MODALS */}
            <DuplicateVotersModal
                isOpen={isDuplicateModalOpen}
                onClose={() => setIsDuplicateModalOpen(false)}
                voters={voters}
            />
        </div>
    );
}
