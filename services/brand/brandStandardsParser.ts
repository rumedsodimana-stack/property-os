/**
 * Brand Standards Parser
 * 
 * Parses AI analysis output into structured brand standards
 * that can be used to generate code modifications
 */

export interface BrandIdentity {
    name?: string;
    tagline?: string;
    logo?: string;
}

export interface BrandColors {
    primary: string;
    secondary?: string;
    accent?: string;
    background?: string;
    text?: string;
    success?: string;
    warning?: string;
    error?: string;
    [key: string]: string | undefined;
}

export interface BrandTypography {
    primaryFont: string;
    secondaryFont?: string;
    fontUrl?: string;
    headingFont?: string;
    bodyFont?: string;
}

export interface OperatingHours {
    checkIn: string;  // 24h format HH:MM
    checkOut: string; // 24h format HH:MM
    reception?: { open: string; close: string; };
    restaurant?: {
        breakfast?: string;
        lunch?: string;
        dinner?: string;
    };
    [key: string]: any;
}

export interface BrandPolicies {
    cancellation?: string;
    petPolicy?: string;
    smoking?: string;
    childPolicy?: string;
    depositPolicy?: string;
    [key: string]: string | undefined;
}

export interface BrandStandards {
    identity: BrandIdentity;
    colors: BrandColors;
    typography: BrandTypography;
    operatingHours: OperatingHours;
    policies: BrandPolicies;
    extractedFrom?: string;
    timestamp?: string;
}

export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}

export class BrandStandardsParser {
    /**
     * Parse AI response into structured brand standards
     */
    parseFromAIResponse(aiOutput: string): BrandStandards {
        const standards: BrandStandards = {
            identity: this.extractIdentity(aiOutput),
            colors: this.extractColors(aiOutput),
            typography: this.extractTypography(aiOutput),
            operatingHours: this.extractOperatingHours(aiOutput),
            policies: this.extractPolicies(aiOutput),
            extractedFrom: 'AI Analysis',
            timestamp: new Date().toISOString()
        };

        return standards;
    }

    /**
     * Extract brand identity (name, tagline)
     */
    private extractIdentity(text: string): BrandIdentity {
        const identity: BrandIdentity = {};

        // Extract hotel/brand name
        const namePatterns = [
            /(?:hotel|brand)\s+name[:\s]+([^\n]+)/i,
            /^([A-Z][^\n]{3,30})\s+(?:hotel|brand|standards)/im,
            /brand[:\s]+([^\n]+)/i
        ];

        for (const pattern of namePatterns) {
            const match = text.match(pattern);
            if (match) {
                identity.name = match[1].trim();
                break;
            }
        }

        // Extract tagline
        const taglineMatch = text.match(/tagline[:\s]+([^\n]+)/i);
        if (taglineMatch) {
            identity.tagline = taglineMatch[1].trim();
        }

        return identity;
    }

