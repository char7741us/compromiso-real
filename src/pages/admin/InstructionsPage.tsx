import {
    ExternalLink,
    Upload,
    AlertTriangle,
    Save,
    MousePointer2,
    LayoutDashboard,
    Search,
    Globe,
    ListChecks
} from 'lucide-react';
import AdminHeader from '../../components/AdminHeader';

export default function InstructionsPage() {
    return (
        <div className="instructions-container">
            <AdminHeader
                title="📘 Manual de Usuario: Plataforma 'Compromiso Real'"
                description="Guía paso a paso para administrar la base de datos de votantes y líderes de manera eficiente."
            />

            <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', gap: '30px' }}>

                {/* 1. ACCESO */}
                <section className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px' }}>
                        <Globe color="var(--primary)" size={24} />
                        <h2 style={{ margin: 0, fontSize: '1.4rem' }}>1. Acceso a la Plataforma</h2>
                    </div>
                    <p>Asegúrate de tener una conexión a internet estable e ingresa desde tu computadora o celular a:</p>
                    <div style={{
                        background: '#f8fafc',
                        padding: '15px',
                        borderRadius: '8px',
                        border: '1px solid #e2e8f0',
                        marginTop: '10px',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <code style={{ fontSize: '1.1rem', color: 'var(--primary)', fontWeight: 'bold' }}>
                            https://compromiso-real.vercel.app
                        </code>
                        <a
                            href="https://compromiso-real.vercel.app"
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-secondary"
                            style={{ padding: '8px 16px' }}
                        >
                            <ExternalLink size={16} /> Abrir
                        </a>
                    </div>
                </section>

                {/* 2. CARGA MASIVA */}
                <section className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                        <Upload color="var(--primary)" size={24} />
                        <h2 style={{ margin: 0, fontSize: '1.4rem' }}>2. Cómo Cargar Nuevos Votantes (Carga Masiva)</h2>
                    </div>

                    <div className="instruction-step">
                        <h3 style={{ fontSize: '1.1rem', color: 'var(--primary)', marginBottom: '10px' }}>Paso 1: Ir a "Importar Datos"</h3>
                        <p>En el menú lateral izquierdo, haz clic en <strong>"Importar Datos"</strong> o escribe <code>/admin/import</code> al final de la dirección web.</p>
                    </div>

                    <div className="instruction-step" style={{ marginTop: '20px' }}>
                        <h3 style={{ fontSize: '1.1rem', color: 'var(--primary)', marginBottom: '10px' }}>Paso 2: Preparar tu Archivo (Formato Crítico)</h3>
                        <p>Para que el sistema reconozca la información, tu archivo debe cumplir estas condiciones:</p>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginTop: '15px' }}>
                            <div style={{ background: '#fffbeb', padding: '15px', borderRadius: '8px', borderLeft: '4px solid var(--warning)' }}>
                                <strong style={{ color: '#92400e' }}>Formato de Guardado:</strong>
                                <p style={{ fontSize: '0.9rem', color: '#92400e', marginTop: '5px' }}>
                                    Debe ser <strong>CSV UTF-8 (delimitado por comas)</strong>.
                                    <br /><br />
                                    <em>Tip: En Excel, ve a "Guardar como" y selecciona exactamente esa opción para que las tildes y la "ñ" no se dañen.</em>
                                </p>
                            </div>
                            <div style={{ background: '#f0f9ff', padding: '15px', borderRadius: '8px', borderLeft: '4px solid #0ea5e9' }}>
                                <strong style={{ color: '#0369a1' }}>Columnas:</strong>
                                <p style={{ fontSize: '0.9rem', color: '#0369a1', marginTop: '5px' }}>
                                    El archivo debe tener estos encabezados exactos:
                                    <br />
                                    <code style={{ fontSize: '0.75rem', display: 'block', marginTop: '5px', lineHeight: '1.4' }}>
                                        LÍDER, NOMBRES, APELLIDOS, No DE CÉDULA SIN PUNTOS, TELÉFONO, DIRECCIÓN DE RESIDENCIA, MUNICIPIO VOTACIÓN, PUESTO DE VOTACIÓN, DIRECCIÓN (Pto de votación), MESA
                                    </code>
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="instruction-step" style={{ marginTop: '20px' }}>
                        <h3 style={{ fontSize: '1.1rem', color: 'var(--primary)', marginBottom: '10px' }}>Paso 3: Cargar el Archivo</h3>
                        <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <li>Arrastra tu archivo .csv al área de carga o haz clic para seleccionarlo.</li>
                            <li>Revisa la <strong>Vista Previa</strong> que aparecerá en pantalla.</li>
                            <li>Haz clic en el botón <strong>"Importar a Supabase"</strong>.</li>
                        </ul>
                        <div style={{ marginTop: '15px', padding: '10px', background: '#f8fafc', borderRadius: '6px', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                            <strong>Nota:</strong> Si un votante ya existe (misma cédula), el sistema no lo duplica, sino que actualiza sus datos.
                        </div>
                    </div>
                </section>

                {/* 3. GESTION Y CORRECCION */}
                <section className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                        <MousePointer2 color="var(--primary)" size={24} />
                        <h2 style={{ margin: 0, fontSize: '1.4rem' }}>3. Gestión y Corrección de Datos</h2>
                    </div>

                    <div className="instruction-step">
                        <h3 style={{ fontSize: '1.1rem', color: 'var(--primary)', marginBottom: '10px' }}>Paso 1: Localizar al Votante</h3>
                        <p>Ve a <strong>"Gestión Datos Faltantes"</strong> en el menú. Puedes filtrar por:</p>
                        <ul style={{ paddingLeft: '20px', marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '5px' }}>
                            <li><strong>Buscador:</strong> Por nombre o cédula.</li>
                            <li><strong>Líder:</strong> Para ver solo los referidos de una persona específica.</li>
                            <li><strong>Filtros Rápidos:</strong> Usa los botones "Sin Tel.", "Sin Dir." o "CC Inválida".</li>
                        </ul>
                    </div>

                    <div className="instruction-step" style={{ marginTop: '20px' }}>
                        <h3 style={{ fontSize: '1.1rem', color: 'var(--primary)', marginBottom: '10px' }}>Paso 2: Editar y Guardar</h3>
                        <p>Haz clic sobre el campo que deseas corregir (Cédula, Teléfono, Mesa, etc.) y realiza el cambio.</p>

                        <div style={{
                            marginTop: '15px',
                            padding: '20px',
                            background: '#fef2f2',
                            borderRadius: '8px',
                            border: '1px solid #fee2e2',
                            display: 'flex',
                            gap: '15px',
                            alignItems: 'center'
                        }}>
                            <div style={{ background: 'var(--primary)', color: 'white', padding: '10px', borderRadius: '8px' }}>
                                <Save size={24} />
                            </div>
                            <div>
                                <strong style={{ color: 'var(--danger)', fontSize: '1.1rem' }}>Paso Obligatorio:</strong>
                                <p style={{ color: '#991b1b', marginTop: '5px' }}>
                                    Haz clic en el icono azul <strong>💾 (Guardar)</strong> al final de la fila. Si no lo haces, los cambios se perderán al salir de la página.
                                </p>
                            </div>
                        </div>
                    </div>
                </section>

                {/* 4. ANALISIS */}
                <section className="card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                        <LayoutDashboard color="var(--primary)" size={24} />
                        <h2 style={{ margin: 0, fontSize: '1.4rem' }}>4. Secciones de Análisis</h2>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
                        <div className="analysis-item">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', marginBottom: '8px' }}>
                                <LayoutDashboard size={18} /> <strong>Dashboard</strong>
                            </div>
                            <p style={{ fontSize: '0.85rem' }}>Resumen estadístico en tiempo real de metas y actividad de líderes.</p>
                        </div>
                        <div className="analysis-item">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', marginBottom: '8px' }}>
                                <ListChecks size={18} /> <strong>Consolidado</strong>
                            </div>
                            <p style={{ fontSize: '0.85rem' }}>La lista maestra. Ideal para búsquedas globales con todos los detalles.</p>
                        </div>
                        <div className="analysis-item">
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--primary)', marginBottom: '8px' }}>
                                <Search size={18} /> <strong>Mapa Territorial</strong>
                            </div>
                            <p style={{ fontSize: '0.85rem' }}>Ubicación visual de puestos de votación para logística.</p>
                        </div>
                    </div>
                </section>

                {/* RECOMENDACIONES DE ORO */}
                <section className="card" style={{ border: '2px dashed var(--warning)', background: '#fffbeb' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '15px' }}>
                        <AlertTriangle color="var(--warning)" size={28} />
                        <h2 style={{ margin: 0, fontSize: '1.4rem', color: '#92400e' }}>⚠️ Recomendaciones de Oro</h2>
                    </div>
                    <ul style={{ paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '10px', color: '#92400e' }}>
                        <li><strong>Cédulas:</strong> Nunca uses puntos (.) ni comas (,) en la columna de cédula. Ejemplo: <code>1098765432</code></li>
                        <li><strong>UTF-8:</strong> Si ves símbolos raros en las tildes, verifica que el CSV se haya guardado como "CSV UTF-8" en Excel.</li>
                    </ul>
                </section>

                <div style={{ textAlign: 'center', padding: '20px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                    Compromiso Real © 2026 - Plataforma de Gestión Electoral
                </div>
            </div>
        </div>
    );
}
