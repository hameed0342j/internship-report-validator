import type { ValidationResult } from '../types';
import {
    AlertCircle, CheckCircle, AlertTriangle, Droplets,
    BookOpen, FileCheck, CircleCheck, CircleX, Info, Fingerprint, XCircle
} from 'lucide-react';

interface ResultsViewProps {
    result: ValidationResult;
    onClose?: () => void;
}

export function ResultsView({ result }: ResultsViewProps) {
    const getScoreGradient = (score: number) => {
        if (score >= 90) return 'from-success to-emerald-600';
        if (score >= 70) return 'from-warning to-orange-500';
        return 'from-error to-rose-600';
    };

    const getScoreLabel = (score: number) => {
        if (score >= 90) return 'Excellent';
        if (score >= 70) return 'Good';
        if (score >= 50) return 'Needs Work';
        return 'Poor';
    };

    const structureLabels: Record<string, string> = {
        hasCover: 'Cover Page',
        hasBonafide: 'Bonafide Certificate',
        hasCertificate: 'Internship Certificate',
        hasVivaVoce: 'Viva-Voce Record',
        hasAcknowledgment: 'Acknowledgment',
        hasTableOfContents: 'Table of Contents',
        hasAbbreviations: 'Abbreviations',
        hasListOfFigures: 'List of Figures',
        hasAbstract: 'Abstract',
        hasIntroduction: 'Introduction',
        hasConclusion: 'Conclusion',
        hasReferences: 'References'
    };

    const passedChecks = Object.values(result.structure).filter(Boolean).length;
    const totalChecks = Object.keys(result.structure).length;
    const structureScore = Math.round((passedChecks / totalChecks) * 100);

    return (
        <div className="w-full space-y-6">
            {/* Score Card */}
            <div className="card bg-base-100 shadow-xl overflow-hidden">
                <div className={`bg-gradient-to-r ${getScoreGradient(result.score)} p-8 text-white`}>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-white/80 text-sm font-medium mb-1">Validation Score</p>
                            <div className="flex items-baseline gap-3">
                                <span className="text-6xl font-bold">{result.score}</span>
                                <span className="text-2xl text-white/70">/100</span>
                            </div>
                            <p className="mt-2 text-lg font-medium text-white/90">
                                {getScoreLabel(result.score)}
                            </p>
                        </div>
                        <div className="text-right">
                            <FileCheck className="h-16 w-16 text-white/30" />
                            {result.fileName && (
                                <p className="text-sm text-white/70 mt-2 max-w-[200px] truncate">
                                    {result.fileName}
                                </p>
                            )}
                            <p className="text-xs text-white/60">{result.pageCount} pages</p>
                        </div>
                    </div>
                </div>

                <div className="card-body p-4">
                    <div className="grid grid-cols-4 gap-4 text-center">
                        <div className="space-y-1">
                            <div className="text-2xl font-bold text-success">{passedChecks}</div>
                            <div className="text-xs text-base-content/70">Passed</div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-2xl font-bold text-error">{totalChecks - passedChecks}</div>
                            <div className="text-xs text-base-content/70">Failed</div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-2xl font-bold text-warning">{result.warnings.length}</div>
                            <div className="text-xs text-base-content/70">Warnings</div>
                        </div>
                        <div className="space-y-1">
                            <div className="text-2xl font-bold text-error">{result.errors.length}</div>
                            <div className="text-xs text-base-content/70">Errors</div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Detailed Results Tabs */}
            <div role="tablist" className="tabs tabs-lifted tabs-lg">
                <input type="radio" name="results_tabs" role="tab" className="tab min-w-[120px]" aria-label="Structure" defaultChecked />
                <div role="tabpanel" className="tab-content bg-base-100 border-base-300 rounded-box p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="tex-lg font-bold flex items-center gap-2">
                            <BookOpen className="h-5 w-5" />
                            Document Structure
                        </h3>
                        <div className={`badge ${structureScore >= 80 ? 'badge-success' : structureScore >= 60 ? 'badge-warning' : 'badge-error'} gap-2`}>
                            {structureScore}% Complete
                        </div>
                    </div>
                    <progress className="progress progress-primary w-full mb-6" value={structureScore} max="100"></progress>

                    <div className="h-[300px] overflow-y-auto pr-2 grid gap-2">
                        {Object.entries(result.structure).map(([key, valid]) => (
                            <div
                                key={key}
                                className={`
                                    flex items-center justify-between p-3 rounded-lg border
                                    ${valid
                                        ? 'bg-success/10 border-success/20'
                                        : 'bg-error/10 border-error/20'
                                    }
                                `}
                            >
                                <div className="flex items-center gap-3">
                                    {valid ? (
                                        <CircleCheck className="h-5 w-5 text-success" />
                                    ) : (
                                        <CircleX className="h-5 w-5 text-error" />
                                    )}
                                    <span className="font-medium">
                                        {structureLabels[key] || key.replace('has', '').replace(/([A-Z])/g, ' $1').trim()}
                                    </span>
                                </div>
                                <div className={`badge ${valid ? 'badge-success badge-outline' : 'badge-error badge-outline'}`}>
                                    {valid ? 'Found' : 'Missing'}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <input type="radio" name="results_tabs" role="tab" className="tab min-w-[120px]" aria-label="Watermark" />
                <div role="tabpanel" className="tab-content bg-base-100 border-base-300 rounded-box p-6">
                    <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
                        <Droplets className="h-5 w-5" />
                        Watermark & RRN Detection
                    </h3>
                    {result.watermark ? (
                        <div className="space-y-4">
                            <div className={`
                                p-4 rounded-lg flex items-center gap-4
                                ${result.watermark.hasWatermark
                                    ? 'bg-success/10 border border-success/20'
                                    : 'bg-warning/10 border border-warning/20'
                                }
                            `}>
                                {result.watermark.hasWatermark ? (
                                    <CheckCircle className="h-8 w-8 text-success" />
                                ) : (
                                    <AlertTriangle className="h-8 w-8 text-warning" />
                                )}
                                <div>
                                    <p className="font-semibold">
                                        {result.watermark.hasWatermark ? 'Watermark Detected' : 'No Watermark Found'}
                                    </p>
                                    <p className="text-sm text-base-content/70">
                                        {result.watermark.hasWatermark
                                            ? `Found on ${result.watermark.watermarkPages.length} page(s)`
                                            : 'Document may not have proper authentication'
                                        }
                                    </p>
                                </div>
                                {result.watermark.hasWatermark && (
                                    <div className="badge ml-auto">
                                        {result.watermark.confidence} Confidence
                                    </div>
                                )}
                            </div>

                            {result.watermark.rrnValidation && (
                                <div className={`
                                    p-4 rounded-lg border
                                    ${result.watermark.rrnValidation.isValid
                                        ? 'bg-info/10 border-info/20'
                                        : 'bg-error/10 border-error/20'
                                    }
                                `}>
                                    <div className="flex items-center gap-3 mb-2">
                                        <Fingerprint className={`h-5 w-5 ${result.watermark.rrnValidation.isValid ? 'text-info' : 'text-error'}`} />
                                        <span className="font-semibold">RRN Validation</span>
                                        <div className={`badge ${result.watermark.rrnValidation.isValid ? 'badge-info' : 'badge-ghost'}`}>
                                            {result.watermark.rrnValidation.isValid ? 'Valid' : 'Invalid'}
                                        </div>
                                    </div>
                                    <p className="text-sm text-base-content/70 ml-8">
                                        {result.watermark.rrnValidation.message}
                                    </p>
                                    {result.watermark.rrnValidation.detectedRRN && (
                                        <p className="text-sm font-mono mt-2 ml-8 p-2 bg-base-200 rounded">
                                            Detected: <span className="text-primary font-bold">{result.watermark.rrnValidation.detectedRRN}</span>
                                        </p>
                                    )}
                                </div>
                            )}

                            {result.watermark.watermarkText && (
                                <>
                                    <div className="divider"></div>
                                    <div className="flex items-center justify-between p-3 bg-base-200 rounded-lg">
                                        <span className="text-sm">Watermark Text</span>
                                        <code className="text-xs bg-base-100 px-2 py-1 rounded border">
                                            {result.watermark.watermarkText}
                                        </code>
                                    </div>
                                </>
                            )}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-base-content/50">
                            <Droplets className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p>Watermark analysis not available</p>
                        </div>
                    )}
                </div>

                <input type="radio" name="results_tabs" role="tab" className="tab min-w-[120px]" aria-label={`Issues ${result.errors.length + result.warnings.length > 0 ? `(${result.errors.length + result.warnings.length})` : ''}`} />
                <div role="tabpanel" className="tab-content bg-base-100 border-base-300 rounded-box p-6 space-y-6">
                    <div>
                        <h3 className="text-lg font-bold flex items-center gap-2 text-error mb-4">
                            <AlertCircle className="h-5 w-5" />
                            Critical Issues
                            {result.errors.length > 0 && (
                                <div className="badge badge-error text-white">{result.errors.length}</div>
                            )}
                        </h3>
                        {result.errors.length > 0 ? (
                            <div className="h-[150px] overflow-y-auto pr-2 space-y-2">
                                {result.errors.map((error, idx) => (
                                    <div role="alert" key={idx} className="alert alert-error">
                                        <XCircle className="h-6 w-6" />
                                        <span>{error}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6 text-base-content/50">
                                <CheckCircle className="h-10 w-10 mx-auto mb-2 text-success" />
                                <p>No critical issues found!</p>
                            </div>
                        )}
                    </div>

                    <div>
                        <h3 className="text-lg font-bold flex items-center gap-2 text-warning mb-4">
                            <AlertTriangle className="h-5 w-5" />
                            Warnings
                            {result.warnings.length > 0 && (
                                <div className="badge badge-warning">{result.warnings.length}</div>
                            )}
                        </h3>
                        {result.warnings.length > 0 ? (
                            <div className="h-[150px] overflow-y-auto pr-2 space-y-2">
                                {result.warnings.map((warning, idx) => (
                                    <div key={idx} className="flex items-start gap-3 p-3 bg-warning/10 rounded-lg border border-warning/20">
                                        <Info className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                                        <span className="text-sm">{warning}</span>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-6 text-base-content/50">
                                <CheckCircle className="h-10 w-10 mx-auto mb-2 text-success" />
                                <p>No warnings!</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
