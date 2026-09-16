export type PortfolioSection =
  | 'hero'
  | 'about'
  | 'skills'
  | 'projects'
  | 'experience'
  | 'resume'
  | 'education'
  | 'growth'
  | 'credibility'
  | 'leadership'
  | 'contact';

export type PortfolioKnowledgeItem = {
  id: string;
  title: string;
  section: PortfolioSection;
  roleTags: string[];
  skillTags: string[];
  summary: string;
  details: string[];
  href: string;
};

export const portfolioKnowledge: PortfolioKnowledgeItem[] = [
  {
    id: 'profile-overview',
    title: 'Varan Mamidala Profile Overview',
    section: 'about',
    roleTags: ['Data Analyst', 'Software Engineer', 'Python & SQL Developer', 'Power BI Specialist', 'Full Stack Web Developer'],
    skillTags: ['Data Analytics', 'Python', 'SQL', 'Power BI', 'Tableau', 'Excel', 'Web Development', 'Machine Learning', 'NLP'],
    summary:
      'Varan Mamidala is a B.Tech Computer Science graduate from GITAM with hands-on experience in Python, SQL, Power BI, Tableau, Excel, machine learning, and full-stack web development.',
    details: [
      'Experienced in building business-focused analytics projects using SQL, Power BI, Tableau, and Excel to analyze sales, restaurant, and operational datasets.',
      'Experienced in Python automation, machine learning models (BART, 2D/3D CNNs, SVM, PCA/SVD), and full-stack web development (PHP, MySQL, JavaScript).',
      'Completed software and web development internships at CodeAlpha, ColourMoon Technologies, and Prodigy Infotech.',
      'Based in Hyderabad, Telangana, India and open to meaningful opportunities as a Data Analyst or Software Engineer.',
    ],
    href: '#about',
  },
  {
    id: 'open-to-work',
    title: 'Open to Opportunities',
    section: 'hero',
    roleTags: ['Recruiter', 'Hiring Manager'],
    skillTags: ['open to opportunities', 'Hyderabad', 'India', 'Remote'],
    summary: 'Varan is open to full-time Data Analyst and Software Engineer opportunities.',
    details: [
      'Located in Hyderabad, Telangana, India.',
      'Contact email: varan4636@gmail.com | Phone: +91 9398626446.',
    ],
    href: '#hero',
  },
  {
    id: 'project-adventure-works',
    title: 'Adventure Works Sales & Profit Analysis',
    section: 'projects',
    roleTags: ['Data Analyst', 'Business Analyst', 'BI Developer'],
    skillTags: ['SQL', 'Power BI', 'Tableau', 'Excel', 'KPI Analysis', 'Data Visualization', 'Stored Procedures', 'Joins'],
    summary:
      'Analyzed $29.4M in sales across 60K orders by evaluating sales, profitability, customers, products, geography, and time-based performance.',
    details: [
      'Developed business-focused SQL analysis using joins, aggregations, views, and stored procedures.',
      'Translated analytical findings into interactive Power BI, Tableau, and Excel dashboards to support data-driven business decisions.',
    ],
    href: '#projects',
  },
  {
    id: 'project-text-summarization',
    title: 'Text Summarization Model (BART-large-cnn)',
    section: 'projects',
    roleTags: ['Software Engineer', 'AI Engineer', 'NLP Developer'],
    skillTags: ['NLP', 'Python', 'Hugging Face Transformers', 'BART', 'Deep Learning', 'Pipeline Design'],
    summary:
      'Independently designed an AI-powered text summarization solution using the BART-large-cnn model for short- and long-form content.',
    details: [
      'Engineered a multi-stage pipeline to chunk, summarize, and consolidate lengthy documents into cohesive, readable outputs.',
      'Demonstrated strong process-design skills and mastery of transformer models.',
    ],
    href: '#projects',
  },
  {
    id: 'project-zomato-analytics',
    title: 'Zomato Sales & Rating Analysis',
    section: 'projects',
    roleTags: ['Data Analyst', 'SQL Specialist', 'BI Developer'],
    skillTags: ['SQL', 'Tableau', 'Window Functions', 'MySQL', 'Data Analytics', 'Restaurant Trends'],
    summary:
      'Analyzed restaurant performance across 9,551 restaurants, 15 countries, and 141 cities to identify sales, ratings, and business trends.',
    details: [
      'Applied advanced SQL techniques including stored procedures, window functions, joins, and aggregations to generate reusable analytical insights.',
      'Supported interactive Tableau visualizations for executive performance review.',
    ],
    href: '#projects',
  },
  {
    id: 'project-hyperspectral-classification',
    title: 'Hyperspectral Image Classification',
    section: 'projects',
    roleTags: ['Software Engineer', 'Machine Learning Engineer', 'Computer Vision'],
    skillTags: ['Deep Learning', 'TensorFlow', 'SVM', '2D/3D CNNs', 'PCA', 'SVD', 'Python'],
    summary:
      'Led end-to-end design of a hyperspectral image classification model using 2D/3D CNNs and SVM, applying PCA/SVD for dimensionality reduction.',
    details: [
      'Benchmarked deep learning vs. traditional machine learning approaches across accuracy, precision, and recall.',
      'Delivered a data-driven performance comparison report.',
    ],
    href: '#projects',
  },
  {
    id: 'project-trade-pipeline',
    title: 'International Trade Data Analysis Pipeline',
    section: 'projects',
    roleTags: ['Data Analyst', 'Data Engineer'],
    skillTags: ['Python', 'Pandas', 'Data Pipeline', 'Trade Analytics', 'Data Visualization'],
    summary:
      'Designed a Python-based data analysis pipeline to parse, clean, transform, and analyze multi-country international import/export trade datasets.',
    details: [
      'Handled data cleaning, unit conversions, and regional commodity trading codes.',
      'GitHub repository: https://github.com/varan0209/International-Trade-Data-Analysis-Pipeline',
    ],
    href: '#projects',
  },
  {
    id: 'project-codealpha-python',
    title: 'Stock Portfolio Tracker & Python Automations',
    section: 'projects',
    roleTags: ['Software Engineer', 'Python Developer'],
    skillTags: ['Python', 'Pandas', 'Financial Analytics', 'Automation Scripts'],
    summary:
      'Built a Stock Portfolio Tracker to analyze investment data and calculate profit/loss, alongside custom Python data automation scripts.',
    details: [
      'Automated repetitive data handling tasks and designed financial ROI calculations during CodeAlpha internship.',
      'GitHub repository: https://github.com/varan0209/CodeAlpha_python_projects',
    ],
    href: '#projects',
  },
  {
    id: 'project-booknest',
    title: 'BookNest — Online Library Management System',
    section: 'projects',
    roleTags: ['Full Stack Web Dev', 'Software Engineer'],
    skillTags: ['PHP', 'MySQL', 'JavaScript', 'HTML5/CSS3', 'CRUD Workflows'],
    summary:
      'Full-stack web application covering book cataloging, user reservations, inventory management, and checkout functionality.',
    details: [
      'Implemented full CRUD workflows for administrative and borrowing operations.',
      'GitHub repository: https://github.com/varan0209/BookNest',
    ],
    href: '#projects',
  },
  {
    id: 'project-text-summarizer-repo',
    title: 'BART Text Summarizer',
    section: 'projects',
    roleTags: ['Machine Learning Engineer', 'NLP Developer'],
    skillTags: ['NLP', 'Python', 'BART', 'Transformers', 'PyTorch'],
    summary:
      'AI-powered text summarization model utilizing pre-trained BART-large-cnn for document summarization.',
    details: [
      'Multi-stage text chunking and consolidation pipeline for long-form content.',
      'GitHub repository: https://github.com/varan0209/bart-text-summarizer',
    ],
    href: '#projects',
  },
  {
    id: 'project-hyperspectral-repo',
    title: 'Hyperspectral Image Classification',
    section: 'projects',
    roleTags: ['Machine Learning Engineer', 'Computer Vision'],
    skillTags: ['Deep Learning', 'TensorFlow', '2D/3D CNNs', 'PCA', 'SVM'],
    summary:
      'Hyperspectral image classification model using 2D/3D CNNs and Support Vector Machines with PCA dimensionality reduction.',
    details: [
      'Benchmarked deep learning vs. traditional ML algorithms on accuracy and feature reduction.',
      'GitHub repository: https://github.com/varan0209/Hyperspectral-Image-Classification',
    ],
    href: '#projects',
  },
  {
    id: 'project-blinkit-dashboard',
    title: 'Blinkit Sales Performance Dashboard',
    section: 'projects',
    roleTags: ['Data Analyst', 'Power BI Developer'],
    skillTags: ['Power BI', 'Excel', 'KPI Cards', 'Decomposition Tree', 'Data Cleaning', 'Outlet Performance'],
    summary:
      'Analyzed $1.20M in sales across 16 item types by cleaning and preparing sales data in Excel and developing a 5-page Power BI dashboard.',
    details: [
      'Used KPI cards, interactive visualizations, and decomposition-tree analysis to evaluate product and outlet performance.',
      'Derived business-focused recommendations for retail optimization.',
    ],
    href: '#projects',
  },
  {
    id: 'project-library-management',
    title: 'Online Library Management System',
    section: 'projects',
    roleTags: ['Software Engineer', 'Full Stack Developer', 'Web Developer'],
    skillTags: ['PHP', 'MySQL', 'JavaScript', 'HTML/CSS', 'CRUD', 'Full Stack'],
    summary:
      'Directed the design and development of a full-stack web application covering cataloging, reservations, and checkout functionality.',
    details: [
      'Implemented complete CRUD workflows for resource, user, and transaction management.',
      'Improved data accuracy and administrative process efficiency.',
    ],
    href: '#projects',
  },
  {
    id: 'experience-codealpha',
    title: 'Python Programming Intern at CodeAlpha',
    section: 'experience',
    roleTags: ['Python Developer', 'Software Engineer', 'Data Analyst'],
    skillTags: ['Python', 'Automation', 'Financial Analytics', 'Rule-based Chatbots', 'Pandas'],
    summary:
      'Developed Python automation scripts, a Stock Portfolio Tracker, a rule-based chatbot, and an interactive game during a remote internship at CodeAlpha.',
    details: [
      'Identified repetitive data-handling inefficiencies and built Python automation scripts to streamline routine processes.',
      'Designed a Stock Portfolio Tracker to analyze investment data and calculate profit/loss, supporting data-driven decision-making.',
      'Collaborated with mentors and peers to build a rule-based chatbot and interactive game.',
    ],
    href: '#experience',
  },
  {
    id: 'experience-colourmoon',
    title: 'Web Development Intern at ColourMoon Technologies',
    section: 'experience',
    roleTags: ['Software Engineer', 'Web Developer', 'Front-End Developer'],
    skillTags: ['HTML/CSS', 'JavaScript', 'PHP', 'Authentication', 'Shopping Cart', 'API Integration'],
    summary:
      'Built responsive front-end applications for a school management system, an e-commerce platform, and a food delivery platform as part of a development team.',
    details: [
      'Implemented user authentication, shopping cart, order tracking, and API integration features.',
      'Improved application functionality, user workflows, and real-time performance.',
    ],
    href: '#experience',
  },
  {
    id: 'experience-prodigy',
    title: 'Web Development Intern at Prodigy Infotech (MSME)',
    section: 'experience',
    roleTags: ['Software Engineer', 'Web Developer', 'Full Stack Developer'],
    skillTags: ['PHP', 'MySQL', 'JavaScript', 'HTML/CSS', 'Full-Stack Web Development'],
    summary:
      'Delivered a responsive full-stack web application, integrating front-end interfaces with PHP-based backend logic and MySQL database.',
    details: [
      'Contributed across requirements analysis, design, development, and deployment.',
      'Gained end-to-end software development and delivery exposure.',
    ],
    href: '#experience',
  },
  {
    id: 'education-gitam',
    title: 'B.Tech in Computer Science and Engineering at GITAM',
    section: 'education',
    roleTags: ['Software Engineer', 'Data Analyst', 'Computer Science Graduate'],
    skillTags: ['Computer Science', 'Python', 'SQL', 'Data Analytics', 'Software Engineering'],
    summary:
      'Completed Bachelor of Technology (B.Tech) in Computer Science and Engineering from Gandhi Institute of Technology and Management (GITAM), Visakhapatnam, AP, India (2021 – 2025).',
    details: [
      'Coursework and academic foundation in Computer Science, Data Analysis, Software Engineering, Database Systems, and Web Technologies.',
      'Accompanied by certifications in Data Analytics Essentials (Cisco) and CCBP 4.0 Mega Workshops.',
    ],
    href: '#education',
  },
  {
    id: 'contact-info',
    title: 'Contact Information',
    section: 'contact',
    roleTags: ['Recruiter', 'Hiring Manager'],
    skillTags: ['Contact', 'Email', 'Phone', 'Hyderabad', 'LinkedIn', 'GitHub'],
    summary: 'Reach out to Varan Mamidala for Data Analyst or Software Engineer roles.',
    details: [
      'Email: varan4636@gmail.com',
      'Phone: +91 9398626446',
      'Location: Hyderabad, Telangana, India',
      'GitHub: https://github.com/varan0209',
      'LinkedIn: https://www.linkedin.com/in/varan-mamidala-2b950b261/',
    ],
    href: '#contact',
  },
];

