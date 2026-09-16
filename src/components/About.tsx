import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Brain, Code2, Database, Handshake, Network, ShieldCheck } from 'lucide-react';
import { getExperienceDuration } from '@/lib/experience';

const strengths = [
  {
    icon: Database,
    title: 'Data Analytics & SQL',
    description: 'Expertise in SQL queries, window functions, stored procedures, data cleaning, KPI analysis, and Power BI / Tableau dashboards.',
  },
  {
    icon: Code2,
    title: 'Python Automation',
    description: 'Developing automated data handling scripts, analytical tools, stock trackers, and data pipeline integrations.',
  },
  {
    icon: Brain,
    title: 'AI & Machine Learning',
    description: 'Applied experience with Hugging Face Transformers (BART), 2D/3D CNNs, SVM, PCA/SVD, and NLP pipelines.',
  },
  {
    icon: Network,
    title: 'Full-Stack Web Dev',
    description: 'Building responsive web applications using PHP, MySQL, JavaScript, HTML/CSS, authentication, and REST APIs.',
  },
  {
    icon: Handshake,
    title: 'Team Collaboration',
    description: 'Working in development teams, communicating insights with mentors and stakeholders, and managing end-to-end delivery.',
  },
  {
    icon: ShieldCheck,
    title: 'Problem Solving',
    description: 'Analytical mindset focused on transforming raw, multi-source datasets into actionable business decisions.',
  },
];

const stats = [
  { value: '3', label: 'Internships' },
  { value: '$29.4M+', label: 'Sales Analyzed' },
  { value: '60K+', label: 'Orders Processed' },
  { value: '6+', label: 'Featured Projects' },
];

export const About = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="about" className="py-24 relative" ref={ref}>
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="max-w-3xl mx-auto text-center mb-16"
        >
          <div className="inline-block glass-card px-4 py-2 mb-4">
            <span className="text-sm text-primary font-medium">About Me</span>
          </div>
          <h2 className="font-display text-4xl sm:text-5xl font-bold mb-6">
            Data Analyst. Software Engineer. <span className="gradient-text">Problem Solver.</span>
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            B.Tech Computer Science graduate from GITAM with hands-on experience in Python, SQL, Power BI, Tableau, Excel, machine learning, and full-stack web development.
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-[0.95fr_1.05fr] gap-8 items-start mb-16">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={isInView ? { opacity: 1, x: 0 } : {}}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="glass-card p-8"
          >
            <h3 className="font-display text-2xl font-bold mb-6 text-primary">How I Work</h3>
            <div className="space-y-5 text-muted-foreground leading-relaxed">
              <p>
                I hold a B.Tech in Computer Science and Engineering from GITAM (2021-2025). My focus spans both data analytics and software engineering—translating data into actionable business intelligence while building robust web and ML solutions.
              </p>
              <p>
                Through internships at CodeAlpha, ColourMoon Technologies, and Prodigy Infotech, I have automated repetitive data handling tasks, delivered responsive full-stack applications (school management, e-commerce, food delivery), and designed ML models.
              </p>
              <p>
                Whether analyzing $29.4M in sales data, engineering a BART-based text summarization pipeline, or developing 5-page Power BI dashboards, I bring analytical thinking, collaboration, and a results-driven mindset.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-8 pt-8 border-t border-border/50">
              {stats.map((stat) => (
                <div key={stat.label} className="rounded-2xl border border-border/40 bg-background/35 p-4 text-center">
                  <div className="font-display text-3xl font-bold text-primary mb-1">{stat.value}</div>
                  <div className="text-sm text-muted-foreground">{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-4">
            {strengths.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 30 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.6, delay: 0.1 * index + 0.35 }}
                className="glass-card p-6 hover:border-primary/30 transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <item.icon size={24} className="text-primary" />
                </div>
                <h4 className="font-display font-semibold text-lg mb-3">{item.title}</h4>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
