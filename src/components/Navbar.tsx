import { useState, useEffect } from 'react';
import { ArrowUp, Menu, Moon, Sun, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const navLinks = [
  { href: '#hero', label: 'Home' },
  { href: '#about', label: 'About' },
  { href: '#skills', label: 'Skills' },
  { href: '#projects', label: 'Projects' },
  { href: '#experience', label: 'Experience' },
  { href: '#resume', label: 'Resume' },
  { href: '#education', label: 'Education' },
  { href: '#contact', label: 'Contact' },
];

export const Navbar = () => {
  const [activeSection, setActiveSection] = useState('#hero');
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const storedTheme = localStorage.getItem('portfolio-theme');
    const initialTheme = storedTheme === 'light' || storedTheme === 'dark' ? storedTheme : 'dark';
    setTheme(initialTheme);
    document.documentElement.classList.toggle('dark', initialTheme === 'dark');
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);

      // Determine active section based on scroll position
      const sections = navLinks.map(link => document.querySelector(link.href));
      const currentSection = sections.find(section => {
        if (!section) return false;
        const rect = section.getBoundingClientRect();
        return rect.top <= 100 && rect.bottom >= 100;
      });

      if (currentSection) {
        setActiveSection(`#${currentSection.id}`);
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Call once on mount
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (href: string) => {
    const section = document.querySelector(href);
    section?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    localStorage.setItem('portfolio-theme', nextTheme);
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
  };

  const themeLabel = `Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`;

  return (
    <nav className={cn(
      "fixed left-0 right-0 top-0 z-50 transition-all duration-300",
      isScrolled ? "py-3" : "py-4"
    )}>
      <div className="section-container">
        <div className={cn(
          "flex w-full items-center justify-between gap-3 transition-all duration-300",
          isScrolled && "rounded-full border border-border/50 bg-background/72 px-4 py-2 shadow-2xl shadow-primary/10 backdrop-blur-xl"
        )}>
          <div className="font-display text-xl font-bold gradient-text shrink-0">
            Varan
          </div>

          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <div className="mobile-nav-actions flex items-center gap-2 lg:hidden">
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 shrink-0 rounded-full border border-primary/50 bg-primary text-primary-foreground shadow-lg shadow-primary/20 backdrop-blur-md hover:border-primary hover:bg-primary/90 hover:text-primary-foreground"
                onClick={toggleTheme}
                aria-label={themeLabel}
                title={themeLabel}
              >
                {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-10 w-10 shrink-0 rounded-full border border-border/60 bg-background/85 text-foreground shadow-lg shadow-primary/10 backdrop-blur-md hover:border-primary/40 hover:text-primary"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle navigation"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </Button>
            </div>

            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center space-x-2">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => scrollToSection(link.href)}
                  className={cn(
                    "px-3 py-2 text-xs xl:text-sm font-medium rounded-full transition-all duration-300 hover:bg-secondary/80 hover:text-primary",
                    activeSection === link.href
                      ? "bg-primary/10 text-primary shadow-sm"
                      : "text-muted-foreground"
                  )}
                >
                  {link.label}
                </button>
              ))}
            </div>

            <Button
              variant="ghost"
              size="icon"
              className="hidden h-10 w-10 shrink-0 rounded-full border border-border/50 bg-background/60 backdrop-blur-md hover:border-primary/40 hover:text-primary lg:inline-flex"
              onClick={toggleTheme}
              aria-label={themeLabel}
              title={themeLabel}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </Button>
          </div>
        </div>

        {isScrolled && (
          <Button
            variant="ghost"
            size="icon"
            className="floating-glass-control fixed bottom-20 right-5 z-50 hidden h-11 w-11 sm:inline-flex"
            onClick={() => scrollToSection('#hero')}
            aria-label="Back to top"
            title="Back to top"
          >
            <ArrowUp size={18} />
          </Button>
        )}

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="lg:hidden mt-4 glass-card rounded-2xl p-4 animate-scale-in">
            <div className="flex flex-col space-y-2">
              {navLinks.map((link) => (
                <button
                  key={link.href}
                  onClick={() => scrollToSection(link.href)}
                  className={cn(
                    "text-left px-4 py-3 rounded-xl transition-all duration-300",
                    activeSection === link.href
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:bg-secondary/50"
                  )}
                >
                  {link.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};
