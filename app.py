import streamlit as st
import pandas as pd
import folium
from streamlit_folium import st_folium
import requests
import json
import random
import plotly.express as px

# --- CONFIGURACIÓN DE LA PÁGINA ---
st.set_page_config(
    page_title="Tablero Compromiso Real",
    page_icon="🗳️",
    layout="wide",
    initial_sidebar_state="expanded"
)

# --- ESTILOS CSS PERSONALIZADOS ---
st.markdown("""
    <style>
    .big-font { font-size:24px !important; font-weight: bold; }
    .metric-card { background-color: #f0f2f6; padding: 15px; border-radius: 10px; border-left: 5px solid #1f77b4; }
    .alert-card { background-color: #ffcccc; padding: 15px; border-radius: 10px; border-left: 5px solid #ff0000; color: #8a0000;}
    </style>
    """, unsafe_allow_html=True)

# --- FUNCIONES AUXILIARES ---

@st.cache_data
def load_data(file):
    """Carga el CSV o Excel y limpia nombres de columnas."""
    df = None
    
    # 1. Detectar si es Excel
    if file.name.endswith('.xlsx') or file.name.endswith('.xls'):
        try:
            df = pd.read_excel(file)
        except Exception as e:
            st.error(f"❌ Error al leer Excel: {e}")
            return pd.DataFrame()
    else:
        # 2. Si es CSV, intentar diferentes encodings
        # Prioridad: utf-8-sig (para manejar BOM), luego utf-8, luego latin-1
        encodings = ['utf-8-sig', 'utf-8', 'latin-1', 'cp1252']
        separators = [';', ',']
        
        for encoding in encodings:
            if df is not None: break
            for sep in separators:
                try:
                    file.seek(0)
                    # quotechar='"' ayuda si el CSV tiene comillas envolviendo los datos
                    df_temp = pd.read_csv(file, sep=sep, encoding=encoding, quotechar='"')
                    
                    # Validar: Si tiene solo 1 columna, probablemente el separador falló
                    if df_temp.shape[1] > 1:
                        df = df_temp
                        break
                except:
                    continue
                
    if df is None:
        st.error("❌ No se pudo leer el archivo. Prueba guardarlo como **Excel (.xlsx)**, es más seguro.")
        return pd.DataFrame()

    # --- LIMPIEZA DE COLUMNAS (Super Robusta) ---
    # 1. Convertir a mayúsculas y quitar espacios
    df.columns = df.columns.astype(str).str.strip().str.upper()
    
    # 2. Quitar comillas residuales en los nombres de columna (ej: '"NO' -> 'NO')
    df.columns = df.columns.str.replace('"', '').str.replace("'", "")
    
    # 3. Corregir Mojibake (Caracteres rotos por mala codificación)
    def fix_mojibake(text):
        try:
            return text.encode('latin-1').decode('utf-8')
        except:
            return text
            
    # Solo aplicamos si detectamos mojibake obvio
    if any("Ã" in col for col in df.columns):
        new_cols = [fix_mojibake(col) for col in df.columns]
        df.columns = new_cols

    # 4. Mapeo final para estandarizar nombres
    column_mapping = {
        'LIDER': 'LÍDER',
        'NOMBRE LIDER': 'LÍDER',
        'CEDULA': 'No DE CÉDULA SIN PUNTOS',
        'NO DE CEDULA': 'No DE CÉDULA SIN PUNTOS',
        'TELEFONO': 'TELÉFONO',
        'DIRECCION': 'DIRECCIÓN DE RESIDENCIA',
        'DIRECCION DE RESIDENCIA': 'DIRECCIÓN DE RESIDENCIA',
        'PUESTO': 'PUESTO DE VOTACIÓN',
        'PUESTO DE VOTACION': 'PUESTO DE VOTACIÓN',
        'DIRECCION (PTO DE VOTACION)': 'DIRECCIÓN (Pto de votación)',
        'DIRECCIÓN (PTO DE VOTACIÓN)': 'DIRECCIÓN (Pto de votación)'
    }
    
    # Renombrar usando el mapa (ignore errors por si no existen)
    df.rename(columns=column_mapping, inplace=True)
    
    # --- VALIDACIÓN FINAL ---
    if 'LÍDER' not in df.columns:
        # Intento de búsqueda "fuzzy" (el que contenga LIDER)
        posibles = [c for c in df.columns if 'LIDER' in c or 'LÍDER' in c]
        if posibles:
            df.rename(columns={posibles[0]: 'LÍDER'}, inplace=True)
        else:
            st.error(f"⚠️ No se encontró la columna 'LÍDER'. Columnas actuales: {list(df.columns)}")
            df['LÍDER'] = 'DESCONOCIDO'
            
    # --- CORRECCIÓN DE TIPOS DE DATOS (CRÍTICO PARA DATA_EDITOR) ---
    # Streamlit falla si espera texto y recibe 'float' (que es como pandas ve las celdas vacías/NaN)
    text_columns = ['PUESTO DE VOTACIÓN', 'DIRECCIÓN (Pto de votación)', 'MESA', 'DIRECCIÓN DE RESIDENCIA', 'BARRIO DE RESIDENCIA']
    
    for col in text_columns:
        if col in df.columns:
            # Rellenar vacíos con texto vacío y asegurar tipo string
            df[col] = df[col].fillna("").astype(str)
            # A veces pandas convierte "nan" literalmente a texto, lo limpiamos
            df[col] = df[col].replace("nan", "")

    return df

