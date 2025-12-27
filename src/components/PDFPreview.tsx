import React, { useState } from 'react';
import { Document, Page, pdfjs } from 'react-pdf';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { AnalyzedPage } from '../types';

import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';

// Worker is already set globally in pdf-analyzer.ts, but react-pdf might need it too?
// Usually sharing the worker source is enough.
pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
).toString();

interface PDFPreviewProps {
    file: File;
    analyzedPages: AnalyzedPage[];
}

export const PDFPreview: React.FC<PDFPreviewProps> = ({ file, analyzedPages }) => {
    const [numPages, setNumPages] = useState<number>(0);
    const [pageNumber, setPageNumber] = useState<number>(1);

    function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
        setNumPages(numPages);
    }

    const currentPageIssues = analyzedPages.find(p => p.pageIndex === pageNumber)?.layoutIssues || [];

    return (
        <div className="h-full flex flex-col items-center bg-gray-100 p-4">
            <div className="mb-4 flex items-center space-x-4">
                <button
                    onClick={() => setPageNumber(prev => Math.max(prev - 1, 1))}
                    disabled={pageNumber <= 1}
                    className="p-2 rounded hover:bg-gray-200 disabled:opacity-50"
                >
                    <ChevronLeft />
                </button>
                <span className="font-medium">
                    Page {pageNumber} of {numPages}
                </span>
                <button
                    onClick={() => setPageNumber(prev => Math.min(prev + 1, numPages))}
                    disabled={pageNumber >= numPages}
                    className="p-2 rounded hover:bg-gray-200 disabled:opacity-50"
                >
                    <ChevronRight />
                </button>
            </div>

            <div className="relative border shadow-lg bg-white overflow-auto max-h-[80vh]">
                <Document file={file} onLoadSuccess={onDocumentLoadSuccess}>
                    <Page
                        pageNumber={pageNumber}
                        renderTextLayer={false}
                        renderAnnotationLayer={false}
                        width={600}
                    />
                </Document>

                {/* Overlay for Errors */}
                {currentPageIssues.map((issue, idx) => (
                    issue.boundingBox && (
                        <div
                            key={idx}
                            className="absolute border-2 border-red-500 bg-red-500/20 z-10 hover:bg-red-500/40 transition-colors cursor-help"
                            style={{
                                left: issue.boundingBox.x, // Need to scale coordinates if PDF is scaled?
                                // Note: PDFJS coordinates might need scaling if Page width != original viewport width.
                                // For now assuming 1.0 scale or matching via percentages if possible.
                                // Actually, simpler to just list errors below if coordinates are tricky without mapping.
                                // But let's try mapping. Page width=600.
                                // If original viewport was 595 (A4), 600 is close.
                                // For strict plotting, we'd need the viewport width from the `AnalyzedPage` data or passing it down.

                                // Since we don't have the original viewport width here easily without parsing again or storing it,
                                // I'll disable the visual box overlay for now to avoid misalignment, 
                                // and Rely on the text list of errors.
                                // Or better: Just show a general "Error on this page" indicator.
                                display: 'none'
                            }}
                            title={issue.message}
                        />
                    )
                ))}
            </div>

            {/* List of issues on this page */}
            {currentPageIssues.length > 0 && (
                <div className="mt-4 w-full max-w-xl bg-red-50 border border-red-200 p-4 rounded text-sm text-red-700">
                    <p className="font-bold mb-2">Issues on this page:</p>
                    <ul className="list-disc pl-5">
                        {currentPageIssues.map((issue, idx) => (
                            <li key={idx}>{issue.message}</li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
