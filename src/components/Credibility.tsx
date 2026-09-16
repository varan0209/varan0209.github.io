import { motion, useInView } from 'framer-motion';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Award,
  BadgeCheck,
  Clapperboard,
  Code2,
  ExternalLink,
  FlaskConical,
  GraduationCap,
  Handshake,
  Lightbulb,
  RadioTower,
  Trophy,
  X,
  ZoomIn,
} from 'lucide-react';
import { publicAsset } from '@/lib/assets';

type CredentialItem = {
  category: string;
  title: string;
  issuer_or_event: string;
  date: string;
  description: string;
  image?: string;
  link?: string;
  tags: string[];
  priority: number;
};

const fallbackCredentialItems: CredentialItem[] = [
  {
    category: 'Certification',
    title: 'Cisco Data Analytics Essentials',
    issuer_or_event: 'Cisco Networking Academy',
    date: '2024',
    description:
      'Comprehensive training covering data analytics lifecycle, data visualization techniques, and statistical decision-making using industry tools.',
    link: '#contact',
    tags: ['Certification', 'Data Analytics', 'Visualization'],
    priority: 1,
  },
  {
    category: 'Certification',
    title: 'CCBP 4.0 Industry Ready Workshops',
    issuer_or_event: 'NxtWave / CCBP 4.0',
    date: '2023',
    description:
      'Specialized industry readiness program focused on Python scripting, relational database design with SQL, and modern web application development.',
    link: '#contact',
    tags: ['Certification', 'Python', 'SQL', 'Web Dev'],
    priority: 2,
  },
  {
    category: 'Certification',
    title: 'Face Prep C-Language Certification',
    issuer_or_event: 'Face Prep',
    date: '2022',
    description:
      'Foundational certification covering procedural programming in C, memory management, array manipulation, and core algorithmic problem solving.',
    link: '#contact',
    tags: ['Certification', 'C-Language', 'Data Structures'],
    priority: 3,
  },
];

const credentialIcons = {
  Certification: BadgeCheck,
  Certifications: BadgeCheck,
  Seminar: BadgeCheck,
  Seminars: BadgeCheck,
  Hackathons: Trophy,
  Research: RadioTower,
};

const credentialFilters = ['All', 'Certification'];

const leadershipItems = [
  {
    title: 'GITAM CSE Technical Collaboration & Peer Mentorship',
    role: 'Student Lead & Project Coordinator, GITAM',
    logo: '',
    description:
      'Led group projects and peer study sessions in B.Tech Computer Science at GITAM. Focused on SQL database design, Python algorithm optimization, and Power BI dashboard development.',
    details: [
      'Mentored junior students in core programming concepts (Python, C, SQL).',
      'Coordinated team roles and Git workflows for capstone and semester software projects.',
      'Fostered a collaborative problem-solving culture for academic & project deadlines.',
    ],
    icon: GraduationCap,
    href: '#contact',
  },
  {
    title: 'Data & Technical Event Coordinator',
    role: 'Technical Team Member, GITAM',
    logo: '',
    description:
      'Participated in organizing technical workshops, coding challenges, and data analysis presentations at GITAM CSE department.',
    details: [
      'Supported technical setup and logistics for hands-on coding workshops.',
      'Helped peers troubleshoot environment setup issues for Python, MySQL, and BI tools.',
      'Presented project walkthroughs and interactive dashboards to faculty and peers.',
    ],
    icon: Code2,
    href: '#contact',
  },
];

const splitCsvLine = (line: string) => {
  const values: string[] = [];
  let current = '';
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const nextChar = line[index + 1];

    if (char === '"' && nextChar === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === ',' && !quoted) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
};

const parseCredentialsCsv = (csv: string): CredentialItem[] => {
  const lines = csv.split(/\r?\n/).filter((line) => line.trim());
  const headers = splitCsvLine(lines[0] || '');
  return lines.slice(1).map((line) => {
    const values = splitCsvLine(line);
    const row = Object.fromEntries(headers.map((header, index) => [header, values[index] || '']));

    return {
      category: row.category || 'Certification',
      title: row.title || 'Untitled credential',
      issuer_or_event: row.issuer_or_event || '',
      date: row.date || '',
      description: row.description || '',
      image: row.image || '',
      link: row.link || '#contact',
      tags: (row.tags || '').split('|').map((tag) => tag.trim()).filter(Boolean),
      priority: Number(row.priority || 999),
    };
  }).filter((item) => item.title && item.description);
};

