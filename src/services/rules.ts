export const REPORT_RULES = {
    // Institution-specific constants
    institution: {
        name: 'B.S. Abdur Rahman Crescent Institute of Science and Technology',
        shortName: 'BSACIST',
        location: 'Vandalur, Chennai - 600 048',
        collegeCode: '17160', // Middle 5 digits of RRN
        departments: [
            'Computer Science and Engineering',
            'Artificial Intelligence & Data Science',
            'AI&DS'
        ]
    },

    // RRN (Registration Roll Number) validation rules
    rrn: {
        length: 12,
        yearRange: { min: 20, max: 25 }, // 2020-2025 admission years
        collegeCode: '17160',
        pattern: /^(2[0-5])(17160|01716)(\d{4})$/, // Year + College code + Roll number
    },

    // Expected sequences for the first few pages.
    pageStructure: [
        {
            page: 1,
            name: 'Cover Page',
            requiredPatterns: [
                /INTERNSHIP\s*REPORT/i, 
                /Submitted\s*by/i, 
                /Bachelor\s*of\s*Technology/i
            ],
            optionalPatterns: [
                /B\.?\s*S\.?\s*Abdur\s*Rahman/i,
                /Department\s*of/i,
                /DECEMBER\s*20\d{2}|JANUARY\s*20\d{2}|JUNE\s*20\d{2}/i
            ],
        },
        {
            page: 2,
            name: 'Bonafide Certificate',
            requiredPatterns: [
                /BONAFIDE\s*CERTIFICATE/i, 
                /Certified\s*that/i
            ],
            optionalPatterns: [
                /Bonafide\s*work/i,
                /Head\s*of\s*the\s*Department/i
            ],
        },
        {
            page: 3,
            name: 'Internship Certificate',
            requiredPatterns: [/CERTIFICATE/i],
            optional: true, // Company certificate - may vary
        },
        {
            page: 4,
            name: 'Viva Voce Examination',
            requiredPatterns: [/VIVA\s*VOCE/i],
            optionalPatterns: [
                /Internal\s*Examiner/i,
                /External\s*Examiner/i
            ],
        },
        {
            page: 5,
            name: 'Acknowledgement',
            requiredPatterns: [/ACKNOWLEDGEMENT/i],
            optionalPatterns: [
                /grateful/i,
                /thank/i,
                /Vice\s*Chancellor/i
            ],
        },
        {
            page: 6,
            name: 'Table of Contents',
            requiredPatterns: [
                /TABLE\s*OF\s*CONTENTS/i, 
                /CHAPTER/i
            ],
            optionalPatterns: [
                /PAGE\s*(NO|NUMBER)?/i,
                /CONTENTS/i
            ],
        },
        {
            page: 7,
            name: 'List of Abbreviations',
            requiredPatterns: [/LIST\s*OF\s*ABBREVIATIONS/i],
            optionalPatterns: [
                /ABBREVIATION/i,
                /FULL\s*FORM/i,
                /S\.?\s*NO/i
            ],
            optional: true,
        },
        {
            page: 8,
            name: 'List of Figures',
            requiredPatterns: [/LIST\s*OF\s*FIGURES/i],
            optionalPatterns: [
                /FIGURE\s*(NO|NUMBER)?/i,
                /TITLE/i,
                /PAGE/i
            ],
            optional: true,
        },
        {
            page: 9,
            name: 'List of Tables',
            requiredPatterns: [/LIST\s*OF\s*TABLES/i],
            optionalPatterns: [
                /TABLE\s*(NO|NUMBER)?/i,
                /TITLE/i,
                /PAGE/i
            ],
            optional: true,
        },
        {
            page: 10,
            name: 'Abstract',
            requiredPatterns: [/ABSTRACT/i],
            wordCountRange: { min: 100, max: 500 },
        },
        {
            page: 11,
            name: 'Chapter 1 - Company Profile',
            requiredPatterns: [/CHAPTER\s*[-–]?\s*1/i],
            optionalPatterns: [
                /COMPANY/i,
                /PROFILE/i,
                /INTRODUCTION/i
            ],
        },
    ],

    // Expected chapters in order
    chapters: [
        { num: 1, title: "Company's Profile", aliases: ['Company Profile', 'About Company', 'Organization'] },
        { num: 2, title: 'Services & Skills', aliases: ['Services', 'Skills Developed', 'Key Services'] },
        { num: 3, title: 'Roles and Responsibilities', aliases: ['Roles', 'Responsibilities', 'Job Role'] },
        { num: 4, title: 'Introduction', aliases: ['Project Introduction', 'Overview'] },
        { num: 5, title: 'Background', aliases: ['Literature Review', 'History'] },
        { num: 6, title: 'System Requirements', aliases: ['Requirements', 'Software Requirements', 'Hardware'] },
        { num: 7, title: 'Technologies', aliases: ['Tools', 'Technologies Used', 'Tech Stack'] },
        { num: 8, title: 'Project Description', aliases: ['Implementation', 'Methodology', 'Design'] },
        { num: 9, title: 'Challenges & Learnings', aliases: ['Challenges', 'Learnings', 'Lessons Learned'] },
        { num: 10, title: 'References', aliases: ['Bibliography', 'Citations'] },
        { num: 11, title: 'Conclusion', aliases: ['Summary', 'Future Work'] },
    ],

    // Layout Constraints
    layout: {
        mainHeading: {
            fontSizeThreshold: 14, // Points. Headings should be larger than body
            topMarginThreshold: 200, // PDF units. Main headings must be at the very top (increased for tolerance)
        },
        centeringTolerance: 80, // PDF units. How much deviation from perfect center is allowed (increased for real documents)
        pageBorderMargin: 30, // Content should not be closer than this to the edge (reduced for tolerance)
    },

    // Page requirements
    pageRequirements: {
        minimum: 30,
        maximum: 100,
        warningThreshold: 25, // Warn if below this
    },

    // Scoring Weights (total = 100)
    scoring: {
        structureMatch: 35, // Points for having the right pages in order
        watermarkValid: 20, // Points for valid RRN watermark
        layoutCorrectness: 25, // Points for centering, borders, top-of-page
        formatting: 10, // Points for consistency
        pageCount: 10, // Points for meeting page requirements
    }
};

