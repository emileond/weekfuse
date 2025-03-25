import { validateEmail } from './validateEmail.js';
import { verifyRecords } from './verifyRecords.js';
import { cacheDate } from './cacheDate.js';

/**
 * Handles email validation, verification, scoring, and caching.
 * Can be used in both frontend (React) and backend (CF Worker).
 *
 * @param {string} email - The email address to validate.
 * @param {object} supabase - (Optional) Supabase client instance for backend usage.
 * @returns {object} - Validation result.
 */
export async function processEmailValidation(email, supabase = null) {
    const validationResult = await validateEmail(email);

    if (validationResult.syntax_error || validationResult.disposable) {
        return {
            email,
            status: 'undeliverable',
            score: 0,
            syntax_error: validationResult.syntax_error,
            gibberish: null,
            role: null,
            did_you_mean: null,
            disposable: validationResult.disposable,
            domain_status: null,
            mx_record: null,
        };
    }

    let score = validationResult.score;
    const domain = email.split('@')[1];

    if (supabase) {
        // Check domain cache in backend
        const { data: cachedData } = await supabase
            .from('domain_cache')
            .select('*')
            .eq('domain', domain)
            .gte('last_updated', cacheDate)
            .single();

        if (cachedData) {
            const { domain_status, mx_record } = cachedData;
            score += domain_status === 'active' ? 20 : -20;
            score += mx_record ? 30 : -30;

            return {
                email,
                status: score >= 75 ? 'deliverable' : score >= 60 ? 'risky' : 'undeliverable',
                score: Math.max(0, Math.min(100, score)),
                syntax_error: validationResult.syntax_error,
                gibberish: validationResult.gibberish,
                role: validationResult.role,
                did_you_mean: validationResult.did_you_mean,
                disposable: validationResult.disposable,
                domain_status,
                mx_record,
            };
        }

        // If not cached, verify records
        const recordsResult = await verifyRecords(domain);
        await supabase.from('domain_cache').insert({
            domain,
            domain_status: recordsResult.domain_status,
            mx_record: recordsResult.mx_record,
        });

        score += recordsResult.score;

        return {
            email,
            status: score >= 75 ? 'deliverable' : score >= 60 ? 'risky' : 'undeliverable',
            score: Math.max(0, Math.min(100, score)),
            syntax_error: validationResult.syntax_error,
            gibberish: validationResult.gibberish,
            role: validationResult.role,
            did_you_mean: validationResult.did_you_mean,
            disposable: validationResult.disposable,
            domain_status: recordsResult?.domain_status ?? null,
            mx_record: recordsResult?.mx_record ?? null,
        };
    }
}