const CredentialImage = ({ item }: { item: CredentialItem }) => {
  const Icon = credentialIcons[item.category as keyof typeof credentialIcons] || Award;

  if (item.image) {
    return (
      <div className="credential-image-frame">
        <img src={publicAsset(item.image)} alt={`${item.title} visual`} className="h-full w-full object-contain" />
      </div>
    );
  }

  return (
    <div className="credential-image-frame credential-image-frame--fallback">
      <Icon size={42} />
      <span>{item.category}</span>
      <small>{item.issuer_or_event || item.title}</small>
    </div>
  );
};

export const Credibility = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [credentials, setCredentials] = useState<CredentialItem[]>(fallbackCredentialItems);
  const [activeCredentialFilter, setActiveCredentialFilter] = useState('All');
  const [zoomedCredential, setZoomedCredential] = useState<CredentialItem | null>(null);

  useEffect(() => {
    let cancelled = false;

    fetch(publicAsset('data/credentials.csv'))
      .then((response) => response.ok ? response.text() : Promise.reject())
      .then((csv) => {
        if (cancelled) return;
        const parsed = parseCredentialsCsv(csv);
        setCredentials(parsed.length ? parsed.sort((a, b) => a.priority - b.priority) : fallbackCredentialItems);
      })
      .catch(() => {
        if (!cancelled) setCredentials(fallbackCredentialItems);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const sortedCredentials = useMemo(
    () => [...credentials].sort((a, b) => a.priority - b.priority),
    [credentials],
  );

  const galleryCredentials = useMemo(
    () => sortedCredentials.filter((item) => item.category !== 'Research'),
    [sortedCredentials],
  );

  const researchCredentials = useMemo(
    () => sortedCredentials.filter((item) => item.category === 'Research'),
    [sortedCredentials],
  );

  const visibleCredentials = useMemo(
    () => activeCredentialFilter === 'All'
      ? galleryCredentials
      : galleryCredentials.filter((item) => item.category === activeCredentialFilter),
    [activeCredentialFilter, galleryCredentials],
  );

  return (
    <section id="credibility" className="py-24 relative" ref={ref}>
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="max-w-3xl mx-auto text-center mb-16"
        >
          <div className="inline-block glass-card px-4 py-2 mb-4">
            <span className="text-sm text-primary font-medium">Recognition</span>
          </div>
          <h2 className="font-display text-4xl sm:text-5xl font-bold mb-6">
            Research, Awards & <span className="gradient-text">Service</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Research, hackathons, leadership, and community work that reflect how I learn, collaborate, and contribute.
          </p>
        </motion.div>

        <div className="credential-filter-bar mb-8">
          <span>Tags:</span>
          {credentialFilters.map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setActiveCredentialFilter(filter)}
              className={activeCredentialFilter === filter ? 'is-active' : undefined}
            >
              {filter}
            </button>
          ))}
        </div>

        <div className="credential-gallery-shell glass-card">
          <div className="credential-gallery">
            {visibleCredentials.map((item, index) => {
              const Icon = credentialIcons[item.category as keyof typeof credentialIcons] || Award;

              return (
              <motion.article
                key={item.title}
                initial={{ opacity: 0, y: 24 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.55, delay: index * 0.07 }}
                className="credential-gallery-card"
              >
                  <CredentialImage item={item} />
                  <div className="credential-gallery-card__overlay">
                    <Icon size={26} />
                    <h3>{item.title}</h3>
                    <p>{item.category}</p>
                    <small>{item.issuer_or_event}</small>
                    <div className="credential-gallery-card__actions">
                      {item.image && (
                        <button
                          type="button"
                          onClick={() => setZoomedCredential(item)}
                          aria-label={`Zoom ${item.title}`}
                        >
                          <ZoomIn size={18} />
                        </button>
                      )}
                      <a href={item.link || '#contact'} aria-label={`Open ${item.title}`}>
                        <ExternalLink size={18} />
                      </a>
                    </div>
                  </div>
              </motion.article>
              );
            })}
          </div>
        </div>

        {!!researchCredentials.length && (
          <div className="mt-12 space-y-5">
            <div className="mb-2 flex items-center gap-3">
              <RadioTower size={26} className="text-primary" />
              <h3 className="font-display text-3xl font-bold">Research</h3>
            </div>

            {researchCredentials.map((item, index) => (
              <motion.article
                key={item.title}
                initial={{ opacity: 0, y: 24 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.55, delay: 0.22 + index * 0.08 }}
                className="credential-research-card glass-card p-6 sm:p-7"
              >
                <div className="credential-research-card__content">
                  <div>
                    <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-primary">{item.issuer_or_event}</p>
                    <h4 className="font-display text-2xl font-bold">{item.title}</h4>
                    <p className="mt-4 leading-relaxed text-muted-foreground">{item.description}</p>
                    <div className="mt-5 flex flex-wrap gap-2">
                      {item.tags.map((tag) => (
                        <span key={tag} className="skill-badge text-xs">{tag}</span>
                      ))}
                    </div>
                  </div>

                  <div className="credential-research-card__media">
                    <CredentialImage item={item} />
                    {item.image && (
                      <button
                        type="button"
                        onClick={() => setZoomedCredential(item)}
                        className="credential-research-card__zoom"
                        aria-label={`Zoom ${item.title}`}
                      >
                        <ZoomIn size={18} />
                      </button>
                    )}
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.25 }}
          className="mt-14"
        >
          <div className="mb-8 flex items-center gap-3">
            <Award size={26} className="text-primary" />
            <h3 className="font-display text-3xl font-bold">Leadership & Community</h3>
          </div>

          <div className="space-y-5">
            {leadershipItems.map((item, index) => (
              <motion.article
                key={item.title}
                initial={{ opacity: 0, y: 22 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: 0.35 + index * 0.06 }}
                className="glass-card p-6 sm:p-8"
              >
                <div className="grid gap-5 lg:grid-cols-[auto_1fr] lg:items-start">
                  <div className="club-logo-frame">
                    {item.logo ? (
                      <img src={publicAsset(item.logo)} alt={`${item.title} logo`} className="h-full w-full object-contain" />
                    ) : (
                      <item.icon size={30} />
                    )}
                  </div>
                  <div>
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <h4 className="font-display text-2xl font-semibold">{item.title}</h4>
                      <a
                        href={item.href}
                        className="club-reference-icon"
                        aria-label={`Open ${item.title} reference`}
                      >
                        <ExternalLink size={15} />
                      </a>
                    </div>
                    <p className="mt-1 text-sm font-semibold uppercase tracking-wide text-primary">{item.role}</p>
                    <p className="mt-4 leading-relaxed text-muted-foreground">{item.description}</p>
                    <ul className="mt-5 grid gap-2 md:grid-cols-3">
                      {item.details.map((detail) => (
                        <li key={detail} className="flex gap-3 text-sm text-muted-foreground">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </motion.div>
      </div>

      {zoomedCredential && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-4 py-8">
          <button
            type="button"
            className="absolute inset-0 bg-background/82 backdrop-blur-md"
            onClick={() => setZoomedCredential(null)}
            aria-label="Close credential preview"
          />
          <motion.div
            initial={{ opacity: 0, y: 18, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.22 }}
            className="credential-zoom-modal glass-card"
            role="dialog"
            aria-modal="true"
            aria-label={`${zoomedCredential.title} preview`}
          >
            <button
              type="button"
              onClick={() => setZoomedCredential(null)}
              className="credential-zoom-modal__close"
              aria-label="Close"
            >
              <X size={18} />
            </button>
            <div className="credential-zoom-modal__image">
              <img
                src={publicAsset(zoomedCredential.image || '')}
                alt={`${zoomedCredential.title} certificate`}
              />
            </div>
            <div className="credential-zoom-modal__caption">
              <p>{zoomedCredential.category}</p>
              <h3>{zoomedCredential.title}</h3>
              <span>{zoomedCredential.issuer_or_event}</span>
            </div>
          </motion.div>
        </div>
      )}
    </section>
  );
};
