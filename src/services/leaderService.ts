import { supabase } from '../supabase';
import type { Leader, LeaderFormData, Voter } from '../types/leader.types';

export const leaderService = {
    // --- Leaders CRUD ---
    getLeaders: async (): Promise<Leader[]> => {
        const { data, error } = await supabase
            .from('leaders')
            .select(`
                *,
                voters:voters(count)
            `)
            .order('full_name');

        if (error) throw error;

        return data.map((l: any) => ({
            ...l,
            total_voters: l.voters?.[0]?.count || 0,
            goal_progress: l.goal > 0 ? ((l.voters?.[0]?.count || 0) / l.goal) * 100 : 0
        }));
    },

    getLeaderById: async (id: string): Promise<Leader | null> => {
        const { data, error } = await supabase
            .from('leaders')
            .select(`*, voters:voters(count)`)
            .eq('id', id)
            .single();

        if (error) return null;

        return {
            ...data,
            total_voters: data.voters?.[0]?.count || 0,
            goal_progress: data.goal > 0 ? ((data.voters?.[0]?.count || 0) / data.goal) * 100 : 0
        };
    },

    createLeader: async (formData: LeaderFormData): Promise<Leader> => {
        // Upload photo if exists
        let photo_url = '';
        if (formData.photoFile) {
            const fileName = `${Date.now()}_${formData.photoFile.name}`;
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, formData.photoFile);

            if (uploadError) throw uploadError;
            const { data: publicUrl } = supabase.storage.from('avatars').getPublicUrl(fileName);
            photo_url = publicUrl.publicUrl;
        }

        const { data, error } = await supabase.from('leaders').insert([{
            full_name: formData.full_name,
            document_number: formData.document_number,
            phone: formData.phone,
            email: formData.email,
            goal: formData.goal,
            active: formData.active,
            zone: formData.zone,
            municipality: formData.municipality,
            neighborhood: formData.neighborhood,
            photo_url: photo_url || null
        }]).select().single();

        if (error) throw error;
        return data;
    },

    updateLeader: async (id: string, formData: Partial<LeaderFormData>): Promise<void> => {
        const updates: any = { ...formData };
        delete updates.photoFile; // Handle separately if needed

        if (formData.photoFile) {
            const fileName = `${Date.now()}_${formData.photoFile.name}`;
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(fileName, formData.photoFile);
            if (!uploadError) {
                const { data: publicUrl } = supabase.storage.from('avatars').getPublicUrl(fileName);
                updates.photo_url = publicUrl.publicUrl;
            }
        }

        const { error } = await supabase.from('leaders').update(updates).eq('id', id);
        if (error) throw error;
    },

    deleteLeader: async (id: string): Promise<void> => {
        // Check for voters first? DB constraint might restrict this.
        // For now, assuming CASCADE or manual check
        const { error } = await supabase.from('leaders').delete().eq('id', id);
        if (error) throw error;
    },

    // --- Voters Sub-management ---
    getVotersByLeader: async (leaderId: string): Promise<Voter[]> => {
        const { data, error } = await supabase
            .from('voters')
            .select('*')
            .eq('leader_id', leaderId)
            .order('first_name');

        if (error) throw error;
        return data;
    },

    addVoterToLeader: async (leaderId: string, voter: Partial<Voter>): Promise<void> => {
        const { error } = await supabase.from('voters').insert([{
            ...voter,
            leader_id: leaderId
        }]);
        if (error) throw error;
    },

    removeVoterFromLeader: async (voterId: string): Promise<void> => {
        // Option 1: Delete voter
        // const { error } = await supabase.from('voters').delete().eq('id', voterId);

        // Option 2: Unlink (set leader_id to null) - User asked to "delete"
        const { error } = await supabase.from('voters').delete().eq('id', voterId);
        if (error) throw error;
    }
};
