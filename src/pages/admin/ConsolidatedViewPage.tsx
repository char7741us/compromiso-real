import { useState, useMemo } from 'react';
import { useVoters, type VoterData } from '../../context/VoterContext';
import { Search, Filter, FileText, FileSpreadsheet, Loader2 } from 'lucide-react';
import AdminHeader from '../../components/AdminHeader';
import SkeletonLoader from '../../components/SkeletonLoader';
import toast from 'react-hot-toast';
import { generateLeaderPDF, generateLeaderExcel, generateAllReportsZip } from '../../utils/reportGenerator';

export default function ConsolidatedViewPage() {
    const { voters, isLoading } = useVoters();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLeader, setSelectedLeader] = useState('Todos');
    const [isGenerating, setIsGenerating] = useState(false);

    const filteredData = useMemo(() => {
        return voters.filter(voter => {
            const matchesSearch = (
                (voter.first_name + ' ' + voter.last_name).toLowerCase().includes(searchTerm.toLowerCase()) ||
                voter.document_number.includes(searchTerm)
            );
            const matchesLeader = selectedLeader === 'Todos' || voter.leader_name === selectedLeader;
            return matchesSearch && matchesLeader;
        });
    }, [voters, searchTerm, selectedLeader]);

    const leaders = useMemo(() => {
        const uniqueLeaders = new Set<string>();
        voters.forEach(v => {
            const name = v.leader_name || v['LÍDER'] || 'Sin Asignar';
            uniqueLeaders.add(name);
        });
        return Array.from(uniqueLeaders);
    }, [voters]);

    // Group voters by leader for bulk export
    const votersByLeader = useMemo(() => {
        const groups: Record<string, VoterData[]> = {};
        leaders.forEach(leader => {
            groups[leader] = voters.filter(v => (v.leader_name || v['LÍDER'] || 'Sin Asignar') === leader);
        });
        return groups;
    }, [voters, leaders]);

    const handleDownloadReport = async (type: 'pdf' | 'excel') => {
        setIsGenerating(true);
        const toastId = toast.loading('Generando reporte...');

        try {
            if (selectedLeader !== 'Todos') {
                // Single Leader Report
                if (type === 'pdf') {
                    const doc = generateLeaderPDF(selectedLeader, filteredData);
                    doc.save(`Reporte_${selectedLeader.replace(/ /g, '_')}.pdf`);
                } else {
                    const buffer = generateLeaderExcel(selectedLeader, filteredData);
                    const blob = new Blob([buffer as any], { type: 'application/octet-stream' });
                    const link = document.createElement("a");
                    link.href = URL.createObjectURL(blob);
                    link.download = `Reporte_${selectedLeader.replace(/ /g, '_')}.xlsx`;
                    link.click();
                }
                toast.success('Reporte descargado', { id: toastId });
            } else {
                // Bulk ZIP Export
                const zipBlob = await generateAllReportsZip(votersByLeader, type === 'pdf' ? 'pdf' : 'xlsx');
                const link = document.createElement("a");
                link.href = URL.createObjectURL(zipBlob);
                link.download = `Reportes_Lideres_${type.toUpperCase()}_${new Date().toISOString().split('T')[0]}.zip`;
                link.click();
                toast.success('Archivo ZIP descargado con todos los reportes', { id: toastId });
            }
        } catch (error) {
            console.error(error);
            toast.error('Error al generar el reporte', { id: toastId });
        } finally {
            setIsGenerating(false);
        }
    };

    if (isLoading && voters.length === 0) {
        return (
            <div className="container-padding">
                <SkeletonLoader type="text" count={2} />
                <SkeletonLoader type="table" count={10} />
            </div>
        );
    }

    return (
        <div className="consolidated-page">
            <AdminHeader
                title="Consolidado General"
                description="Vista unificada de todos los votantes registrados y sus líderes."
                actions={
                    <div className="flex gap-2">
                        <button
                            className="btn btn-secondary flex items-center gap-2"
                            onClick={() => handleDownloadReport('pdf')}
                            disabled={isGenerating || filteredData.length === 0}
                            title={selectedLeader === 'Todos' ? "Descargar Todos (ZIP)" : "Descargar PDF"}
                        >
                            {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <FileText size={18} />}
                            {selectedLeader === 'Todos' ? 'ZIP PDFs' : 'PDF'}
                        </button>
                        <button
                            className="btn btn-success flex items-center gap-2"
                            onClick={() => handleDownloadReport('excel')}
                            disabled={isGenerating || filteredData.length === 0}
                            title={selectedLeader === 'Todos' ? "Descargar Todos (ZIP)" : "Descargar Excel"}
                            style={{ backgroundColor: '#217346', color: 'white', border: 'none' }}
                        >
                            {isGenerating ? <Loader2 className="animate-spin" size={18} /> : <FileSpreadsheet size={18} />}
                            {selectedLeader === 'Todos' ? 'ZIP Excel' : 'Excel'}
                        </button>
                    </div>
                }
            />

            <div className="card mb-2">
                <div className="flex-wrap items-end" style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end' }}>
                    <div className="flex-1 min-w-300">
                        <label className="section-title block mb-1 text-sm">
                            Buscar Votante
                        </label>
                        <div className="relative">
                            <Search size={20} className="search-icon-absolute" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
                            <input
                                type="text"
                                className="search-input pl-11"
                                style={{ paddingLeft: '2.5rem', width: '100%', padding: '0.5rem 0.5rem 0.5rem 2.5rem', borderRadius: '6px', border: '1px solid #ddd' }}
                                placeholder="Nombre o cédula..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="w-250" style={{ minWidth: '250px' }}>
                        <label className="section-title block mb-1 text-sm">
                            Filtrar por Líder
                        </label>
                        <div className="relative">
                            <Filter size={20} className="search-icon-absolute text-muted" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
                            <select
                                className="search-input pl-11"
                                style={{ paddingLeft: '2.5rem', width: '100%', padding: '0.5rem 0.5rem 0.5rem 2.5rem', borderRadius: '6px', border: '1px solid #ddd' }}
                                value={selectedLeader}
                                onChange={(e) => setSelectedLeader(e.target.value)}
                                title="Filtrar por Líder"
                            >
                                <option value="Todos">Todos los líderes (Descarga ZIP)</option>
                                {leaders.sort().map(leader => (
                                    <option key={leader} value={leader}>{leader}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            <div className="table-container">
                {isLoading ? (
                    <div className="container-padding">
                        <SkeletonLoader type="table" count={10} />
                    </div>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>Nombre Completo</th>
                                <th>Cédula</th>
                                <th>Líder Asignado</th>
                                <th>Municipio</th>
                                <th>Puesto</th>
                                <th>Mesa</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredData.length > 0 ? (
                                filteredData.map((voter) => (
                                    <tr key={voter.id}>
                                        <td className="font-600">{voter.first_name || ''} {voter.last_name || ''}</td>
                                        <td className="text-muted">{voter.document_number}</td>
                                        <td>
                                            <span className="badge badge-success">
                                                {voter.leader_name}
                                            </span>
                                        </td>
                                        <td>{voter.municipality || 'Atlántico'}</td>
                                        <td className="text-sm">{voter.voting_post || 'N/A'}</td>
                                        <td>
                                            <span className="badge badge-subtle">
                                                {voter.voting_table || '-'}
                                            </span>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={6} className="text-center padding-3rem text-muted">
                                        No se encontraron votantes con los filtros seleccionados.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                )}
            </div>

            <div className="mt-1 text-muted text-sm font-500">
                Mostrando {filteredData.length} de {voters.length} votantes registrados.
            </div>
        </div>
    );
}
