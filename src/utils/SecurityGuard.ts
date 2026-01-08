/**
 * SecurityGuard Utility
 * Provides layers of defense against common web attacks.
 */

export const SecurityGuard = {
    /**
     * Honeypot detection: Bots often fill all fields in a form.
     * @param value The value of the hidden honeypot field.
     */
    isBot(value: string): boolean {
        return value.length > 0;
    },

    /**
     * Simple frontend rate limiter (sliding window).
     * @param userId A unique identifier for the user (e.g., email or IP hash).
     * @param limit Maximum attempts allowed.
     * @param windowMs Time window in milliseconds.
     */
    rateLimit: (() => {
        const attempts: Record<string, number[]> = {};

        return (userId: string, limit = 5, windowMs = 60000): boolean => {
            const now = Date.now();
            if (!attempts[userId]) attempts[userId] = [];

            // Remove attempts outside the window
            attempts[userId] = attempts[userId].filter(timestamp => now - timestamp < windowMs);

            if (attempts[userId].length >= limit) {
                return false; // Rate limit exceeded
            }

            attempts[userId].push(now);
            return true;
        };
    })(),

    /**
     * Basic input sanitization to prevent XSS and injections.
     * @param input Raw text input.
     */
    sanitize(input: string): string {
        if (!input) return '';
        return input
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;')
            .replace(/\//g, '&#x2F;');
    }
};
