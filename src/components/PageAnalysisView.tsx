import { useState, useEffect } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { ScrollArea } from './ui/scroll-area';
import { Alert, AlertDescription } from './ui/alert';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "./ui/accordion";
import { 
    ChevronLeft, 
    ChevronRight, 
    FileText, 
    CheckCircle2, 
    XCircle, 
    AlertTriangle,
    Eye,
    ZoomIn,
    ZoomOut,
    Loader2
} from 'lucide-react';
import { REPORT_RULES } from '../services/rules';
import type { AnalyzedPage } from '../types';

// Use unpkg CDN for worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@5.4.449/build/pdf.worker.min.mjs';

interface PageAnalysisViewProps {
    file: File;
    analyzedPages: AnalyzedPage[];
}

interface PageJustification {
    pageNumber: number;
    expectedContent: string;
    detectedContent: string[];
    status: 'pass' | 'warning' | 'fail';
    justification: string;
    matchedPatterns: string[];
    missingPatterns: string[];
    fixSuggestions: string[];
}

// Fix suggestions based on common student mistakes
const getFixSuggestions = (pageName: string, _pageText: string, status: 'pass' | 'warning' | 'fail'): string[] => {
    const suggestions: string[] = [];
    
    if (status === 'pass') return suggestions;
    
    const fixes: Record<string, string[]> = {
        'Cover Page': [
            'Add project title in CAPITAL LETTERS at the top',
            'Include "AN INTERNSHIP REPORT" below the title',
            'Add "Submitted by" followed by your full name',
            'Include your RRN number in format: (RRN:230171601XXX)',
            'Add "BACHELOR OF TECHNOLOGY in ARTIFICIAL INTELLIGENCE & DATA SCIENCE"',
            'Include "NOVEMBER 2025" at the bottom'
        ],
        'Bonafide Certificate': [
            'Add heading "BONAFIDE CERTIFICATE" centered at top',
            'Include certification text: "Certified that this internship report..."',
            'Add supervisor signature block with name and designation',
            'Include "Ms. A. Saraswathi, Assistant Professor, Department of CSE"',
            'Add college name: "B.S. Abdur Rahman Crescent Institute of Science and Technology"'
        ],
        'Certificate Page': [
            'Add "INTERNSHIP CERTIFICATE" heading',
            'Include company certificate or letter',
            'Ensure certificate mentions internship duration and role'
        ],
        'Viva Voce Page': [
            'Add "VIVA VOCE EXAMINATION" heading',
            'Include project title and student details',
            'Add space for "INTERNAL EXAMINER" signature',
            'Include date field for examination'
        ],
        'Acknowledgement': [
            'Add "ACKNOWLEDGEMENT" heading centered',
            'Thank Vice Chancellor Prof. Dr. T. MURUGESAN',
            'Thank Pro-Vice Chancellor Dr. N. THAJUDDIN',
            'Thank Registrar Dr. N. RAJA HUSSAIN',
            'Thank Dean Dr. SHARMILA SANKAR',
            'Thank HOD Dr. W. AISHA BANU',
            'Thank class advisor Ms. A. SARASWATHI',
            'Thank internship mentor/company supervisor',
            'Sign with your name at the bottom'
        ],
        'Table of Contents': [
            'Add "TABLE OF CONTENTS" heading',
            'Include columns: CHAPTER NO, TITLE, PAGE NO',
            'List all chapters with correct page numbers',
            'Include LIST OF ABBREVIATIONS, LIST OF FIGURES, ABSTRACT'
        ],
        'List of Abbreviations': [
            'Add "LIST OF ABBREVIATIONS" heading',
            'List all technical abbreviations used in report',
            'Format as: ABBREVIATION - Full Form'
        ],
        'List of Figures': [
            'Add "LIST OF FIGURES" heading',
            'List all figures with figure numbers and page numbers',
            'Format as: Figure No. - Title - Page No.'
        ],
        'List of Tables': [
            'Add "LIST OF TABLES" heading',
            'List all tables with table numbers and page numbers',
            'Format as: Table No. - Title - Page No.'
        ],
        'Abstract': [
            'Add "ABSTRACT" heading centered',
            'Write 150-300 word summary of internship',
            'Include: objective, methodology, key findings, conclusion'
        ],
        'Chapter 1': [
            'Add "CHAPTER 1" with chapter title',
            'Expected: "COMPANY\'S PROFILE" or "INTRODUCTION"',
            'Include company overview and background'
        ]
    };

    // Return specific fixes based on page name
    for (const [key, value] of Object.entries(fixes)) {
        if (pageName.toLowerCase().includes(key.toLowerCase().split(' ')[0])) {
            return value;
        }
    }

    // Generic suggestions
    return [
        `Ensure page contains "${pageName}" content`,
        'Check page ordering matches template',
        'Verify all required keywords are present'
    ];
};

