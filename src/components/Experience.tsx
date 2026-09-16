import { motion, useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import { Calendar, ChevronDown, MapPin } from 'lucide-react';
import type { IconType } from 'react-icons';
import { publicAsset } from '@/lib/assets';
import {
  SiDocker,
  SiFlask,
  SiGithubactions,
  SiGit,
  SiJavascript,
  SiJenkins,
  SiMongodb,
  SiMysql,
  SiNumpy,
  SiPandas,
  SiPostgresql,
  SiPython,
  SiReact,
  SiSpringboot,
  SiStreamlit,
  SiTypescript,
} from 'react-icons/si';
import { FaJava } from 'react-icons/fa';

type Tech = {
  name: string;
  icon: IconType;
  color: string;
};

type ExperienceItem = {
  title: string;
  company: string;
  logo?: string;
  mark?: string;
  tag: string;
  location: string;
  period: string;
  description: string;
  keyWork: string[];
  details: string[];
  technologies: Tech[];
};

const experiences: ExperienceItem[] = [
  {
    title: 'Python Programming Intern',
    company: 'CodeAlpha',
    mark: 'CA',
    tag: 'Internship',
    location: 'Remote',
    period: 'Nov 2025 – Dec 2025',
    description:
      'Identified repetitive data-handling inefficiencies and developed Python automation scripts, a Stock Portfolio Tracker, and conversational/game logic.',
    keyWork: [
      'Developed Python automation scripts to streamline routine data handling processes and reduce manual effort.',
      'Built a Stock Portfolio Tracker to analyze investment data and calculate profit/loss for data-driven decisions.',
    ],
    details: [
      'Identified inefficiencies in repetitive data-handling processes and wrote Python automation scripts to resolve them.',
      'Designed and deployed a Stock Portfolio Tracker to analyze investment portfolios and track financial metrics.',
      'Collaborated with mentors and peers to design and test a rule-based chatbot and interactive game, strengthening analytical skills.',
    ],
    technologies: [
      { name: 'Python', icon: SiPython, color: '#3776AB' },
      { name: 'Pandas', icon: SiPandas, color: '#150458' },
      { name: 'Git', icon: SiGit, color: '#F05032' },
    ],
  },
  {
    title: 'Web Development Intern',
    company: 'ColourMoon Technologies',
    mark: 'CMT',
    tag: 'Internship',
    location: 'Visakhapatnam, India',
    period: 'May 2024 – Jun 2024',
    description:
      'Built and delivered responsive front-end interfaces and application features across school management, e-commerce, and food delivery systems.',
    keyWork: [
      'Built responsive front-end applications for school management, e-commerce, and food delivery platforms.',
      'Implemented authentication, shopping cart, order tracking, and API integration features.',
    ],
    details: [
      'Delivered responsive user interfaces for three separate client projects as part of an agile development team.',
      'Implemented key application workflows including user authentication, shopping carts, live order tracking, and REST API integration.',
      'Optimized front-end layout responsiveness and cross-browser performance.',
    ],
    technologies: [
      { name: 'JavaScript', icon: SiJavascript, color: '#F7DF1E' },
      { name: 'HTML/CSS', icon: SiJavascript, color: '#E34F26' },
      { name: 'Git', icon: SiGit, color: '#F05032' },
    ],
  },
  {
    title: 'Web Development Intern',
    company: 'Prodigy Infotech (MSME)',
    mark: 'PI',
    tag: 'Internship',
    location: 'Remote',
    period: 'Feb 2024 – Mar 2024',
    description:
      'Collaborated with the development team to deliver a responsive full-stack web application with PHP backend logic and MySQL database.',
    keyWork: [
      'Integrated responsive front-end interfaces with PHP back-end logic and MySQL databases.',
      'Contributed across requirements analysis, design, development, and deployment.',
    ],
    details: [
      'Collaborated across the full software development lifecycle—requirement analysis, design, implementation, and deployment.',
      'Integrated user-facing front-end components with PHP backend REST scripts and relational MySQL database schemas.',
      'Gained valuable hands-on experience in full-stack web delivery and database transaction management.',
    ],
    technologies: [
      { name: 'PHP', icon: SiJavascript, color: '#777BB4' },
      { name: 'MySQL', icon: SiMysql, color: '#4479A1' },
      { name: 'JavaScript', icon: SiJavascript, color: '#F7DF1E' },
    ],
  },
];

export const Experience = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [openItems, setOpenItems] = useState<Set<string>>(new Set());

  const toggleItem = (company: string) => {
    setOpenItems((current) => {
      const next = new Set(current);
      if (next.has(company)) {
        next.delete(company);
      } else {
        next.add(company);
      }
      return next;
    });
  };

  return (
    <section id="experience" className="py-24 relative bg-secondary/20" ref={ref}>
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="max-w-3xl mx-auto text-center mb-16"
        >
          <div className="inline-block glass-card px-4 py-2 mb-4">
            <span className="text-sm text-primary font-medium">Experience</span>
          </div>
          <h2 className="font-display text-4xl sm:text-5xl font-bold mb-6">
            Professional <span className="gradient-text">Experience</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Software engineering, data, research, and technical training experience across industry, nonprofit, university, and government research environments.
          </p>
        </motion.div>

        <div className="experience-timeline max-w-5xl mx-auto">
          {experiences.map((experience, index) => {
            const isOpen = openItems.has(experience.company);

            return (
              <motion.article
                key={experience.company}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.7, delay: 0.12 * index }}
                className="experience-timeline__item glass-card p-6 sm:p-7"
              >
                <span className="experience-timeline__dot" aria-hidden="true" />
                <div className="grid gap-5 lg:grid-cols-[auto_1fr_auto] lg:items-start">
                  <div className="experience-logo-frame flex h-32 w-32 items-center justify-center overflow-hidden rounded-2xl border border-border/50 bg-background/70 p-3">
                    {experience.logo ? (
                      <img src={publicAsset(experience.logo)} alt={`${experience.company} logo`} className="h-full w-full object-contain" />
                    ) : (
                      <span className="font-display text-3xl font-bold text-primary">{experience.mark || experience.company.slice(0, 2)}</span>
                    )}
                  </div>

                  <div>
                    <div className="mb-3 flex flex-wrap items-center gap-3">
                      <span className="rounded-full border border-primary/25 bg-primary/10 px-3 py-1 text-xs font-medium text-primary">
                        {experience.tag}
                      </span>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar size={15} />
                        <span>{experience.period}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin size={15} />
                        <span>{experience.location}</span>
                      </div>
                    </div>

                    <h3 className="font-display text-2xl font-bold">{experience.title}</h3>
                    <h4 className="mt-1 text-lg font-semibold text-primary">{experience.company}</h4>
                    <p className="mt-4 leading-relaxed text-muted-foreground">{experience.description}</p>

                    <div className="mt-5">
                      <h5 className="mb-3 text-sm font-semibold uppercase tracking-wide text-foreground">Key Work</h5>
                      <ul className="grid gap-2 md:grid-cols-2">
                        {experience.keyWork.map((item) => (
                          <li key={item} className="flex gap-3 text-sm text-muted-foreground">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => toggleItem(experience.company)}
                    className="flex h-11 w-11 items-center justify-center rounded-full border border-border/60 bg-background/60 text-primary transition-colors hover:border-primary/50"
                    aria-expanded={isOpen}
                    aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${experience.company} details`}
                  >
                    <ChevronDown size={20} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                  </button>
                </div>

                {isOpen && (
                  <div className="mt-6 grid gap-6 border-t border-border/50 pt-6 lg:grid-cols-[1fr_0.85fr]">
                    <div>
                      <h5 className="mb-3 text-sm font-semibold uppercase tracking-wide text-foreground">More Detail</h5>
                      <ul className="space-y-2">
                        {experience.details.map((detail) => (
                          <li key={detail} className="flex gap-3 text-sm text-muted-foreground">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                            <span>{detail}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div>
                      <h5 className="mb-3 text-sm font-semibold uppercase tracking-wide text-foreground">Skills Used</h5>
                      <div className="flex flex-wrap gap-2">
                        {experience.technologies.map((tech) => (
                          <span key={tech.name} className="tech-logo-chip">
                            <tech.icon size={23} style={{ color: tech.color }} />
                            {tech.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
};
