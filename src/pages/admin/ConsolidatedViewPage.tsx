import { useState, useMemo } from 'react';
import { useVoters } from '../../context/VoterContext';
import { Search, Filter, Download } from 'lucide-react';
import AdminHeader from '../../components/AdminHeader';
import SkeletonLoader from '../../components/SkeletonLoader';

export default function ConsolidatedViewPage() {
    const { voters, isLoading } = useVoters();
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLeader, setSelectedLeader] = useState('Todos');
    const [exportMessage, setExportMessage] = useState('');

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
            if (v.leader_name) uniqueLeaders.add(v.leader_name);
        });
        return Array.from(uniqueLeaders);
    }, [voters]);

    const handleExportCSV = () => {
        if (filteredData.length === 0) return;

        const headers = ["Líder", "Nombres", "Apellidos", "Cédula", "Teléfono", "Dirección", "Barrio", "Puesto", "Mesa"];
        const csvContent = [
            headers.join(','),
            ...filteredData.map(v => [
                v.leader_name,
                v.first_name,
                v.last_name,
                v.document_number,
                v.phone || '',
                v.address || '',
                v.neighborhood || '',
                v.voting_post || '',
                v.voting_table || ''
            ].map(val => `"${val}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `consolidado_votantes_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setExportMessage('¡Exportación exitosa!');
        setTimeout(() => setExportMessage(''), 3000);
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
                    <button className="btn btn-primary" onClick={handleExportCSV} disabled={filteredData.length === 0}>
                        <Download size={20} />
                        Exportar CSV
                    </button>
                }
            />

            {exportMessage && (
                <div className="toast toast-success consolidated-toast">
                    <div className="flex-between gap-2">
                        <span>{exportMessage}</span>
                    </div>
                </div>
            )}

            <div className="card mb-2">
                <div className="flex-wrap items-end">
                    <div className="flex-1 min-w-300">
                        <label className="section-title block mb-1 text-sm">
                            Buscar Votante
                        </label>
                        <div className="relative">
                            <Search size={20} className="search-icon-absolute" />
                            <input
                                type="text"
                                className="search-input pl-11"
                                placeholder="Nombre o cédula..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="w-250">
                        <label className="section-title block mb-1 text-sm">
                            Filtrar por Líder
                        </label>
                        <div className="relative">
                            <Filter size={20} className="search-icon-absolute text-muted" />
                            <select
                                className="search-input pl-11"
                                value={selectedLeader}
                                onChange={(e) => setSelectedLeader(e.target.value)}
                                title="Filtrar por Líder"
                            >
                                <option value="Todos">Todos los líderes</option>
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
