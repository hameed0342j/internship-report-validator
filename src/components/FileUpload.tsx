import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, FileSpreadsheet, CheckCircle2, CloudUpload, Sparkles } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface FileUploadProps {
    onFileSelect: (file: File) => void;
    isProcessing: boolean;
}

export function FileUpload({ onFileSelect, isProcessing }: FileUploadProps) {
    const [uploadProgress, setUploadProgress] = useState(0);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            // Simulate upload progress
            setUploadProgress(0);
            const interval = setInterval(() => {
                setUploadProgress(prev => {
                    if (prev >= 100) {
                        clearInterval(interval);
                        return 100;
                    }
                    return prev + 20;
                });
            }, 100);
            
            setTimeout(() => {
                onFileSelect(acceptedFiles[0]);
            }, 500);
        }
    }, [onFileSelect]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
        },
        disabled: isProcessing,
        multiple: false,
        maxSize: 20 * 1024 * 1024 // 20MB
    });

    return (
        <Card className="w-full max-w-2xl mx-auto overflow-hidden shadow-xl border-2 hover:border-primary/50 transition-colors">
            <CardContent className="p-0">
                <div
                    {...getRootProps()}
                    className={`
                        relative p-10 md:p-16 text-center cursor-pointer transition-all duration-500
                        ${isDragActive 
                            ? 'bg-primary/5 scale-[1.02]' 
                            : 'bg-gradient-to-b from-muted/30 to-transparent hover:from-muted/50'
                        }
                        ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                >
                    <input {...getInputProps()} />
                    
                    {/* Background decoration */}
                    <div className="absolute inset-0 overflow-hidden pointer-events-none">
                        <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full bg-primary/5 blur-3xl transition-opacity duration-500 ${isDragActive ? 'opacity-100' : 'opacity-0'}`} />
                        <div className={`absolute -bottom-24 -left-24 w-48 h-48 rounded-full bg-blue-500/5 blur-3xl transition-opacity duration-500 ${isDragActive ? 'opacity-100' : 'opacity-0'}`} />
                    </div>
                    
                    <div className="relative z-10">
                        {isProcessing ? (
                            <div className="flex flex-col items-center gap-6">
                                <div className="relative">
                                    <div className="w-20 h-20 rounded-full border-4 border-muted" />
                                    <div className="absolute inset-0 w-20 h-20 rounded-full border-4 border-t-primary border-r-primary/50 animate-spin" />
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <Sparkles className="h-8 w-8 text-primary animate-pulse" />
                                    </div>
                                </div>
                                <div>
                                    <p className="text-lg font-semibold">Processing Document...</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Analyzing structure, watermarks, and formatting
                                    </p>
                                </div>
                                <Progress value={uploadProgress} className="w-48 h-2" />
                            </div>
                        ) : (
                            <>
                                <div className={`
                                    mx-auto w-20 h-20 rounded-2xl flex items-center justify-center mb-6
                                    transition-all duration-500 shadow-lg
                                    ${isDragActive 
                                        ? 'bg-primary text-primary-foreground scale-110 rotate-3' 
                                        : 'bg-gradient-to-br from-primary/80 to-primary text-primary-foreground'
                                    }
                                `}>
                                    {isDragActive ? (
                                        <CloudUpload className="h-10 w-10 animate-bounce" />
                                    ) : (
                                        <Upload className="h-10 w-10" />
                                    )}
                                </div>
                                
                                <h3 className="text-2xl font-bold mb-3">
                                    {isDragActive ? 'Drop it here!' : 'Upload Your Report'}
                                </h3>
                                
                                <p className="text-muted-foreground mb-6 max-w-sm mx-auto">
                                    {isDragActive 
                                        ? 'Release to start validation' 
                                        : 'Drag and drop your internship report, or click to browse your files'
                                    }
                                </p>
                                
                                <div className="flex items-center justify-center gap-3 flex-wrap">
                                    <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
                                        <FileText className="h-4 w-4 text-red-500" />
                                        PDF
                                    </Badge>
                                    <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
                                        <FileSpreadsheet className="h-4 w-4 text-blue-500" />
                                        DOCX
                                    </Badge>
                                    <Badge variant="outline" className="gap-1.5 px-3 py-1.5">
                                        Max 20MB
                                    </Badge>
                                </div>
                            </>
                        )}
                    </div>
                </div>
                
                {/* Quick features strip */}
                <div className="px-6 py-4 bg-muted/30 border-t">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span className="text-xs text-muted-foreground">Structure</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span className="text-xs text-muted-foreground">Watermark</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span className="text-xs text-muted-foreground">RRN Check</span>
                        </div>
                        <div className="flex flex-col items-center gap-1">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span className="text-xs text-muted-foreground">Chapters</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
