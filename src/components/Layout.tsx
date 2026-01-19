import { useState, useEffect } from 'react';
import { LayoutDashboard, Upload, Map as MapIcon, AlertCircle, BarChart3, ListChecks, LogOut, Users, BookOpen, Menu, X } from 'lucide-react';
import { supabase } from '../supabase';
import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { appConfig } from '../config/appConfig';

export default function Layout() {
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const location = useLocation();

    // Close sidebar on route change (mobile)
    useEffect(() => {
        setIsSidebarOpen(false);
    }, [location]);

    return (
        <div className="app-layout">
            {/* Mobile Header */}
            <header className="mobile-header lg:hidden">
                <button
                    onClick={() => setIsSidebarOpen(true)}
                    className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                    aria-label="Abrir menú"
                    title="Abrir menú"
                >
                    <Menu size={24} />
                </button>
                <div className="flex items-center gap-2">
                    <img src={appConfig.assets.sidebarLogo} alt="Logo" className="h-8 w-auto" />
                    <span className="font-bold text-slate-800">{appConfig.brand.name}</span>
                </div>
            </header>

            {/* Mobile Overlay */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-sm transition-opacity"
                    onClick={() => setIsSidebarOpen(false)}
                />
            )}

            <aside className={`sidebar ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
                <div className="sidebar-header flex justify-between items-center lg:block">
                    <div className="w-full relative">
                        {/* Close button for mobile */}
                        <button
                            onClick={() => setIsSidebarOpen(false)}
                            className="absolute right-0 top-0 lg:hidden p-2 text-slate-400 hover:text-slate-600"
                            aria-label="Cerrar menú"
                            title="Cerrar menú"
                        >
                            <X size={20} />
                        </button>
                        <img src={appConfig.assets.sidebarLogo} alt="Logo" className="sidebar-logo mx-auto" />
                        <h1 className="sidebar-title mt-2 text-center">{appConfig.brand.name}</h1>
                    </div>
                </div>

                <nav className="sidebar-nav flex-1 overflow-y-auto">
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
                    <div className="sidebar-version text-center">
                        v{appConfig.brand.version}
                    </div>
                </div>
            </aside>

            <main className="main-content">
                <Outlet />
            </main>
        </div>
    );
}
