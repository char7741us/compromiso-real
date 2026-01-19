import { LayoutDashboard, Upload, Map as MapIcon, AlertCircle, BarChart3, ListChecks, LogOut, Users, BookOpen } from 'lucide-react';
import { supabase } from '../supabase';
import { NavLink, Outlet } from 'react-router-dom';
import PlatformLogo from '../assets/logo-compromiso-sidebar.png';

export default function Layout() {
    return (
        <div className="app-layout">
            <aside className="sidebar">
                <div className="sidebar-header">
                    <img src={PlatformLogo} alt="Logo" className="sidebar-logo" />
                    <h1 className="sidebar-title">Compromiso Real</h1>
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
                    <NavLink to="/admin/leaders" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <Users size={20} />
                        <span>Gestión Líderes</span>
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
                    <NavLink to="/admin/instructions" className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}>
                        <BookOpen size={20} />
                        <span>Instructivo</span>
                    </NavLink>
                </nav>

                <div className="sidebar-footer">
                    <button
                        onClick={() => {
                            supabase.auth.signOut().then(() => window.location.href = '/login');
                        }}
                        className="nav-item flex items-center gap-3 w-full sidebar-logout"
                    >
                        <LogOut size={20} />
                        <span>Cerrar Sesión</span>
                    </button>
                    <div className="sidebar-version">
                        v2.0
                    </div>
                </div>
            </aside>

            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
}
