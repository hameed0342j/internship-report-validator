export const REPORT_RULES = {
    // Expected sequences for the first few pages.
    // We use regexes to match essential keywords.
    pageStructure: [
        {
            name: 'Cover Page',
            requiredPatterns: [/INTERNSHIP REPORT/i, /Submitted by/i, /Bachelor of Technology/i, /Department of/i],
            pageRange: [0, 0] // Strict: Page 1
        },
        {
            name: 'Bonafide Certificate',
            requiredPatterns: [/BONAFIDE CERTIFICATE/i, /Certified that this/i, /Bonafide work/i],
            pageRange: [1, 2] // Pages 2-3
        },
        {
            name: 'Internship Certificate',
            requiredPatterns: [/INTERNSHIP CERTIFICATE/i],
            optional: true,
            pageRange: [2, 4] // Pages 3-5
        },
        {
            name: 'Viva Voce',
            requiredPatterns: [/VIVA VOCE/i, /Internal Examiner/i],
            pageRange: [2, 5] // Pages 3-6
        },
        {
            name: 'Acknowledgement',
            requiredPatterns: [/ACKNOWLEDGEMENT/i],
            pageRange: [3, 6]
        },
        {
            name: 'Table of Contents',
            requiredPatterns: [/TABLE OF CONTENTS/i, /CHAPTER/i, /PAGE/i],
            pageRange: [4, 8]
        },
        {
            name: 'List of Abbreviations',
            requiredPatterns: [/LIST OF ABBREVIATIONS/i],
            optional: true,
            pageRange: [5, 10]
        },
        {
            name: 'List of Figures',
            requiredPatterns: [/LIST OF FIGURES/i],
            optional: true,
            pageRange: [5, 12]
        },
        {
            name: 'Abstract',
            requiredPatterns: [/ABSTRACT/i],
            pageRange: [6, 12]
        },
        {
            name: 'Chapter 1 / Introduction',
            requiredPatterns: [/CHAPTER/i, /1/, /INTRODUCTION/i],
            pageRange: [7, 15]
        },
    ],

    // Layout Constraints
    layout: {
        mainHeading: {
            fontSizeThreshold: 14, // Points. Headings should be larger than body (usually 11/12)
            topMarginThreshold: 150, // PDF units. Main headings must be at the very top.
        },
        centeringTolerance: 20, // PDF units. How much deviation from perfect center is allowed.
        pageBorderMargin: 50, // Content should not be closer than this to the edge.
    },

    // Scoring Weights
    scoring: {
        structureMatch: 40, // Points for having the right pages
        layoutCorrectness: 40, // Points for centering, borders, top-of-page
        formatting: 20, // Points for consistency (fonts, sizes)
    }
};