export function PageAnalysisView({ file, analyzedPages }: PageAnalysisViewProps) {
    const [currentPage, setCurrentPage] = useState(1);
    const [numPages, setNumPages] = useState(0);
    const [pageImage, setPageImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [zoom, setZoom] = useState(1);
    const [pageJustifications, setPageJustifications] = useState<PageJustification[]>([]);

    // Generate page justifications based on REPORT_RULES
    useEffect(() => {
        const justifications: PageJustification[] = [];
        
        REPORT_RULES.pageStructure.forEach((rule) => {
            const pageIndex = rule.page - 1;
            const page = analyzedPages[pageIndex];
            
            if (!page) {
                const status = rule.optional ? 'warning' : 'fail';
                justifications.push({
                    pageNumber: rule.page,
                    expectedContent: rule.name,
                    detectedContent: [],
                    status,
                    justification: `Page ${rule.page} is missing. Expected: ${rule.name}`,
                    matchedPatterns: [],
                    missingPatterns: rule.requiredPatterns.map(p => p.source),
                    fixSuggestions: getFixSuggestions(rule.name, '', status)
                });
                return;
            }

            const pageText = page.textItems.map(t => t.str).join(' ');
            const matchedPatterns: string[] = [];
            const missingPatterns: string[] = [];

            rule.requiredPatterns.forEach(pattern => {
                if (pattern.test(pageText)) {
                    matchedPatterns.push(pattern.source);
                } else {
                    missingPatterns.push(pattern.source);
                }
            });

            const hasMatch = matchedPatterns.length > 0;
            let status: 'pass' | 'warning' | 'fail' = 'pass';
            let justification = '';

            if (hasMatch) {
                justification = `✓ Page ${rule.page} correctly contains "${rule.name}" content. Detected keywords: ${matchedPatterns.join(', ')}`;
            } else if (rule.optional) {
                status = 'warning';
                justification = `⚠ Page ${rule.page} might be missing optional "${rule.name}". Consider adding if applicable.`;
            } else {
                status = 'fail';
                justification = `✗ Page ${rule.page} should be "${rule.name}" but required patterns not found. Missing: ${missingPatterns.slice(0, 3).join(', ')}`;
            }

            // Extract detected content (first few significant words)
            const words = pageText.split(/\s+/).filter(w => w.length > 3).slice(0, 10);
            
            justifications.push({
                pageNumber: rule.page,
                expectedContent: rule.name,
                detectedContent: words,
                status,
                justification,
                matchedPatterns,
                missingPatterns,
                fixSuggestions: getFixSuggestions(rule.name, pageText, status)
            });
        });

        setPageJustifications(justifications);
    }, [analyzedPages]);

    // Load PDF and render current page
    useEffect(() => {
        const loadPage = async () => {
            setIsLoading(true);
            try {
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                setNumPages(pdf.numPages);

                const page = await pdf.getPage(currentPage);
                const scale = 1.5 * zoom;
                const viewport = page.getViewport({ scale });

                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                if (context) {
                    await page.render({
                        canvasContext: context,
                        viewport: viewport,
                        canvas: canvas
                    }).promise;

                    setPageImage(canvas.toDataURL());
                }
            } catch (error) {
                console.error('Error loading page:', error);
            }
            setIsLoading(false);
        };

        loadPage();
    }, [file, currentPage, zoom]);

    const getCurrentPageAnalysis = () => {
        return analyzedPages.find(p => p.pageIndex === currentPage - 1);
    };

    const getCurrentJustification = () => {
        return pageJustifications.find(j => j.pageNumber === currentPage);
    };

    const getPageStatus = (pageNum: number) => {
        const justification = pageJustifications.find(j => j.pageNumber === pageNum);
        if (!justification) return 'neutral';
        return justification.status;
    };

    const pageAnalysis = getCurrentPageAnalysis();
    const justification = getCurrentJustification();

    return (
        <div className="grid lg:grid-cols-2 gap-6 h-full">
            {/* Left Panel - PDF Preview */}
            <Card className="flex flex-col">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Eye className="h-5 w-5" />
                            PDF Preview
                        </CardTitle>
                        <div className="flex items-center gap-2">
                            <Button 
                                variant="outline" 
                                size="icon"
                                onClick={() => setZoom(z => Math.max(0.5, z - 0.25))}
                            >
                                <ZoomOut className="h-4 w-4" />
                            </Button>
                            <span className="text-sm text-muted-foreground w-16 text-center">
                                {Math.round(zoom * 100)}%
                            </span>
                            <Button 
                                variant="outline" 
                                size="icon"
                                onClick={() => setZoom(z => Math.min(2, z + 0.25))}
                            >
                                <ZoomIn className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                    {/* Page Navigation */}
                    <div className="flex items-center justify-center gap-4 mb-4">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage <= 1}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        
                        <div className="flex items-center gap-2">
                            <input
                                type="number"
                                min={1}
                                max={numPages}
                                value={currentPage}
                                onChange={(e) => {
                                    const val = parseInt(e.target.value);
                                    if (val >= 1 && val <= numPages) {
                                        setCurrentPage(val);
                                    }
                                }}
                                className="w-16 text-center border rounded px-2 py-1"
                            />
                            <span className="text-muted-foreground">/ {numPages}</span>
                        </div>

                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentPage(p => Math.min(numPages, p + 1))}
                            disabled={currentPage >= numPages}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>

                    {/* Quick Page Buttons for first 11 pages */}
                    <div className="flex flex-wrap gap-1 mb-4 justify-center">
                        {Array.from({ length: Math.min(11, numPages) }, (_, i) => i + 1).map(pageNum => (
                            <Button
                                key={pageNum}
                                variant={currentPage === pageNum ? 'default' : 'outline'}
                                size="sm"
                                className={`w-8 h-8 p-0 ${
                                    getPageStatus(pageNum) === 'pass' ? 'border-green-500' :
                                    getPageStatus(pageNum) === 'warning' ? 'border-yellow-500' :
                                    getPageStatus(pageNum) === 'fail' ? 'border-red-500' : ''
                                }`}
                                onClick={() => setCurrentPage(pageNum)}
                            >
                                {pageNum}
                            </Button>
                        ))}
                    </div>

                    {/* PDF Render */}
                    <ScrollArea className="flex-1 border rounded-lg bg-gray-100">
                        <div className="flex items-center justify-center p-4 min-h-[400px]">
                            {isLoading ? (
                                <div className="flex flex-col items-center gap-2">
                                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                                    <span className="text-sm text-muted-foreground">Loading page...</span>
                                </div>
                            ) : pageImage ? (
                                <img 
                                    src={pageImage} 
                                    alt={`Page ${currentPage}`}
                                    className="max-w-full shadow-lg"
                                />
                            ) : (
                                <span className="text-muted-foreground">No preview available</span>
                            )}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

            {/* Right Panel - Page Analysis */}
            <Card className="flex flex-col">
                <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Page {currentPage} Analysis
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-auto">
                    <ScrollArea className="h-full pr-4">
                        {/* Page Status */}
                        {justification && (
                            <Alert className={`mb-4 ${
                                justification.status === 'pass' ? 'border-green-500 bg-green-50' :
                                justification.status === 'warning' ? 'border-yellow-500 bg-yellow-50' :
                                'border-red-500 bg-red-50'
                            }`}>
                                <div className="flex items-start gap-2">
                                    {justification.status === 'pass' ? (
                                        <CheckCircle2 className="h-5 w-5 text-green-600 mt-0.5" />
                                    ) : justification.status === 'warning' ? (
                                        <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                                    ) : (
                                        <XCircle className="h-5 w-5 text-red-600 mt-0.5" />
                                    )}
                                    <AlertDescription className={`${
                                        justification.status === 'pass' ? 'text-green-800' :
                                        justification.status === 'warning' ? 'text-yellow-800' :
                                        'text-red-800'
                                    }`}>
                                        {justification.justification}
                                    </AlertDescription>
                                </div>
                            </Alert>
                        )}

                        {/* Expected vs Detected */}
                        {justification && (
                            <div className="space-y-4 mb-6">
                                <div>
                                    <h4 className="font-semibold text-sm mb-2">Expected Content:</h4>
                                    <Badge variant="outline" className="text-sm">
                                        {justification.expectedContent}
                                    </Badge>
                                </div>

                                {justification.matchedPatterns.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold text-sm mb-2 text-green-700">Matched Patterns:</h4>
                                        <div className="flex flex-wrap gap-1">
                                            {justification.matchedPatterns.map((pattern, idx) => (
                                                <Badge key={idx} className="bg-green-100 text-green-800 text-xs">
                                                    {pattern.length > 30 ? pattern.slice(0, 30) + '...' : pattern}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {justification.missingPatterns.length > 0 && justification.status !== 'pass' && (
                                    <div>
                                        <h4 className="font-semibold text-sm mb-2 text-red-700">Missing Patterns:</h4>
                                        <div className="flex flex-wrap gap-1">
                                            {justification.missingPatterns.slice(0, 5).map((pattern, idx) => (
                                                <Badge key={idx} variant="destructive" className="text-xs">
                                                    {pattern.length > 30 ? pattern.slice(0, 30) + '...' : pattern}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Fix Suggestions */}
                                {justification.fixSuggestions.length > 0 && justification.status !== 'pass' && (
                                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                        <h4 className="font-semibold text-sm mb-3 text-blue-800 flex items-center gap-2">
                                            🔧 How to Fix This Page:
                                        </h4>
                                        <ol className="space-y-2 text-sm text-blue-900">
                                            {justification.fixSuggestions.map((fix, idx) => (
                                                <li key={idx} className="flex items-start gap-2">
                                                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-blue-200 text-blue-800 text-xs flex items-center justify-center font-medium">
                                                        {idx + 1}
                                                    </span>
                                                    <span>{fix}</span>
                                                </li>
                                            ))}
                                        </ol>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Layout Issues */}
                        {pageAnalysis && pageAnalysis.layoutIssues.length > 0 && (
                            <Accordion type="single" collapsible className="mb-4">
                                <AccordionItem value="issues">
                                    <AccordionTrigger className="text-sm">
                                        <span className="flex items-center gap-2">
                                            <AlertTriangle className="h-4 w-4 text-yellow-500" />
                                            Layout Issues ({pageAnalysis.layoutIssues.length})
                                        </span>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <ul className="space-y-2">
                                            {pageAnalysis.layoutIssues.map((issue, idx) => (
                                                <li key={idx} className={`text-sm p-2 rounded ${
                                                    issue.severity === 'ERROR' ? 'bg-red-50 text-red-700' : 'bg-yellow-50 text-yellow-700'
                                                }`}>
                                                    <span className="font-medium">[{issue.type}]</span> {issue.message}
                                                </li>
                                            ))}
                                        </ul>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        )}

                        {/* Page Text Preview */}
                        {pageAnalysis && (
                            <Accordion type="single" collapsible>
                                <AccordionItem value="text">
                                    <AccordionTrigger className="text-sm">
                                        <span className="flex items-center gap-2">
                                            <FileText className="h-4 w-4" />
                                            Detected Text Content
                                        </span>
                                    </AccordionTrigger>
                                    <AccordionContent>
                                        <div className="bg-gray-50 p-3 rounded text-xs font-mono max-h-48 overflow-auto">
                                            {pageAnalysis.textItems.map(t => t.str).join(' ').slice(0, 1000)}
                                            {pageAnalysis.textItems.map(t => t.str).join(' ').length > 1000 && '...'}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            </Accordion>
                        )}

                        {/* All Pages Summary */}
                        <div className="mt-6">
                            <h4 className="font-semibold text-sm mb-3">All Pages Summary:</h4>
                            <div className="grid grid-cols-1 gap-2">
                                {pageJustifications.map((j) => (
                                    <button
                                        key={j.pageNumber}
                                        onClick={() => setCurrentPage(j.pageNumber)}
                                        className={`text-left p-2 rounded border text-sm transition-colors ${
                                            currentPage === j.pageNumber ? 'bg-blue-50 border-blue-300' : 'hover:bg-gray-50'
                                        } ${
                                            j.status === 'pass' ? 'border-l-4 border-l-green-500' :
                                            j.status === 'warning' ? 'border-l-4 border-l-yellow-500' :
                                            'border-l-4 border-l-red-500'
                                        }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <span className="font-medium">Page {j.pageNumber}: {j.expectedContent}</span>
                                            {j.status === 'pass' ? (
                                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                            ) : j.status === 'warning' ? (
                                                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                                            ) : (
                                                <XCircle className="h-4 w-4 text-red-500" />
                                            )}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>
        </div>
    );
}
