import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { Plus, Upload, Trash2, Edit2, Save, X, Search } from 'lucide-react';
import AdminHeader from '../../components/AdminHeader';
import * as XLSX from 'xlsx';
import toast from 'react-hot-toast';

interface Leader {
    id: string;
    full_name: string;
    phone: string;
    email: string;
    total_voters: number;
}

export default function LeadersPage() {
    const [leaders, setLeaders] = useState<Leader[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    // Form State
    const [formData, setFormData] = useState({ full_name: '', phone: '', email: '' });
    const [isEditing, setIsEditing] = useState<string | null>(null);

    const fetchLeaders = async () => {
        setIsLoading(true);
        const { data, error } = await supabase
            .from('leaders')
            .select(`
                *,
                voters:voters(count)
            `)
            .order('full_name');

        if (error) {
            toast.error('Error cargando líderes');
        } else {
            console.log(data);
            // Transform data to handle count array
            const formatted = data.map((l: any) => ({
                ...l,
                total_voters: l.voters?.[0]?.count || 0
            }));
            setLeaders(formatted);
        }
        setIsLoading(false);
    };

    useEffect(() => {
        fetchLeaders();
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (isEditing) {
                const { error } = await supabase
                    .from('leaders')
                    .update(formData)
                    .eq('id', isEditing);
                if (error) throw error;
                toast.success('Líder actualizado');
            } else {
                const { error } = await supabase
                    .from('leaders')
                    .insert([formData]);
                if (error) throw error;
                toast.success('Líder creado');
            }
            setIsModalOpen(false);
            setFormData({ full_name: '', phone: '', email: '' });
            setIsEditing(null);
            fetchLeaders();
        } catch (error) {
            toast.error('Error guardando líder');
            console.error(error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('¿Estás seguro? Esto podría dejar votantes huérfanos.')) return;

        const { error } = await supabase
            .from('leaders')
            .delete()
            .eq('id', id);

        if (error) {
            toast.error('No se puede eliminar (¿tiene votantes?)');
        } else {
            toast.success('Líder eliminado');
            fetchLeaders();
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                const data = XLSX.utils.sheet_to_json(ws);

                // Expected format: Name, Phone, Email
                const leadersToInsert = [];
                for (const rowItem of data) {
                    const row = rowItem as any;
                    const name = row['Nombre'] || row['nombre'] || row['Name'];
                    if (name) {
                        leadersToInsert.push({
                            full_name: name,
                            phone: row['Telefono'] || row['phone'] || '',
                            email: row['Email'] || row['email'] || ''
                        });
                    }
                }

                if (leadersToInsert.length > 0) {
                    const { error } = await supabase.from('leaders').insert(leadersToInsert);

                    if (error) {
                        console.error(error);
                        toast.error('Error importando líderes');
                    } else {
                        toast.success(`${leadersToInsert.length} líderes importados`);
                        fetchLeaders();
                    }
                } else {
                    toast.info('No se encontraron datos válidos para importar');
                }
            } catch (error) {
                toast.error('Error procesando archivo');
                console.error(error);
            }
        };
        reader.readAsBinaryString(file);
    };

    const filteredLeaders = leaders.filter(l =>
        l.full_name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="leaders-page">
            <AdminHeader
                title="Gestión de Líderes"
                description="Cree, edite y gestione los líderes de su estructura."
                actions={
                    <div className="flex gap-2">
                        <label className="btn btn-secondary cursor-pointer">
                            <Upload size={18} />
                            Importar Excel
                            <input type="file" hidden accept=".xlsx, .csv" onChange={handleFileUpload} />
                        </label>
                        <button className="btn btn-primary" onClick={() => {
                            setFormData({ full_name: '', phone: '', email: '' });
                            setIsEditing(null);
                            setIsModalOpen(true);
                        }}>
                            <Plus size={18} />
                            Nuevo Líder
                        </button>
                    </div>
                }
            />

            <div className="card mb-4">
                <div className="relative">
                    <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                    <input
                        className="search-input pl-10 w-full"
                        placeholder="Buscar líder..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {isLoading ? (
                <div className="text-center py-10">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                    <p className="text-gray-400">Cargando líderes...</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredLeaders.map(leader => (
                        <div key={leader.id} className="card hover:border-primary transition-colors flex flex-col gap-3">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="font-bold text-lg">{leader.full_name}</h3>
                                    <p className="text-sm text-muted">Votantes: {leader.total_voters}</p>
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        className="p-1 hover:bg-slate-800 rounded text-blue-400"
                                        onClick={() => {
                                            setFormData({
                                                full_name: leader.full_name,
                                                phone: leader.phone || '',
                                                email: leader.email || ''
                                            });
                                            setIsEditing(leader.id);
                                            setIsModalOpen(true);
                                        }}
                                        title="Editar líder"
                                        aria-label={`Editar líder ${leader.full_name}`}
                                    >
                                        <Edit2 size={16} />
                                    </button>
                                    <button
                                        className="p-1 hover:bg-slate-800 rounded text-red-400"
                                        onClick={() => handleDelete(leader.id)}
                                        title="Eliminar líder"
                                        aria-label={`Eliminar líder ${leader.full_name}`}
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                            <div className="text-sm text-gray-400">
                                {leader.phone && <div>📞 {leader.phone}</div>}
                                {leader.email && <div>✉️ {leader.email}</div>}
                            </div>
                        </div>
                    ))}
                </div>
            )}            {isModalOpen && (
                <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
                    <div className="bg-slate-900 border border-slate-700 p-6 rounded-xl w-full max-w-md">
                        <div className="flex justify-between mb-4">
                            <h2 className="text-xl font-bold">{isEditing ? 'Editar Líder' : 'Nuevo Líder'}</h2>
                            <button onClick={() => setIsModalOpen(false)}><X /></button>
                        </div>
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            <div>
                                <label className="block text-sm mb-1">Nombre Completo</label>
                                <input
                                    required
                                    className="login-input"
                                    value={formData.full_name}
                                    onChange={e => setFormData({ ...formData, full_name: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm mb-1">Teléfono</label>
                                <input
                                    className="login-input"
                                    value={formData.phone}
                                    onChange={e => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-sm mb-1">Email</label>
                                <input
                                    className="login-input"
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                            </div>
                            <button type="submit" className="login-button mt-2">
                                <Save size={18} className="inline mr-2" />
                                Guardar
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
