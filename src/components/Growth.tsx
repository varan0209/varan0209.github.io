import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { Bot, Cloud, DatabaseZap, Workflow } from 'lucide-react';

const topics = [
  {
    title: 'Advanced Data Warehousing & ETL Pipelines',
    description: 'Snowflake, dbt, SQL query optimization, automated ETL orchestration, and scalable data modelling for analytics.',
    icon: DatabaseZap,
  },
  {
    title: 'Applied Machine Learning & NLP Systems',
    description: 'Transformer architectures (BART, BERT), text summarization, hyperspectral classification, and predictive modeling.',
    icon: Bot,
  },
  {
    title: 'Interactive BI & Executive Dashboards',
    description: 'Advanced Power BI DAX formulas, Tableau calculated fields, real-time sales KPI tracking, and executive data storytelling.',
    icon: Workflow,
  },
];

export const Growth = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="growth" className="py-24 relative bg-secondary/20" ref={ref}>
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="max-w-3xl mx-auto text-center mb-16"
        >
          <div className="inline-block glass-card px-4 py-2 mb-4">
            <span className="text-sm text-primary font-medium">Currently Exploring</span>
          </div>
          <h2 className="font-display text-4xl sm:text-5xl font-bold mb-6">
            What I'm <span className="gradient-text">Learning Now</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Areas I am actively studying and applying through focused projects and experiments.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5">
          {topics.map((topic, index) => (
            <motion.div
              key={topic.title}
              initial={{ opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.05 }}
              className="glass-card floating-box p-6"
            >
              <div className="mb-4 flex items-center justify-between gap-3">
                <div className="rounded-2xl border border-primary/25 bg-primary/10 p-3 text-primary">
                  <topic.icon size={22} />
                </div>
                <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  Exploring
                </span>
              </div>
              <h3 className="font-display text-lg font-semibold mb-3">{topic.title}</h3>
              <p className="text-sm leading-relaxed text-muted-foreground">{topic.description}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.7, delay: 0.35 }}
          className="glass-card mt-10 p-8"
        >
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="font-display text-2xl font-bold mb-2">How I Learn</h3>
              <p className="max-w-3xl text-muted-foreground leading-relaxed">
                I stay curious, but I try to make curiosity useful: cleaner data, clearer APIs, more reliable models,
                better documentation, and stronger judgment about when a tool actually solves the problem.
              </p>
            </div>
            <div className="brand-mark">
              <Cloud size={22} />
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
