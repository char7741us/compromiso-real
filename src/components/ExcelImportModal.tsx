import { useState } from 'react';
import { X, Upload, Check, AlertTriangle, FileText, Loader2 } from 'lucide-react';
import { parseExcelData } from '../utils/excelParser';
import { leaderService } from '../services/leaderService';
import { validateCedula, validateEmail } from '../utils/validators';
import toast from 'react-hot-toast';

interface ExcelImportModalProps {
    type: 'leaders' | 'voters';
    leaderId?: string; // Required if type is 'voters'
    onClose: () => void;
    onSuccess: () => void;
}

interface ParsedRow {
    data: any;
    isValid: boolean;
    errors: string[];
    status: 'pending' | 'success' | 'error';
}

export default function ExcelImportModal({ type, leaderId, onClose, onSuccess }: ExcelImportModalProps) {
    const [step, setStep] = useState<'upload' | 'preview'>('upload');
    const [rawText, setRawText] = useState('');
    const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);

    const handleParse = async () => {
        if (!rawText.trim()) return;

        setIsProcessing(true);
        try {
            const data = await parseExcelData(rawText, type);

            // Validate rows
            const validated: ParsedRow[] = [];
            for (const row of data) {
                const errors: string[] = [];

                // Required fields
                if (type === 'leaders') {
                    if (!row.full_name) errors.push('Falta Nombre');
                    if (!row.document_number) errors.push('Falta Cédula');
                    else {
                        const cedulaError = await validateCedula(row.document_number, undefined, 'leaders');
                        if (cedulaError) errors.push(cedulaError);
                    }
                    if (row.email) {
                        const emailError = await validateEmail(row.email);
                        if (emailError) errors.push(emailError);
                    }
                } else {
                    // Voters
                    if (!row.first_name) errors.push('Falta Nombre');
                    if (!row.document_number) errors.push('Falta Cédula');
                    else {
                        const cedulaError = await validateCedula(row.document_number, undefined, 'voters');
                        if (cedulaError) errors.push(cedulaError);
                    }
                }

                validated.push({
                    data: row,
                    isValid: errors.length === 0,
                    errors,
                    status: 'pending'
                });
            }

            setParsedRows(validated);
            setStep('preview');
        } catch (error) {
            console.error(error);
            toast.error('Error analizando datos');
        }
        setIsProcessing(false);
    };

    const handleImport = async () => {
        setIsProcessing(true);
        const validRows = parsedRows.filter(r => r.isValid);
        const total = validRows.length;
        let SuccessCount = 0;
        let ErrorCount = 0;

        // Process in batches of 10
        const batchSize = 10;
        for (let i = 0; i < total; i += batchSize) {
            const batch = validRows.slice(i, i + batchSize);

            await Promise.all(batch.map(async (row) => {
                try {
                    if (type === 'leaders') {
                        await leaderService.createLeader({
                            ...row.data,
                            goal: row.data.goal || 0,
                            active: true,
                            zone: row.data.zone || '',
                            municipality: row.data.municipality || '',
                            neighborhood: row.data.neighborhood || ''
                        });
                    } else {
                        // Voters
                        await leaderService.addVoterToLeader(leaderId!, {
                            ...row.data,
                            voting_post: row.data.voting_post || '',
                            voting_table: row.data.voting_table || ''
                        });
                    }
                    row.status = 'success';
                    SuccessCount++;
                } catch (err) {
                    row.status = 'error';
                    ErrorCount++;
                }
            }));

            setProgress(Math.round(((i + batch.length) / total) * 100));
        }

        toast.success(`Importación finalizada: ${SuccessCount} éxitos, ${ErrorCount} errores.`);

        if (ErrorCount === 0) {
            onSuccess();
        } else {
            // Keep modal open to show errors if desired, or just close
            setIsProcessing(false);
            // Optionally update state to reflect status changes in UI
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
            <div className="bg-white border border-slate-200 rounded-xl w-full max-w-4xl h-[80vh] flex flex-col shadow-2xl">

                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-200 bg-slate-50/50">
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                            <Upload className="text-yellow-500" />
                            Importar {type === 'leaders' ? 'Líderes' : 'Votantes'}
                        </h2>
                        <p className="text-sm text-slate-500">Pegue los datos desde Excel (Nombre, Cédula, Teléfono...)</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full" title="Cerrar"><X className="text-slate-500" /></button>
                </div>

                {/* Content */}
                <div className="flex-1 p-6 overflow-hidden flex flex-col">
                    {step === 'upload' ? (
                        <div className="flex-1 flex flex-col gap-4">
                            <textarea
                                className="flex-1 bg-slate-50 border border-slate-200 rounded-lg p-4 font-mono text-sm text-slate-800 focus:border-yellow-500 outline-none resize-none"
                                placeholder={`Ejemplo:\nJuan Perez\t12345678\t3001234567\nMaria Gomez\t87654321\t3109876543`}
                                value={rawText}
                                onChange={e => setRawText(e.target.value)}
                            />
                            <div className="flex justify-end">
                                <button
                                    onClick={handleParse}
                                    disabled={!rawText.trim() || isProcessing}
                                    className="btn btn-primary bg-yellow-500 hover:bg-yellow-400 text-black border-none"
                                >
                                    {isProcessing ? <Loader2 className="animate-spin" /> : <FileText />}
                                    Analizar Datos
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="flex-1 flex flex-col">
                            {/* Stats */}
                            <div className="flex gap-4 mb-4 text-sm">
                                <div className="px-3 py-1 bg-green-100 text-green-700 rounded-full border border-green-200">
                                    Válidos: {parsedRows.filter(r => r.isValid).length}
                                </div>
                                <div className="px-3 py-1 bg-red-100 text-red-700 rounded-full border border-red-200">
                                    Errores: {parsedRows.filter(r => !r.isValid).length}
                                </div>
                            </div>

                            {/* Table */}
                            <div className="flex-1 overflow-auto border border-slate-200 rounded-lg">
                                <table className="w-full text-sm text-left whitespace-nowrap">
                                    <thead className="text-xs uppercase bg-slate-50 text-slate-500 sticky top-0">
                                        <tr>
                                            <th className="px-4 py-2">Estado</th>
                                            <th className="px-4 py-2">Nombre</th>
                                            <th className="px-4 py-2">Cédula</th>
                                            <th className="px-4 py-2">Errores</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-200 bg-white">
                                        {parsedRows.map((row, idx) => (
                                            <tr key={idx} className={row.isValid ? 'hover:bg-slate-50' : 'bg-red-50 hover:bg-red-100'}>
                                                <td className="px-4 py-2">
                                                    {row.status === 'success' ? <Check className="text-green-500" size={16} /> :
                                                        row.status === 'error' ? <AlertTriangle className="text-red-500" size={16} /> :
                                                            row.isValid ? <Check className="text-slate-400" size={16} /> :
                                                                <X className="text-red-500" size={16} />}
                                                </td>
                                                <td className="px-4 py-2 text-slate-700">{row.data.full_name || row.data.first_name}</td>
                                                <td className="px-4 py-2 text-slate-600">{row.data.document_number}</td>
                                                <td className="px-4 py-2 text-red-500 text-xs">
                                                    {row.errors.join(', ')}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Progress Bar */}
                            {isProcessing && (
                                <div className="w-full h-2 bg-slate-200 rounded-full mt-4 overflow-hidden">
                                    <div className="h-full bg-yellow-500 transition-all duration-300" style={{ width: `${progress}%` }}></div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex justify-between mt-4">
                                <button onClick={() => setStep('upload')} className="text-slate-500 hover:text-slate-800 underline">Atrás</button>
                                <button
                                    onClick={handleImport}
                                    disabled={parsedRows.filter(r => r.isValid).length === 0 || isProcessing}
                                    className="btn btn-primary bg-green-600 hover:bg-green-500 text-white border-none disabled:opacity-50"
                                >
                                    {isProcessing ? 'Procesando...' : 'Confirmar Importación'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

