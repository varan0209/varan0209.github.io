import { motion, useInView } from 'framer-motion';
import { useRef, type MouseEvent } from 'react';
import { BriefcaseBusiness, Code2, Database, Download, ExternalLink, Github, GraduationCap, Linkedin, Mail, MapPin, Phone, ScrollText, Sparkles } from 'lucide-react';
import { publicAsset } from '@/lib/assets';
import { trackResumeAction } from '@/lib/analytics';

const contactItems = [
  { text: 'Hyderabad, Telangana, India', icon: MapPin },
  { text: 'varan4636@gmail.com', icon: Mail },
  { text: '+91 9398626446', icon: Phone },
  { text: 'linkedin.com/in/varan-mamidala-2b950b261/', icon: Linkedin },
  { text: 'github.com/varan0209', icon: Github },
];

const experience = [
  {
    role: 'Python Programming Intern',
    company: 'CodeAlpha',
    period: 'Nov 2025 – Dec 2025',
    points: [
      'Developed Python automation scripts to streamline routine data-handling processes and reduce manual effort.',
      'Designed a Stock Portfolio Tracker to analyze investment data and calculate profit/loss for data-driven decisions.',
      'Collaborated on a rule-based chatbot and interactive game, strengthening problem-solving skills.',
    ],
  },
  {
    role: 'Web Development Intern',
    company: 'ColourMoon Technologies',
    period: 'May 2024 – Jun 2024',
    points: [
      'Delivered responsive front-end applications for school management, e-commerce, and food delivery systems.',
      'Implemented user authentication, shopping cart, order tracking, and REST API integration features.',
    ],
  },
  {
    role: 'Web Development Intern',
    company: 'Prodigy Infotech (MSME)',
    period: 'Feb 2024 – Mar 2024',
    points: [
      'Delivered a responsive full-stack web application, integrating front-end interfaces with PHP backend logic and MySQL database.',
      'Contributed across requirements analysis, design, development, and deployment.',
    ],
  },
];

const skills = [
  'Python',
  'SQL',
  'JavaScript',
  'HTML/CSS',
  'PHP',
  'MySQL',
  'Power BI',
  'Tableau',
  'MS Excel (Advanced)',
  'Data Analysis',
  'Data Cleaning',
  'Data Visualization',
  'KPI Analysis',
  'Window Functions',
  'Stored Procedures',
  'NLP',
  'Hugging Face (BART)',
  'TensorFlow',
  '2D/3D CNNs',
  'SVM',
  'PCA / SVD',
  'AWS Cloud',
  'Git & GitHub',
];

const projects = [
  'Adventure Works Sales & Profit Analysis - SQL, Power BI, Tableau, Excel ($29.4M sales, 60K orders evaluated).',
  'Text Summarization Model - NLP, Python, Hugging Face BART-large-cnn multi-stage chunking & summarization.',
  'Zomato Sales & Rating Analysis - SQL, Tableau (9,551 restaurants across 15 countries & 141 cities).',
  'Hyperspectral Image Classification - Deep Learning, TensorFlow, 2D/3D CNNs, SVM, PCA/SVD dimensionality reduction.',
  'Blinkit Sales Performance Dashboard - Power BI, Excel ($1.20M sales, 5-page interactive dashboard & decomposition tree).',
  'Online Library Management System - Full-stack PHP, MySQL, JavaScript CRUD web application.',
];

export const ResumePreview = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="resume" className="py-24 relative" ref={ref}>
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="max-w-3xl mx-auto text-center mb-14"
        >
          <div className="inline-block glass-card px-4 py-2 mb-4">
            <span className="text-sm text-primary font-medium">Resume</span>
          </div>
          <h2 className="font-display text-4xl sm:text-5xl font-bold mb-6">
            <span className="gradient-text">Resume Highlights</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Review key credentials below, connect via LinkedIn / GitHub, or get in touch directly.
          </p>

          <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
            <a
              href="https://github.com/varan0209"
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary inline-flex items-center justify-center gap-2"
            >
              <ExternalLink size={18} />
              View GitHub Profile
            </a>
            <a
              href="mailto:varan4636@gmail.com"
              className="btn-secondary inline-flex items-center justify-center gap-2"
            >
              <Mail size={18} />
              Contact Varan
            </a>
          </div>
        </motion.div>

        <motion.article
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="glass-card mx-auto max-w-6xl p-6 sm:p-8 lg:p-10"
        >
          <div className="grid gap-8 lg:grid-cols-[0.9fr_1.1fr]">
            <div>
              <div className="mb-7">
                <div className="mb-3 flex items-center gap-3 text-primary">
                  <ScrollText size={24} />
                  <span className="text-sm font-semibold uppercase tracking-wide">Varan Mamidala</span>
                </div>
                <h3 className="font-display text-3xl font-bold leading-tight">
                  Data Analyst & Software Engineer
                </h3>
                <p className="mt-4 leading-relaxed text-muted-foreground">
                  B.Tech Computer Science graduate with hands-on experience in Python, SQL, Power BI, Tableau, Excel, machine learning, and full-stack web development.
                </p>
              </div>

              <div className="mb-8 grid gap-3 text-sm text-muted-foreground">
                {contactItems.map((item) => (
                  <div key={item.text} className="flex items-center gap-3">
                    <item.icon size={16} className="text-primary" />
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>

              <div className="rounded-2xl border border-border/40 bg-background/35 p-5">
                <div className="mb-4 flex items-center gap-3">
                  <GraduationCap size={20} className="text-primary" />
                  <h4 className="font-display text-lg font-semibold">Education</h4>
                </div>
                <div className="space-y-4 text-sm text-muted-foreground">
                  <p>
                    <span className="font-semibold text-foreground">B.Tech in Computer Science and Engineering</span>
                    <br />
                    GITAM (Gandhi Institute of Technology and Management) - 2021 to 2025
                    <br />
                    Visakhapatnam, Andhra Pradesh, India
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-7">
              <div>
                <div className="mb-4 flex items-center gap-3">
                  <BriefcaseBusiness size={20} className="text-primary" />
                  <h4 className="font-display text-xl font-semibold">Experience</h4>
                </div>
                <div className="space-y-5">
                  {experience.map((item) => (
                    <div key={`${item.company}-${item.role}`} className="border-l border-primary/35 pl-5">
                      <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                        <h5 className="font-semibold text-foreground">{item.role}</h5>
                        <span className="text-xs text-primary">{item.period}</span>
                      </div>
                      <p className="mb-3 text-sm font-medium text-primary">{item.company}</p>
                      <ul className="space-y-2">
                        {item.points.map((point) => (
                          <li key={point} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div className="rounded-2xl border border-border/40 bg-background/35 p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <Code2 size={19} className="text-primary" />
                    <h4 className="font-display text-lg font-semibold">Selected Skills</h4>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {skills.map((skill) => (
                      <span key={skill} className="skill-badge text-xs">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl border border-border/40 bg-background/35 p-5">
                  <div className="mb-4 flex items-center gap-3">
                    <Database size={19} className="text-primary" />
                    <h4 className="font-display text-lg font-semibold">Selected Projects</h4>
                  </div>
                  <ul className="space-y-3">
                    {projects.map((project) => (
                      <li key={project} className="flex gap-3 text-sm leading-relaxed text-muted-foreground">
                        <Sparkles size={14} className="mt-1 shrink-0 text-primary" />
                        <span>{project}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </motion.article>
      </div>
    </section>
  );
};
