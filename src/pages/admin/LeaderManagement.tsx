import { useState, useEffect, useMemo } from 'react';
import { Search, Plus, Upload, Filter, Grid, List as ListIcon } from 'lucide-react';
import AdminHeader from '../../components/AdminHeader';
import LeaderCard from '../../components/LeaderCard';
import LeaderStatsView from '../../components/LeaderStats';
import LeaderModal from '../../components/LeaderModal';
import VoterManagementModal from '../../components/VoterManagementModal';
import ExcelImportModal from '../../components/ExcelImportModal';
import { leaderService } from '../../services/leaderService';
import type { Leader, LeaderStats } from '../../types/leader.types';
import toast from 'react-hot-toast';

export default function LeaderManagement() {
    const [leaders, setLeaders] = useState<Leader[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [searchTerm, setSearchTerm] = useState('');

    // Modals
    const [showLeaderModal, setShowLeaderModal] = useState(false);
    const [showVoterModal, setShowVoterModal] = useState(false);
    const [showImportModal, setShowImportModal] = useState(false);

    const [selectedLeader, setSelectedLeader] = useState<Leader | null>(null);

    const loadData = async () => {
        setIsLoading(true);
        try {
            const data = await leaderService.getLeaders();
            setLeaders(data);
        } catch (error) {
            toast.error('Error cargando líderes');
            console.error(error);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        loadData();
    }, []);

    // Derived Stats
    const stats: LeaderStats = useMemo(() => {
        const totalVoters = leaders.reduce((acc, l) => acc + (l.total_voters || 0), 0);
        const globalGoal = leaders.reduce((acc, l) => acc + (l.goal || 0), 0);
        return {
            totalLeaders: leaders.length,
            activeLeaders: leaders.filter(l => l.active).length,
            totalVoters,
            globalGoal,
            globalProgress: globalGoal > 0 ? (totalVoters / globalGoal) * 100 : 0
        };
    }, [leaders]);

    const filteredLeaders = leaders.filter(l =>
        l.full_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        l.document_number?.includes(searchTerm) ||
        l.zone?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleCreateLeader = async (data: any) => {
        await leaderService.createLeader(data);
        toast.success("Líder creado exitosamente");
        loadData();
    };

    const handleUpdateLeader = async (data: any) => {
        if (!selectedLeader) return;
        await leaderService.updateLeader(selectedLeader.id, data);
        toast.success("Líder actualizado");
        loadData();
    };

    const handleDeleteLeader = async (id: string) => {
        if (!confirm("¿Está seguro de eliminar este líder? Esta acción no se puede deshacer.")) return;
        try {
            await leaderService.deleteLeader(id);
            toast.success("Líder eliminado");
            loadData();
        } catch (error) {
            toast.error("Error al eliminar líder (puede tener votantes asociados)");
        }
    };

    const openCreate = () => {
        setSelectedLeader(null);
        setShowLeaderModal(true);
    };

    const openEdit = (leader: Leader) => {
        setSelectedLeader(leader);
        setShowLeaderModal(true);
    };

    const openManageVoters = (leader: Leader) => {
        setSelectedLeader(leader);
        setShowVoterModal(true);
    };

    return (
        <div className="space-y-6">
            <AdminHeader
                title="Gestión de Estructura"
                description="Administración integral de líderes, metas y votantes."
                actions={
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowImportModal(true)}
                            className="btn btn-secondary flex items-center gap-2"
                        >
                            <Upload size={18} /> Importar
                        </button>
                        <button
                            onClick={openCreate}
                            className="btn btn-primary bg-gradient-to-r from-yellow-600 to-yellow-500 text-slate-900 font-bold border-none shadow-lg shadow-yellow-500/20 flex items-center gap-2"
                        >
                            <Plus size={18} /> Nuevo Líder
                        </button>
                    </div>
                }
            />

            {/* Stats Overview */}
            <LeaderStatsView stats={stats} />

            {/* Filters & Search */}
            <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por nombre, cédula o zona..."
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-slate-800 outline-none focus:border-yellow-500 transition-colors"
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex gap-2">
                    <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
                        <button
                            onClick={() => setViewMode('grid')}
                            className={`p-2 rounded ${viewMode === 'grid' ? 'bg-white shadow text-yellow-600' : 'text-slate-500 hover:text-slate-800'}`}
                            title="Vista en cuadrícula"
                            aria-label="Vista en cuadrícula"
                        >
                            <Grid size={18} />
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={`p-2 rounded ${viewMode === 'list' ? 'bg-white shadow text-yellow-600' : 'text-slate-500 hover:text-slate-800'}`}
                            title="Vista en lista"
                            aria-label="Vista en lista"
                        >
                            <ListIcon size={18} />
                        </button>
                    </div>
                    <button className="btn btn-secondary flex items-center gap-2 text-slate-600 border-slate-200 hover:bg-slate-50">
                        <Filter size={18} /> Filtros
                    </button>
                </div>
            </div>

            {/* Grid / List Content */}
            {isLoading ? (
                <div className="py-20 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500 mx-auto mb-4"></div>
                    <p className="text-slate-500">Cargando estructura...</p>
                </div>
            ) : (
                <>
                    {filteredLeaders.length === 0 ? (
                        <div className="text-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                            <p className="text-slate-500 text-lg">No se encontraron líderes.</p>
                            <button onClick={openCreate} className="mt-4 text-yellow-600 hover:underline">Crear el primero</button>
                        </div>
                    ) : (
                        <div className={viewMode === 'grid' ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6" : "space-y-4"}>
                            {filteredLeaders.map(leader => (
                                <LeaderCard
                                    key={leader.id}
                                    leader={leader}
                                    onEdit={openEdit}
                                    onDelete={handleDeleteLeader}
                                    onManageVoters={openManageVoters}
                                />
                            ))}
                        </div>
                    )}
                </>
            )}

            {/* Modals */}
            {showLeaderModal && (
                <LeaderModal
                    leader={selectedLeader}
                    onClose={() => setShowLeaderModal(false)}
                    onSave={selectedLeader ? handleUpdateLeader : handleCreateLeader}
                />
            )}

            {showVoterModal && selectedLeader && (
                <VoterManagementModal
                    leader={selectedLeader}
                    onClose={() => setShowVoterModal(false)}
                />
            )}

            {showImportModal && (
                <ExcelImportModal
                    type="leaders"
                    onClose={() => setShowImportModal(false)}
                    onSuccess={() => {
                        setShowImportModal(false);
                        loadData();
                    }}
                />
            )}
        </div>
    );
}
