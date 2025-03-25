let domainMap = null;

/**
 * Loads the disposable email domains list from the external source.
 * This function is called once and caches the result in `domainMap`.
 */
async function loadDisposableDomains() {
    if (domainMap) return; // Already loaded

    try {
        const response = await fetch(
            'https://disposable.github.io/disposable-email-domains/domains.json',
        );
        const domains = await response.json();

        domainMap = new Set(domains);
    } catch (error) {
        console.error('Failed to fetch disposable email domains:', error);
        domainMap = new Set(); // Default to empty set if the request fails
    }
}

export async function validateDisposable(domainOrEmail, callback) {
    await loadDisposableDomains(); // Ensure domains are loaded

    const domain = domainOrEmail.split('@').pop();
    const isValid = !domainMap.has(domain);

    if (!callback) {
        return isValid;
    }

    callback(null, isValid);
}
