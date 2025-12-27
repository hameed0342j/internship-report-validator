import * as pdfjsLib from 'pdfjs-dist';
import type { WatermarkInfo, RRNValidation } from '../types';
import { extractRRN, validateRRNFormat, REPORT_RULES } from './rules';

// Use unpkg CDN for pdfjs-dist v5 worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@5.4.449/build/pdf.worker.min.mjs';

export class WatermarkDetector {
    /**
     * Enhanced RRN validation using rules.ts patterns
     * - Must be 12 digits
     * - First 2 digits must be between 20-25 (year 2020-2025)
     * - Digits 3-7 must be college code (17160 or 01716)
     * - Last 4-5 digits are roll number
     */
    validateRRN(text: string): RRNValidation {
        // Use the enhanced extraction from rules.ts
        const extractedRRNs = extractRRN(text);
        
        if (!extractedRRNs || extractedRRNs.length === 0) {
            return {
                isValid: false,
                expectedFormat: `12 digits (YY${REPORT_RULES.institution.collegeCode}XXXX)`,
                message: 'No 12-digit RRN found in document'
            };
        }

        // Check each extracted RRN for valid format
        for (const rrn of extractedRRNs) {
            const validation = validateRRNFormat(rrn);
            if (validation.isValid) {
                return {
                    isValid: true,
                    detectedRRN: rrn,
                    expectedFormat: `12 digits (YY${REPORT_RULES.institution.collegeCode}XXXX)`,
                    message: `Valid RRN: ${rrn} (Year: 20${validation.year}, College: ${validation.collegeCode}, Roll: ${validation.rollNumber})`,
                    yearCode: validation.year,
                    collegeCode: validation.collegeCode,
                    rollNumber: validation.rollNumber
                };
            }
        }

        // Found 12-digit numbers but none with valid format
        const firstRRN = extractedRRNs[0];
        const validation = validateRRNFormat(firstRRN);
        
        let errorDetails = '';
        const yearNum = validation.year ? parseInt(validation.year, 10) : 0;
        if (validation.year && (yearNum < 20 || yearNum > 25)) {
            errorDetails = `Year code ${validation.year} not in range 20-25`;
        } else if (validation.collegeCode && validation.collegeCode !== REPORT_RULES.institution.collegeCode && validation.collegeCode !== '01716') {
            errorDetails = `College code ${validation.collegeCode} doesn't match ${REPORT_RULES.institution.collegeCode}`;
        }

        return {
            isValid: false,
            detectedRRN: firstRRN,
            expectedFormat: `12 digits (YY${REPORT_RULES.institution.collegeCode}XXXX)`,
            message: `Found ${firstRRN} but invalid format. ${errorDetails}`.trim()
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
