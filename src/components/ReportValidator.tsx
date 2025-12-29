import { useState } from 'react';
import { FileUpload } from './FileUpload';
import { ResultsView } from './ResultsView';
import { PDFPreview } from './PDFPreview';
import { Header } from './Header';
import { Footer } from './Footer';
import { PDFAnalyzer } from '../services/pdf-analyzer';
import { DOCXAnalyzer } from '../services/docx-analyzer';
import { Validator } from '../services/validator';
import { WatermarkDetector } from '../services/watermark-detector';
import type { AnalyzedPage, ValidationResult, WatermarkInfo } from '../types';
import { ArrowLeft, Eye, BarChart3, Download, FileIcon } from 'lucide-react';

interface ProcessedFile {
    id: string;
    file: File;
    status: 'pending' | 'processing' | 'completed' | 'error';
    result?: ValidationResult;
    analyzedPages?: AnalyzedPage[];
    error?: string;
}

export function ReportValidator() {
    const [processedFiles, setProcessedFiles] = useState<ProcessedFile[]>([]);
    const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);

    const handleFilesSelect = async (files: File[]) => {
        const newFiles: ProcessedFile[] = files.map(f => ({
            id: Math.random().toString(36).substring(7),
            file: f,
            status: 'pending'
        }));

        setProcessedFiles(newFiles);
        setIsProcessing(true);
        setSelectedFileId(null);

        // Process files sequentially
        for (let i = 0; i < newFiles.length; i++) {
            const currentId = newFiles[i].id;

            setProcessedFiles(prev => prev.map(f =>
                f.id === currentId ? { ...f, status: 'processing' } : f
            ));

            try {
                let pages: AnalyzedPage[] = [];
                let watermarkInfo: WatermarkInfo | undefined;
                const file = newFiles[i].file;

                if (file.name.toLowerCase().endsWith('.pdf')) {
                    const analyzer = new PDFAnalyzer();
                    pages = await analyzer.analyze(file);

                    const watermarkDetector = new WatermarkDetector();
                    watermarkInfo = await watermarkDetector.detect(file);
                } else if (file.name.toLowerCase().endsWith('.docx')) {
                    const analyzer = new DOCXAnalyzer();
                    pages = await analyzer.analyze(file);
                }

                const validator = new Validator();
                const result = validator.validate(pages, watermarkInfo, file.name);

                setProcessedFiles(prev => prev.map(f =>
                    f.id === currentId ? {
                        ...f,
                        status: 'completed',
                        result,
                        analyzedPages: pages
                    } : f
                ));

            } catch (error) {
                console.error(`Analysis failed for ${newFiles[i].file.name}`, error);
                setProcessedFiles(prev => prev.map(f =>
                    f.id === currentId ? { ...f, status: 'error', error: 'Analysis failed' } : f
                ));
            }
        }
        setIsProcessing(false);
    };

    const reset = () => {
        setProcessedFiles([]);
        setSelectedFileId(null);
    };

    const downloadCSV = () => {
        const headers = ['Filename', 'Status', 'Score', 'Errors', 'Warnings'];
        const rows = processedFiles.map(f => [
            `"${f.file.name}"`,
            f.status,
            f.result?.score || 0,
            f.result?.errors.length || 0,
            f.result?.warnings.length || 0
        ].join(','));
        const csvContent = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'internship_reports_validation.csv';
        a.click();
        window.URL.revokeObjectURL(url);
    };

    const selectedFile = processedFiles.find(f => f.id === selectedFileId);

    // Stats
    const completedCount = processedFiles.filter(f => f.status === 'completed').length;
    const passedCount = processedFiles.filter(f => f.status === 'completed' && f.result && f.result.score >= 80).length;
    const avgScore = completedCount > 0
        ? Math.round(processedFiles.reduce((acc, f) => acc + (f.result?.score || 0), 0) / completedCount)
        : 0;
    const progressPercent = processedFiles.length > 0
        ? Math.round((processedFiles.filter(f => f.status !== 'pending').length / processedFiles.length) * 100)
        : 0;

    return (
        <div className="min-h-screen bg-base-200 flex flex-col font-sans">
            <Header />

            <main className="flex-1 w-full container mx-auto p-4 max-w-7xl animate-in fade-in duration-500">
                {processedFiles.length === 0 ? (
                    <div className="py-12 md:py-20 text-center space-y-8">
                        <div>
                            <h2 className="text-4xl font-bold tracking-tight mb-4 text-base-content">
                                Validate Your Internship Reports
                            </h2>
                            <p className="text-lg text-base-content/70 max-w-2xl mx-auto">
                                Upload a single report or an entire folder to check structure,
                                watermark authentication, and formatting compliance.
                            </p>
                        </div>

                        <div className="max-w-xl mx-auto">
                            <div className="card bg-base-100 shadow-xl border-2 border-dashed border-base-300">
                                <div className="card-body">
                                    <FileUpload onFilesSelect={handleFilesSelect} isProcessing={isProcessing} />
                                </div>
                            </div>
                        </div>

                        <div className="grid md:grid-cols-3 gap-6 mt-16 max-w-4xl mx-auto text-left">
                            <div className="card bg-base-100 shadow-lg hover:shadow-xl transition-all duration-300">
                                <div className="card-body items-center text-center">
                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                                        <Eye className="h-6 w-6 text-primary" />
                                    </div>
                                    <h3 className="card-title text-base font-bold">Structure Analysis</h3>
                                    <p className="text-sm text-base-content/70">Checks for Certificate, Abstract, TOC, and required sections</p>
                                </div>
                            </div>
                            <div className="card bg-base-100 shadow-lg hover:shadow-xl transition-all duration-300">
                                <div className="card-body items-center text-center">
                                    <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center mb-2">
                                        <BarChart3 className="h-6 w-6 text-secondary" />
                                    </div>
                                    <h3 className="card-title text-base font-bold">RRN Watermark</h3>
                                    <p className="text-sm text-base-content/70">Validates 12-digit RRN with 20-25 year prefix</p>
                                </div>
                            </div>
                            <div className="card bg-base-100 shadow-lg hover:shadow-xl transition-all duration-300">
                                <div className="card-body items-center text-center">
                                    <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center mb-2">
                                        <ArrowLeft className="h-6 w-6 text-accent rotate-180" />
                                    </div>
                                    <h3 className="card-title text-base font-bold">Chapter Sequence</h3>
                                    <p className="text-sm text-base-content/70">Verifies proper chapter ordering and numbering</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="space-y-6">
                        {/* Status Bar */}
                        {!selectedFileId && (
                            <div className="navbar bg-base-100 rounded-box shadow-lg z-10">
                                <div className="flex-1">
                                    <button onClick={reset} className="btn btn-ghost gap-2 normal-case text-lg font-medium">
                                        <ArrowLeft className="h-5 w-5" />
                                        Upload New Files
                                    </button>
                                </div>
                                <div className="flex-none gap-2">
                                    <div className="hidden md:flex gap-4 mr-4">
                                        <div className="flex flex-col items-center">
                                            <span className="text-xs uppercase tracking-wider opacity-70">Files</span>
                                            <span className="font-bold">{processedFiles.length}</span>
                                        </div>
                                        <div className="divider divider-horizontal m-0"></div>
                                        <div className="flex flex-col items-center">
                                            <span className="text-xs uppercase tracking-wider opacity-70">Passed</span>
                                            <span className="font-bold text-success">{passedCount}</span>
                                        </div>
                                        <div className="divider divider-horizontal m-0"></div>
                                        <div className="flex flex-col items-center">
                                            <span className="text-xs uppercase tracking-wider opacity-70">Avg Score</span>
                                            <span className={`font-bold ${avgScore >= 80 ? 'text-success' : 'text-warning'}`}>{avgScore}%</span>
                                        </div>
                                    </div>
                                    <button onClick={downloadCSV} className="btn btn-primary btn-sm" disabled={processedFiles.length === 0}>
                                        <Download className="h-4 w-4 mr-2" />
                                        Export CSV
                                    </button>
                                </div>
                            </div>
                        )}

                        {selectedFileId ? (
                            <div className="h-[85vh] flex flex-col">
                                <div className="mb-4">
                                    <button onClick={() => setSelectedFileId(null)} className="btn btn-sm btn-outline gap-2">
                                        <ArrowLeft className="h-4 w-4" /> Back to Batch Results
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full overflow-hidden">
                                    {/* Left Panel: Result Details */}
                                    <div className="h-full overflow-y-auto pr-2 pb-20">
                                        {selectedFile && selectedFile.result && (
                                            <ResultsView
                                                result={selectedFile.result}
                                                onClose={() => setSelectedFileId(null)}
                                            />
                                        )}
                                    </div>

                                    {/* Right Panel: Preview */}
                                    <div className="h-full bg-base-100 rounded-box shadow-lg border border-base-300 overflow-hidden flex flex-col">
                                        <div className="p-2 bg-base-200 border-b border-base-300 font-medium text-center">
                                            Document Preview
                                        </div>
                                        <div className="flex-1 overflow-auto bg-gray-100 relative">
                                            {selectedFile && selectedFile.analyzedPages ? (
                                                <PDFPreview
                                                    file={selectedFile.file}
                                                    analyzedPages={selectedFile.analyzedPages}
                                                />
                                            ) : (
                                                <div className="flex items-center justify-center h-full text-base-content/50">
                                                    Preview not available
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="card bg-base-100 shadow-xl">
                                <div className="card-body p-0">
                                    <div className="p-6 border-b border-base-200 flex justify-between items-center bg-base-50/50">
                                        <div>
                                            <h2 className="card-title">Batch Results</h2>
                                            <p className="text-sm text-base-content/70">{isProcessing ? 'Processing files...' : 'All files processed'}</p>
                                        </div>
                                        {isProcessing && (
                                            <div className="w-64">
                                                <div className="flex justify-between text-xs mb-1">
                                                    <span>Progress</span>
                                                    <span>{progressPercent}%</span>
                                                </div>
                                                <progress className="progress progress-primary w-full" value={progressPercent} max="100"></progress>
                                            </div>
                                        )}
                                    </div>

                                    <div className="overflow-x-auto h-[600px] w-full">
                                        <table className="table table-pin-rows">
                                            <thead>
                                                <tr className="bg-base-200/50">
                                                    <th>File Name</th>
                                                    <th>Status</th>
                                                    <th>Score</th>
                                                    <th>Watermark / RRN</th>
                                                    <th>Analyze</th>
                                                    <th>Details</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {processedFiles.map((file) => (
                                                    <tr key={file.id} className="hover">
                                                        <td>
                                                            <div className="flex items-center gap-3">
                                                                <div className="avatar placeholder">
                                                                    <div className="bg-neutral-content text-neutral-content rounded-lg w-8 h-8">
                                                                        <FileIcon className="w-4 h-4 text-neutral" />
                                                                    </div>
                                                                </div>
                                                                <div>
                                                                    <div className="font-bold max-w-xs truncate" title={file.file.name}>{file.file.name}</div>
                                                                    <div className="text-xs opacity-50">{(file.file.size / 1024 / 1024).toFixed(2)} MB</div>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td>
                                                            {file.status === 'processing' && <span className="loading loading-spinner loading-sm text-primary"></span>}
                                                            {file.status === 'pending' && <span className="badge badge-ghost">Pending</span>}
                                                            {file.status === 'error' && <span className="badge badge-error text-error-content">Error</span>}
                                                            {file.status === 'completed' && <span className="badge badge-success text-white">Done</span>}
                                                        </td>
                                                        <td>
                                                            {file.result ? (
                                                                <div className="flex items-center gap-2">
                                                                    <div
                                                                        className={`radial-progress text-xs font-bold ${file.result.score >= 80 ? 'text-success' : file.result.score >= 50 ? 'text-warning' : 'text-error'
                                                                            }`}
                                                                        style={{ "--value": file.result.score, "--size": "2.5rem" } as React.CSSProperties}
                                                                        role="progressbar"
                                                                    >
                                                                        {file.result.score}
                                                                    </div>
                                                                </div>
                                                            ) : '-'}
                                                        </td>
                                                        <td>
                                                            {file.result?.watermark?.rrnValidation?.detectedRRN ? (
                                                                <div className="badge badge-outline font-mono">{file.result.watermark.rrnValidation.detectedRRN}</div>
                                                            ) : file.status === 'completed' ? (
                                                                <span className="text-base-content/30 text-xs italic">Not found</span>
                                                            ) : '-'}
                                                        </td>
                                                        <td>
                                                            {file.result ? (
                                                                <div className="flex gap-2">
                                                                    {file.result.errors.length > 0 && (
                                                                        <div className="tooltip" data-tip={`${file.result.errors.length} Errors`}>
                                                                            <span className="badge badge-error badge-sm">{file.result.errors.length}</span>
                                                                        </div>
                                                                    )}
                                                                    {file.result.warnings.length > 0 && (
                                                                        <div className="tooltip" data-tip={`${file.result.warnings.length} Warnings`}>
                                                                            <span className="badge badge-warning badge-sm">{file.result.warnings.length}</span>
                                                                        </div>
                                                                    )}
                                                                    {file.result.errors.length === 0 && file.result.warnings.length === 0 && (
                                                                        <span className="badge badge-success badge-sm">Perfect</span>
                                                                    )}
                                                                </div>
                                                            ) : '-'}
                                                        </td>
                                                        <th>
                                                            <button
                                                                className="btn btn-ghost btn-xs"
                                                                onClick={() => setSelectedFileId(file.id)}
                                                                disabled={!file.result}
                                                            >
                                                                View Report
                                                            </button>
                                                        </th>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </main>
            <Footer />
        </div>
    );
}