// Helper function to check if text matches any of the patterns
export function matchesPatterns(text: string, patterns: RegExp[]): boolean {
    return patterns.some(pattern => pattern.test(text));
}

// Helper function to extract all RRNs from text
export function extractRRN(text: string): string[] {
    const matches = text.match(/\b(2[0-5](?:17160|01716)\d{4,5})\b/g);
    // Also try generic 12-digit pattern as fallback
    if (!matches || matches.length === 0) {
        const genericMatches = text.match(/\b(\d{12})\b/g);
        return genericMatches || [];
    }
    return matches;
}

// Helper function to validate RRN format
export function validateRRNFormat(rrn: string): { 
    valid: boolean; 
    isValid: boolean;
    year?: string; 
    collegeCode?: string;
    rollNumber?: string; 
    message: string 
} {
    if (!/^\d{12}$/.test(rrn)) {
        return { valid: false, isValid: false, message: 'RRN must be exactly 12 digits' };
    }

    const year = rrn.substring(0, 2);
    const yearNum = parseInt(year, 10);
    const collegeCode = rrn.substring(2, 7);
    const rollNumber = rrn.substring(7);

    if (yearNum < 20 || yearNum > 25) {
        return { valid: false, isValid: false, year, collegeCode, rollNumber, message: `Year prefix ${year} is invalid. Expected 20-25.` };
    }

    if (collegeCode !== '17160' && collegeCode !== '01716') {
        return { 
            valid: false, 
            isValid: false,
            year,
            collegeCode,
            rollNumber,
            message: `College code ${collegeCode} is not recognized. Expected 17160.` 
        };
    }

    return {
        valid: true,
        isValid: true,
        year,
        collegeCode,
        rollNumber,
        message: `Valid RRN: Year 20${year}, Roll ${rollNumber}`
    };
}
