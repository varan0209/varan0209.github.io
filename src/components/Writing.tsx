import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import { ArrowUpRight, BrainCircuit, Layers3, PenLine } from 'lucide-react';

const notes = [
  {
    title: 'AI Engineering in Practice',
    description: 'Notes on RAG, agents, evaluation, prompt behavior, and the engineering needed around LLM apps.',
    href: 'https://medium.com/tag/ai-engineering',
    icon: BrainCircuit,
  },
  {
    title: 'From Models to ML Systems',
    description: 'Thoughts on data checks, reproducibility, monitoring, deployment, and failure boundaries.',
    href: 'https://medium.com/tag/mlops',
    icon: Layers3,
  },
  {
    title: 'Building Products With Data',
    description: 'Short writing on dashboards, analytics products, user-centered interfaces, and technical storytelling.',
    href: 'https://medium.com/tag/data-engineering',
    icon: PenLine,
  },
];

export const Writing = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="writing" className="py-24 relative bg-secondary/20" ref={ref}>
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="max-w-3xl mx-auto text-center mb-16"
        >
          <div className="inline-block glass-card px-4 py-2 mb-4">
            <span className="text-sm text-primary font-medium">Writing & Thinking</span>
          </div>
          <h2 className="font-display text-4xl sm:text-5xl font-bold mb-6">
            Thoughts on <span className="gradient-text">Building Well</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Thoughts on AI engineering, ML systems, and building products.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {notes.map((note, index) => (
            <motion.a
              key={note.title}
              href={note.href}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 24 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              className="glass-card p-7 hover:border-primary/30"
            >
              <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border border-primary/25 bg-primary/10 text-primary">
                <note.icon size={24} />
              </div>
              <div className="mb-3 flex items-start justify-between gap-4">
                <h3 className="font-display text-xl font-semibold">{note.title}</h3>
                <ArrowUpRight size={18} className="mt-1 shrink-0 text-primary" />
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground">{note.description}</p>
            </motion.a>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.5, delay: 0.32 }}
          className="mt-10 text-center"
        >
          <a
            href="https://github.com/varan0209"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
          >
            More
            <ArrowUpRight size={18} />
          </a>
        </motion.div>
      </div>
    </section>
  );
};
