import type { Leader } from '../types/leader.types';
import { Users, Edit2, Trash2, Phone, MapPin, Target } from 'lucide-react';

interface LeaderCardProps {
    leader: Leader;
    onEdit: (leader: Leader) => void;
    onDelete: (id: string) => void;
    onManageVoters: (leader: Leader) => void;
}

export default function LeaderCard({ leader, onEdit, onDelete, onManageVoters }: LeaderCardProps) {
    const isGoalMet = (leader.goal_progress || 0) >= 100;

    return (
        <div className={`card group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-yellow-500/10 hover:border-yellow-500/50 bg-white border border-slate-200 ${!leader.active ? 'opacity-80 border-red-200' : ''}`}>
            {!leader.active && (
                <>
                    {/* Corner badge */}
                    <div className="absolute top-3 right-3 bg-red-500 text-white text-xs px-3 py-1 rounded-full font-semibold shadow-md z-10">
                        ⊘ Inactivo
                    </div>
                    {/* Diagonal banner */}
                    <div className="absolute top-0 left-0 w-full h-1 bg-red-500"></div>
                </>
            )}

            <div className="flex flex-col items-center p-4">
                {/* Avatar */}
                <div className="w-20 h-20 rounded-full bg-slate-50 border-2 border-yellow-500/30 flex items-center justify-center mb-3 overflow-hidden shadow-lg relative">
                    {leader.photo_url ? (
                        <img src={leader.photo_url} alt={leader.full_name} className="w-full h-full object-cover" />
                    ) : (
                        <span className="text-2xl font-bold text-yellow-500">{leader.full_name.charAt(0)}</span>
                    )}
                </div>

                {/* Info */}
                <h3 className="font-bold text-lg text-center truncate w-full text-slate-800" title={leader.full_name}>
                    {leader.full_name}
                </h3>
                <p className="text-xs text-slate-500 mb-1">{leader.document_number || 'S/N'}</p>

                {/* Stats */}
                <div className="w-full grid grid-cols-2 gap-2 mt-3 text-sm">
                    <div className="flex items-center gap-1 text-slate-600 bg-slate-100 p-1.5 rounded justify-center">
                        <Users size={14} className="text-teal-600" />
                        <span>{leader.total_voters}</span>
                    </div>
                    <div className="flex items-center gap-1 text-slate-600 bg-slate-100 p-1.5 rounded justify-center">
                        <Target size={14} className="text-blue-600" />
                        <span>{leader.goal || 0}</span>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full mt-3">
                    <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-500">Meta</span>
                        <span className={isGoalMet ? 'text-green-600' : 'text-yellow-600'}>
                            {leader.goal_progress?.toFixed(0)}%
                        </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${isGoalMet ? 'bg-green-500' : 'bg-gradient-to-r from-yellow-600 to-yellow-400'}`}
                            style={{ width: `${Math.min(leader.goal_progress || 0, 100)}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Expanded details on hover (optional or just footer) */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 text-sm space-y-1">
                {leader.zone && <div className="flex items-center gap-2 text-slate-500"><MapPin size={12} /> {leader.zone} - {leader.municipality}</div>}
                {leader.phone && <div className="flex items-center gap-2 text-slate-500"><Phone size={12} /> {leader.phone}</div>}
            </div>

            {/* Actions */}
            <div className="p-3 flex gap-2 justify-between bg-white border-t border-slate-200">
                <button
                    onClick={() => onManageVoters(leader)}
                    className="flex-1 btn btn-primary text-xs py-1.5 flex items-center justify-center gap-1 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 border-none text-white"
                >
                    <Users size={14} /> Gestionar
                </button>
                <div className="flex gap-1">
                    <button onClick={() => onEdit(leader)} className="p-2 hover:bg-slate-100 rounded text-yellow-600 transition-colors" title="Editar líder" aria-label="Editar líder">
                        <Edit2 size={16} />
                    </button>
                    <button onClick={() => onDelete(leader.id)} className="p-2 hover:bg-slate-100 rounded text-red-500 transition-colors" title="Eliminar líder" aria-label="Eliminar líder">
                        <Trash2 size={16} />
                    </button>
                </div>
            </div>
        </div>
    );
}
