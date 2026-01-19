import { useState } from 'react';
import Papa from 'papaparse';
import { Upload, AlertCircle, CheckCircle, FileSpreadsheet, Database } from 'lucide-react';
import { useVoters } from '../../context/VoterContext';
import type { Voter } from '../../types';
import { supabase } from '../../supabase';
import AdminHeader from '../../components/AdminHeader';

// Exact columns provided by user
const EXPECTED_COLUMNS = [
    'LÍDER',
    'NOMBRES',
    'APELLIDOS',
    'No DE CÉDULA SIN PUNTOS',
    'TELÉFONO',
    'DIRECCIÓN DE RESIDENCIA',
    'BARRIO DE RESIDENCIA',
    'MUNICIPIO RESIDENCIA',
    'DEPARTAMENTO RESIDENCIA',
    'PUESTO DE VOTACIÓN',
    'DIRECCIÓN (Pto de votación)',
    'MESA',
    'DEPARTAMENTO VOTACIÓN',
    'MUNICIPIO VOTACIÓN'
];

// Helper to fix Mojibake (e.g. Ã± -> ñ)
const fixMojibake = (text: string): string => {
    if (!text) return "";
    try {
        // Simple heuristic: if it contains typical UTF-8 interpreted as Latin-1 chars
        if (text.match(/[ÃÂ]/)) {
             const bytes = new Uint8Array(text.split('').map(c => c.charCodeAt(0)));
             return new TextDecoder('utf-8').decode(bytes);
        }
    } catch (_) {
        // ignore
    }
    return text;
};

const NORMALIZE_MAP: {[key: string]: string} = {
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
    'DIRECCIÓN (PTO DE VOTACIÓN)': 'DIRECCIÓN (Pto de votación)',
    'MESA': 'MESA',
    'BARRIO': 'BARRIO DE RESIDENCIA',
    'BARRIO DE RESIDENCIA': 'BARRIO DE RESIDENCIA',
    'MUNICIPIO': 'MUNICIPIO RESIDENCIA',
    'MUNICIPIO RESIDENCIA': 'MUNICIPIO RESIDENCIA',
    'DEPARTAMENTO': 'DEPARTAMENTO RESIDENCIA'
};

