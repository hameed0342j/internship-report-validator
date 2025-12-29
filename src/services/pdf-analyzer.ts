import * as pdfjsLib from 'pdfjs-dist';
import type { AnalyzedPage, TextItem, LayoutIssue } from '../types';
import { REPORT_RULES } from './rules';

// Use unpkg CDN for pdfjs-dist v5 worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@5.4.449/build/pdf.worker.min.mjs';

export class PDFAnalyzer {
    async analyze(file: File): Promise<AnalyzedPage[]> {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjsLib.getDocument(arrayBuffer);
        const pdf = await loadingTask.promise;
        const numPages = pdf.numPages;
        const analyzedPages: AnalyzedPage[] = [];

        for (let i = 1; i <= numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const viewport = page.getViewport({ scale: 1.0 });

            const items: TextItem[] = textContent.items.map((item: any) => ({
                str: item.str,
                x: item.transform[4],
                y: viewport.height - item.transform[5], // Convert PDF coordinates (bottom-left) to Top-Left
                width: item.width,
                height: item.height || item.transform[0], // Approximate height from font scale
                fontName: item.fontName,
                hasEOL: item.hasEOL
            }));

            const issues = this.analyzeLayout(items, viewport.width, viewport.height, i);

            analyzedPages.push({
                pageIndex: i,
                textItems: items,
                layoutIssues: issues.errors,
                warnings: issues.warnings,
                isMainHeadingCentered: issues.isMainHeadingCentered,
                isMainHeadingAtTop: issues.isMainHeadingAtTop
            });
        }

        return analyzedPages;
    }

    private analyzeLayout(items: TextItem[], pageWidth: number, _pageHeight: number, pageIndex: number) {
        const errors: LayoutIssue[] = [];
        const warnings: string[] = [];
        let isMainHeadingCentered = false;
        let isMainHeadingAtTop = false;

        // Filter out empty strings
        const visibleItems = items.filter(item => item.str.trim().length > 0);
        if (visibleItems.length === 0) return { errors, warnings, isMainHeadingCentered, isMainHeadingAtTop };

        // 1. Top of Page Check (for Heading)
        // We assume the first significant text item on the page is the "Main Heading" for Chapter pages
        const firstItem = visibleItems[0];
        const topThreshold = REPORT_RULES.layout.mainHeading.topMarginThreshold;

        // logic: headings usually are at y < topThreshold (remember 0 is top now)
        // Actually, extracted y is usually top-left based after my conversion?
        // Let's re-verify my Y conversion: 
        // PDF: (0,0) at bottom-left. item.transform[5] is y from bottom.
        // My conversion: viewport.height - transform[5]. So 0 is Top. Correct.

        if (firstItem.y < topThreshold) {
            isMainHeadingAtTop = true;
        } else {
            // Only flag this as error if it looks like a Heading (All Caps, Bold etc - difficult without font parsing map)
            // Simplified: Check if it matches "CHAPTER" pattern
            if (/^CHAPTER/i.test(firstItem.str)) {
                errors.push({
                    type: 'TOP_MARGIN',
                    message: `Heading "${firstItem.str}" is not at the top of the page. Found at y=${Math.round(firstItem.y)}.`,
                    pageIndex,
                    severity: 'ERROR',
                    boundingBox: { x: firstItem.x, y: firstItem.y, width: firstItem.width, height: firstItem.height }
                });
            }
        }

        // 2. Centering Check
        // Check first item or "CHAPTER" items
        if (/^CHAPTER/i.test(firstItem.str) || /^[A-Z\s]{5,}$/.test(firstItem.str)) { // Heuristic: All Caps or "Chapter"
            const itemCenter = firstItem.x + (firstItem.width / 2);
            const pageCenter = pageWidth / 2;
            const diff = Math.abs(pageCenter - itemCenter);

            if (diff < REPORT_RULES.layout.centeringTolerance) {
                isMainHeadingCentered = true;
            } else {
                // Only strict check for specific known headings
                const isKnownHeading = REPORT_RULES.pageStructure.some(r => {
                    const [start, end] = r.pageRange || [0, 0];
                    // pageIndex is 1-based (from PDF), ranges are 0-based (array index)
                    // So we check if (pageIndex - 1) is within [start, end]
                    return (pageIndex - 1) >= start && (pageIndex - 1) <= end;
                });

                if (isKnownHeading || /^CHAPTER/i.test(firstItem.str)) {
                    errors.push({
                        type: 'CENTERING',
                        message: `Heading "${firstItem.str}" is not centered. Off by ${Math.round(diff)} units.`,
                        pageIndex,
                        severity: 'ERROR',
                        boundingBox: { x: firstItem.x, y: firstItem.y, width: firstItem.width, height: firstItem.height }
                    });
                }
            }
        }

        // 3. Justification Heuristic (Right Margin alignment)
        // We look at lines that end near the right margin.
        // If a line ends significantly BEFORE the right margin, and it's not the last line of a paragraph, it's unjustified.
        const leftMarginX = REPORT_RULES.layout.pageBorderMargin;

        // Group into lines (fuzzy Y)
        const lines = this.groupIntoLines(visibleItems);

        // Check lines for border violation
        lines.forEach(line => {
            const lineStart = line.items[0].x;
            const lineEnd = line.items[line.items.length - 1].x + line.items[line.items.length - 1].width;

            if (lineStart < leftMarginX - 10) { // Tolerance
                errors.push({ type: 'BORDER', message: 'Text outside left margin', pageIndex, severity: 'ERROR' });
            }
            if (lineEnd > pageWidth - (REPORT_RULES.layout.pageBorderMargin - 10)) {
                errors.push({ type: 'BORDER', message: 'Text outside right margin', pageIndex, severity: 'ERROR' });
            }
        });

        // Justification check (Simplified)
        // We check if "long lines" end at roughly the same X position (the right margin)
        // If we see jagged edges on the right for long lines, it's likely left-aligned.
        // This is hard to perfect without knowing paragraph breaks.
        // Warning only.

        return { errors, warnings, isMainHeadingCentered, isMainHeadingAtTop };
    }

    private groupIntoLines(items: TextItem[]): { y: number, items: TextItem[] }[] {
        const lines: { y: number, items: TextItem[] }[] = [];
        const sorted = [...items].sort((a, b) => a.y - b.y); // Sort by Y

        sorted.forEach(item => {
            const match = lines.find(line => Math.abs(line.y - item.y) < 5); // 5px tolerance
            if (match) {
                match.items.push(item);
                // Update avg Y? No need for simple check
                match.items.sort((a, b) => a.x - b.x);
            } else {
                lines.push({ y: item.y, items: [item] });
            }
        });
        return lines;
    }
}
