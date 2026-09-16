import { motion } from 'framer-motion';
import { TypeWriter } from './TypeWriter';
import { Button } from './ui/button';
import { ArrowDown, BrainCircuit, FileText, Github, Linkedin, Mail, MapPin, ServerCog, Sparkles } from 'lucide-react';
import profileImage from '@/assets/profile-taran.webp';
import { publicAsset } from '@/lib/assets';
import { trackResumeAction } from '@/lib/analytics';

export const Hero = () => {
  return (
    <section id="hero" className="min-h-screen flex items-center justify-center relative overflow-hidden pt-20">
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-grid-pattern opacity-20" />
        <div className="absolute top-[16%] right-[12%] h-28 w-28 rounded-full border border-primary/20 animate-slow-spin" />
        <div className="absolute bottom-[16%] left-[8%] h-20 w-20 rounded-full border border-accent/20 animate-drift" />
      </div>

      <div className="section-container">
        <div className="grid lg:grid-cols-[1.08fr_0.92fr] gap-12 items-center">
          <div className="mx-auto max-w-[19rem] text-center sm:max-w-[34rem] lg:mx-0 lg:max-w-none lg:text-left">
            <div className="inline-block max-w-full px-4 py-2 rounded-full bg-secondary/50 border border-border/50 mb-4">
              <span className="inline-flex flex-wrap items-center justify-center gap-2 text-center text-sm text-muted-foreground">
                <Sparkles size={15} className="text-primary shrink-0" />
                Data Analyst | Software Engineer
              </span>
            </div>

            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-emerald-400/30 bg-emerald-500/10 px-4 py-2 text-sm font-medium text-emerald-300">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
              </span>
              Open to full-time opportunities
            </div>

            <h1 className="font-display text-3xl sm:text-5xl lg:text-6xl font-bold mb-4 leading-tight text-balance">
              <span className="wave-hand" aria-hidden="true">{'\u{1F44B}'}</span> Hello, I'm <br className="sm:hidden" />
              <span className="gradient-text">Varan Mamidala</span>
            </h1>

            <div className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-6 max-w-full lg:max-w-2xl">
              <TypeWriter
                words={[
                  'Data Analyst',
                  'Software Engineer',
                  'Python & SQL Developer',
                  'Power BI Specialist',
                  'Full Stack Web Developer',
                ]}
              />
            </div>

            <p className="mx-auto max-w-[18.5rem] text-base sm:max-w-full sm:text-lg text-muted-foreground mb-8 lg:mx-0 lg:max-w-xl">
              Computer Science graduate specializing in data analysis, visualization, Python automation, SQL querying,
              Power BI dashboards, and full-stack web applications to transform complex data into practical business insights.
            </p>

            <div className="mx-auto flex max-w-[18.5rem] flex-wrap justify-center gap-3 mb-6 sm:max-w-[20rem] lg:mx-0 lg:max-w-none lg:justify-start">
              {['Data Analytics', 'SQL & Power BI', 'Python Automation', 'Full Stack Web Dev', 'AI & NLP'].map((item) => (
                <span key={item} className="tech-chip text-xs sm:text-sm">
                  <Sparkles size={13} />
                  {item}
                </span>
              ))}
            </div>

            <div className="mx-auto flex max-w-[18.5rem] flex-wrap justify-center gap-4 mb-8 text-xs sm:max-w-[20rem] sm:text-sm text-muted-foreground lg:mx-0 lg:max-w-none lg:justify-start">
              <div className="flex items-center gap-2">
                <MapPin size={16} className="text-primary" />
                <span>Hyderabad, Telangana, India</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-primary" />
                <span>varan4636@gmail.com</span>
              </div>
            </div>

            <div className="mx-auto flex max-w-[22rem] flex-col gap-4 justify-center sm:max-w-none sm:flex-row lg:mx-0 lg:justify-start">
              <Button asChild size="lg" className="btn-primary group">
                <a href="#projects">
                  View My Work
                  <ArrowDown className="ml-2 group-hover:translate-y-1 transition-transform" size={18} />
                </a>
              </Button>

              <Button asChild variant="outline" size="lg" className="btn-secondary">
                <a
                  href="#resume"
                  onClick={() => trackResumeAction('resume_view', 'hero')}
                >
                  Resume
                  <FileText className="ml-2" size={18} />
                </a>
              </Button>
            </div>

            <div className="flex justify-center lg:justify-start gap-4 mt-8">
              <a href="https://github.com/varan0209" target="_blank" rel="noopener noreferrer" aria-label="GitHub profile" className="social-icon h-12 w-12">
                <Github size={20} />
              </a>
              <a href="https://www.linkedin.com/in/varan-mamidala-2b950b261/" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn profile" className="social-icon h-12 w-12">
                <Linkedin size={20} />
              </a>
              <a href="mailto:varan4636@gmail.com" aria-label="Email Varan" className="social-icon h-12 w-12">
                <Mail size={20} />
              </a>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.86 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="relative flex justify-center"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/25 to-accent/20 rounded-[2rem] blur-2xl scale-105 animate-pulse" />
              <div className="absolute inset-[-14px] rounded-[2.25rem] border border-primary/20 animate-slow-spin" />
              <div className="absolute inset-[-28px] rounded-[2.75rem] border border-accent/15 animate-drift" />

              <div className="profile-frame relative w-[15.5rem] h-[20rem] sm:w-[22rem] sm:h-[28rem] rounded-[2rem] overflow-hidden border border-primary/30 shadow-2xl">
                <img src={profileImage} alt="Varan Mamidala" className="w-full h-full object-cover object-[50%_24%]" />
              </div>

              <div className="absolute -top-4 -right-4 w-16 h-16 bg-primary/10 rounded-2xl border border-primary/20 backdrop-blur-sm flex items-center justify-center">
                <ServerCog size={26} className="text-primary" />
              </div>
              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-accent/10 rounded-2xl border border-accent/20 backdrop-blur-sm flex items-center justify-center">
                <BrainCircuit size={26} className="text-accent" />
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      <a href="#about" aria-label="Scroll to about section" className="scroll-cue hidden sm:flex">
        <span />
      </a>
    </section>
  );
};