    /**
     * Extract colors from text (hex codes, RGB, color names)
     */
    extractColors(text: string): BrandColors {
        const colors: BrandColors = { primary: '#4F46E5' }; // Default

        // Extract hex colors with labels
        const hexPatterns = [
            /primary\s+color[:\s]+#([0-9A-Fa-f]{6})/i,
            /secondary\s+color[:\s]+#([0-9A-Fa-f]{6})/i,
            /accent\s+color[:\s]+#([0-9A-Fa-f]{6})/i,
            /background\s+color[:\s]+#([0-9A-Fa-f]{6})/i,
            /text\s+color[:\s]+#([0-9A-Fa-f]{6})/i,
        ];

        hexPatterns.forEach((pattern, index) => {
            const match = text.match(pattern);
            if (match) {
                const key = ['primary', 'secondary', 'accent', 'background', 'text'][index];
                colors[key] = `#${match[1].toUpperCase()}`;
            }
        });

        // Extract any hex color codes
        const allHexCodes = text.match(/#([0-9A-Fa-f]{6})/g) || [];
        if (allHexCodes.length > 0 && !colors.primary) {
            colors.primary = allHexCodes[0];
        }
        if (allHexCodes.length > 1 && !colors.secondary) {
            colors.secondary = allHexCodes[1];
        }
        if (allHexCodes.length > 2 && !colors.accent) {
            colors.accent = allHexCodes[2];
        }

        return colors;
    }

    /**
     * Extract typography/fonts
     */
    private extractTypography(text: string): BrandTypography {
        const typography: BrandTypography = { primaryFont: 'Inter' }; // Default

        // Font patterns
        const fontPatterns = [
            /(?:primary\s+)?font[:\s]+([A-Za-z\s]+?)(?:\n|,|;)/i,
            /typeface[:\s]+([A-Za-z\s]+?)(?:\n|,|;)/i,
            /heading\s+font[:\s]+([A-Za-z\s]+?)(?:\n|,|;)/i,
        ];

        for (const pattern of fontPatterns) {
            const match = text.match(pattern);
            if (match) {
                typography.primaryFont = match[1].trim();
                break;
            }
        }

        // Secondary font
        const secondaryMatch = text.match(/secondary\s+font[:\s]+([A-Za-z\s]+?)(?:\n|,|;)/i);
        if (secondaryMatch) {
            typography.secondaryFont = secondaryMatch[1].trim();
        }

        return typography;
    }

    /**
     * Extract operating hours
     */
    extractOperatingHours(text: string): OperatingHours {
        const hours: OperatingHours = {
            checkIn: '15:00',  // Defaults
            checkOut: '11:00'
        };

        // Check-in patterns
        const checkInPatterns = [
            /check-?in[:\s]+(\d{1,2}):?(\d{2})?\s*(am|pm)?/i,
            /check-?in[:\s]+(\d{1,2})\s*(am|pm)/i,
        ];

        for (const pattern of checkInPatterns) {
            const match = text.match(pattern);
            if (match) {
                hours.checkIn = this.convertTo24Hour(match[1], match[2] || '00', match[3]);
                break;
            }
        }

        // Check-out patterns
        const checkOutPatterns = [
            /check-?out[:\s]+(\d{1,2}):?(\d{2})?\s*(am|pm)?/i,
            /check-?out[:\s]+(\d{1,2})\s*(am|pm)/i,
        ];

        for (const pattern of checkOutPatterns) {
            const match = text.match(pattern);
            if (match) {
                hours.checkOut = this.convertTo24Hour(match[1], match[2] || '00', match[3]);
                break;
            }
        }

        return hours;
    }

    /**
     * Convert 12-hour time to 24-hour format
     */
    private convertTo24Hour(hour: string, minute: string = '00', period?: string): string {
        let h = parseInt(hour);
        const m = minute || '00';

        if (period) {
            const isPM = period.toLowerCase() === 'pm';
            if (isPM && h < 12) h += 12;
            if (!isPM && h === 12) h = 0;
        }

        return `${h.toString().padStart(2, '0')}:${m}`;
    }

    /**
     * Extract policies
     */
    private extractPolicies(text: string): BrandPolicies {
        const policies: BrandPolicies = {};

        // Cancellation policy
        const cancellationMatch = text.match(/cancellation\s+policy[:\s]+([^\n]+)/i);
        if (cancellationMatch) {
            policies.cancellation = cancellationMatch[1].trim();
        }

        // Pet policy
        const petMatch = text.match(/pet\s+policy[:\s]+([^\n]+)/i);
        if (petMatch) {
            policies.petPolicy = petMatch[1].trim();
        }

        // Smoking policy
        const smokingMatch = text.match(/smoking\s+policy[:\s]+([^\n]+)/i);
        if (smokingMatch) {
            policies.smoking = smokingMatch[1].trim();
        }

        return policies;
    }

    /**
     * Validate brand standards
     */
    validateStandards(standards: BrandStandards): ValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];

        // Validate colors
        if (!this.isValidHexColor(standards.colors.primary)) {
            errors.push(`Invalid primary color: ${standards.colors.primary}`);
        }
        if (standards.colors.secondary && !this.isValidHexColor(standards.colors.secondary)) {
            warnings.push(`Invalid secondary color: ${standards.colors.secondary}`);
        }

        // Validate times
        if (!this.isValidTime(standards.operatingHours.checkIn)) {
            errors.push(`Invalid check-in time: ${standards.operatingHours.checkIn}`);
        }
        if (!this.isValidTime(standards.operatingHours.checkOut)) {
            errors.push(`Invalid check-out time: ${standards.operatingHours.checkOut}`);
        }

        // Validate fonts
        if (!standards.typography.primaryFont) {
            warnings.push('No primary font specified');
        }

        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }

    /**
     * Validate hex color format
     */
    private isValidHexColor(color: string): boolean {
        return /^#[0-9A-Fa-f]{6}$/.test(color);
    }

    /**
     * Validate 24-hour time format
     */
    private isValidTime(time: string): boolean {
        const match = time.match(/^(\d{2}):(\d{2})$/);
        if (!match) return false;

        const hours = parseInt(match[1]);
        const minutes = parseInt(match[2]);

        return hours >= 0 && hours < 24 && minutes >= 0 && minutes < 60;
    }

    /**
     * Extract specific times from text
     */
    extractTimes(text: string): { [key: string]: string } {
        const times: { [key: string]: string } = {};

        const timePattern = /(\w+)[:\s]+(\d{1,2}):?(\d{2})?\s*(am|pm)?/gi;
        let match;

        while ((match = timePattern.exec(text)) !== null) {
            const label = match[1].toLowerCase();
            const time = this.convertTo24Hour(match[2], match[3], match[4]);
            times[label] = time;
        }

        return times;
    }
}

// Export singleton instance
export const brandStandardsParser = new BrandStandardsParser();
