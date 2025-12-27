import { Separator } from '@/components/ui/separator';

export function Footer() {
    return (
        <footer className="border-t bg-muted/50">
            <div className="container mx-auto max-w-7xl px-4 py-8 md:px-6">
                <div className="grid gap-8 md:grid-cols-3">
                    <div>
                        <h3 className="font-semibold mb-3">Features</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li>PDF & DOCX Support</li>
                            <li>Structure Validation</li>
                            <li>Watermark Detection</li>
                            <li>RRN Verification</li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-semibold mb-3">Validation Checks</h3>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                            <li>Cover Page</li>
                            <li>Certificates & Acknowledgment</li>
                            <li>Table of Contents</li>
                            <li>Chapter Sequence</li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="font-semibold mb-3">About</h3>
                        <p className="text-sm text-muted-foreground">
                            Built for AI&DS students to validate internship reports 
                            against institutional formatting requirements.
                        </p>
                    </div>
                </div>
                <Separator className="my-6" />
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-muted-foreground">
                    <p>© 2025 Internship Report Validator. All rights reserved.</p>
                    <p>Made with ❤️ for AI&DS Students</p>
                </div>
            </div>
        </footer>
    );
}
