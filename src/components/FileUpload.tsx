import { useCallback, useRef } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, FileText, FileSpreadsheet, FolderUp, CheckCircle2 } from 'lucide-react';

interface FileUploadProps {
    onFilesSelect: (files: File[]) => void;
    isProcessing: boolean;
}

export function FileUpload({ onFilesSelect, isProcessing }: FileUploadProps) {
    const folderInputRef = useRef<HTMLInputElement>(null);

    const onDrop = useCallback((acceptedFiles: File[]) => {
        if (acceptedFiles.length > 0) {
            onFilesSelect(acceptedFiles);
        }
    }, [onFilesSelect]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
        },
        disabled: isProcessing,
        multiple: true
    });

    const handleFolderUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || []);
        if (files.length > 0) {
            // Filter only PDF and DOCX
            const validFiles = files.filter(file =>
                file.name.toLowerCase().endsWith('.pdf') ||
                file.name.toLowerCase().endsWith('.docx')
            );
            if (validFiles.length > 0) {
                onFilesSelect(validFiles);
            } else {
                alert("No PDF or DOCX files found in the selected folder.");
            }
        }
    };

    return (
        <div className="card bg-base-100 shadow-xl w-full max-w-2xl mx-auto overflow-hidden">
            <div className="card-body p-0">
                <div
                    {...getRootProps()}
                    className={`
                        relative p-12 text-center cursor-pointer transition-all duration-300
                        border-2 border-dashed rounded-lg m-4
                        ${isDragActive
                            ? 'border-primary bg-primary/5 scale-[1.02]'
                            : 'border-base-300 hover:border-primary/50 hover:bg-base-200/50'
                        }
                        ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}
                    `}
                >
                    <input {...getInputProps()} />

                    <div className="relative z-10">
                        {isProcessing ? (
                            <div className="flex flex-col items-center gap-4">
                                <span className="loading loading-ring loading-lg text-primary"></span>
                                <div>
                                    <p className="text-lg font-medium">Analyzing Documents...</p>
                                    <p className="text-sm text-base-content/70 mt-1">
                                        Checking structure, watermarks, and formatting
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <>
                                <div className={`
                                    mx-auto w-16 h-16 rounded-full flex items-center justify-center mb-4
                                    transition-all duration-300
                                    ${isDragActive
                                        ? 'bg-primary text-primary-content scale-110'
                                        : 'bg-base-200 text-base-content/70'
                                    }
                                `}>
                                    <Upload className="h-8 w-8" />
                                </div>

                                <h3 className="text-xl font-semibold mb-2">
                                    {isDragActive ? 'Drop files or folders here!' : 'Upload Internship Reports'}
                                </h3>

                                <p className="text-base-content/70 mb-4">
                                    Drag and drop PDF/DOCX files, or click to browse
                                </p>

                                <div className="flex items-center justify-center gap-3 mb-6">
                                    <div className="badge badge-secondary badge-outline gap-1.5 p-3">
                                        <FileText className="h-3.5 w-3.5" />
                                        PDF
                                    </div>
                                    <div className="badge badge-secondary badge-outline gap-1.5 p-3">
                                        <FileSpreadsheet className="h-3.5 w-3.5" />
                                        DOCX
                                    </div>
                                    <div className="badge badge-outline gap-1.5 p-3">
                                        Batch Support
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </div>

                {!isProcessing && (
                    <div className="px-6 pb-6 text-center">
                        <div className="divider text-xs uppercase text-base-content/50 my-4">Or</div>

                        <input
                            type="file"
                            ref={folderInputRef}
                            onChange={handleFolderUpload}
                            className="hidden"
                            {...({ webkitdirectory: "", directory: "" } as any)}
                        />

                        <button
                            className="btn btn-outline w-full gap-2"
                            onClick={() => folderInputRef.current?.click()}
                        >
                            <FolderUp className="h-4 w-4" />
                            Upload Folder
                        </button>
                    </div>
                )}

                <div className="px-6 pb-6 bg-base-200/50 pt-4 border-t border-base-200">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                        {[
                            'Structure Validation',
                            'Watermark Detection',
                            'RRN Verification',
                            'Page Count Check'
                        ].map((feature) => (
                            <div key={feature} className="flex items-center gap-1.5 text-base-content/70 justify-center md:justify-start">
                                <CheckCircle2 className="h-3.5 w-3.5 text-success" />
                                {feature}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
