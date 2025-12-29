export interface AnalyzedPage {
    pageIndex: number;
    textItems: TextItem[];
    layoutIssues: LayoutIssue[];
    warnings: string[];
    isMainHeadingCentered: boolean;
    isMainHeadingAtTop: boolean;
}

export interface TextItem {
    str: string;
    x: number;
    y: number;
    width: number;
    height: number;
    fontName: string;
    hasEOL: boolean;
}

export interface LayoutIssue {
    type: 'BORDER' | 'CENTERING' | 'TOP_MARGIN' | 'JUSTIFICATION' | 'SPACING';
    message: string;
    boundingBox?: { x: number; y: number; width: number; height: number };
    pageIndex: number;
    severity: 'ERROR' | 'WARNING';
}

export interface RRNValidation {
    isValid: boolean;
    detectedRRN?: string;
    expectedFormat: string;
    message: string;
}

export interface WatermarkInfo {
    hasWatermark: boolean;
    confidence: 'HIGH' | 'MEDIUM' | 'LOW';
    watermarkText?: string;
    watermarkPages: number[];
    rrnValidation?: RRNValidation;
}

export interface TOCEntry {
    title: string;
    pageNumber: number;
    level: number;
    actualPage?: number;
    isValid?: boolean;
}

export interface TOCValidation {
    entries: TOCEntry[];
    isValid: boolean;
    errors: string[];
}

export interface ValidationResult {
    score: number;
    errors: string[];
    warnings: string[];
    pages: AnalyzedPage[];
    structure: {
        hasCover: boolean;
        hasBonafide: boolean;
        hasCertificate: boolean;
        hasVivaVoce: boolean;
        hasAcknowledgment: boolean;
        hasTableOfContents: boolean;
        hasAbbreviations: boolean;
        hasListOfFigures: boolean;
        hasAbstract: boolean;
        hasIntroduction: boolean;
        hasConclusion: boolean;
        hasReferences: boolean;
    };
    watermark?: WatermarkInfo;
    tocValidation?: TOCValidation;
    pageCount: number;
    fileName?: string;
}
