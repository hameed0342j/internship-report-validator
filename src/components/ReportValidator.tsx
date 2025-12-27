import { useState, useEffect } from 'react';
import { FileUpload } from './FileUpload';
import { ResultsView } from './ResultsView';
import { PDFPreview } from './PDFPreview';
import { Header } from './Header';
import { Footer } from './Footer';
import { BatchProcessor } from './BatchProcessor';
import { PageAnalysisView } from './PageAnalysisView';
import { PDFAnalyzer } from '../services/pdf-analyzer';
import { DOCXAnalyzer } from '../services/docx-analyzer';
import { Validator } from '../services/validator';
import { WatermarkDetector } from '../services/watermark-detector';
import type { AnalyzedPage, ValidationResult, WatermarkInfo } from '../types';
import { 
    ArrowLeft, Eye, BarChart3, Shield, FileCheck, BookOpen, 
    CheckCircle2, XCircle, AlertTriangle, Sparkles, Zap,
    FileText, TrendingUp, FolderOpen, FileSearch
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Skeleton } from '@/components/ui/skeleton';
import { Toaster, toast } from '@/components/ui/sonner';
import { 
    Tooltip, 
    TooltipContent, 
    TooltipProvider, 
    TooltipTrigger 
} from '@/components/ui/tooltip';
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";

