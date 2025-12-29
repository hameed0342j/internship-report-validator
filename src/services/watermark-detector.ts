import * as pdfjsLib from 'pdfjs-dist';
import type { WatermarkInfo, RRNValidation } from '../types';

// Use unpkg CDN for pdfjs-dist v5 worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@5.4.449/build/pdf.worker.min.mjs';

export class WatermarkDetector {
    /**
     * Validates RRN format:
     * - Must be 12 digits
     * - First 2 digits must be between 20-25 (representing years 2020-2025)
     */
    validateRRN(text: string): RRNValidation {
        // Find all 12-digit numbers in the text
        const rrnPattern = /\b(\d{12})\b/g;
        const matches = text.match(rrnPattern);

        if (!matches || matches.length === 0) {
            return {
                isValid: false,
                expectedFormat: '12 digits (e.g., 230171601140)',
                message: 'No 12-digit RRN found in document'
            };
        }

        // Check each match for valid RRN format
        for (const match of matches) {
            const firstTwoDigits = parseInt(match.substring(0, 2), 10);
            if (firstTwoDigits >= 20 && firstTwoDigits <= 25) {
                return {
                    isValid: true,
                    detectedRRN: match,
                    expectedFormat: '12 digits starting with 20-25',
                    message: `Valid RRN detected: ${match}`
                };
            }
        }

        // Found 12-digit numbers but none with valid prefix
        return {
            isValid: false,
            detectedRRN: matches[0],
            expectedFormat: '12 digits starting with 20-25',
            message: `Found ${matches[0]} but first two digits must be between 20-25`
        };
    }

    async detect(file: File): Promise<WatermarkInfo> {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const numPages = pdf.numPages;

        const watermarkPages: number[] = [];
        let watermarkText = '';
        let allText = '';
        let confidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';

        // Sample pages for watermark detection (first 10 pages + some middle + last few)
        const pagesToCheck = [
            ...Array.from({ length: Math.min(10, numPages) }, (_, i) => i + 1),
            Math.floor(numPages / 2),
            numPages - 1,
            numPages
        ].filter((v, i, a) => a.indexOf(v) === i && v <= numPages);

        const watermarkCandidates: Map<string, number> = new Map();

        for (const pageNum of pagesToCheck) {
            const page = await pdf.getPage(pageNum);
            const textContent = await page.getTextContent();
            
            const pageText = textContent.items
                .map((item: unknown) => (item as { str: string }).str)
                .join(' ');
            
            allText += pageText + ' ';

            // Look for repeated text patterns that might be watermarks
            // Common watermark patterns:
            // 1. RRN numbers repeated across pages
            // 2. Text at specific positions (diagonal, header, footer)
            // 3. Faded/repeated text

            // Check for 12-digit RRN patterns
            const rrnMatches = pageText.match(/\b\d{12}\b/g);
            if (rrnMatches) {
                rrnMatches.forEach(rrn => {
                    const count = watermarkCandidates.get(rrn) || 0;
                    watermarkCandidates.set(rrn, count + 1);
                });
            }

            // Check for common watermark keywords
            const watermarkKeywords = [
                /confidential/i,
                /draft/i,
                /watermark/i,
                /sample/i,
                /copy/i,
                /original/i,
                /verified/i
            ];

            for (const keyword of watermarkKeywords) {
                if (keyword.test(pageText)) {
                    watermarkPages.push(pageNum);
                    break;
                }
            }
        }

        // Analyze watermark candidates
        // If an RRN appears on multiple pages, it's likely a watermark
        let bestCandidate = '';
        let maxOccurrences = 0;

        watermarkCandidates.forEach((count, text) => {
            if (count > maxOccurrences) {
                maxOccurrences = count;
                bestCandidate = text;
            }
        });

        // Determine confidence based on occurrence frequency
        const occurrenceRatio = maxOccurrences / pagesToCheck.length;
        
        if (bestCandidate && maxOccurrences >= 3) {
            watermarkText = bestCandidate;
            
            if (occurrenceRatio >= 0.8) {
                confidence = 'HIGH';
            } else if (occurrenceRatio >= 0.5) {
                confidence = 'MEDIUM';
            } else {
                confidence = 'LOW';
            }

            // Mark pages where this watermark appears
            for (const pageNum of pagesToCheck) {
                const page = await pdf.getPage(pageNum);
                const textContent = await page.getTextContent();
                const pageText = textContent.items
                    .map((item: unknown) => (item as { str: string }).str)
                    .join(' ');
                
                if (pageText.includes(bestCandidate)) {
                    if (!watermarkPages.includes(pageNum)) {
                        watermarkPages.push(pageNum);
                    }
                }
            }
        }

        // Validate RRN from all collected text
        const rrnValidation = this.validateRRN(allText);

        // If RRN is found and valid, use it as watermark indicator
        if (rrnValidation.isValid && rrnValidation.detectedRRN) {
            if (!watermarkText) {
                watermarkText = rrnValidation.detectedRRN;
            }
            
            // Boost confidence if RRN is valid
            if (confidence === 'LOW') {
                confidence = 'MEDIUM';
            }
        }

        return {
            hasWatermark: watermarkPages.length > 0 || !!watermarkText || rrnValidation.isValid,
            confidence,
            watermarkText: watermarkText || rrnValidation.detectedRRN,
            watermarkPages: [...new Set(watermarkPages)].sort((a, b) => a - b),
            rrnValidation
        };
    }
}
