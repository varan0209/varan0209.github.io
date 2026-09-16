import { motion, useInView } from 'framer-motion';
import { useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  BarChart3,
  BrainCircuit,
  ChevronRight,
  Code2,
  Cpu,
  Database,
  ExternalLink,
  Github,
  Image as ImageIcon,
  Layers3,
  LineChart,
  Network,
  RadioTower,
  ScanFace,
  ServerCog,
  ShieldCheck,
  Workflow,
  X,
} from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { publicAsset } from '@/lib/assets';
import { trackEvent } from '@/lib/analytics';

type Project = {
  title: string;
  role: string;
  status: 'Completed' | 'Live';
  context: string;
  subject?: string;
  overview: string;
  technologies: string[];
  keyFeatures: string[];
  outcome: string;
  icon: LucideIcon;
  coverImage?: string;
  // Add real project URLs here when they are available. Keep missing GitHub/live links undefined so recruiters do not see dummy buttons.
  githubUrl?: string;
  demoUrl?: string;
};

const defaultProjectCover = 'default%20project%20cover%20photo.png';

const remoteCover = (photoId: string) =>
  `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=1200&q=82`;

const projectCoverImages = {
  ai: remoteCover('photo-1677442136019-21780ecad995'),
  algorithms: remoteCover('photo-1515879218367-8466d910aaa4'),
  analytics: remoteCover('photo-1551288049-bebda4e38f71'),
  aviation: remoteCover('photo-1436491865332-7a61a109cc05'),
  climate: remoteCover('photo-1446776811953-b23d57bd21aa'),
  database: remoteCover('photo-1558494949-ef010cbdcc31'),
  embedded: remoteCover('photo-1518770660439-4636190af475'),
  finance: remoteCover('photo-1611974789855-9c2a0a7236a3'),
  mobile: remoteCover('photo-1516321318423-f06f85e504b3'),
  security: remoteCover('photo-1555949963-aa79dcee981c'),
  systems: remoteCover('photo-1518779578993-ec3579fee39f'),
  vision: remoteCover('photo-1535378917042-10a22c95931a'),
  web: remoteCover('photo-1461749280684-dccba630e2f6'),
  opensource: remoteCover('photo-1618401471353-b98afee0b2eb'),
};

const roles = [
  'All Projects',
  'Data Analyst',
  'Software Engineer',
  'Machine Learning & AI',
  'Full Stack Web Dev',
];

const resolveProjectImage = (path: string) =>
  /^https?:\/\//.test(path) ? path : publicAsset(path);

const getProjectCoverSrc = (project: Project) => {
  if (project.coverImage) return resolveProjectImage(project.coverImage);

  const haystack = `${project.title} ${project.role} ${project.subject || ''} ${project.context}`.toLowerCase();

  if (haystack.includes('adventure') || haystack.includes('zomato') || haystack.includes('blinkit') || haystack.includes('sales') || haystack.includes('analytics')) return projectCoverImages.analytics;
  if (haystack.includes('summarization') || haystack.includes('nlp') || haystack.includes('hyperspectral') || haystack.includes('deep learning')) return projectCoverImages.ai;
  if (haystack.includes('library') || haystack.includes('web') || haystack.includes('crud') || haystack.includes('php')) return projectCoverImages.web;
  if (haystack.includes('stock') || haystack.includes('portfolio') || haystack.includes('finance')) return projectCoverImages.finance;

  return publicAsset(defaultProjectCover);
};

