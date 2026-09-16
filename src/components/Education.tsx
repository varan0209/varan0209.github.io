import { motion, useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import {
  BarChart3,
  Binary,
  BookOpenCheck,
  BrainCircuit,
  Calendar,
  ChevronRight,
  Code2,
  Cpu,
  Database,
  GraduationCap,
  Languages,
  LineChart,
  LockKeyhole,
  MapPin,
  Network,
  Smartphone,
} from 'lucide-react';
import { publicAsset } from '@/lib/assets';

const graduateTerms = [
  {
    term: 'Fall 2024',
    courses: [
      'Algorithms Analysis and Design',
      'Computer Security',
      'Introduction to Machine Learning',
      'Data Intensive Computing',
    ],
  },
  {
    term: 'Spring 2025',
    courses: [
      'Operating Systems',
      'Data Models and Query Languages',
      'Deep Learning',
      'Statistical Data Mining II',
      'Web Analytics for eCommerce',
    ],
  },
  {
    term: 'Fall 2025',
    courses: [
      'Computer Vision and Image Processing',
    ],
  },
];

const undergraduateCourses = [
  'Problem Solving using Java',
  'Data Structures and Algorithms',
  'Object Oriented Programming',
  'Database Management Systems',
  'Artificial Intelligence',
  'Computer Networks',
  'Web Technologies',
  'Computer Organization and Architecture',
  'Software Engineering',
  'Operating Systems',
  'Design and Analysis of Algorithms',
  'Mobile Application Development',
  'Data Analytics',
  'Theory of Computation',
  'Introduction to Machine Learning',
  'Natural Language Processing',
  'Advanced Data Analytics',
  'Foundations for Data Analytics',
  'Business Analytics',
  'Competitive Programming',
  'Introduction to Cryptography',
  'Fundamentals of Blockchain for Engineers',
  'Computer Graphics',
  'Discrete Mathematical Structures',
  'Linear Algebra',
  'Applied Statistics',
  'Software Project Management',
  'Capstone',
  'Internship',
  'Critical Thinking Skills',
  'Fundamentals of Team Building and Leadership',
  'Economics for Engineers',
];

const getCourseIcon = (course: string) => {
  const normalized = course.toLowerCase();
  if (normalized.includes('machine learning') || normalized.includes('artificial intelligence') || normalized.includes('deep learning') || normalized.includes('natural language')) return BrainCircuit;
  if (normalized.includes('database') || normalized.includes('query') || normalized.includes('data models')) return Database;
  if (normalized.includes('security') || normalized.includes('cryptography') || normalized.includes('blockchain')) return LockKeyhole;
  if (normalized.includes('operating') || normalized.includes('computer organization') || normalized.includes('architecture')) return Cpu;
  if (normalized.includes('network')) return Network;
  if (normalized.includes('web') || normalized.includes('java') || normalized.includes('programming') || normalized.includes('software') || normalized.includes('capstone')) return Code2;
  if (normalized.includes('mobile')) return Smartphone;
  if (normalized.includes('analytics') || normalized.includes('mining') || normalized.includes('statistics')) return BarChart3;
  if (normalized.includes('algorithm') || normalized.includes('structures') || normalized.includes('computation') || normalized.includes('competitive')) return Binary;
  if (normalized.includes('linear') || normalized.includes('calculus')) return LineChart;
  if (normalized.includes('communication') || normalized.includes('french') || normalized.includes('english')) return Languages;
  return BookOpenCheck;
};

const certifications = [
  { name: 'Data Analytics Certification (QID/26-27/1229)', issuer: 'Quality Thought', icon: BarChart3 },
  { name: 'Data Analytics Essentials', issuer: 'Cisco Networking Academy', icon: BarChart3 },
  { name: 'Data Analytics Mega Workshop', issuer: 'CCBP 4.0', icon: BarChart3 },
  { name: 'Generative AI Mega Workshop', issuer: 'CCBP 4.0', icon: BrainCircuit },
  { name: 'AWS Mega Workshop', issuer: 'CCBP 4.0', icon: Cpu },
  { name: 'Full Stack Web Development Course', issuer: 'CCBP 4.0', icon: Code2 },
  { name: 'C-Language Training', issuer: 'Face Prep', icon: Code2 },
];

const gitamCourses = [
  'Python Programming',
  'SQL & Database Management Systems',
  'Data Structures & Algorithms',
  'Data Analysis & Visualization',
  'Power BI & Tableau Analytics',
  'Machine Learning & Deep Learning',
  'Natural Language Processing',
  'Full-Stack Web Development (PHP/MySQL/JS)',
  'Cloud Fundamentals (AWS)',
  'Software Engineering & Agile',
  'Operating Systems',
  'Computer Networks',
];

export const Education = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="education" className="py-24 relative bg-secondary/20" ref={ref}>
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="max-w-3xl mx-auto text-center mb-16"
        >
          <div className="inline-block glass-card px-4 py-2 mb-4">
            <span className="text-sm text-primary font-medium">Education & Certifications</span>
          </div>
          <h2 className="font-display text-4xl sm:text-5xl font-bold mb-6">
            Education & <span className="gradient-text">Certifications</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            B.Tech in Computer Science and Engineering from GITAM University, supported by professional certifications in Data Analytics, Generative AI, Cloud, and Web Development.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          {/* Degree Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="glass-card p-8 hover:border-primary/30 transition-all duration-300 group"
          >
            <div className="flex items-start gap-4 mb-6">
              <div className="education-logo-frame h-20 w-20 flex items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary">
                <GraduationCap size={36} />
              </div>

              <div className="flex-1">
                <h3 className="font-display text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                  Bachelor of Technology (B.Tech)
                </h3>
                <h4 className="text-lg font-semibold text-primary mb-1">
                  Computer Science and Engineering
                </h4>
                <p className="text-sm text-foreground/80 font-medium mb-3">
                  Gandhi Institute of Technology and Management (GITAM)
                </p>

                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} />
                    <span>2021 – 2025</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin size={16} />
                    <span>Visakhapatnam, Andhra Pradesh, India</span>
                  </div>
                </div>
              </div>
            </div>

            <p className="text-muted-foreground mb-6 leading-relaxed">
              Comprehensive undergraduate computer science curriculum covering programming, database systems, software engineering, machine learning, and data analytics.
            </p>

            <div className="space-y-4">
              <h5 className="font-semibold text-sm uppercase tracking-wide text-foreground flex items-center gap-2">
                <BookOpenCheck size={16} className="text-primary" />
                Key Coursework & Skills
              </h5>
              <div className="flex flex-wrap gap-2">
                {gitamCourses.map((course) => (
                  <span key={course} className="tech-chip text-xs">
                    {course}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Certifications Card */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.35 }}
            className="glass-card p-8 hover:border-primary/30 transition-all duration-300 group"
          >
            <div className="flex items-start gap-4 mb-6">
              <div className="education-logo-frame h-20 w-20 flex items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 text-primary">
                <BookOpenCheck size={36} />
              </div>
              <div className="flex-1">
                <h3 className="font-display text-xl font-bold mb-2 group-hover:text-primary transition-colors">
                  Certifications & Workshops
                </h3>
                <p className="text-sm text-muted-foreground">
                  Industry workshops and practical skill credentials
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {certifications.map((cert) => (
                <div
                  key={cert.name}
                  className="flex items-center gap-4 rounded-xl border border-border/40 bg-background/40 p-4 transition-colors hover:border-primary/40"
                >
                  <div className="h-10 w-10 shrink-0 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <cert.icon size={20} />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-foreground">{cert.name}</h4>
                    <p className="text-xs text-primary font-medium">{cert.issuer}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