def simulate_geocoding(df):
    """
    Simula coordenadas para Barranquilla/Soledad si no existen.
    NOTA: En producción, esto se reemplazaría por una API de Google Maps.
    Centro BQ: 10.9685, -74.7813
    """
    if 'LATITUD' not in df.columns:
        # Generar coordenadas aleatorias cerca a Barranquilla para demo
        df['LATITUD'] = df.apply(lambda x: 10.96 + random.uniform(-0.05, 0.05), axis=1)
        df['LONGITUD'] = df.apply(lambda x: -74.80 + random.uniform(-0.05, 0.05), axis=1)
    return df

def send_to_n8n(webhook_url, data_payload):
    """Envía los datos faltantes a n8n para notificar por WhatsApp."""
    try:
        headers = {'Content-Type': 'application/json'}
        response = requests.post(webhook_url, data=json.dumps(data_payload), headers=headers)
        return response.status_code == 200
    except Exception as e:
        st.error(f"Error de conexión: {e}")
        return False

# --- GESTIÓN DEL ESTADO (SESSION STATE) ---
# Esto permite que los datos persistan mientras editas o agregas gente
if 'df_main' not in st.session_state:
    st.session_state.df_main = None

# --- SIDEBAR: CARGA Y AGREGAR ---
with st.sidebar:
    st.image("https://cdn-icons-png.flaticon.com/512/1533/1533913.png", width=100)
    st.title("Compromiso Real 2026")
    
    uploaded_file = st.file_uploader("📂 Cargar Base de Datos (Excel o CSV)", type=["xlsx", "xls", "csv"])
    
    if uploaded_file is not None:
        if st.session_state.df_main is None:
            st.session_state.df_main = load_data(uploaded_file)
            st.success("¡Datos cargados correctamente!")

    st.markdown("---")
    
    # --- SECCIÓN: AGREGAR NUEVO REGISTRO ---
    st.header("➕ Agregar Nuevo Votante")
    
    if st.session_state.df_main is not None:
        with st.form("add_voter_form"):
            # Obtener lista de líderes existentes para sugerir
            lideres_existentes = sorted(st.session_state.df_main['LÍDER'].unique().tolist())
            
            new_lider = st.selectbox("Seleccionar Líder", options=lideres_existentes + ["NUEVO LÍDER..."])
            if new_lider == "NUEVO LÍDER...":
                new_lider_text = st.text_input("Escribe el nombre del Nuevo Líder")
                final_lider = new_lider_text
            else:
                final_lider = new_lider
            
            col1, col2 = st.columns(2)
            new_nombre = col1.text_input("Nombres")
            new_apellido = col2.text_input("Apellidos")
            new_cedula = st.text_input("Cédula")
            new_telefono = st.text_input("Teléfono")
            new_direccion = st.text_input("Dirección Residencia")
            new_barrio = st.text_input("Barrio")
            new_municipio = st.selectbox("Municipio", ["BARRANQUILLA", "SOLEDAD", "MALAMBO", "GALAPA", "PUERTO COLOMBIA", "REPELÓN", "BARANOA", "SABANALARGA", "OTRO"])
            
            submitted = st.form_submit_button("Guardar Nuevo Votante")
            
            if submitted:
                if new_nombre and new_cedula and final_lider:
                    # Crear nuevo registro
                    new_row = {
                        'No': len(st.session_state.df_main) + 1,
                        'LÍDER': final_lider.upper(),
                        'NOMBRES': new_nombre.upper(),
                        'APELLIDOS': new_apellido.upper(),
                        'No DE CÉDULA SIN PUNTOS': new_cedula,
                        'TELÉFONO': new_telefono,
                        'DIRECCIÓN DE RESIDENCIA': new_direccion.upper(),
                        'BARRIO DE RESIDENCIA': new_barrio.upper(),
                        'MUNICIPIO RESIDENCIA': new_municipio,
                        'DEPARTAMENTO RESIDENCIA': 'ATLÁNTICO',
                        'PUESTO DE VOTACIÓN': '', # Vacío intencionalmente para llenar luego
                        'DIRECCIÓN (Pto de votación)': '',
                        'MESA': '',
                        'DEPARTAMENTO VOTACIÓN': 'ATLÁNTICO',
                        'MUNICIPIO VOTACIÓN': new_municipio
                    }
                    # Añadir al DataFrame
                    st.session_state.df_main = pd.concat([st.session_state.df_main, pd.DataFrame([new_row])], ignore_index=True)
                    st.success(f"✅ {new_nombre} agregado al equipo de {final_lider}")
                else:
                    st.error("⚠️ Faltan datos obligatorios (Nombre, Cédula o Líder).")

