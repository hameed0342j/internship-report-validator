import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from './ui/card';
import { Button } from './ui/button';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Alert, AlertDescription } from './ui/alert';
import { 
    FolderOpen, 
    Play, 
    Download, 
    CheckCircle2, 
    XCircle, 
    AlertTriangle,
    FileText,
    Loader2,
    Upload
} from 'lucide-react';
import { PDFAnalyzer } from '../services/pdf-analyzer';
import { Validator } from '../services/validator';
import { WatermarkDetector } from '../services/watermark-detector';
import type { ValidationResult } from '../types';

interface BatchResult {
    fileName: string;
    result: ValidationResult | null;
    error?: string;
    processingTime: number;
}

interface BatchProcessorProps {
    onExport?: (results: BatchResult[]) => void;
}

export function BatchProcessor({ onExport }: BatchProcessorProps) {
    const [files, setFiles] = useState<File[]>([]);
    const [results, setResults] = useState<BatchResult[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [currentFile, setCurrentFile] = useState('');

    const handleFilesSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(e.target.files || []).filter(
            f => f.type === 'application/pdf' || f.name.endsWith('.pdf')
        );
        setFiles(selectedFiles);
        setResults([]);
        setProgress(0);
    }, []);

    const handleDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        const droppedFiles = Array.from(e.dataTransfer.files).filter(
            f => f.type === 'application/pdf' || f.name.endsWith('.pdf')
        );
        setFiles(prev => [...prev, ...droppedFiles]);
    }, []);

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
    }, []);

    const processFiles = async () => {
        if (files.length === 0) return;

        setIsProcessing(true);
        setResults([]);
        setProgress(0);

        const pdfAnalyzer = new PDFAnalyzer();
        const validator = new Validator();
        const watermarkDetector = new WatermarkDetector();
        const batchResults: BatchResult[] = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            setCurrentFile(file.name);
            const startTime = Date.now();

            try {
                // Analyze PDF
                const pages = await pdfAnalyzer.analyze(file);
                
                // Detect watermark
                const watermarkInfo = await watermarkDetector.detect(file);
                
                // Validate
                const result = validator.validate(pages, watermarkInfo, file.name);

                batchResults.push({
                    fileName: file.name,
                    result,
                    processingTime: Date.now() - startTime
                });
            } catch (error) {
                batchResults.push({
                    fileName: file.name,
                    result: null,
                    error: error instanceof Error ? error.message : 'Unknown error',
                    processingTime: Date.now() - startTime
                });
            }

            setProgress(((i + 1) / files.length) * 100);
            setResults([...batchResults]);
        }

        setIsProcessing(false);
        setCurrentFile('');
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return 'text-green-600';
        if (score >= 60) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getScoreBadge = (score: number) => {
        if (score >= 80) return <Badge className="bg-green-100 text-green-800">Pass</Badge>;
        if (score >= 60) return <Badge className="bg-yellow-100 text-yellow-800">Warning</Badge>;
        return <Badge className="bg-red-100 text-red-800">Fail</Badge>;
    };

    const exportToCSV = () => {
        if (results.length === 0) return;

        const headers = ['File Name', 'Score', 'Status', 'Errors', 'Warnings', 'Pages', 'RRN Valid', 'Processing Time (ms)'];
        const rows = results.map(r => [
            r.fileName,
            r.result?.score ?? 'N/A',
            r.result ? (r.result.score >= 80 ? 'Pass' : r.result.score >= 60 ? 'Warning' : 'Fail') : 'Error',
            r.result?.errors.length ?? r.error ?? 'N/A',
            r.result?.warnings.length ?? 'N/A',
            r.result?.pageCount ?? 'N/A',
            r.result?.watermark?.rrnValidation?.isValid ? 'Yes' : 'No',
            r.processingTime
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `batch-validation-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();

        if (onExport) onExport(results);
    };

    const stats = {
        total: results.length,
        passed: results.filter(r => r.result && r.result.score >= 80).length,
        warnings: results.filter(r => r.result && r.result.score >= 60 && r.result.score < 80).length,
        failed: results.filter(r => r.result && r.result.score < 60).length,
        errors: results.filter(r => !r.result).length
    };

    return (
        <Card className="w-full">
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <FolderOpen className="h-5 w-5" />
                    Batch Processing
                </CardTitle>
                <CardDescription>
                    Upload multiple PDF files to validate them all at once
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* File Upload Area */}
                <div
                    className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-500 transition-colors cursor-pointer"
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onClick={() => document.getElementById('batch-file-input')?.click()}
                >
                    <input
                        id="batch-file-input"
                        type="file"
                        accept=".pdf"
                        multiple
                        onChange={handleFilesSelect}
                        className="hidden"
                    />
                    <Upload className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                    <p className="text-lg font-medium text-gray-700">
                        Drop PDF files here or click to browse
                    </p>
                    <p className="text-sm text-gray-500 mt-1">
                        Select multiple files for batch processing
                    </p>
                </div>

                {/* Selected Files Count */}
                {files.length > 0 && (
                    <Alert>
                        <FileText className="h-4 w-4" />
                        <AlertDescription>
                            <span className="font-semibold">{files.length}</span> PDF file(s) selected
                            {!isProcessing && (
                                <Button
                                    variant="link"
                                    className="ml-2 p-0 h-auto"
                                    onClick={() => setFiles([])}
                                >
                                    Clear all
                                </Button>
                            )}
                        </AlertDescription>
                    </Alert>
                )}

                {/* Process Button */}
                <div className="flex gap-2">
                    <Button
                        onClick={processFiles}
                        disabled={files.length === 0 || isProcessing}
                        className="flex-1"
                    >
                        {isProcessing ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            <>
                                <Play className="h-4 w-4 mr-2" />
                                Process {files.length} File(s)
                            </>
                        )}
                    </Button>
                    
                    {results.length > 0 && (
                        <Button variant="outline" onClick={exportToCSV}>
                            <Download className="h-4 w-4 mr-2" />
                            Export CSV
                        </Button>
                    )}
                </div>

                {/* Progress Bar */}
                {isProcessing && (
                    <div className="space-y-2">
                        <div className="flex justify-between text-sm text-gray-600">
                            <span>Processing: {currentFile}</span>
                            <span>{Math.round(progress)}%</span>
                        </div>
                        <Progress value={progress} className="h-2" />
                    </div>
                )}

                {/* Stats Summary */}
                {results.length > 0 && (
                    <div className="grid grid-cols-5 gap-2">
                        <div className="bg-gray-100 rounded-lg p-3 text-center">
                            <div className="text-2xl font-bold">{stats.total}</div>
                            <div className="text-xs text-gray-500">Total</div>
                        </div>
                        <div className="bg-green-100 rounded-lg p-3 text-center">
                            <div className="text-2xl font-bold text-green-600">{stats.passed}</div>
                            <div className="text-xs text-green-600">Passed</div>
                        </div>
                        <div className="bg-yellow-100 rounded-lg p-3 text-center">
                            <div className="text-2xl font-bold text-yellow-600">{stats.warnings}</div>
                            <div className="text-xs text-yellow-600">Warnings</div>
                        </div>
                        <div className="bg-red-100 rounded-lg p-3 text-center">
                            <div className="text-2xl font-bold text-red-600">{stats.failed}</div>
                            <div className="text-xs text-red-600">Failed</div>
                        </div>
                        <div className="bg-gray-200 rounded-lg p-3 text-center">
                            <div className="text-2xl font-bold text-gray-600">{stats.errors}</div>
                            <div className="text-xs text-gray-600">Errors</div>
                        </div>
                    </div>
                )}

                {/* Results Table */}
                {results.length > 0 && (
                    <ScrollArea className="h-[400px] rounded-md border">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>File Name</TableHead>
                                    <TableHead className="text-center">Score</TableHead>
                                    <TableHead className="text-center">Status</TableHead>
                                    <TableHead className="text-center">Errors</TableHead>
                                    <TableHead className="text-center">Warnings</TableHead>
                                    <TableHead className="text-center">Pages</TableHead>
                                    <TableHead className="text-center">RRN</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {results.map((r, idx) => (
                                    <TableRow key={idx}>
                                        <TableCell className="font-medium max-w-[200px] truncate" title={r.fileName}>
                                            {r.fileName}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {r.result ? (
                                                <span className={`font-bold ${getScoreColor(r.result.score)}`}>
                                                    {r.result.score}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400">—</span>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {r.result ? getScoreBadge(r.result.score) : (
                                                <Badge variant="destructive">Error</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {r.result ? (
                                                <span className={r.result.errors.length > 0 ? 'text-red-600 font-medium' : ''}>
                                                    {r.result.errors.length}
                                                </span>
                                            ) : (
                                                <XCircle className="h-4 w-4 text-red-500 mx-auto" />
                                            )}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {r.result ? (
                                                <span className={r.result.warnings.length > 0 ? 'text-yellow-600' : ''}>
                                                    {r.result.warnings.length}
                                                </span>
                                            ) : '—'}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {r.result?.pageCount ?? '—'}
                                        </TableCell>
                                        <TableCell className="text-center">
                                            {r.result?.watermark?.rrnValidation?.isValid ? (
                                                <CheckCircle2 className="h-4 w-4 text-green-500 mx-auto" />
                                            ) : r.result?.watermark?.rrnValidation ? (
                                                <AlertTriangle className="h-4 w-4 text-yellow-500 mx-auto" />
                                            ) : (
                                                <XCircle className="h-4 w-4 text-gray-400 mx-auto" />
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </ScrollArea>
                )}
            </CardContent>
        </Card>
    );
}
