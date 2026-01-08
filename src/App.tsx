import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ImportPage from './pages/admin/ImportPage';
import { VoterProvider } from './context/VoterContext';

import DashboardPage from './pages/admin/DashboardPage';
import MissingDataPage from './pages/admin/MissingDataPage';

import AnalysisPage from './pages/admin/AnalysisPage';
import ConsolidatedViewPage from './pages/admin/ConsolidatedViewPage';

// Placeholder pages for things not yet built
const MapPage = () => <div><h2 className="page-title">Mapa Territorial</h2><p>Visualización geográfica próximamente.</p></div>;

function App() {
    return (
        <VoterProvider>
            <Router>
                <Routes>
                    <Route path="/" element={<Layout />}>
                        <Route index element={<Navigate to="/admin/dashboard" replace />} />
                        <Route path="admin/dashboard" element={<DashboardPage />} />
                        <Route path="admin/import" element={<ImportPage />} />
                        <Route path="admin/consolidated" element={<ConsolidatedViewPage />} />
                        <Route path="admin/missing-data" element={<MissingDataPage />} />
                        <Route path="map" element={<MapPage />} />
                        <Route path="analysis" element={<AnalysisPage />} />
                        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
                    </Route>
                </Routes>
            </Router>
        </VoterProvider>
    );
}

export default App;