export function ReportValidator() {
    const [file, setFile] = useState<File | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
    const [analyzedPages, setAnalyzedPages] = useState<AnalyzedPage[]>([]);
    const [progress, setProgress] = useState(0);
    const [processingStage, setProcessingStage] = useState('');
    const [mode, setMode] = useState<'single' | 'batch'>('single');

    useEffect(() => {
        if (isProcessing) {
            const stages = [
                { progress: 10, stage: 'Reading document...' },
                { progress: 30, stage: 'Analyzing structure...' },
                { progress: 50, stage: 'Detecting watermarks...' },
                { progress: 70, stage: 'Validating content...' },
                { progress: 90, stage: 'Generating report...' },
            ];
            
            let currentIndex = 0;
            const interval = setInterval(() => {
                if (currentIndex < stages.length) {
                    setProgress(stages[currentIndex].progress);
                    setProcessingStage(stages[currentIndex].stage);
                    currentIndex++;
                }
            }, 600);
            
            return () => clearInterval(interval);
        } else {
            setProgress(0);
            setProcessingStage('');
        }
    }, [isProcessing]);

    const handleFileSelect = async (selectedFile: File) => {
        setFile(selectedFile);
        setIsProcessing(true);
        setValidationResult(null);
        
        toast.info('Processing Started', {
            description: `Analyzing ${selectedFile.name}...`,
        });

        try {
            let pages: AnalyzedPage[] = [];
            let watermarkInfo: WatermarkInfo | undefined;

            if (selectedFile.name.toLowerCase().endsWith('.pdf')) {
                const analyzer = new PDFAnalyzer();
                pages = await analyzer.analyze(selectedFile);
                
                const watermarkDetector = new WatermarkDetector();
                watermarkInfo = await watermarkDetector.detect(selectedFile);
            } else if (selectedFile.name.toLowerCase().endsWith('.docx')) {
                const analyzer = new DOCXAnalyzer();
                pages = await analyzer.analyze(selectedFile);
            }

            setAnalyzedPages(pages);
            setProgress(100);

            const validator = new Validator();
            const result = validator.validate(pages, watermarkInfo, selectedFile.name);
            setValidationResult(result);

            if (result.score >= 80) {
                toast.success('Analysis Complete!', {
                    description: `Score: ${result.score}% - Great job!`,
                });
            } else if (result.score >= 50) {
                toast.warning('Analysis Complete', {
                    description: `Score: ${result.score}% - Some issues found.`,
                });
            } else {
                toast.error('Analysis Complete', {
                    description: `Score: ${result.score}% - Significant issues detected.`,
                });
            }

        } catch (error) {
            console.error("Analysis failed", error);
            toast.error('Analysis Failed', {
                description: 'Failed to analyze file. Please try again.',
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const reset = () => {
        setFile(null);
        setValidationResult(null);
        setAnalyzedPages([]);
        setProgress(0);
    };

    const getScoreGradient = (score: number) => {
        if (score >= 80) return 'from-green-500 to-emerald-500';
        if (score >= 60) return 'from-yellow-500 to-orange-500';
        return 'from-red-500 to-rose-500';
    };

    return (
        <TooltipProvider>
            <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20 flex flex-col">
                <Toaster position="top-right" />
                <Header />

                <main className="flex-1">
                    {!file ? (
                        <div className="container mx-auto px-4 py-12 md:py-16 max-w-7xl">
                            {/* Hero Section */}
                            <div className="text-center mb-12 relative">
                                <div className="absolute inset-0 -z-10 mx-auto max-w-4xl">
                                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-pink-500/10 blur-3xl rounded-full" />
                                </div>
                                
                                <Badge variant="secondary" className="mb-4 gap-1">
                                    <Sparkles className="h-3 w-3" />
                                    AI-Powered Validation
                                </Badge>
                                
                                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-4 bg-gradient-to-r from-foreground via-foreground to-muted-foreground bg-clip-text">
                                    Internship Report Validator
                                </h1>
                                
                                <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto leading-relaxed">
                                    Instantly validate your internship report against 
                                    <span className="text-foreground font-medium"> B.S. Abdur Rahman Crescent Institute </span>
                                    formatting standards.
                                </p>
                            </div>

                            {/* Stats Bar */}
                            <div className="flex justify-center gap-8 mb-12 flex-wrap">
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <FileCheck className="h-4 w-4 text-green-500" />
                                            <span><strong className="text-foreground">15+</strong> Validation Rules</span>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>Structure, formatting, watermark checks</TooltipContent>
                                </Tooltip>
                                
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Zap className="h-4 w-4 text-yellow-500" />
                                            <span><strong className="text-foreground">Instant</strong> Analysis</span>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>Results in seconds</TooltipContent>
                                </Tooltip>
                                
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                            <Shield className="h-4 w-4 text-blue-500" />
                                            <span><strong className="text-foreground">RRN</strong> Watermark Verified</span>
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>12-digit registration number validation</TooltipContent>
                                </Tooltip>
                            </div>

                            {/* Mode Selector */}
                            <div className="flex justify-center mb-8">
                                <div className="inline-flex rounded-lg border border-muted p-1 bg-muted/30">
                                    <button
                                        onClick={() => setMode('single')}
                                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                                            mode === 'single' 
                                                ? 'bg-background shadow text-foreground' 
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        <FileText className="h-4 w-4 inline mr-2" />
                                        Single File
                                    </button>
                                    <button
                                        onClick={() => setMode('batch')}
                                        className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${
                                            mode === 'batch' 
                                                ? 'bg-background shadow text-foreground' 
                                                : 'text-muted-foreground hover:text-foreground'
                                        }`}
                                    >
                                        <FolderOpen className="h-4 w-4 inline mr-2" />
                                        Batch Processing
                                    </button>
                                </div>
                            </div>
                            
                            {mode === 'single' ? (
                                <>
                                    <FileUpload onFileSelect={handleFileSelect} isProcessing={isProcessing} />

                                    {/* Feature Cards */}
                                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mt-16 max-w-6xl mx-auto">
                                        <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-blue-200/50 dark:border-blue-900/50 bg-gradient-to-br from-blue-50/50 to-transparent dark:from-blue-950/20">
                                            <CardContent className="p-5">
                                                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center mb-3 group-hover:bg-blue-500/20 transition-colors">
                                                    <BookOpen className="h-5 w-5 text-blue-500" />
                                                </div>
                                                <h3 className="font-semibold mb-1">Structure Check</h3>
                                                <p className="text-xs text-muted-foreground">
                                                    Cover, Certificate, TOC, Abstract, Chapters
                                                </p>
                                            </CardContent>
                                        </Card>
                                        
                                        <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-green-200/50 dark:border-green-900/50 bg-gradient-to-br from-green-50/50 to-transparent dark:from-green-950/20">
                                            <CardContent className="p-5">
                                                <div className="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center mb-3 group-hover:bg-green-500/20 transition-colors">
                                                    <Shield className="h-5 w-5 text-green-500" />
                                                </div>
                                                <h3 className="font-semibold mb-1">RRN Watermark</h3>
                                                <p className="text-xs text-muted-foreground">
                                                    12-digit format with 20-25 year prefix
                                                </p>
                                            </CardContent>
                                        </Card>
                                        
                                        <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-purple-200/50 dark:border-purple-900/50 bg-gradient-to-br from-purple-50/50 to-transparent dark:from-purple-950/20">
                                            <CardContent className="p-5">
                                                <div className="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center mb-3 group-hover:bg-purple-500/20 transition-colors">
                                                    <TrendingUp className="h-5 w-5 text-purple-500" />
                                                </div>
                                                <h3 className="font-semibold mb-1">Chapter Flow</h3>
                                                <p className="text-xs text-muted-foreground">
                                                    Sequential chapter ordering validation
                                                </p>
                                            </CardContent>
                                        </Card>
                                        
                                        <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-orange-200/50 dark:border-orange-900/50 bg-gradient-to-br from-orange-50/50 to-transparent dark:from-orange-950/20">
                                            <CardContent className="p-5">
                                                <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center mb-3 group-hover:bg-orange-500/20 transition-colors">
                                                    <FileText className="h-5 w-5 text-orange-500" />
                                                </div>
                                                <h3 className="font-semibold mb-1">Page Count</h3>
                                                <p className="text-xs text-muted-foreground">
                                                    Minimum 30 pages requirement check
                                                </p>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* How It Works */}
                                    <div className="mt-20 max-w-4xl mx-auto">
                                        <h2 className="text-2xl font-bold text-center mb-8">How It Works</h2>
                                        <div className="grid md:grid-cols-3 gap-8">
                                            <div className="text-center">
                                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 text-xl font-bold text-primary">1</div>
                                                <h3 className="font-semibold mb-2">Upload</h3>
                                                <p className="text-sm text-muted-foreground">Drop your PDF or DOCX report</p>
                                            </div>
                                            <div className="text-center">
                                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 text-xl font-bold text-primary">2</div>
                                                <h3 className="font-semibold mb-2">Analyze</h3>
                                                <p className="text-sm text-muted-foreground">AI scans structure & watermarks</p>
                                            </div>
                                            <div className="text-center">
                                                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 text-xl font-bold text-primary">3</div>
                                                <h3 className="font-semibold mb-2">Results</h3>
                                                <p className="text-sm text-muted-foreground">Get detailed validation report</p>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            ) : (
                                /* Batch Processing Mode */
                                <div className="max-w-5xl mx-auto">
                                    <BatchProcessor 
                                        onExport={(results) => {
                                            toast.success('Export Complete', {
                                                description: `Exported ${results.length} results to CSV`,
                                            });
                                        }}
                                    />
                                    </div>
                                )}
                        </div>
                    ) : (
                        <div className="container mx-auto px-4 py-6 max-w-7xl">
                            {/* Header Bar */}
                            <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
                                <Button variant="ghost" onClick={reset} className="gap-2">
                                    <ArrowLeft className="h-4 w-4" />
                                    Upload New File
                                </Button>
                                
                                <div className="flex items-center gap-3">
                                    <Badge variant="outline" className="gap-1.5">
                                        <FileText className="h-3 w-3" />
                                        {file.name}
                                    </Badge>
                                    <Badge variant="secondary">
                                        {(file.size / 1024 / 1024).toFixed(2)} MB
                                    </Badge>
                                </div>
                            </div>

                            {isProcessing ? (
                                /* Loading State */
                                <div className="max-w-2xl mx-auto mt-12">
                                    <Card className="overflow-hidden">
                                        <CardContent className="p-8">
                                            {/* Animated Processing Header */}
                                            <div className="flex items-center justify-center mb-8">
                                                <div className="relative">
                                                    <div className="w-24 h-24 rounded-full border-4 border-muted" />
                                                    <div className="absolute inset-0 w-24 h-24 rounded-full border-4 border-t-primary border-r-primary/50 animate-spin" />
                                                    <div className="absolute inset-0 flex items-center justify-center">
                                                        <span className="text-2xl font-bold">{progress}%</span>
                                                    </div>
                                                </div>
                                            </div>
                                            
                                            <h3 className="text-xl font-semibold text-center mb-2">
                                                Analyzing Your Report
                                            </h3>
                                            <p className="text-muted-foreground text-center mb-6">
                                                {processingStage || 'Initializing...'}
                                            </p>
                                            
                                            <Progress value={progress} className="h-2 mb-6" />
                                            
                                            {/* Skeleton Preview */}
                                            <div className="space-y-4 mt-8">
                                                <div className="flex gap-4">
                                                    <Skeleton className="h-4 w-4 rounded-full" />
                                                    <Skeleton className="h-4 flex-1" />
                                                </div>
                                                <div className="flex gap-4">
                                                    <Skeleton className="h-4 w-4 rounded-full" />
                                                    <Skeleton className="h-4 flex-1" />
                                                </div>
                                                <div className="flex gap-4">
                                                    <Skeleton className="h-4 w-4 rounded-full" />
                                                    <Skeleton className="h-4 w-3/4" />
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            ) : validationResult ? (
                                /* Results View */
                                <div className="space-y-6">
                                    {/* Score Overview */}
                                    <div className="grid md:grid-cols-4 gap-4">
                                        <Card className="md:col-span-1">
                                            <CardContent className="p-6 text-center">
                                                <div className={`text-5xl font-bold mb-2 bg-gradient-to-r ${getScoreGradient(validationResult.score)} bg-clip-text text-transparent`}>
                                                    {validationResult.score}%
                                                </div>
                                                <p className="text-sm text-muted-foreground">Overall Score</p>
                                                <Progress 
                                                    value={validationResult.score} 
                                                    className="h-2 mt-3" 
                                                />
                                            </CardContent>
                                        </Card>
                                        
                                        <Card className="md:col-span-3">
                                            <CardContent className="p-6">
                                                <div className="grid grid-cols-3 gap-4 text-center">
                                                    <div>
                                                        <div className="flex items-center justify-center gap-2 mb-1">
                                                            <XCircle className="h-5 w-5 text-red-500" />
                                                            <span className="text-2xl font-bold">{validationResult.errors.length}</span>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground">Errors</p>
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center justify-center gap-2 mb-1">
                                                            <AlertTriangle className="h-5 w-5 text-yellow-500" />
                                                            <span className="text-2xl font-bold">{validationResult.warnings.length}</span>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground">Warnings</p>
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center justify-center gap-2 mb-1">
                                                            <FileText className="h-5 w-5 text-blue-500" />
                                                            <span className="text-2xl font-bold">{validationResult.pageCount}</span>
                                                        </div>
                                                        <p className="text-xs text-muted-foreground">Pages</p>
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    </div>

                                    {/* Alerts for Critical Issues */}
                                    {validationResult.errors.length > 0 && (
                                        <Alert variant="destructive">
                                            <XCircle className="h-4 w-4" />
                                            <AlertTitle>Critical Issues Found</AlertTitle>
                                            <AlertDescription>
                                                {validationResult.errors.length} error(s) need to be fixed before submission.
                                            </AlertDescription>
                                        </Alert>
                                    )}

                                    {validationResult.watermark?.rrnValidation?.isValid && (
                                        <Alert variant="success">
                                            <CheckCircle2 className="h-4 w-4" />
                                            <AlertTitle>RRN Watermark Verified</AlertTitle>
                                            <AlertDescription>
                                                Detected valid RRN: {validationResult.watermark.rrnValidation.detectedRRN}
                                            </AlertDescription>
                                        </Alert>
                                    )}

                                    {/* Main Tabs */}
                                    <Tabs defaultValue="results" className="w-full">
                                        <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-4 mb-6">
                                            <TabsTrigger value="results" className="gap-2">
                                                <BarChart3 className="h-4 w-4" />
                                                Details
                                            </TabsTrigger>
                                            <TabsTrigger value="structure" className="gap-2">
                                                <BookOpen className="h-4 w-4" />
                                                Structure
                                            </TabsTrigger>
                                            <TabsTrigger value="analysis" className="gap-2">
                                                <FileSearch className="h-4 w-4" />
                                                Page Analysis
                                            </TabsTrigger>
                                            <TabsTrigger value="preview" className="gap-2">
                                                <Eye className="h-4 w-4" />
                                                Preview
                                            </TabsTrigger>
                                        </TabsList>

                                        <TabsContent value="results">
                                            <ResultsView result={validationResult} />
                                        </TabsContent>

                                        <TabsContent value="structure">
                                            <Card>
                                                <CardHeader>
                                                    <CardTitle>Document Structure</CardTitle>
                                                    <CardDescription>Required sections and their status</CardDescription>
                                                </CardHeader>
                                                <CardContent>
                                                    <Accordion type="single" collapsible className="w-full">
                                                        <AccordionItem value="front-matter">
                                                            <AccordionTrigger>
                                                                <span className="flex items-center gap-2">
                                                                    Front Matter
                                                                    <Badge variant="outline" className="ml-2">
                                                                        {[
                                                                            validationResult.structure.hasCover,
                                                                            validationResult.structure.hasBonafide,
                                                                            validationResult.structure.hasCertificate,
                                                                        ].filter(Boolean).length}/3
                                                                    </Badge>
                                                                </span>
                                                            </AccordionTrigger>
                                                            <AccordionContent>
                                                                <div className="space-y-2">
                                                                    <StructureItem label="Cover Page" checked={validationResult.structure.hasCover} />
                                                                    <StructureItem label="Bonafide Certificate" checked={validationResult.structure.hasBonafide} />
                                                                    <StructureItem label="Certificate" checked={validationResult.structure.hasCertificate} />
                                                                </div>
                                                            </AccordionContent>
                                                        </AccordionItem>
                                                        
                                                        <AccordionItem value="preliminary">
                                                            <AccordionTrigger>
                                                                <span className="flex items-center gap-2">
                                                                    Preliminary Pages
                                                                    <Badge variant="outline" className="ml-2">
                                                                        {[
                                                                            validationResult.structure.hasAcknowledgment,
                                                                            validationResult.structure.hasTableOfContents,
                                                                            validationResult.structure.hasAbstract,
                                                                        ].filter(Boolean).length}/3
                                                                    </Badge>
                                                                </span>
                                                            </AccordionTrigger>
                                                            <AccordionContent>
                                                                <div className="space-y-2">
                                                                    <StructureItem label="Acknowledgement" checked={validationResult.structure.hasAcknowledgment} />
                                                                    <StructureItem label="Table of Contents" checked={validationResult.structure.hasTableOfContents} />
                                                                    <StructureItem label="Abstract" checked={validationResult.structure.hasAbstract} />
                                                                    <StructureItem label="List of Abbreviations" checked={validationResult.structure.hasAbbreviations} optional />
                                                                    <StructureItem label="List of Figures" checked={validationResult.structure.hasListOfFigures} optional />
                                                                </div>
                                                            </AccordionContent>
                                                        </AccordionItem>
                                                        
                                                        <AccordionItem value="body">
                                                            <AccordionTrigger>
                                                                <span className="flex items-center gap-2">
                                                                    Main Content
                                                                    <Badge variant="outline" className="ml-2">
                                                                        {[
                                                                            validationResult.structure.hasIntroduction,
                                                                            validationResult.structure.hasConclusion,
                                                                            validationResult.structure.hasReferences,
                                                                        ].filter(Boolean).length}/3
                                                                    </Badge>
                                                                </span>
                                                            </AccordionTrigger>
                                                            <AccordionContent>
                                                                <div className="space-y-2">
                                                                    <StructureItem label="Introduction (Chapter 1)" checked={validationResult.structure.hasIntroduction} />
                                                                    <StructureItem label="Conclusion" checked={validationResult.structure.hasConclusion} />
                                                                    <StructureItem label="References/Bibliography" checked={validationResult.structure.hasReferences} />
                                                                </div>
                                                            </AccordionContent>
                                                        </AccordionItem>
                                                    </Accordion>
                                                </CardContent>
                                            </Card>
                                        </TabsContent>

                                        <TabsContent value="analysis">
                                            <div className="min-h-[600px]">
                                                {analyzedPages.length > 0 && (
                                                    <PageAnalysisView 
                                                        file={file} 
                                                        analyzedPages={analyzedPages}
                                                    />
                                                )}
                                            </div>
                                        </TabsContent>

                                        <TabsContent value="preview">
                                            <Card className="overflow-hidden">
                                                <CardContent className="p-0 h-[600px]">
                                                    {analyzedPages.length > 0 && (
                                                        <PDFPreview file={file} analyzedPages={analyzedPages} />
                                                    )}
                                                </CardContent>
                                            </Card>
                                        </TabsContent>
                                    </Tabs>
                                </div>
                            ) : null}
                        </div>
                    )}
                </main>

                <Footer />
            </div>
        </TooltipProvider>
    );
}

function StructureItem({ label, checked, optional }: { label: string; checked: boolean; optional?: boolean }) {
    return (
        <div className="flex items-center justify-between py-2 px-3 rounded-lg bg-muted/50">
            <span className="text-sm">
                {label}
                {optional && <span className="text-muted-foreground ml-1">(optional)</span>}
            </span>
            {checked ? (
                <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : (
                <XCircle className={`h-4 w-4 ${optional ? 'text-muted-foreground' : 'text-red-500'}`} />
            )}
        </div>
    );
}
