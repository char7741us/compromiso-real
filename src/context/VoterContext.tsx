import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '../supabase';

// Define the shape of a Voter record based on the CSV columns
export interface VoterData {
    [key: string]: any;
}

interface VoterContextType {
    voters: VoterData[];
    setVoters: (data: VoterData[]) => void;
    updateVoter: (id: string, updates: Partial<VoterData>) => Promise<{ success: boolean; error?: string }>;
    refreshVoters: () => Promise<void>;
    isLoading: boolean;
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
    const [voters, setVoters] = useState<VoterData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    const refreshVoters = async () => {
        setIsLoading(true);
        try {
            // Fetch voters from Supabase
            // Limit to 10000 to ensure mostly all voters are loaded for local verification
            const { data, error } = await supabase
                .from('voters')
                .select(`
                    *,
                    leaders (
                        full_name
                    )
                `)
                .order('created_at', { ascending: false })
                .limit(10000);

            if (error) {
                console.error("Error fetching voters:", error);
                return;
            }

            if (data) {
                // Map DB columns back to UI expected keys (CSV headers) for compatibility
                const mappedData: VoterData[] = data.map((row: any) => ({
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
                    'INVALIDA': row.is_invalid_cc, // MAPPED FROM DB
                    _id: row.id
                }));
                setVoters(mappedData);
            }
        } catch (err) {
            console.error("Unexpected error fetching voters:", err);
        } finally {
            setIsLoading(false);
        }
    };

    // Update locally and in Supabase
    const updateVoter = async (id: string, updates: Partial<VoterData>): Promise<{ success: boolean; error?: string }> => {
        console.log("updateVoter called for:", id, "with updates:", updates);

        // 1. Optimistic Update
        setVoters(prev => prev.map(v =>
            v._id === id ? { ...v, ...updates } : v
        ));

        // 2. Persist to Supabase
        const dbUpdates: any = {};
        if (updates['TELÉFONO'] !== undefined) dbUpdates.phone = updates['TELÉFONO'];
        if (updates['DIRECCIÓN DE RESIDENCIA'] !== undefined) dbUpdates.address = updates['DIRECCIÓN DE RESIDENCIA'];
        if (updates['PUESTO DE VOTACIÓN'] !== undefined) dbUpdates.voting_post = updates['PUESTO DE VOTACIÓN'];
        if (updates['DIRECCIÓN (Pto de votación)'] !== undefined) dbUpdates.voting_post_address = updates['DIRECCIÓN (Pto de votación)'];
        if (updates['MESA'] !== undefined) dbUpdates.voting_table = updates['MESA'];
        if (updates['MUNICIPIO VOTACIÓN'] !== undefined) dbUpdates.voting_municipality = updates['MUNICIPIO VOTACIÓN'];

        // Fix for Invalid CC and Document Number
        if (updates['INVALIDA'] !== undefined) dbUpdates.is_invalid_cc = updates['INVALIDA'];
        if (updates['No DE CÉDULA SIN PUNTOS'] !== undefined) dbUpdates.document_number = updates['No DE CÉDULA SIN PUNTOS'];

        console.log("Sending to Supabase:", dbUpdates);

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
                    console.log("Supabase update successful");
                    return { success: true };
                }
            } catch (err: any) {
                console.error("Unexpected error updating voter:", err);
                return { success: false, error: err?.message || "Unknown error" };
            }
        } else {
            console.warn("No valid DB updates found to send.");
            return { success: true }; // Nothing to update is essentially a success
        }
    };

    useEffect(() => {
        refreshVoters();

        // Real-time subscription
        const channel = supabase
            .channel('public:voters')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'voters' },
                (payload) => {
                    console.log('Real-time change detected:', payload);
                    refreshVoters();
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    // Calculate quick stats derived from the data
    const stats = {
        total: voters.length,
        missingPhone: voters.filter(v => !v['TELÉFONO']?.trim()).length,
        missingAddress: voters.filter(v => !v['DIRECCIÓN DE RESIDENCIA']?.trim()).length,
        missingVotingPost: voters.filter(v => !v['PUESTO DE VOTACIÓN']?.trim()).length,
        invalidIds: voters.filter(v => v['INVALIDA']).length,
    };

    return (
        <VoterContext.Provider value={{ voters, setVoters, stats, refreshVoters, isLoading, updateVoter }}>
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
