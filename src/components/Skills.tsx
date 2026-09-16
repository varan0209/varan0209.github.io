import { motion, useInView } from 'framer-motion';
import { useRef } from 'react';
import type { IconType } from 'react-icons';
import {
  SiAngular,
  SiApacheairflow,
  SiApachehadoop,
  SiApachekafka,
  SiApachemaven,
  SiApachespark,
  SiC,
  SiCplusplus,
  SiCss,
  SiDatabricks,
  SiDocker,
  SiDvc,
  SiElasticsearch,
  SiExpress,
  SiFastapi,
  SiFlask,
  SiGit,
  SiGithub,
  SiGithubactions,
  SiGnubash,
  SiGooglecloud,
  SiGraphql,
  SiHtml5,
  SiHuggingface,
  SiJavascript,
  SiJenkins,
  SiJest,
  SiJsonwebtokens,
  SiJupyter,
  SiKeras,
  SiKubernetes,
  SiLangchain,
  SiLinux,
  SiMlflow,
  SiMongodb,
  SiMocha,
  SiMysql,
  SiNodedotjs,
  SiNumpy,
  SiOllama,
  SiOpencv,
  SiOpenai,
  SiPandas,
  SiPlotly,
  SiPostgresql,
  SiPrometheus,
  SiPytest,
  SiPytorch,
  SiPython,
  SiR,
  SiReact,
  SiRedis,
  SiScikitlearn,
  SiScipy,
  SiSelenium,
  SiSnowflake,
  SiSpringboot,
  SiSqlite,
  SiStreamlit,
  SiTailwindcss,
  SiTensorflow,
  SiTerraform,
  SiTypescript,
  SiVite,
} from 'react-icons/si';
import { FaAws, FaDatabase, FaJava } from 'react-icons/fa';

type Skill = {
  name: string;
  icon: IconType;
  color: string;
};

const skillsByArea: Array<{ title: string; description: string; skills: Skill[] }> = [
  {
    title: 'Programming Languages',
    description: 'Core languages for software development, data manipulation, automation, and backend logic.',
    skills: [
      { name: 'Python', icon: SiPython, color: '#3776AB' },
      { name: 'SQL', icon: SiMysql, color: '#4169E1' },
      { name: 'JavaScript', icon: SiJavascript, color: '#F7DF1E' },
      { name: 'HTML/CSS', icon: SiHtml5, color: '#E34F26' },
      { name: 'PHP', icon: SiJavascript, color: '#777BB4' },
      { name: 'C Language', icon: SiC, color: '#A8B9CC' },
    ],
  },
  {
    title: 'Data Analytics & Visualization',
    description: 'Transforming complex datasets into actionable business insights and executive dashboards.',
    skills: [
      { name: 'Power BI', icon: SiPostgresql, color: '#F2C811' },
      { name: 'Tableau', icon: SiPostgresql, color: '#E97627' },
      { name: 'Data Analysis', icon: SiJupyter, color: '#3776AB' },
      { name: 'Data Cleaning', icon: SiPandas, color: '#150458' },
      { name: 'Data Visualization', icon: SiPlotly, color: '#3F4F75' },
      { name: 'KPI Analysis', icon: SiMysql, color: '#009688' },
      { name: 'MS Excel (Advanced)', icon: SiPostgresql, color: '#107C41' },
      { name: 'Performance Eval', icon: SiScikitlearn, color: '#F7931E' },
    ],
  },
  {
    title: 'SQL & Database Engineering',
    description: 'Advanced querying, stored procedures, joins, window functions, and database design.',
    skills: [
      { name: 'MySQL', icon: SiMysql, color: '#4479A1' },
      { name: 'SQL Joins', icon: SiMysql, color: '#4169E1' },
      { name: 'Aggregations', icon: SiMysql, color: '#003B57' },
      { name: 'Views', icon: SiPostgresql, color: '#336791' },
      { name: 'Stored Procedures', icon: SiMysql, color: '#F29111' },
      { name: 'Window Functions', icon: SiPostgresql, color: '#4169E1' },
      { name: 'REGEXP', icon: SiGnubash, color: '#4EAA25' },
    ],
  },
  {
    title: 'AI / ML & NLP',
    description: 'Transformer architectures, deep learning models, text summarization, and computer vision.',
    skills: [
      { name: 'NLP', icon: SiHuggingface, color: '#FFD21E' },
      { name: 'Hugging Face', icon: SiHuggingface, color: '#FFD21E' },
      { name: 'BART Model', icon: SiHuggingface, color: '#FF9900' },
      { name: 'TensorFlow', icon: SiTensorflow, color: '#FF6F00' },
      { name: 'SVM', icon: SiScikitlearn, color: '#F7931E' },
      { name: '2D/3D CNNs', icon: SiOpencv, color: '#EE4C2C' },
      { name: 'PCA / SVD', icon: SiNumpy, color: '#013243' },
    ],
  },
  {
    title: 'Tools & Cloud Platforms',
    description: 'Development tools, cloud fundamentals, version control, and productivity suites.',
    skills: [
      { name: 'Git', icon: SiGit, color: '#F05032' },
      { name: 'GitHub', icon: SiGithub, color: '#181717' },
      { name: 'Visual Studio', icon: SiGit, color: '#5C2D91' },
      { name: 'AWS Cloud', icon: FaAws, color: '#FF9900' },
      { name: 'MS Word', icon: SiGit, color: '#2B579A' },
      { name: 'PowerPoint', icon: SiGit, color: '#D24726' },
    ],
  },
];

export const Skills = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="skills" className="py-24 relative bg-secondary/20" ref={ref}>
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="max-w-3xl mx-auto text-center mb-16"
        >
          <div className="inline-block glass-card px-4 py-2 mb-4">
            <span className="text-sm text-primary font-medium">Skills</span>
          </div>
          <h2 className="font-display text-4xl sm:text-5xl font-bold mb-6">
            Skills & <span className="gradient-text">Technologies</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Technologies I have used across professional work, research, coursework, and independent projects.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {skillsByArea.map((category, categoryIndex) => (
            <motion.div
              key={category.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.08 * categoryIndex }}
              className="glass-card p-6 hover:border-primary/30 transition-all duration-300"
            >
              <h3 className="font-display text-xl font-bold mb-3 text-primary">{category.title}</h3>
              <p className="mb-5 text-sm leading-relaxed text-muted-foreground">{category.description}</p>
              <div className="grid grid-cols-2 gap-3">
                {category.skills.map((skill, skillIndex) => (
                  <motion.span
                    key={skill.name}
                    initial={{ opacity: 0, scale: 0.88 }}
                    animate={isInView ? { opacity: 1, scale: 1 } : {}}
                    transition={{ duration: 0.25, delay: 0.08 * categoryIndex + 0.02 * skillIndex }}
                    className="tech-logo-chip"
                    title={skill.name}
                  >
                    <skill.icon size={30} style={{ color: skill.color }} />
                    <span>{skill.name}</span>
                  </motion.span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
