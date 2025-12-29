import { FileText, Github, Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '@/components/ThemeProvider';

export function Header() {
    const { theme, setTheme, resolvedTheme } = useTheme();

    const cycleTheme = () => {
        if (theme === 'light') setTheme('dark');
        else if (theme === 'dark') setTheme('system');
        else setTheme('light');
    };

    const getThemeIcon = () => {
        if (theme === 'system') return <Monitor className="h-4 w-4" />;
        if (resolvedTheme === 'dark') return <Moon className="h-4 w-4" />;
        return <Sun className="h-4 w-4" />;
    };

    return (
        <div className="navbar bg-base-100/95 backdrop-blur sticky top-0 z-50 border-b border-base-200">
            <div className="flex-1">
                <div className="flex items-center gap-3 px-2">
                    <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center text-primary-content">
                        <FileText className="h-6 w-6" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold tracking-tight">Internship Report Validator</h1>
                        <p className="text-xs text-base-content/70">B.S. Abdur Rahman Crescent Institute</p>
                    </div>
                </div>
            </div>

            <div className="flex-none gap-2">
                <button
                    className="btn btn-ghost btn-circle"
                    onClick={cycleTheme}
                    title={`Theme: ${theme.charAt(0).toUpperCase() + theme.slice(1)}`}
                >
                    {getThemeIcon()}
                </button>

                <a
                    href="https://github.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-ghost btn-circle"
                >
                    <Github className="h-5 w-5" />
                </a>
            </div>
        </div>
    );
}