const normalizeColumnName = (col: string) => {
    const upper = col.toUpperCase().replace(/['"]/g, '').trim();
    return NORMALIZE_MAP[upper] || upper;
};

export default function ImportPage() {
    const { setVoters, refreshVoters } = useVoters();
    const [data, setData] = useState<Voter[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [fileName, setFileName] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [saveStatus, setSaveStatus] = useState<string | null>(null);

    const parseFile = (file: File, encoding: string, delimiter: string | undefined, attempt: number) => {
        Papa.parse(file, {
            header: false,
            skipEmptyLines: true,
            encoding: encoding,
            delimiter: delimiter,
            complete: (results) => {
                const rows = results.data as string[][];
                if (!rows || rows.length === 0) {
                    setError("El archivo parece estar vacío.");
                    return;
                }

                // Clean first row (headers)
                const firstRow = rows[0].map(cell => normalizeColumnName(fixMojibake(cell.trim())));

                // Find LÍDER column
                const leaderHeaderIndex = firstRow.findIndex(cell => cell === 'LÍDER');

                let formattedData: Voter[] = [];
                let missingColumns: string[] = [];

                if (leaderHeaderIndex !== -1) {
                    const headerMap: { [key: string]: number } = {};
                    firstRow.forEach((colName, idx) => {
                        headerMap[colName] = idx;
                    });

                    // Check which expected columns are missing
                    missingColumns = EXPECTED_COLUMNS.filter(col => headerMap[col] === undefined);

                    if (missingColumns.length === 0) {
                        formattedData = rows.slice(1).map((row, rowIndex) => {
                            // eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const obj: any = { _id: `temp-${rowIndex}` };
                            EXPECTED_COLUMNS.forEach(col => {
                                const val = row[headerMap[col]]?.trim() || '';
                                obj[col] = fixMojibake(val);
                            });
                            // Fill defaults for Voter interface
                            obj['INVALIDA'] = false;
                            return obj as Voter;
                        });
                    }
                } else {
                    // Fallback to position-based if headers don't match but count matches?
                    // This is risky, but let's see if we have exact count
                    if (firstRow.length >= EXPECTED_COLUMNS.length) {
                         // Check if at least some columns match to avoid completely wrong mapping
                         // For now, let's just try to map by index if headers fail completely
                         // But we prefer header mapping.

                         // If we didn't find LIDER, maybe the normalization failed or it's missing.
                         missingColumns = ["LÍDER (No encontrada)"];
                    } else {
                        missingColumns = [`Estructura desconocida. Se esperaban ${EXPECTED_COLUMNS.length} columnas, pero se encontraron ${firstRow.length}.`];
                    }
                }

                if (missingColumns.length === 0 && formattedData.length > 0) {
                    setData(formattedData);
                    setVoters(formattedData);
                    setSuccess(`¡Lectura exitosa! Se encontraron ${formattedData.length} registros. Listo para guardar.`);
                    return;
                }

                // If failed, try next encoding/delimiter
                if (attempt === 1) {
                    parseFile(file, 'ISO-8859-1', undefined, 2);
                } else if (attempt === 2) {
                    parseFile(file, 'ISO-8859-1', ';', 3);
                } else if (attempt === 3) {
                    parseFile(file, 'UTF-8', ';', 4);
                } else {
                    let errorMsg = `No se pudo leer el archivo correctamente.`;
                    if (missingColumns.length > 0) {
                        errorMsg += `\n\nProblema detectado: Faltan columnas: ${missingColumns.join(', ')}`;
                    }
                    setError(errorMsg);
                    setData([]);
                }
            },
            error: (err) => {
                setError(`Error crítico al leer el archivo: ${err.message}`);
            }
        });
    };

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        setFileName(file.name);
        setError(null);
        setSuccess(null);
        setData([]);
        setSaveStatus(null);
        parseFile(file, 'UTF-8', undefined, 1);
    };

    const handleSaveToDatabase = async () => {
        setIsSaving(true);
        setSaveStatus("Verificando conexión...");

        try {
            const { error: healthHighCheck } = await supabase.from('leaders').select('count', { count: 'exact', head: true });
            if (healthHighCheck && (healthHighCheck.code === 'PGRST301' || healthHighCheck.message.includes('fetch'))) {
                throw new Error("No se pudo conectar a Supabase.");
            }

            setSaveStatus("Procesando líderes...");
            const leadersMap = new Map<string, string>();
            const uniqueLeaderNames = Array.from(new Set(data.map(d => d['LÍDER']?.trim()).filter(Boolean)));

            for (const leaderName of uniqueLeaderNames) {
                const { data: leaderData, error: leaderError } = await supabase
                    .from('leaders')
                    .upsert({ full_name: leaderName }, { onConflict: 'full_name' })
                    .select('id')
                    .single();

                if (leaderError) continue;
                if (leaderData) leadersMap.set(leaderName, leaderData.id);
            }

            setSaveStatus(`Guardando ${data.length} votantes...`);
            const votersPayload = data.map(v => ({
                leader_id: leadersMap.get(v['LÍDER']?.trim()) || null,
                first_name: v['NOMBRES'] || '',
                last_name: v['APELLIDOS'] || '',
                document_number: v['No DE CÉDULA SIN PUNTOS'] || '',
                phone: v['TELÉFONO'],
                address: v['DIRECCIÓN DE RESIDENCIA'],
                neighborhood: v['BARRIO DE RESIDENCIA'],
                municipality: v['MUNICIPIO RESIDENCIA'],
                department: v['DEPARTAMENTO RESIDENCIA'],
                voting_post: v['PUESTO DE VOTACIÓN'],
                voting_post_address: v['DIRECCIÓN (Pto de votación)'],
                voting_table: v['MESA'],
                voting_municipality: v['MUNICIPIO VOTACIÓN'],
                voting_department: v['DEPARTAMENTO VOTACIÓN'],
                is_invalid_cc: v['INVALIDA']
            }));

            const uniqueVotersMap = new Map();
            votersPayload.forEach(voter => {
                if (voter.document_number) uniqueVotersMap.set(voter.document_number, voter);
            });
            const uniqueVotersPayload = Array.from(uniqueVotersMap.values());

            const { error: votersError } = await supabase
                .from('voters')
                .upsert(uniqueVotersPayload, { onConflict: 'document_number' });

            if (votersError) throw votersError;

            setSaveStatus(null);
            setSuccess(`¡Éxito! Se han guardado ${uniqueVotersPayload.length} registros.`);
            await refreshVoters();

        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : String(err);
            setError(`Error al guardar: ${message}`);
            setSaveStatus(null);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div>
            <AdminHeader
                title="Importar Base de Datos"
                description="Carga tu archivo Excel/CSV con la estructura oficial."
            />

            <div className="card import-card">
                <label className={`file-drop-zone ${fileName ? 'active' : ''}`}>
                    <input
                        type="file"
                        accept=".csv,.txt,.xlsx"
                        onChange={handleFileUpload}
                        style={{ display: 'none' }}
                    />
                    <div className="upload-area">
                        {fileName ? (
                            <FileSpreadsheet size={48} color="var(--success)" />
                        ) : (
                            <Upload size={48} color="var(--primary)" />
                        )}
                        <div>
                            {fileName ? (
                                <h3 className="file-name">{fileName}</h3>
                            ) : (
                                <h3 className="upload-prompt-title">Haz clic para seleccionar archivo</h3>
                            )}
                            <p className="upload-prompt-subtitle">Soporta formato CSV (Guardar como CSV UTF-8 o separado por punto y coma)</p>
                        </div>
                    </div>
                </label>

                {error && (
                    <div className="alert-box alert-error">
                        <AlertCircle size={24} />
                        <div style={{ whiteSpace: 'pre-wrap' }}>{error}</div>
                    </div>
                )}

                {success && (
                    <div className="alert-box alert-success">
                        <CheckCircle size={24} />
                        <div>{success}</div>
                    </div>
                )}
            </div>

            {data.length > 0 && (
                <div className="card">
                    <div className="preview-header">
                        <h3 className="preview-title">Vista Previa ({data.length} registros)</h3>
                        <button
                            className="btn btn-primary"
                            onClick={handleSaveToDatabase}
                            disabled={isSaving}
                        >
                            {isSaving ? 'Guardando...' : (
                                <>
                                    <Database size={18} />
                                    Guardar en Base de Datos
                                </>
                            )}
                        </button>
                    </div>
                    {saveStatus && <p style={{ color: 'var(--primary)', fontWeight: 'bold', marginTop: '10px' }}>{saveStatus}</p>}

                    <div className="table-container">
                        <table>
                            <thead>
                                <tr>
                                    {EXPECTED_COLUMNS.map(col => (
                                        <th key={col}>{col}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {data.slice(0, 50).map((row, idx) => (
                                    <tr key={idx}>
                                        {EXPECTED_COLUMNS.map(col => (
                                            <td key={`${idx}-${col}`}>{row[col] || '-'}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {data.length > 50 && (
                        <p className="preview-footer">
                            Mostrando los primeros 50 registros de {data.length}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
