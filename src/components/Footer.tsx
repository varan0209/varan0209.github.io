import { Github, Linkedin, Mail } from 'lucide-react';

const socialLinks = [
  { icon: Linkedin, href: 'https://www.linkedin.com/in/varan-mamidala-2b950b261/', label: 'LinkedIn' },
  { icon: Github, href: 'https://github.com/varan0209', label: 'GitHub' },
  { icon: Mail, href: 'mailto:varan4636@gmail.com', label: 'Email' },
];

export const Footer = () => {
  return (
    <footer className="py-12 border-t border-border/50 bg-secondary/20">
      <div className="section-container">
        <div className="flex flex-col items-center">
          {/* Logo */}
          <a href="#" className="font-display text-2xl font-bold mb-6">
            <span className="gradient-text">Varan</span>
            <span className="text-foreground"> Mamidala</span>
          </a>

          {/* Social Links */}
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            {socialLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="social-icon"
                title={link.label}
              >
                <link.icon size={18} />
              </a>
            ))}
          </div>

          {/* Navigation */}
          <nav className="flex flex-wrap justify-center gap-6 mb-8 text-sm">
            <a href="#about" className="text-muted-foreground hover:text-primary transition-colors">About</a>
            <a href="#skills" className="text-muted-foreground hover:text-primary transition-colors">Skills</a>
            <a href="#projects" className="text-muted-foreground hover:text-primary transition-colors">Projects</a>
            <a href="#experience" className="text-muted-foreground hover:text-primary transition-colors">Experience</a>
            <a href="#education" className="text-muted-foreground hover:text-primary transition-colors">Education</a>
            <a href="#contact" className="text-muted-foreground hover:text-primary transition-colors">Contact</a>
          </nav>

          {/* Copyright */}
          <div className="text-center text-sm text-muted-foreground">
            <p>Copyright {new Date().getFullYear()} Varan Mamidala. All rights reserved.</p>
            <p className="mt-1">Data Analyst | Software Engineer | Python & SQL Developer</p>
            <p className="mt-3 text-xs">Limited analytics measure page and resume interactions.</p>
          </div>
        </div>
      </div>
    </footer>
  );
};