export const suggestedPortfolioQuestions = [
  "Why is Varan a strong Data Analyst candidate?",
  "Why is Varan a strong Software Engineer candidate?",
  "Which projects feature Power BI and SQL analytics?",
  "Which projects feature Machine Learning and NLP?",
  "What experience does he have with web development?",
  "How can I contact Varan?",
];

const normalize = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9+#.\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

const tokenize = (value: string) =>
  normalize(value)
    .split(' ')
    .filter((token) => token.length > 1);

export const getKnowledgeText = (item: PortfolioKnowledgeItem) =>
  [
    item.title,
    item.section,
    item.roleTags.join(' '),
    item.skillTags.join(' '),
    item.summary,
    item.details.join(' '),
  ].join(' ');

export const retrievePortfolioKnowledge = (
  query: string,
  options: { mode?: 'general' | 'role_match' | 'project_recommendation'; selectedRole?: string; limit?: number } = {},
) => {
  const queryTokens = tokenize(`${query} ${options.selectedRole || ''}`);
  const querySet = new Set(queryTokens);
  const mode = options.mode || 'general';
  const selectedRole = normalize(options.selectedRole || '');

  return portfolioKnowledge
    .map((item) => {
      const haystack = normalize(getKnowledgeText(item));
      const haystackTokens = new Set(tokenize(haystack));
      let score = 0;

      querySet.forEach((token) => {
        if (haystackTokens.has(token)) score += 3;
        if (haystack.includes(token)) score += 1;
      });

      if (selectedRole && item.roleTags.some((role) => normalize(role).includes(selectedRole))) score += 8;
      if (mode === 'role_match' && item.section !== 'contact') score += item.roleTags.length;
      if (mode === 'project_recommendation' && item.section === 'projects') score += 8;
      if (item.section === 'contact' && /contact|email|phone|hyderabad/.test(normalize(query))) score += 12;

      return { item, score };
    })
    .filter(({ score }) => score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, options.limit || 7);
};

export const buildLocalPortfolioAnswer = (
  message: string,
  matches: ReturnType<typeof retrievePortfolioKnowledge>,
  options: { selectedRole?: string } = {},
) => {
  if (!message.trim()) {
    return "Ask me about Varan's Data Analytics projects, Software Engineering projects, skills, education, or contact details.";
  }

  if (matches.length === 0) {
    return "I don't have enough portfolio evidence to answer that. Try asking about Varan's Power BI dashboards, SQL analytics, BART summarization model, or web development internships.";
  }

  const top = matches.slice(0, 3).map(({ item }) => item);
  const rolePrefix = options.selectedRole ? `For ${options.selectedRole}, ` : '';
  const evidence = top
    .map((item) => `${item.title}: ${item.summary}`)
    .join(' ');

  return `${rolePrefix}${evidence} You can view more in the cited portfolio sections.`;
};
