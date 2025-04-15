/**
 * Calculate a contrasting color for text based on a background color.
 *
 * @param {string} hex - The hex color code (with or without # prefix)
 * @param {boolean} bw - If true, returns black or white for best contrast. If false, returns the inverted color.
 * @returns {string} - A contrasting color in hex format
 */
export const colorContrast = (hex, bw) => {
    if (!hex) {
        return null;
    }

    // Remove # prefix if present
    if (hex.indexOf('#') === 0) {
        hex = hex.slice(1);
    }

    // Convert 3-digit hex to 6-digits
    if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
    }

    // Validate hex length
    if (hex.length !== 6) {
        console.warn('Invalid HEX color:', hex);
        return bw ? '#1a1511' : '#fff';
    }

    // Parse RGB components
    var r = parseInt(hex.slice(0, 2), 16),
        g = parseInt(hex.slice(2, 4), 16),
        b = parseInt(hex.slice(4, 6), 16);

    if (bw) {
        // Calculate relative luminance according to WCAG 2.0
        // https://www.w3.org/TR/WCAG20-TECHS/G17.html

        // Convert RGB to sRGB
        const sR = r / 255;
        const sG = g / 255;
        const sB = b / 255;

        // Calculate RGB components for luminance
        const R = sR <= 0.03928 ? sR / 12.92 : Math.pow((sR + 0.055) / 1.055, 2.4);
        const G = sG <= 0.03928 ? sG / 12.92 : Math.pow((sG + 0.055) / 1.055, 2.4);
        const B = sB <= 0.03928 ? sB / 12.92 : Math.pow((sB + 0.055) / 1.055, 2.4);

        // Calculate luminance
        const luminance = 0.2126 * R + 0.7152 * G + 0.0722 * B;

        // Calculate contrast ratios with white and black
        // White has luminance of 1, black has luminance of 0
        const contrastWithWhite = (1 + 0.05) / (luminance + 0.05);
        const contrastWithBlack = (luminance + 0.05) / (0 + 0.05);

        // Return the color with better contrast (higher ratio)
        return contrastWithWhite > contrastWithBlack ? '#fff' : '#1a1511';
    }

    // Invert color components
    r = (255 - r).toString(16);
    g = (255 - g).toString(16);
    b = (255 - b).toString(16);

    // Pad each with zeros and return
    return '#' + r.padStart(2, '0') + g.padStart(2, '0') + b.padStart(2, '0');
};
