import type { AnalyzedPage, ValidationResult, WatermarkInfo } from '../types';
import { REPORT_RULES, matchesPatterns } from './rules';

export class Validator {
    validate(pages: AnalyzedPage[], watermarkInfo?: WatermarkInfo, fileName?: string): ValidationResult {
        const errors: string[] = [];
        const warnings: string[] = [];
        const structureChecks = {
            hasCover: false,
            hasBonafide: false,
            hasCertificate: false,
            hasVivaVoce: false,
            hasAcknowledgment: false,
            hasTableOfContents: false,
            hasAbbreviations: false,
            hasListOfFigures: false,
            hasAbstract: false,
            hasIntroduction: false,
            hasConclusion: false,
            hasReferences: false,
        };

        // Track found chapters
        const foundChapters: { number: number; title: string; page: number }[] = [];

        // 1. Structure Check (First 10-11 Pages based on enhanced rules)
        REPORT_RULES.pageStructure.forEach((rule) => {
            const pageIndex = rule.page - 1; // 0-based
            if (pageIndex >= pages.length) {
                if (!rule.optional) {
                    errors.push(`Missing Page ${rule.page}: ${rule.name}`);
                }
                return;
            }

            const page = pages[pageIndex];
            const items = page.textItems.map(i => i.str).join(' ');

            // Use enhanced pattern matching from rules.ts
            const hasMatch = matchesPatterns(items, rule.requiredPatterns);

            if (hasMatch) {
                // Map to structureChecks boolean
                if (rule.name.includes('Cover')) structureChecks.hasCover = true;
                if (rule.name.includes('Bonafide')) structureChecks.hasBonafide = true;
                if (rule.name.includes('Certificate')) structureChecks.hasCertificate = true;
                if (rule.name.includes('Viva')) structureChecks.hasVivaVoce = true;
                if (rule.name.includes('Acknowledgement')) structureChecks.hasAcknowledgment = true;
                if (rule.name.includes('Table of Contents') || rule.name.includes('TOC')) structureChecks.hasTableOfContents = true;
                if (rule.name.includes('Abbreviations')) structureChecks.hasAbbreviations = true;
                if (rule.name.includes('Figures')) structureChecks.hasListOfFigures = true;
                if (rule.name.includes('Abstract')) structureChecks.hasAbstract = true;
                if (rule.name.includes('Chapter 1') || rule.name.includes('Introduction')) structureChecks.hasIntroduction = true;
            } else {
                if (!rule.optional) {
                    errors.push(`Page ${rule.page} does not appear to be "${rule.name}". Missing required keywords.`);
                } else {
                    warnings.push(`Page ${rule.page} might be missing optional "${rule.name}".`);
                }
            }
        });

        // 2. Chapter Validation against expected 11 chapters
        pages.forEach((page, pageIndex) => {
            const items = page.textItems.map(i => i.str).join(' ');
            const upperItems = items.toUpperCase();
            
            // Check for chapter headings
            const chapterMatch = items.match(/CHAPTER\s+(\d+)[:\s]*(.+?)(?=\n|$)/i);
            if (chapterMatch) {
                const chapterNum = parseInt(chapterMatch[1], 10);
                const chapterTitle = chapterMatch[2]?.trim() || '';
                foundChapters.push({ number: chapterNum, title: chapterTitle, page: pageIndex + 1 });
            }
            
            // Check for conclusion and references anywhere
            if (upperItems.includes('CONCLUSION') || upperItems.includes('SUMMARY')) {
                structureChecks.hasConclusion = true;
            }
            if (upperItems.includes('REFERENCE') || upperItems.includes('BIBLIOGRAPHY')) {
                structureChecks.hasReferences = true;
            }
        });

        // Validate expected chapter count (should have 11 chapters)
        const expectedChapterCount = REPORT_RULES.chapters.length;
        if (foundChapters.length < expectedChapterCount) {
            warnings.push(`Found ${foundChapters.length} chapters, expected ${expectedChapterCount} chapters.`);
        }

        // 2.5 Chapter Sequence Check
        let lastChapter = 0;
        foundChapters.sort((a, b) => a.page - b.page).forEach((chapter) => {
            if (chapter.number < lastChapter) {
                errors.push(`Chapter Sequence Error: Chapter ${chapter.number} found on Page ${chapter.page} after Chapter ${lastChapter}.`);
            } else if (chapter.number > lastChapter + 1 && lastChapter !== 0) {
                warnings.push(`Chapter Gap: Chapter ${chapter.number} found after Chapter ${lastChapter}. Missing Chapter ${lastChapter + 1}?`);
            }
            lastChapter = chapter.number;
        });

        // 2.6 TOC Page Number Validation
        // Parse TOC entries and validate against actual page content
        const tocValidation = this.validateTableOfContents(pages);
        tocValidation.errors.forEach(e => errors.push(e));
        tocValidation.warnings.forEach(w => warnings.push(w));

        // 3. Aggregate Layout Issues from PDF Analysis
        const layoutErrors = pages.flatMap(p => p.layoutIssues);
        layoutErrors.forEach(e => {
            if (e.severity === 'ERROR') {
                errors.push(`Page ${e.pageIndex + 1}: ${e.message}`);
            } else {
                warnings.push(`Page ${e.pageIndex + 1}: ${e.message}`);
            }
        });

        // 4. Watermark Validation with enhanced college code check
        if (watermarkInfo) {
            if (!watermarkInfo.hasWatermark) {
                warnings.push('No watermark detected in the document');
            }
            
            if (watermarkInfo.rrnValidation) {
                if (!watermarkInfo.rrnValidation.isValid) {
                    errors.push(`RRN Validation Failed: ${watermarkInfo.rrnValidation.message}`);
                } else {
                    // Additional college code verification
                    const collegeCode = watermarkInfo.rrnValidation.collegeCode;
                    if (collegeCode && collegeCode !== REPORT_RULES.institution.collegeCode && collegeCode !== '01716') {
                        warnings.push(`RRN college code (${collegeCode}) doesn't match expected (${REPORT_RULES.institution.collegeCode})`);
                    }
                }
            }
        }

        // 5. Enhanced Scoring based on REPORT_RULES weights
        let score = 100;
        const scoring = REPORT_RULES.scoring;

        // Page Count Check (minimum 30 pages for internship report)
        if (pages.length < 30) {
            errors.push(`Document is too short. ${pages.length} pages found, minimum 30 required.`);
            score -= scoring.pageCount;
        } else if (pages.length < 40) {
            warnings.push(`Document has ${pages.length} pages. Recommended: 40+ pages.`);
            score -= scoring.pageCount / 2;
        }

        // Structure Score (35% weight)
        const requiredPages = REPORT_RULES.pageStructure.filter(r => !r.optional).length;
        const structureFailures = errors.filter(e => e.includes('Missing Page') || e.includes('does not appear')).length;
        const structureScore = Math.max(0, (1 - structureFailures / requiredPages) * scoring.structureMatch);
        score = score - scoring.structureMatch + structureScore;

        // Watermark/RRN Score (20% weight)
        let watermarkScore = scoring.watermarkValid;
        if (watermarkInfo) {
            if (!watermarkInfo.hasWatermark) {
                watermarkScore -= scoring.watermarkValid * 0.5;
            }
            if (watermarkInfo.rrnValidation && !watermarkInfo.rrnValidation.isValid) {
                watermarkScore -= scoring.watermarkValid * 0.5;
            }
        } else {
            watermarkScore = 0;
        }
        score = score - scoring.watermarkValid + watermarkScore;

        // Layout Score (25% weight) - Be more lenient, only penalize if many pages have issues
        const totalPagesChecked = Math.min(pages.length, 20);
        const distinctLayoutErrorPages = new Set(layoutErrors.filter(e => e.severity === 'ERROR').map(e => e.pageIndex)).size;
        // Only deduct if more than 25% of checked pages have layout errors
        const layoutPenaltyRatio = Math.max(0, (distinctLayoutErrorPages / totalPagesChecked) - 0.25);
        const layoutScore = Math.max(0, (1 - layoutPenaltyRatio * 2) * scoring.layoutCorrectness);
        score = score - scoring.layoutCorrectness + layoutScore;

        // Formatting Score (10% weight) - based on warnings
        const formattingIssues = warnings.filter(w => w.includes('format') || w.includes('margin') || w.includes('spacing')).length;
        const formattingScore = Math.max(0, scoring.formatting - (formattingIssues * 2));
        score = score - scoring.formatting + formattingScore;

        return {
            score: Math.max(0, Math.min(100, Math.round(score))),
            errors,
            warnings,
            pages,
            structure: structureChecks,
            watermark: watermarkInfo,
            pageCount: pages.length,
            fileName
        };
    }