# --- LÓGICA PRINCIPAL ---

if st.session_state.df_main is not None:
    df = st.session_state.df_main
    
    # --- HEADER: KPIs ---
    st.markdown("## 📊 Tablero de Control Logístico")
    
    kpi1, kpi2, kpi3, kpi4 = st.columns(4)
    
    total_votantes = len(df)
    total_lideres = df['LÍDER'].nunique()
    
    # Cálculo de faltantes
    sin_puesto = df[df['PUESTO DE VOTACIÓN'].isna() | (df['PUESTO DE VOTACIÓN'] == '')].shape[0]
    pct_sin_puesto = (sin_puesto / total_votantes) * 100
    
    sin_direccion = df[df['DIRECCIÓN DE RESIDENCIA'].isna() | (df['DIRECCIÓN DE RESIDENCIA'] == '')].shape[0]
    
    kpi1.metric("Total Red", total_votantes, delta="Votantes")
    kpi2.metric("Líderes Activos", total_lideres, delta="Capitanes")
    kpi3.metric("⚠️ Sin Puesto Votación", f"{sin_puesto} ({pct_sin_puesto:.1f}%)", delta_color="inverse")
    kpi4.metric("🏠 Sin Dirección", sin_direccion, delta_color="inverse")

    # Barra de progreso visual para la calidad de datos
    st.write("Calidad de Datos Electorales (Meta: 100% Puestos Definidos)")
    st.progress(100 - int(pct_sin_puesto))

    # --- TABS ---
    tab1, tab2, tab3 = st.tabs(["📝 Gestión de Datos & Faltantes", "🗺️ Mapa Operativo", "📈 Análisis por Líder"])

    # --- TAB 1: GESTIÓN DE DATOS ---
    with tab1:
        st.subheader("🛠️ Completar Información Faltante")
        st.info("Edita directamente en la tabla. Los cambios se guardan en memoria. Al finalizar, descarga el CSV actualizado.")
        
        # Filtro rápido
        mostrar_solo_faltantes = st.checkbox("🔍 Mostrar solo registros con datos faltantes", value=True)
        
        if mostrar_solo_faltantes:
            df_display = df[df['PUESTO DE VOTACIÓN'].isna() | (df['PUESTO DE VOTACIÓN'] == '') | df['DIRECCIÓN DE RESIDENCIA'].isna()].copy()
        else:
            df_display = df.copy()
            
        # Tabla Editable
        edited_df = st.data_editor(
            df_display,
            column_config={
                "LÍDER": st.column_config.TextColumn("Líder", disabled=True),
                "No DE CÉDULA SIN PUNTOS": st.column_config.TextColumn("Cédula", disabled=True),
                "PUESTO DE VOTACIÓN": st.column_config.TextColumn("Puesto Votación (Editar aquí)", required=True),
                "DIRECCIÓN (Pto de votación)": st.column_config.TextColumn("Dir. Puesto", width="large"),
                "MESA": st.column_config.TextColumn("Mesa")
            },
            hide_index=True,
            num_rows="dynamic",
            key="editor"
        )
        
        # Actualizar Session State con los cambios
        if st.button("💾 Guardar Cambios Internamente"):
            # En una app real, aquí se hace el merge. Para demo simplificado:
            # Reemplazamos las filas editadas en el DF original usando el índice o la Cédula como llave
            # Nota: Streamlit data_editor maneja esto bien, pero para persistencia robusta se requiere lógica de merge.
            # Aquí asumimos actualización directa para visualización.
            st.session_state.df_main.update(edited_df)
            st.success("✅ Datos actualizados en memoria.")
            st.rerun()

        # Botón de Descarga
        csv = df.to_csv(index=False, sep=';').encode('utf-8')
        st.download_button(
            "📥 Descargar Base de Datos Actualizada",
            data=csv,
            file_name="Base_Datos_Compromiso_Real_Actualizada.csv",
            mime="text/csv",
        )

        st.markdown("---")
        
        # CONEXIÓN CON N8N
        st.subheader("📢 Centro de Notificaciones (n8n)")
        st.markdown("Identifica líderes con datos pendientes y envíales un reporte automático por WhatsApp.")
        
        col_n8n_1, col_n8n_2 = st.columns([3, 1])
        webhook_url = col_n8n_1.text_input("URL del Webhook de n8n", placeholder="https://tu-n8n.com/webhook/...")
        
        if col_n8n_2.button("🚀 Disparar Alertas"):
            if not webhook_url:
                st.warning("Por favor ingresa la URL del Webhook.")
            else:
                # Agrupar faltantes por líder
                faltantes_df = df[df['PUESTO DE VOTACIÓN'].isna() | (df['PUESTO DE VOTACIÓN'] == '')]
                resumen = faltantes_df.groupby('LÍDER')['NOMBRES'].apply(list).to_dict()
                
                payload = {
                    "tipo_alerta": "datos_faltantes",
                    "fecha_corte": "Enero 2026",
                    "resumen_lideres": resumen
                }
                
                if send_to_n8n(webhook_url, payload):
                    st.success("✅ Alertas enviadas correctamente a n8n.")
                else:
                    st.error("❌ Falló el envío. Revisa la URL.")

    # --- TAB 2: MAPA ---
    with tab2:
        st.subheader("📍 Georreferenciación de la Red")
        st.markdown("Visualización de concentración de votantes (Azul) y Puestos de Votación (Rojo).")
        
        # Simular coordenadas (en producción usar geocoding real)
        df_map = simulate_geocoding(df.copy())
        
        # Crear mapa centrado en Barranquilla
        m = folium.Map(location=[10.9685, -74.7813], zoom_start=12)
        
        # Cluster de marcadores para rendimiento y limpieza
        from folium.plugins import MarkerCluster
        marker_cluster = MarkerCluster().add_to(m)
        
        for lat, lon, nombre, apellido, lider, puesto in zip(
            df_map['LATITUD'],
            df_map['LONGITUD'],
            df_map['NOMBRES'],
            df_map['APELLIDOS'],
            df_map['LÍDER'],
            df_map['PUESTO DE VOTACIÓN']
        ):
            # Tooltip con info
            tooltip_text = f"<b>{nombre} {apellido}</b><br>Líder: {lider}<br>Puesto: {puesto}"
            
            # Color según estado (Verde: Completo, Rojo: Falta puesto)
            color = "red" if pd.isna(puesto) or puesto == '' else "blue"
            icon = "info-sign" if color == "blue" else "exclamation-sign"
            
            folium.Marker(
                location=[lat, lon],
                popup=tooltip_text,
                icon=folium.Icon(color=color, icon=icon)
            ).add_to(marker_cluster)
            
        st_folium(m, width=1200, height=500)
        
        st.caption("Nota: Las ubicaciones mostradas son aproximadas (simuladas) para efectos de demostración logística.")

    # --- TAB 3: ANÁLISIS ---
    with tab3:
        st.subheader("📊 Rendimiento por Capitán")
        
        lider_seleccionado = st.selectbox("Seleccionar Líder para Análisis Profundo", df['LÍDER'].unique())
        
        # Filtrar data
        df_lider = df[df['LÍDER'] == lider_seleccionado]
        
        col_an1, col_an2 = st.columns(2)
        
        # Gráfico 1: Estado de Datos
        datos_completos = df_lider[df_lider['PUESTO DE VOTACIÓN'].notna() & (df_lider['PUESTO DE VOTACIÓN'] != '')].shape[0]
        datos_faltantes = len(df_lider) - datos_completos
        
        fig1 = px.pie(
            names=["Completos", "Faltantes"],
            values=[datos_completos, datos_faltantes],
            title=f"Calidad de Datos: {lider_seleccionado}",
            color_discrete_sequence=['#2ecc71', '#e74c3c']
        )
        col_an1.plotly_chart(fig1, use_container_width=True)
        
        # Gráfico 2: Distribución por Municipio
        df_mun = df_lider['MUNICIPIO RESIDENCIA'].value_counts().reset_index()
        df_mun.columns = ['Municipio', 'Cantidad']
        
        fig2 = px.bar(
            df_mun, x='Municipio', y='Cantidad',
            title="Distribución Geográfica del Equipo",
            color='Cantidad',
            color_continuous_scale='Blues'
        )
        col_an2.plotly_chart(fig2, use_container_width=True)
        
        st.markdown("### 📋 Listado del Equipo")
        st.dataframe(df_lider[['NOMBRES', 'APELLIDOS', 'TELÉFONO', 'PUESTO DE VOTACIÓN', 'MESA']])

else:
    st.info("👈 Por favor carga el archivo CSV en la barra lateral para comenzar.")
