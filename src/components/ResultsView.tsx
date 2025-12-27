import type { ValidationResult } from '../types';
import { 
    CheckCircle2, XCircle, AlertTriangle, Shield, FileText,
    Copy, Download
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { toast } from '@/components/ui/sonner';

interface ResultsViewProps {
    result: ValidationResult;
}

export function ResultsView({ result }: ResultsViewProps) {
    const copyResultsToClipboard = () => {
        const text = `
Internship Report Validation Results
=====================================
File: ${result.fileName || 'Unknown'}
Score: ${result.score}%
Pages: ${result.pageCount}
Errors: ${result.errors.length}
Warnings: ${result.warnings.length}

${result.errors.length > 0 ? `ERRORS:\n${result.errors.map(e => `• ${e}`).join('\n')}` : ''}

${result.warnings.length > 0 ? `WARNINGS:\n${result.warnings.map(w => `• ${w}`).join('\n')}` : ''}

RRN: ${result.watermark?.rrnValidation?.detectedRRN || 'Not found'}
        `.trim();
        
        navigator.clipboard.writeText(text);
        toast.success('Copied to clipboard!');
    };

    const downloadResults = () => {
        const text = JSON.stringify(result, null, 2);
        const blob = new Blob([text], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `validation-results-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Results downloaded!');
    };

    return (
        <div className="space-y-6">
            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={copyResultsToClipboard} className="gap-2">
                    <Copy className="h-4 w-4" />
                    Copy
                </Button>
                <Button variant="outline" size="sm" onClick={downloadResults} className="gap-2">
                    <Download className="h-4 w-4" />
                    Export
                </Button>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
                {/* Errors Section */}
                <Card className={result.errors.length > 0 ? 'border-red-200 dark:border-red-900' : ''}>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base flex items-center gap-2">
                                <XCircle className="h-5 w-5 text-red-500" />
                                Errors
                            </CardTitle>
                            <Badge variant={result.errors.length > 0 ? "destructive" : "secondary"}>
                                {result.errors.length}
                            </Badge>
                        </div>
                        <CardDescription>Issues that must be fixed</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {result.errors.length > 0 ? (
                            <ScrollArea className="h-[250px] pr-4">
                                <div className="space-y-3">
                                    {result.errors.map((error, index) => (
                                        <div 
                                            key={index} 
                                            className="flex gap-3 p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/50"
                                        >
                                            <div className="shrink-0 w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/50 flex items-center justify-center text-xs font-medium text-red-600">
                                                {index + 1}
                                            </div>
                                            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-3">
                                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                                </div>
                                <p className="text-sm font-medium text-green-600 dark:text-green-400">No errors found!</p>
                                <p className="text-xs text-muted-foreground mt-1">Your document passed all critical checks</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Warnings Section */}
                <Card className={result.warnings.length > 0 ? 'border-yellow-200 dark:border-yellow-900' : ''}>
                    <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                            <CardTitle className="text-base flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                                Warnings
                            </CardTitle>
                            <Badge variant="secondary" className={result.warnings.length > 0 ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' : ''}>
                                {result.warnings.length}
                            </Badge>
                        </div>
                        <CardDescription>Suggestions for improvement</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {result.warnings.length > 0 ? (
                            <ScrollArea className="h-[250px] pr-4">
                                <div className="space-y-3">
                                    {result.warnings.map((warning, index) => (
                                        <div 
                                            key={index} 
                                            className="flex gap-3 p-3 rounded-lg bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-100 dark:border-yellow-900/50"
                                        >
                                            <div className="shrink-0 w-6 h-6 rounded-full bg-yellow-100 dark:bg-yellow-900/50 flex items-center justify-center text-xs font-medium text-yellow-600">
                                                {index + 1}
                                            </div>
                                            <p className="text-sm text-yellow-700 dark:text-yellow-300">{warning}</p>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-center">
                                <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mb-3">
                                    <CheckCircle2 className="h-6 w-6 text-green-500" />
                                </div>
                                <p className="text-sm font-medium text-green-600 dark:text-green-400">No warnings!</p>
                                <p className="text-xs text-muted-foreground mt-1">Everything looks great</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Watermark Details */}
            {result.watermark && (
                <Card>
                    <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Shield className="h-5 w-5 text-blue-500" />
                            Watermark Analysis
                        </CardTitle>
                        <CardDescription>RRN and watermark detection results</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-lg border overflow-hidden">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-muted/50">
                                        <TableHead className="font-medium">Property</TableHead>
                                        <TableHead className="font-medium">Value</TableHead>
                                        <TableHead className="font-medium">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    <TableRow>
                                        <TableCell className="font-medium">Watermark Detected</TableCell>
                                        <TableCell>{result.watermark.hasWatermark ? 'Yes' : 'No'}</TableCell>
                                        <TableCell>
                                            {result.watermark.hasWatermark ? (
                                                <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                                    Found
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                                    <XCircle className="h-3 w-3 mr-1" />
                                                    Missing
                                                </Badge>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-medium">RRN Number</TableCell>
                                        <TableCell className="font-mono">
                                            {result.watermark.rrnValidation?.detectedRRN || 'Not detected'}
                                        </TableCell>
                                        <TableCell>
                                            {result.watermark.rrnValidation?.isValid ? (
                                                <Badge variant="secondary" className="bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                                    <CheckCircle2 className="h-3 w-3 mr-1" />
                                                    Valid
                                                </Badge>
                                            ) : (
                                                <Badge variant="secondary" className="bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                                    <XCircle className="h-3 w-3 mr-1" />
                                                    Invalid
                                                </Badge>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-medium">Confidence</TableCell>
                                        <TableCell>{result.watermark.confidence}</TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={
                                                result.watermark.confidence === 'HIGH' 
                                                    ? 'border-green-500 text-green-600' 
                                                    : result.watermark.confidence === 'MEDIUM'
                                                        ? 'border-yellow-500 text-yellow-600'
                                                        : 'border-red-500 text-red-600'
                                            }>
                                                {result.watermark.confidence}
                                            </Badge>
                                        </TableCell>
                                    </TableRow>
                                    <TableRow>
                                        <TableCell className="font-medium">Pages with Watermark</TableCell>
                                        <TableCell>{result.watermark.watermarkPages.length} pages</TableCell>
                                        <TableCell>
                                            <span className="text-xs text-muted-foreground">
                                                {result.watermark.watermarkPages.slice(0, 5).join(', ')}
                                                {result.watermark.watermarkPages.length > 5 && '...'}
                                            </span>
                                        </TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </div>
                        
                        {result.watermark.rrnValidation && (
                            <div className="mt-4 p-3 rounded-lg bg-muted/50 text-sm">
                                <p className="text-muted-foreground">
                                    <strong>RRN Format:</strong> {result.watermark.rrnValidation.expectedFormat}
                                </p>
                                <p className="text-muted-foreground mt-1">
                                    <strong>Message:</strong> {result.watermark.rrnValidation.message}
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Quick Summary */}
            <Card className="bg-gradient-to-br from-muted/50 to-muted/30">
                <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                            <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                            <h4 className="font-semibold mb-1">Validation Summary</h4>
                            <p className="text-sm text-muted-foreground">
                                Your document "{result.fileName}" has been analyzed. 
                                {result.score >= 80 
                                    ? " Great work! Your report meets most requirements."
                                    : result.score >= 50
                                        ? " There are some issues that need attention before submission."
                                        : " Please review the errors above and make necessary corrections."
                                }
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
