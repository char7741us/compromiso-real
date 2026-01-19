import { SupabaseClient } from '@supabase/supabase-js';

interface BatchUpsertOptions {
    onConflict?: string;
    batchSize?: number;
}

/**
 * Upserts data in batches to avoid large payload errors or timeouts.
 *
 * @param supabase The Supabase client instance
 * @param table The table name to upsert into
 * @param data The array of data to upsert
 * @param options Options including batchSize (default 1000) and onConflict column
 */
export async function batchUpsert<T>(
    supabase: SupabaseClient,
    table: string,
    data: T[],
    options: BatchUpsertOptions = {}
): Promise<void> {
    const batchSize = options.batchSize || 1000;
    const { onConflict } = options;

    for (let i = 0; i < data.length; i += batchSize) {
        const chunk = data.slice(i, i + batchSize);
        // We cast chunk to any because typescript inference for dynamic table names is tricky
        // and we want this utility to be generic.
        const { error } = await supabase
            .from(table)
            .upsert(chunk as any, { onConflict });

        if (error) {
            throw error;
        }
    }
}