const projects: Project[] = [
  {
    title: 'Text Summarization Model (BART Transformer)',
    role: 'Machine Learning & AI',
    status: 'Completed',
    context: 'Natural Language Processing & Deep Learning',
    subject: 'AI & NLP',
    overview:
      'Independently designed an AI-powered text summarization solution utilizing the BART-large-cnn model for both short- and long-form document processing.',
    technologies: ['NLP', 'Python', 'Hugging Face Transformers', 'BART', 'PyTorch', 'Text Chunking', 'Jupyter Notebook'],
    keyFeatures: [
      'Implemented sequence-to-sequence summarization using the pre-trained BART-large-cnn model.',
      'Engineered a multi-stage chunking and consolidation pipeline to handle long-form documents seamlessly.',
      'Optimized tokenization and beam search parameters to reduce hallucination and enhance summary cohesion.',
      'Evaluated summary output quality using ROUGE metric benchmarks across diverse document sets.',
    ],
    outcome:
      'Built a reliable NLP pipeline capable of extracting key insights from long documents with high semantic retention.',
    icon: BrainCircuit,
    githubUrl: 'https://github.com/varan0209/bart-text-summarizer',
  },
  {
    title: 'Hyperspectral Image Classification',
    role: 'Machine Learning & AI',
    status: 'Completed',
    context: 'Deep Learning & Computer Vision Project',
    subject: 'Deep Learning & Dimensionality Reduction',
    overview:
      'Led end-to-end design of a hyperspectral image classification pipeline using 2D/3D Convolutional Neural Networks (CNNs) and Support Vector Machines (SVM).',
    technologies: ['Deep Learning', 'TensorFlow', 'SVM', '2D/3D CNNs', 'PCA', 'SVD', 'Python', 'Scikit-learn'],
    keyFeatures: [
      'Applied Principal Component Analysis (PCA) and Singular Value Decomposition (SVD) for spectral dimensionality reduction.',
      'Designed dual 2D/3D CNN architectures to extract both spatial and spectral feature maps efficiently.',
      'Benchmarked deep learning models against traditional SVM classifiers on accuracy, precision, and recall metrics.',
      'Generated data-driven trade-off reports comparing computational complexity vs. classification accuracy.',
    ],
    outcome:
      'Achieved superior classification accuracy on complex spectral bands while significantly reducing feature dimensionality.',
    icon: Cpu,
    githubUrl: 'https://github.com/varan0209/Hyperspectral-Image-Classification',
  },
  {
    title: 'Adventure Works Sales & Profit Analysis',
    role: 'Data Analyst',
    status: 'Completed',
    context: 'Data Analytics & Business Intelligence Project',
    subject: 'Sales & Financial Analytics',
    overview:
      'Analyzed $29.4M in sales across 60K orders by evaluating sales performance, profitability, customer demographics, product categories, geography, and time-based metrics.',
    technologies: ['SQL', 'Power BI', 'Tableau', 'Excel', 'MySQL', 'Stored Procedures', 'Window Functions', 'KPI Analytics'],
    keyFeatures: [
      'Evaluated $29.4M total sales across 60,000+ orders to identify key revenue drivers and profit margins.',
      'Developed advanced SQL scripts using joins, aggregations, CTEs, views, and stored procedures for data extraction.',
      'Translated complex query outputs into interactive, executive-ready Power BI, Tableau, and Excel dashboards.',
      'Provided strategic recommendations on geographical expansion and product-line profitability.',
    ],
    outcome:
      'Delivered actionable business insights that highlighted high-margin product categories and optimized sales strategy.',
    icon: BarChart3,
    githubUrl: 'https://github.com/varan0209',
  },
  {
    title: 'BookNest — Online Library Management System',
    role: 'Full Stack Web Dev',
    status: 'Completed',
    context: 'Full-Stack Web Application',
    subject: 'Web Application & Database Systems',
    overview:
      'Directed the design and development of a full-stack web application covering cataloging, user reservations, inventory management, and checkout functionality.',
    technologies: ['PHP', 'MySQL', 'JavaScript', 'HTML5/CSS3', 'Bootstrap', 'CRUD Workflows'],
    keyFeatures: [
      'Developed responsive front-end interfaces integrated with PHP backend logic and a MySQL database.',
      'Implemented complete CRUD workflows for managing book inventories, user accounts, and borrowing transactions.',
      'Enforced relational data integrity and transaction safety for reservation and return operations.',
      'Streamlined library administrative tasks, significantly improving process efficiency and data accuracy.',
    ],
    outcome:
      'Delivered an operational full-stack web system for managing academic library operations.',
    icon: Database,
    githubUrl: 'https://github.com/varan0209/BookNest',
  },
  {
    title: 'Stock Portfolio Tracker & Python Automations',
    role: 'Software Engineer',
    status: 'Completed',
    context: 'CodeAlpha Internship Project',
    subject: 'Python Automation & Financial Tools',
    overview:
      'Built a Stock Portfolio Tracker to analyze investment data and calculate profit/loss, alongside custom Python data automation scripts to eliminate manual inefficiencies.',
    technologies: ['Python', 'Pandas', 'Automation Scripts', 'Rule-Based Chatbots', 'Financial Data Processing'],
    keyFeatures: [
      'Automated repetitive data handling tasks using custom Python scripting to eliminate manual processing effort.',
      'Engineered a Stock Portfolio Tracker that parses stock transactions, tracks real-time value, and calculates ROI/P&L.',
      'Collaborated on designing a rule-based chatbot and interactive game to strengthen algorithmic logic.',
    ],
    outcome:
      'Streamlined routine data operations and built financial analytics tools during internship.',
    icon: Workflow,
    githubUrl: 'https://github.com/varan0209/CodeAlpha_python_projects',
  },
  {
    title: 'International Trade Data Analysis Pipeline',
    role: 'Data Analyst',
    status: 'Completed',
    context: 'Data Engineering & Trade Analytics',
    subject: 'Python Pipeline & Data Cleaning',
    overview:
      'Designed a Python-based data analysis pipeline to parse, clean, transform, and analyze multi-country international import/export trade datasets.',
    technologies: ['Python', 'Pandas', 'Data Cleaning', 'Data Pipeline', 'Data Visualization', 'Trade Analytics'],
    keyFeatures: [
      'Engineered data extraction and transformation functions in Python to process unstructured trade records.',
      'Handled missing values, outliers, and unit conversions across regional commodity trading codes.',
      'Generated analytical trend visualizations highlighting trade imbalances and top export sectors.',
    ],
    outcome:
      'Automated complex multi-country trade data transformation into clean, analysis-ready data tables.',
    icon: LineChart,
    githubUrl: 'https://github.com/varan0209/International-Trade-Data-Analysis-Pipeline',
  },
  {
    title: 'Zomato Sales & Rating Analysis',
    role: 'Data Analyst',
    status: 'Completed',
    context: 'Global Restaurant Performance & Customer Insights',
    subject: 'SQL Analytics & Visualization',
    overview:
      'Analyzed restaurant performance across 9,551 restaurants, 15 countries, and 141 cities to identify sales, ratings, and culinary trends.',
    technologies: ['SQL', 'Tableau', 'MySQL', 'Window Functions', 'REGEXP', 'Data Visualization'],
    keyFeatures: [
      'Processed and cleaned restaurant records spanning 9,551 establishments in 141 cities globally.',
      'Applied advanced SQL techniques including window functions, stored procedures, REGEXP, and complex joins.',
      'Discovered core drivers influencing user ratings, price ranges, online delivery adoption, and cuisine popularity.',
      'Built interactive Tableau dashboards to visually present global dining trends and market benchmarks.',
    ],
    outcome:
      'Created reusable analytical SQL queries and dashboards for multi-country market research.',
    icon: LineChart,
    githubUrl: 'https://github.com/varan0209',
  },
  {
    title: 'Blinkit Sales Performance Dashboard',
    role: 'Data Analyst',
    status: 'Completed',
    context: 'Quick-Commerce Retail Analytics',
    subject: 'Power BI & Excel BI',
    overview:
      'Analyzed $1.20M in sales across 16 item types by cleaning raw quick-commerce data in Excel and developing an interactive 5-page Power BI dashboard.',
    technologies: ['Power BI', 'Excel (Advanced)', 'DAX', 'Decomposition Tree', 'KPI Cards', 'Data Cleaning'],
    keyFeatures: [
      'Prepared, cleaned, and structured raw sales data across 16 distinct product item categories in Excel.',
      'Designed a comprehensive 5-page Power BI dashboard featuring dynamic slicers, KPI cards, and custom visuals.',
      'Utilized Decomposition Tree analysis to break down sales figures by outlet size, location type, and item fat content.',
      'Derived actionable recommendations for outlet inventory allocation and item stock optimization.',
    ],
    outcome:
      'Provided store managers with an intuitive BI tool to track $1.20M in sales and streamline outlet performance.',
    icon: BarChart3,
    githubUrl: 'https://github.com/varan0209',
  },
  {
    title: 'LeetCode Daily DSA Problem Solving',
    role: 'Software Engineer',
    status: 'Completed',
    context: 'Data Structures & Algorithms Mastery',
    subject: 'Algorithm Optimization',
    overview:
      'Maintained a structured repository of solved LeetCode Data Structures & Algorithms problems in Python focusing on optimal space/time complexity.',
    technologies: ['Python', 'Data Structures', 'Algorithms', 'Problem Solving', 'Complexity Analysis'],
    keyFeatures: [
      'Implemented solutions across arrays, dynamic programming, trees, graphs, and two-pointer algorithms.',
      'Documented approach breakdowns and edge-case handling for technical interview preparation.',
    ],
    outcome:
      'Demonstrated continuous problem-solving practice and mastery of foundational Computer Science algorithms.',
    icon: Code2,
    githubUrl: 'https://github.com/varan0209/leetcode_Daily_Question',
  },
  {
    title: 'ByteXL InfoHub Web Platform',
    role: 'Full Stack Web Dev',
    status: 'Completed',
    context: 'Educational Information Platform',
    subject: 'Web Application Design',
    overview:
      'Developed a responsive web platform to organize student learning resources, course guides, and technical information hubs.',
    technologies: ['JavaScript', 'HTML5', 'CSS3', 'Web Development', 'UI/UX Design'],
    keyFeatures: [
      'Created modular HTML/CSS layouts for intuitive navigation across academic course modules.',
      'Implemented interactive JavaScript elements for search, filtering, and responsive rendering.',
    ],
    outcome:
      'Enhanced access to learning materials through a clean, modern web interface.',
    icon: Database,
    githubUrl: 'https://github.com/varan0209/ByteXL_InfoHub_Varan',
  },
];

