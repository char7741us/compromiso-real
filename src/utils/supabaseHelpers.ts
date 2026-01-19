import { SupabaseClient } from '@supabase/supabase-js';

export const getPagination = (page: number, size: number) => {
    const limit = size ? size : 10;
    const from = page * limit;
    const to = from + size - 1;

    return { from, to };
};

export async function batchUpsert(
    supabase: SupabaseClient,
    table: string,
    data: any[],
    batchSize: number = 1000,
    onProgress?: (processed: number, total: number) => void
) {
    const errors: any[] = [];
    let successCount = 0;
    const total = data.length;

    for (let i = 0; i < total; i += batchSize) {
        const chunk = data.slice(i, i + batchSize);
        const { error } = await supabase
            .from(table)
            .upsert(chunk, { onConflict: table === 'voters' ? 'document_number' : 'full_name' });
            // Note: onConflict hardcoding is a bit risky for a generic helper,
            // but for this specific app it simplifies things.
            // Ideally passing the config is better.

        if (error) {
            console.error(`Error upserting batch ${i} - ${i + batchSize}:`, error);
            errors.push({ batchStart: i, error });
        } else {
            successCount += chunk.length;
        }

        if (onProgress) {
            onProgress(Math.min(i + batchSize, total), total);
        }
    }

    return { successCount, errors };
}

// More generic version where options are passed
export async function genericBatchUpsert(
    supabase: SupabaseClient,
    table: string,
    data: any[],
    options: { onConflict?: string, ignoreDuplicates?: boolean } = {},
    batchSize: number = 1000,
    onProgress?: (processed: number, total: number) => void
) {
    const errors: any[] = [];
    let successCount = 0;
    const total = data.length;

    for (let i = 0; i < total; i += batchSize) {
        const chunk = data.slice(i, i + batchSize);
        const { error } = await supabase
            .from(table)
            .upsert(chunk, options);

        if (error) {
            console.error(`Error upserting batch ${i} - ${i + batchSize}:`, error);
            errors.push({ batchStart: i, error });
        } else {
            successCount += chunk.length;
        }

        if (onProgress) {
            onProgress(Math.min(i + batchSize, total), total);
        }
    }

    return { successCount, errors };
}
