"use strict";

const STORAGE_KEY = "optJobCommandCenterPrefs";
const THEME_KEY = "optJobCommandCenterTheme";
const COMPANY_VAULT_KEY = "optJobCommandCenterCompanyVault";
const COMPANY_VAULT_BACKUP_KEY = "optJobCommandCenterCompanyVaultBackup";
const PROTECTED_LOCAL_STORAGE_PATTERN = /opt.*job.*command|job.*command.*center|company.*vault|career.*link/i;
const ALL_COMPANIES_ID = "__all_companies__";
const DEFAULT_PROFILE_ID = "softwareAiDataEntryOpt";
const DEFAULT_ROLE_PACK_ID = "all-role-families";
const CAUTION_EXCLUDE_TERMS = ["unpaid", "commission only", "clearance", "US citizenship required", "must be a US citizen"];
const MINUTE_SIGNAL_TIMES = new Set(["5minutes", "10minutes", "15minutes", "30minutes", "45minutes"]);
const COMPANY_LIST_BATCH_SIZE = 120;

const CATEGORY_ROWS = [
  ["top", "Top Sources", true],
  ["direct", "Direct ATS", true],
  ["extraAts", "Extra ATS", false],
  ["signals", "LinkedIn Signals", true],
  ["general", "General Boards", true],
  ["moreBoards", "More Job Boards", true],
  ["tech", "Tech and Startups", true],
  ["remoteBoards", "Remote / Flexible Boards", false],
  ["publicBoards", "Public / Nonprofit Boards", false],
  ["company", "Company Careers", true],
  ["highered", "Higher Ed / Research Employers", true],
  ["research", "Research Tools", false]
];

const CATEGORIES = CATEGORY_ROWS.map(([id, label, checked]) => ({ id, label, checked }));
const CATEGORY_LABELS = Object.fromEntries(CATEGORIES.map(category => [category.id, category.label]));
const DEFAULT_CATEGORY_IDS = CATEGORIES.filter(category => category.checked).map(category => category.id);

const SEARCH_PROFILES = [
  {
    id: "softwareAiDataEntryOpt",
    label: "Software / AI / Data - Entry OPT",
    description: "Personal default for US-wide entry/new-grad software, AI, and data searches. Keeps coverage broad and uses OPT/sponsor wording as companion research.",
    defaults: { time: "all", sort: "coverage", authorization: "none", experience: "entry", rolePack: "all-role-families", precision: "coverage", matchMode: "smart", queryStyle: "balanced" },
    categories: DEFAULT_CATEGORY_IDS
  },
  {
    id: "minuteRadar",
    label: "Minute Radar",
    description: "Highest-urgency scan for jobs that may have appeared minutes ago. Uses Google minute-signal wording plus each board's closest reliable native freshness filter.",
    defaults: { engine: "google", time: "15minutes", sort: "latest", authorization: "none", experience: "entry", rolePack: "all-role-families", precision: "minuteRadar", matchMode: "smart", queryStyle: "balanced" },
    categories: ["top", "direct", "signals", "general", "tech", "company"],
    portals: ["linkedinJobs", "google", "directATS", "linkedinPosts", "indeed", "dice", "glassdoor", "ziprecruiter", "builtin", "simplify", "hiringCafe"]
  },
  {
    id: "latest1",
    label: "Latest 1h",
    description: "Urgent apply flow for postings from the last hour on sources with reliable date filters.",
    defaults: { engine: "google", time: "1hour", sort: "latest", authorization: "none", experience: "entry", rolePack: "all-role-families", precision: "latest1", matchMode: "smart", queryStyle: "balanced" },
    categories: ["top", "direct", "signals", "general", "moreBoards", "tech", "company"]
  },
  {
    id: "dailyQuickApply",
    label: "Daily Quick Apply",
    description: "Focused daily flow: the highest-yield apply sources, newest-first within the past 24 hours.",
    defaults: { engine: "google", time: "24hours", sort: "latest", authorization: "none", precision: "latest24", matchMode: "smart", queryStyle: "balanced" },
    categories: ["top", "direct", "signals", "general", "tech"],
    portals: ["linkedinJobs", "indeed", "directATS", "linkedinPosts", "google", "simplify", "hiringCafe", "builtin", "dice", "glassdoor", "ziprecruiter", "getwork"]
  },
  {
    id: "bestJobBoards",
    label: "Best Job Boards",
    description: "Most-used US job boards and job-finding sources, ordered for broad coverage without forcing remote-only or public-sector boards.",
    defaults: { engine: "google", time: "24hours", sort: "latest", authorization: "none", experience: "entry", rolePack: "all-role-families", precision: "coverage", matchMode: "smart", queryStyle: "balanced" },
    categories: ["top", "signals", "general", "moreBoards", "tech", "direct", "company"]
  },
  {
    id: "freshDirect",
    label: "Fresh Direct ATS",
    description: "Direct employer and ATS-first search for new postings before they fully spread across aggregators.",
    defaults: { engine: "google", time: "1hour", sort: "direct", authorization: "none", experience: "entry", rolePack: "all-role-families", precision: "direct", matchMode: "smart", queryStyle: "balanced" },
    categories: ["top", "direct", "company"]
  },
  {
    id: "maxCoverage",
    label: "Max Coverage",
    description: "Broadest US search. Keeps authorization filters off so useful results are not hidden.",
    defaults: { time: "all", sort: "coverage", authorization: "none", precision: "coverage" },
    categories: DEFAULT_CATEGORY_IDS
  },
  {
    id: "latest24",
    label: "Latest 24h",
    description: "Newest-first links for daily searching across the most active job sources.",
    defaults: { time: "24hours", sort: "latest", authorization: "none", precision: "latest24" },
    categories: DEFAULT_CATEGORY_IDS
  },
  {
    id: "optFriendly",
    label: "OPT Friendly",
    description: "Adds OPT, STEM OPT, E-Verify, sponsorship, and US work authorization terms.",
    defaults: { time: "week", sort: "recommended", authorization: "optBroad", precision: "optSponsor" },
    categories: ["top", "direct", "signals", "general", "moreBoards", "tech", "company"]
  },
  {
    id: "sponsorResearch",
    label: "Sponsor Research",
    description: "Focuses on sponsorship signals, H-1B history, E-Verify, and employer research.",
    defaults: { time: "month", sort: "coverage", authorization: "sponsorNeeded", precision: "optSponsor" },
    categories: ["top", "direct", "company", "research"]
  },
  {
    id: "directATS",
    label: "Direct ATS",
    description: "Prioritizes direct application pages and common ATS systems.",
    defaults: { time: "week", sort: "direct", authorization: "none", precision: "direct" },
    categories: ["top", "direct", "company"]
  },
  {
    id: "linkedinPosts",
    label: "LinkedIn Posts",
    description: "Surfaces fresh recruiter and hiring-manager posts using LinkedIn content search.",
    defaults: { time: "24hours", sort: "latest", authorization: "none", precision: "latest24" },
    categories: ["top", "signals"]
  }
];

let PROFILE_LABELS = Object.fromEntries(SEARCH_PROFILES.map(profile => [profile.id, profile.label]));

SEARCH_PROFILES.splice(4, 0, {
  id: "fastApplyRoutine",
  label: "Fast Apply Routine",
  description: "Fastest daily apply path: newest high-value sources first, compact native-board queries, and direct apply links before broad coverage.",
  defaults: { engine: "google", time: "1hour", sort: "latest", authorization: "none", experience: "entry", rolePack: "all-role-families", precision: "latest1", matchMode: "smart", queryStyle: "balanced" },
  categories: ["top", "direct", "signals", "general", "tech"],
  portals: ["linkedinJobs", "indeed", "directATS", "linkedinPosts", "google", "simplify", "hiringCafe", "builtin", "dice", "getwork", "glassdoor", "ziprecruiter"]
});

const DAILY_CHECKLIST_ITEMS = [
  { id: "latest1", label: "Latest 1h", action: "latest1", note: "Newest reliable native filters first.", cta: "Run" },
  { id: "fastApply", label: "Fast Apply Routine", action: "fastApplyRoutine", note: "High-value quick apply sources.", cta: "Run" },
  { id: "favoriteCompanies", label: "Favorite Companies", target: "favoriteCompaniesPanel", note: "Open saved target-company packs.", cta: "Open" },
  { id: "h1bApplyFirst", label: "H1B Apply First", href: "h1b-intelligence/?h1bTab=applyFirst", note: "Use workbook-backed sponsor targets.", cta: "Open" },
  { id: "vendorOutreach", label: "Vendor Outreach", target: "vendorHeading", note: "Contact staffing vendors safely.", cta: "Open" },
  { id: "optResources", label: "OPT/Safety Check", target: "resourcesHeading", note: "Verify work authorization and scam signals.", cta: "Open" }
];

const SEARCH_PRESETS = [
  { id: "backend", label: "Backend", jobTitle: "Backend Engineer", rolePack: "backend", profile: "fastApplyRoutine", time: "1hour", sort: "latest", groups: ["top", "direct", "signals", "general", "tech"] },
  { id: "full-stack", label: "Full Stack", jobTitle: "Full Stack Engineer", rolePack: "full-stack", profile: "fastApplyRoutine", time: "1hour", sort: "latest", groups: ["top", "direct", "signals", "general", "tech"] },
  { id: "ai-ml", label: "AI / ML", jobTitle: "Machine Learning Engineer", rolePack: "ai-ml", profile: "fastApplyRoutine", time: "1hour", sort: "latest", groups: ["top", "direct", "signals", "general", "tech"] },
  { id: "data-analyst", label: "Data Analyst", jobTitle: "Data Analyst", rolePack: "data-analytics", profile: "fastApplyRoutine", time: "1hour", sort: "latest", groups: ["top", "direct", "signals", "general", "moreBoards", "tech"] },
  { id: "data-engineer", label: "Data Engineer", jobTitle: "Data Engineer", rolePack: "data-engineer", profile: "fastApplyRoutine", time: "1hour", sort: "latest", groups: ["top", "direct", "signals", "general", "tech"] },
  { id: "new-grad-software", label: "New Grad Software", jobTitle: "Software Engineer", rolePack: "new-grad-software", profile: "fastApplyRoutine", time: "24hours", sort: "latest", groups: ["top", "direct", "signals", "general", "tech"] }
];

const SEARCH_PRESET_LABELS = Object.fromEntries(SEARCH_PRESETS.map(preset => [preset.id, preset.label]));

PROFILE_LABELS = Object.fromEntries(SEARCH_PROFILES.map(profile => [profile.id, profile.label]));

const PORTAL_ROWS = [
  { id: "linkedinJobs", name: "LinkedIn Jobs", category: "top", native: "linkedinJobs", sites: ["linkedin.com/jobs"], priority: 100, tags: ["native filters", "high reach"], note: "Uses LinkedIn date, experience, job type, work setting, and newest-first filters when selected." },
  { id: "indeed", name: "Indeed", category: "top", native: "indeed", sites: ["indeed.com/jobs"], priority: 99, tags: ["native filters", "high reach"], note: "Uses Indeed query, location, date, remote, and newest sorting when selected." },
  { id: "directATS", name: "Direct ATS Search", category: "direct", rawSiteQuery: "(site:greenhouse.io OR site:lever.co OR site:ashbyhq.com OR site:myworkdayjobs.com OR site:jobs.smartrecruiters.com OR site:icims.com)", priority: 98, tags: ["direct apply", "ATS"], note: "Short high-use ATS bundle. Extra ATS engines are available as an optional source group." },
  { id: "linkedinPosts", name: "LinkedIn Posts", category: "signals", native: "linkedinPosts", sites: ["linkedin.com/search/results/content"], priority: 97, tags: ["hiring posts", "fresh"], note: "Uses LinkedIn content search with hiring keywords and date-posted sorting." },
  { id: "google", name: "Google Jobs Web Search", category: "top", native: "google", priority: 96, tags: ["broad web", "date tools"], note: "Broad Google query across job posts, career pages, and hiring pages." },
  { id: "glassdoor", name: "Glassdoor", category: "general", native: "glassdoor", sites: ["glassdoor.com/Job", "glassdoor.com/job-listing"], priority: 95, tags: ["salary context", "native date filter"] },
  { id: "ziprecruiter", name: "ZipRecruiter", category: "general", native: "ziprecruiter", sites: ["ziprecruiter.com/jobs"], priority: 94, tags: ["general board"] },
  { id: "dice", name: "Dice", category: "general", native: "dice", sites: ["dice.com/jobs"], priority: 93, tags: ["tech board"] },
  { id: "builtin", name: "Built In", category: "tech", native: "builtin", sites: ["builtin.com/jobs", "builtin.com/job"], priority: 92, tags: ["tech cities"] },
  { id: "handshake", name: "Handshake", category: "general", sites: ["joinhandshake.com", "app.joinhandshake.com"], priority: 91, tags: ["students", "new grad"] },
  { id: "simplify", name: "Simplify", category: "tech", native: "simplify", sites: ["simplify.jobs"], priority: 90, tags: ["new grad", "tech"] },
  { id: "hiringCafe", name: "HiringCafe", category: "tech", sites: ["hiring.cafe"], priority: 89, tags: ["fresh listings"] },
  { id: "wellfound", name: "Wellfound", category: "tech", sites: ["wellfound.com/jobs"], priority: 88, tags: ["startups"] },
  { id: "yc", name: "Y Combinator Jobs", category: "tech", native: "yc", sites: ["ycombinator.com/jobs", "workatastartup.com/jobs"], priority: 87, tags: ["startups"] },
  { id: "levels", name: "Levels.fyi Jobs", category: "tech", native: "levels", sites: ["levels.fyi/jobs"], priority: 86, tags: ["tech pay"] },
  { id: "welcome", name: "Welcome to the Jungle", category: "tech", native: "welcome", sites: ["welcometothejungle.com/en/jobs"], priority: 85, tags: ["startups"] },
  { id: "ripplematch", name: "RippleMatch", category: "general", sites: ["ripplematch.com/careers"], priority: 84, tags: ["early career"] },
  { id: "wayup", name: "WayUp", category: "general", sites: ["wayup.com/s/jobs"], priority: 83, tags: ["students"] },
  { id: "monster", name: "Monster", category: "moreBoards", native: "monster", sites: ["monster.com/jobs", "monster.com/job-openings"], priority: 82, tags: ["major board", "broad"] },
  { id: "careerbuilder", name: "CareerBuilder", category: "moreBoards", native: "careerbuilder", sites: ["careerbuilder.com/jobs", "careerbuilder.com/job"], priority: 81, tags: ["major board", "broad"] },
  { id: "flexjobs", name: "FlexJobs", category: "moreBoards", native: "flexjobs", sites: ["flexjobs.com/search"], priority: 80.8, tags: ["flexible", "remote", "major board"], note: "Useful for remote/flexible jobs; verify OPT and employer details before applying." },
  { id: "getwork", name: "Getwork", category: "moreBoards", native: "getwork", sites: ["getwork.com"], priority: 80.6, tags: ["aggregator", "company feeds"] },
  { id: "simplyhired", name: "SimplyHired", category: "moreBoards", native: "simplyhired", sites: ["simplyhired.com/search"], priority: 80.4, tags: ["aggregator", "broad"] },
  { id: "talentCom", name: "Talent.com", category: "moreBoards", native: "talentCom", sites: ["talent.com/jobs"], priority: 80.2, tags: ["aggregator", "broad"] },
  { id: "theMuse", name: "The Muse", category: "moreBoards", native: "theMuse", sites: ["themuse.com/search"], priority: 80, tags: ["company profiles", "broad"] },
  { id: "adzuna", name: "Adzuna", category: "moreBoards", native: "adzuna", sites: ["adzuna.com/search"], priority: 79.8, tags: ["aggregator", "broad"] },
  { id: "jora", name: "Jora", category: "moreBoards", native: "jora", sites: ["us.jora.com/jobs"], priority: 79.6, tags: ["aggregator", "broad"] },
  { id: "jooble", name: "Jooble", category: "moreBoards", native: "jooble", sites: ["jooble.org"], priority: 79.4, tags: ["aggregator", "broad"] },
  { id: "nexxt", name: "Nexxt", category: "moreBoards", native: "nexxt", sites: ["nexxt.com/jobs"], priority: 79.2, tags: ["aggregator", "broad"] },
  { id: "snagajob", name: "Snagajob", category: "moreBoards", native: "snagajob", sites: ["snagajob.com/search"], priority: 79, tags: ["hourly", "broad"] },
  { id: "ladders", name: "Ladders", category: "moreBoards", native: "ladders", sites: ["theladders.com/jobs"], priority: 78.8, tags: ["senior leaning", "broad"], note: "More senior-leaning, but kept available for sponsor/company discovery." },
  { id: "jobcase", name: "Jobcase", category: "moreBoards", sites: ["jobcase.com/jobs"], priority: 78.6, tags: ["community", "broad"] },
  { id: "collegeRecruiter", name: "College Recruiter", category: "general", sites: ["collegerecruiter.com"], priority: 78.4, tags: ["students", "entry level"] },
  { id: "hired", name: "Hired", category: "tech", sites: ["hired.com"], priority: 78.2, tags: ["tech marketplace"] },
  { id: "startupJobs", name: "Startup Jobs", category: "tech", native: "startupJobs", sites: ["startup.jobs"], priority: 78, tags: ["startups"] },
  { id: "remoteRocketship", name: "Remote Rocketship", category: "remoteBoards", sites: ["remoterocketship.com"], priority: 77.8, tags: ["remote", "optional"] },
  { id: "weworkremotely", name: "We Work Remotely", category: "remoteBoards", native: "weworkremotely", sites: ["weworkremotely.com/remote-jobs"], priority: 77.6, tags: ["remote", "optional"] },
  { id: "remotive", name: "Remotive", category: "remoteBoards", native: "remotive", sites: ["remotive.com/remote-jobs"], priority: 77.4, tags: ["remote", "optional"] },
  { id: "remoteok", name: "RemoteOK", category: "remoteBoards", sites: ["remoteok.com"], priority: 77.2, tags: ["remote", "optional"] },
  { id: "careerOneStop", name: "CareerOneStop Job Finder", category: "publicBoards", sites: ["careeronestop.org"], priority: 77, tags: ["official", "job finder"] },
  { id: "usajobs", name: "USAJOBS", category: "publicBoards", native: "usajobs", sites: ["usajobs.gov/Search/Results"], priority: 76.8, tags: ["federal", "public"], note: "Many federal jobs require citizenship; keep optional for roles that explicitly allow your status." },
  { id: "governmentJobs", name: "GovernmentJobs", category: "publicBoards", native: "governmentJobs", sites: ["governmentjobs.com/jobs"], priority: 76.6, tags: ["state/local", "public"] },
  { id: "idealist", name: "Idealist", category: "publicBoards", sites: ["idealist.org/en/jobs"], priority: 76.4, tags: ["nonprofit", "mission"] },
  { id: "higherEdJobs", name: "HigherEdJobs", category: "highered", sites: ["higheredjobs.com"], priority: 76.2, tags: ["universities", "research employers"], note: "Kept for university and research-employer roles; use employer pages to verify E-Verify/STEM OPT readiness." },
  { id: "careersSubdomains", name: "Careers Subdomains", category: "company", rawSiteQuery: "(inurl:careers OR inurl:career)", priority: 71, tags: ["company pages"] },
  { id: "jobsSubdomains", name: "Jobs Subdomains", category: "company", rawSiteQuery: "(inurl:jobs OR inurl:job)", priority: 70, tags: ["company pages"] },
  { id: "peopleSubdomains", name: "People Subdomains", category: "company", rawSiteQuery: "(inurl:people)", priority: 69.8, tags: ["company pages"] },
  { id: "talentSubdomains", name: "Talent Subdomains", category: "company", rawSiteQuery: "(inurl:talent)", priority: 69.6, tags: ["company pages"] },
  { id: "otherJobPages", name: "Other Job Pages", category: "company", rawSiteQuery: "(inurl:employment OR inurl:opportunities OR inurl:openings OR inurl:join-us OR inurl:work-with-us)", priority: 69.4, tags: ["company pages"] },
  { id: "greenhouse", name: "Greenhouse", category: "direct", sites: ["greenhouse.io"], priority: 69, tags: ["ATS"] },
  { id: "lever", name: "Lever", category: "direct", sites: ["lever.co"], priority: 68, tags: ["ATS"] },
  { id: "ashby", name: "Ashby", category: "direct", sites: ["ashbyhq.com"], priority: 67, tags: ["ATS"] },
  { id: "workdayAts", name: "Workday", category: "direct", sites: ["myworkdayjobs.com"], priority: 66, tags: ["ATS"] },
  { id: "smartRecruiters", name: "SmartRecruiters", category: "direct", sites: ["jobs.smartrecruiters.com"], priority: 65, tags: ["ATS"] },
  { id: "icims", name: "iCIMS", category: "direct", sites: ["icims.com"], priority: 64, tags: ["ATS"] },
  { id: "pinpoint", name: "Pinpoint", category: "direct", sites: ["pinpointhq.com"], priority: 63.8, tags: ["ATS", "direct apply"] },
  { id: "paylocity", name: "Paylocity", category: "direct", sites: ["recruiting.paylocity.com"], priority: 63.6, tags: ["ATS", "direct apply"] },
  { id: "keka", name: "Keka", category: "extraAts", sites: ["keka.com"], priority: 63.4, tags: ["ATS", "optional"] },
  { id: "workable", name: "Workable", category: "direct", sites: ["jobs.workable.com"], priority: 63.2, tags: ["ATS", "direct apply"] },
  { id: "breezy", name: "BreezyHR", category: "direct", sites: ["breezy.hr"], priority: 63, tags: ["ATS", "direct apply"] },
  { id: "oracleCloud", name: "Oracle Cloud", category: "direct", sites: ["oraclecloud.com"], priority: 62.8, tags: ["ATS", "direct apply"] },
  { id: "recruitee", name: "Recruitee", category: "direct", sites: ["recruitee.com"], priority: 62.6, tags: ["ATS", "direct apply"] },
  { id: "ripplingAts", name: "Rippling", category: "extraAts", rawSiteQuery: "(site:rippling.com OR site:rippling-ats.com)", priority: 62.4, tags: ["ATS", "optional"] },
  { id: "gustoJobs", name: "Gusto Jobs", category: "extraAts", sites: ["jobs.gusto.com"], priority: 62.2, tags: ["ATS", "optional"] },
  { id: "careerPuck", name: "CareerPuck", category: "extraAts", sites: ["careerpuck.com"], priority: 62, tags: ["ATS", "optional"] },
  { id: "teamtailor", name: "Teamtailor", category: "direct", sites: ["teamtailor.com"], priority: 61.8, tags: ["ATS", "direct apply"] },
  { id: "talentReef", name: "TalentReef", category: "extraAts", sites: ["jobappnetwork.com"], priority: 61.6, tags: ["ATS", "optional"] },
  { id: "homerun", name: "Homerun", category: "extraAts", sites: ["homerun.co"], priority: 61.4, tags: ["ATS", "optional"] },
  { id: "gem", name: "Gem", category: "extraAts", sites: ["gem.com"], priority: 61.2, tags: ["ATS", "optional"] },
  { id: "trakstar", name: "Trakstar", category: "extraAts", sites: ["trakstar.com"], priority: 61, tags: ["ATS", "optional"] },
  { id: "cats", name: "Cats", category: "extraAts", sites: ["catsone.com"], priority: 60.8, tags: ["ATS", "optional"] },
  { id: "jazzhr", name: "JazzHR", category: "direct", sites: ["applytojob.com"], priority: 60.6, tags: ["ATS", "direct apply"] },
  { id: "jobvite", name: "Jobvite", category: "direct", sites: ["jobvite.com"], priority: 60.4, tags: ["ATS", "direct apply"] },
  { id: "dover", name: "Dover", category: "extraAts", sites: ["dover.io"], priority: 60.2, tags: ["ATS", "optional"] },
  { id: "notionCareers", name: "Notion Career Pages", category: "extraAts", sites: ["notion.site"], priority: 60, tags: ["ATS", "optional"] },
  { id: "adpAts", name: "ADP", category: "direct", rawSiteQuery: "(site:workforcenow.adp.com OR site:myjobs.adp.com)", priority: 59.8, tags: ["ATS", "direct apply"] },
  { id: "factorial", name: "Factorial", category: "extraAts", sites: ["factorialhr.com"], priority: 59.6, tags: ["ATS", "optional"] },
  { id: "trinet", name: "TriNet Hire", category: "extraAts", sites: ["trinethire.com"], priority: 59.4, tags: ["ATS", "optional"] },
  { id: "myVisaJobs", name: "MyVisaJobs Sponsor Search", category: "research", sites: ["myvisajobs.com"], priority: 45, tags: ["H-1B", "sponsor"] },
  { id: "h1bData", name: "H1BData", category: "research", sites: ["h1bdata.info"], priority: 44, tags: ["salary", "H-1B"] },
  { id: "uscisHub", name: "USCIS H-1B Employer Data Hub", category: "research", native: "static", url: "https://www.uscis.gov/tools/reports-and-studies/h-1b-employer-data-hub", priority: 43, tags: ["official", "H-1B"] },
  { id: "dolOflc", name: "DOL OFLC Disclosure Data", category: "research", native: "static", url: "https://www.dol.gov/agencies/eta/foreign-labor/performance", priority: 42, tags: ["official", "disclosure"] }
];

const PORTALS = PORTAL_ROWS.map((portal, index) => ({ ...portal, order: index + 1 }));

const SOURCE_CAPABILITIES = {
  linkedinJobs: { kind: "native-filtered", label: "Native filtered", supports: ["time", "sort", "experience", "employment", "remote", "company keywords"] },
  linkedinPosts: { kind: "native-filtered", label: "Native post search", supports: ["date posted", "content type", "company keywords"] },
  indeed: { kind: "native-filtered", label: "Native filtered", supports: ["date", "sort", "location", "remote keyword"] },
  google: { kind: "native-filtered", label: "Google date tools", supports: ["time", "sort", "operators"] },
  glassdoor: { kind: "native-filtered", label: "Native keyword/date", supports: ["keyword", "posted age"] },
  ziprecruiter: { kind: "native-filtered", label: "Native keyword/date", supports: ["keyword", "location", "posted age"] },
  dice: { kind: "native-filtered", label: "Native tech/date", supports: ["keyword", "location", "posted age"] },
  builtin: { kind: "native-filtered", label: "Native broad search", supports: ["keyword", "location"] },
  simplify: { kind: "native-filtered", label: "Native broad search", supports: ["keyword"] },
  yc: { kind: "native-filtered", label: "Native startup search", supports: ["keyword"] },
  levels: { kind: "native-filtered", label: "Native tech search", supports: ["keyword"] },
  welcome: { kind: "native-filtered", label: "Native tech search", supports: ["keyword"] },
  monster: { kind: "native-filtered", label: "Native broad search", supports: ["keyword", "location"] },
  careerbuilder: { kind: "native-filtered", label: "Native broad search", supports: ["keyword", "location"] },
  flexjobs: { kind: "native-filtered", label: "Native board search", supports: ["keyword", "location"] },
  getwork: { kind: "native-filtered", label: "Native board search", supports: ["keyword", "location"] },
  simplyhired: { kind: "native-filtered", label: "Native board search", supports: ["keyword", "location"] },
  talentCom: { kind: "native-filtered", label: "Native board search", supports: ["keyword", "location"] },
  theMuse: { kind: "native-filtered", label: "Native board search", supports: ["keyword", "location"] },
  adzuna: { kind: "native-filtered", label: "Native board search", supports: ["keyword", "location"] },
  jora: { kind: "native-filtered", label: "Native board search", supports: ["keyword", "location"] },
  jooble: { kind: "native-filtered", label: "Native board search", supports: ["keyword", "location"] },
  nexxt: { kind: "native-filtered", label: "Native board search", supports: ["keyword", "location"] },
  snagajob: { kind: "native-filtered", label: "Native board search", supports: ["keyword", "location"] },
  ladders: { kind: "native-filtered", label: "Native board search", supports: ["keyword", "location"] },
  startupJobs: { kind: "native-filtered", label: "Native startup search", supports: ["keyword", "location"] },
  weworkremotely: { kind: "native-filtered", label: "Native remote search", supports: ["keyword"] },
  remotive: { kind: "native-filtered", label: "Native remote search", supports: ["keyword"] },
  usajobs: { kind: "native-filtered", label: "Native public search", supports: ["keyword", "location"] },
  governmentJobs: { kind: "native-filtered", label: "Native public search", supports: ["keyword", "location"] },
  static: { kind: "companion-search", label: "Research link", supports: ["manual research"] },
  native: { kind: "broad-search", label: "Native broad search", supports: ["keyword", "location where supported"] },
  operator: { kind: "broad-search", label: "Broad search operator", supports: ["site operators", "date where engine supports it"] }
};

const TIME_OPTIONS = {
  google: [
    ["all", "All"],
    ["5minutes", "Minute signals / 5m"],
    ["10minutes", "Minute signals / 10m"],
    ["15minutes", "Minute signals / 15m"],
    ["30minutes", "Minute signals / 30m"],
    ["45minutes", "Minute signals / 45m"],
    ["1hour", "Past Hour"],
    ["2hours", "Past 2 Hours"],
    ["3hours", "Past 3 Hours"],
    ["4hours", "Past 4 Hours"],
    ["6hours", "Past 6 Hours"],
    ["8hours", "Past 8 Hours"],
    ["12hours", "Past 12 Hours"],
    ["24hours", "Past 24 Hours"],
    ["48hours", "Past 48 Hours"],
    ["72hours", "Past 72 Hours"],
    ["week", "Past Week"],
    ["month", "Past Month"],
    ["year", "Past Year"],
    ["older1month", "Older than 1 month"],
    ["older3months", "Older than 3 months"],
    ["older6months", "Older than 6 months"]
  ],
  duckduckgo: [["all", "All"], ["24hours", "Past 24 Hours"], ["week", "Past Week"], ["month", "Past Month"], ["year", "Past Year"]],
  bing: [["all", "All"], ["24hours", "Past 24 Hours"], ["week", "Past Week"], ["month", "Past Month"]],
  brave: [["all", "All"], ["24hours", "Past 24 Hours"], ["week", "Past Week"], ["month", "Past Month"], ["year", "Past Year"]],
  startpage: [["all", "All"], ["24hours", "Past 24 Hours"], ["week", "Past Week"], ["month", "Past Month"], ["year", "Past Year"]],
  yahoo: [["all", "All"], ["24hours", "Past 24 Hours"], ["week", "Past Week"], ["month", "Past Month"]],
  kagi: [["all", "All"], ["24hours", "Past 24 Hours"], ["week", "Past Week"], ["month", "Past Month"], ["year", "Past Year"]],
  qwant: [["all", "All"], ["24hours", "Past 24 Hours"], ["week", "Past Week"], ["month", "Past Month"]]
};

const LOCATIONS = [
  ["usa", "United States", '("United States" OR USA OR "U.S.")', "United States"],
  ["remote-us", "Remote, US", '("United States" OR USA OR "U.S.") remote', "United States"],
  ["new-york-ny", "New York, NY", '("New York" OR NYC) "United States"', "New York, NY"],
  ["bay-area-ca", "San Francisco Bay Area, CA", '("San Francisco" OR "Bay Area" OR "San Jose" OR "Palo Alto") California', "San Francisco Bay Area"],
  ["seattle-wa", "Seattle, WA", '"Seattle" Washington', "Seattle, WA"],
  ["austin-tx", "Austin, TX", '"Austin" Texas', "Austin, TX"],
  ["dallas-tx", "Dallas-Fort Worth, TX", '("Dallas" OR "Fort Worth") Texas', "Dallas-Fort Worth, TX"],
  ["houston-tx", "Houston, TX", '"Houston" Texas', "Houston, TX"],
  ["boston-ma", "Boston, MA", '"Boston" Massachusetts', "Boston, MA"],
  ["chicago-il", "Chicago, IL", '"Chicago" Illinois', "Chicago, IL"],
  ["atlanta-ga", "Atlanta, GA", '"Atlanta" Georgia', "Atlanta, GA"],
  ["raleigh-nc", "Raleigh-Durham, NC", '("Raleigh" OR "Durham" OR "Research Triangle") "North Carolina"', "Raleigh-Durham, NC"],
  ["washington-dc", "Washington, DC", '("Washington DC" OR "Washington, DC" OR "District of Columbia")', "Washington, DC"],
  ["los-angeles-ca", "Los Angeles, CA", '("Los Angeles" OR LA) California', "Los Angeles, CA"],
  ["san-diego-ca", "San Diego, CA", '"San Diego" California', "San Diego, CA"],
  ["denver-co", "Denver, CO", '"Denver" Colorado', "Denver, CO"],
  ["phoenix-az", "Phoenix, AZ", '"Phoenix" Arizona', "Phoenix, AZ"],
  ["miami-fl", "Miami, FL", '"Miami" Florida', "Miami, FL"],
  ["orlando-fl", "Orlando, FL", '"Orlando" Florida', "Orlando, FL"],
  ["philadelphia-pa", "Philadelphia, PA", '"Philadelphia" Pennsylvania', "Philadelphia, PA"],
  ["pittsburgh-pa", "Pittsburgh, PA", '"Pittsburgh" Pennsylvania', "Pittsburgh, PA"],
  ["minneapolis-mn", "Minneapolis, MN", '"Minneapolis" Minnesota', "Minneapolis, MN"],
  ["detroit-mi", "Detroit, MI", '"Detroit" Michigan', "Detroit, MI"],
  ["columbus-oh", "Columbus, OH", '"Columbus" Ohio', "Columbus, OH"],
  ["salt-lake-city-ut", "Salt Lake City, UT", '"Salt Lake City" Utah', "Salt Lake City, UT"],
  ["portland-or", "Portland, OR", '"Portland" Oregon', "Portland, OR"]
];

const RELATED_TITLE_GROUPS = [
  ["Software Engineer", "Software Developer", "Full Stack Developer", "Frontend Developer", "Backend Developer", "Application Developer", "Web Developer"],
  ["Machine Learning Engineer", "ML Engineer", "AI Engineer", "Applied Scientist", "Data Scientist", "Research Engineer", "AI Data Engineer"],
  ["Data Engineer", "Analytics Engineer", "ETL Developer", "BI Engineer", "Data Platform Engineer"],
  ["Data Analyst", "Business Intelligence Analyst", "Reporting Analyst", "SQL Analyst", "Power BI Developer", "Tableau Developer"],
  ["Cloud Engineer", "DevOps Engineer", "Site Reliability Engineer", "Platform Engineer", "Infrastructure Engineer"],
  ["Product Manager", "Product Owner", "Technical Product Manager"],
  ["UX Designer", "UI Designer", "Product Designer", "UX Researcher", "Content Designer"],
  ["Financial Analyst", "FP&A Analyst", "Business Operations Analyst", "Revenue Analyst", "Risk Analyst"],
  ["Video Producer", "Film Editor", "Content Producer", "Content Creator", "Media Manager", "Digital Marketing Specialist", "Multimedia Designer", "Social Media Strategist", "Brand Content Manager", "Video Production Coordinator", "Creative Director"],
  ["Scrum Master", "Agile Coach", "Lean Practitioner", "Kanban Coach", "Agile Project Facilitator", "Agile Transformation Lead", "Agile Team Coach", "Iteration Manager"]
];

const ROLE_PACKS = [
  {
    id: "all-role-families",
    label: "Core Software / AI / Data / Cloud - Max Coverage",
    primary: "Software Engineer",
    titles: ["Software Engineer", "Software Developer", "AI Engineer", "Machine Learning Engineer", "Data Scientist", "Data Engineer", "Data Analyst", "Analytics Engineer", "Business Intelligence Analyst", "Cloud Engineer", "DevOps Engineer"],
    includes: ["Python", "SQL", "cloud", "AI", "data", "analytics"],
    compactQuery: '"software engineer"',
    balancedQuery: '("software engineer" OR "data analyst" OR "data engineer" OR "machine learning engineer")',
    query: '("software engineer" OR "software developer" OR "AI engineer" OR "machine learning engineer" OR "data scientist" OR "data engineer" OR "data analyst" OR "analytics engineer" OR "business intelligence analyst" OR "cloud engineer" OR "DevOps engineer")'
  },
  {
    id: "software-engineer",
    label: "Software Engineer",
    primary: "Software Engineer",
    titles: ["Software Engineer", "Software Developer", "Application Developer"],
    includes: ["Python", "Java", "JavaScript", "API"],
    compactQuery: '"software engineer"',
    balancedQuery: '("software engineer" OR "software developer" OR "application developer")',
    query: '("software engineer" OR "software developer" OR "application developer" OR "software development engineer" OR SDE)'
  },
  {
    id: "full-stack",
    label: "Full-Stack Engineer",
    primary: "Full Stack Developer",
    titles: ["Full Stack Developer", "Full Stack Engineer", "Software Engineer", "Web Developer"],
    includes: ["JavaScript", "React", "Node", "API"],
    compactQuery: '"full stack developer"',
    balancedQuery: '("full stack developer" OR "full stack engineer" OR "software engineer")',
    query: '("full stack developer" OR "full stack engineer" OR "full-stack developer" OR "full-stack engineer" OR "software engineer" OR "web developer")'
  },
  {
    id: "backend",
    label: "Backend Engineer",
    primary: "Backend Developer",
    titles: ["Backend Developer", "Backend Engineer", "Software Engineer", "API Engineer"],
    includes: ["Python", "Java", "API", "SQL"],
    compactQuery: '"backend developer"',
    balancedQuery: '("backend developer" OR "backend engineer" OR "software engineer")',
    query: '("backend developer" OR "backend engineer" OR "back end developer" OR "back end engineer" OR "API engineer" OR "software engineer")'
  },
  {
    id: "frontend",
    label: "Frontend Engineer",
    primary: "Frontend Developer",
    titles: ["Frontend Developer", "Frontend Engineer", "UI Engineer", "React Developer"],
    includes: ["JavaScript", "React", "TypeScript", "UI"],
    compactQuery: '"frontend developer"',
    balancedQuery: '("frontend developer" OR "frontend engineer" OR "React developer")',
    query: '("frontend developer" OR "frontend engineer" OR "front end developer" OR "front end engineer" OR "React developer" OR "UI engineer")'
  },
  {
    id: "software-ai-data",
    label: "Software / AI / Data",
    primary: "Software Engineer",
    titles: ["Software Engineer", "Software Developer", "AI Engineer", "Machine Learning Engineer", "Data Engineer", "Data Analyst", "Analytics Engineer", "Business Intelligence Analyst"],
    includes: ["Python", "SQL", "cloud", "AI", "data"],
    compactQuery: '"software engineer"',
    balancedQuery: '("software engineer" OR "data engineer" OR "data analyst" OR "machine learning engineer")',
    query: '("software engineer" OR "software developer" OR "AI engineer" OR "machine learning engineer" OR "data engineer" OR "data analyst" OR "analytics engineer" OR "business intelligence analyst")'
  },
  {
    id: "software",
    label: "Software Engineering",
    primary: "Software Engineer",
    titles: ["Software Engineer", "Software Developer", "Full Stack Developer", "Backend Developer", "Frontend Developer", "Application Developer"],
    includes: ["JavaScript", "Python", "Java", "API"],
    compactQuery: '"software engineer"',
    balancedQuery: '("software engineer" OR "software developer" OR "full stack developer" OR "backend developer")',
    query: '("software engineer" OR "software developer" OR "full stack developer" OR "backend developer" OR "frontend developer" OR "application developer")'
  },
  {
    id: "ai-ml",
    label: "AI / ML",
    primary: "Machine Learning Engineer",
    titles: ["Machine Learning Engineer", "AI Engineer", "Applied Scientist", "ML Engineer", "Data Scientist", "AI Data Engineer"],
    includes: ["Python", "machine learning", "LLM", "AI"],
    compactQuery: '"machine learning engineer"',
    balancedQuery: '("machine learning engineer" OR "AI engineer" OR "data scientist")',
    query: '("machine learning engineer" OR "AI engineer" OR "applied scientist" OR "ML engineer" OR "data scientist" OR "LLM")'
  },
  {
    id: "ai-engineer",
    label: "AI Engineer",
    primary: "AI Engineer",
    titles: ["AI Engineer", "Machine Learning Engineer", "LLM Engineer", "Applied AI Engineer"],
    includes: ["Python", "LLM", "RAG", "machine learning"],
    compactQuery: '"AI engineer"',
    balancedQuery: '("AI engineer" OR "LLM engineer" OR "machine learning engineer")',
    query: '("AI engineer" OR "artificial intelligence engineer" OR "LLM engineer" OR "applied AI engineer" OR "machine learning engineer")'
  },
  {
    id: "ml-engineer",
    label: "Machine Learning Engineer",
    primary: "Machine Learning Engineer",
    titles: ["Machine Learning Engineer", "ML Engineer", "Applied Scientist", "Data Scientist"],
    includes: ["Python", "machine learning", "MLOps", "modeling"],
    compactQuery: '"machine learning engineer"',
    balancedQuery: '("machine learning engineer" OR "ML engineer" OR "applied scientist")',
    query: '("machine learning engineer" OR "ML engineer" OR "machine learning scientist" OR "applied scientist" OR "MLOps engineer")'
  },
  {
    id: "data-scientist",
    label: "Data Scientist",
    primary: "Data Scientist",
    titles: ["Data Scientist", "Applied Scientist", "Machine Learning Engineer"],
    includes: ["Python", "SQL", "statistics", "machine learning"],
    compactQuery: '"data scientist"',
    balancedQuery: '("data scientist" OR "applied scientist" OR "machine learning engineer")',
    query: '("data scientist" OR "applied scientist" OR "machine learning scientist" OR "decision scientist" OR "product data scientist")'
  },
  {
    id: "data-engineer",
    label: "Data Engineer",
    primary: "Data Engineer",
    titles: ["Data Engineer", "Analytics Engineer", "ETL Developer", "Data Platform Engineer"],
    includes: ["SQL", "Python", "ETL", "cloud"],
    compactQuery: '"data engineer"',
    balancedQuery: '("data engineer" OR "analytics engineer" OR "ETL developer")',
    query: '("data engineer" OR "analytics engineer" OR "ETL developer" OR "data platform engineer" OR "pipeline engineer")'
  },
  {
    id: "data-analytics",
    label: "Data / Analytics",
    primary: "Data Analyst",
    titles: ["Data Analyst", "Business Intelligence Analyst", "Analytics Engineer", "SQL Analyst", "Reporting Analyst", "Data Scientist", "Data Engineer"],
    includes: ["SQL", "Python", "Tableau", "Power BI"],
    compactQuery: '"data analyst"',
    balancedQuery: '("data analyst" OR "business intelligence analyst" OR "analytics engineer")',
    query: '("data analyst" OR "business intelligence analyst" OR "analytics engineer" OR "SQL analyst" OR "reporting analyst" OR "data scientist" OR "data engineer")'
  },
  {
    id: "analytics-engineer",
    label: "Analytics Engineer",
    primary: "Analytics Engineer",
    titles: ["Analytics Engineer", "Data Analyst", "BI Engineer", "SQL Analyst"],
    includes: ["SQL", "dbt", "analytics", "data modeling"],
    compactQuery: '"analytics engineer"',
    balancedQuery: '("analytics engineer" OR "BI engineer" OR "SQL analyst")',
    query: '("analytics engineer" OR "BI engineer" OR "business intelligence engineer" OR "SQL analyst" OR "data modeling")'
  },
  {
    id: "bi-analyst",
    label: "BI Analyst",
    primary: "Business Intelligence Analyst",
    titles: ["Business Intelligence Analyst", "BI Analyst", "Reporting Analyst", "Power BI Developer", "Tableau Developer"],
    includes: ["SQL", "Power BI", "Tableau", "dashboard"],
    compactQuery: '"business intelligence analyst"',
    balancedQuery: '("business intelligence analyst" OR "BI analyst" OR "reporting analyst")',
    query: '("business intelligence analyst" OR "BI analyst" OR "reporting analyst" OR "Power BI developer" OR "Tableau developer")'
  },
  {
    id: "cloud-devops",
    label: "Cloud / DevOps",
    primary: "Cloud Engineer",
    titles: ["Cloud Engineer", "DevOps Engineer", "Site Reliability Engineer", "Platform Engineer", "Infrastructure Engineer"],
    includes: ["AWS", "Azure", "Kubernetes", "Terraform"],
    compactQuery: '"cloud engineer"',
    balancedQuery: '("cloud engineer" OR "DevOps engineer" OR "platform engineer")',
    query: '("cloud engineer" OR "DevOps engineer" OR "site reliability engineer" OR "platform engineer" OR "infrastructure engineer")'
  },
  {
    id: "new-grad-software",
    label: "New Grad Software",
    primary: "Software Engineer",
    titles: ["Software Engineer", "Software Developer", "New Grad Software Engineer", "Early Career Software Engineer"],
    includes: ["new grad", "early career", "entry level"],
    compactQuery: '"software engineer"',
    balancedQuery: '("software engineer" OR "software developer") ("new grad" OR "early career" OR "entry level")',
    query: '("software engineer" OR "software developer" OR "software development engineer" OR SDE) ("new grad" OR "university graduate" OR "early career" OR "entry level")'
  }
];

const ROLE_PACK_LABELS = Object.fromEntries(ROLE_PACKS.map(pack => [pack.id, pack.label]));

const ACRONYMS = new Set(["AI", "API", "AWS", "BI", "CRM", "FP&A", "GRC", "HR", "LLM", "ML", "MLOPS", "QA", "RAG", "SDE", "SEO", "SOC", "SRE", "SQL", "UI", "UX"]);

const FILTER_LABELS = {
  remoteMode: {
    neutral: "All work settings",
    "onsite-hybrid": "On-site or hybrid",
    hybrid: "Hybrid",
    onsite: "On-site",
    only: "Remote only",
    exclude: "Exclude remote"
  },
  matchMode: {
    smart: "Smart related titles",
    exact: "Exact title only"
  },
  queryStyle: {
    balanced: "Balanced smart",
    compact: "Compact title",
    broad: "Broad Boolean",
    custom: "Custom query"
  },
  experience: {
    any: "Any level",
    entry: "Entry or new grad",
    mid: "Mid level",
    senior: "Senior or lead",
    manager: "Manager plus",
    internship: "Internship"
  },
  employment: {
    any: "Any employment",
    fulltime: "Full-time",
    contract: "Contract",
    parttime: "Part-time",
    internship: "Internship"
  },
  authorization: {
    none: "No auth filter",
    optBroad: "OPT-aware broad",
    currentAuthorized: "US work authorized",
    sponsorNeeded: "Future sponsorship",
    everify: "E-Verify",
    optStrict: "OPT/STEM OPT exact"
  },
  sort: {
    recommended: "Most useful first",
    latest: "Newest first",
    direct: "Direct apply first",
    coverage: "Broad coverage"
  },
  precision: {
    minuteRadar: "Minute Radar",
    coverage: "Max Coverage",
    latest1: "Latest 1h",
    latest24: "Latest 24h",
    optSponsor: "OPT/Sponsor Research",
    direct: "Direct ATS",
    exact: "Exact Role"
  },
  companyKind: {
    all: "Direct and vendors",
    direct: "Direct employers",
    vendor: "Staffing/vendors"
  },
  sponsorTier: {
    all: "All sponsor tiers",
    top: "Top H1B sponsors",
    strong: "Strong sponsors",
    moderate: "Moderate sponsors",
    curated: "Curated/no filing data"
  }
};

const COMPANY_ROWS = [
  ["Amazon", "Cloud and Big Tech", "https://www.amazon.jobs/", "software, data, cloud, operations"],
  ["Microsoft", "Cloud and Big Tech", "https://careers.microsoft.com/", "software, data, cloud, AI"],
  ["Google / Alphabet", "Cloud and Big Tech", "https://www.google.com/about/careers/applications/", "software, data, AI, product"],
  ["Meta", "Cloud and Big Tech", "https://www.metacareers.com/", "software, data, AI, product"],
  ["Apple", "Cloud and Big Tech", "https://jobs.apple.com/", "software, hardware, data, product"],
  ["NVIDIA", "Cloud and Big Tech", "https://www.nvidia.com/en-us/about-nvidia/careers/", "AI, hardware, software, data"],
  ["OpenAI", "AI and Data", "https://openai.com/careers/", "AI, research, software, data"],
  ["Anthropic", "AI and Data", "https://www.anthropic.com/careers", "AI, research, software, data"],
  ["Databricks", "AI and Data", "https://www.databricks.com/company/careers", "data, AI, platform, software"],
  ["Snowflake", "AI and Data", "https://careers.snowflake.com/", "data, cloud, platform, software"],
  ["Oracle", "Enterprise Software", "https://careers.oracle.com/", "cloud, software, data, enterprise"],
  ["Salesforce", "Enterprise Software", "https://www.salesforce.com/company/careers/", "CRM, software, data, product"],
  ["Adobe", "Enterprise Software", "https://careers.adobe.com/", "software, data, product, creative"],
  ["ServiceNow", "Enterprise Software", "https://careers.servicenow.com/", "platform, software, data, enterprise"],
  ["IBM", "Enterprise Software", "https://www.ibm.com/careers", "software, data, consulting, AI"],
  ["Cisco", "Enterprise Software", "https://jobs.cisco.com/", "networking, cloud, security, software"],
  ["Intuit", "Enterprise Software", "https://www.intuit.com/careers/", "software, data, fintech, product"],
  ["Workday", "Enterprise Software", "https://www.workday.com/en-us/company/careers.html", "software, data, HR, finance"],
  ["Atlassian", "Enterprise Software", "https://www.atlassian.com/company/careers", "software, product, collaboration"],
  ["Broadcom", "Hardware and Semiconductors", "https://www.broadcom.com/company/careers", "semiconductor, software, infrastructure"],
  ["Cloudflare", "Enterprise Software", "https://www.cloudflare.com/careers/", "security, networking, cloud, software"],
  ["MongoDB", "AI and Data", "https://www.mongodb.com/company/careers", "database, data, software, cloud"],
  ["GitHub", "Enterprise Software", "https://www.github.careers/", "software, developer tools, platform"],
  ["GitLab", "Enterprise Software", "https://about.gitlab.com/jobs/", "software, DevOps, platform"],
  ["Elastic", "AI and Data", "https://www.elastic.co/careers", "search, data, security, cloud"],
  ["Okta", "Enterprise Software", "https://www.okta.com/company/careers/", "identity, security, software"],
  ["Twilio", "Enterprise Software", "https://www.twilio.com/en-us/company/jobs", "software, communications, data"],
  ["HubSpot", "Enterprise Software", "https://www.hubspot.com/careers", "CRM, software, data, product"],
  ["Zoom", "Enterprise Software", "https://careers.zoom.us/", "software, communications, platform"],
  ["Palantir", "AI and Data", "https://www.palantir.com/careers/", "data, software, government", "Some roles can be clearance-heavy."],
  ["Intel", "Hardware and Semiconductors", "https://jobs.intel.com/", "semiconductor, software, hardware"],
  ["AMD", "Hardware and Semiconductors", "https://careers.amd.com/", "semiconductor, software, hardware"],
  ["Qualcomm", "Hardware and Semiconductors", "https://careers.qualcomm.com/", "semiconductor, wireless, software"],
  ["Micron", "Hardware and Semiconductors", "https://www.micron.com/about/careers", "semiconductor, data, hardware"],
  ["Texas Instruments", "Hardware and Semiconductors", "https://careers.ti.com/", "semiconductor, hardware, software"],
  ["Applied Materials", "Hardware and Semiconductors", "https://www.appliedmaterials.com/us/en/careers.html", "semiconductor, engineering, data"],
  ["Lam Research", "Hardware and Semiconductors", "https://careers.lamresearch.com/", "semiconductor, engineering, data"],
  ["KLA", "Hardware and Semiconductors", "https://www.kla.com/careers", "semiconductor, engineering, data"],
  ["Dell", "Hardware and Semiconductors", "https://jobs.dell.com/", "hardware, cloud, software, data"],
  ["HP", "Hardware and Semiconductors", "https://jobs.hp.com/", "hardware, software, data"],
  ["HPE", "Hardware and Semiconductors", "https://careers.hpe.com/", "cloud, hardware, software"],
  ["Motorola Solutions", "Hardware and Semiconductors", "https://www.motorolasolutions.com/en_us/about/careers.html", "software, public safety, data"],
  ["Arista", "Hardware and Semiconductors", "https://www.arista.com/en/careers", "networking, software, cloud"],
  ["Juniper", "Hardware and Semiconductors", "https://www.juniper.net/us/en/company/careers.html", "networking, software, security"],
  ["Palo Alto Networks", "Cybersecurity", "https://jobs.paloaltonetworks.com/", "security, cloud, software"],
  ["Netflix", "Consumer Tech", "https://jobs.netflix.com/", "software, data, streaming, product"],
  ["Uber", "Consumer Tech", "https://www.uber.com/us/en/careers/", "software, data, product, operations"],
  ["Lyft", "Consumer Tech", "https://www.lyft.com/careers", "software, data, product, operations"],
  ["Airbnb", "Consumer Tech", "https://careers.airbnb.com/", "software, data, product, marketplace"],
  ["DoorDash", "Consumer Tech", "https://careers.doordash.com/", "software, data, logistics, product"],
  ["Instacart", "Consumer Tech", "https://instacart.careers/", "software, data, marketplace"],
  ["Pinterest", "Consumer Tech", "https://www.pinterestcareers.com/", "software, data, product"],
  ["Reddit", "Consumer Tech", "https://www.redditinc.com/careers", "software, data, community"],
  ["Snap", "Consumer Tech", "https://careers.snap.com/", "software, data, AR, product"],
  ["Roblox", "Consumer Tech", "https://careers.roblox.com/", "software, data, gaming"],
  ["Etsy", "Consumer Tech", "https://careers.etsy.com/", "software, data, marketplace"],
  ["eBay", "Consumer Tech", "https://jobs.ebayinc.com/", "software, data, marketplace"],
  ["PayPal", "Fintech and Finance", "https://careers.pypl.com/", "fintech, software, data"],
  ["Block", "Fintech and Finance", "https://block.xyz/careers", "fintech, software, data"],
  ["Stripe", "Fintech and Finance", "https://stripe.com/jobs", "fintech, software, data"],
  ["Coinbase", "Fintech and Finance", "https://www.coinbase.com/careers", "crypto, fintech, software"],
  ["Robinhood", "Fintech and Finance", "https://careers.robinhood.com/", "fintech, software, data"],
  ["Affirm", "Fintech and Finance", "https://www.affirm.com/careers", "fintech, software, data"],
  ["JPMorgan Chase", "Fintech and Finance", "https://careers.jpmorgan.com/", "banking, data, software, analytics"],
  ["Bank of America", "Fintech and Finance", "https://careers.bankofamerica.com/", "banking, data, software, analytics"],
  ["Citi", "Fintech and Finance", "https://jobs.citi.com/", "banking, data, software, analytics"],
  ["Wells Fargo", "Fintech and Finance", "https://www.wellsfargojobs.com/", "banking, data, software, analytics"],
  ["Goldman Sachs", "Fintech and Finance", "https://www.goldmansachs.com/careers/", "banking, data, software, analytics"],
  ["Morgan Stanley", "Fintech and Finance", "https://www.morganstanley.com/about-us/careers", "banking, data, software, analytics"],
  ["Capital One", "Fintech and Finance", "https://www.capitalonecareers.com/", "fintech, data, software, analytics"],
  ["American Express", "Fintech and Finance", "https://www.americanexpress.com/en-us/careers/", "payments, data, software, analytics"],
  ["Mastercard", "Fintech and Finance", "https://careers.mastercard.com/", "payments, data, software"],
  ["Visa", "Fintech and Finance", "https://usa.visa.com/careers.html", "payments, data, software"],
  ["Discover", "Fintech and Finance", "https://jobs.discover.com/", "payments, data, software"],
  ["Fiserv", "Fintech and Finance", "https://www.fiserv.com/en/about-fiserv/careers.html", "payments, fintech, software"],
  ["Fidelity", "Fintech and Finance", "https://jobs.fidelity.com/", "finance, data, software"],
  ["Charles Schwab", "Fintech and Finance", "https://www.schwabjobs.com/", "finance, data, software"],
  ["BlackRock", "Fintech and Finance", "https://careers.blackrock.com/", "finance, data, analytics"],
  ["Bloomberg", "Fintech and Finance", "https://www.bloomberg.com/company/careers/", "finance, data, software"],
  ["Moody's", "Fintech and Finance", "https://careers.moodys.com/", "finance, data, analytics"],
  ["S&P Global", "Fintech and Finance", "https://www.spglobal.com/en/careers", "finance, data, analytics"],
  ["Progressive", "Insurance", "https://www.progressive.com/careers/", "insurance, data, analytics, software"],
  ["State Farm", "Insurance", "https://www.statefarm.com/careers", "insurance, data, analytics, software"],
  ["Allstate", "Insurance", "https://www.allstate.jobs/", "insurance, data, analytics, software"],
  ["Chubb", "Insurance", "https://careers.chubb.com/", "insurance, data, analytics"],
  ["Deloitte", "Consulting and Services", "https://www.deloitte.com/us/en/careers.html", "consulting, data, technology"],
  ["Accenture", "Consulting and Services", "https://www.accenture.com/us-en/careers", "consulting, technology, data"],
  ["PwC", "Consulting and Services", "https://www.pwc.com/us/en/careers.html", "consulting, data, technology"],
  ["EY", "Consulting and Services", "https://www.ey.com/en_us/careers", "consulting, data, technology"],
  ["KPMG", "Consulting and Services", "https://kpmg.com/us/en/careers.html", "consulting, data, technology"],
  ["McKinsey", "Consulting and Services", "https://www.mckinsey.com/careers", "consulting, analytics, data"],
  ["BCG", "Consulting and Services", "https://careers.bcg.com/", "consulting, analytics, data"],
  ["Bain", "Consulting and Services", "https://www.bain.com/careers/", "consulting, analytics, data"],
  ["Cognizant", "Consulting and Services", "https://careers.cognizant.com/", "consulting, technology, data"],
  ["TCS", "Consulting and Services", "https://www.tcs.com/careers", "consulting, technology, data"],
  ["Infosys", "Consulting and Services", "https://www.infosys.com/careers/", "consulting, technology, data"],
  ["Wipro", "Consulting and Services", "https://careers.wipro.com/", "consulting, technology, data"],
  ["HCLTech", "Consulting and Services", "https://www.hcltech.com/careers", "consulting, technology, data"],
  ["Capgemini", "Consulting and Services", "https://www.capgemini.com/us-en/careers/", "consulting, technology, data"],
  ["EPAM", "Consulting and Services", "https://www.epam.com/careers", "consulting, software, data"],
  ["Globant", "Consulting and Services", "https://www.globant.com/careers", "consulting, software, data"],
  ["Slalom", "Consulting and Services", "https://www.slalom.com/careers", "consulting, data, technology"],
  ["Thoughtworks", "Consulting and Services", "https://www.thoughtworks.com/careers", "consulting, software, data"],
  ["NTT DATA", "Consulting and Services", "https://us.nttdata.com/en/careers", "consulting, technology, data"],
  ["LTIMindtree", "Consulting and Services", "https://www.ltimindtree.com/careers/", "consulting, technology, data"],
  ["Tech Mahindra", "Consulting and Services", "https://www.techmahindra.com/en-in/careers/", "consulting, technology, data"],
  ["Booz Allen Hamilton", "Consulting and Services", "https://www.boozallen.com/careers.html", "consulting, analytics, government", "Many roles may require clearance or citizenship."],
  ["UnitedHealth Group", "Health and Life Sciences", "https://careers.unitedhealthgroup.com/", "healthcare, data, software"],
  ["Optum", "Health and Life Sciences", "https://www.optum.com/en/careers.html", "healthcare, data, software"],
  ["CVS Health", "Health and Life Sciences", "https://jobs.cvshealth.com/", "healthcare, data, software"],
  ["Elevance Health", "Health and Life Sciences", "https://careers.elevancehealth.com/", "healthcare, data, software"],
  ["Cigna / Evernorth", "Health and Life Sciences", "https://jobs.thecignagroup.com/us/en", "healthcare, data, software"],
  ["Walgreens", "Health and Life Sciences", "https://jobs.walgreens.com/", "healthcare, data, software"],
  ["Johnson & Johnson", "Health and Life Sciences", "https://www.careers.jnj.com/", "life sciences, data, software"],
  ["Pfizer", "Health and Life Sciences", "https://www.pfizer.com/about/careers", "life sciences, data, analytics"],
  ["Merck", "Health and Life Sciences", "https://jobs.merck.com/", "life sciences, data, analytics"],
  ["Eli Lilly", "Health and Life Sciences", "https://careers.lilly.com/", "life sciences, data, analytics"],
  ["Moderna", "Health and Life Sciences", "https://www.modernatx.com/careers", "life sciences, data, analytics"],
  ["Amgen", "Health and Life Sciences", "https://careers.amgen.com/", "life sciences, data, analytics"],
  ["Gilead", "Health and Life Sciences", "https://www.gilead.com/careers", "life sciences, data, analytics"],
  ["AbbVie", "Health and Life Sciences", "https://careers.abbvie.com/", "life sciences, data, analytics"],
  ["Abbott", "Health and Life Sciences", "https://www.jobs.abbott/us/en", "healthcare, data, software"],
  ["Medtronic", "Health and Life Sciences", "https://www.medtronic.com/en-us/about/careers.html", "medical devices, data, software"],
  ["Boston Scientific", "Health and Life Sciences", "https://jobs.bostonscientific.com/", "medical devices, data, software"],
  ["Epic", "Health and Life Sciences", "https://careers.epic.com/", "healthcare software, data"],
  ["Walmart", "Retail and Consumer", "https://careers.walmart.com/", "retail, data, software, supply chain"],
  ["Target", "Retail and Consumer", "https://jobs.target.com/", "retail, data, software, supply chain"],
  ["Costco", "Retail and Consumer", "https://www.costco.com/jobs.html", "retail, analytics, operations"],
  ["Home Depot", "Retail and Consumer", "https://careers.homedepot.com/", "retail, data, software, supply chain"],
  ["Lowe's", "Retail and Consumer", "https://talent.lowes.com/", "retail, data, software, supply chain"],
  ["Best Buy", "Retail and Consumer", "https://jobs.bestbuy.com/", "retail, data, software"],
  ["Nike", "Retail and Consumer", "https://jobs.nike.com/", "retail, data, software, product"],
  ["Starbucks", "Retail and Consumer", "https://www.starbucks.com/careers/", "retail, analytics, technology"],
  ["PepsiCo", "Retail and Consumer", "https://www.pepsicojobs.com/", "consumer goods, data, supply chain"],
  ["Coca-Cola", "Retail and Consumer", "https://www.coca-colacompany.com/careers", "consumer goods, data, supply chain"],
  ["Procter & Gamble", "Retail and Consumer", "https://www.pgcareers.com/", "consumer goods, data, analytics"],
  ["FedEx", "Logistics and Industrial", "https://careers.fedex.com/", "logistics, data, software"],
  ["UPS", "Logistics and Industrial", "https://www.jobs-ups.com/", "logistics, data, software"],
  ["GE Aerospace", "Logistics and Industrial", "https://www.geaerospace.com/company/careers", "aerospace, data, software", "Some roles may require export-control review."],
  ["GE Vernova", "Logistics and Industrial", "https://www.gevernova.com/careers", "energy, data, software"],
  ["Honeywell", "Logistics and Industrial", "https://careers.honeywell.com/", "industrial, data, software", "Some roles may require export-control review."],
  ["Tesla", "Automotive and Mobility", "https://www.tesla.com/careers", "EV, software, data, manufacturing"],
  ["Rivian", "Automotive and Mobility", "https://careers.rivian.com/", "EV, software, data, manufacturing"],
  ["AT&T", "Telecom and Media", "https://www.att.jobs/", "telecom, data, software"],
  ["Verizon", "Telecom and Media", "https://www.verizon.com/about/careers", "telecom, data, software"],
  ["T-Mobile", "Telecom and Media", "https://careers.t-mobile.com/", "telecom, data, software"],
  ["Comcast", "Telecom and Media", "https://jobs.comcast.com/", "telecom, media, data, software"],
  ["Disney", "Telecom and Media", "https://www.disneycareers.com/", "media, data, software"],
  ["Boeing", "Aerospace and Defense", "https://jobs.boeing.com/", "aerospace, software, data", "Many roles may require US person status, clearance, or export-control eligibility."],
  ["SpaceX", "Aerospace and Defense", "https://www.spacex.com/careers/", "aerospace, software, data", "Many roles may require US person status under export-control rules."]
];

const SPONSOR_COMPANY_ROWS = [
  [
    "Amazon.com Services LLC",
    731,
    "direct",
    "top",
    "Cloud and Big Tech",
    "https://www.amazon.jobs/",
    "tech, cloud",
    "",
    ""
  ],
  [
    "Meta Platforms, Inc",
    533,
    "direct",
    "top",
    "Cloud and Big Tech",
    "https://www.metacareers.com/",
    "tech, cloud",
    "",
    ""
  ],
  [
    "Google LLC",
    488,
    "direct",
    "strong",
    "Cloud and Big Tech",
    "https://careers.google.com/",
    "tech, cloud",
    "",
    ""
  ],
  [
    "Fidelity Technology Group, LLC d/b/a Fidelity Investments",
    374,
    "direct",
    "strong",
    "Fintech and Finance",
    "https://jobs.fidelity.com/",
    "fintech",
    "",
    ""
  ],
  [
    "JPMorgan Chase & Co",
    301,
    "direct",
    "strong",
    "Fintech and Finance",
    "https://careers.jpmorgan.com/",
    "fintech",
    "",
    ""
  ],
  [
    "Apple Inc",
    288,
    "direct",
    "strong",
    "Cloud and Big Tech",
    "https://jobs.apple.com/",
    "tech, cloud",
    "",
    ""
  ],
  [
    "Mphasis Corporation",
    257,
    "direct",
    "strong",
    "Consulting and Services",
    "https://careers.mphasis.com/",
    "consulting",
    "",
    ""
  ],
  [
    "LinkedIn Corporation",
    215,
    "direct",
    "strong",
    "Cloud and Big Tech",
    "https://careers.linkedin.com/",
    "tech, cloud",
    "",
    ""
  ],
  [
    "WAL-MART ASSOCIATES, INC",
    190,
    "direct",
    "moderate",
    "Retail and Consumer",
    "https://careers.walmart.com/",
    "other",
    "",
    ""
  ],
  [
    "Amazon Development Center U.S., Inc",
    124,
    "direct",
    "moderate",
    "Cloud and Big Tech",
    "https://www.amazon.jobs/",
    "tech, cloud",
    "",
    ""
  ],
  [
    "IBM Corporation",
    124,
    "direct",
    "moderate",
    "Cloud and Big Tech",
    "https://www.ibm.com/employment/",
    "tech, cloud",
    "",
    ""
  ],
  [
    "PayPal, Inc",
    117,
    "direct",
    "moderate",
    "Cloud and Big Tech",
    "https://careers.pypl.com/",
    "tech, cloud",
    "",
    ""
  ],
  [
    "U.S. Bank National Association",
    107,
    "direct",
    "moderate",
    "Enterprise Software",
    "https://www.usbank.com/careers.html",
    "tech",
    "",
    ""
  ],
  [
    "Amazon Web Services, Inc",
    107,
    "direct",
    "moderate",
    "Cloud and Big Tech",
    "https://aws.amazon.com/careers/",
    "tech, cloud",
    "",
    ""
  ],
  [
    "LTIMindtree Limited",
    101,
    "direct",
    "moderate",
    "Consulting and Services",
    "https://www.ltimindtree.com/careers/",
    "consulting",
    "",
    ""
  ],
  [
    "NVIDIA Corporation",
    101,
    "direct",
    "moderate",
    "AI and Data",
    "https://www.nvidia.com/en-us/about-nvidia/careers/",
    "tech, ai",
    "",
    ""
  ],
  [
    "J.B. Hunt Transport, Inc",
    86,
    "direct",
    "moderate",
    "Logistics and Industrial",
    "https://www.jbhunt.com/careers/",
    "other",
    "",
    ""
  ],
  [
    "Qualcomm Technologies, Inc",
    85,
    "direct",
    "moderate",
    "Cloud and Big Tech",
    "https://www.qualcomm.com/company/careers",
    "tech, cloud",
    "",
    ""
  ],
  [
    "Adobe Inc",
    83,
    "direct",
    "moderate",
    "Enterprise Software",
    "https://www.adobe.com/careers.html",
    "tech",
    "",
    ""
  ],
  [
    "eBay Inc",
    79,
    "direct",
    "moderate",
    "Cloud and Big Tech",
    "https://careers.ebayinc.com/",
    "tech, cloud",
    "",
    ""
  ],
  [
    "General Motors",
    75,
    "direct",
    "moderate",
    "Automotive and Mobility",
    "https://careers.gm.com/",
    "other",
    "",
    ""
  ],
  [
    "WELLS FARGO BANK, N.A",
    73,
    "direct",
    "moderate",
    "Fintech and Finance",
    "https://www.wellsfargo.com/about/careers/",
    "fintech",
    "",
    ""
  ],
  [
    "Intuit Inc",
    68,
    "direct",
    "moderate",
    "Enterprise Software",
    "https://careers.intuit.com/",
    "tech",
    "",
    ""
  ],
  [
    "Expedia, Inc",
    68,
    "direct",
    "moderate",
    "Enterprise Software",
    "https://lifeatexpedia.com/",
    "tech",
    "",
    ""
  ],
  [
    "Intel Corporation",
    67,
    "direct",
    "moderate",
    "Cloud and Big Tech",
    "https://jobs.intel.com/",
    "tech, cloud",
    "",
    ""
  ],
  [
    "ServiceNow, Inc",
    67,
    "direct",
    "moderate",
    "Cloud and Big Tech",
    "https://careers.servicenow.com/",
    "tech, cloud",
    "",
    ""
  ],
  [
    "Uber Technologies, Inc",
    66,
    "direct",
    "moderate",
    "Cloud and Big Tech",
    "https://www.uber.com/us/en/careers/",
    "tech, cloud",
    "",
    ""
  ],
  [
    "Capgemini America Inc",
    64,
    "direct",
    "moderate",
    "Consulting and Services",
    "https://www.capgemini.com/careers/",
    "consulting",
    "",
    ""
  ],
  [
    "CGI Technologies and Solutions Inc",
    62,
    "direct",
    "moderate",
    "Consulting and Services",
    "https://www.cgi.com/en/careers",
    "consulting",
    "",
    ""
  ],
  [
    "FORD MOTOR COMPANY",
    61,
    "direct",
    "moderate",
    "Automotive and Mobility",
    "https://careers.ford.com/",
    "other",
    "",
    ""
  ],
  [
    "Tesla, Inc",
    60,
    "direct",
    "moderate",
    "Automotive and Mobility",
    "https://www.tesla.com/careers",
    "other",
    "",
    ""
  ],
  [
    "Lowe's Companies, Inc",
    60,
    "direct",
    "moderate",
    "Retail and Consumer",
    "https://jobs.lowes.com/",
    "other",
    "",
    ""
  ],
  [
    "Citibank, N.A",
    58,
    "direct",
    "moderate",
    "Fintech and Finance",
    "https://jobs.citi.com/",
    "fintech",
    "",
    ""
  ],
  [
    "Oracle America, Inc",
    56,
    "direct",
    "moderate",
    "Cloud and Big Tech",
    "https://www.oracle.com/careers/",
    "tech, cloud",
    "",
    ""
  ],
  [
    "Salesforce, Inc",
    54,
    "direct",
    "moderate",
    "Cloud and Big Tech",
    "https://www.salesforce.com/company/careers/",
    "tech, cloud",
    "",
    ""
  ],
  [
    "FIS Management Services, LLC",
    52,
    "direct",
    "moderate",
    "Fintech and Finance",
    "https://careers.fisglobal.com/",
    "fintech",
    "",
    ""
  ],
  [
    "CVS Pharmacy Inc",
    51,
    "direct",
    "moderate",
    "Health and Life Sciences",
    "https://jobs.cvshealth.com/",
    "healthcare",
    "",
    ""
  ],
  [
    "DoorDash, Inc",
    51,
    "direct",
    "moderate",
    "Cloud and Big Tech",
    "https://careers.doordash.com/",
    "tech, cloud",
    "",
    ""
  ],
  [
    "The MathWorks, Inc",
    51,
    "direct",
    "moderate",
    "Enterprise Software",
    "https://www.mathworks.com/company/jobs/",
    "tech",
    "",
    ""
  ],
  [
    "Charter Communications, Inc",
    50,
    "direct",
    "moderate",
    "Telecom and Media",
    "https://jobs.spectrum.com/",
    "other",
    "",
    ""
  ],
  [
    "Netflix, Inc",
    48,
    "direct",
    "curated",
    "Cloud and Big Tech",
    "https://jobs.netflix.com/",
    "tech, cloud",
    "",
    ""
  ],
  [
    "Snowflake Inc",
    48,
    "direct",
    "curated",
    "AI and Data",
    "https://careers.snowflake.com/",
    "tech, ai",
    "",
    ""
  ],
  [
    "SNAP INC",
    47,
    "direct",
    "curated",
    "Cloud and Big Tech",
    "https://careers.snap.com/",
    "tech, cloud",
    "",
    ""
  ],
  [
    "Capital One Services, LLC",
    44,
    "direct",
    "curated",
    "Fintech and Finance",
    "https://www.capitalonecareers.com/",
    "fintech",
    "",
    ""
  ],
  [
    "First Citizens Bank and Trust Co",
    44,
    "direct",
    "curated",
    "Fintech and Finance",
    "https://careers.firstcitizens.com/",
    "fintech",
    "",
    ""
  ],
  [
    "Pinterest, Inc",
    43,
    "direct",
    "curated",
    "Cloud and Big Tech",
    "https://www.pinterestcareers.com/",
    "tech, cloud",
    "",
    ""
  ],
  [
    "Truist Bank",
    43,
    "direct",
    "curated",
    "Fintech and Finance",
    "https://careers.truist.com/",
    "fintech",
    "",
    ""
  ],
  [
    "Optum Services, Inc",
    42,
    "direct",
    "curated",
    "Health and Life Sciences",
    "https://careers.unitedhealthgroup.com/",
    "healthcare",
    "",
    ""
  ],
  [
    "Indeed, Inc",
    42,
    "direct",
    "curated",
    "Enterprise Software",
    "https://www.indeed.com/about/careers",
    "tech",
    "",
    ""
  ],
  [
    "CVS Shared Services Resources LLC",
    41,
    "direct",
    "curated",
    "Health and Life Sciences",
    "",
    "healthcare",
    "",
    ""
  ],
  [
    "Microsoft Corporation",
    40,
    "direct",
    "curated",
    "Cloud and Big Tech",
    "https://careers.microsoft.com/",
    "tech, cloud",
    "",
    ""
  ],
  [
    "Columbia University",
    39,
    "direct",
    "curated",
    "Enterprise Software",
    "https://hr.columbia.edu/jobs",
    "tech",
    "",
    ""
  ],
  [
    "American Express Travel Related Services Company, Inc",
    38,
    "direct",
    "curated",
    "Fintech and Finance",
    "https://aexp.eightfold.ai/careers",
    "fintech",
    "",
    ""
  ],
  [
    "Home Depot Management Company LLC",
    37,
    "direct",
    "curated",
    "Retail and Consumer",
    "https://careers.homedepot.com/",
    "other",
    "",
    ""
  ],
  [
    "Humana Inc",
    37,
    "direct",
    "curated",
    "Health and Life Sciences",
    "https://careers.humana.com/",
    "healthcare",
    "",
    ""
  ],
  [
    "Federal Express Corporation",
    37,
    "direct",
    "curated",
    "Enterprise Software",
    "https://careers.fedex.com/",
    "tech",
    "",
    ""
  ],
  [
    "TikTok Inc",
    36,
    "direct",
    "curated",
    "Cloud and Big Tech",
    "https://careers.tiktok.com/",
    "tech, cloud",
    "",
    ""
  ],
  [
    "TECH MAHINDRA (AMERICAS), INC",
    36,
    "direct",
    "curated",
    "Consulting and Services",
    "https://careers.techmahindra.com/",
    "consulting",
    "",
    ""
  ],
  [
    "Atlassian US, Inc",
    35,
    "direct",
    "curated",
    "Cloud and Big Tech",
    "https://www.atlassian.com/company/careers",
    "tech, cloud",
    "",
    ""
  ],
  [
    "Hexaware Technologies, Inc",
    34,
    "direct",
    "curated",
    "Consulting and Services",
    "https://hexaware.com/careers/",
    "consulting",
    "",
    ""
  ],
  [
    "Barclays Services Corp",
    34,
    "direct",
    "curated",
    "Fintech and Finance",
    "https://home.barclays/careers/",
    "fintech",
    "",
    ""
  ],
  [
    "Workday, Inc",
    34,
    "direct",
    "curated",
    "Cloud and Big Tech",
    "https://www.workday.com/en-us/company/careers.html",
    "tech, cloud",
    "",
    ""
  ],
  [
    "Mastercard Technologies, LLC",
    33,
    "direct",
    "curated",
    "Fintech and Finance",
    "https://careers.mastercard.com/",
    "fintech",
    "",
    ""
  ],
  [
    "BYTEDANCE INC",
    32,
    "direct",
    "curated",
    "Cloud and Big Tech",
    "https://jobs.bytedance.com/",
    "tech, cloud",
    "",
    ""
  ],
  [
    "Cisco Systems, Inc",
    32,
    "direct",
    "curated",
    "Cloud and Big Tech",
    "https://jobs.cisco.com/",
    "tech, cloud",
    "",
    ""
  ],
  [
    "Concentrix CVG Customer Management Group Inc",
    31,
    "direct",
    "curated",
    "Consulting and Services",
    "https://careers.concentrix.com/",
    "consulting",
    "",
    ""
  ],
  [
    "Equifax Inc",
    31,
    "direct",
    "curated",
    "Enterprise Software",
    "https://careers.equifax.com/",
    "tech",
    "",
    ""
  ],
  [
    "Yale University",
    31,
    "direct",
    "curated",
    "Enterprise Software",
    "https://www.yale.edu/about-yale/careers-yale",
    "tech",
    "",
    ""
  ],
  [
    "OpenAI OpCo, LLC",
    29,
    "direct",
    "curated",
    "AI and Data",
    "https://openai.com/careers/",
    "tech, ai",
    "",
    ""
  ],
  [
    "Docusign Inc",
    29,
    "direct",
    "curated",
    "Cloud and Big Tech",
    "https://www.docusign.com/company/careers",
    "tech, cloud",
    "",
    ""
  ],
  [
    "Caremark LLC",
    28,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Charter Communications Inc",
    27,
    "direct",
    "curated",
    "Telecom and Media",
    "",
    "other",
    "",
    ""
  ],
  [
    "Amazon Data Services, Inc",
    27,
    "direct",
    "curated",
    "Cloud and Big Tech",
    "https://www.amazon.jobs/",
    "tech, cloud, data",
    "",
    ""
  ],
  [
    "Waymo LLC",
    27,
    "direct",
    "curated",
    "Automotive and Mobility",
    "https://waymo.com/careers/",
    "other",
    "",
    ""
  ],
  [
    "Chewy, Inc",
    27,
    "direct",
    "curated",
    "Retail and Consumer",
    "https://careers.chewy.com/",
    "other",
    "",
    ""
  ],
  [
    "HubSpot, Inc",
    26,
    "direct",
    "curated",
    "Cloud and Big Tech",
    "https://www.hubspot.com/careers",
    "tech, cloud",
    "",
    ""
  ],
  [
    "Databricks, Inc",
    26,
    "direct",
    "curated",
    "AI and Data",
    "https://www.databricks.com/company/careers",
    "tech, ai, data",
    "",
    ""
  ],
  [
    "TATA CONSULTANCY SERVICES LIMITED",
    26,
    "direct",
    "curated",
    "Consulting and Services",
    "https://www.tcs.com/careers",
    "consulting",
    "",
    ""
  ],
  [
    "TikTok U.S. Data Security Inc",
    26,
    "direct",
    "curated",
    "Cloud and Big Tech",
    "",
    "tech, cloud, data",
    "",
    ""
  ],
  [
    "The Leland Stanford, Jr University",
    26,
    "direct",
    "curated",
    "Enterprise Software",
    "https://careers.stanford.edu/",
    "tech",
    "",
    ""
  ],
  [
    "Bloomberg L.P",
    25,
    "direct",
    "curated",
    "Fintech and Finance",
    "https://www.bloomberg.com/careers/",
    "fintech",
    "",
    ""
  ],
  [
    "Stripe, Inc",
    24,
    "direct",
    "curated",
    "Cloud and Big Tech",
    "https://stripe.com/jobs",
    "tech, cloud",
    "",
    ""
  ],
  [
    "Costco Wholesale Corporation",
    24,
    "direct",
    "curated",
    "Retail and Consumer",
    "https://www.costco.com/jobs.html",
    "other",
    "",
    ""
  ],
  [
    "AUDIBLE, INC",
    24,
    "direct",
    "curated",
    "Enterprise Software",
    "https://www.audiblecareers.com/",
    "tech",
    "",
    ""
  ],
  [
    "GlobalLogic Inc",
    23,
    "direct",
    "curated",
    "Consulting and Services",
    "https://www.globallogic.com/careers/",
    "consulting",
    "",
    ""
  ],
  [
    "UBS Business Solutions US LLC",
    23,
    "direct",
    "curated",
    "Fintech and Finance",
    "https://www.ubs.com/global/en/careers.html",
    "fintech",
    "",
    ""
  ],
  [
    "FedEx Freight, Inc",
    22,
    "direct",
    "curated",
    "Logistics and Industrial",
    "https://careers.fedex.com/",
    "other",
    "",
    ""
  ],
  [
    "ADP Technology Services, Inc",
    22,
    "direct",
    "curated",
    "Consulting and Services",
    "https://jobs.adp.com/",
    "consulting",
    "",
    ""
  ],
  [
    "Qualcomm Innovation Center, Inc",
    22,
    "direct",
    "curated",
    "Cloud and Big Tech",
    "https://www.qualcomm.com/company/careers",
    "tech, cloud",
    "",
    ""
  ],
  [
    "PERSISTENT SYSTEMS, INC",
    21,
    "direct",
    "curated",
    "Consulting and Services",
    "https://www.persistent.com/careers/",
    "consulting",
    "",
    ""
  ],
  [
    "ASML US, LP",
    21,
    "direct",
    "curated",
    "Hardware and Semiconductors",
    "https://www.asml.com/en/careers",
    "tech, ai",
    "",
    ""
  ],
  [
    "Deere & Company",
    21,
    "direct",
    "curated",
    "Logistics and Industrial",
    "https://www.deere.com/en/our-company/careers/",
    "other",
    "",
    ""
  ],
  [
    "Massachusetts Institute of Technology",
    21,
    "direct",
    "curated",
    "Enterprise Software",
    "https://careers.mit.edu/",
    "tech",
    "",
    ""
  ],
  [
    "Tiger Analytics, Inc",
    20,
    "direct",
    "curated",
    "Consulting and Services",
    "https://www.tigeranalytics.com/careers/",
    "data, consulting",
    "",
    ""
  ],
  [
    "AIRBNB, INC",
    20,
    "direct",
    "curated",
    "Cloud and Big Tech",
    "https://careers.airbnb.com/",
    "tech, cloud",
    "",
    ""
  ],
  [
    "UT Southwestern Medical Center",
    20,
    "direct",
    "curated",
    "Health and Life Sciences",
    "https://utswmed.org/jobs/",
    "healthcare",
    "",
    ""
  ],
  [
    "Coinbase, Inc",
    20,
    "direct",
    "curated",
    "Fintech and Finance",
    "https://www.coinbase.com/careers",
    "fintech",
    "",
    ""
  ],
  [
    "Moody's Analytics, Inc",
    19,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech, data",
    "",
    ""
  ],
  [
    "Rocket Mortgage, LLC",
    19,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "PERSISTENT SYSTEMS LIMITED",
    19,
    "direct",
    "curated",
    "Consulting and Services",
    "",
    "consulting",
    "",
    ""
  ],
  [
    "Aetna Resources LLC",
    19,
    "direct",
    "curated",
    "Health and Life Sciences",
    "",
    "healthcare",
    "",
    ""
  ],
  [
    "Docusign, Inc",
    18,
    "direct",
    "curated",
    "Cloud and Big Tech",
    "",
    "tech, cloud",
    "",
    ""
  ],
  [
    "Roblox Corporation",
    18,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Social Finance, LLC",
    18,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Citizens Financial Group, Inc",
    18,
    "direct",
    "curated",
    "Fintech and Finance",
    "",
    "fintech",
    "",
    ""
  ],
  [
    "RELX, Inc",
    18,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Barclays Services LLC",
    18,
    "direct",
    "curated",
    "Fintech and Finance",
    "",
    "fintech",
    "",
    ""
  ],
  [
    "SONY INTERACTIVE ENTERTAINMENT LLC",
    18,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Reddit, Inc",
    17,
    "direct",
    "curated",
    "Cloud and Big Tech",
    "",
    "tech, cloud",
    "",
    ""
  ],
  [
    "Zoox, Inc",
    17,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Qualcomm Atheros, Inc",
    17,
    "direct",
    "curated",
    "Cloud and Big Tech",
    "",
    "tech, cloud",
    "",
    ""
  ],
  [
    "7-Eleven, Inc",
    17,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Cummins Inc",
    17,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Emory University",
    16,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "F5, Inc",
    16,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "CARIAD, Inc",
    16,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Annapurna Labs (U.S.) Inc",
    16,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "University of Michigan",
    16,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "NIKE, Inc",
    16,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Zoox Inc",
    16,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "NYU Grossman School of Medicine",
    15,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "The Northern Trust Company",
    15,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Penske Truck Leasing Co LP",
    15,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Capital One, National Association",
    15,
    "direct",
    "curated",
    "Fintech and Finance",
    "",
    "fintech",
    "",
    ""
  ],
  [
    "Paycom Payroll, LLC",
    15,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "BANK OF AMERICA N.A",
    15,
    "direct",
    "curated",
    "Fintech and Finance",
    "",
    "fintech",
    "",
    ""
  ],
  [
    "Delta Air Lines, Inc",
    15,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Axon Enterprise, Inc",
    15,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "BEST BUY CO., INC",
    15,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Comcast Cable Communications, LLC",
    15,
    "direct",
    "curated",
    "Telecom and Media",
    "",
    "other",
    "",
    ""
  ],
  [
    "CitiusTech Inc",
    15,
    "direct",
    "curated",
    "Fintech and Finance",
    "",
    "fintech",
    "",
    ""
  ],
  [
    "Crusoe Energy Systems, Inc",
    14,
    "direct",
    "curated",
    "Consulting and Services",
    "",
    "consulting",
    "",
    ""
  ],
  [
    "Lawrence Livermore National Security, LLC",
    14,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Motorola Solutions, Inc",
    14,
    "direct",
    "curated",
    "Consulting and Services",
    "",
    "consulting",
    "",
    ""
  ],
  [
    "Asurion, LLC",
    14,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Fortinet, Inc",
    14,
    "direct",
    "curated",
    "Cybersecurity",
    "",
    "other",
    "",
    ""
  ],
  [
    "Northwestern Mutual Life Insurance Company",
    14,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Autodesk, Inc",
    14,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Zions Bancorporation, N.A",
    14,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "The PNC Financial Services Group, Inc",
    14,
    "direct",
    "curated",
    "Consulting and Services",
    "",
    "consulting",
    "",
    ""
  ],
  [
    "Discover Products Inc",
    14,
    "direct",
    "curated",
    "Fintech and Finance",
    "",
    "fintech",
    "",
    ""
  ],
  [
    "Dell USA L.P",
    13,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Visa Technology & Operations LLC",
    13,
    "direct",
    "curated",
    "Fintech and Finance",
    "",
    "fintech",
    "",
    ""
  ],
  [
    "Visa U.S.A. Inc",
    13,
    "direct",
    "curated",
    "Fintech and Finance",
    "",
    "fintech",
    "",
    ""
  ],
  [
    "Wayfair LLC",
    13,
    "direct",
    "curated",
    "Retail and Consumer",
    "",
    "other",
    "",
    ""
  ],
  [
    "Palo Alto Networks, Inc",
    13,
    "direct",
    "curated",
    "Cybersecurity",
    "",
    "other",
    "",
    ""
  ],
  [
    "PamTen, Inc",
    13,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "ADAEQUARE INC",
    13,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Memorial Sloan Kettering Cancer Center",
    13,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "ATOS SYNTEL INC",
    13,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "United Services Automobile Association",
    12,
    "direct",
    "curated",
    "Consulting and Services",
    "",
    "consulting",
    "",
    ""
  ],
  [
    "Medtronic, Inc",
    12,
    "direct",
    "curated",
    "Health and Life Sciences",
    "",
    "healthcare",
    "",
    ""
  ],
  [
    "Tinder LLC",
    12,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "CBRE, INC",
    12,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "The University of Virginia",
    12,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Credit Karma, LLC",
    12,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Robinhood Markets, Inc",
    12,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Akamai Technologies, Inc",
    12,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech, ai",
    "",
    ""
  ],
  [
    "Zappos.com LLC",
    12,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "LexisNexis Risk Solutions, Inc",
    12,
    "direct",
    "curated",
    "Consulting and Services",
    "",
    "consulting",
    "",
    ""
  ],
  [
    "Purdue University",
    12,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "The Travelers Indemnity Company",
    11,
    "direct",
    "curated",
    "Insurance",
    "",
    "other",
    "",
    ""
  ],
  [
    "University of Illinois",
    11,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "THE UNIVERSITY OF TEXAS M.D. ANDERSON CANCER CENTER",
    11,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Two Sigma Investments, LP",
    11,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Cotiviti, Inc",
    11,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Unity Technologies SF",
    11,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "KLA Corporation",
    11,
    "direct",
    "curated",
    "Hardware and Semiconductors",
    "",
    "tech",
    "",
    ""
  ],
  [
    "The Bank of New York Mellon",
    11,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Ameriprise Financial, Inc",
    11,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Amgen Inc",
    11,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "National Charitable Services LLC d/b/a Fidelity Investments",
    11,
    "direct",
    "curated",
    "Fintech and Finance",
    "",
    "fintech",
    "",
    ""
  ],
  [
    "Orion Systems Integrators LLC",
    11,
    "direct",
    "curated",
    "Consulting and Services",
    "",
    "consulting",
    "",
    ""
  ],
  [
    "NetApp, Inc",
    11,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Upstart Network, Inc",
    11,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "The University of Iowa",
    11,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Qualtrics, LLC",
    11,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "University of Maryland College Park",
    11,
    "direct",
    "curated",
    "Logistics and Industrial",
    "",
    "other",
    "",
    ""
  ],
  [
    "INFOSYS LIMITED",
    10,
    "direct",
    "curated",
    "Consulting and Services",
    "",
    "consulting",
    "",
    ""
  ],
  [
    "United Wholesale Mortgage, LLC",
    10,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "NAGARRO, INC",
    10,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Macy's Systems & Technology, Inc",
    10,
    "direct",
    "curated",
    "Consulting and Services",
    "",
    "consulting",
    "",
    ""
  ],
  [
    "Bayer Research and Development Services LLC",
    10,
    "direct",
    "curated",
    "Consulting and Services",
    "",
    "consulting",
    "",
    ""
  ],
  [
    "Hartford Fire Insurance Company",
    10,
    "direct",
    "curated",
    "Automotive and Mobility",
    "",
    "other",
    "",
    ""
  ],
  [
    "Guidewire Software, Inc",
    10,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Aptiv US Services General Partnership",
    10,
    "direct",
    "curated",
    "Consulting and Services",
    "",
    "consulting",
    "",
    ""
  ],
  [
    "H-E-B, LP",
    10,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "ST. JUDE CHILDREN'S RESEARCH HOSPITAL",
    10,
    "direct",
    "curated",
    "Health and Life Sciences",
    "",
    "healthcare",
    "",
    ""
  ],
  [
    "Zoom Communications, Inc",
    10,
    "direct",
    "curated",
    "Cloud and Big Tech",
    "",
    "tech, cloud",
    "",
    ""
  ],
  [
    "Advanced Micro Devices, Inc",
    10,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Wolters Kluwer DXG U.S., Inc",
    10,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "AutoZone, Inc",
    10,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "DK Crown Holdings Inc",
    10,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "ACE American Insurance Company",
    10,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "IQVIA RDS Inc",
    10,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Siemens Industry Software Inc",
    9,
    "direct",
    "curated",
    "Logistics and Industrial",
    "",
    "other",
    "",
    ""
  ],
  [
    "Experian Information Solutions, Inc",
    9,
    "direct",
    "curated",
    "Consulting and Services",
    "",
    "consulting",
    "",
    ""
  ],
  [
    "Rokt US Corp",
    9,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "The Depository Trust & Clearing Corporation",
    9,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Resolve AI, Inc",
    9,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "The Prudential Insurance Company of America",
    9,
    "direct",
    "curated",
    "Insurance",
    "",
    "other",
    "",
    ""
  ],
  [
    "S.W.I.F.T., Inc",
    9,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "The Ohio State University",
    9,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Boston Consulting Group, Inc",
    9,
    "direct",
    "curated",
    "Consulting and Services",
    "",
    "consulting",
    "",
    ""
  ],
  [
    "Cadence Design Systems, Inc",
    9,
    "direct",
    "curated",
    "Consulting and Services",
    "",
    "consulting",
    "",
    ""
  ],
  [
    "Teladoc Health Inc",
    9,
    "direct",
    "curated",
    "Health and Life Sciences",
    "",
    "healthcare",
    "",
    ""
  ],
  [
    "CITADEL ENTERPRISE AMERICAS SERVICES LLC",
    9,
    "direct",
    "curated",
    "Consulting and Services",
    "",
    "consulting",
    "",
    ""
  ],
  [
    "Epsilon Data Management LLC",
    9,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech, data",
    "",
    ""
  ],
  [
    "Deloitte Services LP",
    9,
    "direct",
    "curated",
    "Consulting and Services",
    "",
    "consulting",
    "",
    ""
  ],
  [
    "Applied Intuition, Inc",
    9,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "WGU Corporation",
    9,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Aurora Operations, Inc",
    9,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Nokia of America Corporation",
    9,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Hewlett Packard Enterprise Company",
    9,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Virginia Polytechnic Institute & State University",
    9,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Lawrence Berkeley National Laboratory",
    9,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Global Payment Holding Company",
    9,
    "direct",
    "curated",
    "Consulting and Services",
    "",
    "consulting",
    "",
    ""
  ],
  [
    "PURE STORAGE, INC",
    9,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Government Employee Insurance Company (GEICO)",
    9,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Marriott International, Inc",
    9,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "M&T Bank",
    9,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Arizona State University",
    9,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Lucid USA, Inc",
    8,
    "direct",
    "curated",
    "Automotive and Mobility",
    "",
    "other",
    "",
    ""
  ],
  [
    "VIRTUSA CORPORATION",
    8,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Southwest Airlines Co",
    8,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "The Guardian Life Insurance Company of America",
    8,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Progressive Casualty Insurance Company",
    8,
    "direct",
    "curated",
    "Insurance",
    "",
    "other",
    "",
    ""
  ],
  [
    "Publix Super Markets, Inc",
    8,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "COMTEC CONSULTANTS INC",
    8,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Coupang Global LLC",
    8,
    "direct",
    "curated",
    "Consulting and Services",
    "",
    "consulting",
    "",
    ""
  ],
  [
    "Safeway Inc",
    8,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Klaviyo, Inc",
    8,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "National Railroad Passenger Corporation",
    8,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "General Hospital Corporation",
    8,
    "direct",
    "curated",
    "Health and Life Sciences",
    "",
    "healthcare",
    "",
    ""
  ],
  [
    "TikTok USDS Joint Venture LLC",
    8,
    "direct",
    "curated",
    "Cloud and Big Tech",
    "",
    "tech, cloud",
    "",
    ""
  ],
  [
    "Maplebear Inc",
    8,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "FactSet Research Systems Inc",
    8,
    "direct",
    "curated",
    "Consulting and Services",
    "",
    "consulting",
    "",
    ""
  ],
  [
    "Intuites LLC",
    8,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Corewell Health",
    8,
    "direct",
    "curated",
    "Health and Life Sciences",
    "",
    "healthcare",
    "",
    ""
  ],
  [
    "Dropbox, Inc",
    8,
    "direct",
    "curated",
    "Cloud and Big Tech",
    "",
    "tech, cloud",
    "",
    ""
  ],
  [
    "The Vanguard Group, Inc",
    8,
    "direct",
    "curated",
    "Fintech and Finance",
    "",
    "fintech",
    "",
    ""
  ],
  [
    "Meijer Great Lakes Limited Partnership",
    8,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "McKesson Corporation",
    8,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "EPAM Systems Inc",
    8,
    "direct",
    "curated",
    "Consulting and Services",
    "",
    "consulting",
    "",
    ""
  ],
  [
    "Johns Hopkins University",
    8,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "SEATTLE CHILDREN'S HOSPITAL",
    8,
    "direct",
    "curated",
    "Health and Life Sciences",
    "",
    "healthcare",
    "",
    ""
  ],
  [
    "Environmental Systems Research Institute, Inc",
    8,
    "direct",
    "curated",
    "Consulting and Services",
    "",
    "consulting",
    "",
    ""
  ],
  [
    "Figma, Inc",
    8,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Zscaler, Inc",
    8,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Twilio, Inc",
    8,
    "direct",
    "curated",
    "Cloud and Big Tech",
    "",
    "tech, cloud",
    "",
    ""
  ],
  [
    "Mayo Clinic",
    8,
    "direct",
    "curated",
    "Health and Life Sciences",
    "",
    "healthcare",
    "",
    ""
  ],
  [
    "Point72, L.P",
    8,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "TRUSTEES OF BOSTON UNIVERSITY",
    8,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Millennium Software, Inc",
    8,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "United Parcel Service General Services, Co",
    8,
    "direct",
    "curated",
    "Consulting and Services",
    "",
    "consulting",
    "",
    ""
  ],
  [
    "Okta, Inc",
    8,
    "direct",
    "curated",
    "Cloud and Big Tech",
    "",
    "tech, cloud",
    "",
    ""
  ],
  [
    "Deloitte Tax LLP",
    8,
    "direct",
    "curated",
    "Consulting and Services",
    "",
    "consulting",
    "",
    ""
  ],
  [
    "UT-BATTELLE, LLC (OAK RIDGE NATIONAL LABORATORY)",
    8,
    "direct",
    "curated",
    "Logistics and Industrial",
    "",
    "other",
    "",
    ""
  ],
  [
    "ServiceTitan, Inc",
    8,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Duolingo, Inc",
    7,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "University of Texas Health Science Center at San Antonio",
    7,
    "direct",
    "curated",
    "Health and Life Sciences",
    "",
    "healthcare",
    "",
    ""
  ],
  [
    "Moody's Investors Service, Inc",
    7,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Insight Direct USA, Inc",
    7,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Elevance Health, Inc",
    7,
    "direct",
    "curated",
    "Health and Life Sciences",
    "",
    "healthcare",
    "",
    ""
  ],
  [
    "Rivian and Volkswagen Group Technologies, LLC",
    7,
    "direct",
    "curated",
    "Automotive and Mobility",
    "",
    "other",
    "",
    ""
  ],
  [
    "Walgreen Co",
    7,
    "direct",
    "curated",
    "Retail and Consumer",
    "",
    "other",
    "",
    ""
  ],
  [
    "Western Union, LLC",
    7,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Liberty Mutual Technology Group Inc",
    7,
    "direct",
    "curated",
    "Insurance",
    "",
    "other",
    "",
    ""
  ],
  [
    "AppFolio Inc",
    7,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "SIRIUS XM RADIO LLC",
    7,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Caterpillar Inc",
    7,
    "direct",
    "curated",
    "Logistics and Industrial",
    "",
    "other",
    "",
    ""
  ],
  [
    "SPOTIFY USA, INC",
    7,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Cohesity, Inc",
    7,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Adyen N.V",
    7,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "ExlService.com, LLC",
    7,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Affirm, Inc",
    7,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "TORC Robotics, Inc",
    7,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Teradata Operations, Inc",
    7,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech, data",
    "",
    ""
  ],
  [
    "American Airlines, Inc",
    7,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Inovalon, Inc",
    7,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Colorado State University",
    7,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Netskope, Inc",
    7,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Ancestry.com Operations Inc",
    7,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Paychex North America Inc",
    7,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Arm, Inc",
    7,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Chan Zuckerberg Biohub, Inc",
    7,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Notion Labs, Inc",
    7,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Block, Inc",
    7,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "MOBIREY LLC",
    7,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Brillio, LLC",
    7,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Staples, Inc",
    7,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Thumbtack, Inc",
    7,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Fujitsu North America, Inc",
    7,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Gen Digital Inc",
    7,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Xmotors.Ai, Inc",
    7,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Riot Games, Inc",
    7,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "LYFT, Inc",
    7,
    "direct",
    "curated",
    "Cloud and Big Tech",
    "",
    "tech, cloud",
    "",
    ""
  ],
  [
    "DFS Corporate Services LLC",
    7,
    "direct",
    "curated",
    "Consulting and Services",
    "",
    "consulting",
    "",
    ""
  ],
  [
    "Rackspace US, Inc",
    7,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Navy Federal Credit Union",
    7,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Red Hat, Inc",
    7,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Vitesco Technologies USA, LLC",
    6,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Box, Inc",
    6,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Delta Dental Of California",
    6,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "MetLife Group, Inc",
    6,
    "direct",
    "curated",
    "Insurance",
    "",
    "other",
    "",
    ""
  ],
  [
    "The University of Chicago",
    6,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "The University of Texas Health Science Center at Houston",
    6,
    "direct",
    "curated",
    "Health and Life Sciences",
    "",
    "healthcare",
    "",
    ""
  ],
  [
    "Raymond James & Associates, Inc",
    6,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Tredence Inc",
    6,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Etsy, Inc",
    6,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Cedars-Sinai Medical Center",
    6,
    "direct",
    "curated",
    "Health and Life Sciences",
    "",
    "ai, healthcare",
    "",
    ""
  ],
  [
    "Whatnot Inc",
    6,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Integral Ad Science, Inc",
    6,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Field AI, Inc",
    6,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Discord, Inc",
    6,
    "direct",
    "curated",
    "Cloud and Big Tech",
    "",
    "tech, cloud",
    "",
    ""
  ],
  [
    "The Chamberlain Group LLC",
    6,
    "direct",
    "curated",
    "Consulting and Services",
    "",
    "consulting",
    "",
    ""
  ],
  [
    "BROWN BROTHERS HARRIMAN & CO",
    6,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Schlumberger Technology Corporation",
    6,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Fireworks.ai, Inc",
    6,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Superhuman Platform Inc",
    6,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Yahoo Holdings Inc",
    6,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "The Kroger Company",
    6,
    "direct",
    "curated",
    "Retail and Consumer",
    "",
    "other",
    "",
    ""
  ],
  [
    "Juniper Networks, Inc",
    6,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "COLLECTIVEHEALTH, INC",
    6,
    "direct",
    "curated",
    "Health and Life Sciences",
    "",
    "healthcare",
    "",
    ""
  ],
  [
    "USG, Inc",
    6,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Airline Tariff Publishing Company (ATPCO)",
    6,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "MONGODB, INC",
    6,
    "direct",
    "curated",
    "Cloud and Big Tech",
    "",
    "tech, cloud",
    "",
    ""
  ],
  [
    "The Sherwin-Williams Company",
    6,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "CLOUDFLARE, INC",
    6,
    "direct",
    "curated",
    "Cloud and Big Tech",
    "",
    "tech, cloud",
    "",
    ""
  ],
  [
    "University of Pittsburgh",
    6,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Garmin International Inc",
    6,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Worldpay, LLC",
    6,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Twitch Interactive, Inc",
    6,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "University of Texas Medical Branch",
    6,
    "direct",
    "curated",
    "Health and Life Sciences",
    "",
    "healthcare",
    "",
    ""
  ],
  [
    "Applied Materials, Inc",
    6,
    "direct",
    "curated",
    "Hardware and Semiconductors",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Nexterapath, Inc",
    6,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Sunbelt Rentals, Inc",
    6,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "FedEx Dataworks, Inc",
    6,
    "direct",
    "curated",
    "Logistics and Industrial",
    "",
    "data",
    "",
    ""
  ],
  [
    "Wellington Management Company LLP",
    6,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Lumen Technologies Service Group, LLC",
    5,
    "direct",
    "curated",
    "Telecom and Media",
    "",
    "other",
    "",
    ""
  ],
  [
    "Snorkel AI, Inc",
    5,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Skill Voice Inc",
    5,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Smartsheet, Inc",
    5,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Datadog, Inc",
    5,
    "direct",
    "curated",
    "Cloud and Big Tech",
    "",
    "tech, cloud, data",
    "",
    ""
  ],
  [
    "Honeywell International Inc",
    5,
    "direct",
    "curated",
    "Logistics and Industrial",
    "",
    "other",
    "",
    ""
  ],
  [
    "People Center, Inc. d/b/a Rippling",
    5,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Clearwater Analytics, LLC",
    5,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech, data",
    "",
    ""
  ],
  [
    "PARAMOUNT SOFTWARE SOLUTIONS INC",
    5,
    "direct",
    "curated",
    "Consulting and Services",
    "",
    "consulting",
    "",
    ""
  ],
  [
    "Scale AI, Inc",
    5,
    "direct",
    "curated",
    "AI and Data",
    "",
    "tech, ai",
    "",
    ""
  ],
  [
    "Wolters Kluwer United States Inc",
    5,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "State Farm Mutual Automobile Insurance Company",
    5,
    "direct",
    "curated",
    "Insurance",
    "",
    "other",
    "",
    ""
  ],
  [
    "Converse Inc",
    5,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "HERE North America, LLC",
    5,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Dow Jones and Company, Inc",
    5,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "ConsultAdd Inc",
    5,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "StubHub, Inc",
    5,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Corporation Service Company",
    5,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Starbucks Coffee Company",
    5,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Accenture LLP",
    5,
    "direct",
    "curated",
    "Consulting and Services",
    "",
    "consulting",
    "",
    ""
  ],
  [
    "HP Inc",
    5,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Peloton Interactive, Inc",
    5,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Cruise LLC",
    5,
    "direct",
    "curated",
    "Automotive and Mobility",
    "",
    "other",
    "",
    ""
  ],
  [
    "PPD Development, L.P",
    5,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Susquehanna International Group, LLP",
    5,
    "direct",
    "curated",
    "Consulting and Services",
    "",
    "consulting",
    "",
    ""
  ],
  [
    "HARVEY AI CORPORATION",
    5,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech, ai",
    "",
    ""
  ],
  [
    "Move Sales, Inc",
    5,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Cytel Inc",
    5,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Discovery Communications, LLC",
    5,
    "direct",
    "curated",
    "Fintech and Finance",
    "",
    "fintech",
    "",
    ""
  ],
  [
    "Administrators of the Tulane Educational Fund",
    5,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "T. Rowe Price Associates, Inc",
    5,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "NORTHWELL HEALTH",
    5,
    "direct",
    "curated",
    "Health and Life Sciences",
    "",
    "healthcare",
    "",
    ""
  ],
  [
    "Laboratory Corporation of America Holdings",
    5,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Nuro, Inc",
    5,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "ROBERT BOSCH  LLC",
    5,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Bill Me Later, Inc",
    5,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "BANDWIDTH, INC",
    5,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Genentech, Inc",
    5,
    "direct",
    "curated",
    "Health and Life Sciences",
    "",
    "healthcare",
    "",
    ""
  ],
  [
    "Qualcomm Incorporated",
    5,
    "direct",
    "curated",
    "Cloud and Big Tech",
    "",
    "tech, cloud",
    "",
    ""
  ],
  [
    "Arista Networks, Inc",
    5,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "The Research Institute at Nationwide Children's Hospital",
    5,
    "direct",
    "curated",
    "Health and Life Sciences",
    "",
    "healthcare",
    "",
    ""
  ],
  [
    "Massachusetts Mutual Life Insurance Company",
    5,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "COPART, INC",
    5,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "The University of Alabama at Birmingham",
    5,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "CNH Industrial America LLC",
    5,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "InMarket Media LLC",
    5,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "GSK Solutions, Inc",
    5,
    "direct",
    "curated",
    "Consulting and Services",
    "",
    "consulting",
    "",
    ""
  ],
  [
    "MPG Operations LLC",
    5,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Fiserv Solutions, LLC",
    5,
    "direct",
    "curated",
    "Consulting and Services",
    "",
    "consulting",
    "",
    ""
  ],
  [
    "GRID DYNAMICS HOLDINGS, INC",
    5,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Together Computer, Inc",
    5,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Deloitte Consulting LLP",
    5,
    "direct",
    "curated",
    "Consulting and Services",
    "",
    "consulting",
    "",
    ""
  ],
  [
    "RIVIAN AUTOMOTIVE, LLC",
    5,
    "direct",
    "curated",
    "Automotive and Mobility",
    "",
    "other",
    "",
    ""
  ],
  [
    "Athene Annuity and Life Company",
    5,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Fanatics Retail Group Fulfillment LLC",
    5,
    "direct",
    "curated",
    "Consulting and Services",
    "",
    "consulting",
    "",
    ""
  ],
  [
    "C3.ai, Inc",
    5,
    "direct",
    "curated",
    "AI and Data",
    "",
    "tech, ai",
    "",
    ""
  ],
  [
    "BorgWarner PDS (USA) Inc",
    5,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "AvidXchange, Inc",
    5,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Research Foundation for the State University of New York",
    5,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Boston Scientific Corporation",
    5,
    "direct",
    "curated",
    "Health and Life Sciences",
    "",
    "healthcare",
    "",
    ""
  ],
  [
    "Relativity ODA LLC",
    5,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Brex Inc",
    5,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "General Motors Financial Company, Inc",
    5,
    "direct",
    "curated",
    "Automotive and Mobility",
    "",
    "other",
    "",
    ""
  ],
  [
    "University of Washington",
    5,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Van Andel Research Institute",
    5,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Rubrik, Inc",
    5,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Petco Animal Supplies Stores, Inc",
    5,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Macy's Systems and Technology, Inc",
    5,
    "direct",
    "curated",
    "Consulting and Services",
    "",
    "consulting",
    "",
    ""
  ],
  [
    "Vizient, Inc",
    5,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Amazon Advertising LLC",
    5,
    "direct",
    "curated",
    "Cloud and Big Tech",
    "",
    "tech, cloud",
    "",
    ""
  ],
  [
    "Texas A&M University",
    5,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Mercor.io Corporation",
    5,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Texas Instruments Incorporated",
    5,
    "direct",
    "curated",
    "Hardware and Semiconductors",
    "",
    "tech",
    "",
    ""
  ],
  [
    "American Bankers Insurance Company of Florida",
    5,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "BOR USGA obo Augusta University",
    5,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "KPIT Technologies, Inc",
    5,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "The Children's Hospital of Philadelphia",
    5,
    "direct",
    "curated",
    "Health and Life Sciences",
    "",
    "healthcare",
    "",
    ""
  ],
  [
    "LexisNexis Risk Solutions Inc",
    5,
    "direct",
    "curated",
    "Consulting and Services",
    "",
    "consulting",
    "",
    ""
  ],
  [
    "Rocket Limited Partnership",
    5,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Lam Research Corporation",
    5,
    "direct",
    "curated",
    "Hardware and Semiconductors",
    "",
    "tech",
    "",
    ""
  ],
  [
    "S&P Global Market Intelligence Inc",
    5,
    "direct",
    "curated",
    "Cloud and Big Tech",
    "",
    "tech, cloud, data",
    "",
    ""
  ],
  [
    "Verizon Data Services LLC",
    5,
    "direct",
    "curated",
    "Telecom and Media",
    "",
    "data",
    "",
    ""
  ],
  [
    "ULINE, Inc",
    5,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Ford Motor Credit Company LLC",
    5,
    "direct",
    "curated",
    "Automotive and Mobility",
    "",
    "other",
    "",
    ""
  ],
  [
    "Cardinal Health",
    5,
    "direct",
    "curated",
    "Health and Life Sciences",
    "",
    "healthcare",
    "",
    ""
  ],
  [
    "Nationwide Mutual Insurance Company",
    5,
    "direct",
    "curated",
    "Insurance",
    "",
    "other",
    "",
    ""
  ],
  [
    "The Hertz Corporation",
    5,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Scott & White Health Plan",
    4,
    "direct",
    "curated",
    "Health and Life Sciences",
    "",
    "healthcare",
    "",
    ""
  ],
  [
    "Sentara Health",
    4,
    "direct",
    "curated",
    "Health and Life Sciences",
    "",
    "healthcare",
    "",
    ""
  ],
  [
    "OCLC, Inc",
    4,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Regions Bank",
    4,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Northeastern University",
    4,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "PALANTIR TECHNOLOGIES INC",
    4,
    "direct",
    "curated",
    "AI and Data",
    "",
    "tech, ai",
    "",
    ""
  ],
  [
    "Indiana University Indianapolis",
    4,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "DiDi Research America, LLC",
    4,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Foundation Medicine, Inc",
    4,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Iowa State University of Science and Technology",
    4,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Fortrea Inc",
    4,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "PACIFIC CONSULTANCY SERVICES LLC",
    4,
    "direct",
    "curated",
    "Consulting and Services",
    "",
    "consulting",
    "",
    ""
  ],
  [
    "Navan, Inc",
    4,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Sephora USA, Inc",
    4,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Flatiron Health, Inc",
    4,
    "direct",
    "curated",
    "Health and Life Sciences",
    "",
    "healthcare",
    "",
    ""
  ],
  [
    "Flexera Global, Inc",
    4,
    "direct",
    "curated",
    "Consulting and Services",
    "",
    "consulting",
    "",
    ""
  ],
  [
    "PATREON, INC",
    4,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "SHOPIFY (USA) INC",
    4,
    "direct",
    "curated",
    "Retail and Consumer",
    "",
    "other",
    "",
    ""
  ],
  [
    "RETOOL, INC",
    4,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Dish Wireless LLC",
    4,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Electronic Arts Inc",
    4,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "IQVIA Inc",
    4,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Ernst & Young U.S. LLP",
    4,
    "direct",
    "curated",
    "Consulting and Services",
    "",
    "consulting",
    "",
    ""
  ],
  [
    "Insurance Services Office, Inc",
    4,
    "direct",
    "curated",
    "Consulting and Services",
    "",
    "consulting",
    "",
    ""
  ],
  [
    "Rush University Medical Center",
    4,
    "direct",
    "curated",
    "Health and Life Sciences",
    "",
    "healthcare",
    "",
    ""
  ],
  [
    "GoodLeap, LLC",
    4,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "NCS Pearson, Inc",
    4,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "EvolutionIQ LLC",
    4,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "SYSINTEL, INC",
    4,
    "direct",
    "curated",
    "Cloud and Big Tech",
    "",
    "tech, cloud",
    "",
    ""
  ],
  [
    "EAB Global, Inc",
    4,
    "direct",
    "curated",
    "Consulting and Services",
    "",
    "consulting",
    "",
    ""
  ],
  [
    "ProCare Pharmacy LLC",
    4,
    "direct",
    "curated",
    "Health and Life Sciences",
    "",
    "healthcare",
    "",
    ""
  ],
  [
    "QXO, Inc",
    4,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Extreme Networks Inc",
    4,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "FCA US LLC",
    4,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "General Dynamics Information Technology, Inc",
    4,
    "direct",
    "curated",
    "Aerospace and Defense",
    "",
    "other",
    "",
    ""
  ],
  [
    "HCA Management Services LP",
    4,
    "direct",
    "curated",
    "Consulting and Services",
    "",
    "consulting",
    "",
    ""
  ],
  [
    "Duke University",
    4,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "PayPal Data Services, Inc",
    4,
    "direct",
    "curated",
    "Cloud and Big Tech",
    "",
    "tech, cloud, data",
    "",
    ""
  ],
  [
    "FMR LLC d/b/a Fidelity Investments",
    4,
    "direct",
    "curated",
    "Fintech and Finance",
    "",
    "fintech",
    "",
    ""
  ],
  [
    "FOL Management LLC",
    4,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Parker Hannifin Corporation",
    4,
    "direct",
    "curated",
    "Logistics and Industrial",
    "",
    "other",
    "",
    ""
  ],
  [
    "Faire Wholesale, Inc",
    4,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "GREENSKY MANAGEMENT COMPANY LLC",
    4,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Intuitive Surgical Operations, Inc",
    4,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Dolby Laboratories, Inc",
    4,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "GOCOOL INC",
    4,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "RELEVANCE LAB, INC",
    4,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "NBCUniversal Media, LLC",
    4,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Saviynt, Inc",
    4,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "GSK SOLUTIONS INC",
    4,
    "direct",
    "curated",
    "Consulting and Services",
    "",
    "consulting",
    "",
    ""
  ],
  [
    "Cleveland Clinic Foundation",
    4,
    "direct",
    "curated",
    "Health and Life Sciences",
    "",
    "healthcare",
    "",
    ""
  ],
  [
    "Deloitte & Touche LLP",
    4,
    "direct",
    "curated",
    "Consulting and Services",
    "",
    "consulting",
    "",
    ""
  ],
  [
    "MedHOK, Inc",
    4,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Attentive Mobile, Inc",
    4,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "LatentView Analytics Corporation",
    4,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech, data",
    "",
    ""
  ],
  [
    "University of California, Los Angeles",
    4,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "BANK OZK",
    4,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Mastercard International Incorporated",
    4,
    "direct",
    "curated",
    "Fintech and Finance",
    "",
    "fintech",
    "",
    ""
  ],
  [
    "Bean Infosystems LLC",
    4,
    "direct",
    "curated",
    "Consulting and Services",
    "",
    "consulting",
    "",
    ""
  ],
  [
    "McDonald's Corporation",
    4,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "McKinsey & Company, Inc. United States",
    4,
    "direct",
    "curated",
    "Consulting and Services",
    "",
    "consulting",
    "",
    ""
  ],
  [
    "The Simons Foundation Inc",
    4,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "University of Oklahoma",
    4,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "The Methodist Hospital Research Institute",
    4,
    "direct",
    "curated",
    "Health and Life Sciences",
    "",
    "healthcare",
    "",
    ""
  ],
  [
    "California Institute of Technology",
    4,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Calix, Inc",
    4,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "The Jackson Laboratory",
    4,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "The Florida State University",
    4,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Centene Management Company, LLC",
    4,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Chime Financial, Inc",
    4,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Clari, Inc",
    4,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "University of Georgia",
    4,
    "direct",
    "curated",
    "Enterprise Software",
    "",
    "tech",
    "",
    ""
  ],
  [
    "Leidos, Inc",
    4,
    "direct",
    "curated",
    "Aerospace and Defense",
    "",
    "other",
    "",
    ""
  ],
  [
    "T-Mobile USA, Inc",
    4,
    "direct",
    "curated",
    "Telecom and Media",
    "",
    "other",
    "",
    ""
  ],
  [
    "COMPUNNEL SOFTWARE GROUP, INC",
    469,
    "vendor",
    "strong",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Grandison Management, Inc",
    403,
    "vendor",
    "strong",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "People Tech Group, Inc",
    370,
    "vendor",
    "strong",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "KFORCE INC",
    133,
    "vendor",
    "moderate",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "UST Global Inc",
    114,
    "vendor",
    "moderate",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "RANDSTAD DIGITAL, LLC",
    114,
    "vendor",
    "moderate",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "INNOVA SOLUTIONS, INC",
    89,
    "vendor",
    "moderate",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "MSR TECHNOLOGY GROUP LLC",
    85,
    "vendor",
    "moderate",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "V-Soft Consulting Group, INC",
    81,
    "vendor",
    "moderate",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "L&T Technology Services Limited",
    76,
    "vendor",
    "moderate",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Majestic IT Services Inc",
    65,
    "vendor",
    "moderate",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Infinite Computer Solutions, Inc",
    64,
    "vendor",
    "moderate",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "GP TECHNOLOGIES LLC",
    57,
    "vendor",
    "moderate",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "SKILLTUNE TECHNOLOGIES INC",
    57,
    "vendor",
    "moderate",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Insight Global, LLC",
    54,
    "vendor",
    "moderate",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "SYSTEM SOFT TECHNOLOGIES, LLC",
    53,
    "vendor",
    "moderate",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Populus Group LLC",
    50,
    "vendor",
    "moderate",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "RJ Systems Inc",
    50,
    "vendor",
    "moderate",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Mastech Digital Technologies, Inc",
    49,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "CORPORATE SOLUTIONS GENERAL INC",
    48,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "HCL GLOBAL SYSTEMS INC",
    47,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "INTRAEDGE, INC",
    44,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Quadrant Technologies LLC",
    44,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Avco Consulting, Inc",
    41,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "ERP Analysts, Inc",
    40,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "HTC GLOBAL SERVICES INC",
    39,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "SCHRILL TECHNOLOGIES INC",
    38,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Itek Info Inc",
    37,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "SLK AMERICA INC",
    37,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Elite IT Technologies LLC",
    36,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "DENKEN SOLUTIONS, INC",
    34,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "DIGIPULSE TECHNOLOGIES, INC",
    32,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "PHOTON INFOTECH, INC",
    31,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "GOIN TECHNOLOGY, INC",
    31,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "NATSOFT CORPORATION",
    30,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "SAGE IT INC",
    30,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Infogain Corporation",
    29,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Pyramid Consulting, Inc",
    29,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Tek Leaders Inc",
    27,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "APPLAB SYSTEMS INC",
    26,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "New Era Technology, LLC",
    26,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "PIONEER CONSULTING SERVICES LLC",
    26,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "INTELLECTT, INC",
    25,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Orpine Inc",
    25,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "ARTIFICIAL INTELLIGENCE LLC",
    25,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "CLOUD ANALYTICS TECHNOLOGIES LLC",
    25,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "i-Link Solutions, Inc",
    25,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Verton Solutions Inc",
    25,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "VIRTUAL REALITY TECHNOLOGIES LLC",
    24,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "AI TECHNOLOGIES LLC",
    24,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Federal Soft Systems Inc",
    23,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Ventois, Inc",
    23,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "ROBOTICS TECHNOLOGIES LLC",
    23,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Eliassen Group, LLC",
    23,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "DataEconomy, Inc",
    23,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "DGN Technologies, Inc",
    22,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "EDU INFOTECH INTERNATIONAL RESOURCES INC",
    22,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "ValueMomentum, Inc",
    22,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Intellectt Inc",
    22,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Collaborate Solutions Inc",
    21,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Specs Inc",
    21,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Vastek Inc",
    21,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Experis US, LLC",
    20,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Management Health Systems, LLC",
    20,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Kyyba, Inc",
    20,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Sapphire Software Solutions, Inc",
    20,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "COGNIER INC",
    20,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Beacon Hill Solutions Group LLC",
    20,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Horizon International Trd. Inc",
    20,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Hire IT people, Inc",
    20,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "CyberSource Corporation",
    20,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "OneMain General Services Corporation",
    19,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "MITCHELL/MARTIN, INC",
    19,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Genesis Corp",
    19,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Idexcel Inc",
    19,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Strategic Staffing Solutions, L.C",
    19,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "ZIFO TECHNOLOGIES, INC",
    19,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "RPA TECHNOLOGIES LLC",
    19,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "CareSource Management Services, LLC",
    19,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "TECHPRO SOLUTIONS, INC",
    19,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Epitec, Inc",
    18,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "SQUAD SOFTWARE, INC",
    18,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Northstar Group, Inc",
    18,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "SAVVY INFO SYSTEMS INC",
    18,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "SIGMA SOFTWARE LLC",
    18,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Appridat Solutions LLC",
    18,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "JEAN MARTIN INC",
    18,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Leland Stanford Jr. Univ/SLAC National Accelerator Lab",
    18,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Artech, LLC",
    18,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Iris Software, Inc",
    17,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "BRAINS TECHNOLOGY SOLUTIONS, INC",
    17,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "IPOLARITY LLC",
    17,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "SATIN SOLUTIONS LLC",
    17,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "SAP Labs, LLC",
    17,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "TANISHA SYSTEMS INC",
    17,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "RJT Compuquest Inc. dba Apolis",
    17,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Headstrong Services LLC",
    17,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Akkodis, Inc",
    17,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Avani Technology Solutions, Inc",
    17,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Zensar Technologies, Inc",
    16,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "New York Technology Partners Inc",
    16,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Innovative Consulting Solutions LLC",
    16,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "ROBOTICS STAFFING LLC",
    16,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "ARTIFINT TECHNOLOGIES LLC",
    16,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Collabrium Systems, LLC",
    16,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Sandisk Technologies, Inc",
    16,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Pentangle Tech Services LLC",
    16,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "3i INFOTECH INC",
    16,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "ARTIFICIAL INTELLIGENCE STAFFING LLC",
    16,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "SWANKTEK INC",
    16,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Camelot Integrated Solutions Inc",
    16,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Hector Systems Inc",
    16,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Career Soft Solutions Inc",
    16,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Ascendion, Inc. (Formerly known as Collabera, Inc.)",
    16,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Eversoft Technologies LLC",
    16,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Acetech Group Corporation",
    16,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "SDH Systems LLC",
    16,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Tek Labs, Inc",
    16,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Fox Cable Network Services, LLC",
    15,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "MAHAUGHA LLC",
    15,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Marlabs LLC",
    15,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "TAVANT TECHNOLOGIES, INC",
    15,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "SRI Tech Solutions Inc",
    15,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Kelly Services, Inc",
    15,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "ETOUCH SYSTEMS CORPORATION",
    15,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Tech Tammina, LLC",
    15,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Vitosha Inc",
    15,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Asta CRS, Inc",
    15,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Isolve Technology Inc",
    15,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "ECONTENTI INC",
    15,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "DATAEDGE, INC",
    14,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "DREAM Venture Labs Inc",
    14,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "MIRACLE SOFTWARE SYSTEMS, INC",
    14,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "SAPPHIRE SOFTWARE SOLUTIONS INC",
    14,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "NobleSoft Solutions, Inc",
    14,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "SRI Tech Solutions, Inc",
    14,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Tekaccel Inc",
    14,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "ASTIR IT SOLUTIONS, INC",
    14,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Adroix Corp",
    14,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Novamegha LLC",
    14,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "NEON IT LLC",
    14,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Softworld Technologies LLC",
    14,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "COVANT SOLUTIONS, INC",
    14,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Megan Soft, Inc",
    14,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "ECCLESIASTES, INC",
    14,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Wingskyline Technologies Inc",
    14,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "EFICENS SYSTEMS INC",
    14,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Walbrydge Technologies Inc",
    14,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "INVOLGIXS INC",
    14,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "E-GIANTS TECHNOLOGIES LLC",
    14,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "VENTURESOFT GLOBAL INC",
    14,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Saipsit, Inc",
    14,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Numann Technologies, Inc",
    14,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Apex-2000 Inc",
    14,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Relevantz Technology Services, Inc",
    14,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Western Digital Technologies, Inc",
    14,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Infocons Inc",
    13,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Ana-Data Consulting, Inc",
    13,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "O3 TECHNOLOGY SOLUTIONS LLC",
    13,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "SAI TECHNOLOGIES, LLC",
    13,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Veridic Solutions LLC",
    13,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Meghaz Inc",
    13,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "PYRAMID TECHNOLOGY SOLUTIONS, INC",
    13,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "XORIANT CORPORATION",
    13,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "INTELENT INC (f.k.a SILICON STAFF IT SERVICES INC)",
    13,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "P2P SOFTTEK LLC",
    13,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Auger Inc",
    13,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "OKBL USA Technology Inc",
    13,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "IMR SOFT LLC",
    13,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Total System Services LLC",
    13,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Caresoft Technologies Inc",
    13,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Cigniti Technologies, Inc",
    13,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Dexian, LLC",
    13,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Gainwell Technologies LLC",
    13,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "DONATO TECHNOLOGIES INC",
    13,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "FUSION LIFE SCIENCES TECHNOLOGIES LLC",
    13,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Computer Sciences Corporation",
    13,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "TECHNOSOFT CORPORATION",
    13,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Tata Technologies, Inc",
    13,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Bioinfo Systems, LLC",
    12,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Technumen, Inc",
    12,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Zeus Solutions Inc",
    12,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Bitwise Inc",
    12,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Hitachi Digital Services LLC",
    12,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Quest IT Solutions Inc",
    12,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "L&T Technology Services LLC",
    12,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "ACEINTEGRATOR INC",
    12,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Strategic Systems, Inc",
    12,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Willsfly Technologies Inc",
    12,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Metrix IT Solutions INC",
    12,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "iTech US, Inc",
    12,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Lead IT Corporation",
    12,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "iPivot LLC",
    12,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "TT TECHNOLOGIES INC",
    12,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "MYTHRI CONSULTING LLC",
    12,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "AMZUR TECHNOLOGIES, INC",
    12,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Nisum Technologies Inc",
    12,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "Optimal Technologies, Inc",
    12,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "ADVITHRI TECHNOLOGIES LLC",
    12,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ],
  [
    "HITECK SOLUTIONS INC",
    12,
    "vendor",
    "curated",
    "Staffing Vendors",
    "",
    "staffing, tech",
    "",
    ""
  ]
];

const COMPANIES = buildCompanies();

const RESOURCE_LINKS = [
  ["USCIS OPT", "OPT basics", "https://www.uscis.gov/working-in-the-united-states/students-and-exchange-visitors/optional-practical-training-opt-for-f-1-students", "Official OPT reference for F-1 students."],
  ["Study in the States", "OPT/STEM OPT", "https://studyinthestates.dhs.gov/stem-opt-hub", "DHS student guidance for STEM OPT requirements."],
  ["E-Verify", "Employer research", "https://www.e-verify.gov/about-e-verify/e-verify-data/how-to-find-participating-employers", "Find employers participating in E-Verify."],
  ["DOL OFLC Data", "H-1B/PERM", "https://www.dol.gov/agencies/eta/foreign-labor/performance", "Official disclosure files for foreign labor programs."],
  ["USCIS H-1B Hub", "H-1B employers", "https://www.uscis.gov/tools/reports-and-studies/h-1b-employer-data-hub", "Official H-1B employer data hub."],
  ["MyVisaJobs", "Sponsor patterns", "https://www.myvisajobs.com/reports/", "Third-party sponsor history and reports."],
  ["H1BData", "Salary/sponsor", "https://h1bdata.info/", "Third-party H-1B salary and employer lookup."],
  ["BLS OOH", "Career research", "https://www.bls.gov/ooh/", "Occupation outlook, pay, and growth data."],
  ["O*NET", "Title research", "https://www.onetonline.org/", "Skill and occupation title research."],
  ["CareerOneStop", "US career tools", "https://www.careeronestop.org/", "US Department of Labor career resources."],
  ["FTC Job Scams", "Scam checks", "https://consumer.ftc.gov/articles/job-scams", "Spot fake job postings and recruiter scams."]
].map(([name, category, url, note]) => ({ name, category, url, note }));

function buildCompanies() {
  const byId = new Map();
  COMPANY_ROWS.forEach(([name, category, careersUrl, tags, caution], index) => {
    const company = {
      id: slugify(name),
      name,
      category,
      careersUrl,
      rank: index + 1,
      baseRank: index + 1,
      tags: splitTags(tags),
      caution: caution || "",
      h1bFilings: 0,
      sponsorTier: "curated",
      companyKind: "direct",
      aliases: [],
      h1bSource: ""
    };
    byId.set(company.id, company);
  });

  SPONSOR_COMPANY_ROWS.forEach(([name, filings, kind, tier, category, careersUrl, tags, aliases, caution]) => {
    const aliasList = splitAliases(aliases);
    let sponsorId = findExistingCompanyId(byId, name, aliasList) || slugify(name);
    if (kind === "vendor" && byId.has(sponsorId) && byId.get(sponsorId).companyKind === "vendor") {
      sponsorId = makeUniqueCompanyId(byId, sponsorId);
    }
    const existing = byId.get(sponsorId);
    if (existing) {
      existing.h1bFilings = Math.max(existing.h1bFilings || 0, filings);
      existing.sponsorTier = tier;
      existing.companyKind = kind;
      existing.aliases = mergeUnique(existing.aliases, aliasList);
      existing.tags = mergeUnique(existing.tags, splitTags(tags));
      existing.h1bSource = "H1B workbook";
      existing.caution = existing.caution || caution || "";
      if (!existing.careersUrl && careersUrl) {
        existing.careersUrl = careersUrl;
      }
    } else {
      byId.set(sponsorId, {
        id: sponsorId,
        name,
        category,
        careersUrl,
        rank: 0,
        baseRank: COMPANY_ROWS.length + byId.size + 1,
        tags: splitTags(tags),
        caution: caution || "",
        h1bFilings: filings,
        sponsorTier: tier,
        companyKind: kind,
        aliases: aliasList,
        h1bSource: "H1B workbook"
      });
    }
  });

  return Array.from(byId.values())
    .sort((a, b) => getCompanyDefaultScore(b) - getCompanyDefaultScore(a) || a.name.localeCompare(b.name))
    .map((company, index) => ({ ...company, rank: index + 1 }));
}

function splitTags(value) {
  return value.split(",").map(tag => tag.trim()).filter(Boolean);
}

function splitAliases(value) {
  return String(value || "").split("|").map(alias => alias.trim()).filter(Boolean);
}

function mergeUnique(left, right) {
  return Array.from(new Set([...(left || []), ...(right || [])].filter(Boolean)));
}

function findExistingCompanyId(byId, name, aliases) {
  const candidates = [name, ...aliases].map(slugify);
  return candidates.find(candidate => byId.has(candidate)) || "";
}

function makeUniqueCompanyId(byId, baseId) {
  let suffix = 2;
  let nextId = `${baseId}-${suffix}`;
  while (byId.has(nextId)) {
    suffix += 1;
    nextId = `${baseId}-${suffix}`;
  }
  return nextId;
}

function getCompanyDefaultScore(company) {
  const sponsorBoost = company.h1bFilings ? 100000 + company.h1bFilings : 0;
  const curatedBoost = company.category === "Cloud and Big Tech" || company.category === "AI and Data" ? 250 : 0;
  return sponsorBoost + curatedBoost - company.baseRank;
}

const state = {
  results: [],
  checked: new Set(),
  favoriteCompanies: new Set(),
  pinnedPortals: new Set(),
  customPortalLinks: {},
  customCompanyCareers: {},
  dailyChecklist: {},
  visibleCompanies: COMPANIES,
  visibleVendors: [],
  companyListLimit: COMPANY_LIST_BATCH_SIZE
};

const els = {};

document.addEventListener("DOMContentLoaded", () => {
  cacheElements();
  populateRolePacks();
  populateProfiles();
  populateSearchPresets();
  populateCategories();
  populateLocations();
  populateCompanyControls();
  populateVendorControls();
  rebuildTimeOptions("google", "all");
  populateResources();
  renderCompanyOptions("");
  renderSponsorGrid();
  renderVendorOutreach();
  renderFavoriteCompanies();
  loadTheme();
  bindEvents();
  setupWorkspaceHeightSync();

  loadPreferences();
  hydrateFromUrl();
  if (!els.companyRole.value && els.jobTitle.value) {
    els.companyRole.value = els.jobTitle.value;
  }
  if (!els.vendorRole.value && els.companyRole.value) {
    els.vendorRole.value = els.companyRole.value;
  }

  renderCompanyOptions(els.companyFilter.value);
  renderFavoriteCompanies();
  renderDailyChecklist();
  renderVendorOutreach();
  syncProfileDescription();
  syncCompanyCard();
  renderPinnedOperators();
  renderDailyChecklist();
  savePreferences();
  if (hasJobTitle()) {
    generateResults(false);
  } else {
    updateCounts();
    updatePreviewForEmptyState();
  }
});

function cacheElements() {
  Object.assign(els, {
    form: document.getElementById("searchForm"),
    jobTitle: document.getElementById("jobTitle"),
    rolePackSelect: document.getElementById("rolePackSelect"),
    profileSelect: document.getElementById("profileSelect"),
    searchPresetSelect: document.getElementById("searchPresetSelect"),
    applyPresetButton: document.getElementById("applyPresetButton"),
    queryStyleSelect: document.getElementById("queryStyleSelect"),
    customQuery: document.getElementById("customQuery"),
    customSourceName: document.getElementById("customSourceName"),
    customSourceUrl: document.getElementById("customSourceUrl"),
    copyCustomSyncButton: document.getElementById("copyCustomSyncButton"),
    timeFilter: document.getElementById("timeFilter"),
    locationSelect: document.getElementById("locationSelect"),
    sortSelect: document.getElementById("sortSelect"),
    engineSelect: document.getElementById("engineSelect"),
    remoteMode: document.getElementById("remoteMode"),
    matchMode: document.getElementById("matchMode"),
    experienceSelect: document.getElementById("experienceSelect"),
    employmentSelect: document.getElementById("employmentSelect"),
    authorizationSelect: document.getElementById("authorizationSelect"),
    includeTerms: document.getElementById("includeTerms"),
    excludeTerms: document.getElementById("excludeTerms"),
    cautionExcludes: document.getElementById("cautionExcludes"),
    strictTitle: document.getElementById("strictTitle"),
    categoryFilters: document.getElementById("categoryFilters"),
    sidePanel: document.querySelector(".side-panel"),
    resultsPanel: document.querySelector(".results-panel"),
    companyRole: document.getElementById("companyRole"),
    companyRolePack: document.getElementById("companyRolePack"),
    companyFilter: document.getElementById("companyFilter"),
    companySelect: document.getElementById("companySelect"),
    companyTimeFilter: document.getElementById("companyTimeFilter"),
    companyExperienceSelect: document.getElementById("companyExperienceSelect"),
    companyLocationSelect: document.getElementById("companyLocationSelect"),
    companyRemoteMode: document.getElementById("companyRemoteMode"),
    companyEmploymentSelect: document.getElementById("companyEmploymentSelect"),
    companyAuthorizationSelect: document.getElementById("companyAuthorizationSelect"),
    companyIncludeTerms: document.getElementById("companyIncludeTerms"),
    companyExcludeTerms: document.getElementById("companyExcludeTerms"),
    companyCustomLinkName: document.getElementById("companyCustomLinkName"),
    companyCustomLinkUrl: document.getElementById("companyCustomLinkUrl"),
    companySortSelect: document.getElementById("companySortSelect"),
    companyCategorySelect: document.getElementById("companyCategorySelect"),
    companySponsorTier: document.getElementById("companySponsorTier"),
    companyKind: document.getElementById("companyKind"),
    companyCount: document.getElementById("companyCount"),
    companyCard: document.getElementById("companyCard"),
    companyVaultStatus: document.getElementById("companyVaultStatus"),
    copyCompanyVaultButton: document.getElementById("copyCompanyVaultButton"),
    restoreCompanyVaultButton: document.getElementById("restoreCompanyVaultButton"),
    copyCompanyVaultSyncButton: document.getElementById("copyCompanyVaultSyncButton"),
    favoriteCompaniesPanel: document.getElementById("favoriteCompaniesPanel"),
    favoriteCompanyCount: document.getElementById("favoriteCompanyCount"),
    favoriteCompaniesGrid: document.getElementById("favoriteCompaniesGrid"),
    sponsorGrid: document.getElementById("sponsorGrid"),
    vendorRole: document.getElementById("vendorRole"),
    vendorLocation: document.getElementById("vendorLocation"),
    vendorFilter: document.getElementById("vendorFilter"),
    vendorSponsorTier: document.getElementById("vendorSponsorTier"),
    vendorCategory: document.getElementById("vendorCategory"),
    vendorKind: document.getElementById("vendorKind"),
    vendorHasUrl: document.getElementById("vendorHasUrl"),
    vendorCount: document.getElementById("vendorCount"),
    vendorGrid: document.getElementById("vendorGrid"),
    copyTopVendorPacketButton: document.getElementById("copyTopVendorPacketButton"),
    openTopVendorSearchesButton: document.getElementById("openTopVendorSearchesButton"),
    dailyChecklist: document.getElementById("dailyChecklist"),
    dailyChecklistStatus: document.getElementById("dailyChecklistStatus"),
    pinnedBlock: document.getElementById("pinnedBlock"),
    pinnedOperators: document.getElementById("pinnedOperators"),
    copyPinSyncButton: document.getElementById("copyPinSyncButton"),
    resourceGrid: document.getElementById("resourceGrid"),
    portalCount: document.getElementById("portalCount"),
    checkedCount: document.getElementById("checkedCount"),
    openBatchSize: document.getElementById("openBatchSize"),
    openBatchButton: document.getElementById("openBatchButton"),
    openAllButton: document.getElementById("openAllButton"),
    openHighValueBatchButton: document.getElementById("openHighValueBatchButton"),
    exportSettingsButton: document.getElementById("exportSettingsButton"),
    importSettingsButton: document.getElementById("importSettingsButton"),
    copyApplicationPacketButton: document.getElementById("copyApplicationPacketButton"),
    copyAllButton: document.getElementById("copyAllButton"),
    copyCheckedButton: document.getElementById("copyCheckedButton"),
    shareButton: document.getElementById("shareButton"),
    resetButton: document.getElementById("resetButton"),
    minuteRadarButton: document.getElementById("minuteRadarButton"),
    latestOneHourButton: document.getElementById("latestOneHourButton"),
    fastApplyButton: document.getElementById("fastApplyButton"),
    quickApplyButton: document.getElementById("quickApplyButton"),
    freshDirectButton: document.getElementById("freshDirectButton"),
    themeToggle: document.getElementById("themeToggle"),
    results: document.getElementById("results"),
    emptyState: document.getElementById("emptyState"),
    resultMeta: document.getElementById("resultMeta"),
    queryPreview: document.getElementById("queryPreview"),
    profileDescription: document.getElementById("profileDescription"),
    relatedBlock: document.getElementById("relatedBlock"),
    relatedTitles: document.getElementById("relatedTitles"),
    detailDialog: document.getElementById("detailDialog"),
    detailSheet: document.getElementById("detailSheet"),
    detailTitle: document.getElementById("detailTitle"),
    detailBody: document.getElementById("detailBody"),
    closeDetailButton: document.getElementById("closeDetailButton"),
    toast: document.getElementById("toast")
  });
}

function escapeHtml(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function setupSearchDropbox({
  input,
  placeholderPrefix = "Search for",
  ariaLabel = "Search suggestions",
  getSuggestions = null,
  onSearch
}) {
  if (!input) return;

  let wrapper = input.parentElement;
  if (!wrapper || !wrapper.classList.contains("search-input-wrapper")) {
    wrapper = document.createElement("div");
    wrapper.className = "search-input-wrapper";
    input.parentNode.insertBefore(wrapper, input);
    wrapper.appendChild(input);
  }

  const dropbox = document.createElement("div");
  dropbox.className = "search-dropbox";
  dropbox.hidden = true;
  dropbox.setAttribute("role", "listbox");
  dropbox.setAttribute("aria-label", ariaLabel);
  wrapper.appendChild(dropbox);

  let activeIndex = 0;
  let currentItems = [];

  function closeDropbox() {
    dropbox.hidden = true;
    dropbox.innerHTML = "";
    currentItems = [];
    activeIndex = 0;
  }

  function renderDropbox(query) {
    const trimmed = query.trim();
    if (!trimmed) {
      closeDropbox();
      return;
    }

    dropbox.innerHTML = "";
    currentItems = [];

    // 1. The exact search query typed (Primary Action)
    currentItems.push({
      type: "exact",
      value: trimmed,
      title: trimmed,
      badge: "Search",
      isPrimary: true
    });

    // 2. Extra suggestions if available
    if (typeof getSuggestions === "function") {
      try {
        const extra = getSuggestions(trimmed) || [];
        extra.forEach(item => {
          if (typeof item === "string") {
            if (item.toLowerCase() !== trimmed.toLowerCase()) {
              currentItems.push({
                type: "suggestion",
                value: item,
                title: item,
                badge: "Suggestion"
              });
            }
          } else if (item && item.title) {
            currentItems.push(item);
          }
        });
      } catch (err) {
        console.error("Error fetching suggestions:", err);
      }
    }

    currentItems.forEach((item, idx) => {
      const row = document.createElement("div");
      row.className = `search-dropbox-item ${item.isPrimary ? "is-primary" : ""} ${idx === activeIndex ? "is-selected" : ""}`;
      row.setAttribute("role", "option");
      row.setAttribute("data-index", String(idx));

      const main = document.createElement("div");
      main.className = "dropbox-main";

      const icon = document.createElement("span");
      icon.className = "dropbox-icon";
      icon.textContent = item.icon || "🔍";

      const text = document.createElement("div");
      text.className = "dropbox-query-text";
      if (item.isPrimary) {
        text.innerHTML = `${escapeHtml(placeholderPrefix)} "<strong>${escapeHtml(trimmed)}</strong>"`;
      } else {
        text.textContent = item.title;
      }
      if (item.subtext) {
        const sub = document.createElement("span");
        sub.className = "dropbox-subtext";
        sub.textContent = `— ${item.subtext}`;
        text.appendChild(sub);
      }

      main.append(icon, text);

      const meta = document.createElement("div");
      meta.className = "dropbox-meta";
      if (item.badge) {
        const badge = document.createElement("span");
        badge.className = `dropbox-badge ${item.badgeClass || ""}`;
        badge.textContent = item.badge;
        meta.appendChild(badge);
      }

      const hint = document.createElement("span");
      hint.className = "dropbox-hint";
      hint.textContent = item.isPrimary ? "Click to search ↵" : "Select ↵";
      meta.appendChild(hint);

      row.append(main, meta);

      row.addEventListener("mousedown", (e) => {
        e.preventDefault();
        executeSelection(item);
      });

      dropbox.appendChild(row);
    });

    dropbox.hidden = false;
  }

  function executeSelection(item) {
    input.value = item.value;
    closeDropbox();
    if (typeof onSearch === "function") {
      onSearch(item.value, item);
    }
  }

  function updateActive() {
    const rows = dropbox.querySelectorAll(".search-dropbox-item");
    rows.forEach((row, idx) => {
      row.classList.toggle("is-selected", idx === activeIndex);
      if (idx === activeIndex) {
        row.scrollIntoView({ block: "nearest" });
      }
    });
  }

  input.addEventListener("input", () => {
    activeIndex = 0;
    renderDropbox(input.value);
  });

  input.addEventListener("focus", () => {
    if (input.value.trim()) {
      activeIndex = 0;
      renderDropbox(input.value);
    }
  });

  input.addEventListener("keydown", (e) => {
    if (dropbox.hidden || !currentItems.length) {
      if (e.key === "Enter") {
        closeDropbox();
        if (typeof onSearch === "function") {
          onSearch(input.value);
        }
      }
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      activeIndex = (activeIndex + 1) % currentItems.length;
      updateActive();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      activeIndex = (activeIndex - 1 + currentItems.length) % currentItems.length;
      updateActive();
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (currentItems[activeIndex]) {
        executeSelection(currentItems[activeIndex]);
      }
    } else if (e.key === "Escape") {
      e.preventDefault();
      closeDropbox();
    }
  });

  document.addEventListener("click", (e) => {
    if (!wrapper.contains(e.target)) {
      closeDropbox();
    }
  });
}

function bindEvents() {
  els.form.addEventListener("submit", event => {
    event.preventDefault();
    generateResults();
  });

  els.profileSelect.addEventListener("change", () => {
    applyProfile(els.profileSelect.value);
    syncProfileDescription();
    persistAndMaybeGenerate();
  });

  [els.rolePackSelect, els.queryStyleSelect].forEach(control => {
    control.addEventListener("change", persistAndMaybeGenerate);
  });
  els.searchPresetSelect.addEventListener("change", () => {
    persistPortableState();
  });
  els.applyPresetButton.addEventListener("click", applySelectedSearchPreset);

  els.engineSelect.addEventListener("change", () => {
    rebuildTimeOptions(els.engineSelect.value);
    persistAndMaybeGenerate();
  });

  [
    els.timeFilter,
    els.locationSelect,
    els.sortSelect,
    els.remoteMode,
    els.matchMode,
    els.experienceSelect,
    els.employmentSelect,
    els.authorizationSelect,
    els.cautionExcludes,
    els.strictTitle
  ].forEach(control => control.addEventListener("change", persistAndMaybeGenerate));

  // Custom queries, terms, and custom links update on change
  [els.customQuery, els.customSourceName, els.customSourceUrl, els.includeTerms, els.excludeTerms].forEach(input => {
    input.addEventListener("change", persistAndMaybeGenerate);
  });
  els.copyCustomSyncButton.addEventListener("click", copyPortableSyncLink);

  els.categoryFilters.addEventListener("change", () => {
    persistAndMaybeGenerate();
    updateCounts();
  });

  // 1. Job Title Search Drop Box (starts search only when clicked or Enter)
  setupSearchDropbox({
    input: els.jobTitle,
    placeholderPrefix: "Search for",
    ariaLabel: "Job title search suggestions",
    getSuggestions: (query) => {
      const q = query.toLowerCase();
      const suggestions = [];
      const seen = new Set([q]);
      if (typeof RELATED_TITLE_GROUPS !== "undefined") {
        for (const group of RELATED_TITLE_GROUPS) {
          for (const title of group) {
            if (title.toLowerCase().includes(q) && !seen.has(title.toLowerCase())) {
              seen.add(title.toLowerCase());
              suggestions.push({
                type: "role",
                value: title,
                title: title,
                subtext: "Related role",
                badge: "Title"
              });
              if (suggestions.length >= 6) break;
            }
          }
          if (suggestions.length >= 6) break;
        }
      }
      return suggestions;
    },
    onSearch: (val) => {
      els.jobTitle.value = val;
      generateResults();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });

  // 2. Company Filter Search Drop Box (starts search only when clicked or Enter)
  setupSearchDropbox({
    input: els.companyFilter,
    placeholderPrefix: "Filter companies for",
    ariaLabel: "Company filter suggestions",
    getSuggestions: (query) => {
      const q = query.toLowerCase();
      const suggestions = [];
      const pool = COMPANIES || [];
      for (const comp of pool) {
        if (comp.name.toLowerCase().includes(q) || (comp.category && comp.category.toLowerCase().includes(q))) {
          suggestions.push({
            type: "company",
            value: comp.name,
            title: comp.name,
            subtext: comp.category || "",
            badge: comp.sponsorTier ? comp.sponsorTier.toUpperCase() : "COMPANY",
            badgeClass: comp.sponsorTier === "tier1" ? "tier1" : "",
            companyId: comp.id
          });
          if (suggestions.length >= 6) break;
        }
      }
      return suggestions;
    },
    onSearch: (val, item) => {
      els.companyFilter.value = val;
      resetCompanyListLimit();
      renderCompanyOptions(val);
      if (item && item.companyId) {
        els.companySelect.value = item.companyId;
      } else if (state.visibleCompanies && state.visibleCompanies.length) {
        els.companySelect.value = state.visibleCompanies[0].id;
      }
      syncCompanyCard();
      renderSponsorGrid();
      persistPortableState();
    }
  });

  // 3. Company Role Search Drop Box (starts search only when clicked or Enter)
  setupSearchDropbox({
    input: els.companyRole,
    placeholderPrefix: "Search company role",
    ariaLabel: "Company role suggestions",
    getSuggestions: (query) => {
      const q = query.toLowerCase();
      const suggestions = [];
      const seen = new Set([q]);
      if (typeof RELATED_TITLE_GROUPS !== "undefined") {
        for (const group of RELATED_TITLE_GROUPS) {
          for (const title of group) {
            if (title.toLowerCase().includes(q) && !seen.has(title.toLowerCase())) {
              seen.add(title.toLowerCase());
              suggestions.push({
                type: "role",
                value: title,
                title: title,
                subtext: "Role family",
                badge: "Role"
              });
              if (suggestions.length >= 5) break;
            }
          }
          if (suggestions.length >= 5) break;
        }
      }
      return suggestions;
    },
    onSearch: (val) => {
      els.companyRole.value = val;
      resetCompanyListLimit();
      syncCompanyCard();
      renderFavoriteCompanies();
      persistPortableState();
    }
  });

  [els.companyIncludeTerms, els.companyExcludeTerms, els.companyCustomLinkName, els.companyCustomLinkUrl].forEach(input => {
    input.addEventListener("change", () => {
      resetCompanyListLimit();
      syncCompanyCard();
      renderFavoriteCompanies();
      persistPortableState();
    });
  });
  [
    els.companyRolePack,
    els.companyTimeFilter,
    els.companyExperienceSelect,
    els.companyLocationSelect,
    els.companyRemoteMode,
    els.companyEmploymentSelect,
    els.companyAuthorizationSelect,
    els.companySortSelect,
    els.companyCategorySelect,
    els.companySponsorTier,
    els.companyKind
  ].forEach(control => {
    control.addEventListener("change", () => {
      resetCompanyListLimit();
      renderCompanyOptions(els.companyFilter.value);
      syncCompanyCard();
      renderSponsorGrid();
      renderFavoriteCompanies();
      persistPortableState();
    });
  });
  els.companySelect.addEventListener("change", () => {
    resetCompanyListLimit();
    syncCompanyCard();
    renderSponsorGrid();
    persistPortableState();
  });

  // 4. Vendor Filter Search Drop Box (starts search only when clicked or Enter)
  setupSearchDropbox({
    input: els.vendorFilter,
    placeholderPrefix: "Filter vendors for",
    ariaLabel: "Vendor filter suggestions",
    getSuggestions: (query) => {
      const q = query.toLowerCase();
      const suggestions = [];
      const vendors = (COMPANIES || []).filter(c => c.companyKind === "vendor");
      for (const v of vendors) {
        if (v.name.toLowerCase().includes(q)) {
          suggestions.push({
            type: "vendor",
            value: v.name,
            title: v.name,
            subtext: v.category || "Vendor",
            badge: "Vendor"
          });
          if (suggestions.length >= 5) break;
        }
      }
      return suggestions;
    },
    onSearch: (val) => {
      els.vendorFilter.value = val;
      renderVendorOutreach();
      persistPortableState();
    }
  });

  els.vendorRole.addEventListener("change", () => {
    renderVendorOutreach();
    persistPortableState();
  });
  [els.vendorLocation, els.vendorSponsorTier, els.vendorCategory, els.vendorKind, els.vendorHasUrl].forEach(control => {
    control.addEventListener("change", () => {
      renderVendorOutreach();
      persistPortableState();
    });
  });
  els.copyTopVendorPacketButton.addEventListener("click", copyTopVendorPacket);
  els.openTopVendorSearchesButton.addEventListener("click", openTopVendorSearches);
  els.copyCompanyVaultButton.addEventListener("click", copyCompanyVaultBackup);
  els.restoreCompanyVaultButton.addEventListener("click", restoreCompanyVaultBackup);
  els.copyCompanyVaultSyncButton.addEventListener("click", copyPortableSyncLink);

  els.openBatchButton.addEventListener("click", openNextBatch);
  els.openHighValueBatchButton.addEventListener("click", openHighValueBatch);
  els.openAllButton.addEventListener("click", openAllLinks);
  els.openBatchSize.addEventListener("change", () => {
    persistPortableState();
    syncBatchControls();
  });
  els.exportSettingsButton.addEventListener("click", exportSettings);
  els.importSettingsButton.addEventListener("click", importSettings);
  els.copyAllButton.addEventListener("click", () => copyLinks(state.results.map(item => item.url), "Copied all links"));
  els.copyApplicationPacketButton.addEventListener("click", copyApplicationPacket);
  els.copyCheckedButton.addEventListener("click", () => {
    const checkedLinks = state.results.filter(item => state.checked.has(item.key)).map(item => item.url);
    copyLinks(checkedLinks, "Copied checked links");
  });
  els.shareButton.addEventListener("click", () => copyLinks([window.location.href], "Copied share link"));
  els.resetButton.addEventListener("click", resetSearch);
  els.copyPinSyncButton.addEventListener("click", copyPinSyncLink);
  els.minuteRadarButton.addEventListener("click", applyMinuteRadarFlow);
  els.latestOneHourButton.addEventListener("click", applyLatestOneHourFlow);
  els.fastApplyButton.addEventListener("click", applyFastApplyRoutine);
  els.quickApplyButton.addEventListener("click", applyQuickApplyFlow);
  els.freshDirectButton.addEventListener("click", applyFreshDirectFlow);
  els.themeToggle.addEventListener("click", toggleTheme);
  els.closeDetailButton.addEventListener("click", () => els.detailDialog.close());

  els.pinnedOperators.addEventListener("click", event => {
    const button = event.target.closest("button[data-pin-remove]");
    if (!button) {
      return;
    }
    togglePinnedPortal(button.dataset.pinRemove);
  });

  window.addEventListener("beforeunload", () => {
    savePreferences();
  });
}

function setupWorkspaceHeightSync() {
  syncWorkspacePanelHeight();
  window.addEventListener("resize", syncWorkspacePanelHeight);
  if ("ResizeObserver" in window && els.sidePanel) {
    const observer = new ResizeObserver(syncWorkspacePanelHeight);
    observer.observe(els.sidePanel);
  }
}

function syncWorkspacePanelHeight() {
  if (!els.sidePanel || !els.resultsPanel) {
    return;
  }
  if (window.matchMedia("(max-width: 900px)").matches) {
    els.resultsPanel.style.removeProperty("--workspace-panel-height");
    return;
  }
  const height = Math.ceil(els.sidePanel.getBoundingClientRect().height);
  if (height > 0) {
    els.resultsPanel.style.setProperty("--workspace-panel-height", `${height}px`);
  }
}

function populateRolePacks() {
  [els.rolePackSelect, els.companyRolePack].forEach(select => {
    select.innerHTML = "";
    ROLE_PACKS.forEach(pack => {
      const option = document.createElement("option");
      option.value = pack.id;
      option.textContent = pack.label;
      select.appendChild(option);
    });
    select.value = DEFAULT_ROLE_PACK_ID;
  });
}

function populateProfiles() {
  els.profileSelect.innerHTML = "";
  SEARCH_PROFILES.forEach(profile => {
    const option = document.createElement("option");
    option.value = profile.id;
    option.textContent = profile.label;
    els.profileSelect.appendChild(option);
  });
  els.profileSelect.value = DEFAULT_PROFILE_ID;
}

function populateSearchPresets() {
  els.searchPresetSelect.innerHTML = "";
  const none = document.createElement("option");
  none.value = "";
  none.textContent = "Choose preset";
  els.searchPresetSelect.appendChild(none);
  SEARCH_PRESETS.forEach(preset => {
    const option = document.createElement("option");
    option.value = preset.id;
    option.textContent = preset.label;
    els.searchPresetSelect.appendChild(option);
  });
}

function populateCategories() {
  els.categoryFilters.innerHTML = "";
  CATEGORIES.forEach(category => {
    const label = document.createElement("label");
    label.className = "filter-chip";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.value = category.id;
    input.checked = category.checked;

    label.append(input, document.createTextNode(category.label));
    els.categoryFilters.appendChild(label);
  });
}

function populateLocations() {
  els.locationSelect.innerHTML = "";
  LOCATIONS.forEach(([value, label]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    els.locationSelect.appendChild(option);
  });
  els.locationSelect.value = "usa";
}

function renderDailyChecklist() {
  const checklist = getDailyChecklist();
  const doneCount = DAILY_CHECKLIST_ITEMS.filter(item => checklist.items[item.id]).length;
  els.dailyChecklistStatus.textContent = `${doneCount} of ${DAILY_CHECKLIST_ITEMS.length} done`;
  els.dailyChecklist.innerHTML = "";

  DAILY_CHECKLIST_ITEMS.forEach(item => {
    const row = document.createElement("label");
    row.className = "daily-check-item";
    if (checklist.items[item.id]) {
      row.classList.add("is-done");
    }
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = Boolean(checklist.items[item.id]);
    checkbox.addEventListener("change", () => {
      setDailyChecklistItem(item.id, checkbox.checked);
    });
    const text = document.createElement("span");
    text.className = "daily-check-copy";
    const title = document.createElement("strong");
    title.textContent = item.label;
    const note = document.createElement("small");
    note.textContent = item.note || "";
    text.append(title, note);
    const action = document.createElement("button");
    action.type = "button";
    action.textContent = item.cta || "Go";
    action.addEventListener("click", event => {
      event.preventDefault();
      runDailyChecklistAction(item);
    });
    row.append(checkbox, text, action);
    els.dailyChecklist.appendChild(row);
  });
}

function getDailyChecklist() {
  const today = getTodayStamp();
  if (!state.dailyChecklist || state.dailyChecklist.date !== today) {
    state.dailyChecklist = { date: today, items: {} };
  }
  return state.dailyChecklist;
}

function setDailyChecklistItem(id, checked) {
  const checklist = getDailyChecklist();
  checklist.items[id] = checked;
  persistPortableState();
  renderDailyChecklist();
}

function runDailyChecklistAction(item) {
  if (item.action === "latest1") {
    applyLatestOneHourFlow();
  } else if (item.action === "fastApplyRoutine") {
    applyFastApplyRoutine();
  } else if (item.href) {
    window.open(item.href, "_blank", "noopener");
  } else if (item.target) {
    const target = document.getElementById(item.target);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }
  setDailyChecklistItem(item.id, true);
}

function populateCompanyControls() {
  els.companyLocationSelect.innerHTML = "";
  LOCATIONS.forEach(([value, label]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    els.companyLocationSelect.appendChild(option);
  });
  els.companyLocationSelect.value = "usa";

  const categories = Array.from(new Set(COMPANIES.map(company => company.category))).sort();
  categories.forEach(category => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    els.companyCategorySelect.appendChild(option);
  });
}

function populateVendorControls() {
  els.vendorLocation.innerHTML = "";
  LOCATIONS.forEach(([value, label]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    els.vendorLocation.appendChild(option);
  });
  els.vendorLocation.value = "usa";

  const vendorCategories = Array.from(new Set(COMPANIES.map(company => company.category))).sort();
  vendorCategories.forEach(category => {
    const option = document.createElement("option");
    option.value = category;
    option.textContent = category;
    els.vendorCategory.appendChild(option);
  });
}

function populateResources() {
  els.resourceGrid.innerHTML = "";
  RESOURCE_LINKS.forEach(resource => {
    const card = document.createElement("article");
    card.className = "resource-card";
    const title = document.createElement("a");
    title.href = resource.url;
    title.target = "_blank";
    title.rel = "noopener";
    title.textContent = resource.name;
    const category = document.createElement("span");
    category.className = "pill";
    category.textContent = resource.category;
    const note = document.createElement("p");
    note.textContent = resource.note;
    card.append(title, category, note);
    els.resourceGrid.appendChild(card);
  });
}

let _workbookIndex = null;
function getWorkbookIndex() {
  if (_workbookIndex) return _workbookIndex;
  _workbookIndex = new Map();
  if (!window.H1B_INTELLIGENCE_DATA || !window.H1B_INTELLIGENCE_DATA.sheets) return _workbookIndex;
  const sheets = window.H1B_INTELLIGENCE_DATA.sheets;
  const searchSheets = ["Personalized Shortlist", "Apply First", "Strong Targets", "Hidden Gems", "Sponsorship Review", "Entry Level Evidence"];
  for (const sheetName of searchSheets) {
    const sheet = sheets[sheetName];
    if (sheet && sheet.rows) {
      for (const row of sheet.rows) {
        if (row.employerName) {
          const norm = row.employerName.toLowerCase().replace(/[^a-z0-9]+/g, "");
          if (norm && !_workbookIndex.has(norm)) {
            _workbookIndex.set(norm, [row, sheetName]);
          }
        }
      }
    }
  }
  return _workbookIndex;
}

function findWorkbookRow(companyName) {
  const index = getWorkbookIndex();
  const normalizedSearchName = companyName.toLowerCase().replace(/[^a-z0-9]+/g, "");
  return index.get(normalizedSearchName) || null;
}

function showDetails(row, sheetName) {
  if (!els.detailDialog) return;
  els.detailSheet.textContent = sheetName;
  els.detailTitle.textContent = row.employerName || "Workbook row";
  const table = document.createElement("table");
  table.className = "detail-table";
  const tbody = document.createElement("tbody");
  Object.entries(row).forEach(([key, val]) => {
    if (key.startsWith("_") || typeof val === "object") return;
    const tr = document.createElement("tr");
    const th = document.createElement("th");
    th.textContent = key.replace(/([A-Z])/g, " $1").replace(/^./, str => str.toUpperCase());
    const td = document.createElement("td");
    td.textContent = val == null || val === "" ? "n/a" : String(val);
    tr.append(th, td);
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  els.detailBody.replaceChildren(table);
  els.detailDialog.showModal();
}

function localCreateElement(tag, text, className = "") {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = text == null || text === "" ? "n/a" : String(text);
  return element;
}

function localFormatScore(value) {
  return Number.isFinite(Number(value)) ? Number(value).toFixed(1) : "n/a";
}

function localFormatNumber(value) {
  if (value == null || value === "") return "0";
  const number = Number(value);
  return Number.isFinite(number) ? number.toLocaleString() : String(value);
}

function localFormatCurrency(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0
    ? number.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 })
    : "n/a";
}

function localSplitList(value) {
  return String(value || "").split(",").map(item => item.trim()).filter(Boolean);
}

function localBuildGoogleCompanyUrl(row) {
  const query = `"${row.employerName || ""}" careers jobs sponsorship software data`;
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

function localBuildLinkedInJobsUrl(row) {
  const params = new URLSearchParams();
  params.set("keywords", `${row.employerName || ""} software data`);
  params.set("location", "United States");
  params.set("sortBy", "DD");
  return `https://www.linkedin.com/jobs/search/?${params.toString()}`;
}

function localBuildLinkedInRecruiterUrl(row) {
  const params = new URLSearchParams();
  params.set("keywords", `"${row.employerName || ""}" recruiter "talent acquisition"`);
  params.set("origin", "GLOBAL_SEARCH_HEADER");
  return `https://www.linkedin.com/search/results/people/?${params.toString()}`;
}

function localCopyRowsAsPackets(rows) {
  const packets = rows.map(row => [
    `Employer: ${row.employerName || "Unknown"}`,
    `Fit score: ${localFormatScore(row.candidateFitScore)}`,
    `Priority: ${row.applicationPriority || "n/a"}`,
    `Student friendliness: ${row.studentFriendliness || "n/a"}`,
    `Sponsorship evidence: ${row.sponsorshipEvidence || "n/a"}`,
    `Data confidence: ${row.dataConfidence || "n/a"}`,
    `Why apply: ${row.whyApply || row.recommendedAction || "n/a"}`,
    `New employment positions: ${localFormatNumber(row.newEmploymentPositions)}`,
    `Certified tech LCAs: ${localFormatNumber(row.certifiedTechLcas)}`,
    `Entry cases: ${localFormatNumber(row.explicitEntryCases)}`,
    `Top role families: ${row.topRoleFamilies || "n/a"}`,
    `Top states: ${row.topWorksiteStates || "n/a"}`,
    `Top cities: ${row.topCities || "n/a"}`,
    `Median wage: ${localFormatCurrency(row.medianAnnualWage)}`,
    `Review flag: ${row.employerReviewFlag || "n/a"}`,
    `Career search: ${row.careerSearchUrl || localBuildGoogleCompanyUrl(row)}`
  ].join("\n"));
  copyLinks([packets.join("\n\n---\n\n")], `Copied ${rows.length} sponsorship packet${rows.length === 1 ? "" : "s"}`);
}

function createEvidence(label, value) {
  const item = document.createElement("div");
  item.className = "evidence-item";
  item.append(localCreateElement("span", label), localCreateElement("strong", value || "0"));
  return item;
}

function createLink(label, url) {
  const link = document.createElement("a");
  link.href = url || "#";
  link.target = "_blank";
  link.rel = "noopener";
  link.textContent = label;
  if (!url) {
    link.setAttribute("aria-disabled", "true");
  }
  return link;
}

function createButton(label, handler) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.addEventListener("click", handler);
  return button;
}

function renderSponsorGrid() {
  els.sponsorGrid.innerHTML = "";
  const sponsorPool = state.visibleCompanies && state.visibleCompanies.length ? state.visibleCompanies : COMPANIES;
  const sponsors = sponsorPool
    .filter(company => company.h1bFilings > 0)
    .sort((a, b) => b.h1bFilings - a.h1bFilings)
    .slice(0, 24);
  if (!sponsors.length) {
    const note = document.createElement("p");
    note.className = "empty-note";
    note.textContent = "No H1B sponsor matches for the current company filters.";
    els.sponsorGrid.appendChild(note);
    return;
  }
  const fragment = document.createDocumentFragment();
  sponsors.forEach(company => {
    const workbookMatch = findWorkbookRow(company.name);
    let row, sheetName;
    if (workbookMatch) {
      row = workbookMatch[0];
      sheetName = workbookMatch[1];
    } else {
      sheetName = "All Sponsors Mock";
      row = {
        rank: company.rank || "",
        employerName: company.name,
        applicationPriority: "No priority",
        candidateFitScore: company.sponsorTier === "tier1" ? 90 : company.sponsorTier === "tier2" ? 75 : company.sponsorTier === "tier3" ? 60 : 50,
        studentFriendliness: company.sponsorTier === "tier1" ? "Very Friendly" : "Neutral",
        sponsorshipEvidence: company.sponsorTier === "tier1" ? "Very Strong" : company.sponsorTier === "tier2" ? "Strong" : company.sponsorTier === "tier3" ? "Moderate" : "n/a",
        dataConfidence: "High",
        employerModel: company.companyKind === "vendor" ? "Vendor / Staffing" : "Direct Employer",
        employerReviewFlag: company.companyKind === "vendor" ? "Vendor staffing caution" : "",
        whyApply: `Identified as a sponsor with ${company.h1bFilings.toLocaleString()} H-1B filings. Category: ${company.category}.`,
        newEmploymentPositions: company.h1bFilings,
        certifiedTechLcas: company.h1bFilings,
        explicitEntryCases: Math.round(company.h1bFilings * 0.1),
        medianAnnualWage: "",
        topRoleFamilies: company.category,
        topWorksiteStates: company.tags ? company.tags.join(", ") : "",
        topCities: "",
        topJobTitles: "",
        careerSearchUrl: getCompanyCareersUrl(company)
      };
    }

    const card = document.createElement("article");
    card.className = `company-card sponsor-card sponsor-tier-${company.sponsorTier || "curated"}`;

    const heading = createCompanyIdentityHeader(company, {
      title: `${row.rank || ""}. ${row.employerName || "Unknown employer"}`.trim(),
      subtitle: row.applicationPriority || "No priority",
      score: localFormatScore(row.candidateFitScore)
    });

    const pills = document.createElement("div");
    pills.className = "pill-list";
    [
      row.studentFriendliness,
      row.sponsorshipEvidence,
      row.dataConfidence,
      row.employerModel,
      row.employerReviewFlag
    ].filter(Boolean).forEach(value => pills.appendChild(createPill(value, /review|staffing|consulting/i.test(value) ? "review" : "")));

    const note = localCreateElement("p", row.whyApply || "No workbook reason supplied.", "card-note");
    const evidence = document.createElement("div");
    evidence.className = "evidence-grid";
    evidence.append(
      createEvidence("New positions", localFormatNumber(row.newEmploymentPositions)),
      createEvidence("Tech LCAs", localFormatNumber(row.certifiedTechLcas)),
      createEvidence("Entry cases", localFormatNumber(row.explicitEntryCases)),
      createEvidence("Median wage", localFormatCurrency(row.medianAnnualWage))
    );

    const rolePills = document.createElement("div");
    rolePills.className = "pill-list";
    localSplitList(row.topRoleFamilies).slice(0, 6).forEach(value => rolePills.appendChild(createPill(value)));
    localSplitList(row.topWorksiteStates).slice(0, 5).forEach(value => rolePills.appendChild(createPill(value, "pill-location")));

    const actions = document.createElement("div");
    actions.className = "company-action-groups";
    actions.append(
      createActionGroup("Primary", [
        { label: "Careers", url: getCompanyCareersUrl(company) || row.careerSearchUrl || localBuildGoogleCompanyUrl(row) },
        { label: "LinkedIn Jobs", url: localBuildLinkedInJobsUrl(row) },
        { label: "Use", handler: () => selectCompanySuggestion(company) }
      ]),
      createActionGroup("Research", [
        { label: "Google Company", url: localBuildGoogleCompanyUrl(row) },
        { label: "LinkedIn Recruiters", url: localBuildLinkedInRecruiterUrl(row) },
        { label: "Details", handler: () => showDetails(row, sheetName) }
      ]),
      createActionGroup("Manage", [
        { label: state.favoriteCompanies.has(company.id) ? "Unfavorite" : "Favorite", handler: () => toggleFavoriteCompanyById(company.id) },
        { label: "Copy Packet", handler: () => localCopyRowsAsPackets([row]) }
      ])
    );

    card.append(heading, pills, note, evidence, rolePills, actions);
    fragment.appendChild(card);
  });
  els.sponsorGrid.appendChild(fragment);
}

function rebuildTimeOptions(engine, preferredValue) {
  const options = TIME_OPTIONS[engine] || TIME_OPTIONS.google;
  const current = preferredValue || els.timeFilter.value || "all";
  els.timeFilter.innerHTML = "";

  options.forEach(([value, label]) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = label;
    els.timeFilter.appendChild(option);
  });

  els.timeFilter.value = options.some(([value]) => value === current) ? current : "all";
}

function hydrateFromUrl() {
  const params = new URLSearchParams(window.location.search);
  if (![...params.keys()].length) {
    return false;
  }

  // Overlay-only: URL params override saved preferences without resetting
  // anything the link does not mention.
  setSelectIfValid(els.profileSelect, params.get("profile"));
  setSelectIfValid(els.rolePackSelect, params.get("rolePack"));
  setSelectIfValid(els.searchPresetSelect, params.get("preset"));
  if (params.get("engine") && TIME_OPTIONS[params.get("engine")]) {
    els.engineSelect.value = params.get("engine");
  }
  rebuildTimeOptions(els.engineSelect.value, params.get("time") || els.timeFilter.value || undefined);

  setSelectIfValid(els.locationSelect, params.get("location"));
  setSelectIfValid(els.timeFilter, params.get("time"));
  setSelectIfValid(els.sortSelect, params.get("sort"));
  setSelectIfValid(els.remoteMode, params.get("remote"));
  setSelectIfValid(els.matchMode, params.get("match"));
  setSelectIfValid(els.queryStyleSelect, params.get("queryStyle"));
  setSelectIfValid(els.experienceSelect, params.get("experience"));
  setSelectIfValid(els.employmentSelect, params.get("employment"));
  setSelectIfValid(els.authorizationSelect, params.get("authorization"));
  if (params.has("caution")) {
    els.cautionExcludes.checked = params.get("caution") === "1";
  }
  if (params.has("strict")) {
    els.strictTitle.checked = params.get("strict") === "1";
  }

  if (params.has("job")) {
    els.jobTitle.value = params.get("job") || "";
  }
  if (params.has("customQuery")) {
    els.customQuery.value = params.get("customQuery") || "";
  }
  if (params.has("customSourceName")) {
    els.customSourceName.value = params.get("customSourceName") || "";
  }
  if (params.has("customSourceUrl")) {
    els.customSourceUrl.value = params.get("customSourceUrl") || "";
  }
  if (params.has("sourceLinks")) {
    state.customPortalLinks = decodeJsonParam(params.get("sourceLinks")) || {};
  }
  if (params.has("careerLinks")) {
    state.customCompanyCareers = mergeCompanyCareerLinks(
      state.customCompanyCareers,
      decodeCompanyCareerLinksParam(params.get("careerLinks")) || {}
    );
  }
  if (params.has("include")) {
    els.includeTerms.value = params.get("include") || "";
  }
  if (params.has("exclude")) {
    els.excludeTerms.value = params.get("exclude") || "";
  }

  const groups = params.get("groups");
  if (groups) {
    const selected = groups === "none" ? new Set() : new Set(groups.split(",").filter(Boolean));
    setCategorySelection(selected);
  }
  const pins = params.get("pins");
  if (pins) {
    pins.split(",")
      .filter(id => PORTALS.some(portal => portal.id === id))
      .forEach(id => state.pinnedPortals.add(id));
  }
  const favorites = params.get("favCompanies");
  if (favorites) {
    favorites.split(",")
      .map(id => resolveCompanyId(id))
      .filter(Boolean)
      .forEach(id => state.favoriteCompanies.add(id));
  }
  const checklist = params.get("checklist");
  if (checklist) {
    state.dailyChecklist = {
      date: getTodayStamp(),
      items: Object.fromEntries(checklist.split(",").filter(Boolean).map(id => [id, true]))
    };
  }
  if (params.has("companyRole")) {
    els.companyRole.value = params.get("companyRole") || "";
  }
  if (params.has("companyCustomLinkName")) {
    els.companyCustomLinkName.value = params.get("companyCustomLinkName") || "";
  }
  if (params.has("companyCustomLinkUrl")) {
    els.companyCustomLinkUrl.value = params.get("companyCustomLinkUrl") || "";
  }

  return true;
}

function loadPreferences() {
  let data = {};
  try {
    data = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch (error) {
    data = {};
  }

  setSelectIfValid(els.profileSelect, data.profile || DEFAULT_PROFILE_ID);
  setSelectIfValid(els.rolePackSelect, data.rolePack || DEFAULT_ROLE_PACK_ID);
  setSelectIfValid(els.searchPresetSelect, data.searchPreset || "");
  setSelectIfValid(els.engineSelect, data.engine || "google");
  rebuildTimeOptions(els.engineSelect.value, data.time || undefined);
  setSelectIfValid(els.timeFilter, data.time || "all");
  setSelectIfValid(els.locationSelect, data.location || "usa");
  setSelectIfValid(els.sortSelect, data.sort || "coverage");
  setSelectIfValid(els.remoteMode, data.remoteMode || "neutral");
  setSelectIfValid(els.matchMode, data.matchMode || "smart");
  setSelectIfValid(els.queryStyleSelect, data.queryStyle || "balanced");
  setSelectIfValid(els.experienceSelect, data.experience || "entry");
  setSelectIfValid(els.employmentSelect, data.employment || "any");
  setSelectIfValid(els.authorizationSelect, data.authorization || "none");
  els.cautionExcludes.checked = Boolean(data.cautionExcludes);
  els.strictTitle.checked = Boolean(data.strictTitle);

  els.jobTitle.value = data.jobTitle || "";
  els.customQuery.value = data.customQuery || "";
  els.customSourceName.value = data.customSourceName || "";
  els.customSourceUrl.value = data.customSourceUrl || "";
  els.includeTerms.value = data.includeTerms || "";
  els.excludeTerms.value = data.excludeTerms || "";
  els.companyRole.value = data.companyRole || "";
  els.companyFilter.value = data.companyFilter || "";
  setSelectIfValid(els.companyRolePack, data.companyRolePack || data.rolePack || DEFAULT_ROLE_PACK_ID);
  setSelectIfValid(els.companyTimeFilter, data.companyTime || "24hours");
  setSelectIfValid(els.companyExperienceSelect, data.companyExperience || "entry");
  setSelectIfValid(els.companyLocationSelect, data.companyLocation || data.location || "usa");
  setSelectIfValid(els.companyRemoteMode, data.companyRemoteMode || data.remoteMode || "neutral");
  setSelectIfValid(els.companyEmploymentSelect, data.companyEmployment || "any");
  setSelectIfValid(els.companyAuthorizationSelect, data.companyAuthorization || "none");
  els.companyIncludeTerms.value = data.companyInclude || "";
  els.companyExcludeTerms.value = data.companyExclude || "";
  els.companyCustomLinkName.value = data.companyCustomLinkName || "";
  els.companyCustomLinkUrl.value = data.companyCustomLinkUrl || "";
  setSelectIfValid(els.companySortSelect, data.companySort || "latest");
  setSelectIfValid(els.companyCategorySelect, data.companyCategory || "all");
  setSelectIfValid(els.companySponsorTier, data.companySponsorTier || "all");
  setSelectIfValid(els.companyKind, data.companyKind || "all");
  els.vendorRole.value = data.vendorRole || "";
  els.vendorFilter.value = data.vendorFilter || "";
  setSelectIfValid(els.vendorLocation, data.vendorLocation || data.companyLocation || data.location || "usa");
  setSelectIfValid(els.vendorSponsorTier, data.vendorSponsorTier || "all");
  setSelectIfValid(els.vendorCategory, data.vendorCategory || "all");
  setSelectIfValid(els.vendorKind, data.vendorKind || "vendor");
  setSelectIfValid(els.vendorHasUrl, data.vendorHasUrl || "all");

  if (Array.isArray(data.selectedCategories)) {
    setCategorySelection(new Set(data.selectedCategories));
  }
  if (Array.isArray(data.favoriteCompanies)) {
    state.favoriteCompanies = new Set(data.favoriteCompanies);
  }
  if (Array.isArray(data.pinnedPortals)) {
    state.pinnedPortals = new Set(data.pinnedPortals.filter(id => PORTALS.some(portal => portal.id === id)));
  }
  if (data.customPortalLinks && typeof data.customPortalLinks === "object" && !Array.isArray(data.customPortalLinks)) {
    state.customPortalLinks = sanitizePortalLinks(data.customPortalLinks);
  }
  if (data.customCompanyCareers && typeof data.customCompanyCareers === "object" && !Array.isArray(data.customCompanyCareers)) {
    state.customCompanyCareers = sanitizeCompanyCareerLinks(data.customCompanyCareers);
  }
  mergeCompanyVaultIntoState(readCompanyVault());
  if (data.dailyChecklist && typeof data.dailyChecklist === "object") {
    state.dailyChecklist = data.dailyChecklist.date === getTodayStamp() ? data.dailyChecklist : { date: getTodayStamp(), items: {} };
  }
  if (data.selectedCompany) {
    setSelectIfValid(els.companySelect, data.selectedCompany);
  }
  setSelectIfValid(els.openBatchSize, data.openBatchSize || "5");
  // Checked links persist for the current day only, so each morning starts fresh.
  if (Array.isArray(data.checkedKeys) && data.checkedDate === getTodayStamp()) {
    state.checked = new Set(data.checkedKeys);
  }
}

function getTodayStamp() {
  return new Date().toISOString().slice(0, 10);
}

function getStoredJson(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") || null;
  } catch (error) {
    return null;
  }
}

function getProtectedStorageSnapshots() {
  const snapshots = [];
  const seen = new Set();
  [COMPANY_VAULT_BACKUP_KEY, COMPANY_VAULT_KEY, STORAGE_KEY].forEach(key => {
    const value = getStoredJson(key);
    if (value) {
      seen.add(key);
      snapshots.push(value);
    }
  });

  try {
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (!key || seen.has(key) || !PROTECTED_LOCAL_STORAGE_PATTERN.test(key)) {
        continue;
      }
      const value = getStoredJson(key);
      if (value && typeof value === "object" && !Array.isArray(value)) {
        snapshots.push(value);
      }
    }
  } catch (error) {
    // Some privacy modes can block localStorage enumeration; direct keys above still work.
  }
  return snapshots;
}

function normalizeCompanyLookupName(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\b(inc|incorporated|llc|ltd|limited|corp|corporation|co|company|services|service|technologies|technology|systems|system|solutions|solution|group|holdings|holding|usa|us|u s|llp|plc|na|north america)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function companyLookupLabels(company) {
  return [
    company.id,
    company.name,
    ...(company.name || "").split(/[\/()]/),
    ...(company.aliases || [])
  ].filter(Boolean);
}

function resolveCompanyId(reference) {
  const rawId = typeof reference === "string" ? reference : String(reference?.id || reference?.companyId || "");
  if (rawId && COMPANIES.some(company => company.id === rawId)) {
    return rawId;
  }

  const name = typeof reference === "string" ? reference : String(reference?.name || reference?.companyName || reference?.employerName || reference?.label || "");
  const candidates = mergeUnique([rawId, name], [slugify(rawId), slugify(name)])
    .map(value => String(value || "").trim())
    .filter(Boolean);
  const slugMatch = candidates.find(candidate => COMPANIES.some(company => company.id === candidate));
  if (slugMatch) {
    return slugMatch;
  }

  const normalizedCandidates = candidates.map(normalizeCompanyLookupName).filter(value => value.length >= 3);
  if (!normalizedCandidates.length) {
    return "";
  }
  const match = COMPANIES.find(company =>
    companyLookupLabels(company).some(label => {
      const normalizedLabel = normalizeCompanyLookupName(label);
      return normalizedLabel && normalizedCandidates.some(candidate =>
        normalizedLabel === candidate ||
        (candidate.length >= 4 && normalizedLabel.includes(candidate)) ||
        (normalizedLabel.length >= 4 && candidate.includes(normalizedLabel))
      );
    })
  );
  return match?.id || "";
}

function normalizeCompanyVault(raw) {
  const source = raw?.companyVault || raw?.settings || raw || {};
  const clean = {
    version: 2,
    updatedAt: source.updatedAt || "",
    favoriteCompanies: [],
    pinnedPortals: [],
    customPortalLinks: {},
    customCompanyCareers: {}
  };

  (Array.isArray(source.favoriteCompanies) ? source.favoriteCompanies : []).forEach(item => {
    const id = resolveCompanyId(item);
    if (id && !clean.favoriteCompanies.includes(id)) {
      clean.favoriteCompanies.push(id);
    }
  });

  (Array.isArray(source.pinnedPortals) ? source.pinnedPortals : []).forEach(item => {
    const id = typeof item === "string" ? item : String(item?.id || "");
    if (PORTALS.some(portal => portal.id === id) && !clean.pinnedPortals.includes(id)) {
      clean.pinnedPortals.push(id);
    }
  });

  Object.entries(source.customCompanyCareers || source.careerLinks || {}).forEach(([storedId, value]) => {
    const url = typeof value === "string" ? value.trim() : String(value?.url || "").trim();
    const id = resolveCompanyId({
      id: storedId,
      name: value?.name || value?.companyName || value?.employerName
    });
    const company = COMPANIES.find(item => item.id === id);
    if (company && /^https?:\/\//i.test(url) && url !== company.careersUrl) {
      clean.customCompanyCareers[id] = {
        url,
        name: company.name,
        updatedAt: value?.updatedAt || clean.updatedAt || ""
      };
    }
  });

  clean.customPortalLinks = sanitizePortalLinks(source.customPortalLinks || source.portalLinks || source.sourceLinks || {});

  return clean;
}

function readCompanyVault() {
  const snapshots = getProtectedStorageSnapshots().map(normalizeCompanyVault);
  const merged = snapshots.reduce((acc, item) => mergeCompanyVaults(acc, item), normalizeCompanyVault({}));
  return merged;
}

function mergeCompanyVaults(...vaults) {
  return vaults.reduce((acc, itemRaw) => {
    const item = normalizeCompanyVault(itemRaw);
    return {
      version: 2,
      updatedAt: item.updatedAt || acc.updatedAt || "",
      favoriteCompanies: mergeUnique(acc.favoriteCompanies, item.favoriteCompanies),
      pinnedPortals: mergeUnique(acc.pinnedPortals, item.pinnedPortals),
      customPortalLinks: mergePortalLinks(acc.customPortalLinks, item.customPortalLinks),
      customCompanyCareers: mergeCompanyCareerLinks(acc.customCompanyCareers, item.customCompanyCareers)
    };
  }, {
    version: 2,
    updatedAt: "",
    favoriteCompanies: [],
    pinnedPortals: [],
    customPortalLinks: {},
    customCompanyCareers: {}
  });
}

function mergePortalLinks(...sources) {
  const merged = {};
  sources.forEach(source => {
    Object.entries(sanitizePortalLinks(source || {})).forEach(([id, link]) => {
      merged[id] = link;
    });
  });
  return sanitizePortalLinks(merged);
}

function readCurrentCompanyVaultKeysOnly() {
  const primary = normalizeCompanyVault(getStoredJson(COMPANY_VAULT_KEY));
  const backup = normalizeCompanyVault(getStoredJson(COMPANY_VAULT_BACKUP_KEY));
  return {
    version: 2,
    updatedAt: primary.updatedAt || backup.updatedAt || "",
    favoriteCompanies: mergeUnique(primary.favoriteCompanies, backup.favoriteCompanies),
    pinnedPortals: mergeUnique(primary.pinnedPortals, backup.pinnedPortals),
    customPortalLinks: mergePortalLinks(backup.customPortalLinks, primary.customPortalLinks),
    customCompanyCareers: mergeCompanyCareerLinks(backup.customCompanyCareers, primary.customCompanyCareers)
  };
}

function mergeCompanyCareerLinks(...sources) {
  const merged = {};
  sources.forEach(source => {
    Object.entries(sanitizeCompanyCareerLinks(source || {})).forEach(([id, link]) => {
      merged[id] = link;
    });
  });
  return sanitizeCompanyCareerLinks(merged);
}

function mergeCompanyVaultIntoState(vaultRaw) {
  const vault = normalizeCompanyVault(vaultRaw);
  vault.favoriteCompanies.forEach(id => state.favoriteCompanies.add(id));
  vault.pinnedPortals.forEach(id => state.pinnedPortals.add(id));
  state.customPortalLinks = mergePortalLinks(state.customPortalLinks, vault.customPortalLinks);
  state.customCompanyCareers = mergeCompanyCareerLinks(state.customCompanyCareers, vault.customCompanyCareers);
}

function createCompanyVaultSnapshot() {
  const customCompanyCareers = sanitizeCompanyCareerLinks(state.customCompanyCareers);
  const updatedAt = new Date().toISOString();
  return {
    version: 2,
    updatedAt,
    favoriteCompanies: Array.from(state.favoriteCompanies)
      .map(id => COMPANIES.find(company => company.id === id))
      .filter(Boolean)
      .map(company => ({ id: company.id, name: company.name })),
    pinnedPortals: Array.from(state.pinnedPortals).filter(id => PORTALS.some(portal => portal.id === id)),
    customPortalLinks: sanitizePortalLinks(state.customPortalLinks),
    customCompanyCareers: Object.fromEntries(Object.entries(customCompanyCareers).map(([id, link]) => {
      const company = COMPANIES.find(item => item.id === id);
      return [id, {
        url: link.url,
        name: company?.name || link.name || id,
        updatedAt: link.updatedAt || updatedAt
      }];
    }))
  };
}

function saveCompanyVault(options = {}) {
  const current = createCompanyVaultSnapshot();
  const vault = options.replace
    ? current
    : mergeCompanyVaults(readCurrentCompanyVaultKeysOnly(), current);
  try {
    const serialized = JSON.stringify(vault);
    localStorage.setItem(COMPANY_VAULT_KEY, serialized);
    localStorage.setItem(COMPANY_VAULT_BACKUP_KEY, serialized);
  } catch (error) {
    showToast("Company vault could not be saved. Copy a vault backup now.");
  }
  syncCompanyVaultStatus(vault);
}

function syncCompanyVaultStatus(vaultRaw = readCompanyVault()) {
  if (!els.companyVaultStatus) {
    return;
  }
  const vault = normalizeCompanyVault(vaultRaw);
  const linkCount = Object.keys(vault.customCompanyCareers).length;
  const boardLinkCount = Object.keys(vault.customPortalLinks).length;
  const favoriteCount = vault.favoriteCompanies.length;
  const pinCount = vault.pinnedPortals.length;
  const lastSaved = vault.updatedAt ? new Date(vault.updatedAt).toLocaleString() : "not saved yet";
  els.companyVaultStatus.textContent = `${linkCount} custom Careers links, ${boardLinkCount} custom job-board link sets, ${favoriteCount} favorite companies, ${pinCount} pinned sources saved. Last saved: ${lastSaved}.`;
}

function savePreferences(options = {}) {
  if (!options.replaceProtectedVault) {
    mergeCompanyVaultIntoState(readCompanyVault());
  }
  const payload = {
    profile: els.profileSelect.value,
    rolePack: els.rolePackSelect.value,
    searchPreset: els.searchPresetSelect.value,
    jobTitle: els.jobTitle.value,
    engine: els.engineSelect.value,
    time: els.timeFilter.value,
    location: els.locationSelect.value,
    sort: els.sortSelect.value,
    remoteMode: els.remoteMode.value,
    matchMode: els.matchMode.value,
    queryStyle: els.queryStyleSelect.value,
    hasTypedTitle: parseTitles(els.jobTitle.value).length > 0,
    experience: els.experienceSelect.value,
    employment: els.employmentSelect.value,
    authorization: els.authorizationSelect.value,
    customQuery: els.customQuery.value,
    customSourceName: els.customSourceName.value,
    customSourceUrl: els.customSourceUrl.value,
    includeTerms: els.includeTerms.value,
    excludeTerms: els.excludeTerms.value,
    cautionExcludes: els.cautionExcludes.checked,
    strictTitle: els.strictTitle.checked,
    companyRole: els.companyRole.value,
    companyFilter: els.companyFilter.value,
    companyRolePack: els.companyRolePack.value,
    companyTime: els.companyTimeFilter.value,
    companyExperience: els.companyExperienceSelect.value,
    companyLocation: els.companyLocationSelect.value,
    companyRemoteMode: els.companyRemoteMode.value,
    companyEmployment: els.companyEmploymentSelect.value,
    companyAuthorization: els.companyAuthorizationSelect.value,
    companyInclude: els.companyIncludeTerms.value,
    companyExclude: els.companyExcludeTerms.value,
    companyCustomLinkName: els.companyCustomLinkName.value,
    companyCustomLinkUrl: els.companyCustomLinkUrl.value,
    companySort: els.companySortSelect.value,
    companyCategory: els.companyCategorySelect.value,
    companySponsorTier: els.companySponsorTier.value,
    companyKind: els.companyKind.value,
    vendorRole: els.vendorRole.value,
    vendorFilter: els.vendorFilter.value,
    vendorLocation: els.vendorLocation.value,
    vendorSponsorTier: els.vendorSponsorTier.value,
    vendorCategory: els.vendorCategory.value,
    vendorKind: els.vendorKind.value,
    vendorHasUrl: els.vendorHasUrl.value,
    selectedCategories: Array.from(getSelectedCategories()),
    favoriteCompanies: Array.from(state.favoriteCompanies),
    pinnedPortals: Array.from(state.pinnedPortals),
    customPortalLinks: sanitizePortalLinks(state.customPortalLinks),
    customCompanyCareers: sanitizeCompanyCareerLinks(state.customCompanyCareers),
    dailyChecklist: getDailyChecklist(),
    selectedCompany: els.companySelect.value,
    openBatchSize: els.openBatchSize.value,
    checkedKeys: Array.from(state.checked),
    checkedDate: getTodayStamp()
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  saveCompanyVault({ replace: Boolean(options.replaceProtectedVault) });
}

function persistPortableState() {
  savePreferences();
  updateAddressBar(getSearchTitles(), getContext(), "replace");
}

function persistAndMaybeGenerate() {
  savePreferences();
  syncProfileDescription();
  syncCompanyCard();
  renderVendorOutreach();
  if (hasJobTitle()) {
    generateResults();
  } else {
    updateCounts();
    updatePreviewForEmptyState();
    updateAddressBar(getSearchTitles(), getContext(), "replace");
  }
}

function applyProfile(profileId) {
  const profile = SEARCH_PROFILES.find(item => item.id === profileId) || SEARCH_PROFILES[0];
  if (profile.defaults.engine) {
    setSelectIfValid(els.engineSelect, profile.defaults.engine);
  }
  if (profile.defaults.time) {
    rebuildTimeOptions(els.engineSelect.value, profile.defaults.time);
  }
  setSelectIfValid(els.rolePackSelect, profile.defaults.rolePack);
  setSelectIfValid(els.timeFilter, profile.defaults.time);
  setSelectIfValid(els.sortSelect, profile.defaults.sort);
  setSelectIfValid(els.authorizationSelect, profile.defaults.authorization);
  setSelectIfValid(els.experienceSelect, profile.defaults.experience);
  setSelectIfValid(els.matchMode, profile.defaults.matchMode);
  setSelectIfValid(els.queryStyleSelect, profile.defaults.queryStyle);
  if (profile.categories) {
    setCategorySelection(new Set(profile.categories));
  }
}

function applySelectedSearchPreset() {
  const preset = SEARCH_PRESETS.find(item => item.id === els.searchPresetSelect.value);
  if (!preset) {
    showToast("Choose a preset first");
    return;
  }
  applySearchPreset(preset);
}

function applySearchPreset(preset) {
  els.searchPresetSelect.value = preset.id;
  els.jobTitle.value = preset.jobTitle;
  els.profileSelect.value = preset.profile;
  applyProfile(preset.profile);
  setSelectIfValid(els.rolePackSelect, preset.rolePack);
  rebuildTimeOptions(els.engineSelect.value, preset.time);
  setSelectIfValid(els.timeFilter, preset.time);
  setSelectIfValid(els.sortSelect, preset.sort);
  setSelectIfValid(els.experienceSelect, "entry");
  setSelectIfValid(els.authorizationSelect, "none");
  setSelectIfValid(els.matchMode, "smart");
  setSelectIfValid(els.queryStyleSelect, "balanced");
  setCategorySelection(new Set(preset.groups));
  syncProfileDescription();
  generateResults();
  window.scrollTo({ top: 0, behavior: "smooth" });
  showToast(`${preset.label} preset ready`);
}

function applyPrecision(precision) {
  switch (precision) {
    case "minuteRadar":
      setSelectIfValid(els.engineSelect, "google");
      rebuildTimeOptions("google", "15minutes");
      setSelectIfValid(els.timeFilter, "15minutes");
      setSelectIfValid(els.sortSelect, "latest");
      setSelectIfValid(els.authorizationSelect, "none");
      setCategorySelection(new Set(["top", "direct", "signals", "general", "tech", "company"]));
      break;
    case "latest1":
      setSelectIfValid(els.engineSelect, "google");
      rebuildTimeOptions(els.engineSelect.value, "1hour");
      setSelectIfValid(els.timeFilter, "1hour");
      setSelectIfValid(els.sortSelect, "latest");
      setSelectIfValid(els.authorizationSelect, "none");
      setCategorySelection(new Set(["top", "direct", "signals", "general", "tech", "company"]));
      break;
    case "latest24":
      rebuildTimeOptions(els.engineSelect.value, "24hours");
      setSelectIfValid(els.timeFilter, "24hours");
      setSelectIfValid(els.sortSelect, "latest");
      setSelectIfValid(els.authorizationSelect, "none");
      setCategorySelection(new Set(DEFAULT_CATEGORY_IDS));
      break;
    case "optSponsor":
      setSelectIfValid(els.authorizationSelect, "optBroad");
      setSelectIfValid(els.sortSelect, "coverage");
      setCategorySelection(new Set(["top", "direct", "signals", "general", "tech", "company", "research"]));
      break;
    case "direct":
      setSelectIfValid(els.sortSelect, "direct");
      setCategorySelection(new Set(["top", "direct", "company"]));
      break;
    case "exact":
      setSelectIfValid(els.matchMode, "exact");
      setSelectIfValid(els.sortSelect, "recommended");
      break;
    default:
      setSelectIfValid(els.authorizationSelect, "none");
      setSelectIfValid(els.matchMode, "smart");
      setSelectIfValid(els.sortSelect, "coverage");
      setCategorySelection(new Set(DEFAULT_CATEGORY_IDS));
      break;
  }
}

function syncProfileDescription() {
  const profile = SEARCH_PROFILES.find(item => item.id === els.profileSelect.value) || SEARCH_PROFILES[0];
  const rolePack = getRolePack(els.rolePackSelect.value);
  els.profileDescription.textContent = `${profile.description} Role pack: ${rolePack.label}. Query: ${FILTER_LABELS.queryStyle[els.queryStyleSelect.value] || "Balanced smart"}. Mode: ${FILTER_LABELS.precision[getPrecisionFromProfile(profile.id)] || "Max Coverage"}.`;
}

function setSelectIfValid(select, value) {
  if (!value) {
    return;
  }
  if ([...select.options].some(option => option.value === value)) {
    select.value = value;
  }
}

function setCategorySelection(selected) {
  els.categoryFilters.querySelectorAll("input").forEach(input => {
    input.checked = selected.has(input.value);
  });
}

function hasJobTitle() {
  return getSearchTitles().length > 0;
}

function generateResults(updateUrl = true) {
  const titles = getSearchTitles();
  if (!titles.length) {
    state.results = [];
    state.checked.clear();
    els.results.innerHTML = "";
    const emptyMessage = els.emptyState.querySelector("strong");
    if (emptyMessage) {
      emptyMessage.textContent = "Ready when you are, Taran.";
    }
    setEmptyState(true);
    updateCounts();
    updatePreviewForEmptyState();
    savePreferences();
    if (updateUrl) {
      updateAddressBar(titles, getContext(), "replace");
    }
    return;
  }

  const context = getContext();
  const portals = getSelectedPortals();
  if (!portals.length) {
    state.results = [];
    state.checked.clear();
    els.results.innerHTML = "";
    const emptyMessage = els.emptyState.querySelector("strong");
    if (emptyMessage) {
      emptyMessage.textContent = "Select at least one source group.";
    }
    setEmptyState(true);
    updateCounts();
    updatePreviewForEmptyState();
    savePreferences();
    if (updateUrl) {
      updateAddressBar(titles, context);
    }
    return;
  }

  const nextResults = [];

  titles.forEach(title => {
    portals.forEach(portal => {
      const query = buildPortalQuery(title, portal, context);
      const defaultUrl = buildSearchUrl(portal, query, title, context);
      const customPortalLinks = buildPortalCustomLinkUrls(portal, title, context, query);
      const customPortalUrl = customPortalLinks[0]?.url || "";
      const url = customPortalUrl || defaultUrl;
      const searchKind = getSearchKind(portal);
      const freshnessLabel = getPortalFreshnessLabel(portal, context);
      nextResults.push({
        key: `${title.toLowerCase()}::${portal.id}`,
        title,
        portal,
        query,
        url,
        defaultUrl,
        customPortalUrl,
        customPortalTemplate: customPortalLinks[0]?.template || "",
        customPortalSourceId: customPortalUrl ? portal.id : "",
        searchKind,
        freshnessLabel,
        badges: getSourceBadges(portal, context, searchKind, Boolean(customPortalUrl)),
        opportunityScore: getOpportunityFitScore(portal, context, searchKind, freshnessLabel)
      });
      customPortalLinks.slice(1).forEach((customLink, index) => {
        nextResults.push({
          key: `${title.toLowerCase()}::${portal.id}::custom::${index + 2}`,
          title,
          portal: {
            ...portal,
            id: `${portal.id}Custom${index + 2}`,
            name: `${portal.name} - ${customLink.label}`,
            note: `Extra saved custom template for ${portal.name}.`,
            tags: [...(portal.tags || []), "custom"],
            noPin: true
          },
          query: customLink.template || customLink.url,
          url: customLink.url,
          defaultUrl,
          customPortalUrl: customLink.url,
          customPortalTemplate: customLink.template || customLink.url,
          customPortalSourceId: portal.id,
          searchKind: "custom-link",
          freshnessLabel,
          badges: ["custom", portal.name],
          opportunityScore: Math.max(68, getOpportunityFitScore(portal, context, searchKind, freshnessLabel) - 4)
        });
      });
    });
    nextResults.push(...getCustomSourceResults(title, context));
  });

  state.results = nextResults;
  state.checked = new Set([...state.checked].filter(key => state.results.some(item => item.key === key)));
  renderResults();
  updateRelatedTitles(titles[0]);
  setEmptyState(false);
  updateCounts();
  updatePreview(titles[0], portals[0], context);
  savePreferences();
  if (updateUrl) {
    updateAddressBar(titles, context);
  }
}

function renderResults() {
  els.results.innerHTML = "";
  const grouped = new Map();
  state.results.forEach(item => {
    if (!grouped.has(item.title)) {
      grouped.set(item.title, []);
    }
    grouped.get(item.title).push(item);
  });

  const fragment = document.createDocumentFragment();
  grouped.forEach((items, title) => {
    const group = document.createElement("section");
    group.className = "result-group";

    const heading = document.createElement("div");
    heading.className = "result-title";
    const h3 = document.createElement("h3");
    h3.textContent = title;
    const meta = document.createElement("p");
    meta.textContent = `${items.length} source links`;
    heading.append(h3, meta);

    const grid = document.createElement("div");
    grid.className = "portal-grid";
    items.forEach(item => grid.appendChild(renderPortalRow(item)));

    group.append(heading, grid);
    fragment.appendChild(group);
  });

  els.results.appendChild(fragment);
}

function getCustomSourceTemplates() {
  return parseCustomTemplateInput(els.customSourceUrl.value, els.customSourceName.value, "Custom Source");
}

function getCustomSourceResults(title, context) {
  return getCustomSourceTemplates().map((template, index) => {
    const url = buildCustomTemplateUrl(template.url, {
      title,
      query: buildBoardKeywordQuery(title, context, { includeAuthorization: true }),
      location: getNativeLocation(context.location),
      time: getTimeLabel(context.time),
      company: ""
    });
    if (!url) {
      return null;
    }
    return {
      key: `${title.toLowerCase()}::customSource::${index + 1}`,
      title,
      portal: {
        id: `customSource${index + 1}`,
        name: template.label,
        category: "top",
        tags: ["custom"],
        note: "Your portable custom source template. Use the Permanent Sync Link to move it to another system.",
        noPin: true
      },
      query: template.url,
      url,
      searchKind: "custom-link",
      freshnessLabel: "",
      badges: ["custom"],
      opportunityScore: 72
    };
  }).filter(Boolean);
}

function splitCustomTemplateLines(raw) {
  return String(raw || "")
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);
}

function splitCustomTemplateNames(raw) {
  return String(raw || "")
    .split(/\r?\n|[,;]/)
    .map(name => name.trim())
    .filter(Boolean);
}

function parseCustomTemplateInput(rawUrls, rawNames, fallbackLabel) {
  const names = splitCustomTemplateNames(rawNames);
  return splitCustomTemplateLines(rawUrls).map((line, index) => {
    const labeled = line.match(/^(.+?)\s*(?:\||=>)\s*(https?:\/\/.+)$/i);
    const label = (labeled?.[1] || names[index] || `${fallbackLabel}${index ? ` ${index + 1}` : ""}`).trim();
    const url = (labeled?.[2] || line).trim();
    if (!/^https?:\/\//i.test(url)) {
      return null;
    }
    return { label: label || `${fallbackLabel}${index ? ` ${index + 1}` : ""}`, url };
  }).filter(Boolean);
}

function buildCustomTemplateUrl(template, values) {
  const cleaned = String(template || "").trim();
  if (!cleaned) {
    return "";
  }
  const replacements = {
    role: values.title || "",
    title: values.title || "",
    query: values.query || values.title || "",
    location: values.location || "",
    time: values.time || "",
    company: values.company || "",
    source: values.source || "",
    portal: values.source || ""
  };
  const url = cleaned.replace(/\{(role|title|query|location|time|company|source|portal)\}/gi, (match, key) => encodeURIComponent(replacements[key.toLowerCase()] || ""));
  return /^https?:\/\//i.test(url) ? url : "";
}

function buildPortalCustomLinkUrls(portal, title, context, defaultQuery) {
  const customLinks = getPortalCustomLinks(portal.id);
  if (!customLinks.length) {
    return [];
  }
  const query = portal.native && portal.native !== "google" && portal.native !== "static"
    ? buildNativeKeywordQuery(title, context)
    : defaultQuery;
  return customLinks.map(custom => {
    const url = buildCustomTemplateUrl(custom.url, {
      title,
      query,
      location: getNativeLocation(context.location),
      time: getTimeLabel(context.time),
      company: "",
      source: portal.name
    });
    return url ? { ...custom, template: custom.url, url } : null;
  }).filter(Boolean);
}

function buildPortalCustomLinkUrl(portal, title, context, defaultQuery) {
  return buildPortalCustomLinkUrls(portal, title, context, defaultQuery)[0]?.url || "";
}

function getPortalCustomLink(portalId) {
  return getPortalCustomLinks(portalId)[0] || null;
}

function getPortalCustomLinks(portalId) {
  const custom = sanitizePortalLinks(state.customPortalLinks)[portalId];
  if (!custom) {
    return [];
  }
  if (Array.isArray(custom.links) && custom.links.length) {
    return custom.links;
  }
  return custom.url ? [{ label: custom.label || "Custom Link", url: custom.url }] : [];
}

function requestTextInput({ title, message, value = "", placeholder = "", multiline = false }) {
  return new Promise(resolve => {
    const dialog = document.createElement("dialog");
    dialog.className = "settings-dialog";

    const form = document.createElement("form");
    form.method = "dialog";

    const heading = document.createElement("h3");
    heading.textContent = title;

    const note = document.createElement("p");
    note.textContent = message;

    const input = multiline ? document.createElement("textarea") : document.createElement("input");
    input.className = "settings-dialog-input";
    input.value = value || "";
    input.placeholder = placeholder;
    if (multiline) {
      input.rows = 7;
    } else {
      input.type = "text";
    }

    const actions = document.createElement("div");
    actions.className = "settings-dialog-actions";

    const cancel = document.createElement("button");
    cancel.type = "button";
    cancel.className = "secondary-button";
    cancel.textContent = "Cancel";

    const save = document.createElement("button");
    save.type = "submit";
    save.className = "primary-button";
    save.textContent = "Save";

    actions.append(cancel, save);
    form.append(heading, note, input, actions);
    dialog.appendChild(form);
    document.body.appendChild(dialog);

    let settled = false;
    const finish = result => {
      if (settled) {
        return;
      }
      settled = true;
      dialog.close();
      dialog.remove();
      resolve(result);
    };

    form.addEventListener("submit", event => {
      event.preventDefault();
      finish(input.value);
    });
    cancel.addEventListener("click", () => finish(null));
    dialog.addEventListener("cancel", event => {
      event.preventDefault();
      finish(null);
    });
    dialog.showModal();
    input.focus();
    input.select();
  });
}

async function editPortalCustomLink(portalId) {
  const portal = PORTALS.find(item => item.id === portalId);
  if (!portal) {
    return;
  }
  const current = getPortalCustomLinks(portalId)
    .map(link => `${link.label || "Custom Link"} | ${link.url}`)
    .join("\n");
  const next = await requestTextInput({
    title: `${portal.name} custom links`,
    message: "One per line: Label | https://... Tokens: {role}, {query}, {location}, {time}, {source}. Leave blank to reset this board.",
    value: current,
    multiline: true,
    placeholder: `Primary | https://example.com/jobs?q={role}&location={location}`
  });
  if (next === null) {
    return;
  }
  const cleaned = next.trim();
  if (!cleaned) {
    resetPortalCustomLink(portalId);
    return;
  }
  const links = parseCustomTemplateInput(cleaned, "", portal.name);
  if (!links.length) {
    showToast("Each custom board link must start with http:// or https://");
    return;
  }
  state.customPortalLinks = sanitizePortalLinks({
    ...state.customPortalLinks,
    [portalId]: { links }
  });
  persistPortalLinkChange(`${portal.name} custom ${links.length === 1 ? "link" : "links"} saved`);
}

function resetPortalCustomLink(portalId) {
  const portal = PORTALS.find(item => item.id === portalId);
  if (!portal) {
    return;
  }
  const next = { ...state.customPortalLinks };
  delete next[portalId];
  state.customPortalLinks = sanitizePortalLinks(next);
  persistPortalLinkChange(`${portal.name} custom link reset`);
}

function persistPortalLinkChange(message) {
  savePreferences({ replaceProtectedVault: true });
  if (hasJobTitle()) {
    generateResults();
  } else {
    updateCounts();
    updatePreviewForEmptyState();
    updateAddressBar(getSearchTitles(), getContext(), "replace");
  }
  showToast(message);
}

function getCompanyCareersUrl(company) {
  return sanitizeCompanyCareerLinks(state.customCompanyCareers)[company.id]?.url || company.careersUrl;
}

function hasCustomCompanyCareers(company) {
  return Boolean(sanitizeCompanyCareerLinks(state.customCompanyCareers)[company.id]);
}

async function editCompanyCareersLink(company) {
  if (!company) {
    return;
  }
  const current = getCompanyCareersUrl(company);
  const next = await requestTextInput({
    title: `${company.name} Careers link`,
    message: `Default: ${company.careersUrl}. Leave blank to reset this company to the default Careers page.`,
    value: current,
    placeholder: company.careersUrl || "https://company.com/careers"
  });
  if (next === null) {
    return;
  }
  const cleaned = next.trim();
  if (!cleaned) {
    resetCompanyCareersLink(company);
    return;
  }
  if (!/^https?:\/\//i.test(cleaned)) {
    showToast("Careers link must start with http:// or https://");
    return;
  }
  state.customCompanyCareers = sanitizeCompanyCareerLinks({
    ...state.customCompanyCareers,
    [company.id]: { url: cleaned, name: company.name, updatedAt: new Date().toISOString() }
  });
  persistCompanyCareerChange(`${company.name} careers link saved`);
}

function resetCompanyCareersLink(company) {
  if (!company) {
    return;
  }
  const next = { ...state.customCompanyCareers };
  delete next[company.id];
  state.customCompanyCareers = sanitizeCompanyCareerLinks(next);
  persistCompanyCareerChange(`${company.name} careers link reset`);
}

function persistCompanyCareerChange(message) {
  savePreferences({ replaceProtectedVault: true });
  renderCompanyOptions(els.companyFilter.value);
  syncCompanyCard();
  renderFavoriteCompanies();
  renderSponsorGrid();
  renderVendorOutreach();
  updateAddressBar(getSearchTitles(), getContext(), "replace");
  showToast(message);
}

function sanitizePortalLinks(raw) {
  const clean = {};
  Object.entries(raw || {}).forEach(([portalId, value]) => {
    const portal = PORTALS.find(item => item.id === portalId);
    if (!portal) {
      return;
    }
    const links = normalizeCustomLinkEntries(value, portal.name);
    if (links.length) {
      clean[portalId] = {
        label: links[0].label,
        url: links[0].url,
        links
      };
    }
  });
  return clean;
}

function normalizeCustomLinkEntries(value, fallbackLabel) {
  if (!value) {
    return [];
  }
  if (typeof value === "string") {
    return parseCustomTemplateInput(value, "", fallbackLabel);
  }
  if (Array.isArray(value)) {
    return value.flatMap(item => normalizeCustomLinkEntries(item, fallbackLabel));
  }
  if (typeof value === "object") {
    const fromLinks = Array.isArray(value.links)
      ? value.links.flatMap(item => normalizeCustomLinkEntries(item, fallbackLabel))
      : [];
    const url = String(value.url || value.href || value.template || "").trim();
    const label = String(value.label || value.name || fallbackLabel || "Custom Link").trim();
    const direct = /^https?:\/\//i.test(url) ? [{ label, url }] : [];
    return [...fromLinks, ...direct].filter((link, index, links) =>
      links.findIndex(other => other.url === link.url && other.label === link.label) === index
    );
  }
  return [];
}

function sanitizeCompanyCareerLinks(raw) {
  const clean = {};
  Object.entries(raw || {}).forEach(([companyId, value]) => {
    const id = resolveCompanyId({
      id: companyId,
      name: value?.name || value?.companyName || value?.employerName
    });
    const company = COMPANIES.find(item => item.id === id);
    if (!company) {
      return;
    }
    const url = typeof value === "string" ? value.trim() : String(value?.url || "").trim();
    if (/^https?:\/\//i.test(url) && url !== company.careersUrl) {
      clean[id] = {
        url,
        name: company.name,
        updatedAt: value?.updatedAt || ""
      };
    }
  });
  return clean;
}

function encodeJsonParam(value) {
  const clean = sanitizePortalLinks(value);
  return Object.keys(clean).length ? JSON.stringify(clean) : "";
}

function decodeJsonParam(value) {
  try {
    const parsed = JSON.parse(value || "{}");
    return sanitizePortalLinks(parsed);
  } catch (error) {
    return {};
  }
}

function encodeCompanyCareerLinksParam(value) {
  const clean = sanitizeCompanyCareerLinks(value);
  return Object.keys(clean).length ? JSON.stringify(clean) : "";
}

function decodeCompanyCareerLinksParam(value) {
  try {
    const parsed = JSON.parse(value || "{}");
    return sanitizeCompanyCareerLinks(parsed);
  } catch (error) {
    return {};
  }
}

function getDomainFromUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./i, "");
  } catch {
    return "";
  }
}

function getEntityName(entity) {
  return String(entity?.name || entity?.employerName || entity?.companyName || "Company").trim();
}

function getEntityUrl(entity) {
  if (!entity) return "";
  if (entity.id && COMPANIES.some(company => company.id === entity.id)) {
    return getCompanyCareersUrl(entity);
  }
  return entity.careersUrl || entity.careerSearchUrl || entity.url || "";
}

function getCompanyIdentity(entity) {
  const name = getEntityName(entity);
  const domain = entity?.logoDomain || getDomainFromUrl(getEntityUrl(entity));
  const initials = name
    .replace(/[^a-z0-9 ]/gi, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0].toUpperCase())
    .join("") || "CO";
  const hue = Array.from(name).reduce((sum, char) => sum + char.charCodeAt(0), 0) % 360;
  return {
    name,
    domain,
    initials,
    brandColor: `hsl(${hue} 72% 62%)`,
    logoUrl: domain ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64` : ""
  };
}

function renderCompanyLogo(entity, size = "md") {
  const identity = getCompanyIdentity(entity);
  const logo = document.createElement("span");
  logo.className = `company-logo company-logo-${size}`;
  logo.style.setProperty("--logo-color", identity.brandColor);
  logo.setAttribute("aria-hidden", "true");
  const initials = document.createElement("span");
  initials.className = "company-logo-initials";
  initials.textContent = identity.initials;
  logo.appendChild(initials);
  if (identity.logoUrl) {
    const image = document.createElement("img");
    image.src = identity.logoUrl;
    image.alt = "";
    image.loading = "lazy";
    image.addEventListener("load", () => {
      logo.classList.add("has-image");
      initials.hidden = true;
    }, { once: true });
    image.addEventListener("error", () => image.remove(), { once: true });
    logo.appendChild(image);
  }
  return logo;
}

function createCompanyIdentityHeader(entity, options = {}) {
  const header = document.createElement("div");
  header.className = "company-identity-header";
  header.appendChild(renderCompanyLogo(entity, options.logoSize || "md"));

  const copy = document.createElement("div");
  copy.className = "company-identity-copy";
  const title = document.createElement(options.level || "h3");
  title.textContent = options.title || getEntityName(entity);
  copy.appendChild(title);
  if (options.subtitle) {
    const subtitle = document.createElement("p");
    subtitle.className = "row-subtitle";
    subtitle.textContent = options.subtitle;
    copy.appendChild(subtitle);
  }
  header.appendChild(copy);

  if (options.score) {
    const score = document.createElement("div");
    score.className = "score-badge";
    score.textContent = options.score;
    header.appendChild(score);
  }

  return header;
}

function createActionGroup(label, items) {
  const group = document.createElement("div");
  group.className = "action-group";
  const heading = document.createElement("span");
  heading.className = "action-group-label";
  heading.textContent = label;
  const buttons = document.createElement("div");
  buttons.className = "action-group-buttons";
  items.filter(Boolean).forEach(item => {
    if (item.url) {
      buttons.appendChild(createCompanyActionLink(item.label, item.url));
    } else if (item.handler) {
      buttons.appendChild(createCompanyActionButton(item.label, item.handler));
    }
  });
  if (!buttons.children.length) {
    return document.createDocumentFragment();
  }
  group.append(heading, buttons);
  return group;
}

function findCompanyAction(actions, label) {
  return actions.find(action => action.label === label);
}

function createCompanyActionGroups(company, title, context, options = {}) {
  const actionItems = getCompanyActionItems(company, title, context);
  const wrap = document.createElement("div");
  wrap.className = "company-action-groups";
  wrap.append(
    createActionGroup("Primary", [
      options.includeUse ? { label: "Use", handler: () => selectCompanySuggestion(company) } : null,
      findCompanyAction(actionItems, "Careers"),
      findCompanyAction(actionItems, "LinkedIn Jobs")
    ]),
    createActionGroup("Signals", [
      findCompanyAction(actionItems, "LinkedIn Posts"),
      findCompanyAction(actionItems, "LinkedIn Recruiters"),
      findCompanyAction(actionItems, "LinkedIn Company")
    ]),
    createActionGroup("Research", [
      findCompanyAction(actionItems, "Indeed/Google"),
      findCompanyAction(actionItems, "Google Company"),
      ...actionItems.filter(action => action.custom)
    ]),
    createActionGroup("Manage", [
      { label: "Update Careers", handler: () => editCompanyCareersLink(company) },
      hasCustomCompanyCareers(company) ? { label: "Reset Careers", handler: () => resetCompanyCareersLink(company) } : null,
      { label: state.favoriteCompanies.has(company.id) ? "Unfavorite" : "Favorite", handler: () => toggleFavoriteCompanyById(company.id) },
      { label: "Open Pack", handler: () => openCompanyLinkPack(company) },
      { label: "Copy Pack", handler: () => copyCompanyLinkPack(company) },
      options.includeRemove ? { label: "Remove", handler: () => toggleFavoriteCompanyById(company.id, false) } : null
    ])
  );
  return wrap;
}

function getPillToneClass(text) {
  const value = String(text || "").toLowerCase();
  if (/review|caution|warning|unable|cannot|citizen|clearance|fee|scam/.test(value)) return "pill-review";
  if (/favorite|pinned|selected|checked/.test(value)) return "pill-favorite";
  if (/direct employer|direct\b|native clean|native filtered|native/.test(value)) return "pill-direct";
  if (/vendor|staffing|consulting/.test(value)) return "pill-vendor";
  if (/strong|top h1b|very high|tier a|apply first/.test(value)) return "pill-strong";
  if (/moderate|medium|tier b/.test(value)) return "pill-moderate";
  if (/h1b|h-1b|sponsor|opt|e-verify|work authorization/.test(value)) return "pill-sponsor";
  if (/google advanced|operator|broad search/.test(value)) return "pill-google";
  if (/minute|fresh|newest|hour|date/.test(value)) return "pill-fresh";
  if (/custom/.test(value)) return "pill-custom";
  if (/optional|noisy|remote|public/.test(value)) return "pill-muted";
  return "";
}

function updatePreviewForResult(item) {
  if (item.customPortalUrl) {
    els.queryPreview.textContent = `${item.portal.name} custom URL\n${item.customPortalTemplate || item.customPortalUrl || item.url}`;
    return;
  }
  updatePreview(item.title, item.portal, getContext());
}

function renderPortalRow(item) {
  const row = document.createElement("article");
  row.className = "portal-row";
  const health = getSourceHealth(item.portal, item.searchKind);
  row.classList.add(`source-health-${health}`);
  if (state.checked.has(item.key)) {
    row.classList.add("checked");
  }

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = state.checked.has(item.key);
  checkbox.setAttribute("aria-label", `Select ${item.portal.name}`);
  checkbox.addEventListener("change", () => {
    if (checkbox.checked) {
      state.checked.add(item.key);
      row.classList.add("checked");
    } else {
      state.checked.delete(item.key);
      row.classList.remove("checked");
    }
    updateCounts();
    savePreferences();
  });

  const body = document.createElement("div");
  body.className = "portal-body";

  const link = document.createElement("a");
  link.href = item.url;
  link.target = "_blank";
  link.rel = "noopener";
  link.className = "portal-link";
  link.textContent = item.portal.name;
  link.addEventListener("focus", () => updatePreviewForResult(item));
  link.addEventListener("mouseenter", () => updatePreviewForResult(item));
  link.addEventListener("click", () => {
    if (!state.checked.has(item.key)) {
      state.checked.add(item.key);
      checkbox.checked = true;
      row.classList.add("checked");
      updateCounts();
      savePreferences();
    }
  });

  const summary = document.createElement("p");
  summary.className = "portal-summary";
  summary.textContent = item.portal.note || getPortalScopeLabel(item.portal);

  const meta = document.createElement("div");
  meta.className = "portal-meta";
  meta.append(createPill(CATEGORY_LABELS[item.portal.category] || item.portal.category));
  meta.append(createPill(getPortalScopeLabel(item.portal)));
  meta.append(createPill(getSourceHealthLabel(health), `health-${health}`));
  meta.append(createPill(getQueryModeLabel(item, getContext()), "query-mode-pill"));
  meta.append(createPill(item.searchKind));
  meta.append(createPill(`Fit ${item.opportunityScore || 0}`, "score-pill"));
  if (item.freshnessLabel) {
    meta.append(createPill(item.freshnessLabel));
  }
  (item.badges || []).forEach(badge => meta.append(createPill(badge, "source-badge")));
  (item.portal.tags || []).forEach(tag => meta.append(createPill(tag)));

  body.append(link, summary, meta);

  const actions = document.createElement("div");
  actions.className = "portal-actions";

  const pinButton = document.createElement("button");
  pinButton.type = "button";
  pinButton.className = "copy-button";
  pinButton.textContent = item.portal.noPin ? (item.customPortalSourceId ? "Edit Links" : "Update") : state.pinnedPortals.has(item.portal.id) ? "Unpin" : "Pin";
  if (item.portal.noPin) {
    pinButton.addEventListener("click", () => {
      if (item.customPortalSourceId) {
        editPortalCustomLink(item.customPortalSourceId);
      } else {
        els.customSourceUrl.focus();
        els.customSourceUrl.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    });
  } else {
    pinButton.addEventListener("click", () => togglePinnedPortal(item.portal.id));
  }

  const copyButton = document.createElement("button");
  copyButton.type = "button";
  copyButton.className = "copy-button";
  copyButton.textContent = "Copy";
  copyButton.addEventListener("click", () => copyLinks([item.url], `Copied ${item.portal.name}`));

  const updateButton = document.createElement("button");
  updateButton.type = "button";
  updateButton.className = "copy-button";
  updateButton.textContent = item.portal.noPin ? (item.customPortalSourceId ? "Edit Link" : "Update") : item.customPortalUrl ? "Edit Link" : "Update Link";
  updateButton.addEventListener("click", () => {
    if (item.portal.noPin) {
      if (item.customPortalSourceId) {
        editPortalCustomLink(item.customPortalSourceId);
      } else {
        els.customSourceUrl.focus();
        els.customSourceUrl.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    } else {
      editPortalCustomLink(item.portal.id);
    }
  });

  actions.append(pinButton, updateButton);
  if (item.customPortalUrl) {
    const resetButton = document.createElement("button");
    resetButton.type = "button";
    resetButton.className = "copy-button subtle-button";
    resetButton.textContent = "Reset";
    resetButton.addEventListener("click", () => resetPortalCustomLink(item.customPortalSourceId || item.portal.id));
    actions.appendChild(resetButton);
  }
  actions.appendChild(copyButton);
  row.append(checkbox, body, actions);
  return row;
}

function getPortalScopeLabel(portal) {
  const capability = getSourceCapability(portal);
  if (capability) {
    return capability.label;
  }
  return "Broad search";
}

function getSearchKind(portal) {
  const capability = getSourceCapability(portal);
  return capability ? capability.kind : SOURCE_CAPABILITIES.operator.kind;
}

function getPortalFreshnessLabel(portal, context) {
  if (!context || !context.time || context.time === "all") {
    return "";
  }
  if (MINUTE_SIGNAL_TIMES.has(context.time)) {
    if (portal.native === "linkedinJobs") {
      return "native last hour";
    }
    if (portal.native === "google" || portal.rawSiteQuery || canUseGoogleAdvancedSiteSearch(portal)) {
      return "minute signals";
    }
    if (["indeed", "glassdoor", "ziprecruiter", "dice"].includes(portal.native)) {
      return "newest native window";
    }
    if (portal.native === "linkedinPosts") {
      return "newest posts";
    }
    return "freshness assisted";
  }
  if (["1hour", "2hours", "3hours", "4hours", "6hours", "8hours", "12hours"].includes(context.time)) {
    if (portal.native === "linkedinJobs") {
      return "native hour filter";
    }
    if (portal.native === "google" || portal.rawSiteQuery || canUseGoogleAdvancedSiteSearch(portal)) {
      return "search date tools";
    }
    if (["indeed", "glassdoor", "ziprecruiter", "dice"].includes(portal.native)) {
      return "nearest native date";
    }
  }
  return "";
}

function getSourceBadges(portal, context, searchKind, hasCustomPortalLink = false) {
  const badges = [];
  const capability = getSourceCapability(portal);
  const tagText = (portal.tags || []).join(" ").toLowerCase();

  if (hasCustomPortalLink) {
    badges.push("custom board link");
  }
  if (portal.native && capability && capability.kind === "native-filtered") {
    badges.push("native clean");
  }
  if (portal.native === "google" || portal.rawSiteQuery || canUseGoogleAdvancedSiteSearch(portal)) {
    badges.push("Google advanced");
  }
  if (portal.category === "direct" || portal.category === "company" || portal.id === "directATS" || /\bats\b|direct apply/.test(tagText)) {
    badges.push("direct apply");
  }
  if (MINUTE_SIGNAL_TIMES.has(context.time) || context.time === "1hour" || context.precision === "minuteRadar") {
    badges.push("minute signal");
  }
  if (context.authorization !== "none" || portal.category === "research" || /h-1b|sponsor|opt|e-verify/.test(tagText)) {
    badges.push("OPT research");
  }
  if (["extraAts", "remoteBoards", "publicBoards", "research"].includes(portal.category) || /optional|remote-only|senior/.test(tagText)) {
    badges.push("optional/noisy");
  }
  if (searchKind === "custom-link") {
    badges.push("custom");
  }

  return mergeUnique([], badges);
}

function getSourceHealth(portal, searchKind = "") {
  if (searchKind === "custom-link" || portal.noPin) {
    return "custom";
  }
  if (portal.native === "google" || portal.rawSiteQuery || canUseGoogleAdvancedSiteSearch(portal)) {
    return "google";
  }
  if (portal.native && getSourceCapability(portal)?.kind === "native-filtered") {
    return "native";
  }
  if (["extraAts", "remoteBoards", "publicBoards", "research"].includes(portal.category)) {
    return "optional";
  }
  return "broad";
}

function getSourceHealthLabel(health) {
  return {
    native: "native clean",
    google: "Google advanced",
    broad: "broad search",
    optional: "optional/noisy",
    custom: "custom"
  }[health] || "source";
}

function getQueryModeLabel(item, context) {
  if (item.searchKind === "custom-link" || item.customPortalUrl) {
    return "Custom";
  }
  if (item.portal.native && item.portal.native !== "google" && item.portal.native !== "static") {
    return "Compact native";
  }
  if (context.queryStyle === "broad") {
    return "Broad Boolean";
  }
  if (context.queryStyle === "compact") {
    return "Compact title";
  }
  if (context.queryStyle === "custom") {
    return "Custom";
  }
  return "Balanced smart";
}

function getOpportunityFitScore(portal, context, searchKind, freshnessLabel) {
  const tagText = (portal.tags || []).join(" ").toLowerCase();
  const priorityScore = Math.min(35, Math.max(12, Math.round((portal.priority || 50) / 3)));
  let score = priorityScore;

  if (portal.category === "top") {
    score += 4;
  }
  if (["linkedinJobs", "indeed", "directATS", "linkedinPosts", "google", "simplify", "hiringCafe", "builtin", "dice", "getwork", "glassdoor", "ziprecruiter"].includes(portal.id)) {
    score += 22;
  }
  if (freshnessLabel || ["linkedinJobs", "indeed", "google", "glassdoor", "ziprecruiter", "dice"].includes(portal.native)) {
    score += 16;
  }
  if (portal.category === "direct" || portal.category === "company" || portal.id === "directATS" || /\bats\b|direct apply/.test(tagText)) {
    score += 14;
  }
  if (context.experience === "entry" && (["top", "general", "tech", "signals"].includes(portal.category) || /student|new grad|early career/.test(tagText))) {
    score += 8;
  }
  if (context.authorization !== "none" || portal.category === "research" || /h-1b|sponsor|opt|e-verify/.test(tagText)) {
    score += 6;
  }
  if (searchKind === "custom-link") {
    score += 10;
  }
  if (["extraAts", "remoteBoards", "publicBoards", "research"].includes(portal.category) || /optional|remote-only|senior/.test(tagText)) {
    score -= 8;
  }

  return Math.min(100, Math.max(15, score));
}

function getSourceCapability(portal) {
  if (portal.native && SOURCE_CAPABILITIES[portal.native]) {
    return SOURCE_CAPABILITIES[portal.native];
  }
  if (portal.native) {
    return SOURCE_CAPABILITIES.native;
  }
  if (portal.rawSiteQuery || portal.sites) {
    return SOURCE_CAPABILITIES.operator;
  }
  return null;
}

function createPill(text, className = "") {
  const pill = document.createElement("span");
  const tone = className || getPillToneClass(text);
  pill.className = tone ? `pill ${tone}` : "pill";
  pill.textContent = text;
  return pill;
}

function getSearchTitles() {
  const typed = parseTitles(els.jobTitle.value);
  if (typed.length) {
    return typed;
  }
  const pack = getRolePack(els.rolePackSelect.value);
  return [pack.primary];
}

function getRolePack(id) {
  return ROLE_PACKS.find(pack => pack.id === id) || ROLE_PACKS[0];
}

function parseTitles(input) {
  return input
    .split(/[,;\n]/)
    .map(item => smartTitleCase(item.trim()))
    .filter(Boolean)
    .filter((item, index, items) => items.indexOf(item) === index);
}

function smartTitleCase(value) {
  return value
    .replace(/\s+/g, " ")
    .split(" ")
    .map(word => {
      const clean = word.replace(/[^a-zA-Z&]/g, "").toUpperCase();
      if (ACRONYMS.has(clean)) {
        return clean;
      }
      if (word.includes("-")) {
        return word.split("-").map(smartTitleCase).join("-");
      }
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(" ");
}

function getContext() {
  return {
    profile: els.profileSelect.value,
    rolePack: els.rolePackSelect.value,
    precision: getPrecisionFromProfile(els.profileSelect.value),
    engine: els.engineSelect.value,
    time: els.timeFilter.value,
    location: els.locationSelect.value,
    sort: els.sortSelect.value,
    remoteMode: els.remoteMode.value,
    matchMode: els.matchMode.value,
    queryStyle: els.queryStyleSelect.value,
    customQuery: els.customQuery.value.trim(),
    hasTypedTitle: parseTitles(els.jobTitle.value).length > 0,
    experience: els.experienceSelect.value,
    employment: els.employmentSelect.value,
    authorization: els.authorizationSelect.value,
    includeTerms: parseTermList(els.includeTerms.value),
    excludeTerms: parseTermList(els.excludeTerms.value),
    cautionExcludes: els.cautionExcludes.checked,
    strictTitle: els.strictTitle.checked
  };
}

function getPrecisionFromProfile(profileId) {
  const profile = SEARCH_PROFILES.find(item => item.id === profileId) || SEARCH_PROFILES[0];
  return profile.defaults.precision || "coverage";
}

function parseTermList(value) {
  return value
    .split(",")
    .map(term => term.trim())
    .filter(Boolean);
}

function getSelectedPortals() {
  const profile = SEARCH_PROFILES.find(item => item.id === els.profileSelect.value);
  if (profile && Array.isArray(profile.portals)) {
    return profile.portals
      .map(id => PORTALS.find(portal => portal.id === id))
      .filter(Boolean);
  }
  const selectedCategories = getSelectedCategories();
  return sortPortals(PORTALS.filter(portal => selectedCategories.has(portal.category)), els.sortSelect.value);
}

function getSelectedCategories() {
  const selected = new Set();
  els.categoryFilters.querySelectorAll("input:checked").forEach(input => selected.add(input.value));
  return selected;
}

function sortPortals(portals, sortMode) {
  const categoryBoost = {
    top: 140,
    direct: 130,
    extraAts: 70,
    signals: 120,
    general: 110,
    moreBoards: 105,
    tech: 100,
    remoteBoards: 55,
    publicBoards: 45,
    company: 90,
    highered: 80,
    research: 40
  };

  const score = portal => {
    const base = portal.priority * 10 + (categoryBoost[portal.category] || 0);
    const pinnedBoost = state.pinnedPortals.has(portal.id) ? 1200 : 0;
    if (sortMode === "latest") {
      const latestBoost = ["linkedinJobs", "indeed", "linkedinPosts", "google", "directATS", "glassdoor", "ziprecruiter", "dice", "getwork", "simplyhired", "talentCom"].includes(portal.id) ? 600 : 0;
      return base + latestBoost + pinnedBoost;
    }
    if (sortMode === "direct") {
      const directBoost = portal.category === "direct" ? 700 : portal.category === "company" ? 450 : 0;
      return base + directBoost + pinnedBoost;
    }
    if (sortMode === "coverage") {
      const coverageBoost = ["top", "general", "moreBoards", "tech", "company"].includes(portal.category) ? 450 : 0;
      return base + coverageBoost + pinnedBoost;
    }
    return base + pinnedBoost;
  };

  return [...portals].sort((a, b) => score(b) - score(a) || a.order - b.order);
}

function updateCounts() {
  const selectedPortals = getSelectedPortals();
  const customSourceCount = getCustomSourceTemplates().length;
  els.portalCount.textContent = String(selectedPortals.length + customSourceCount);
  els.checkedCount.textContent = String(state.checked.size);
  const hasResults = state.results.length > 0;
  syncBatchControls();
  els.copyAllButton.disabled = !hasResults;
  els.copyCheckedButton.disabled = state.checked.size === 0;
  els.shareButton.disabled = !hasResults;
  els.resultMeta.textContent = hasResults
    ? `${state.results.length} links across ${selectedPortals.length + customSourceCount} sources - ${getActiveFilterSummary(getContext())}`
    : "Ready";
  renderPinnedOperators();
}

function togglePinnedPortal(portalId) {
  if (state.pinnedPortals.has(portalId)) {
    state.pinnedPortals.delete(portalId);
  } else {
    state.pinnedPortals.add(portalId);
  }
  savePreferences({ replaceProtectedVault: true });
  renderPinnedOperators();
  if (hasJobTitle()) {
    generateResults();
  } else {
    updatePreviewForEmptyState();
    updateAddressBar(getSearchTitles(), getContext(), "replace");
  }
}

function renderPinnedOperators() {
  els.pinnedOperators.innerHTML = "";
  const pinned = PORTALS.filter(portal => state.pinnedPortals.has(portal.id));
  els.pinnedBlock.hidden = pinned.length === 0;
  pinned.forEach(portal => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "tag-button";
    button.dataset.pinRemove = portal.id;
    button.textContent = `${portal.name} - remove`;
    els.pinnedOperators.appendChild(button);
  });
}

function copyPinSyncLink() {
  savePreferences();
  updateAddressBar(getSearchTitles(), getContext());
  copyLinks([window.location.href], "Copied permanent pin sync link");
}

function copyPortableSyncLink() {
  savePreferences();
  updateAddressBar(getSearchTitles(), getContext());
  copyLinks([window.location.href], "Copied permanent sync link");
}

function setEmptyState(show) {
  els.emptyState.hidden = !show;
  els.results.hidden = show;
  if (show) {
    els.relatedBlock.hidden = true;
    els.resultMeta.textContent = "Ready";
  }
}

function updatePreviewForEmptyState() {
  const context = getContext();
  els.queryPreview.textContent = [
    PROFILE_LABELS[context.profile],
    ROLE_PACK_LABELS[context.rolePack],
    FILTER_LABELS.precision[context.precision],
    FILTER_LABELS.queryStyle[context.queryStyle],
    getActiveCustomQuery(context) ? `Custom: ${context.customQuery}` : "",
    FILTER_LABELS.authorization[context.authorization],
    FILTER_LABELS.sort[context.sort],
    getLocationLabel(context.location)
  ].filter(Boolean).join("\n");
}

function updatePreview(title, portal, context) {
  if (!portal) {
    updatePreviewForEmptyState();
    return;
  }
  els.queryPreview.textContent = [
    `${portal.name} - ${getPreviewModeForPortal(portal, context)}`,
    getPreviewQueryForPortal(title, portal, context),
    "",
    getPreviewExplainerForPortal(portal, context)
  ].filter(Boolean).join("\n");
}

function getPreviewModeForPortal(portal, context) {
  if (portal.native && portal.native !== "google" && portal.native !== "static") {
    return "Compact native query";
  }
  if (portal.native === "google" || portal.rawSiteQuery || canUseGoogleAdvancedSiteSearch(portal)) {
    return context.queryStyle === "broad" ? "Google advanced Boolean" : "Google advanced balanced";
  }
  return FILTER_LABELS.queryStyle[context.queryStyle] || "Balanced smart";
}

function getPreviewQueryForPortal(title, portal, context) {
  if (portal.native && portal.native !== "google" && portal.native !== "static") {
    return buildBoardKeywordQuery(title, context, { includeAuthorization: true });
  }
  if (portal.native === "google") {
    return buildGoogleStructuredQuery(title, context, { includeJobTerms: true });
  }
  return buildPortalQuery(title, portal, context);
}

function getPreviewExplainerForPortal(portal, context) {
  if (portal.native && portal.native !== "google" && portal.native !== "static") {
    return "Native boards stay compact so LinkedIn, Indeed, Dice, Glassdoor, and similar search boxes do not misread Google operators.";
  }
  if (portal.native === "google" || portal.rawSiteQuery || canUseGoogleAdvancedSiteSearch(portal)) {
    return "Google/operator sources can safely use Boolean, site/domain targeting, freshness signals, and advanced search parameters.";
  }
  return `Current mode: ${FILTER_LABELS.queryStyle[context.queryStyle] || context.queryStyle}.`;
}

function updateRelatedTitles(title) {
  const related = findRelatedTitles(title);
  els.relatedTitles.innerHTML = "";
  els.relatedBlock.hidden = related.length === 0;

  related.forEach(item => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "tag-button";
    button.textContent = item;
    button.addEventListener("click", () => {
      els.jobTitle.value = item;
      generateResults();
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
    els.relatedTitles.appendChild(button);
  });
}

function findRelatedTitles(title) {
  const normalized = title.toLowerCase();
  const group = RELATED_TITLE_GROUPS.find(items => items.some(item => item.toLowerCase() === normalized));
  return group ? group.filter(item => item.toLowerCase() !== normalized) : [];
}

function buildPortalQuery(title, portal, context) {
  if (portal.native === "static") {
    return `${title} ${portal.name}`;
  }

  const parts = [
    buildTitleExpression(title, context),
    buildSiteExpression(portal),
    getLocationQuery(context.location),
    getWorkSettingQuery(context.remoteMode),
    getExperienceQuery(context.experience),
    getEmploymentQuery(context.employment),
    getAuthorizationQuery(context.authorization),
    getFreshPostingSignalQuery(context.time),
    buildIncludeQuery(context.includeTerms),
    buildExcludeQuery([...context.excludeTerms, ...getCautionExcludes(context)])
  ].filter(Boolean);

  return parts.join(" ");
}

function buildGoogleStructuredQuery(title, context, options = {}) {
  return [
    buildTitleExpression(title, context),
    options.includeJobTerms ? "(job OR jobs OR careers OR hiring)" : "",
    getLocationQuery(context.location),
    getWorkSettingQuery(context.remoteMode),
    getExperienceQuery(context.experience),
    getEmploymentQuery(context.employment),
    getAuthorizationQuery(context.authorization),
    getFreshPostingSignalQuery(context.time),
    buildIncludeQuery(context.includeTerms),
    buildExcludeQuery([...context.excludeTerms, ...getCautionExcludes(context)])
  ].filter(Boolean).join(" ");
}

function buildTitleExpression(title, context) {
  const custom = getActiveCustomQuery(context);
  if (custom) {
    return custom;
  }

  let expression;
  if (context.matchMode === "exact") {
    expression = quoteTerm(title);
  } else if (!context.hasTypedTitle) {
    expression = getRolePackSearchExpression(getRolePack(context.rolePack), context);
  } else {
    const related = findTitleGroup(title);
    if (context.queryStyle === "compact") {
      expression = quoteTerm(title);
    } else if (context.queryStyle === "broad") {
      expression = `(${related.map(quoteTerm).join(" OR ")})`;
    } else {
      expression = `(${related.slice(0, 3).map(quoteTerm).join(" OR ")})`;
    }
  }
  return applyStrictTitle(expression, context);
}

function getActiveCustomQuery(context) {
  return context.queryStyle === "custom" ? String(context.customQuery || "").trim() : "";
}

function getRolePackSearchExpression(pack, context) {
  if (!pack) {
    return "";
  }
  if (context.queryStyle === "compact") {
    return pack.compactQuery || quoteTerm(pack.primary);
  }
  if (context.queryStyle === "broad") {
    return pack.query || pack.balancedQuery || pack.compactQuery || quoteTerm(pack.primary);
  }
  return pack.balancedQuery || pack.compactQuery || pack.query || quoteTerm(pack.primary);
}

// Opt-in precision: rewrite quoted titles as intitle:"..." so search-engine
// results must carry the role in the page title. Off by default so nothing
// is trimmed unless the user explicitly asks for it. Only used in operator
// queries; native portal URLs use buildNativeTitleQuery and are unaffected.
function applyStrictTitle(expression, context) {
  if (!context.strictTitle) {
    return expression;
  }
  return expression.replace(/"([^"]+)"/g, 'intitle:"$1"');
}

function findTitleGroup(title) {
  const normalized = title.toLowerCase();
  return RELATED_TITLE_GROUPS.find(items => items.some(item => item.toLowerCase() === normalized)) || [title];
}

function buildSiteExpression(portal) {
  if (portal.native === "google") {
    return "(job OR jobs OR careers OR hiring)";
  }
  if (portal.rawSiteQuery) {
    return portal.rawSiteQuery;
  }
  if (!portal.sites || !portal.sites.length) {
    return "";
  }
  if (portal.sites.length === 1) {
    return `site:${portal.sites[0]}`;
  }
  return `(${portal.sites.map(site => `site:${site}`).join(" OR ")})`;
}

function getLocationQuery(value) {
  const match = LOCATIONS.find(item => item[0] === value);
  return match ? match[2] : LOCATIONS[0][2];
}

function getLocationLabel(value) {
  const match = LOCATIONS.find(item => item[0] === value);
  return match ? match[1] : "United States";
}

function getNativeLocation(value) {
  const match = LOCATIONS.find(item => item[0] === value);
  return match ? match[3] : "United States";
}

function getWorkSettingQuery(mode) {
  switch (mode) {
    case "onsite-hybrid":
      return '(onsite OR "on-site" OR hybrid OR "in office") -remote';
    case "hybrid":
      return '(hybrid OR "hybrid remote")';
    case "onsite":
      return '(onsite OR "on-site" OR "in office") -remote';
    case "only":
      return '(remote OR "work from home" OR "work from anywhere")';
    case "exclude":
      return '-remote -"work from home" -"work from anywhere"';
    default:
      return "";
  }
}

function getExperienceQuery(value) {
  switch (value) {
    case "entry":
      return '("entry level" OR junior OR "new grad" OR "university graduate" OR "0-2 years" OR "early career")';
    case "mid":
      return '("mid level" OR "2+ years" OR "3+ years" OR associate) -senior -principal';
    case "senior":
      return '(senior OR lead OR staff OR principal OR "5+ years")';
    case "manager":
      return '(manager OR director OR "team lead" OR head)';
    case "internship":
      return '(intern OR internship OR co-op)';
    default:
      return "";
  }
}

function getCautionExcludes(context) {
  return context.cautionExcludes ? CAUTION_EXCLUDE_TERMS : [];
}

function getEmploymentQuery(value) {
  switch (value) {
    case "fulltime":
      return '("full-time" OR "full time" OR FTE)';
    case "contract":
      return '(contract OR contractor OR "contract-to-hire" OR C2H)';
    case "parttime":
      return '("part-time" OR "part time")';
    case "internship":
      return '(internship OR intern OR co-op)';
    default:
      return "";
  }
}

function getAuthorizationQuery(value) {
  switch (value) {
    case "optBroad":
      return '("OPT" OR "STEM OPT" OR "F-1" OR "E-Verify" OR "visa sponsorship" OR "H-1B" OR "work authorization" OR "authorized to work in the United States")';
    case "currentAuthorized":
      return '("authorized to work in the United States" OR "legally authorized" OR "work authorization" OR "US work authorization")';
    case "sponsorNeeded":
      return '("visa sponsorship" OR "H-1B sponsorship" OR "will sponsor" OR "sponsorship available" OR "OPT" OR "STEM OPT") -"unable to sponsor" -"no sponsorship" -"will not sponsor" -"cannot sponsor"';
    case "everify":
      return '("E-Verify" OR "e verify")';
    case "optStrict":
      return '("OPT" OR "STEM OPT" OR "F-1 OPT" OR "CPT")';
    default:
      return "";
  }
}

function getFreshPostingSignalQuery(time) {
  if (!MINUTE_SIGNAL_TIMES.has(time)) {
    return "";
  }
  const minuteMap = {
    "5minutes": '"5 minutes ago"',
    "10minutes": '"10 minutes ago"',
    "15minutes": '"15 minutes ago"',
    "30minutes": '"30 minutes ago"',
    "45minutes": '"45 minutes ago"'
  };
  return `(${[minuteMap[time], '"minutes ago"', '"minute ago"', '"just posted"', '"newly posted"', '"posted today"'].filter(Boolean).join(" OR ")})`;
}

function buildIncludeQuery(terms) {
  return terms.map(formatTerm).join(" ");
}

function buildExcludeQuery(terms) {
  return terms.map(term => `-${formatTerm(term)}`).join(" ");
}

function formatTerm(term) {
  const cleaned = term.trim();
  if (!cleaned) {
    return "";
  }
  if (/^[-+()"]/.test(cleaned) || /\bOR\b/i.test(cleaned)) {
    return cleaned;
  }
  return cleaned.includes(" ") ? quoteTerm(cleaned) : cleaned;
}

function quoteTerm(term) {
  return `"${term.replace(/"/g, "").trim()}"`;
}

function buildSearchUrl(portal, query, title, context) {
  switch (portal.native) {
    case "linkedinJobs":
      return buildLinkedInJobsUrl(title, context);
    case "linkedinPosts":
      return buildLinkedInPostsUrl(title, context);
    case "indeed":
      return buildIndeedUrl(title, context);
    case "google":
      return buildGoogleUrl(buildGoogleStructuredQuery(title, context, { includeJobTerms: true }), context.time, context.sort);
    case "glassdoor": {
      const params = new URLSearchParams();
      params.set("sc.keyword", buildBoardKeywordQuery(title, context, { includeAuthorization: true }));
      params.set("locKeyword", getNativeLocation(context.location));
      const fromAge = getGlassdoorFromAge(context.time);
      if (fromAge) {
        params.set("fromAge", fromAge);
      }
      return `https://www.glassdoor.com/Job/jobs.htm?${params.toString()}`;
    }
    case "ziprecruiter": {
      const params = new URLSearchParams();
      params.set("search", buildBoardKeywordQuery(title, context, { includeAuthorization: true }));
      params.set("location", getNativeLocation(context.location));
      const days = getZipRecruiterDays(context.time);
      if (days) {
        params.set("days", days);
      }
      return `https://www.ziprecruiter.com/jobs-search?${params.toString()}`;
    }
    case "dice": {
      const params = new URLSearchParams();
      params.set("q", buildBoardKeywordQuery(title, context, { includeAuthorization: true }));
      params.set("location", getNativeLocation(context.location));
      const posted = getDicePostedDate(context.time);
      if (posted) {
        params.set("filters.postedDate", posted);
      }
      return `https://www.dice.com/jobs?${params.toString()}`;
    }
    case "builtin":
      return `https://builtin.com/jobs?search=${encodeURIComponent(buildBoardKeywordQuery(title, context))}&location=${encodeURIComponent(getNativeLocation(context.location))}`;
    case "simplify":
      return `https://simplify.jobs/jobs?query=${encodeURIComponent(buildBoardKeywordQuery(title, context))}`;
    case "yc":
      return `https://www.ycombinator.com/jobs?query=${encodeURIComponent(buildBoardTitleQuery(title, context))}`;
    case "levels":
      return `https://www.levels.fyi/jobs/?searchText=${encodeURIComponent(buildBoardTitleQuery(title, context))}`;
    case "welcome":
      return `https://www.welcometothejungle.com/en/jobs?query=${encodeURIComponent(buildBoardTitleQuery(title, context))}`;
    case "monster":
      return `https://www.monster.com/jobs/search?q=${encodeURIComponent(buildBoardKeywordQuery(title, context))}&where=${encodeURIComponent(getNativeLocation(context.location))}`;
    case "careerbuilder":
      return `https://www.careerbuilder.com/jobs?keywords=${encodeURIComponent(buildBoardKeywordQuery(title, context))}&location=${encodeURIComponent(getNativeLocation(context.location))}`;
    case "flexjobs": {
      const params = new URLSearchParams();
      params.set("search", buildBoardKeywordQuery(title, context, { includeAuthorization: true }));
      params.set("location", getNativeLocation(context.location));
      return `https://www.flexjobs.com/search?${params.toString()}`;
    }
    case "getwork": {
      const params = new URLSearchParams();
      params.set("query", buildBoardKeywordQuery(title, context, { includeAuthorization: true }));
      params.set("location", getNativeLocation(context.location));
      return `https://getwork.com/search/results?${params.toString()}`;
    }
    case "simplyhired": {
      const params = new URLSearchParams();
      params.set("q", buildBoardKeywordQuery(title, context, { includeAuthorization: true }));
      params.set("l", getNativeLocation(context.location));
      return `https://www.simplyhired.com/search?${params.toString()}`;
    }
    case "talentCom": {
      const params = new URLSearchParams();
      params.set("k", buildBoardKeywordQuery(title, context, { includeAuthorization: true }));
      params.set("l", getNativeLocation(context.location));
      return `https://www.talent.com/jobs?${params.toString()}`;
    }
    case "theMuse": {
      const params = new URLSearchParams();
      params.set("keyword", buildBoardKeywordQuery(title, context, { includeAuthorization: true }));
      params.set("location", getNativeLocation(context.location));
      return `https://www.themuse.com/search?${params.toString()}`;
    }
    case "adzuna": {
      const params = new URLSearchParams();
      params.set("what", buildBoardKeywordQuery(title, context, { includeAuthorization: true }));
      params.set("where", getNativeLocation(context.location));
      return `https://www.adzuna.com/search?${params.toString()}`;
    }
    case "jora": {
      const params = new URLSearchParams();
      params.set("q", buildBoardKeywordQuery(title, context, { includeAuthorization: true }));
      params.set("l", getNativeLocation(context.location));
      return `https://us.jora.com/jobs?${params.toString()}`;
    }
    case "jooble": {
      const params = new URLSearchParams();
      params.set("ukw", buildBoardKeywordQuery(title, context, { includeAuthorization: true }));
      params.set("rgns", getNativeLocation(context.location));
      return `https://jooble.org/SearchResult?${params.toString()}`;
    }
    case "nexxt": {
      const params = new URLSearchParams();
      params.set("keyword", buildBoardKeywordQuery(title, context, { includeAuthorization: true }));
      params.set("location", getNativeLocation(context.location));
      return `https://www.nexxt.com/jobs/search?${params.toString()}`;
    }
    case "snagajob": {
      const params = new URLSearchParams();
      params.set("q", buildBoardKeywordQuery(title, context, { includeAuthorization: true }));
      params.set("w", getNativeLocation(context.location));
      return `https://www.snagajob.com/search?${params.toString()}`;
    }
    case "ladders": {
      const params = new URLSearchParams();
      params.set("keywords", buildBoardKeywordQuery(title, context, { includeAuthorization: true }));
      params.set("location", getNativeLocation(context.location));
      return `https://www.theladders.com/jobs/search-jobs?${params.toString()}`;
    }
    case "startupJobs": {
      const params = new URLSearchParams();
      params.set("q", buildBoardTitleQuery(title, context));
      params.set("loc", getNativeLocation(context.location));
      return `https://startup.jobs/?${params.toString()}`;
    }
    case "weworkremotely":
      return `https://weworkremotely.com/remote-jobs/search?term=${encodeURIComponent(buildBoardTitleQuery(title, context))}`;
    case "remotive":
      return `https://remotive.com/remote-jobs/search?search=${encodeURIComponent(buildBoardTitleQuery(title, context))}`;
    case "usajobs": {
      const params = new URLSearchParams();
      params.set("k", buildBoardKeywordQuery(title, context, { includeAuthorization: true }));
      params.set("l", getNativeLocation(context.location));
      if (context.sort === "latest") {
        params.set("sort", "date");
      }
      return `https://www.usajobs.gov/Search/Results?${params.toString()}`;
    }
    case "governmentJobs": {
      const params = new URLSearchParams();
      params.set("keyword", buildBoardKeywordQuery(title, context, { includeAuthorization: true }));
      params.set("location", getNativeLocation(context.location));
      return `https://www.governmentjobs.com/jobs?${params.toString()}`;
    }
    case "static":
      return portal.url;
    default:
      if (context.engine === "google" && canUseGoogleAdvancedSiteSearch(portal)) {
        return buildGoogleUrl(buildGoogleStructuredQuery(title, context), context.time, context.sort, { siteSearch: portal.sites[0] });
      }
      return buildSearchEngineUrl(context.engine, query, context.time, context.sort);
  }
}

function canUseGoogleAdvancedSiteSearch(portal) {
  return !portal.native && !portal.rawSiteQuery && Array.isArray(portal.sites) && portal.sites.length === 1;
}

function buildNativeKeywordQuery(title, context) {
  const parts = [buildNativeTitleQuery(title, context), ...context.includeTerms];
  const auth = getNativeAuthorizationSuffix(context.authorization);
  if (auth) {
    parts.push(auth);
  }
  [...context.excludeTerms, ...getCautionExcludes(context)].forEach(term => parts.push(`-${formatTerm(term)}`));
  return parts.filter(Boolean).join(" ");
}

function buildNativeTitleQuery(title, context) {
  const custom = getActiveCustomQuery(context);
  if (custom) {
    return custom;
  }
  if (context.matchMode === "exact") {
    return title;
  }
  // Native job-board search boxes often misread Google-style Boolean strings.
  // Keep them simple unless the user explicitly chooses Custom query.
  if (context.hasTypedTitle) {
    return title;
  }
  if (!context.hasTypedTitle) {
    const pack = getRolePack(context.rolePack);
    return pack.primary || title;
  }
  return title;
}

function buildBoardKeywordQuery(title, context, options = {}) {
  const parts = [buildBoardTitleQuery(title, context), ...context.includeTerms];
  if (options.includeAuthorization) {
    const auth = getBoardAuthorizationSuffix(context.authorization);
    if (auth) {
      parts.push(auth);
    }
  }
  return parts.filter(Boolean).join(" ");
}

function buildBoardTitleQuery(title, context) {
  const custom = getActiveCustomQuery(context);
  if (custom) {
    return custom;
  }
  if (context.matchMode === "exact" || context.hasTypedTitle) {
    return title;
  }
  const pack = getRolePack(context.rolePack);
  return pack.primary || title;
}

function getNativeAuthorizationSuffix(value) {
  switch (value) {
    case "optBroad":
      return "OPT OR STEM OPT OR sponsorship OR E-Verify";
    case "currentAuthorized":
      return "authorized to work in the United States";
    case "sponsorNeeded":
      return "visa sponsorship OR H-1B sponsorship";
    case "everify":
      return "E-Verify";
    case "optStrict":
      return "OPT OR STEM OPT OR F-1 OPT";
    default:
      return "";
  }
}

function getBoardAuthorizationSuffix(value) {
  switch (value) {
    case "optBroad":
      return "OPT sponsorship E-Verify";
    case "currentAuthorized":
      return "authorized to work";
    case "sponsorNeeded":
      return "visa sponsorship";
    case "everify":
      return "E-Verify";
    case "optStrict":
      return "OPT STEM OPT";
    default:
      return "";
  }
}

function buildLinkedInJobsUrl(title, context) {
  const params = new URLSearchParams();
  params.set("keywords", buildNativeKeywordQuery(title, context));
  params.set("geoId", "103644278");
  params.set("location", getNativeLocation(context.location));
  params.set("origin", "JOB_SEARCH_PAGE_SEARCH_BUTTON");
  params.set("refresh", "true");
  params.set("sortBy", context.sort === "latest" ? "DD" : "R");
  params.set("spellCorrectionEnabled", "true");

  const timeParam = getLinkedInTimeParam(context.time);
  if (timeParam) {
    params.set("f_TPR", timeParam);
  }
  const experience = getLinkedInExperienceParam(context.experience);
  if (experience) {
    params.set("f_E", experience);
  }
  const jobType = getLinkedInJobTypeParam(context.employment);
  if (jobType) {
    params.set("f_JT", jobType);
  }
  const workType = getLinkedInWorkTypeParam(context.remoteMode, context.location);
  if (workType) {
    params.set("f_WT", workType);
  }
  const functionParam = getLinkedInFunctionParam(title, context);
  if (functionParam) {
    params.set("f_F", functionParam);
  }

  return `https://www.linkedin.com/jobs/search/?${params.toString()}`;
}

function buildLinkedInPostsUrl(title, context) {
  const keywords = [
    '"hiring"',
    buildLinkedInPostTitleQuery(title, context),
    context.authorization === "sponsorNeeded" ? '"visa sponsorship"' : "",
    context.authorization === "optBroad" || context.authorization === "optStrict" ? '"OPT"' : "",
    ...context.includeTerms.map(formatTerm),
    getLocationLabel(context.location)
  ].filter(Boolean).join(" ");

  const params = new URLSearchParams();
  params.set("keywords", keywords);
  params.set("origin", "GLOBAL_SEARCH_HEADER");
  params.set("sortBy", '["date_posted"]');
  const datePosted = getLinkedInPostDateParam(context.time);
  if (datePosted) {
    params.set("datePosted", `["${datePosted}"]`);
  }
  params.set("contentType", '["jobs"]');
  return `https://www.linkedin.com/search/results/content/?${params.toString()}`;
}

function buildLinkedInPostTitleQuery(title, context) {
  const custom = getActiveCustomQuery(context);
  if (custom) {
    return custom;
  }
  if (context.matchMode === "exact") {
    return quoteTerm(title);
  }
  // LinkedIn content search is more reliable with a compact phrase than a
  // long OR group.
  if (context.hasTypedTitle) {
    return quoteTerm(title);
  }
  if (!context.hasTypedTitle) {
    const pack = getRolePack(context.rolePack);
    return quoteTerm(pack.primary || title);
  }
  return quoteTerm(title);
}

function buildIndeedUrl(title, context) {
  const params = new URLSearchParams();
  params.set("q", buildIndeedKeywordQuery(title, context));
  params.set("l", getNativeLocation(context.location));
  if (context.sort === "latest") {
    params.set("sort", "date");
  }
  const fromage = getIndeedFromAge(context.time);
  if (fromage) {
    params.set("fromage", fromage);
  }
  if (context.remoteMode === "only") {
    params.set("sc", "0kf:attr(DSQF7);");
  }
  return `https://www.indeed.com/jobs?${params.toString()}`;
}

function buildIndeedKeywordQuery(title, context) {
  const parts = [buildNativeKeywordQuery(title, context)];
  if (["onsite", "onsite-hybrid", "exclude"].includes(context.remoteMode)) {
    parts.push("-remote", '-"work from home"');
  } else if (context.remoteMode === "hybrid") {
    parts.push("hybrid");
  }
  return parts.filter(Boolean).join(" ");
}

function getLinkedInTimeParam(time) {
  const map = {
    "5minutes": "r3600",
    "10minutes": "r3600",
    "15minutes": "r3600",
    "30minutes": "r3600",
    "45minutes": "r3600",
    "1hour": "r3600",
    "2hours": "r7200",
    "3hours": "r10800",
    "4hours": "r14400",
    "6hours": "r21600",
    "8hours": "r28800",
    "12hours": "r43200",
    "24hours": "r86400",
    "48hours": "r172800",
    "72hours": "r259200",
    week: "r604800",
    month: "r2592000",
    year: "r31536000"
  };
  return map[time] || "";
}

function getLinkedInPostDateParam(time) {
  if (["5minutes", "10minutes", "15minutes", "30minutes", "45minutes", "1hour", "2hours", "3hours", "4hours", "6hours", "8hours", "12hours", "24hours", "48hours", "72hours"].includes(time)) {
    return "past-24h";
  }
  if (time === "week") {
    return "past-week";
  }
  if (time === "month") {
    return "past-month";
  }
  return "";
}

function getLinkedInExperienceParam(value) {
  const map = {
    internship: "1",
    entry: "1,2",
    mid: "3,4",
    senior: "4,5",
    manager: "5,6"
  };
  return map[value] || "";
}

function getLinkedInJobTypeParam(value) {
  const map = {
    fulltime: "F",
    contract: "C",
    parttime: "P",
    internship: "I"
  };
  return map[value] || "";
}

function getLinkedInWorkTypeParam(value, location) {
  if (location === "remote-us" && value === "neutral") {
    return "2";
  }
  const map = {
    onsite: "1",
    "onsite-hybrid": "1,3",
    only: "2",
    hybrid: "3",
    exclude: "1,3"
  };
  return map[value] || "";
}

function getLinkedInFunctionParam(title, context) {
  if (context.matchMode !== "exact") {
    return "";
  }
  const normalized = title.toLowerCase();
  if (/data|analyst|analytics|intelligence|scientist|machine learning/.test(normalized)) {
    return "it,anls,rsch";
  }
  if (/software|developer|engineer|devops|sre|cloud|security/.test(normalized)) {
    return "eng,it";
  }
  if (/product/.test(normalized)) {
    return "prd";
  }
  return "";
}

function getIndeedFromAge(time) {
  const map = {
    "5minutes": "1",
    "10minutes": "1",
    "15minutes": "1",
    "30minutes": "1",
    "45minutes": "1",
    "1hour": "1",
    "2hours": "1",
    "3hours": "1",
    "4hours": "1",
    "6hours": "1",
    "8hours": "1",
    "12hours": "1",
    "24hours": "1",
    "48hours": "2",
    "72hours": "3",
    week: "7",
    month: "30"
  };
  return map[time] || "";
}

function getGlassdoorFromAge(time) {
  const map = {
    "5minutes": "1",
    "10minutes": "1",
    "15minutes": "1",
    "30minutes": "1",
    "45minutes": "1",
    "1hour": "1",
    "2hours": "1",
    "3hours": "1",
    "4hours": "1",
    "6hours": "1",
    "8hours": "1",
    "12hours": "1",
    "24hours": "1",
    "48hours": "3",
    "72hours": "3",
    week: "7",
    month: "30"
  };
  return map[time] || "";
}

function getZipRecruiterDays(time) {
  const map = {
    "5minutes": "1",
    "10minutes": "1",
    "15minutes": "1",
    "30minutes": "1",
    "45minutes": "1",
    "1hour": "1",
    "2hours": "1",
    "3hours": "1",
    "4hours": "1",
    "6hours": "1",
    "8hours": "1",
    "12hours": "1",
    "24hours": "1",
    "48hours": "3",
    "72hours": "3",
    week: "7",
    month: "30"
  };
  return map[time] || "";
}

function getDicePostedDate(time) {
  const map = {
    "5minutes": "ONE",
    "10minutes": "ONE",
    "15minutes": "ONE",
    "30minutes": "ONE",
    "45minutes": "ONE",
    "1hour": "ONE",
    "2hours": "ONE",
    "3hours": "ONE",
    "4hours": "ONE",
    "6hours": "ONE",
    "8hours": "ONE",
    "12hours": "ONE",
    "24hours": "ONE",
    "48hours": "THREE",
    "72hours": "THREE",
    week: "SEVEN"
  };
  return map[time] || "";
}

function buildSearchEngineUrl(engine, query, time, sort) {
  const queryWithOlder = addOlderOperator(query, time);
  switch (engine) {
    case "duckduckgo":
      return buildDuckDuckGoUrl(queryWithOlder, time);
    case "bing":
      return buildBingUrl(queryWithOlder, time);
    case "brave":
      return buildBraveUrl(queryWithOlder, time);
    case "startpage":
      return buildStartpageUrl(queryWithOlder, time);
    case "yahoo":
      return buildYahooUrl(queryWithOlder, time);
    case "kagi":
      return buildKagiUrl(queryWithOlder, time);
    case "qwant":
      return buildQwantUrl(queryWithOlder, time);
    default:
      return buildGoogleUrl(query, time, sort);
  }
}

function buildGoogleUrl(query, time, sort, options = {}) {
  const tbs = getGoogleTbs(time, sort);
  const params = new URLSearchParams();
  params.set("q", query);
  if (options.siteSearch) {
    params.set("as_sitesearch", normalizeGoogleSiteSearch(options.siteSearch));
    params.set("as_dt", "i");
  }
  if (tbs) {
    params.set("tbs", tbs);
  }
  return `https://www.google.com/search?${params.toString()}`;
}

function normalizeGoogleSiteSearch(site) {
  return String(site || "")
    .replace(/^site:/i, "")
    .replace(/^https?:\/\//i, "")
    .replace(/^www\./i, "")
    .replace(/\/$/, "");
}

function getGoogleTbs(time, sort) {
  const map = {
    "5minutes": "qdr:h1",
    "10minutes": "qdr:h1",
    "15minutes": "qdr:h1",
    "30minutes": "qdr:h1",
    "45minutes": "qdr:h1",
    "1hour": "qdr:h1",
    "2hours": "qdr:h2",
    "3hours": "qdr:h3",
    "4hours": "qdr:h4",
    "6hours": "qdr:h6",
    "8hours": "qdr:h8",
    "12hours": "qdr:h12",
    "24hours": "qdr:d",
    "48hours": "qdr:h48",
    "72hours": "qdr:h72",
    week: "qdr:w",
    month: "qdr:m",
    year: "qdr:y",
    older1month: `cdr:1,cd_max:${getPastDate(1, "us")}`,
    older3months: `cdr:1,cd_max:${getPastDate(3, "us")}`,
    older6months: `cdr:1,cd_max:${getPastDate(6, "us")}`
  };
  const timePart = map[time] || "";
  if (sort === "latest") {
    return timePart ? `${timePart},sbd:1` : "sbd:1";
  }
  return timePart;
}

function buildDuckDuckGoUrl(query, time) {
  const map = { "24hours": "d", week: "w", month: "m", year: "y" };
  const params = new URLSearchParams({ q: query });
  if (map[time]) {
    params.set("df", map[time]);
  }
  return `https://duckduckgo.com/?${params.toString()}`;
}

function buildBingUrl(query, time) {
  const map = { "24hours": "ez1", week: "ez2", month: "ez3" };
  const filter = map[time] ? `&filters=ex1%3a%22${map[time]}%22` : "";
  return `https://www.bing.com/search?q=${encodeURIComponent(query)}${filter}`;
}

function buildBraveUrl(query, time) {
  const map = { "24hours": "pd", week: "pw", month: "pm", year: "py" };
  const filter = map[time] ? `&tf=${map[time]}` : "";
  return `https://search.brave.com/search?q=${encodeURIComponent(query)}&source=web${filter}`;
}

function buildStartpageUrl(query, time) {
  const afterDate = getStartpageAfterDate(time);
  const finalQuery = afterDate ? `${query} after:${afterDate}` : query;
  return `https://www.startpage.com/sp/search?query=${encodeURIComponent(finalQuery)}`;
}

function buildYahooUrl(query, time) {
  const map = { "24hours": "d", week: "w", month: "m" };
  const filter = map[time] ? `&fr2=time&btf=${map[time]}&fr=sfp` : "";
  return `https://search.yahoo.com/search?p=${encodeURIComponent(query)}${filter}`;
}

function buildKagiUrl(query, time) {
  const map = { "24hours": "1", week: "2", month: "3", year: "4" };
  const filter = map[time] ? `&dr=${map[time]}` : "";
  return `https://kagi.com/search?q=${encodeURIComponent(query)}${filter}`;
}

function buildQwantUrl(query, time) {
  const map = { "24hours": "day", week: "week", month: "month" };
  const filter = map[time] ? `&freshness=${map[time]}` : "";
  return `https://www.qwant.com/?q=${encodeURIComponent(query)}&t=web${filter}`;
}

function addOlderOperator(query, time) {
  const months = getOlderMonths(time);
  return months ? `${query} before:${getPastDate(months, "iso")}` : query;
}

function getStartpageAfterDate(time) {
  const dayMap = { "24hours": 1, week: 7, month: 30, year: 365 };
  if (!dayMap[time]) {
    return "";
  }
  const date = new Date(Date.now() - dayMap[time] * 24 * 60 * 60 * 1000);
  return date.toISOString().slice(0, 10);
}

function getPastDate(monthsBack, format) {
  const date = new Date();
  date.setMonth(date.getMonth() - monthsBack);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  return format === "iso" ? `${yyyy}-${mm}-${dd}` : `${mm}/${dd}/${yyyy}`;
}

function getOlderMonths(time) {
  if (time === "older1month") {
    return 1;
  }
  if (time === "older3months") {
    return 3;
  }
  if (time === "older6months") {
    return 6;
  }
  return 0;
}

function getTimeLabel(value) {
  const option = Object.values(TIME_OPTIONS).flat().find(([timeValue]) => timeValue === value);
  return option ? option[1] : "All";
}

function getActiveFilterSummary(context) {
  return [
    PROFILE_LABELS[context.profile],
    ROLE_PACK_LABELS[context.rolePack],
    FILTER_LABELS.precision[context.precision],
    getLocationLabel(context.location),
    getTimeLabel(context.time),
    FILTER_LABELS.sort[context.sort],
    FILTER_LABELS.queryStyle[context.queryStyle],
    FILTER_LABELS.authorization[context.authorization]
  ].filter(Boolean).join(" - ");
}

function updateAddressBar(titles, context, mode = "push") {
  const params = new URLSearchParams();
  if (els.jobTitle.value.trim()) {
    params.set("job", titles.join(","));
  }
  params.set("profile", context.profile);
  params.set("rolePack", context.rolePack);
  if (els.searchPresetSelect.value) {
    params.set("preset", els.searchPresetSelect.value);
  }
  params.set("location", context.location);
  params.set("time", context.time);
  params.set("sort", context.sort);
  if (context.engine !== "google") {
    params.set("engine", context.engine);
  }
  if (context.remoteMode !== "neutral") {
    params.set("remote", context.remoteMode);
  }
  if (context.matchMode !== "smart") {
    params.set("match", context.matchMode);
  }
  if (context.queryStyle !== "balanced") {
    params.set("queryStyle", context.queryStyle);
  }
  if (context.customQuery) {
    params.set("customQuery", context.customQuery);
  }
  if (els.customSourceName.value.trim()) {
    params.set("customSourceName", els.customSourceName.value.trim());
  }
  if (els.customSourceUrl.value.trim()) {
    params.set("customSourceUrl", els.customSourceUrl.value.trim());
  }
  const encodedSourceLinks = encodeJsonParam(state.customPortalLinks);
  if (encodedSourceLinks) {
    params.set("sourceLinks", encodedSourceLinks);
  }
  const encodedCareerLinks = encodeCompanyCareerLinksParam(state.customCompanyCareers);
  if (encodedCareerLinks) {
    params.set("careerLinks", encodedCareerLinks);
  }
  if (context.experience !== "any") {
    params.set("experience", context.experience);
  }
  if (context.employment !== "any") {
    params.set("employment", context.employment);
  }
  params.set("authorization", context.authorization);
  if (context.includeTerms.length) {
    params.set("include", context.includeTerms.join(","));
  }
  if (context.excludeTerms.length) {
    params.set("exclude", context.excludeTerms.join(","));
  }
  if (context.cautionExcludes) {
    params.set("caution", "1");
  }
  if (context.strictTitle) {
    params.set("strict", "1");
  }
  if (state.pinnedPortals.size) {
    params.set("pins", Array.from(state.pinnedPortals).join(","));
  }
  if (state.favoriteCompanies.size) {
    params.set("favCompanies", Array.from(state.favoriteCompanies).join(","));
  }
  const checklist = getDailyChecklist();
  const doneChecklist = Object.entries(checklist.items).filter(([, done]) => done).map(([id]) => id);
  if (doneChecklist.length) {
    params.set("checklist", doneChecklist.join(","));
  }
  if (els.companyRole.value.trim()) {
    params.set("companyRole", els.companyRole.value.trim());
  }
  if (els.companyCustomLinkName.value.trim()) {
    params.set("companyCustomLinkName", els.companyCustomLinkName.value.trim());
  }
  if (els.companyCustomLinkUrl.value.trim()) {
    params.set("companyCustomLinkUrl", els.companyCustomLinkUrl.value.trim());
  }
  const categories = Array.from(getSelectedCategories());
  if (!categories.length) {
    params.set("groups", "none");
  } else if (categories.join(",") !== DEFAULT_CATEGORY_IDS.join(",")) {
    params.set("groups", categories.join(","));
  }
  const nextUrl = `${window.location.pathname}?${params.toString()}`;
  if (mode === "replace") {
    history.replaceState(null, "", nextUrl);
  } else {
    history.pushState(null, "", nextUrl);
  }
}

function renderCompanyOptions(filterText) {
  const normalized = filterText.trim().toLowerCase();
  const previousValue = els.companySelect.value || ALL_COMPANIES_ID;
  state.visibleCompanies = sortCompaniesForView(COMPANIES.filter(company => {
    if (!normalized) {
      return companyMatchesFilters(company);
    }
    return [
      company.name,
      company.category,
      company.tags.join(" "),
      company.aliases.join(" "),
      company.sponsorTier,
      company.companyKind,
      company.caution,
      state.favoriteCompanies.has(company.id) ? "favorite" : ""
    ].join(" ").toLowerCase().includes(normalized) && companyMatchesFilters(company);
  }));

  els.companySelect.innerHTML = "";
  if (!state.visibleCompanies.length) {
    const option = document.createElement("option");
    option.textContent = "No matching companies";
    option.value = "";
    els.companySelect.appendChild(option);
    els.companyCount.textContent = `0 of ${COMPANIES.length} companies`;
    return;
  }

  const allOption = document.createElement("option");
  allOption.value = ALL_COMPANIES_ID;
  allOption.textContent = `All companies (${state.visibleCompanies.length})`;
  els.companySelect.appendChild(allOption);

  const byCategory = new Map();
  state.visibleCompanies.forEach(company => {
    if (!byCategory.has(company.category)) {
      byCategory.set(company.category, []);
    }
    byCategory.get(company.category).push(company);
  });

  byCategory.forEach((companies, category) => {
    const group = document.createElement("optgroup");
    group.label = category;
    companies.forEach(company => {
      const option = document.createElement("option");
      option.value = company.id;
      option.textContent = `${company.rank}. ${company.name}`;
      group.appendChild(option);
    });
    els.companySelect.appendChild(group);
  });

  if (previousValue === ALL_COMPANIES_ID) {
    els.companySelect.value = ALL_COMPANIES_ID;
  } else if (state.visibleCompanies.some(company => company.id === previousValue)) {
    els.companySelect.value = previousValue;
  } else {
    els.companySelect.value = ALL_COMPANIES_ID;
  }
  const sponsorCount = state.visibleCompanies.filter(company => company.h1bFilings > 0).length;
  const filterSummary = getCompanyFilterSummary(normalized);
  els.companyCount.textContent = `${state.visibleCompanies.length} of ${COMPANIES.length} companies - ${sponsorCount} H1B sponsors${filterSummary ? ` - ${filterSummary}` : ""}`;
}

function renderFavoriteCompanies() {
  els.favoriteCompaniesGrid.innerHTML = "";
  const favorites = COMPANIES.filter(company => state.favoriteCompanies.has(company.id))
    .sort((a, b) => getCompanyRecommendationScore(b) - getCompanyRecommendationScore(a) || a.rank - b.rank);

  els.favoriteCompaniesPanel.hidden = favorites.length === 0;
  const customFavoriteCount = favorites.filter(company => hasCustomCompanyCareers(company)).length;
  els.favoriteCompanyCount.textContent = `${favorites.length} favorite${favorites.length === 1 ? "" : "s"}${customFavoriteCount ? ` - ${customFavoriteCount} custom Careers` : ""}`;
  if (!favorites.length) {
    return;
  }

  const title = getCompanySearchTitle();
  const context = getCompanyContext();
  const fragment = document.createDocumentFragment();

  const toolbar = document.createElement("div");
  toolbar.className = "favorite-company-toolbar";
  toolbar.append(
    createCompanyActionButton("Open Top 5", openTopFavoriteCompanyPacks),
    createCompanyActionButton("Copy Top 5", copyTopFavoriteCompanyPacks),
    createCompanyActionButton("Open Top 5 Careers", openTopFavoriteCareers),
    createCompanyActionButton("Copy Top 5 Careers", copyTopFavoriteCareers),
    createCompanyActionButton("Open All Careers", openAllFavoriteCareers),
    createCompanyActionButton("Copy All Careers", copyAllFavoriteCareers)
  );
  fragment.appendChild(toolbar);

  favorites.forEach(company => {
    const card = document.createElement("article");
    card.className = "favorite-company-card";
    const header = createCompanyIdentityHeader(company, {
      subtitle: company.category,
      score: `Fit ${Math.min(100, Math.max(50, Math.round(getCompanyRecommendationScore(company) / 1200)))}`
    });
    const meta = document.createElement("div");
    meta.className = "portal-meta";
    meta.append(createPill(company.companyKind === "vendor" ? "Vendor" : "Direct"));
    meta.append(createPill(FILTER_LABELS.sponsorTier[company.sponsorTier] || company.sponsorTier));
    if (company.h1bFilings) {
      meta.append(createPill(`${company.h1bFilings.toLocaleString()} H1B`));
    }
    card.append(header, meta, createCompanyActionGroups(company, title, context, { includeUse: true, includeRemove: true }));
    fragment.appendChild(card);
  });
  els.favoriteCompaniesGrid.appendChild(fragment);
}

function getTopFavoriteCompanies(limit = 5) {
  return COMPANIES.filter(company => state.favoriteCompanies.has(company.id))
    .sort((a, b) => getCompanyRecommendationScore(b) - getCompanyRecommendationScore(a) || a.rank - b.rank)
    .slice(0, limit);
}

function openTopFavoriteCompanyPacks() {
  const favorites = getTopFavoriteCompanies(5);
  if (!favorites.length) {
    showToast("No favorite companies pinned yet");
    return;
  }
  const links = favorites.flatMap(company => getCompanyLinkPack(company));
  if (links.length > 25 && !window.confirm(`This will open ${links.length} tabs across ${favorites.length} favorite companies. Continue?`)) {
    return;
  }
  links.forEach(url => window.open(url, "_blank", "noopener"));
  setDailyChecklistItem("favoriteCompanies", true);
  showToast(`Opened ${favorites.length} favorite company packs`);
}

function copyTopFavoriteCompanyPacks() {
  const favorites = getTopFavoriteCompanies(5);
  const links = favorites.flatMap(company => [`# ${company.name}`, ...getCompanyLinkPack(company)]);
  if (!links.length) {
    showToast("No favorite companies pinned yet");
    return;
  }
  setDailyChecklistItem("favoriteCompanies", true);
  copyLinks(links, `Copied ${favorites.length} favorite company packs`);
}

function openTopFavoriteCareers() {
  const favorites = getTopFavoriteCompanies(5);
  const links = favorites.map(company => getCompanyCareersUrl(company)).filter(Boolean);
  if (!links.length) {
    showToast("No favorite companies pinned yet");
    return;
  }
  links.forEach(url => window.open(url, "_blank", "noopener"));
  setDailyChecklistItem("favoriteCompanies", true);
  showToast(`Opened ${links.length} top favorite careers`);
}

function copyTopFavoriteCareers() {
  const favorites = getTopFavoriteCompanies(5);
  const links = favorites.map(company => `${company.name}: ${getCompanyCareersUrl(company)}`).filter(Boolean);
  if (!links.length) {
    showToast("No favorite companies pinned yet");
    return;
  }
  setDailyChecklistItem("favoriteCompanies", true);
  copyLinks(links, `Copied ${favorites.length} top favorite career links`);
}

function openAllFavoriteCareers() {
  const favorites = COMPANIES.filter(company => state.favoriteCompanies.has(company.id));
  if (!favorites.length) {
    showToast("No favorite companies pinned yet");
    return;
  }
  const links = favorites.map(company => getCompanyCareersUrl(company)).filter(Boolean);
  if (links.length > 25 && !window.confirm(`This will open ${links.length} career pages. Continue?`)) {
    return;
  }
  links.forEach(url => window.open(url, "_blank", "noopener"));
  showToast(`Opened ${links.length} careers pages`);
}

function copyAllFavoriteCareers() {
  const favorites = COMPANIES.filter(company => state.favoriteCompanies.has(company.id));
  const links = favorites.map(company => `${company.name}: ${getCompanyCareersUrl(company)}`).filter(Boolean);
  if (!links.length) {
    showToast("No favorite companies pinned yet");
    return;
  }
  copyLinks(links, `Copied ${links.length} favorite career links`);
}

function createCompanySuggestionButton(label, company, handler) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "secondary-button";
  button.textContent = label;
  button.addEventListener("click", handler);
  return button;
}

function createCompanySuggestionLink(label, url) {
  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener";
  link.textContent = label;
  return link;
}

function getVisibleCompanyActions(company, title, context) {
  return getCompanyActionItems(company, title, context)
    .filter(action => action.label.startsWith("Careers") || [
      "LinkedIn Jobs",
      "LinkedIn Posts",
      "LinkedIn Recruiters",
      "LinkedIn Company",
      "Indeed/Google",
      "Google Company",
      "Custom Link"
    ].includes(action.label) || action.custom);
}

function selectCompanySuggestion(company) {
  els.companySelect.value = company.id;
  syncCompanyCard();
  persistPortableState();
}

function companyMatchesFilters(company) {
  const category = els.companyCategorySelect.value;
  if (category !== "all" && company.category !== category) {
    return false;
  }
  const sponsorTier = els.companySponsorTier.value;
  if (sponsorTier !== "all" && company.sponsorTier !== sponsorTier) {
    return false;
  }
  const kind = els.companyKind.value;
  if (kind !== "all" && company.companyKind !== kind) {
    return false;
  }
  return true;
}

function getCompanyFilterSummary(searchText = "") {
  const filters = [];
  if (searchText) {
    filters.push(`search "${searchText}"`);
  }
  if (els.companyCategorySelect.value !== "all") {
    filters.push(els.companyCategorySelect.value);
  }
  if (els.companySponsorTier.value !== "all") {
    filters.push(FILTER_LABELS.sponsorTier[els.companySponsorTier.value] || els.companySponsorTier.value);
  }
  if (els.companyKind.value !== "all") {
    filters.push(FILTER_LABELS.companyKind[els.companyKind.value] || els.companyKind.value);
  }
  return filters.length ? `filters: ${filters.join(", ")}` : "";
}

function showAllFilteredCompanies() {
  const total = state.visibleCompanies.length;
  if (!total) {
    showToast("No matching companies for these filters");
    return;
  }
  state.companyListLimit = total;
  renderAllCompanyCard();
  showToast(`Showing all ${total.toLocaleString()} filtered companies`);
}

function sortCompaniesForView(companies) {
  const mode = els.companySortSelect.value;
  return [...companies].sort((a, b) => {
    if (mode === "favorites") {
      const favDiff = Number(state.favoriteCompanies.has(b.id)) - Number(state.favoriteCompanies.has(a.id));
      if (favDiff) {
        return favDiff;
      }
    }
    if (mode === "sponsor") {
      return b.h1bFilings - a.h1bFilings || a.rank - b.rank;
    }
    if (mode === "recommended") {
      return getCompanyRecommendationScore(b) - getCompanyRecommendationScore(a) || a.rank - b.rank;
    }
    return a.rank - b.rank;
  });
}

function getCompanyRecommendationScore(company) {
  const favoriteBoost = state.favoriteCompanies.has(company.id) ? 200000 : 0;
  const sponsorBoost = company.h1bFilings * 20;
  const directBoost = company.companyKind === "direct" ? 1000 : 0;
  const cautionPenalty = company.caution ? 250 : 0;
  return favoriteBoost + sponsorBoost + directBoost - cautionPenalty;
}

function isAllCompaniesSelected() {
  return els.companySelect.value === ALL_COMPANIES_ID;
}

function getSelectedCompany() {
  if (isAllCompaniesSelected()) {
    return null;
  }
  return COMPANIES.find(company => company.id === els.companySelect.value) || state.visibleCompanies[0] || null;
}

function syncCompanyCard() {
  if (isAllCompaniesSelected()) {
    renderAllCompanyCard();
    return;
  }

  const company = getSelectedCompany();
  if (!company) {
    els.companyCard.textContent = "No company selected.";
    return;
  }
  els.companySelect.value = company.id;
  const favorite = state.favoriteCompanies.has(company.id);

  els.companyCard.innerHTML = "";
  const title = createCompanyIdentityHeader(company, {
    subtitle: company.category,
    score: `#${company.rank}`
  });

  const meta = document.createElement("div");
  meta.className = "portal-meta";
  meta.append(createPill(company.category));
  meta.append(createPill(FILTER_LABELS.companyKind[company.companyKind]));
  if (company.h1bFilings) {
    meta.append(createPill(`${company.h1bFilings.toLocaleString()} H1B filings`));
    meta.append(createPill(FILTER_LABELS.sponsorTier[company.sponsorTier] || company.sponsorTier));
  }
  company.tags.forEach(tag => meta.append(createPill(tag)));
  if (favorite) {
    meta.append(createPill("favorite"));
  }

  const url = document.createElement("a");
  url.href = getCompanyCareersUrl(company);
  url.target = "_blank";
  url.rel = "noopener";
  url.textContent = getCompanyCareersUrl(company);

  els.companyCard.append(title, meta, url);
  if (company.aliases.length) {
    const aliases = document.createElement("p");
    aliases.className = "company-note";
    aliases.textContent = `Aliases: ${company.aliases.join(", ")}`;
    els.companyCard.appendChild(aliases);
  }
  if (company.caution) {
    const caution = document.createElement("p");
    caution.className = "caution";
    caution.textContent = company.caution;
    els.companyCard.appendChild(caution);
  }
  els.companyCard.appendChild(createCompanyActionGrid(company, getCompanySearchTitle(), getCompanyContext()));
}

function renderAllCompanyCard() {
  els.companyCard.innerHTML = "";

  const titleText = getCompanySearchTitle();
  const hasRole = Boolean(titleText);
  const context = getCompanyContext();
  const rows = hasRole ? getCompanySearchRows(titleText, context) : state.visibleCompanies.map(company => ({ company, searchUrl: "" }));
  const visibleRows = rows.slice(0, getCompanyListLimit(rows.length));
  const favoriteRows = rows.filter(row => state.favoriteCompanies.has(row.company.id)).length;
  const customCareerRows = rows.filter(row => hasCustomCompanyCareers(row.company)).length;

  const title = document.createElement("div");
  title.className = "company-title";
  const name = document.createElement("h3");
  name.textContent = "All companies";
  const count = createPill(hasRole ? `${rows.length} company search rows` : `${rows.length} companies`);
  title.append(name, count);

  const meta = document.createElement("div");
  meta.className = "portal-meta";
  meta.append(createPill(getLocationLabel(context.location)));
  meta.append(createPill(getTimeLabel(context.time)));
  meta.append(createPill(FILTER_LABELS.authorization[context.authorization]));
  meta.append(createPill(FILTER_LABELS.companyKind[els.companyKind.value] || "Direct and vendors"));
  meta.append(createPill(FILTER_LABELS.sponsorTier[els.companySponsorTier.value] || "All sponsor tiers"));
  meta.append(createPill(hasRole ? `Role: ${titleText}` : "Role required"));
  if (favoriteRows) {
    meta.append(createPill(`${favoriteRows} favorites kept`, "favorite"));
  }
  if (customCareerRows) {
    meta.append(createPill(`${customCareerRows} custom Careers`, "custom"));
  }

  const note = document.createElement("p");
  note.className = "company-note";
  note.textContent = hasRole
    ? `Showing ${visibleRows.length.toLocaleString()} of ${rows.length.toLocaleString()} filtered companies in the card. The dropdown still contains every matching company, and saved favorite/custom Careers links are preserved.`
    : `Showing ${visibleRows.length.toLocaleString()} of ${rows.length.toLocaleString()} filtered companies. Enter a company search role to create filtered company searches.`;

  const bulkActions = document.createElement("div");
  bulkActions.className = "company-card-actions company-bulk-actions";
  bulkActions.append(
    createCompanyActionButton("Copy Career Pages", openSelectedCompany),
    createCompanyActionButton("Copy All Search Links", searchSelectedCompany),
    createCompanyActionButton("Copy Selected Links", copySelectedCompanyLinks),
    createCompanyActionButton("Open Top Packs", openSelectedCompanyLinkPack),
    createCompanyActionButton("Show All Filtered", showAllFilteredCompanies),
    createCompanyActionButton("Copy Company Sync", copyPortableSyncLink),
    createCompanyActionButton("Open Top Sponsors", openTopSponsorSearches),
    createCompanyActionButton("Reset Company Search", resetCompanySearch)
  );

  const list = document.createElement("div");
  list.className = "company-link-list";
  list.setAttribute("aria-label", `Showing ${visibleRows.length} of ${rows.length} filtered companies`);
  visibleRows.forEach(row => {
    const item = document.createElement("article");
    item.className = "company-link-row";

    const companyName = createCompanyIdentityHeader(row.company, {
      title: `${row.company.rank}. ${row.company.name}`,
      subtitle: row.company.companyKind === "vendor" ? "Staffing/vendor" : "Direct employer",
      logoSize: "sm",
      level: "strong"
    });

    const category = document.createElement("span");
    category.className = "company-link-category";
    category.textContent = row.company.h1bFilings
      ? `${row.company.category} - ${row.company.h1bFilings.toLocaleString()} H1B filings`
      : row.company.category;

    const links = document.createElement("div");
    links.className = "company-link-actions";

    const careers = document.createElement("a");
    careers.href = getCompanyCareersUrl(row.company);
    careers.target = "_blank";
    careers.rel = "noopener";
    careers.textContent = "Careers";

    links.appendChild(careers);
    links.appendChild(createCompanyActionButton("Update Careers", () => editCompanyCareersLink(row.company)));
    if (hasRole) {
      getVisibleCompanyActions(row.company, titleText, context).forEach(action => {
        if (action.label.startsWith("Careers")) {
          return;
        }
        const link = document.createElement("a");
        link.href = action.url;
        link.target = "_blank";
        link.rel = "noopener";
        link.textContent = action.label;
        links.appendChild(link);
      });
      const favoriteButton = document.createElement("button");
      favoriteButton.type = "button";
      favoriteButton.textContent = state.favoriteCompanies.has(row.company.id) ? "Unfavorite" : "Favorite";
      favoriteButton.addEventListener("click", () => toggleFavoriteCompanyById(row.company.id));
      links.appendChild(favoriteButton);
    } else {
      const missing = document.createElement("span");
      missing.className = "company-link-muted";
      missing.textContent = "Add role";
      links.appendChild(missing);
    }
    item.append(companyName, category, links);
    list.appendChild(item);
  });

  els.companyCard.append(title, meta, note, bulkActions, list);
  if (visibleRows.length < rows.length) {
    els.companyCard.appendChild(createCompanyListLoadPanel(rows.length, visibleRows.length));
  }
}

function getCompanyListLimit(total) {
  const limit = Number(state.companyListLimit || COMPANY_LIST_BATCH_SIZE);
  return Math.min(total, Math.max(COMPANY_LIST_BATCH_SIZE, limit));
}

function resetCompanyListLimit() {
  state.companyListLimit = COMPANY_LIST_BATCH_SIZE;
}

function createCompanyListLoadPanel(total, visible) {
  const panel = document.createElement("div");
  panel.className = "progressive-load-panel";
  const note = document.createElement("p");
  note.className = "company-note";
  note.textContent = `Showing ${visible.toLocaleString()} of ${total.toLocaleString()} companies for speed. Use the filter box to narrow faster, or expand intentionally.`;
  const actions = document.createElement("div");
  actions.className = "progressive-load-actions";
  actions.append(
    createCompanyActionButton(`Show next ${Math.min(COMPANY_LIST_BATCH_SIZE, total - visible)}`, () => {
      state.companyListLimit = visible + COMPANY_LIST_BATCH_SIZE;
      renderAllCompanyCard();
    }),
    createCompanyActionButton("Show all", () => {
      if (total > 250 && !window.confirm(`This will render ${total.toLocaleString()} company rows and may be slower. Continue?`)) {
        return;
      }
      state.companyListLimit = total;
      renderAllCompanyCard();
    })
  );
  panel.append(note, actions);
  return panel;
}

function createCompanyActionGrid(company, title, context) {
  const actions = createCompanyActionGroups(company, title, context);
  actions.appendChild(createActionGroup("Tools", [
    { label: "Copy Company Sync", handler: copyPortableSyncLink },
    { label: "Open Top Sponsors", handler: openTopSponsorSearches },
    { label: "Reset Search", handler: resetCompanySearch }
  ]));
  return actions;
}

function getCompanyActionItems(company, title, context) {
  const actions = [
    { label: "Careers", url: getCompanyCareersUrl(company) },
    { label: "Filtered Search", url: buildCompanySearchUrl(company, title, context) },
    { label: "LinkedIn Jobs", url: getCompanyActionUrls(company, title, context, "linkedinJobs")[0] },
    { label: "LinkedIn Posts", url: getCompanyActionUrls(company, title, context, "linkedinPosts")[0] },
    { label: "LinkedIn Recruiters", url: getCompanyActionUrls(company, title, context, "linkedinRecruiters")[0] },
    { label: "LinkedIn Company", url: getCompanyActionUrls(company, title, context, "linkedinCompany")[0] },
    { label: "Indeed/Google", url: getCompanyActionUrls(company, title, context, "indeedGoogle")[0] },
    { label: "Google Company", url: getCompanyActionUrls(company, title, context, "googleCompany")[0] }
  ];
  actions.push(...buildCompanyCustomLinkUrls(company, title, context).map(custom => ({
    label: custom.label,
    url: custom.url,
    custom: true
  })));
  return actions.filter(action => action.url);
}

function createCompanyActionLink(label, url) {
  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener";
  link.textContent = label;
  return link;
}

function createCompanyActionButton(label, handler) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.addEventListener("click", handler);
  return button;
}

function openSelectedCompany() {
  if (isAllCompaniesSelected()) {
    copyLinks(state.visibleCompanies.map(company => getCompanyCareersUrl(company)), "Copied all company career pages");
    return;
  }

  const company = getSelectedCompany();
  if (!company) {
    return;
  }
  window.open(getCompanyCareersUrl(company), "_blank", "noopener");
}

function searchSelectedCompany() {
  if (isAllCompaniesSelected()) {
    const title = getCompanySearchTitle();
    if (!title) {
      showToast("Enter a company search role");
      return;
    }
    const context = getCompanyContext();
    const links = getCompanySearchRows(title, context).map(row => row.searchUrl);
    copyLinks(links, "Copied all company search links");
    return;
  }

  const company = getSelectedCompany();
  if (!company) {
    return;
  }
  const title = getCompanySearchTitle();
  if (!title) {
    showToast("Enter a company search role");
    return;
  }
  const context = getCompanyContext();
  window.open(buildCompanySearchUrl(company, title, context), "_blank", "noopener");
}

function openCompanySearchType(type) {
  const title = getCompanySearchTitle();
  if (!title && !["linkedinCompany", "googleCompany"].includes(type)) {
    showToast("Enter a company search role");
    return;
  }
  const companies = getCompaniesForAction();
  const context = getCompanyContext();
  const urls = companies.flatMap(company => getCompanyActionUrls(company, title, context, type));
  if (!urls.length) {
    return;
  }
  if (companies.length === 1 && urls.length <= 2) {
    urls.forEach(url => window.open(url, "_blank", "noopener"));
    showToast(`Opened ${type === "indeedGoogle" ? "Indeed/Google" : type}`);
    return;
  }
  copyLinks(urls, `Copied ${urls.length} company ${type} links`);
}

function copySelectedCompanyLinks() {
  const title = getCompanySearchTitle();
  if (!title) {
    showToast("Enter a company search role");
    return;
  }
  const context = getCompanyContext();
  const links = getCompaniesForAction().flatMap(company => [
    ...getCompanyActionItems(company, title, context).map(action => action.url)
  ]);
  copyLinks(links.filter(Boolean), `Copied ${links.filter(Boolean).length} selected company links`);
}

function openSelectedCompanyLinkPack() {
  const companies = getCompaniesForAction();
  if (!companies.length) {
    showToast("No company links to open");
    return;
  }
  const targetCompanies = isAllCompaniesSelected() ? companies.slice(0, 3) : companies;
  if (isAllCompaniesSelected() && !window.confirm("This opens link packs for the first 3 visible companies. Continue?")) {
    return;
  }
  targetCompanies.forEach(company => openCompanyLinkPack(company));
}

function openCompanyLinkPack(company) {
  const links = getCompanyLinkPack(company);
  if (!links.length) {
    showToast("No company links to open");
    return;
  }
  if (links.length > 10 && !window.confirm(`This will open ${links.length} tabs. Continue?`)) {
    return;
  }
  links.forEach(url => window.open(url, "_blank", "noopener"));
  showToast(`Opened ${links.length} links for ${company.name}`);
}

function copyCompanyLinkPack(company) {
  const links = getCompanyLinkPack(company);
  copyLinks(links, `Copied ${links.length} links for ${company.name}`);
}

function getCompanyLinkPack(company) {
  const title = getCompanySearchTitle();
  const context = getCompanyContext();
  return getCompanyActionItems(company, title, context).map(action => action.url).filter(Boolean);
}

function openTopSponsorSearches() {
  const title = getCompanySearchTitle();
  const context = getCompanyContext();
  const topSponsors = COMPANIES
    .filter(company => company.h1bFilings > 0 && company.companyKind === "direct")
    .sort((a, b) => b.h1bFilings - a.h1bFilings)
    .slice(0, 5);
  topSponsors.forEach(company => window.open(buildCompanySearchUrl(company, title, context), "_blank", "noopener"));
  showToast("Opened top 5 sponsor searches");
}

function getCompaniesForAction() {
  if (isAllCompaniesSelected()) {
    return state.visibleCompanies;
  }
  const selected = getSelectedCompany();
  return selected ? [selected] : [];
}

function getCompanyActionUrls(company, title, context, type) {
  const companyContext = {
    ...context,
    includeTerms: mergeUnique(context.includeTerms, [company.name])
  };
  switch (type) {
    case "linkedinJobs":
      return [buildLinkedInJobsUrl(title, companyContext)];
    case "linkedinPosts":
      return [buildLinkedInPostsUrl(title, companyContext)];
    case "linkedinRecruiters":
      return [buildLinkedInRecruiterSearchUrl(company, title, context)];
    case "linkedinCompany":
      return [buildLinkedInCompanySearchUrl(company)];
    case "googleCompany":
      return [buildGoogleCompanyProfileSearchUrl(company, title, context)];
    case "indeedGoogle":
      return [buildIndeedUrl(title, companyContext), buildCompanySearchUrl(company, title, context)];
    default:
      return [buildCompanySearchUrl(company, title, context)];
  }
}

function resetCompanySearch() {
  els.companyRole.value = "";
  els.companyFilter.value = "";
  els.companyRolePack.value = els.rolePackSelect.value || DEFAULT_ROLE_PACK_ID;
  els.companyTimeFilter.value = "24hours";
  els.companyExperienceSelect.value = "entry";
  els.companyLocationSelect.value = els.locationSelect.value || "usa";
  els.companyRemoteMode.value = els.remoteMode.value || "neutral";
  els.companyEmploymentSelect.value = "any";
  els.companyAuthorizationSelect.value = "none";
  els.companyIncludeTerms.value = "";
  els.companyExcludeTerms.value = "";
  els.companySortSelect.value = "latest";
  els.companyCategorySelect.value = "all";
  els.companySponsorTier.value = "all";
  els.companyKind.value = "all";
  renderCompanyOptions("");
  els.companySelect.value = ALL_COMPANIES_ID;
  syncCompanyCard();
  renderSponsorGrid();
  persistPortableState();
  showToast("Company search reset");
}

function getVendorCompanies() {
  return COMPANIES.filter(company => company.companyKind === "vendor");
}

function renderVendorOutreach() {
  const title = getVendorSearchTitle();
  const context = getVendorContext();
  const companies = getVendorCandidates();
  state.visibleVendors = companies;
  els.vendorGrid.innerHTML = "";
  els.vendorCount.textContent = `${companies.length} ${els.vendorKind.value === "direct" ? "direct employers" : "vendors"}`;

  if (!companies.length) {
    const note = document.createElement("p");
    note.className = "empty-note";
    note.textContent = "No matching vendor contacts for these filters.";
    els.vendorGrid.appendChild(note);
    return;
  }

  const fragment = document.createDocumentFragment();
  companies.forEach(company => {
    const score = getVendorFitScore(company, title);
    const links = getVendorLinks(company, title, context);
    const card = document.createElement("article");
    card.className = "vendor-card";

    const heading = createCompanyIdentityHeader(company, {
      subtitle: FILTER_LABELS.companyKind[company.companyKind],
      score: `Fit ${score}`
    });

    const scoreBlock = document.createElement("div");
    scoreBlock.className = "vendor-score";
    const scoreValue = document.createElement("strong");
    scoreValue.textContent = String(score);
    const scoreLabel = document.createElement("span");
    scoreLabel.textContent = "Vendor fit score";
    scoreBlock.append(scoreValue, scoreLabel);

    const meta = document.createElement("div");
    meta.className = "portal-meta";
    meta.append(createPill(company.category));
    meta.append(createPill(FILTER_LABELS.sponsorTier[company.sponsorTier] || company.sponsorTier));
    if (company.h1bFilings) {
      meta.append(createPill(`${company.h1bFilings.toLocaleString()} H1B filings`));
    }
    company.tags.slice(0, 4).forEach(tag => meta.append(createPill(tag)));
    if (!getCompanyCareersUrl(company)) {
      meta.append(createPill("needs contact search"));
    }

    const note = document.createElement("p");
    note.className = "company-note";
    note.textContent = `${title} - ${getLocationLabel(context.location)} - ${roleMatchesVendor(company, title) ? "role/tag match" : "broad vendor match"}`;

    const actions = document.createElement("div");
    actions.className = "company-action-groups vendor-action-groups";
    actions.append(
      createActionGroup("Primary", [
        { label: "Site", url: links.site },
        { label: "LinkedIn Jobs", url: links.linkedinJobs },
        { label: "Indeed", url: links.indeed }
      ]),
      createActionGroup("Recruiter Signals", [
        { label: "LinkedIn Recruiters", url: links.linkedinRecruiters },
        { label: "Google Contact", url: links.googleContact }
      ]),
      createActionGroup("Outreach", [
        { label: "Copy Message", handler: () => copyLinks([buildVendorOutreachMessage(company, title, context, "initial")], "Copied vendor message") }
      ])
    );

    card.append(heading, scoreBlock, meta, note, actions);
    fragment.appendChild(card);
  });
  els.vendorGrid.appendChild(fragment);
}

function getVendorCandidates() {
  const normalized = els.vendorFilter.value.trim().toLowerCase();
  const category = els.vendorCategory.value;
  const tier = els.vendorSponsorTier.value;
  const kind = els.vendorKind.value;
  const hasUrl = els.vendorHasUrl.value;
  const title = getVendorSearchTitle();

  return COMPANIES
    .filter(company => {
      if (kind !== "all" && company.companyKind !== kind) {
        return false;
      }
      if (category !== "all" && company.category !== category) {
        return false;
      }
      if (tier !== "all" && company.sponsorTier !== tier) {
        return false;
      }
      if (hasUrl === "with-url" && !getCompanyCareersUrl(company)) {
        return false;
      }
      if (hasUrl === "missing-url" && getCompanyCareersUrl(company)) {
        return false;
      }
      if (!normalized) {
        return true;
      }
      return [
        company.name,
        company.category,
        company.tags.join(" "),
        company.aliases.join(" "),
        company.sponsorTier,
        company.companyKind
      ].join(" ").toLowerCase().includes(normalized);
    })
    .sort((a, b) => getVendorFitScore(b, title) - getVendorFitScore(a, title) || a.rank - b.rank);
}

function getVendorSearchTitle() {
  const typed = parseTitles(els.vendorRole.value)[0]
    || parseTitles(els.companyRole.value)[0]
    || parseTitles(els.jobTitle.value)[0];
  if (typed) {
    return typed;
  }
  return getRolePack(els.companyRolePack.value || els.rolePackSelect.value).primary;
}

function getVendorContext() {
  const titleWasTyped = Boolean(parseTitles(els.vendorRole.value)[0] || parseTitles(els.companyRole.value)[0] || parseTitles(els.jobTitle.value)[0]);
  return {
    ...getContext(),
    rolePack: els.companyRolePack.value || els.rolePackSelect.value,
    hasTypedTitle: titleWasTyped,
    time: "24hours",
    sort: "latest",
    location: els.vendorLocation.value,
    matchMode: "smart"
  };
}

function getVendorFitScore(company, title) {
  const tierScores = { top: 28, strong: 22, moderate: 14, curated: 6 };
  let score = 18;
  score += tierScores[company.sponsorTier] || 0;
  score += Math.min(24, Math.round((company.h1bFilings || 0) / 25));
  score += company.companyKind === "vendor" ? 18 : 5;
  score += roleMatchesVendor(company, title) ? 16 : 0;
  score += getCompanyCareersUrl(company) ? 10 : 0;
  if (company.tags.some(tag => /staff|consult|talent|recruit|technology|data|cloud|software/i.test(tag))) {
    score += 4;
  }
  return Math.min(100, score);
}

function roleMatchesVendor(company, title) {
  const normalizedTitle = String(title || "").toLowerCase();
  const haystack = [
    company.name,
    company.category,
    company.tags.join(" "),
    company.aliases.join(" ")
  ].join(" ").toLowerCase();
  const signals = [
    { title: /software|developer|engineer|devops|sre/, terms: ["software", "technology", "engineering", "cloud"] },
    { title: /data|analytics|analyst|business intelligence|bi|sql/, terms: ["data", "analytics", "business intelligence", "sql", "finance"] },
    { title: /ai|machine learning|ml|research|scientist/, terms: ["ai", "machine learning", "data", "research", "cloud"] },
    { title: /cloud|security|cyber|network/, terms: ["cloud", "security", "networking", "infrastructure"] },
    { title: /product|business systems|operations/, terms: ["product", "operations", "business", "enterprise"] }
  ];
  return signals.some(signal => signal.title.test(normalizedTitle) && signal.terms.some(term => haystack.includes(term)));
}

function getVendorLinks(company, title, context) {
  const vendorContext = {
    ...context,
    includeTerms: mergeUnique(context.includeTerms, [company.name])
  };
  return {
    site: getCompanyCareersUrl(company) || buildVendorContactSearchUrl(company, title, context),
    linkedinRecruiters: buildLinkedInRecruiterSearchUrl(company, title, context),
    linkedinJobs: buildLinkedInJobsUrl(title, vendorContext),
    indeed: buildIndeedUrl(title, vendorContext),
    googleContact: buildVendorContactSearchUrl(company, title, context),
    googleJobs: buildCompanySearchUrl(company, title, context)
  };
}

function createVendorLink(label, url) {
  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener";
  link.textContent = label;
  return link;
}

function createVendorCopyButton(company, title, context) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = "Copy Message";
  button.addEventListener("click", () => {
    copyLinks([buildVendorOutreachMessage(company, title, context, "initial")], "Copied vendor message");
  });
  return button;
}

function buildLinkedInRecruiterSearchUrl(company, title, context) {
  const keywords = [
    company.name,
    "recruiter",
    "technical recruiter",
    title,
    getLocationLabel(context.location)
  ].join(" ");
  const params = new URLSearchParams();
  params.set("keywords", keywords);
  params.set("origin", "GLOBAL_SEARCH_HEADER");
  return `https://www.linkedin.com/search/results/people/?${params.toString()}`;
}

function buildLinkedInCompanySearchUrl(company) {
  const params = new URLSearchParams();
  params.set("keywords", company.name);
  params.set("origin", "GLOBAL_SEARCH_HEADER");
  return `https://www.linkedin.com/search/results/companies/?${params.toString()}`;
}

function buildGoogleCompanyProfileSearchUrl(company, title, context) {
  const query = [
    buildCompanyNameExpression(company),
    title ? quoteTerm(title) : "",
    "(careers OR jobs OR hiring OR recruiters OR \"talent acquisition\")",
    getLocationQuery(context.location)
  ].filter(Boolean).join(" ");
  return buildGoogleUrl(query, context.time || "24hours", context.sort || "latest");
}

function buildVendorContactSearchUrl(company, title, context) {
  const query = [
    buildCompanyNameExpression(company),
    "(recruiter OR \"technical recruiter\" OR \"talent acquisition\" OR contact OR careers)",
    quoteTerm(title),
    getLocationQuery(context.location),
    "(staffing OR consulting OR hiring OR jobs)"
  ].filter(Boolean).join(" ");
  return buildGoogleUrl(query, "all", "coverage");
}

function copyTopVendorPacket() {
  const title = getVendorSearchTitle();
  const context = getVendorContext();
  const vendors = state.visibleVendors.length ? state.visibleVendors : getVendorCandidates();
  if (!vendors.length) {
    showToast("No vendors to copy");
    return;
  }
  const packet = vendors.slice(0, 10).flatMap(company => {
    const links = getVendorLinks(company, title, context);
    return [
      `${company.name} - fit ${getVendorFitScore(company, title)} - ${FILTER_LABELS.sponsorTier[company.sponsorTier] || company.sponsorTier}`,
      `Site: ${links.site}`,
      `LinkedIn recruiters: ${links.linkedinRecruiters}`,
      `LinkedIn jobs: ${links.linkedinJobs}`,
      `Indeed: ${links.indeed}`,
      `Google contact: ${links.googleContact}`,
      buildVendorOutreachMessage(company, title, context, "initial"),
      buildVendorOutreachMessage(company, title, context, "followup"),
      buildVendorOutreachMessage(company, title, context, "resume"),
      buildVendorOutreachMessage(company, title, context, "authorization")
    ];
  });
  copyLinks(packet, `Copied top ${Math.min(10, vendors.length)} vendor packet`);
}

function openTopVendorSearches() {
  const title = getVendorSearchTitle();
  const context = getVendorContext();
  const vendors = (state.visibleVendors.length ? state.visibleVendors : getVendorCandidates()).slice(0, 5);
  if (!vendors.length) {
    showToast("No vendor searches to open");
    return;
  }
  vendors.forEach(company => window.open(buildLinkedInRecruiterSearchUrl(company, title, context), "_blank", "noopener"));
  showToast(`Opened ${vendors.length} vendor recruiter searches`);
}

function buildVendorOutreachMessage(company, title, context, type) {
  const location = getLocationLabel(context.location);
  const role = title || getVendorSearchTitle();
  const vendorName = company.name;
  switch (type) {
    case "followup":
      return `Hi [Recruiter Name], following up on my note about ${role} roles through ${vendorName}. I am available for US-based full-time or contract opportunities and can send my resume, availability, and work authorization details. Please let me know if you have any matching client openings.`;
    case "resume":
      return `Hi [Recruiter Name], attaching my resume for ${role} openings in ${location}. I am targeting roles aligned with my background and can interview quickly. Please share the client, work setting, contract/full-time type, pay range, and next steps if my profile matches.`;
    case "authorization":
      return `For work authorization: I am an F-1 OPT candidate with US work authorization. My role must be related to my field of study. For STEM OPT, I will need the employer/payroll setup to support the required training-plan process and E-Verify where applicable.`;
    default:
      return `Hi [Recruiter Name], I am Taran, an OPT work-authorized candidate targeting ${role} roles in ${location}. I am open to relevant full-time and contract opportunities through ${vendorName}. If your team supports OPT-friendly client roles, could we connect? I can share my resume, availability, and work authorization details.`;
  }
}

function toggleFavoriteCompany() {
  if (isAllCompaniesSelected()) {
    return;
  }

  const company = getSelectedCompany();
  if (!company) {
    return;
  }
  toggleFavoriteCompanyById(company.id);
}

function toggleFavoriteCompanyById(companyId, forceFavorite) {
  const company = COMPANIES.find(item => item.id === companyId);
  if (!company) {
    return;
  }
  const shouldFavorite = typeof forceFavorite === "boolean" ? forceFavorite : !state.favoriteCompanies.has(company.id);
  if (shouldFavorite) {
    state.favoriteCompanies.add(company.id);
  } else {
    state.favoriteCompanies.delete(company.id);
  }
  persistFavoriteCompanies(`${company.name} ${shouldFavorite ? "added to favorites" : "removed from favorites"}`);
}

function persistFavoriteCompanies(message) {
  savePreferences({ replaceProtectedVault: true });
  renderCompanyOptions(els.companyFilter.value);
  renderFavoriteCompanies();
  syncCompanyCard();
  updateAddressBar(getSearchTitles(), getContext(), "replace");
  if (message) {
    showToast(message);
  }
}

function getCompanySearchTitle() {
  const typed = parseTitles(els.companyRole.value)[0] || parseTitles(els.jobTitle.value)[0];
  if (typed) {
    return typed;
  }
  return getRolePack(els.companyRolePack.value || els.rolePackSelect.value).primary;
}

function getCompanyContext() {
  const hasCompanyTypedTitle = Boolean(parseTitles(els.companyRole.value)[0] || parseTitles(els.jobTitle.value)[0]);
  return {
    ...getContext(),
    rolePack: els.companyRolePack.value || els.rolePackSelect.value,
    hasTypedTitle: hasCompanyTypedTitle,
    time: els.companyTimeFilter.value,
    sort: els.companySortSelect.value === "latest" ? "latest" : "coverage",
    experience: els.companyExperienceSelect.value,
    location: els.companyLocationSelect.value,
    remoteMode: els.companyRemoteMode.value,
    employment: els.companyEmploymentSelect.value,
    authorization: els.companyAuthorizationSelect.value,
    includeTerms: mergeUnique(parseTermList(els.includeTerms.value), parseTermList(els.companyIncludeTerms.value)),
    excludeTerms: mergeUnique(parseTermList(els.excludeTerms.value), parseTermList(els.companyExcludeTerms.value))
  };
}

function getCompanySearchRows(title, context) {
  return state.visibleCompanies.map(company => ({
    company,
    searchUrl: buildCompanySearchUrl(company, title, context)
  }));
}

function buildCompanySearchUrl(company, title, context) {
  const query = [
    buildTitleExpression(title, context),
    buildCompanyNameExpression(company),
    getLocationQuery(context.location),
    "(job OR jobs OR careers OR hiring OR openings)",
    getAuthorizationQuery(context.authorization),
    getFreshPostingSignalQuery(context.time),
    buildIncludeQuery(context.includeTerms),
    buildExcludeQuery([...context.excludeTerms, ...getCautionExcludes(context)])
  ].filter(Boolean).join(" ");
  const careersUrl = getCompanyCareersUrl(company);
  const siteSearch = careersUrl ? urlToSiteScope(careersUrl) : "";
  return buildGoogleUrl(query, context.time, context.sort, siteSearch ? { siteSearch } : {});
}

function buildCompanyCustomLinkUrls(company, title, context) {
  const templates = parseCustomTemplateInput(els.companyCustomLinkUrl.value, els.companyCustomLinkName.value, "Custom Link");
  if (!templates.length) {
    return [];
  }
  const companyContext = {
    ...context,
    includeTerms: mergeUnique(context.includeTerms, [company.name])
  };
  return templates.map(template => {
    const url = buildCustomTemplateUrl(template.url, {
      title,
      query: buildBoardKeywordQuery(title, companyContext, { includeAuthorization: true }),
      location: getNativeLocation(context.location),
      time: getTimeLabel(context.time),
      company: company.name
    });
    return url ? { ...template, url } : null;
  }).filter(Boolean);
}

function buildCompanyCustomLinkUrl(company, title, context) {
  return buildCompanyCustomLinkUrls(company, title, context)[0]?.url || "";
}

function buildCompanyNameExpression(company) {
  const names = [company.name, ...(company.aliases || [])].slice(0, 4).map(quoteTerm);
  return names.length > 1 ? `(${names.join(" OR ")})` : names[0];
}

function urlToSiteScope(url) {
  if (!url) {
    return "";
  }
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.replace(/^www\./, "");
    const path = parsed.pathname && parsed.pathname !== "/" ? parsed.pathname.replace(/\/$/, "") : "";
    return `${host}${path}`;
  } catch (error) {
    return url.replace(/^https?:\/\//, "").replace(/\/$/, "");
  }
}

function urlToSiteHost(url) {
  if (!url) {
    return "";
  }
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch (error) {
    return url.replace(/^https?:\/\//, "").split("/")[0].replace(/^www\./, "");
  }
}

function getOpenBatchSize() {
  return parseInt(els.openBatchSize.value, 10) || 5;
}

function getUncheckedResults() {
  return state.results.filter(item => !state.checked.has(item.key));
}

function getHighValueResults() {
  return getUncheckedResults()
    .filter(item => !item.badges || !item.badges.includes("optional/noisy") || (item.opportunityScore || 0) >= 75)
    .sort((a, b) => (b.opportunityScore || 0) - (a.opportunityScore || 0) || (b.portal.priority || 0) - (a.portal.priority || 0) || a.portal.order - b.portal.order);
}

// Keeps the batch button honest: "Open Top N" before anything is checked,
// "Open Next N" once a batch has been opened, disabled when nothing is left.
function syncBatchControls() {
  const unchecked = getUncheckedResults();
  const highValue = getHighValueResults();
  const size = getOpenBatchSize();
  const label = state.checked.size === 0 ? "Open Top" : "Open Next";
  els.openBatchButton.textContent = `${label} ${Math.min(size, unchecked.length) || size}`;
  els.openBatchButton.disabled = unchecked.length === 0;
  els.openAllButton.textContent = unchecked.length ? `Open All Links (${unchecked.length})` : "Open All Links";
  els.openAllButton.disabled = unchecked.length === 0;
  els.openHighValueBatchButton.textContent = highValue.length ? `Open High-Value ${Math.min(size, highValue.length)}` : "Open High-Value Batch";
  els.openHighValueBatchButton.disabled = highValue.length === 0;
  els.copyApplicationPacketButton.disabled = state.results.length === 0;
}

function openLinkBatch(items, doneMessage) {
  items.forEach(item => {
    state.checked.add(item.key);
    window.open(item.url, "_blank", "noopener");
  });
  savePreferences();
  renderResults();
  updateCounts();
  const remaining = getUncheckedResults().length;
  showToast(`${doneMessage}${remaining ? ` - ${remaining} left` : " - all done"}`);
}

function openNextBatch() {
  const next = getUncheckedResults().slice(0, getOpenBatchSize());
  if (!next.length) {
    showToast("All links opened. Run a new search or uncheck rows.");
    return;
  }
  openLinkBatch(next, `Opened ${next.length} links`);
}

function openHighValueBatch() {
  const next = getHighValueResults().slice(0, getOpenBatchSize());
  if (!next.length) {
    showToast("No high-value links left. Run a new search or uncheck rows.");
    return;
  }
  openLinkBatch(next, `Opened ${next.length} high-value links`);
}

function openAllLinks() {
  const unchecked = getUncheckedResults();
  if (!unchecked.length) {
    showToast("All links opened. Run a new search or uncheck rows.");
    return;
  }
  if (unchecked.length > 15 && !window.confirm(`This will open ${unchecked.length} tabs at once. Continue?`)) {
    return;
  }
  openLinkBatch(unchecked, `Opened all ${unchecked.length} links`);
}

function copyApplicationPacket() {
  if (!state.results.length) {
    showToast("Run a search first");
    return;
  }
  const context = getContext();
  const titles = getSearchTitles();
  const checked = state.results.filter(item => state.checked.has(item.key));
  const selected = checked.length ? checked : getHighValueResults().slice(0, getOpenBatchSize());
  const favorites = COMPANIES.filter(company => state.favoriteCompanies.has(company.id))
    .sort((a, b) => getCompanyRecommendationScore(b) - getCompanyRecommendationScore(a) || a.rank - b.rank)
    .slice(0, 5);
  const favoriteLinks = favorites.flatMap(company => [
    `${company.name} careers: ${getCompanyCareersUrl(company)}`,
    `${company.name} LinkedIn Jobs: ${getCompanyActionUrls(company, getCompanySearchTitle(), getCompanyContext(), "linkedinJobs")[0]}`
  ]).filter(Boolean);

  const packet = [
    "Taran's Fast Apply Packet",
    `Role: ${titles.join(", ")}`,
    `Profile: ${PROFILE_LABELS[context.profile] || context.profile}`,
    `Preset: ${SEARCH_PRESET_LABELS[els.searchPresetSelect.value] || "None"}`,
    `Location: ${getLocationLabel(context.location)}`,
    `Freshness: ${getTimeLabel(context.time)}`,
    `Search mode: ${FILTER_LABELS.queryStyle[context.queryStyle] || context.queryStyle} / ${FILTER_LABELS.sort[context.sort] || context.sort}`,
    "",
    "Top links:",
    ...selected.map(item => `${item.portal.name} | Fit ${item.opportunityScore || 0} | ${item.url}`),
    "",
    "Favorite company links:",
    ...(favoriteLinks.length ? favoriteLinks : ["No favorite companies pinned yet."]),
    "",
    "OPT wording:",
    "I am an F-1 OPT candidate with current US work authorization. My role must be related to my field of study. For STEM OPT, I will need an employer/payroll setup that supports the required training-plan process and E-Verify where applicable.",
    "",
    "Follow-up reminders:",
    "- Apply within the first hour where possible.",
    "- Verify recruiter domain, company site, client/job details, pay range, and payroll employer.",
    "- Never pay a vendor/recruiter placement fee or accept fake-check/equipment-payment instructions."
  ];

  copyLinks(packet, "Copied application packet");
}

function copyCompanyVaultBackup() {
  savePreferences();
  copyLinks([JSON.stringify(readCompanyVault(), null, 2)], "Copied company link vault backup");
}

async function restoreCompanyVaultBackup() {
  const raw = await requestTextInput({
    title: "Restore Company Link Vault",
    message: "Paste the Company Link Vault backup JSON. Existing saved links and favorites are merged, not wiped.",
    multiline: true,
    placeholder: "{ \"customCompanyCareers\": { ... } }"
  });
  if (!raw || !raw.trim()) {
    return;
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    showToast("Invalid company vault JSON");
    return;
  }
  const vault = normalizeCompanyVault(parsed);
  const hasData = vault.favoriteCompanies.length || vault.pinnedPortals.length || Object.keys(vault.customCompanyCareers).length;
  if (!hasData) {
    showToast("No company vault data found");
    return;
  }
  mergeCompanyVaultIntoState(vault);
  savePreferences({ replaceProtectedVault: true });
  renderCompanyOptions(els.companyFilter.value);
  renderFavoriteCompanies();
  syncCompanyCard();
  renderSponsorGrid();
  renderVendorOutreach();
  renderPinnedOperators();
  updateAddressBar(getSearchTitles(), getContext(), "replace");
  showToast("Company link vault restored");
}

function exportSettings() {
  savePreferences();
  const payload = {
    exportedAt: new Date().toISOString(),
    settings: getStoredJson(STORAGE_KEY) || {},
    companyVault: readCompanyVault()
  };
  copyLinks([JSON.stringify(payload, null, 2)], "Copied settings and company vault JSON");
}

async function importSettings() {
  const raw = await requestTextInput({
    title: "Import Settings",
    message: "Paste settings JSON exported from another browser. Company vault data is merged when included.",
    multiline: true,
    placeholder: "{ \"settings\": { ... }, \"companyVault\": { ... } }"
  });
  if (!raw || !raw.trim()) {
    return;
  }
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("not an object");
    }
    const settings = parsed.settings && typeof parsed.settings === "object" ? parsed.settings : parsed;
    const companyVault = parsed.companyVault ? normalizeCompanyVault(parsed.companyVault) : normalizeCompanyVault(parsed);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    if (companyVault.favoriteCompanies.length || companyVault.pinnedPortals.length || Object.keys(companyVault.customCompanyCareers).length) {
      localStorage.setItem(COMPANY_VAULT_KEY, JSON.stringify(companyVault));
      localStorage.setItem(COMPANY_VAULT_BACKUP_KEY, JSON.stringify(companyVault));
    }
  } catch (error) {
    showToast("Invalid settings JSON");
    return;
  }
  window.location.replace(window.location.pathname);
}

async function copyLinks(links, message) {
  if (!links.length) {
    return;
  }
  try {
    await navigator.clipboard.writeText(links.join("\n"));
    showToast(message);
  } catch (error) {
    showToast("Copy failed. Select and copy from the address bar.");
  }
}

function showToast(message) {
  els.toast.textContent = message;
  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => {
    els.toast.textContent = "";
  }, 2200);
}

function applyMinuteRadarFlow() {
  els.profileSelect.value = "minuteRadar";
  applyProfile("minuteRadar");
  applyPrecision("minuteRadar");
  syncProfileDescription();
  generateResults();
  window.scrollTo({ top: 0, behavior: "smooth" });
  showToast("Minute Radar search ready");
}

function applyQuickApplyFlow() {
  els.profileSelect.value = "dailyQuickApply";
  applyProfile("dailyQuickApply");
  syncProfileDescription();
  generateResults();
  window.scrollTo({ top: 0, behavior: "smooth" });
  showToast("Daily Quick Apply ready");
}

function applyFastApplyRoutine() {
  els.profileSelect.value = "fastApplyRoutine";
  applyProfile("fastApplyRoutine");
  setSelectIfValid(els.engineSelect, "google");
  rebuildTimeOptions("google", "1hour");
  setSelectIfValid(els.timeFilter, "1hour");
  setSelectIfValid(els.sortSelect, "latest");
  setSelectIfValid(els.experienceSelect, "entry");
  setSelectIfValid(els.authorizationSelect, "none");
  setSelectIfValid(els.matchMode, "smart");
  setSelectIfValid(els.queryStyleSelect, "balanced");
  setCategorySelection(new Set(["top", "direct", "signals", "general", "tech"]));
  syncProfileDescription();
  generateResults();
  setDailyChecklistItem("fastApply", true);
  window.scrollTo({ top: 0, behavior: "smooth" });
  showToast("Fast Apply Routine ready");
}

function applyFreshDirectFlow() {
  els.profileSelect.value = "freshDirect";
  applyProfile("freshDirect");
  applyPrecision("direct");
  syncProfileDescription();
  generateResults();
  window.scrollTo({ top: 0, behavior: "smooth" });
  showToast("Fresh ATS search ready");
}

function applyLatestOneHourFlow() {
  els.profileSelect.value = "latest1";
  applyProfile("latest1");
  applyPrecision("latest1");
  generateResults();
  setDailyChecklistItem("latest1", true);
  window.scrollTo({ top: 0, behavior: "smooth" });
  showToast("Latest 1h search ready");
}

function resetSearch() {
  els.jobTitle.value = "";
  els.profileSelect.value = DEFAULT_PROFILE_ID;
  els.rolePackSelect.value = DEFAULT_ROLE_PACK_ID;
  els.searchPresetSelect.value = "";
  els.engineSelect.value = "google";
  rebuildTimeOptions("google", "all");
  els.locationSelect.value = "usa";
  els.sortSelect.value = "coverage";
  els.remoteMode.value = "neutral";
  els.matchMode.value = "smart";
  els.queryStyleSelect.value = "balanced";
  els.experienceSelect.value = "entry";
  els.employmentSelect.value = "any";
  els.authorizationSelect.value = "none";
  els.customQuery.value = "";
  els.customSourceName.value = "";
  els.customSourceUrl.value = "";
  els.includeTerms.value = "";
  els.excludeTerms.value = "";
  els.cautionExcludes.checked = false;
  els.strictTitle.checked = false;
  els.companyRole.value = "";
  els.companyRolePack.value = DEFAULT_ROLE_PACK_ID;
  els.companyTimeFilter.value = "24hours";
  els.companyExperienceSelect.value = "entry";
  els.companyLocationSelect.value = "usa";
  els.companyRemoteMode.value = "neutral";
  els.companyEmploymentSelect.value = "any";
  els.companyAuthorizationSelect.value = "none";
  els.companyIncludeTerms.value = "";
  els.companyExcludeTerms.value = "";
  els.companyCustomLinkName.value = "";
  els.companyCustomLinkUrl.value = "";
  els.companySortSelect.value = "latest";
  els.companyCategorySelect.value = "all";
  els.companySponsorTier.value = "all";
  els.companyKind.value = "all";
  els.companyFilter.value = "";
  els.vendorRole.value = "";
  els.vendorFilter.value = "";
  els.vendorLocation.value = "usa";
  els.vendorSponsorTier.value = "all";
  els.vendorCategory.value = "all";
  els.vendorKind.value = "vendor";
  els.vendorHasUrl.value = "all";
  setCategorySelection(new Set(DEFAULT_CATEGORY_IDS));
  renderCompanyOptions("");
  renderVendorOutreach();
  els.companySelect.value = ALL_COMPANIES_ID;
  syncCompanyCard();
  syncProfileDescription();
  state.results = [];
  state.checked.clear();
  els.results.innerHTML = "";
  const emptyMessage = els.emptyState.querySelector("strong");
  if (emptyMessage) {
    emptyMessage.textContent = "Ready when you are, Taran.";
  }
  setEmptyState(true);
  updateCounts();
  updatePreviewForEmptyState();
  savePreferences();
  history.pushState(null, "", window.location.pathname);
}

function toggleTheme() {
  document.documentElement.classList.toggle("dark");
  localStorage.setItem(THEME_KEY, document.documentElement.classList.contains("dark") ? "dark" : "light");
  syncThemeButton();
}

function loadTheme() {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === "light") {
    document.documentElement.classList.remove("dark");
  } else {
    document.documentElement.classList.add("dark");
  }
  syncThemeButton();
}

function syncThemeButton() {
  const isDark = document.documentElement.classList.contains("dark");
  els.themeToggle.textContent = isDark ? "Light mode" : "Dark mode";
  els.themeToggle.setAttribute("aria-pressed", String(isDark));
}

function slugify(value) {
  return value
    .toLowerCase()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