const getProjectTags = (project: Project) => {
  const title = project.title.toLowerCase();
  const fallbackSubject =
    title.includes('co2') || title.includes('climate') ? 'Climate Data'
      : title.includes('inpainting') ? 'Deep Learning'
        : title.includes('aviation') ? 'Safety Analytics'
          : title.includes('pintos') ? 'Operating Systems'
            : title.includes('stock market') || title.includes('movie reviews') ? 'Database Systems'
              : title.includes('penguin') || title.includes('diamonds') || title.includes('mercedes') ? 'Predictive Modeling'
                : title.includes('treasure') ? 'Reinforcement Learning'
                  : title.includes('computer vision') ? 'Vision Systems'
                    : title.includes('sentiment') ? 'NLP'
                      : title.includes('hotel') ? 'Business Analytics'
                        : title.includes('elgamal') ? 'Cryptography'
                          : title.includes('rate limiter') ? 'Backend Systems'
                            : title.includes('microservices') ? 'Distributed Systems'
                              : title.includes('streaming') ? 'Streaming Data'
                                : title.includes('lakehouse') ? 'Data Platforms'
                                  : title.includes('saas') ? 'Product Engineering'
                                    : title.includes('dashboard') ? 'Analytics Product'
                                      : title.includes('mlops') ? 'ML Systems'
                                        : title.includes('fraud') ? 'Risk Modeling'
                                          : title.includes('rag') ? 'Knowledge Systems'
                                            : title.includes('agent') ? 'AI Agents'
                                              : project.role;

  return [project.role, project.subject || fallbackSubject].filter(Boolean).slice(0, 2) as string[];
};

