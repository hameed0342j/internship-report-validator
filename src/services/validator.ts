import type { AnalyzedPage, ValidationResult, WatermarkInfo } from '../types';
import { REPORT_RULES } from './rules';

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

        // 1. Structure Check (First 15 Pages)
        REPORT_RULES.pageStructure.forEach((rule) => {
            let found = false;

            // Search within the allowed range
            const [startPage, endPage] = rule.pageRange || [0, 10];

            for (let i = startPage; i <= endPage && i < pages.length; i++) {
                const page = pages[i];
                const items = page.textItems.map(item => item.str).join(' ');

                // Simple pattern matching
                const hasMatch = rule.requiredPatterns.some(pattern => pattern.test(items));

                if (hasMatch) {
                    found = true;
                    break;
                }
            }

            if (found) {
                // Map to structureChecks boolean
                if (rule.name.includes('Cover')) structureChecks.hasCover = true;
                if (rule.name.includes('Bonafide')) structureChecks.hasBonafide = true;
                if (rule.name.includes('Certificate')) structureChecks.hasCertificate = true;
                if (rule.name.includes('Viva')) structureChecks.hasVivaVoce = true;
                if (rule.name.includes('Acknowledgement')) structureChecks.hasAcknowledgment = true;
                if (rule.name.includes('Table of Contents')) structureChecks.hasTableOfContents = true;
                if (rule.name.includes('Abbreviations')) structureChecks.hasAbbreviations = true;
                if (rule.name.includes('Figures')) structureChecks.hasListOfFigures = true;
                if (rule.name.includes('Abstract')) structureChecks.hasAbstract = true;
                if (rule.name.includes('Chapter 1') || rule.name.includes('Introduction')) structureChecks.hasIntroduction = true;
            } else {
                if (!rule.optional) {
                    errors.push(`Missing Section: "${rule.name}". Expected around pages ${startPage + 1}-${endPage + 1}.`);
                } else {
                    warnings.push(`Optional Section "${rule.name}" not found.`);
                }
            }
        });

        // Check for Conclusion and References in later pages
        pages.forEach((page) => {
            const items = page.textItems.map(i => i.str).join(' ').toUpperCase();
            if (items.includes('CONCLUSION')) structureChecks.hasConclusion = true;
            if (items.includes('REFERENCE') || items.includes('BIBLIOGRAPHY')) structureChecks.hasReferences = true;
        });

        // 2. Aggregate Layout Issues from PDF Analysis
        const layoutErrors = pages.flatMap(p => p.layoutIssues);
        layoutErrors.forEach(e => {
            if (e.severity === 'ERROR') {
                errors.push(`Page ${e.pageIndex + 1}: ${e.message}`);
            } else {
                warnings.push(`Page ${e.pageIndex + 1}: ${e.message}`);
            }
        });

        // 2.5 Chapter Sequence Check
        let lastChapter = 0;
        pages.forEach((page) => {
            const items = page.textItems.map(i => i.str).join(' ');
            const match = items.match(/CHAPTER\s+(\d+)/i);
            if (match) {
                const currentChapter = parseInt(match[1], 10);
                if (currentChapter < lastChapter) {
                    errors.push(`Chapter Sequence Error: Chapter ${currentChapter} found on Page ${page.pageIndex + 1} after Chapter ${lastChapter}.`);
                } else if (currentChapter > lastChapter + 1 && lastChapter !== 0) {
                    warnings.push(`Chapter Gap: Chapter ${currentChapter} found after Chapter ${lastChapter}. Missing Chapter ${lastChapter + 1}?`);
                }
                lastChapter = currentChapter;
            }
        });

        // 3. Watermark Validation
        if (watermarkInfo) {
            if (!watermarkInfo.hasWatermark) {
                warnings.push('No watermark detected in the document');
            }

            if (watermarkInfo.rrnValidation && !watermarkInfo.rrnValidation.isValid) {
                errors.push(`RRN Validation Failed: ${watermarkInfo.rrnValidation.message}`);
            }
        }

        // 4. Scoring
        let score = 100;

        // Page Count Check
        if (pages.length < 30) {
            errors.push(`Document is too short. ${pages.length} pages found, minimum 30 required.`);
            score -= 15;
        }

        // Deduct for structure
        const requiredPages = REPORT_RULES.pageStructure.filter(r => !r.optional).length;
        const structureFailures = errors.filter(e => e.includes('Missing Page') || e.includes('does not appear')).length;
        score -= (structureFailures / requiredPages) * REPORT_RULES.scoring.structureMatch;

        // Deduct for layout
        const totalPagesChecked = Math.min(pages.length, 20);
        const distinctLayoutErrorPages = new Set(layoutErrors.filter(e => e.severity === 'ERROR').map(e => e.pageIndex)).size;
        score -= (distinctLayoutErrorPages / totalPagesChecked) * REPORT_RULES.scoring.layoutCorrectness;

        // Deduct for missing watermark/RRN
        if (watermarkInfo && !watermarkInfo.hasWatermark) {
            score -= 5;
        }
        if (watermarkInfo?.rrnValidation && !watermarkInfo.rrnValidation.isValid) {
            score -= 10;
        }

        return {
            score: Math.max(0, Math.round(score)),
            errors,
            warnings,
            pages,
            structure: structureChecks,
            watermark: watermarkInfo,
            pageCount: pages.length,
            fileName
        };
    }
}
