import React, { useMemo } from 'react';
import { X, Download, AlertTriangle } from 'lucide-react';
import * as XLSX from 'xlsx';
import { VoterData } from '../context/VoterContext';

interface DuplicateVotersModalProps {
    isOpen: boolean;
    onClose: () => void;
    voters: VoterData[];
}

export default function DuplicateVotersModal({ isOpen, onClose, voters }: DuplicateVotersModalProps) {
    if (!isOpen) return null;

    const duplicates = useMemo(() => {
        const map = new Map<string, VoterData[]>();
        voters.forEach(v => {
            const doc = v['No DE CÉDULA SIN PUNTOS']?.toString().trim();
            if (doc) {
                if (!map.has(doc)) {
                    map.set(doc, []);
                }
                map.get(doc)?.push(v);
            }
        });

        // Filter only those with > 1 entry
        const dups: VoterData[] = [];
        map.forEach((list) => {
            if (list.length > 1) {
                // Add all instances so user can see the conflict
                dups.push(...list);
            }
        });

        // Sort by document number to keep duplicates together
        return dups.sort((a, b) => {
            const docA = a['No DE CÉDULA SIN PUNTOS']?.toString() || '';
            const docB = b['No DE CÉDULA SIN PUNTOS']?.toString() || '';
            return docA.localeCompare(docB);
        });
    }, [voters]);

    const handleExport = () => {
        const ws = XLSX.utils.json_to_sheet(duplicates.map(d => ({
            'Nombre': `${d['NOMBRES'] || ''} ${d['APELLIDOS'] || ''}`,
            'Cédula': d['No DE CÉDULA SIN PUNTOS'],
            'Teléfono': d['TELÉFONO'],
            'Líder': d['LÍDER'],
            'Puesto Votación': d['PUESTO DE VOTACIÓN']
        })));
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Duplicados");
        XLSX.writeFile(wb, "Reporte_Duplicados.xlsx");
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col animate-in fade-in zoom-in duration-200">
                <div className="p-6 border-b border-slate-100 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-yellow-100 text-yellow-600 rounded-lg">
                            <AlertTriangle size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-slate-800">Reporte de Duplicados</h2>
                            <p className="text-sm text-slate-500">{duplicates.length} registros encontrados con el mismo documento.</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                        <X size={20} className="text-slate-500" />
                    </button>
                </div>

                <div className="p-6 overflow-auto flex-1 custom-scrollbar">
                    {duplicates.length === 0 ? (
                        <div className="text-center py-12 text-slate-400">
                            <p>No se encontraron duplicados.</p>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="w-full text-sm text-left">
                                <thead className="text-xs text-slate-500 uppercase bg-slate-50 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-3">Cédula</th>
                                        <th className="px-4 py-3">Nombre Completo</th>
                                        <th className="px-4 py-3">Teléfono</th>
                                        <th className="px-4 py-3">Líder</th>
                                        <th className="px-4 py-3">Puesto</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {duplicates.map((v, i) => (
                                        <tr key={v._id || i} className="border-b border-slate-100 hover:bg-slate-50">
                                            <td className="px-4 py-3 font-medium text-slate-900 bg-yellow-50">{v['No DE CÉDULA SIN PUNTOS']}</td>
                                            <td className="px-4 py-3">{v['NOMBRES']} {v['APELLIDOS']}</td>
                                            <td className="px-4 py-3">{v['TELÉFONO']}</td>
                                            <td className="px-4 py-3">{v['LÍDER']}</td>
                                            <td className="px-4 py-3">{v['PUESTO DE VOTACIÓN']}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>

                <div className="p-6 border-t border-slate-100 flex justify-end">
                    <button
                        onClick={handleExport}
                        disabled={duplicates.length === 0}
                        className="btn btn-primary flex items-center gap-2"
                    >
                        <Download size={18} />
                        Exportar Excel
                    </button>
                </div>
            </div>
        </div>
    );
}
