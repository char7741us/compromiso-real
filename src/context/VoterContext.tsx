import { createContext, useContext, useState, type ReactNode } from 'react';
import { supabase } from '../supabase';
import { useLoading } from './LoadingContext';

export interface VoterData {
    [key: string]: any;
}

export interface FetchVotersParams {
    page?: number;
    pageSize?: number;
    filters?: Record<string, any>;
    search?: string;
    sort?: { column: string; ascending: boolean };
}

interface VoterStats {
    total: number;
    missingPhone: number;
    missingAddress: number;
    missingVotingPost: number;
    invalidIds: number;
}

interface VoterContextType {
    // Deprecated but kept for type compatibility
    voters: VoterData[];
    setVoters: (data: VoterData[]) => void;

    updateVoter: (id: string, updates: Partial<VoterData>) => Promise<{ success: boolean; error?: string }>;
    fetchGlobalStats: () => Promise<void>;
    fetchVoters: (params: FetchVotersParams) => Promise<{ data: VoterData[], count: number }>;
    refreshVoters: () => Promise<void>;

    isLoading: boolean;
    stats: VoterStats;
}

const VoterContext = createContext<VoterContextType | undefined>(undefined);

export function VoterProvider({ children }: { children: ReactNode }) {
    const [voters, setVoters] = useState<VoterData[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [stats, setStats] = useState<VoterStats>({
        total: 0,
        missingPhone: 0,
        missingAddress: 0,
        missingVotingPost: 0,
        invalidIds: 0
    });

    const { startLoading, stopLoading } = useLoading();

    const fetchGlobalStats = async () => {
        try {
            const [
                { count: total },
                { count: missingPhone },
                { count: missingAddress },
                { count: missingVotingPost },
                { count: invalidIds }
            ] = await Promise.all([
                supabase.from('voters').select('*', { count: 'exact', head: true }),
                supabase.from('voters').select('*', { count: 'exact', head: true }).or('phone.is.null,phone.eq.""'),
                supabase.from('voters').select('*', { count: 'exact', head: true }).or('address.is.null,address.eq.""'),
                supabase.from('voters').select('*', { count: 'exact', head: true }).or('voting_post.is.null,voting_post.eq.""'),
                supabase.from('voters').select('*', { count: 'exact', head: true }).eq('is_invalid_cc', true)
            ]);

            setStats({
                total: total || 0,
                missingPhone: missingPhone || 0,
                missingAddress: missingAddress || 0,
                missingVotingPost: missingVotingPost || 0,
                invalidIds: invalidIds || 0
            });
        } catch (error) {
            console.error("Error fetching stats:", error);
        }
    };

    const fetchVoters = async ({ page = 1, pageSize = 50, filters = {}, search = '', sort = { column: 'created_at', ascending: false } }: FetchVotersParams) => {
        setIsLoading(true);
        startLoading();
        try {
            let query = supabase
                .from('voters')
                .select(`
                    *,
                    leaders ( full_name )
                `, { count: 'exact' });

            if (search) {
                query = query.or(`first_name.ilike.%${search}%,last_name.ilike.%${search}%,document_number.ilike.%${search}%`);
            }

            Object.entries(filters).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== 'all') {
                     // Handle basic filters
                     query = query.eq(key, value);
                }
            });

            const from = (page - 1) * pageSize;
            const to = from + pageSize - 1;
            query = query.range(from, to);
            query = query.order(sort.column, { ascending: sort.ascending });

            const { data, count, error } = await query;

            if (error) throw error;

            const mappedData: VoterData[] = (data || []).map((row: any) => ({
                ...row,
                'LÍDER': row.leaders?.full_name || 'Sin Asignar',
                leader_name: row.leaders?.full_name || 'Sin Asignar',
                'NOMBRES': row.first_name,
                'APELLIDOS': row.last_name,
                'No DE CÉDULA SIN PUNTOS': row.document_number,
                'TELÉFONO': row.phone,
                'DIRECCIÓN DE RESIDENCIA': row.address,
                'BARRIO DE RESIDENCIA': row.neighborhood,
                'PUESTO DE VOTACIÓN': row.voting_post,
                'DIRECCIÓN (Pto de votación)': row.voting_post_address,
                'MESA': row.voting_table,
                'MUNICIPIO VOTACIÓN': row.voting_municipality,
                'INVALIDA': row.is_invalid_cc,
                _id: row.id
            }));

            return { data: mappedData, count: count || 0 };

        } catch (error) {
            console.error("Error fetching voters:", error);
            return { data: [], count: 0 };
        } finally {
            setIsLoading(false);
            stopLoading();
        }
    };

    const updateVoter = async (id: string, updates: Partial<VoterData>): Promise<{ success: boolean; error?: string }> => {
        const dbUpdates: any = {};
        if (updates['TELÉFONO'] !== undefined) dbUpdates.phone = updates['TELÉFONO'];
        if (updates['DIRECCIÓN DE RESIDENCIA'] !== undefined) dbUpdates.address = updates['DIRECCIÓN DE RESIDENCIA'];
        if (updates['PUESTO DE VOTACIÓN'] !== undefined) dbUpdates.voting_post = updates['PUESTO DE VOTACIÓN'];
        if (updates['DIRECCIÓN (Pto de votación)'] !== undefined) dbUpdates.voting_post_address = updates['DIRECCIÓN (Pto de votación)'];
        if (updates['MESA'] !== undefined) dbUpdates.voting_table = updates['MESA'];
        if (updates['MUNICIPIO VOTACIÓN'] !== undefined) dbUpdates.voting_municipality = updates['MUNICIPIO VOTACIÓN'];
        if (updates['INVALIDA'] !== undefined) dbUpdates.is_invalid_cc = updates['INVALIDA'];
        if (updates['No DE CÉDULA SIN PUNTOS'] !== undefined) dbUpdates.document_number = updates['No DE CÉDULA SIN PUNTOS'];

        if (Object.keys(dbUpdates).length > 0) {
            try {
                const { error } = await supabase.from('voters').update(dbUpdates).eq('id', id);
                if (error) return { success: false, error: error.message };
                fetchGlobalStats();
                return { success: true };
            } catch (err: any) {
                return { success: false, error: err?.message || "Unknown error" };
            }
        }
        return { success: true };
    };

    const refreshVoters = async () => {
        await fetchGlobalStats();
    };

    return (
        <VoterContext.Provider value={{ voters, setVoters, stats, refreshVoters, isLoading, updateVoter, fetchVoters, fetchGlobalStats }}>
            {children}
        </VoterContext.Provider>
    );
}

export function useVoters() {
    const context = useContext(VoterContext);
    if (context === undefined) {
        throw new Error('useVoters must be used within a VoterProvider');
    }
    return context;
}
