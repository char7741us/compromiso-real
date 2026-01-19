export interface Leader {
    id: string;
    full_name: string;
    document_number?: string;
    phone?: string;
    email?: string;
    photo_url?: string;
    goal: number;
    active: boolean;
    zone?: string;
    municipality?: string;
    neighborhood?: string;
    created_at: string;
    total_voters?: number;
    goal_progress?: number; // Calculated percentage
}

export interface Voter {
    id: string;
    leader_id: string | null;
    first_name: string;
    last_name: string;
    document_number: string;
    phone?: string;
    address?: string;
    voting_post?: string;
    voting_table?: string;
    neighborhood?: string;
    notes?: string;
}

export interface LeaderStats {
    totalLeaders: number;
    activeLeaders: number;
    totalVoters: number;
    globalGoal: number;
    globalProgress: number;
}

export interface LeaderFormData {
    full_name: string;
    document_number: string;
    phone: string;
    email: string;
    goal: number;
    active: boolean;
    zone: string;
    municipality: string;
    neighborhood: string;
    photoFile?: File | null;
}

export interface ImportResult {
    success: number;
    updated: number;
    errors: { row: number; error: string; data: any }[];
}
