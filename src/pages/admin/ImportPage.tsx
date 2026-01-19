import { useState } from 'react';
import Papa from 'papaparse';
import { Upload, AlertCircle, CheckCircle, FileSpreadsheet, Database } from 'lucide-react';
import { useVoters, type VoterData } from '../../context/VoterContext';
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
    'MUNICIPIO VOTACIÓN',
    'INVALIDA'
];

export default function ImportPage() {
    const { setVoters, refreshVoters } = useVoters();
    const [data, setData] = useState<VoterData[]>([]);
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

                const firstRow = rows[0].map(cell => cell.trim());
                const leaderHeaderIndex = firstRow.findIndex(cell => cell.toUpperCase() === 'LÍDER');

                let formattedData: VoterData[] = [];
                let missingColumns: string[] = [];

                if (leaderHeaderIndex !== -1) {
                    const headerMap: { [key: string]: number } = {};
                    firstRow.forEach((colName, idx) => {
                        headerMap[colName.toUpperCase()] = idx;
                    });

                    // Allow INVALIDA to be optional for backward compatibility
                    missingColumns = EXPECTED_COLUMNS.filter(col => col !== 'INVALIDA' && headerMap[col.toUpperCase()] === undefined);

                    if (missingColumns.length === 0) {
                        formattedData = rows.slice(1).map(row => {
                            const obj: VoterData = {};
                            EXPECTED_COLUMNS.forEach(col => {
                                const idx = headerMap[col.toUpperCase()];
                                obj[col] = (idx !== undefined ? row[idx]?.trim() : '') || '';
                            });
                            return obj;
                        });
                    }
                } else {
                    // Check if we have at least the required columns (excluding optional INVALIDA)
                    const requiredCount = EXPECTED_COLUMNS.filter(c => c !== 'INVALIDA').length;

                    if (firstRow.length >= requiredCount) {
                        formattedData = rows.map(row => {
                            const obj: VoterData = {};
                            EXPECTED_COLUMNS.forEach((col, index) => {
                                // Fallback logic might be risky here if columns are not in order.
                                // But this else block assumes "headerless" or "structure unknown but count matches".
                                // If headers are missing, we assume order matches EXPECTED_COLUMNS.
                                // If INVALIDA is last, and data lacks it, it's fine.
                                obj[col] = row[index]?.trim() || '';
                            });
                            return obj;
                        });
                    } else {
                        missingColumns = [`Estructura desconocida. Se esperaban al menos ${requiredCount} columnas.`];
                    }
                }

                if (missingColumns.length === 0 && formattedData.length > 0) {
                    setData(formattedData);
                    setVoters(formattedData);
                    setSuccess(`¡Lectura exitosa! Se encontraron ${formattedData.length} registros. Listo para guardar.`);
                    return;
                }

                if (attempt === 1) {
                    parseFile(file, 'ISO-8859-1', undefined, 2);
                } else if (attempt === 2) {
                    parseFile(file, 'ISO-8859-1', ';', 3);
                } else if (attempt === 3) {
                    parseFile(file, 'UTF-8', ';', 4);
                } else {
                    let errorMsg = `No se pudo leer el archivo correctamente.`;
                    if (missingColumns.length > 0) {
                        errorMsg += `\n\nProblema detectado: ${missingColumns.join(', ')}`;
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

            const parseBoolean = (val: any): boolean => {
                if (!val) return false;
                const s = String(val).trim().toUpperCase();
                return ['TRUE', 'SI', 'SÍ', 'YES', '1', 'ON'].includes(s);
            };

            const votersPayload = data.map(v => ({
                leader_id: leadersMap.get(v['LÍDER']?.trim()) || null,
                first_name: v['NOMBRES'] || '',
                last_name: v['APELLIDOS'] || '',
                document_number: v['No DE CÉDULA SIN PUNTOS'] || '',
                is_invalid_cc: parseBoolean(v['INVALIDA']),
                phone: v['TELÉFONO'],
                address: v['DIRECCIÓN DE RESIDENCIA'],
                neighborhood: v['BARRIO DE RESIDENCIA'],
                municipality: v['MUNICIPIO RESIDENCIA'],
                department: v['DEPARTAMENTO RESIDENCIA'],
                voting_post: v['PUESTO DE VOTACIÓN'],
                voting_post_address: v['DIRECCIÓN (Pto de votación)'],
                voting_table: v['MESA'],
                voting_municipality: v['MUNICIPIO VOTACIÓN'],
                voting_department: v['DEPARTAMENTO VOTACIÓN']
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

        } catch (err: any) {
            setError(`Error al guardar: ${err.message}`);
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
