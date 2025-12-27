import mammoth from 'mammoth';
import type { AnalyzedPage } from '../types';

export class DOCXAnalyzer {
    async analyze(file: File): Promise<AnalyzedPage[]> {
        const arrayBuffer = await file.arrayBuffer();
        const result = await mammoth.convertToHtml({ arrayBuffer });
        const html = result.value;

        // NOTE: DOCX analysis via mammoth is limited for layout (no pages coordinates).
        // This is a stub to allow the file to be processed without crashing.
        // For full page-level validation (as requested by user), PDF is strongly preferred.

        console.warn("DOCX analysis is limited. Layout checks (centering, top-of-page) are disabled.");

        // We return a dummy single page with the full text content to generic pattern matching
        return [{
            pageIndex: 1,
            textItems: [{ str: html.replace(/<[^>]*>/g, ' '), x: 0, y: 0, width: 0, height: 0, fontName: '', hasEOL: false }],
            layoutIssues: [],
            warnings: ["DOCX Format detected. Layout validation (centering, margins) is NOT available. Please upload PDF for full validation."],
            isMainHeadingCentered: true, // Bypass
            isMainHeadingAtTop: true // Bypass
        }];
    }
}
