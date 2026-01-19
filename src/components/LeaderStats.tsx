import type { LeaderStats } from '../types/leader.types';
import { Users, Target, UserCheck, TrendingUp } from 'lucide-react';

interface LeaderStatsProps {
    stats: LeaderStats;
}

export default function LeaderStatsView({ stats }: LeaderStatsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="card p-4 flex items-center gap-4 border-l-4 border-l-yellow-400">
                <div className="p-3 bg-yellow-400/20 rounded-full text-yellow-400">
                    <Users size={24} />
                </div>
                <div>
                    <p className="text-slate-500 text-sm py-1">Líderes Activos</p>
                    <h3 className="text-2xl font-bold">{stats.activeLeaders}/{stats.totalLeaders}</h3>
                </div>
            </div>

            <div className="card p-4 flex items-center gap-4 border-l-4 border-l-teal-500">
                <div className="p-3 bg-teal-500/20 rounded-full text-teal-400">
                    <UserCheck size={24} />
                </div>
                <div>
                    <p className="text-slate-500 text-sm py-1">Total Votantes</p>
                    <h3 className="text-2xl font-bold">{stats.totalVoters}</h3>
                </div>
            </div>

            <div className="card p-4 flex items-center gap-4 border-l-4 border-l-blue-500">
                <div className="p-3 bg-blue-500/20 rounded-full text-blue-400">
                    <Target size={24} />
                </div>
                <div>
                    <p className="text-slate-500 text-sm py-1">Meta Global</p>
                    <h3 className="text-2xl font-bold">{stats.globalGoal.toLocaleString()}</h3>
                </div>
            </div>

            <div className="card p-4 flex items-center gap-4 border-l-4 border-l-green-500">
                <div className="p-3 bg-green-500/20 rounded-full text-green-400">
                    <TrendingUp size={24} />
                </div>
                <div>
                    <p className="text-slate-500 text-sm py-1">Progreso</p>
                    <h3 className="text-2xl font-bold">{stats.globalProgress.toFixed(1)}%</h3>
                </div>
            </div>
        </div>
    );
}
