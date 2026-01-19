# Diagnóstico de la Aplicación

Este documento detalla los hallazgos tras el análisis de la base de código (React + Vite + Supabase vs Streamlit) y propone mejoras para la estandarización y corrección de errores.

## 1. Arquitectura Dual (Streamlit vs React)
La aplicación cuenta con dos interfaces:
- **`app.py` (Streamlit)**: Probablemente un prototipo. Contiene lógica robusta de limpieza de datos pero no se conecta a la misma base de datos Supabase que la app React (o al menos no de forma evidente en el código analizado).
- **`src/` (React)**: La aplicación principal. Conecta a Supabase y tiene gestión de estado.
- **Problema**: Los usuarios podrían estar usando el prototipo para cargar datos y esperando verlos en el dashboard de React, o viceversa. Además, la lógica de limpieza de datos en React (`ImportPage.tsx`) es menos robusta que en Python.

## 2. Indicadores del Dashboard que no se actualizan solos
El problema reportado "los indicadores no se actualizan solos" tiene dos causas probables:
1. **Falta de suscripción a tablas relacionadas**: El `VoterContext` solo se suscribe a cambios en la tabla `voters`. Sin embargo, los indicadores como "Líderes Activos" dependen de los nombres de los líderes traídos de la tabla `leaders`. Si se añade o renombra un líder en Supabase, el dashboard no se entera automáticamente.
2. **Carga de datos externa**: Si los datos se cargan desde `app.py` (que usa almacenamiento en memoria local o una DB distinta si no está configurado igual), React nunca recibirá los cambios.

## 3. Calidad de Código y Tipado
- **Uso excesivo de `any`**: En `VoterContext.tsx`, la interfaz `VoterData` permite cualquier clave (`[key: string]: any`). Esto anula las ventajas de TypeScript y propicia errores silenciosos si los nombres de las columnas cambian.
- **Gestión de Estado**: La aplicación carga **todos** los votantes (limitado a 10,000) en memoria. Esto funcionará para <10k registros, pero causará lentitud notable y posibles bloqueos del navegador si la base de datos crece.

## 4. Importación de Datos
- La lógica en `ImportPage.tsx` es frágil comparada con `app.py`. No maneja:
  - Corrección de "Mojibake" (caracteres mal codificados como `Ã±` por `ñ`).
  - Mapeo flexible de columnas (ej. "LIDER", "Lider", "Nombre Lider").
  - Limpieza de espacios y comillas en encabezados.

## Plan de Acción Ejecutado
1. **Mejora del Realtime**: Se añade suscripción a la tabla `leaders` en `VoterContext` para que cambios en la estructura de liderazgo refresquen el dashboard.
2. **Robustecimiento de Importación**: Se migra la lógica de limpieza de `app.py` a `ImportPage.tsx`.
3. **Tipado Estricto**: Se define una interfaz `Voter` para mejorar la seguridad del código.

## Recomendaciones Futuras
- **Paginación en Servidor**: Migrar de `limit(10000)` a paginación real o "infinite scroll" usando `range()` de Supabase.
- **Cálculos en Backend**: Mover el cálculo de estadísticas (KPIs) a funciones RPC de PostgreSQL o Edge Functions para no descargar toda la data al cliente.
- **Unificación**: Deprecar `app.py` y dirigir todo el flujo de trabajo a la aplicación React.
