/**
 * Document Parser Service - PDF & OCR
 * 
 * Extracts text, images, and structured data from brand documents.
 * Supports PDFs, images, markdown/text, and scanned documents with OCR.
 */

import * as pdfjsLib from 'pdfjs-dist';
import { createWorker } from 'tesseract.js';

// Set worker path for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export interface ParsedDocument {
    text: string;
    images: string[]; // Base64 encoded
    tables: any[];
    metadata: {
        pageCount: number;
        title?: string;
        author?: string;
        creationDate?: string;
    };
    structuredData?: {
        headings: string[];
        lists: string[][];
        emphasis: string[];
    };
}

export interface ParseOptions {
    extractImages?: boolean;
    performOCR?: boolean;
    preserveFormatting?: boolean;
    detectTables?: boolean;
}

class DocumentParser {
    private ocrWorker: any = null;

    /**
     * Parse PDF document
     */
    async parsePDF(
        file: File | ArrayBuffer,
        options: ParseOptions = {}
    ): Promise<ParsedDocument> {
        const arrayBuffer = file instanceof File
            ? await file.arrayBuffer()
            : file;

        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

        const metadata: any = await pdf.getMetadata();

        const result: ParsedDocument = {
            text: '',
            images: [],
            tables: [],
            metadata: {
                pageCount: pdf.numPages,
                title: metadata.info?.Title,
                author: metadata.info?.Author,
                creationDate: metadata.info?.CreationDate
            }
        };

        // Extract text from each page
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();

            // Combine text items
            const pageText = textContent.items
                .map((item: any) => item.str)
                .join(' ');

            result.text += pageText + '\n\n';

            // Extract images if requested
            if (options.extractImages) {
                const ops = await page.getOperatorList();
                const images = await this.extractImagesFromPage(page, ops);
                result.images.push(...images);
            }
        }

        // Perform OCR on images if text is sparse
        if (options.performOCR && result.text.trim().length < 100 && result.images.length > 0) {
            console.log('[Document Parser] Performing OCR on images...');
            const ocrText = await this.performOCR(result.images);
            result.text += '\n\n' + ocrText;
        }

        // Structure detection
        if (options.preserveFormatting) {
            result.structuredData = this.detectStructure(result.text);
        }

