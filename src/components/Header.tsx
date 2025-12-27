import { FileText, Github, Moon, Sun, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-16 items-center justify-between px-4 md:px-6 mx-auto max-w-7xl">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
                        <FileText className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <div>
                        <h1 className="text-lg font-bold tracking-tight">Internship Report Validator</h1>
                        <p className="text-xs text-muted-foreground">B.S. Abdur Rahman Crescent Institute</p>
                    </div>
                </div>
                
                <div className="flex items-center gap-2">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={cycleTheme}
                        title={`Theme: ${theme.charAt(0).toUpperCase() + theme.slice(1)}`}
                    >
                        {getThemeIcon()}
                        <span className="sr-only">Toggle theme</span>
                    </Button>
                    <Button variant="ghost" size="icon" asChild>
                        <a href="https://github.com" target="_blank" rel="noopener noreferrer">
                            <Github className="h-4 w-4" />
                            <span className="sr-only">GitHub</span>
                        </a>
                    </Button>
                </div>
            </div>
        </header>
    );
}