    /**
     * Validates Table of Contents page numbers against actual content
     * Checks if sections listed in TOC appear on the pages indicated
     */
    private validateTableOfContents(pages: AnalyzedPage[]): { errors: string[]; warnings: string[] } {
        const errors: string[] = [];
        const warnings: string[] = [];

        // Find TOC page (usually page 6)
        let tocPageIndex = -1;
        for (let i = 0; i < Math.min(pages.length, 10); i++) {
            const text = pages[i].textItems.map(t => t.str).join(' ');
            if (/TABLE\s*OF\s*CONTENTS/i.test(text)) {
                tocPageIndex = i;
                break;
            }
        }

        if (tocPageIndex === -1) return { errors, warnings };

        // Parse TOC entries - look for patterns like "Section Name ... PageNumber"
        const tocText = pages[tocPageIndex].textItems.map(t => t.str).join(' ');
        
        // Common TOC entry patterns to extract
        const tocEntries: { title: string; pageNum: number }[] = [];
        
        // Pattern for "CHAPTER X" entries
        const chapterPattern = /CHAPTER\s*[-–]?\s*(\d+)[^0-9]*?(\d+)\s*$/gmi;
        
        // Extract chapter entries
        let match;
        while ((match = chapterPattern.exec(tocText)) !== null) {
            const chapterNum = match[1];
            const pageNum = parseInt(match[2], 10);
            tocEntries.push({ title: `CHAPTER ${chapterNum}`, pageNum });
        }

        // Extract key section entries
        const keySections = [
            { pattern: /LIST\s*OF\s*ABBREVIATIONS\s+(\d+)/i, title: 'LIST OF ABBREVIATIONS' },
            { pattern: /LIST\s*OF\s*FIGURES\s+(\d+)/i, title: 'LIST OF FIGURES' },
            { pattern: /LIST\s*OF\s*TABLES\s+(\d+)/i, title: 'LIST OF TABLES' },
            { pattern: /ABSTRACT\s+(\d+)/i, title: 'ABSTRACT' },
            { pattern: /CONCLUSION\s+(\d+)/i, title: 'CONCLUSION' },
            { pattern: /REFERENCES?\s+(\d+)/i, title: 'REFERENCES' },
        ];

        keySections.forEach(({ pattern, title }) => {
            const sectionMatch = tocText.match(pattern);
            if (sectionMatch) {
                tocEntries.push({ title, pageNum: parseInt(sectionMatch[1], 10) });
            }
        });

        if (tocEntries.length === 0) return { errors, warnings };

        // Determine page numbering offset
        // The document uses Roman numerals for first few pages, then Arabic starts
        // We need to find where Arabic numbering starts by looking at footers
        let arabicStartIndex = this.findArabicPageStart(pages);

        // Validate each TOC entry against actual page content
        for (const entry of tocEntries) {
            // Convert TOC page number to actual PDF page index
            // If TOC says "page 5", and Arabic numbering starts at PDF page 7 (index 6),
            // then actual PDF page = arabicStartIndex + (tocPageNum - 1)
            const actualPdfPageIndex = arabicStartIndex + entry.pageNum - 1;

            if (actualPdfPageIndex < 0 || actualPdfPageIndex >= pages.length) {
                warnings.push(`TOC: "${entry.title}" references page ${entry.pageNum} which may be out of range`);
                continue;
            }

            const pageContent = pages[actualPdfPageIndex].textItems.map(t => t.str).join(' ').toUpperCase();
            
            // Check if the section title appears on the referenced page
            const titleWords = entry.title.toUpperCase().split(/\s+/).filter(w => w.length > 2);
            const foundOnPage = titleWords.some(word => pageContent.includes(word));

            // Also check footer for page number confirmation
            const footerText = this.extractFooter(pages[actualPdfPageIndex]);
            const footerHasPageNum = footerText.includes(entry.pageNum.toString());

            if (!foundOnPage && !footerHasPageNum) {
                warnings.push(`TOC Mismatch: "${entry.title}" listed on page ${entry.pageNum} but content not found at expected location`);
            }
        }

        return { errors, warnings };
    }

    /**
     * Find where Arabic page numbering starts (after Roman numerals)
     */
    private findArabicPageStart(pages: AnalyzedPage[]): number {
        // Look for first page with Arabic numeral "1" in footer area
        for (let i = 0; i < Math.min(pages.length, 15); i++) {
            const footer = this.extractFooter(pages[i]);
            // Check if footer contains just "1" (first Arabic page)
            if (/^\s*1\s*$/.test(footer)) {
                return i;
            }
        }
        // Default: assume Roman pages are first 6 (Cover through TOC), Arabic starts at 7
        return 6;
    }

    /**
     * Extract footer text from a page (bottom portion of page)
     */
    private extractFooter(page: AnalyzedPage): string {
        // Get items in bottom 10% of page (assuming footer is at bottom)
        const items = page.textItems;
        if (items.length === 0) return '';

        // Find max Y (bottom of page in our coordinate system)
        const maxY = Math.max(...items.map(i => i.y));
        const footerThreshold = maxY * 0.9; // Bottom 10%

        const footerItems = items.filter(i => i.y > footerThreshold);
        return footerItems.map(i => i.str).join(' ').trim();
    }
}
