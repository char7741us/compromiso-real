import { LayoutDashboard, Upload, Map as MapIcon, AlertCircle, BarChart3, ListChecks, LogOut } from 'lucide-react';
import { supabase } from '../supabase';
import { NavLink, Outlet } from 'react-router-dom';
import PlatformLogo from '../assets/logo-compromiso-sidebar.png';

export default function Layout() {
    return (
        <div className="app-layout">
            <aside className="sidebar">
                <div className="flex flex-col items-center gap-2 px-2" style={{ marginBottom: '2rem', textAlign: 'center' }}>
                    <img src={PlatformLogo} alt="Logo" style={{ height: '140px', width: 'auto' }} />
                    <h1 style={{ fontSize: '1.2rem', fontWeight: 'bold', color: 'var(--primary-dark)' }}>Compromiso Real</h1>
                </div>

                <nav className="sidebar-nav">
                    <NavLink to="/" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <LayoutDashboard size={20} />
                        <span>Dashboard</span>
                    </NavLink>
                    <NavLink to="/admin/import" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <Upload size={20} />
                        <span>Importar Datos</span>
                    </NavLink>
                    <NavLink to="/admin/consolidated" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <ListChecks size={20} />
                        <span>Consolidado</span>
                    </NavLink>
                    <NavLink to="/admin/missing-data" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <AlertCircle size={20} />
                        <span>Gestión Datos Faltantes</span>
                    </NavLink>
                    <NavLink to="/map" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <MapIcon size={20} />
                        <span>Mapa Territorial</span>
                    </NavLink>
                    <NavLink to="/analysis" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <BarChart3 size={20} />
                        <span>Análisis Líderes</span>
                    </NavLink>
                </nav>

                <div style={{ marginTop: 'auto', padding: '1rem', borderTop: '1px solid rgba(0,0,0,0.05)' }}>
                    <button
                        onClick={() => {
                            supabase.auth.signOut().then(() => window.location.href = '/login');
                        }}
                        className="nav-item flex items-center gap-3 w-full"
                        style={{ border: 'none', background: 'none', cursor: 'pointer', width: '100%' }}
                    >
                        <LogOut size={20} />
                        <span>Cerrar Sesión</span>
                    </button>
                    <div style={{ marginTop: '1rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        v1.0.0
                    </div>
                </div>
            </aside>

            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
}