const priorityProjectTitles = [
  'NVIDIA NeMo Automodel — VLM Processor Artifact Serialization',
  'AquaScope — Extreme Value Theory & Hydrology Intelligence Platform',
  'Career Job Monitor — Automated SWE & AI Opportunity Engine',
  'Django-CRM — Multi-Tenant Lead Enrichment & Engine Architecture',
  'FlexMeasures — Multi-Tenant Account Role Filtering',
  'Atmospheric CO2 and LULC Modeling Pipeline',
  'Enhanced Image Inpainting With Transformer-GAN',
  'Aviation Accident Analysis: Trends, Causes, and Safety Measures',
  'timely-beliefs — BeliefSource Strict Total Ordering',
  'Pintos User Programs and System Calls',
  'Stock Market Database for Real-Time Analysis',
];

const ProjectVisual = ({ project }: { project: Project }) => {
  const [actualLoaded, setActualLoaded] = useState(false);
  const [actualFailed, setActualFailed] = useState(false);
  const defaultSrc = publicAsset(defaultProjectCover);
  const actualSrc = getProjectCoverSrc(project);
  const shouldLoadActual = actualSrc !== defaultSrc && !actualFailed;

  return (
    <div className="project-visual">
      <img
        src={defaultSrc}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 h-full w-full object-cover"
        loading="lazy"
        decoding="async"
      />
      {shouldLoadActual && (
        <img
          src={actualSrc}
          alt={`${project.title} cover`}
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${actualLoaded ? 'opacity-100' : 'opacity-0'}`}
          loading="lazy"
          decoding="async"
          onLoad={() => setActualLoaded(true)}
          onError={() => setActualFailed(true)}
        />
      )}
      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/82 to-transparent p-4">
        <div className="line-clamp-1 text-xs uppercase tracking-[0.18em] text-muted-foreground">{project.context}</div>
      </div>
    </div>
  );
};

export const Projects = () => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [selectedRole, setSelectedRole] = useState('All Projects');
  const [showAll, setShowAll] = useState(false);
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  const orderedProjects = [...projects].sort((a, b) => {
    const aPriority = priorityProjectTitles.indexOf(a.title);
    const bPriority = priorityProjectTitles.indexOf(b.title);

    if (aPriority !== -1 || bPriority !== -1) {
      return (aPriority === -1 ? priorityProjectTitles.length : aPriority)
        - (bPriority === -1 ? priorityProjectTitles.length : bPriority);
    }

    return 0;
  });

  const filteredProjects = selectedRole === 'All Projects'
    ? orderedProjects
    : orderedProjects.filter(project => project.role === selectedRole);

  const displayedProjects = showAll ? filteredProjects : filteredProjects.slice(0, 6);

  return (
    <section id="projects" className="py-24 relative" ref={ref}>
      <div className="section-container">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="max-w-3xl mx-auto text-center mb-16"
        >
          <div className="inline-block glass-card px-4 py-2 mb-4">
            <span className="text-sm text-primary font-medium">Projects</span>
          </div>
          <h2 className="font-display text-4xl sm:text-5xl font-bold mb-6">
            Selected <span className="gradient-text">Projects</span>
          </h2>
          <p className="text-lg text-muted-foreground">
            A selection of research, software, data, and AI projects that show how I approach real technical problems.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="flex flex-wrap justify-center gap-3 mb-12"
        >
          {roles.map((role) => (
            <button
              key={role}
              onClick={() => {
                setSelectedRole(role);
                setShowAll(false);
              }}
              className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all duration-300 ${
                selectedRole === role
                  ? 'bg-primary text-primary-foreground shadow-lg'
                  : 'glass-card hover:border-primary/30 text-muted-foreground hover:text-primary'
              }`}
            >
              {role}
            </button>
          ))}
        </motion.div>

        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
          {displayedProjects.map((project, index) => (
            <motion.div
              key={project.title}
              initial={{ opacity: 0, y: 30 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.6, delay: 0.06 * index }}
            >
              <Card className="glass-card floating-box border-border/50 overflow-hidden h-full group hover:border-primary/30 transition-all duration-500 hover:shadow-xl hover:shadow-primary/10">
                <ProjectVisual project={project} />

                <CardHeader>
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-2">
                      {getProjectTags(project).map((tag, tagIndex) => (
                        <Badge
                          key={`${project.title}-${tag}`}
                          className={tagIndex === 0
                            ? 'w-fit bg-primary/10 text-primary border-primary/20 hover:bg-primary/15'
                            : 'w-fit bg-secondary/70 text-muted-foreground border-border/50 hover:bg-secondary/80'
                          }
                        >
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    {project.status === 'Live' && (
                      <span className="inline-flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-300">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_12px_rgb(52_211_153)]" />
                        Live
                      </span>
                    )}
                  </div>
                  <CardTitle className="font-display text-xl leading-tight group-hover:text-primary transition-colors">
                    {project.title}
                  </CardTitle>
                  <CardDescription className="text-muted-foreground leading-relaxed">
                    {project.overview}
                  </CardDescription>
                </CardHeader>

                <CardContent className="flex-1">
                  <div className="flex flex-wrap gap-2">
                    {project.technologies.slice(0, 6).map((tag) => (
                      <span key={tag} className="skill-badge text-xs">
                        {tag}
                      </span>
                    ))}
                  </div>
                </CardContent>

                <CardFooter className="flex flex-wrap gap-3 pt-0">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex-1 min-w-32 hover:border-primary/30 hover:text-primary"
                    onClick={() => {
                      trackEvent({ action: 'open_project_details', label: project.title });
                      setActiveProject(project);
                    }}
                  >
                    More Details
                    <ChevronRight size={16} className="ml-1" />
                  </Button>
                  {project.githubUrl && (
                    <Button asChild variant="outline" size="sm" className="flex-1 min-w-28 hover:border-primary/30 hover:text-primary">
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => trackEvent({ action: 'open_project_code', label: project.title })}
                      >
                        <Github size={16} className="mr-2" />
                        Code
                      </a>
                    </Button>
                  )}
                  {project.demoUrl && (
                    <Button asChild size="sm" className="flex-1 min-w-28 btn-primary">
                      <a
                        href={project.demoUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => trackEvent({ action: 'open_project_live', label: project.title })}
                      >
                        <ExternalLink size={16} className="mr-2" />
                        Demo
                      </a>
                    </Button>
                  )}
                </CardFooter>
              </Card>
            </motion.div>
          ))}
        </div>

        {filteredProjects.length > 6 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-center mt-12"
          >
            <button
              onClick={() => setShowAll(!showAll)}
              className="btn-secondary inline-flex items-center gap-2"
            >
              {showAll ? 'Show Less' : `View ${filteredProjects.length - displayedProjects.length} More`}
              <ChevronRight size={18} className={`transition-transform ${showAll ? 'rotate-90' : ''}`} />
            </button>
          </motion.div>
        )}
      </div>

      {activeProject && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center px-4 py-8">
          <button
            type="button"
            className="absolute inset-0 bg-background/80 backdrop-blur-md"
            onClick={() => setActiveProject(null)}
            aria-label="Close project details"
          />
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.25 }}
            className="glass-card relative max-h-[88vh] w-full max-w-4xl overflow-y-auto p-6 sm:p-8"
            role="dialog"
            aria-modal="true"
            aria-labelledby="project-modal-title"
          >
            <button
              type="button"
              onClick={() => setActiveProject(null)}
              className="absolute right-4 top-4 rounded-full border border-border/60 bg-background/60 p-2 text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
              aria-label="Close"
            >
              <X size={18} />
            </button>

            <div className="mb-8 pr-10">
              <div className="mb-4 flex flex-wrap items-center gap-3">
                <Badge className="bg-primary/10 text-primary border-primary/20">{activeProject.role}</Badge>
                <span className="text-sm text-muted-foreground">{activeProject.context}</span>
              </div>
              <h3 id="project-modal-title" className="font-display text-3xl font-bold mb-4">
                {activeProject.title}
              </h3>
            </div>

            <div className="mb-6 rounded-2xl border border-border/40 bg-background/35 p-5">
              <h4 className="font-display text-lg font-semibold mb-3 text-primary">Overview</h4>
              <p className="text-sm leading-relaxed text-muted-foreground">{activeProject.overview}</p>
            </div>

            <div className="grid md:grid-cols-[0.9fr_1.1fr] gap-6">
              <div className="rounded-2xl border border-border/40 bg-background/35 p-5">
                <h4 className="font-display text-lg font-semibold mb-4 text-primary">Technologies</h4>
                <div className="flex flex-wrap gap-2">
                  {activeProject.technologies.map((tech) => (
                    <span key={tech} className="skill-badge text-xs">{tech}</span>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-border/40 bg-background/35 p-5">
                <h4 className="font-display text-lg font-semibold mb-4 text-primary">Key Features</h4>
                <ul className="space-y-3">
                  {activeProject.keyFeatures.map((feature) => (
                    <li key={feature} className="flex gap-3 text-sm text-muted-foreground">
                      <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-border/40 bg-background/35 p-5">
              <h4 className="font-display text-lg font-semibold mb-3 text-primary">Outcome / What I Learned</h4>
              <p className="text-sm leading-relaxed text-muted-foreground">{activeProject.outcome}</p>
            </div>
          </motion.div>
        </div>
      )}
    </section>
  );
};
