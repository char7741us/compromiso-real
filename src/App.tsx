import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ImportPage from './pages/admin/ImportPage';
import { VoterProvider } from './context/VoterContext';

import DashboardPage from './pages/admin/DashboardPage';
import MissingDataPage from './pages/admin/MissingDataPage';

import AnalysisPage from './pages/admin/AnalysisPage';
import ConsolidatedViewPage from './pages/admin/ConsolidatedViewPage';
import MapPage from './pages/admin/MapPage';

import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';

function App() {
    return (
        <AuthProvider>
            <VoterProvider>
                <Router>
                    <Routes>
                        {/* Public Route */}
                        <Route path="/login" element={<LoginPage />} />

                        {/* Protected Routes */}
                        <Route path="/" element={<ProtectedRoute />}>
                            <Route element={<Layout />}>
                                <Route index element={<Navigate to="/admin/dashboard" replace />} />
                                <Route path="admin/dashboard" element={<DashboardPage />} />
                                <Route path="admin/import" element={<ImportPage />} />
                                <Route path="admin/consolidated" element={<ConsolidatedViewPage />} />
                                <Route path="admin/missing-data" element={<MissingDataPage />} />
                                <Route path="map" element={<MapPage />} />
                                <Route path="analysis" element={<AnalysisPage />} />
                            </Route>
                        </Route>

                        {/* Fallback */}
                        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
                    </Routes>
                </Router>
            </VoterProvider>
        </AuthProvider>
    );
}

export default App;
