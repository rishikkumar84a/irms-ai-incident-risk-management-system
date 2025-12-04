import Link from 'next/link';
import { Github, Linkedin } from 'lucide-react';

export function Footer() {
    return (
        <footer className="border-t bg-card py-6 px-6">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground">
                    © {new Date().getFullYear()} AI-Powered Incident & Risk Management System. All rights reserved.
                </p>
                <div className="flex items-center gap-4">
                    <span className="text-sm font-medium">Rishik Kumar Chaurasiya</span>
                    <div className="flex items-center gap-2">
                        <Link
                            href="https://github.com/rishikkumar84a"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <Github className="size-5" />
                            <span className="sr-only">GitHub</span>
                        </Link>
                        <Link
                            href="https://linkedin.com/in/rishikkumar84a"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-muted-foreground hover:text-foreground transition-colors"
                        >
                            <Linkedin className="size-5" />
                            <span className="sr-only">LinkedIn</span>
                        </Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