        return result;
    }

    /**
     * Parse image document with OCR
     */
    async parseImage(file: File): Promise<ParsedDocument> {
        const base64 = await this.fileToBase64(file);
        const text = await this.performOCR([base64]);

        return {
            text,
            images: [base64],
            tables: [],
            metadata: {
                pageCount: 1
            },
            structuredData: this.detectStructure(text)
        };
    }

    /**
     * Parse plain text / markdown document
     */
    async parseText(file: File): Promise<ParsedDocument> {
        const text = await file.text();

        return {
            text,
            images: [],
            tables: [],
            metadata: {
                pageCount: 1,
                title: file.name
            },
            structuredData: this.detectStructure(text)
        };
    }

    /**
     * Extract images from PDF page
     */
    private async extractImagesFromPage(page: any, ops: any): Promise<string[]> {
        const images: string[] = [];

        // This is a simplified version
        // Real implementation would process operator list for images
        // For now, return empty array

        return images;
    }

    /**
     * Perform OCR on images
     */
    private async performOCR(images: string[]): Promise<string> {
        if (!this.ocrWorker) {
            this.ocrWorker = await createWorker('eng');
        }

        const results: string[] = [];

        for (const image of images) {
            try {
                const { data: { text } } = await this.ocrWorker.recognize(image);
                results.push(text);
            } catch (error) {
                console.error('[OCR] Failed to process image:', error);
            }
        }

        return results.join('\n\n');
    }

    /**
     * Detect document structure
     */
    private detectStructure(text: string): ParsedDocument['structuredData'] {
        const lines = text.split('\n');
        const headings: string[] = [];
        const lists: string[][] = [];
        const emphasis: string[] = [];

        let currentList: string[] = [];

        for (const line of lines) {
            const trimmed = line.trim();

            // Detect headings (simple heuristic)
            if (trimmed.length > 0 && trimmed.length < 100 && /^[A-Z]/.test(trimmed) && !trimmed.endsWith('.')) {
                headings.push(trimmed);
            }

            // Detect lists
            if (/^[-•*]\s/.test(trimmed) || /^\d+\.\s/.test(trimmed)) {
                currentList.push(trimmed);
            } else if (currentList.length > 0) {
                lists.push([...currentList]);
                currentList = [];
            }

            // Detect emphasis (CAPS, bold markers)
            const emphasisMatches = trimmed.match(/\b[A-Z]{4,}\b/g);
            if (emphasisMatches) {
                emphasis.push(...emphasisMatches);
            }
        }

        if (currentList.length > 0) {
            lists.push(currentList);
        }

        return { headings, lists, emphasis };
    }

    /**
     * Extract colors from document
     */
    extractColors(text: string): Record<string, string> {
        const colors: Record<string, string> = {};

        // Match hex colors
        const hexMatches = text.match(/#[A-Fa-f0-9]{6}/g);
        if (hexMatches) {
            hexMatches.forEach((hex, index) => {
                // Try to find label before the hex
                const context = text.substring(
                    Math.max(0, text.indexOf(hex) - 50),
                    text.indexOf(hex)
                );

                const label = this.inferColorLabel(context) || `color_${index + 1}`;
                colors[label] = hex;
            });
        }

        // Match RGB colors
        const rgbMatches = text.match(/rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)/gi);
        if (rgbMatches) {
            rgbMatches.forEach((rgb, index) => {
                const hex = this.rgbToHex(rgb);
                const context = text.substring(
                    Math.max(0, text.indexOf(rgb) - 50),
                    text.indexOf(rgb)
                );
                const label = this.inferColorLabel(context) || `rgb_color_${index + 1}`;
                colors[label] = hex;
            });
        }

        return colors;
    }

    /**
     * Extract times from document
     */
    extractTimes(text: string): Record<string, string> {
        const times: Record<string, string> = {};

        // Match time patterns (14:00, 2:30 PM, etc.)
        const timeMatches = text.match(/\b(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)?\b/g);
        if (timeMatches) {
            timeMatches.forEach(time => {
                const context = text.substring(
                    Math.max(0, text.indexOf(time) - 100),
                    text.indexOf(time)
                );
                const label = this.inferTimeLabel(context) || time;
                times[label] = time;
            });
        }

        return times;
    }

    /**
     * Extract policy keywords
     */
    extractPolicies(text: string): string[] {
        const policies: string[] = [];
        const keywords = [
            'required', 'mandatory', 'must', 'shall', 'prohibited',
            'forbidden', 'not allowed', 'compulsory', 'obligatory'
        ];

        const sentences = text.split(/[.!?]+/);

        for (const sentence of sentences) {
            const lower = sentence.toLowerCase();
            if (keywords.some(keyword => lower.includes(keyword))) {
                policies.push(sentence.trim());
            }
        }

        return policies;
    }

    /**
     * Infer color label from context
     */
    private inferColorLabel(context: string): string | null {
        const lower = context.toLowerCase();

        if (lower.includes('primary')) return 'primary';
        if (lower.includes('secondary')) return 'secondary';
        if (lower.includes('accent')) return 'accent';
        if (lower.includes('error') || lower.includes('danger')) return 'error';
        if (lower.includes('warning')) return 'warning';
        if (lower.includes('success')) return 'success';
        if (lower.includes('info')) return 'info';

        return null;
    }

    /**
     * Infer time label from context
     */
    private inferTimeLabel(context: string): string | null {
        const lower = context.toLowerCase();

        if (lower.includes('check') && lower.includes('in')) return 'checkInTime';
        if (lower.includes('check') && lower.includes('out')) return 'checkOutTime';
        if (lower.includes('breakfast')) return 'breakfastTime';
        if (lower.includes('lunch')) return 'lunchTime';
        if (lower.includes('dinner')) return 'dinnerTime';
        if (lower.includes('cleaning')) return 'cleaningTime';

        return null;
    }

    /**
     * Convert RGB to Hex
     */
    private rgbToHex(rgb: string): string {
        const matches = rgb.match(/\d+/g);
        if (!matches || matches.length < 3) return '#000000';

        const [r, g, b] = matches.map(Number);
        return '#' + [r, g, b]
            .map(x => x.toString(16).padStart(2, '0'))
            .join('');
    }

    /**
     * Convert file to base64
     */
    private fileToBase64(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    /**
     * Cleanup resources
     */
    async cleanup() {
        if (this.ocrWorker) {
            await this.ocrWorker.terminate();
            this.ocrWorker = null;
        }
    }
}

// Export singleton
export const documentParser = new DocumentParser();

// Export class for testing
export default DocumentParser;
