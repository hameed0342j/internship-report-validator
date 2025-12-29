export function Footer() {
    return (
        <footer className="footer footer-center p-10 bg-base-200 text-base-content rounded">
            <div className="grid grid-flow-col gap-4">
                <a className="link link-hover">About us</a>
                <a className="link link-hover">Contact</a>
                <a className="link link-hover">Jobs</a>
                <a className="link link-hover">Press kit</a>
            </div>
            <div>
                <div className="grid gap-8 md:grid-cols-3 text-left w-full max-w-4xl">
                    <div>
                        <h3 className="footer-title opacity-100 mb-3 text-base">Features</h3>
                        <ul className="space-y-2 text-sm text-base-content/70">
                            <li>PDF & DOCX Support</li>
                            <li>Structure Validation</li>
                            <li>Watermark Detection</li>
                            <li>RRN Verification</li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="footer-title opacity-100 mb-3 text-base">Validation Checks</h3>
                        <ul className="space-y-2 text-sm text-base-content/70">
                            <li>Cover Page</li>
                            <li>Certificates & Acknowledgment</li>
                            <li>Table of Contents</li>
                            <li>Chapter Sequence</li>
                        </ul>
                    </div>
                    <div>
                        <h3 className="footer-title opacity-100 mb-3 text-base">About</h3>
                        <p className="text-sm text-base-content/70">
                            Built for AI&DS students to validate internship reports
                            against institutional formatting requirements.
                        </p>
                    </div>
                </div>
            </div>
            <div className="divider"></div>
            <div>
                <p>© 2025 Internship Report Validator. All rights reserved.</p>
                <p className="text-sm">Made with ❤️ for AI&DS Students</p>
            </div>
        </footer>
    );
}
