import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '../supabase';

// Define the shape of a Voter record based on the CSV columns
export interface VoterData {
    [key: string]: any;
}

interface VoterContextType {
    // Deprecated: We no longer load all voters into memory.
    // This will return an empty array. Pages must fetch their own data.
    voters: VoterData[];
    setVoters: (data: VoterData[]) => void; // Deprecated

    updateVoter: (id: string, updates: Partial<VoterData>) => Promise<{ success: boolean; error?: string }>;
    refreshVoters: () => Promise<void>;
    isLoading: boolean;

    fetchStats: () => Promise<void>;
    stats: {
        total: number;
        missingPhone: number;
        missingAddress: number;
        missingVotingPost: number;
        invalidIds: number;
    };
}

const VoterContext = createContext<VoterContextType | undefined>(undefined);

export function VoterProvider({ children }: { children: ReactNode }) {
    const [voters, setVoters] = useState<VoterData[]>([]); // Always empty now
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState({
        total: 0,
        missingPhone: 0,
        missingAddress: 0,
        missingVotingPost: 0,
        invalidIds: 0,
    });

    const fetchStats = async () => {
        setIsLoading(true);
        try {
            // Run count queries in parallel
            const [
                { count: total },
                { count: invalidIds },
                { count: missingPhone },
                { count: missingAddress },
                { count: missingPost }
            ] = await Promise.all([
                supabase.from('voters').select('*', { count: 'exact', head: true }),
                supabase.from('voters').select('*', { count: 'exact', head: true }).eq('is_invalid_cc', true),
                // check for null OR empty string
                supabase.from('voters').select('*', { count: 'exact', head: true }).or('phone.is.null,phone.eq.""'),
                supabase.from('voters').select('*', { count: 'exact', head: true }).or('address.is.null,address.eq.""'),
                supabase.from('voters').select('*', { count: 'exact', head: true }).or('voting_post.is.null,voting_post.eq.""'),
            ]);

            setStats({
                total: total || 0,
                invalidIds: invalidIds || 0,
                missingPhone: missingPhone || 0,
                missingAddress: missingAddress || 0,
                missingVotingPost: missingPost || 0
            });

        } catch (err) {
            console.error("Error fetching stats:", err);
        } finally {
            setIsLoading(false);
        }
    };

    // Update in Supabase (Logic simplified to just DB call)
    const updateVoter = async (id: string, updates: Partial<VoterData>): Promise<{ success: boolean; error?: string }> => {
        console.log("updateVoter called for:", id, "with updates:", updates);

        const dbUpdates: any = {};

        // Map UI keys to DB columns
        if (updates['TELÉFONO'] !== undefined) dbUpdates.phone = updates['TELÉFONO'];
        if (updates['DIRECCIÓN DE RESIDENCIA'] !== undefined) dbUpdates.address = updates['DIRECCIÓN DE RESIDENCIA'];
        if (updates['PUESTO DE VOTACIÓN'] !== undefined) dbUpdates.voting_post = updates['PUESTO DE VOTACIÓN'];
        if (updates['DIRECCIÓN (Pto de votación)'] !== undefined) dbUpdates.voting_post_address = updates['DIRECCIÓN (Pto de votación)'];
        if (updates['MESA'] !== undefined) dbUpdates.voting_table = updates['MESA'];
        if (updates['MUNICIPIO VOTACIÓN'] !== undefined) dbUpdates.voting_municipality = updates['MUNICIPIO VOTACIÓN'];
        if (updates['INVALIDA'] !== undefined) dbUpdates.is_invalid_cc = updates['INVALIDA'];
        if (updates['No DE CÉDULA SIN PUNTOS'] !== undefined) dbUpdates.document_number = updates['No DE CÉDULA SIN PUNTOS'];

        // Map Standard keys
        if (updates['first_name'] !== undefined) dbUpdates.first_name = updates['first_name'];
        if (updates['last_name'] !== undefined) dbUpdates.last_name = updates['last_name'];
        if (updates['leader_id'] !== undefined) dbUpdates.leader_id = updates['leader_id'];
        if (updates['neighborhood'] !== undefined) dbUpdates.neighborhood = updates['neighborhood'];
        if (updates['municipality'] !== undefined) dbUpdates.municipality = updates['municipality'];
        if (updates['department'] !== undefined) dbUpdates.department = updates['department'];
        if (updates['document_number'] !== undefined) dbUpdates.document_number = updates['document_number'];
        if (updates['phone'] !== undefined) dbUpdates.phone = updates['phone'];
        if (updates['address'] !== undefined) dbUpdates.address = updates['address'];
        if (updates['voting_post'] !== undefined) dbUpdates.voting_post = updates['voting_post'];
        if (updates['voting_table'] !== undefined) dbUpdates.voting_table = updates['voting_table'];

        if (Object.keys(dbUpdates).length > 0) {
            try {
                const { error } = await supabase
                    .from('voters')
                    .update(dbUpdates)
                    .eq('id', id);

                if (error) {
                    console.error("Error updating voter in DB:", error);
                    return { success: false, error: error.message };
                } else {
                    // Optionally refresh stats if critical fields changed
                    fetchStats();
                    return { success: true };
                }
            } catch (err: any) {
                console.error("Unexpected error updating voter:", err);
                return { success: false, error: err?.message || "Unknown error" };
            }
        } else {
            return { success: true };
        }
    };

    useEffect(() => {
        fetchStats();

        // Real-time subscription for Stats
        const channel = supabase
            .channel('public:voters')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'voters' },
                () => {
                    fetchStats();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return (
        <VoterContext.Provider value={{ voters, setVoters, stats, refreshVoters: fetchStats, fetchStats, isLoading, updateVoter }}>
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
