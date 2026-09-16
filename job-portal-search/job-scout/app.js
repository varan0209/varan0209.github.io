"use strict";

const STORAGE_KEY = "taranJobScoutVaultV1";
const BACKUP_KEY = "taranJobScoutVaultBackupV1";
const JOB_STATUSES = ["Unopened", "Viewed", "Applied", "Interviewing", "Rejected", "Ignore", "Expired"];
const ACTIVE_STATUSES = ["Unopened", "Viewed", "Applied", "Interviewing"];
const STATUS_RANK = new Map(JOB_STATUSES.map((status, index) => [status, index]));
const LIVE_FEED_URL = "data/live-jobs.json";
const STOP_WORDS = new Set([
  "and", "the", "for", "with", "from", "that", "this", "you", "your", "are", "was", "were", "will", "have", "has", "had",
  "not", "but", "our", "their", "they", "them", "his", "her", "who", "what", "when", "where", "why", "how", "about",
  "into", "over", "under", "than", "then", "can", "may", "all", "any", "use", "using", "used", "work", "job", "jobs",
  "role", "roles", "team", "teams", "company", "experience", "years", "skills", "skill", "ability", "including"
]);

const state = {
  candidates: [],
  liveJobs: [],
  liveMeta: null,
  selectedCandidateId: "",
  checkedSources: new Set(["linkedinJobs", "indeed", "googleFresh", "directAts", "linkedinPosts"]),
  pinnedSources: new Set(["linkedinJobs", "indeed", "googleFresh"]),
  theme: "dark"
};

const els = {};

document.addEventListener("DOMContentLoaded", () => {
  cacheElements();
  loadVault();
  hydrateFromUrl();
  bindEvents();
  renderAll();
  loadLiveJobs();
  saveVault();
});

function cacheElements() {
  Object.assign(els, {
    vaultStatus: document.getElementById("vaultStatus"),
    themeToggle: document.getElementById("themeToggle"),
    targetRoles: document.getElementById("targetRoles"),
    roleVariants: document.getElementById("roleVariants"),
    skillTerms: document.getElementById("skillTerms"),
    locationTerms: document.getElementById("locationTerms"),
    domainTerms: document.getElementById("domainTerms"),
    prioritySignals: document.getElementById("prioritySignals"),
    levelTerms: document.getElementById("levelTerms"),
    authTerms: document.getElementById("authTerms"),
    titleExcludes: document.getElementById("titleExcludes"),
    industryExcludes: document.getElementById("industryExcludes"),
    minBaseUsd: document.getElementById("minBaseUsd"),
    workSetting: document.getElementById("workSetting"),
    minScore: document.getElementById("minScore"),
    freshness: document.getElementById("freshness"),
    customSources: document.getElementById("customSources"),
    resumeText: document.getElementById("resumeText"),
    resumeKeywords: document.getElementById("resumeKeywords"),
    resumeFileInput: document.getElementById("resumeFileInput"),
    resumeInsights: document.getElementById("resumeInsights"),
    analyzeResumeButton: document.getElementById("analyzeResumeButton"),
    copySignalPackButton: document.getElementById("copySignalPackButton"),
    clearResumeButton: document.getElementById("clearResumeButton"),
    saveProfileButton: document.getElementById("saveProfileButton"),
    copySyncButton: document.getElementById("copySyncButton"),
    liveFeedStatus: document.getElementById("liveFeedStatus"),
    liveStats: document.getElementById("liveStats"),
    liveJobGrid: document.getElementById("liveJobGrid"),
    liveMinScore: document.getElementById("liveMinScore"),
    liveSourceFilter: document.getElementById("liveSourceFilter"),
    liveOnlyFresh: document.getElementById("liveOnlyFresh"),
    reloadLiveJobsButton: document.getElementById("reloadLiveJobsButton"),
    importTopLiveButton: document.getElementById("importTopLiveButton"),
    openTopLiveButton: document.getElementById("openTopLiveButton"),
    copyLiveJobsButton: document.getElementById("copyLiveJobsButton"),
    sourceGrid: document.getElementById("sourceGrid"),
    openTopSearchesButton: document.getElementById("openTopSearchesButton"),
    openSelectedSearchesButton: document.getElementById("openSelectedSearchesButton"),
    copySearchesButton: document.getElementById("copySearchesButton"),
    copyPromptButton: document.getElementById("copyPromptButton"),
    leadTitle: document.getElementById("leadTitle"),
    leadCompany: document.getElementById("leadCompany"),
    leadLocation: document.getElementById("leadLocation"),
    leadWorkSetting: document.getElementById("leadWorkSetting"),
    leadPosted: document.getElementById("leadPosted"),
    leadSource: document.getElementById("leadSource"),
    leadCompensation: document.getElementById("leadCompensation"),
    leadIndustry: document.getElementById("leadIndustry"),
    leadCompanyWebsite: document.getElementById("leadCompanyWebsite"),
    leadStatus: document.getElementById("leadStatus"),
    leadUrl: document.getElementById("leadUrl"),
    leadDescription: document.getElementById("leadDescription"),
    clearLeadButton: document.getElementById("clearLeadButton"),
    scoreLeadButton: document.getElementById("scoreLeadButton"),
    resultSort: document.getElementById("resultSort"),
    statusFilter: document.getElementById("statusFilter"),
    showOnlyPassed: document.getElementById("showOnlyPassed"),
    resultsGrid: document.getElementById("resultsGrid"),
    openApplyBatchButton: document.getElementById("openApplyBatchButton"),
    copyRankedButton: document.getElementById("copyRankedButton"),
    importLeadsButton: document.getElementById("importLeadsButton"),
    exportVaultButton: document.getElementById("exportVaultButton"),
    importVaultButton: document.getElementById("importVaultButton"),
    reviewBoard: document.getElementById("reviewBoard"),
    copyReviewButton: document.getElementById("copyReviewButton"),
    copyPacketButton: document.getElementById("copyPacketButton"),
    packetPreview: document.getElementById("packetPreview"),
    metricLeads: document.getElementById("metricLeads"),
    metricPassed: document.getElementById("metricPassed"),
    metricReady: document.getElementById("metricReady"),
    metricAvg: document.getElementById("metricAvg"),
    toast: document.getElementById("toast")
  });
}

function bindEvents() {
  [
    els.targetRoles,
    els.roleVariants,
    els.skillTerms,
    els.locationTerms,
    els.domainTerms,
    els.prioritySignals,
    els.levelTerms,
    els.authTerms,
    els.titleExcludes,
    els.industryExcludes,
    els.minBaseUsd,
    els.workSetting,
    els.minScore,
    els.freshness,
    els.customSources,
    els.resumeText,
    els.resumeKeywords
  ].forEach(control => {
    control.addEventListener("change", () => {
      saveVault();
      renderAll();
    });
  });

  els.saveProfileButton.addEventListener("click", () => {
    saveVault();
    renderAll();
    showToast("Scout profile saved");
  });
  els.analyzeResumeButton.addEventListener("click", analyzeResume);
  els.clearResumeButton.addEventListener("click", clearResume);
  els.copySignalPackButton.addEventListener("click", copySignalSearchPack);
  els.resumeFileInput.addEventListener("change", handleResumeFile);
  els.copySyncButton.addEventListener("click", copySyncLink);
  els.reloadLiveJobsButton.addEventListener("click", () => loadLiveJobs(true));
  els.importTopLiveButton.addEventListener("click", () => importTopLiveJobs(10));
  els.openTopLiveButton.addEventListener("click", () => openTopLiveJobs(10));
  els.copyLiveJobsButton.addEventListener("click", copyTopLiveJobs);
  [els.liveMinScore, els.liveSourceFilter, els.liveOnlyFresh].forEach(control => {
    control.addEventListener("change", renderLiveJobs);
  });
  els.openTopSearchesButton.addEventListener("click", openTopSearches);
  els.openSelectedSearchesButton.addEventListener("click", openSelectedSearches);
  els.copySearchesButton.addEventListener("click", copyAllSearches);
  els.copyPromptButton.addEventListener("click", copySearchPrompt);
  els.scoreLeadButton.addEventListener("click", scoreLeadFromForm);
  els.clearLeadButton.addEventListener("click", clearLeadForm);
  els.resultSort.addEventListener("change", renderResults);
  els.statusFilter.addEventListener("change", renderResults);
  els.showOnlyPassed.addEventListener("change", renderResults);
  els.openApplyBatchButton.addEventListener("click", openApplyBatch);
  els.copyRankedButton.addEventListener("click", copyRankedTable);
  els.importLeadsButton.addEventListener("click", importLeads);
  els.exportVaultButton.addEventListener("click", exportVault);
  els.importVaultButton.addEventListener("click", importVault);
  els.copyReviewButton.addEventListener("click", copyReviewSummary);
  els.copyPacketButton.addEventListener("click", copySelectedPacket);
  els.themeToggle.addEventListener("click", toggleTheme);
  window.addEventListener("beforeunload", saveVault);
}

function getProfile() {
  return {
    targetRoles: splitTerms(els.targetRoles.value),
    roleVariants: splitTerms(els.roleVariants.value),
    skills: splitTerms(els.skillTerms.value),
    locations: splitTerms(els.locationTerms.value),
    domains: splitTerms(els.domainTerms.value),
    prioritySignals: splitTerms(els.prioritySignals.value),
    levels: splitTerms(els.levelTerms.value),
    authTerms: splitTerms(els.authTerms.value),
    titleExcludes: splitTerms(els.titleExcludes.value),
    industryExcludes: splitTerms(els.industryExcludes.value),
    minBaseUsd: Number(els.minBaseUsd.value || 0),
    workSetting: els.workSetting.value,
    minScore: Number(els.minScore.value || 6),
    freshness: els.freshness.value,
    customSources: els.customSources.value,
    resumeText: els.resumeText.value,
    resumeKeywords: splitTerms(els.resumeKeywords.value)
  };
}

function splitTerms(value) {
  return String(value || "")
    .split(/\r?\n|,/)
    .map(item => item.trim())
    .filter(Boolean);
}

function loadVault() {
  const saved = normalizeVault(readJson(STORAGE_KEY));
  const backup = normalizeVault(readJson(BACKUP_KEY));
  const vault = {
    ...saved,
    candidates: mergeCandidates(backup.candidates, saved.candidates),
    checkedSources: [...new Set([...backup.checkedSources, ...saved.checkedSources])],
    pinnedSources: [...new Set([...backup.pinnedSources, ...saved.pinnedSources])]
  };
  applyVault(vault);
}

function readJson(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") || null;
  } catch (error) {
    return null;
  }
}

function normalizeVault(raw) {
  const source = raw || {};
  return {
    profile: source.profile && typeof source.profile === "object" ? source.profile : {},
    candidates: Array.isArray(source.candidates) ? source.candidates.filter(item => item && item.id) : [],
    selectedCandidateId: typeof source.selectedCandidateId === "string" ? source.selectedCandidateId : "",
    checkedSources: Array.isArray(source.checkedSources) ? source.checkedSources.filter(Boolean) : [],
    pinnedSources: Array.isArray(source.pinnedSources) ? source.pinnedSources.filter(Boolean) : [],
    theme: source.theme === "light" ? "light" : "dark",
    updatedAt: source.updatedAt || ""
  };
}

function applyVault(vault) {
  const profile = vault.profile || {};
  setValue(els.targetRoles, profile.targetRoles || els.targetRoles.value);
  setValue(els.roleVariants, profile.roleVariants || els.roleVariants.value);
  setValue(els.skillTerms, profile.skills || els.skillTerms.value);
  setValue(els.locationTerms, profile.locations || els.locationTerms.value);
  setValue(els.domainTerms, profile.domains || els.domainTerms.value);
  setValue(els.prioritySignals, profile.prioritySignals || els.prioritySignals.value);
  setValue(els.levelTerms, profile.levels || els.levelTerms.value);
  setValue(els.authTerms, profile.authTerms || els.authTerms.value);
  setValue(els.titleExcludes, profile.titleExcludes || els.titleExcludes.value);
  setValue(els.industryExcludes, profile.industryExcludes || els.industryExcludes.value);
  setValue(els.minBaseUsd, profile.minBaseUsd || els.minBaseUsd.value);
  setValue(els.workSetting, profile.workSetting || els.workSetting.value);
  setValue(els.minScore, profile.minScore || els.minScore.value);
  setValue(els.freshness, profile.freshness || els.freshness.value);
  setValue(els.customSources, profile.customSources || els.customSources.value);
  setValue(els.resumeText, profile.resumeText || els.resumeText.value);
  setValue(els.resumeKeywords, profile.resumeKeywords || els.resumeKeywords.value);
  state.candidates = mergeCandidates(state.candidates, vault.candidates || []);
  state.selectedCandidateId = vault.selectedCandidateId || state.selectedCandidateId;
  state.checkedSources = new Set(vault.checkedSources.length ? vault.checkedSources : Array.from(state.checkedSources));
  state.pinnedSources = new Set(vault.pinnedSources.length ? vault.pinnedSources : Array.from(state.pinnedSources));
  state.theme = vault.theme || state.theme;
  document.documentElement.classList.toggle("dark", state.theme !== "light");
  syncThemeButton();
}

function setValue(control, value) {
  if (Array.isArray(value)) {
    control.value = control.tagName === "TEXTAREA" ? value.join("\n") : value.join(", ");
    return;
  }
  if (control.tagName === "SELECT") {
    control.value = [...control.options].some(option => option.value === String(value)) ? String(value) : control.value;
    return;
  }
  control.value = value == null ? "" : String(value);
}

function saveVault() {
  const vault = {
    profile: getProfile(),
    candidates: state.candidates,
    selectedCandidateId: state.selectedCandidateId,
    checkedSources: Array.from(state.checkedSources),
    pinnedSources: Array.from(state.pinnedSources),
    theme: state.theme,
    updatedAt: new Date().toISOString()
  };
  const serialized = JSON.stringify(vault);
  localStorage.setItem(STORAGE_KEY, serialized);
  localStorage.setItem(BACKUP_KEY, serialized);
  syncVaultStatus(vault);
}

function hydrateFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get("scout");
  if (!token) {
    return;
  }
  const decoded = decodeToken(token);
  if (!decoded) {
    showToast("Scout sync link could not be read");
    return;
  }
  applyVault(normalizeVault(decoded));
  saveVault();
  showToast("Scout sync loaded");
}

function syncVaultStatus(vault = normalizeVault(readJson(STORAGE_KEY))) {
  const passed = getScoredCandidates().filter(item => item.score >= getProfile().minScore).length;
  els.vaultStatus.textContent = `${vault.candidates.length} leads, ${passed} passed, saved ${formatTime(vault.updatedAt)}`;
}

function renderAll() {
  renderResumeInsights();
  renderLiveJobs();
  renderSources();
  rescoreAll();
  renderResults();
  renderReviewBoard();
  renderPacket();
}

async function loadLiveJobs(force = false) {
  if (!els.liveFeedStatus) return;
  els.liveFeedStatus.textContent = "Loading live jobs...";
  try {
    const url = force ? `${LIVE_FEED_URL}?t=${Date.now()}` : LIVE_FEED_URL;
    const response = await fetch(url, { cache: "no-store" });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const payload = await response.json();
    state.liveMeta = normalizeLiveMeta(payload);
    state.liveJobs = (payload.jobs || [])
      .map(job => normalizeLiveJob(job, payload.generatedAt))
      .filter(job => job.title && job.company && job.url);
    updateLiveSourceOptions();
    renderLiveJobs();
    const count = state.liveJobs.length;
    els.liveFeedStatus.textContent = `${count} live jobs loaded`;
    if (force) showToast(`Reloaded ${count} live jobs`);
  } catch (error) {
    state.liveMeta = {
      generatedAt: "",
      sourceStatuses: [],
      errors: [String(error?.message || error)]
    };
    state.liveJobs = [];
    renderLiveJobs();
    els.liveFeedStatus.textContent = "Live feed unavailable";
  }
}

function normalizeLiveMeta(payload = {}) {
  return {
    generatedAt: payload.generatedAt || "",
    profileName: payload.profile?.name || "Taran Mamidala",
    profileSummary: payload.profile?.summary || "",
    sourceStatuses: Array.isArray(payload.sourceStatuses) ? payload.sourceStatuses : [],
    stats: payload.stats || {},
    errors: Array.isArray(payload.errors) ? payload.errors : []
  };
}

function normalizeLiveJob(job, generatedAt) {
  const candidate = {
    id: "",
    title: firstText(job.title, job.role),
    company: firstText(job.company, job.companyName, job.organization),
    location: firstText(job.location, job.locations, "United States"),
    workSetting: normalizeWorkSettingValue(firstText(job.workSetting, job.remote, job.workplace)),
    posted: normalizePosted(firstText(job.postedLabel, job.postedAt, job.datePosted, job.createdAt)),
    postedAt: firstText(job.postedAt, job.datePosted, job.createdAt),
    source: firstText(job.source, job.sourceName, "Live Feed"),
    sourceType: firstText(job.sourceType, job.type, "live"),
    compensation: firstText(job.compensation, job.salary, job.pay),
    industry: firstText(job.industry, job.category, job.department, job.tags),
    companyWebsite: firstText(job.companyWebsite, job.companyUrl, job.company_url),
    status: "Unopened",
    url: firstText(job.url, job.applyUrl, job.apply_url),
    description: cleanLiveText(firstText(job.description, job.summary, job.snippet)),
    addedAt: generatedAt || new Date().toISOString(),
    liveFeedId: firstText(job.id, job.externalId),
    feedScore: Number(job.score || 0),
    feedReasons: Array.isArray(job.fitReasons) ? job.fitReasons : [],
    feedWarnings: Array.isArray(job.warnings) ? job.warnings : []
  };
  candidate.id = candidateId(candidate);
  return candidate;
}

function updateLiveSourceOptions() {
  if (!els.liveSourceFilter) return;
  const current = els.liveSourceFilter.value || "all";
  const sources = unique(state.liveJobs.map(job => job.source)).sort((a, b) => a.localeCompare(b));
  els.liveSourceFilter.innerHTML = "";
  const all = document.createElement("option");
  all.value = "all";
  all.textContent = `All live sources (${state.liveJobs.length})`;
  els.liveSourceFilter.append(all);
  sources.forEach(source => {
    const option = document.createElement("option");
    option.value = source;
    option.textContent = `${source} (${state.liveJobs.filter(job => job.source === source).length})`;
    els.liveSourceFilter.append(option);
  });
  els.liveSourceFilter.value = sources.includes(current) ? current : "all";
}

function getScoredLiveJobs() {
  const profile = getProfile();
  return state.liveJobs
    .map(job => scoreCandidate(job, profile))
    .map(job => ({
      ...job,
      feedScore: state.liveJobs.find(item => item.id === job.id)?.feedScore || 0,
      feedReasons: state.liveJobs.find(item => item.id === job.id)?.feedReasons || [],
      feedWarnings: state.liveJobs.find(item => item.id === job.id)?.feedWarnings || []
    }))
    .sort((a, b) => b.score - a.score || getLiveAgeMs(a) - getLiveAgeMs(b) || b.feedScore - a.feedScore);
}

function getVisibleLiveJobs() {
  const minScore = Number(els.liveMinScore?.value || 6);
  const source = els.liveSourceFilter?.value || "all";
  return getScoredLiveJobs()
    .filter(job => job.score >= minScore)
    .filter(job => source === "all" || job.source === source)
    .filter(job => !els.liveOnlyFresh?.checked || isFreshLiveJob(job))
    .slice(0, 80);
}

function isFreshLiveJob(job) {
  const age = getLiveAgeMs(job);
  if (!Number.isFinite(age)) {
    return ["minutes", "today", "24h"].includes(job.posted);
  }
  return age <= 48 * 60 * 60 * 1000;
}

function getLiveAgeMs(job) {
  const value = Date.parse(job.postedAt || "");
  return Number.isFinite(value) ? Date.now() - value : Number.POSITIVE_INFINITY;
}

function renderLiveJobs() {
  if (!els.liveJobGrid) return;
  const visible = getVisibleLiveJobs();
  const total = state.liveJobs.length;
  const generated = state.liveMeta?.generatedAt ? formatTime(state.liveMeta.generatedAt) : "not generated yet";
  const sourceCount = unique(state.liveJobs.map(job => job.source)).length;
  const errorCount = (state.liveMeta?.errors || []).length + (state.liveMeta?.sourceStatuses || []).filter(item => item.status === "error").length;
  els.liveStats.textContent = `${visible.length} shown from ${total} collected jobs across ${sourceCount} sources. Feed generated: ${generated}.${errorCount ? ` ${errorCount} source warnings.` : ""}`;
  els.liveJobGrid.innerHTML = "";

  if (!total) {
    const empty = document.createElement("article");
    empty.className = "job-card live-empty-card";
    empty.innerHTML = "<h3>No live feed yet</h3><p>The scheduled collector will populate this page after the next GitHub Actions run. Use Reload Feed after deployment, or keep using Scout Links meanwhile.</p>";
    els.liveJobGrid.append(empty);
    return;
  }

  if (!visible.length) {
    const empty = document.createElement("article");
    empty.className = "job-card live-empty-card";
    empty.innerHTML = "<h3>No jobs match this live filter</h3><p>Lower the live threshold, show all sources, or turn off the 48-hour preference.</p>";
    els.liveJobGrid.append(empty);
    return;
  }

  visible.forEach(job => {
    const card = document.createElement("article");
    card.className = "job-card live-job-card";
    if (job.decision === "Apply First") card.classList.add("is-apply-first");

    const header = document.createElement("div");
    header.className = "company-header";
    header.append(renderCompanyAvatar(job.identity, job.company));
    const headerText = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = job.title;
    const company = document.createElement("p");
    company.textContent = job.company;
    headerText.append(title, company);
    header.append(headerText);

    const score = document.createElement("div");
    score.className = "score-number";
    score.textContent = `${job.score.toFixed(1)}/10`;

    const summary = document.createElement("p");
    summary.textContent = `${job.location || "Location unknown"} | ${formatPosted(job.posted)} | ${job.source} | ${job.workSetting || "setting unknown"}`;

    const meta = document.createElement("div");
    meta.className = "meta-row";
    meta.append(createPill(job.decision, job.decision === "Apply First" ? "pill-fit" : job.decision === "Review" ? "pill-domain" : "pill-warning"));
    meta.append(createPill(`Live ${liveAgeLabel(job)}`, "pill-fresh"));
    meta.append(createPill(job.sourceType || "live", "pill-domain"));
    meta.append(createPill(`Health ${job.healthScore}`, job.healthScore >= 70 ? "pill-fit" : job.healthScore >= 55 ? "pill-domain" : "pill-warning"));
    job.skillHits.slice(0, 5).forEach(skill => meta.append(createPill(skill, "pill-domain")));
    job.gaps.slice(0, 2).forEach(gap => meta.append(createPill(gap, "pill-warning")));

    const reasons = document.createElement("p");
    reasons.textContent = unique([...job.reasons.slice(0, 3), ...job.feedReasons.slice(0, 2)]).join(" | ");

    const actions = document.createElement("div");
    actions.className = "card-actions";
    actions.append(createLink("Open", job.url));
    actions.append(createButton("Import", () => importLiveJob(job)));
    actions.append(createButton("Copy Packet", () => copyPacket(job)));
    actions.append(createButton("Search Company", () => window.open(buildGoogleUrl(`${quote(job.company)} ${quote(job.title)} careers`, "week"), "_blank", "noopener")));

    card.append(header, score, summary, meta, reasons, actions);
    els.liveJobGrid.append(card);
  });
}

function liveAgeLabel(job) {
  const age = getLiveAgeMs(job);
  if (!Number.isFinite(age)) return formatPosted(job.posted);
  const minutes = Math.max(0, Math.round(age / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}

function cleanLiveText(value) {
  return String(value || "")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, "\"")
    .replace(/\s+/g, " ")
    .trim();
}

function importLiveJob(job) {
  const candidate = scoreCandidate({
    ...job,
    status: "Unopened",
    addedAt: new Date().toISOString()
  }, getProfile());
  state.candidates = mergeCandidates(state.candidates, [candidate]);
  state.selectedCandidateId = candidate.id;
  saveVault();
  renderAll();
  showToast(`Imported ${candidate.company}`);
}

function importTopLiveJobs(limit = 10) {
  const jobs = getVisibleLiveJobs().slice(0, limit);
  if (!jobs.length) {
    showToast("No live jobs to import");
    return;
  }
  const scored = jobs.map(job => scoreCandidate({
    ...job,
    status: "Unopened",
    addedAt: new Date().toISOString()
  }, getProfile()));
  state.candidates = mergeCandidates(state.candidates, scored);
  state.selectedCandidateId = scored[0]?.id || state.selectedCandidateId;
  saveVault();
  renderAll();
  showToast(`Imported ${scored.length} live jobs`);
}

function openTopLiveJobs(limit = 10) {
  const jobs = getVisibleLiveJobs().filter(job => job.url).slice(0, limit);
  if (!jobs.length) {
    showToast("No live jobs to open");
    return;
  }
  if (jobs.length > 8 && !window.confirm(`Open ${jobs.length} live job tabs?`)) {
    return;
  }
  jobs.forEach(job => window.open(job.url, "_blank", "noopener"));
  showToast(`Opened ${jobs.length} live jobs`);
}

function copyTopLiveJobs() {
  const jobs = getVisibleLiveJobs().slice(0, 25);
  if (!jobs.length) {
    showToast("No live jobs to copy");
    return;
  }
  const lines = [
    "Taran Live Job Scout - Top Matches",
    `Feed generated: ${state.liveMeta?.generatedAt || "unknown"}`,
    "",
    ...jobs.map((job, index) => [
      `${index + 1}. ${job.title} - ${job.company}`,
      `Fit: ${job.score.toFixed(1)}/10 | ${job.decision} | ${job.location || "Unknown"} | ${job.source} | ${liveAgeLabel(job)}`,
      `Apply: ${job.url}`,
      `Why: ${unique([...job.reasons.slice(0, 2), ...job.feedReasons.slice(0, 2)]).join(" | ")}`
    ].join("\n"))
  ];
  copyText(lines.join("\n\n"), `Copied ${jobs.length} live jobs`);
}

function getSourceDefinitions() {
  const profile = getProfile();
  const role = getPrimaryRole(profile);
  const location = getPrimaryLocation(profile);
  const custom = parseCustomSources(profile.customSources, profile, role, location);
  const builtIns = [
    {
      id: "linkedinJobs",
      name: "LinkedIn Jobs",
      note: "Native LinkedIn job search with fresh and entry-level filters.",
      health: "native clean",
      sourceType: "site",
      sourceQuality: 96,
      priority: 100,
      url: buildLinkedInJobsUrl(role, location, profile)
    },
    {
      id: "indeed",
      name: "Indeed",
      note: "Compact native query with date sorting.",
      health: "native clean",
      sourceType: "site",
      sourceQuality: 92,
      priority: 94,
      url: buildIndeedUrl(role, location, profile)
    },
    {
      id: "googleFresh",
      name: "Google Fresh Jobs",
      note: "Google advanced date search across job posts and career pages.",
      health: "Google advanced",
      sourceType: "search",
      sourceQuality: 90,
      priority: 92,
      url: buildGoogleUrl(buildGoogleJobQuery(role, location, profile), profile.freshness)
    },
    {
      id: "directAts",
      name: "Direct ATS Radar",
      note: "Greenhouse, Lever, Ashby, Workday, and SmartRecruiters search.",
      health: "direct apply",
      sourceType: "search",
      sourceQuality: 93,
      priority: 90,
      url: buildGoogleUrl(buildDirectAtsQuery(role, location, profile), profile.freshness)
    },
    {
      id: "linkedinPosts",
      name: "LinkedIn Posts",
      note: "Recruiter and hiring posts sorted by newest.",
      health: "minute signal",
      sourceType: "social",
      sourceQuality: 86,
      priority: 88,
      url: buildLinkedInPostsUrl(role, location, profile)
    },
    {
      id: "xHiringPosts",
      name: "X Hiring Posts",
      note: "Live social search for hiring posts, recruiter signals, and fresh openings.",
      health: "social signal",
      sourceType: "social",
      sourceQuality: 72,
      priority: 87,
      url: buildXHiringUrl(role, location, profile)
    },
    {
      id: "hackerNewsJobs",
      name: "Hacker News Jobs",
      note: "HN job board and startup-heavy technical openings.",
      health: "HN signal",
      sourceType: "site",
      sourceQuality: 70,
      priority: 86,
      url: "https://news.ycombinator.com/jobs"
    },
    {
      id: "hnAlgoliaHiring",
      name: "HN Hiring Search",
      note: "Algolia date-sorted search across HN hiring posts and job discussions.",
      health: "HN signal",
      sourceType: "search",
      sourceQuality: 70,
      priority: 85,
      url: buildHnAlgoliaUrl(role, location, profile)
    },
    {
      id: "h1bIntel",
      name: "H1B Intelligence",
      note: "Open sponsor targets with your current role context.",
      health: "OPT research",
      sourceType: "research",
      sourceQuality: 84,
      priority: 86,
      url: `../h1b-intelligence/index.html?h1bTab=applyFirst`
    },
    {
      id: "builtin",
      name: "Built In",
      note: "Tech/startup board with regional US coverage.",
      health: "native broad",
      sourceType: "site",
      sourceQuality: 82,
      priority: 80,
      url: buildBuiltInUrl(role, location)
    },
    {
      id: "dice",
      name: "Dice",
      note: "Technology-heavy job board.",
      health: "native broad",
      sourceType: "site",
      sourceQuality: 78,
      priority: 78,
      url: `https://www.dice.com/jobs?q=${encodeURIComponent(role)}&location=${encodeURIComponent(location)}&radius=30&radiusUnit=mi&page=1&pageSize=20&filters.postedDate=ONE`
    },
    {
      id: "simplify",
      name: "Simplify",
      note: "Fast apply and new-grad friendly discovery.",
      health: "direct apply",
      sourceType: "site",
      sourceQuality: 78,
      priority: 76,
      url: `https://simplify.jobs/jobs?query=${encodeURIComponent(role)}`
    },
    {
      id: "hiringCafe",
      name: "HiringCafe",
      note: "Fast job search engine with broad company coverage.",
      health: "native broad",
      sourceType: "site",
      sourceQuality: 76,
      priority: 74,
      url: `https://hiring.cafe/?search=${encodeURIComponent(role)}`
    },
    {
      id: "himalayas",
      name: "Himalayas",
      note: "Remote job board from the site-source catalog.",
      health: "remote signal",
      sourceType: "site",
      sourceQuality: 67,
      priority: 73,
      url: `https://himalayas.app/jobs?q=${encodeURIComponent(role)}`
    },
    {
      id: "remotiveApi",
      name: "Remotive API",
      note: "Structured Remotive API source for quick remote signal checks.",
      health: "API signal",
      sourceType: "api",
      sourceQuality: 67,
      priority: 73,
      url: `https://remotive.com/api/remote-jobs?search=${encodeURIComponent(role)}`
    },
    {
      id: "remotiveRss",
      name: "Remotive RSS",
      note: "Role-family remote feed signal from the source catalog.",
      health: "RSS signal",
      sourceType: "rss",
      sourceQuality: 68,
      priority: 73,
      url: buildRemotiveFeedUrl(profile)
    },
    {
      id: "wwrRss",
      name: "We Work Remotely RSS",
      note: "Remote software feed useful for fast signal checks.",
      health: "RSS signal",
      sourceType: "rss",
      sourceQuality: 64,
      priority: 72,
      url: buildWwrFeedUrl(profile)
    },
    {
      id: "rwfaRss",
      name: "Real Work From Anywhere RSS",
      note: "Remote-first feed for software, AI, data, and DevOps families.",
      health: "RSS signal",
      sourceType: "rss",
      sourceQuality: 62,
      priority: 71,
      url: buildRwfaFeedUrl(profile)
    },
    {
      id: "wellfound",
      name: "Wellfound",
      note: "Startup roles and early-stage companies.",
      health: "startup",
      sourceType: "site",
      sourceQuality: 64,
      priority: 70,
      url: `https://wellfound.com/jobs?keyword=${encodeURIComponent(role)}`
    },
    {
      id: "yc",
      name: "YC Work at a Startup",
      note: "Y Combinator company jobs.",
      health: "startup",
      sourceType: "site",
      sourceQuality: 66,
      priority: 68,
      url: `https://www.ycombinator.com/jobs?query=${encodeURIComponent(role)}`
    },
    {
      id: "kubeCareers",
      name: "Kube Careers",
      note: "DevOps, cloud, platform, and Kubernetes-focused roles.",
      health: "specialty",
      sourceType: "site",
      sourceQuality: 58,
      priority: 60,
      url: `https://kube.careers/kubernetes-jobs-in-usa?query=${encodeURIComponent(role)}`
    }
  ];
  return [...builtIns.filter(source => shouldIncludeSource(source, profile)), ...custom].sort((a, b) =>
    Number(state.pinnedSources.has(b.id)) - Number(state.pinnedSources.has(a.id)) ||
    b.priority - a.priority
  );
}

function parseCustomSources(raw, profile, role, location) {
  return String(raw || "")
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map((line, index) => {
      const match = line.match(/^(.+?)\s*(?:\||=>)\s*(https?:\/\/.+)$/i);
      const label = match ? match[1].trim() : `Custom Source ${index + 1}`;
      const template = match ? match[2].trim() : line;
      const url = applyTemplate(template, {
        role,
        query: buildCompactQuery(role, profile),
        location,
        time: profile.freshness
      });
      return /^https?:\/\//i.test(url) ? {
        id: `custom-${slug(label)}-${index}`,
        name: label,
        note: "Saved custom scout link.",
        health: "custom",
        sourceType: "custom",
        sourceQuality: 70,
        priority: 66 - index,
        url
      } : null;
    })
    .filter(Boolean);
}

function renderSources() {
  const sources = getSourceDefinitions();
  els.sourceGrid.innerHTML = "";
  sources.forEach(source => {
    const card = document.createElement("article");
    card.className = "source-card";
    if (state.checkedSources.has(source.id)) {
      card.classList.add("is-selected");
    }
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = state.checkedSources.has(source.id);
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) state.checkedSources.add(source.id);
      else state.checkedSources.delete(source.id);
      saveVault();
      renderSources();
    });
    const title = document.createElement("h3");
    title.textContent = source.name;
    const note = document.createElement("p");
    note.textContent = source.note;
    const meta = document.createElement("div");
    meta.className = "meta-row";
    meta.append(createPill(source.health, pillClassForHealth(source.health)), createPill(source.sourceType || "site"), createPill(`Quality ${source.sourceQuality || source.priority}`));
    if (state.pinnedSources.has(source.id)) {
      meta.append(createPill("pinned", "pill-fit"));
    }
    const preview = document.createElement("p");
    preview.className = "query-preview";
    preview.textContent = compactUrlPreview(source.url);
    const actions = document.createElement("div");
    actions.className = "card-actions";
    actions.append(createLink("Open", source.url));
    actions.append(createButton("Copy", () => copyText(source.url, `Copied ${source.name}`)));
    actions.append(createButton(state.pinnedSources.has(source.id) ? "Unpin" : "Pin", () => toggleSourcePin(source.id)));
    card.append(checkbox, title, note, meta, preview, actions);
    els.sourceGrid.appendChild(card);
  });
}

function toggleSourcePin(id) {
  if (state.pinnedSources.has(id)) state.pinnedSources.delete(id);
  else state.pinnedSources.add(id);
  saveVault();
  renderSources();
}

function getSelectedSources(limit) {
  const sources = getSourceDefinitions().filter(source => state.checkedSources.has(source.id));
  return typeof limit === "number" ? sources.slice(0, limit) : sources;
}

function openTopSearches() {
  getSelectedSources(5).forEach(source => window.open(source.url, "_blank", "noopener"));
  showToast("Opened top scout searches");
}

function openSelectedSearches() {
  const sources = getSelectedSources();
  sources.forEach(source => window.open(source.url, "_blank", "noopener"));
  showToast(`Opened ${sources.length} selected scout searches`);
}

function copyAllSearches() {
  const lines = getSelectedSources().map(source => `${source.name}: ${source.url}`);
  copyText(lines.join("\n"), `Copied ${lines.length} scout searches`);
}

function copySearchPrompt() {
  const profile = getProfile();
  const role = getPrimaryRole(profile);
  const lines = [
    `Target role: ${role}`,
    `Role family terms: ${[...profile.targetRoles, ...profile.roleVariants].slice(0, 16).join(", ")}`,
    `Location: ${getPrimaryLocation(profile)}`,
    `Freshness: ${profile.freshness}`,
    `Work setting: ${profile.workSetting}`,
    `Priority signals: ${profile.prioritySignals.slice(0, 12).join(", ")}`,
    `Avoid: ${profile.titleExcludes.concat(profile.industryExcludes).slice(0, 12).join(", ")}`,
    "",
    "Use compact native queries on job boards. Use Boolean operators only in Google/operator searches."
  ];
  copyText(lines.join("\n"), "Copied scout search prompt");
}

function analyzeResume() {
  const text = els.resumeText.value.trim();
  if (!text) {
    showToast("Paste resume text first");
    return;
  }
  const keywords = extractResumeKeywords(text, getProfile()).slice(0, 36);
  els.resumeKeywords.value = keywords.join(", ");
  saveVault();
  renderAll();
  showToast(`Extracted ${keywords.length} resume keywords`);
}

function clearResume() {
  els.resumeText.value = "";
  els.resumeKeywords.value = "";
  els.resumeFileInput.value = "";
  saveVault();
  renderAll();
  showToast("Resume match data cleared");
}

function handleResumeFile() {
  const file = els.resumeFileInput.files?.[0];
  if (!file) return;
  if (/\.pdf$/i.test(file.name) || file.type === "application/pdf") {
    showToast("Static page cannot extract PDF text; export/paste resume text instead");
    els.resumeFileInput.value = "";
    return;
  }
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    els.resumeText.value = String(reader.result || "");
    analyzeResume();
  });
  reader.addEventListener("error", () => showToast("Resume file could not be read"));
  reader.readAsText(file);
}

function renderResumeInsights() {
  if (!els.resumeInsights) return;
  const profile = getProfile();
  const text = profile.resumeText.trim();
  if (!text) {
    els.resumeInsights.textContent = "Add resume text to unlock resume-match scoring.";
    return;
  }
  const tokens = tokenize(text);
  const keywords = profile.resumeKeywords.length ? profile.resumeKeywords : extractResumeKeywords(text, profile).slice(0, 18);
  const scored = state.candidates.filter(candidate => typeof candidate.resumeSimilarity === "number");
  const best = scored.length ? Math.max(...scored.map(candidate => candidate.resumeSimilarity || 0)) : 0;
  els.resumeInsights.innerHTML = [
    `<strong>${tokens.length}</strong> resume terms`,
    `<strong>${keywords.length}</strong> saved keywords`,
    `<strong>${Math.round(best * 100)}%</strong> best lead match`,
    `<span>${escapeHtml(keywords.slice(0, 10).join(", ") || "No keywords yet")}</span>`
  ].join("");
}

function copySignalSearchPack() {
  const profile = getProfile();
  const role = getPrimaryRole(profile);
  const location = getPrimaryLocation(profile);
  const lines = [
    "Resume Signal Search Pack",
    "",
    `Role: ${role}`,
    `Location: ${location}`,
    `Resume keywords: ${getResumeKeywords(profile).slice(0, 24).join(", ") || "add resume text"}`,
    "",
    `X Hiring Posts: ${buildXHiringUrl(role, location, profile)}`,
    `HN Hiring Search: ${buildHnAlgoliaUrl(role, location, profile)}`,
    `LinkedIn Posts: ${buildLinkedInPostsUrl(role, location, profile)}`,
    `Google Fresh Resume Match: ${buildGoogleUrl(buildResumeGoogleQuery(role, location, profile), profile.freshness)}`
  ];
  copyText(lines.join("\n"), "Copied resume signal pack");
}

function scoreLeadFromForm() {
  const lead = {
    id: "",
    title: els.leadTitle.value.trim(),
    company: els.leadCompany.value.trim(),
    location: els.leadLocation.value.trim(),
    workSetting: els.leadWorkSetting.value,
    posted: els.leadPosted.value,
    source: els.leadSource.value.trim() || "Manual",
    compensation: els.leadCompensation.value.trim(),
    industry: els.leadIndustry.value.trim(),
    companyWebsite: els.leadCompanyWebsite.value.trim(),
    status: normalizeStatus(els.leadStatus.value),
    url: els.leadUrl.value.trim(),
    description: els.leadDescription.value.trim(),
    addedAt: new Date().toISOString()
  };
  if (!lead.title || !lead.company) {
    showToast("Add a job title and company first");
    return;
  }
  if (lead.url && !/^https?:\/\//i.test(lead.url)) {
    showToast("Apply URL must start with http:// or https://");
    return;
  }
  if (lead.companyWebsite && !/^https?:\/\//i.test(lead.companyWebsite)) {
    showToast("Company website must start with http:// or https://");
    return;
  }
  lead.id = candidateId(lead);
  const scored = scoreCandidate(lead, getProfile());
  state.candidates = mergeCandidates(state.candidates.filter(item => item.id !== scored.id), [scored]);
  state.selectedCandidateId = scored.id;
  saveVault();
  clearLeadForm();
  renderAll();
  showToast(`${scored.company} scored ${scored.score.toFixed(1)}/10`);
}

function clearLeadForm() {
  [els.leadTitle, els.leadCompany, els.leadLocation, els.leadSource, els.leadCompensation, els.leadIndustry, els.leadCompanyWebsite, els.leadUrl, els.leadDescription].forEach(input => {
    input.value = "";
  });
  els.leadWorkSetting.value = "";
  els.leadPosted.value = "today";
  els.leadStatus.value = "Unopened";
}

function rescoreAll() {
  const profile = getProfile();
  state.candidates = state.candidates.map(candidate => scoreCandidate(candidate, profile));
}

function scoreCandidate(candidate, profile) {
  const text = normalize(`${candidate.title} ${candidate.company} ${candidate.location} ${candidate.workSetting} ${candidate.compensation} ${candidate.industry} ${candidate.description}`);
  const titleText = normalize(candidate.title);
  const roleTerms = [...profile.targetRoles, ...profile.roleVariants];
  const roleMatches = matchesFromTerms(titleText, roleTerms);
  const roleScore = roleMatches.length ? 2.2 : /\b(engineer|developer|analyst|scientist|cloud|data|software|machine)\b/i.test(candidate.title) ? 1.2 : 0;

  const responsibilityTerms = ["build", "develop", "ship", "api", "pipeline", "dashboard", "model", "deploy", "cloud", "analysis", "etl", "frontend", "backend", "full stack", "production", "automation"];
  const responsibilityHits = matchesFromTerms(text, responsibilityTerms);
  const responsibilityScore = responsibilityHits.length >= 5 ? 1.4 : responsibilityHits.length >= 2 ? .9 : 0;

  const skillHits = matchesFromTerms(text, profile.skills);
  const skillRatio = profile.skills.length ? skillHits.length / profile.skills.length : 0;
  const skillsScore = skillHits.length >= 5 || skillRatio >= .35 ? 2.2 : skillHits.length >= 2 ? 1.2 : 0;

  const seniorFlags = matchesFromTerms(titleText, profile.titleExcludes);
  const entryHits = matchesFromTerms(text, profile.levels);
  const experienceScore = seniorFlags.length ? .4 : entryHits.length ? 1.4 : 1;

  const domainHits = matchesFromTerms(text, [...profile.domains, ...splitTerms(candidate.industry)]);
  const domainScore = domainHits.length ? .8 : 0;

  const priorityHits = matchesFromTerms(text, profile.prioritySignals);
  const priorityScore = priorityHits.length >= 3 ? 1 : priorityHits.length ? .55 : 0;

  const resumeKeywords = getResumeKeywords(profile);
  const resumeHits = matchesFromTerms(text, resumeKeywords);
  const resumeSimilarity = profile.resumeText ? cosineSimilarity(profile.resumeText, `${candidate.title} ${candidate.company} ${candidate.description} ${candidate.industry}`) : 0;
  const resumeScore = profile.resumeText
    ? resumeSimilarity >= .28 || resumeHits.length >= 6 ? 1.2 : resumeSimilarity >= .14 || resumeHits.length >= 3 ? .7 : .2
    : 0;

  const locationHits = matchesFromTerms(text, profile.locations);
  const locationScore = locationHits.length || /\b(remote|united states|usa|u\.s\.)\b/i.test(candidate.location) ? .8 : 0;

  const salary = salaryMeetsMinimum(candidate.compensation, profile.minBaseUsd);
  const salaryScore = salary.ok ? .4 : 0;

  const workSetting = inferWorkSetting(candidate);
  const workSettingScore = workSettingMatches(workSetting, profile.workSetting) ? .5 : 0;

  const identity = companyIdentity(candidate);
  const urlAudit = getUrlAudit(candidate);
  const sourceQuality = getSourceQuality(candidate.source);
  const sourceScore = sourceQuality >= 85 ? .7 : sourceQuality >= 70 ? .45 : .25;
  const identityScore = identity.domain ? .4 : 0;
  const health = getCompanyHealthProxy(candidate, identity, sourceQuality, text);
  const healthScore = health.score >= 70 ? .4 : health.score >= 55 ? .2 : 0;
  const industryExcludes = matchesFromTerms(text, profile.industryExcludes);
  const warnings = getWarnings(text);
  const penalty = warnings.penalty + urlAudit.penalty + salary.penalty + (workSettingScore ? 0 : workSetting.penalty) + (industryExcludes.length ? 1 : 0) + Math.min(1.8, seniorFlags.length * .9);
  const rawScore = roleScore + responsibilityScore + skillsScore + experienceScore + domainScore + priorityScore + resumeScore + locationScore + salaryScore + workSettingScore + sourceScore + identityScore + healthScore - penalty;
  const score = Math.max(0, Math.min(10, rawScore));
  const reasons = [
    roleMatches.length ? `Role matched: ${roleMatches.slice(0, 3).join(", ")}` : "Role is adjacent, not exact",
    skillHits.length ? `Skill hits: ${skillHits.slice(0, 6).join(", ")}` : "Few explicit skill hits",
    responsibilityHits.length ? `Work signals: ${responsibilityHits.slice(0, 5).join(", ")}` : "Responsibilities need review",
    locationScore ? "Location matches US/remote target" : "Location needs review",
    domainHits.length ? `Domain hits: ${domainHits.slice(0, 3).join(", ")}` : "Domain not obvious",
    priorityHits.length ? `Priority signals: ${priorityHits.slice(0, 4).join(", ")}` : "No extra priority signal",
    profile.resumeText ? `Resume match: ${Math.round(resumeSimilarity * 100)}%${resumeHits.length ? ` (${resumeHits.slice(0, 4).join(", ")})` : ""}` : "Resume match not enabled",
    `Source quality: ${sourceQuality}/100`,
    health.note
  ];
  const gaps = [];
  if (seniorFlags.length) gaps.push(`Possible seniority mismatch: ${seniorFlags.join(", ")}`);
  if (industryExcludes.length) gaps.push(`Excluded industry/noise terms: ${industryExcludes.join(", ")}`);
  if (!skillHits.length) gaps.push("Paste fuller description to verify skill overlap");
  if (profile.resumeText && resumeSimilarity < .12 && resumeHits.length < 2) gaps.push("Resume overlap is weak; review before applying");
  if (!locationScore) gaps.push("Confirm US/remote eligibility");
  if (!identity.domain) gaps.push("Company identity is weak; verify official company domain");
  if (!salary.ok) gaps.push(salary.reason);
  if (!workSettingScore) gaps.push(workSetting.reason);
  urlAudit.items.forEach(item => gaps.push(item));
  warnings.items.forEach(item => gaps.push(item));
  const decision = getDecision(score, profile, warnings, urlAudit, seniorFlags, industryExcludes);

  return {
    ...candidate,
    status: normalizeStatus(candidate.status),
    workSetting: workSetting.value,
    identity,
    healthScore: health.score,
    healthBand: health.band,
    sourceQuality,
    decision,
    confidence: getConfidence(candidate, identity, urlAudit, skillHits),
    score,
    breakdown: {
      role: roleScore,
      responsibilities: responsibilityScore,
      skills: skillsScore,
      experience: experienceScore,
      domain: domainScore,
      priority: priorityScore,
      resume: resumeScore,
      location: locationScore,
      salary: salaryScore,
      workSetting: workSettingScore,
      source: sourceScore,
      identity: identityScore,
      companyHealth: healthScore,
      penalty
    },
    reasons,
    gaps,
    warnings: unique([...warnings.items, ...urlAudit.items, ...(!salary.ok ? [salary.reason] : []), ...(!workSettingScore ? [workSetting.reason] : [])]),
    skillHits,
    roleMatches,
    priorityHits,
    resumeHits,
    resumeSimilarity,
    freshnessRank: getFreshnessRank(candidate.posted),
    scoredAt: new Date().toISOString()
  };
}

function getWarnings(text) {
  const warningTerms = [
    ["US citizenship required", "Citizenship-only wording"],
    ["must be a US citizen", "Citizenship-only wording"],
    ["citizenship required", "Citizenship-only wording"],
    ["security clearance", "Clearance wording"],
    ["secret clearance", "Clearance wording"],
    ["clearance", "Clearance wording"],
    ["unpaid", "Unpaid warning"],
    ["commission only", "Commission-only warning"],
    ["no sponsorship", "Sponsorship concern"],
    ["does not sponsor", "Sponsorship concern"],
    ["c2c only", "Contract-only warning"],
    ["training fee", "Fee warning"],
    ["pay a fee", "Fee warning"]
  ];
  const items = unique(warningTerms.filter(([term]) => includesTerm(text, term)).map(([, label]) => label));
  return { items, penalty: items.length ? Math.min(2.6, items.length * .75) : 0 };
}

function renderResults() {
  const profile = getProfile();
  const scored = getScoredCandidates();
  const visible = scored.filter(candidate => {
    if (els.showOnlyPassed.checked && candidate.score < profile.minScore) return false;
    if (els.statusFilter.value === "all") return ACTIVE_STATUSES.includes(normalizeStatus(candidate.status));
    return normalizeStatus(candidate.status) === els.statusFilter.value;
  });
  els.resultsGrid.innerHTML = "";
  visible.forEach(candidate => {
    const card = document.createElement("article");
    card.className = "job-card";
    if (candidate.id === state.selectedCandidateId) {
      card.classList.add("is-selected");
    }
    if (candidate.decision === "Apply First") {
      card.classList.add("is-apply-first");
    }
    const header = document.createElement("div");
    header.className = "company-header";
    header.append(renderCompanyAvatar(candidate.identity, candidate.company));
    const headerText = document.createElement("div");
    const title = document.createElement("h3");
    title.textContent = `${candidate.title}`;
    const company = document.createElement("p");
    company.textContent = candidate.company;
    headerText.append(title, company);
    header.append(headerText);
    const score = document.createElement("div");
    score.className = "score-number";
    score.textContent = `${candidate.score.toFixed(1)}/10`;
    const summary = document.createElement("p");
    summary.textContent = `${candidate.location || "Location unknown"} | ${formatPosted(candidate.posted)} | ${candidate.source || "Manual"} | ${candidate.workSetting || "setting unknown"}`;
    const meta = document.createElement("div");
    meta.className = "meta-row";
    meta.append(createPill(candidate.decision, candidate.decision === "Apply First" ? "pill-fit" : candidate.decision === "Review" ? "pill-domain" : "pill-warning"));
    meta.append(createPill(normalizeStatus(candidate.status), "pill-status"));
    meta.append(createPill(formatPosted(candidate.posted), "pill-fresh"));
    meta.append(createPill(`Health ${candidate.healthScore}`, candidate.healthScore >= 70 ? "pill-fit" : candidate.healthScore >= 55 ? "pill-domain" : "pill-warning"));
    meta.append(createPill(`Confidence ${candidate.confidence}`, candidate.confidence === "high" ? "pill-fit" : candidate.confidence === "medium" ? "pill-domain" : "pill-warning"));
    if (profile.resumeText) {
      meta.append(createPill(`Resume ${Math.round((candidate.resumeSimilarity || 0) * 100)}%`, (candidate.resumeSimilarity || 0) >= .2 ? "pill-fit" : "pill-domain"));
    }
    candidate.skillHits.slice(0, 4).forEach(skill => meta.append(createPill(skill, "pill-domain")));
    candidate.gaps.slice(0, 2).forEach(gap => meta.append(createPill(gap, "pill-warning")));
    const reasons = document.createElement("p");
    reasons.textContent = candidate.reasons.slice(0, 3).join(" | ");
    const status = document.createElement("select");
    status.className = "status-select";
    JOB_STATUSES.forEach(value => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = value;
      option.selected = normalizeStatus(candidate.status) === value;
      status.append(option);
    });
    status.addEventListener("change", () => updateCandidateStatus(candidate.id, status.value));
    const actions = document.createElement("div");
    actions.className = "card-actions";
    if (candidate.url) actions.append(createLink("Apply", candidate.url));
    actions.append(createButton("Select", () => selectCandidate(candidate.id)));
    actions.append(createButton("Copy Packet", () => copyPacket(candidate)));
    actions.append(createButton("Viewed", () => updateCandidateStatus(candidate.id, "Viewed")));
    actions.append(createButton("Applied", () => updateCandidateStatus(candidate.id, "Applied")));
    actions.append(createButton("Remove", () => removeCandidate(candidate.id)));
    card.append(header, score, summary, meta, reasons, status, actions);
    els.resultsGrid.appendChild(card);
  });
  if (!visible.length) {
    const empty = document.createElement("article");
    empty.className = "job-card";
    empty.innerHTML = "<h3>No scored jobs yet</h3><p>Add a job lead or lower the threshold to widen the view.</p>";
    els.resultsGrid.appendChild(empty);
  }
  updateMetrics(scored, profile);
  renderReviewBoard();
  renderPacket();
}

function getScoredCandidates() {
  return [...state.candidates].sort((a, b) => {
    if (els.resultSort.value === "fresh") return b.freshnessRank - a.freshnessRank || b.score - a.score;
    if (els.resultSort.value === "health") return (b.healthScore || 0) - (a.healthScore || 0) || b.score - a.score;
    if (els.resultSort.value === "status") return (STATUS_RANK.get(normalizeStatus(a.status)) || 0) - (STATUS_RANK.get(normalizeStatus(b.status)) || 0) || b.score - a.score;
    if (els.resultSort.value === "company") return a.company.localeCompare(b.company) || b.score - a.score;
    return b.score - a.score || b.freshnessRank - a.freshnessRank || a.company.localeCompare(b.company);
  });
}

function updateMetrics(scored, profile) {
  const passed = scored.filter(item => item.score >= profile.minScore);
  const ready = scored.filter(item => item.decision === "Apply First" && ["Unopened", "Viewed"].includes(normalizeStatus(item.status)));
  const average = scored.length ? scored.reduce((sum, item) => sum + item.score, 0) / scored.length : 0;
  els.metricLeads.textContent = String(scored.length);
  els.metricPassed.textContent = String(passed.length);
  els.metricReady.textContent = String(ready.length);
  els.metricAvg.textContent = average.toFixed(1);
  syncVaultStatus();
}

function selectCandidate(id) {
  state.selectedCandidateId = id;
  saveVault();
  renderResults();
}

function updateCandidateStatus(id, status) {
  const nextStatus = normalizeStatus(status);
  state.candidates = state.candidates.map(candidate =>
    candidate.id === id ? { ...candidate, status: nextStatus, statusUpdatedAt: new Date().toISOString() } : candidate
  );
  saveVault();
  renderAll();
  showToast(`Marked ${nextStatus}`);
}

function removeCandidate(id) {
  state.candidates = state.candidates.filter(candidate => candidate.id !== id);
  if (state.selectedCandidateId === id) {
    state.selectedCandidateId = state.candidates[0]?.id || "";
  }
  saveVault();
  renderAll();
  showToast("Job lead removed");
}

function openApplyBatch() {
  const profile = getProfile();
  const batch = getScoredCandidates()
    .filter(candidate => candidate.url)
    .filter(candidate => candidate.score >= profile.minScore)
    .filter(candidate => candidate.decision !== "Later")
    .filter(candidate => ["Unopened", "Viewed"].includes(normalizeStatus(candidate.status)))
    .slice(0, 5);
  if (!batch.length) {
    showToast("No ready apply links in the current queue");
    return;
  }
  batch.forEach(candidate => window.open(candidate.url, "_blank", "noopener"));
  const now = new Date().toISOString();
  const ids = new Set(batch.map(candidate => candidate.id));
  state.candidates = state.candidates.map(candidate =>
    ids.has(candidate.id) ? { ...candidate, status: normalizeStatus(candidate.status) === "Unopened" ? "Viewed" : candidate.status, openedAt: candidate.openedAt || now } : candidate
  );
  saveVault();
  renderAll();
  showToast(`Opened ${batch.length} apply links`);
}

function renderReviewBoard() {
  if (!els.reviewBoard) return;
  const profile = getProfile();
  const scored = getScoredCandidates();
  const groups = [
    {
      label: "Apply First",
      hint: "Strong fit, active status, low warning pressure.",
      items: scored.filter(candidate => candidate.decision === "Apply First" && ["Unopened", "Viewed"].includes(normalizeStatus(candidate.status)))
    },
    {
      label: "Review",
      hint: "Potentially useful, but needs URL, seniority, auth, or fit review.",
      items: scored.filter(candidate => candidate.decision === "Review")
    },
    {
      label: "Applied",
      hint: "Already submitted or in progress.",
      items: scored.filter(candidate => ["Applied", "Interviewing"].includes(normalizeStatus(candidate.status)))
    },
    {
      label: "Archive",
      hint: "Rejected, ignored, expired, or below useful threshold.",
      items: scored.filter(candidate =>
        ["Rejected", "Ignore", "Expired"].includes(normalizeStatus(candidate.status)) ||
        (candidate.score < profile.minScore && candidate.decision === "Later")
      )
    }
  ];
  els.reviewBoard.innerHTML = "";
  groups.forEach(group => {
    const card = document.createElement("article");
    card.className = "board-card";
    const title = document.createElement("h3");
    title.textContent = `${group.label} (${group.items.length})`;
    const hint = document.createElement("p");
    hint.textContent = group.hint;
    const list = document.createElement("div");
    list.className = "board-list";
    group.items.slice(0, 8).forEach(candidate => {
      const row = document.createElement("button");
      row.type = "button";
      row.className = "board-row";
      row.innerHTML = `<strong>${escapeHtml(candidate.company)}</strong><span>${escapeHtml(candidate.title)} - ${candidate.score.toFixed(1)}/10</span>`;
      row.addEventListener("click", () => selectCandidate(candidate.id));
      list.append(row);
    });
    if (!group.items.length) {
      const empty = document.createElement("p");
      empty.textContent = "Nothing here yet.";
      list.append(empty);
    }
    card.append(title, hint, list);
    els.reviewBoard.append(card);
  });
}

function copyReviewSummary() {
  const lines = getScoredCandidates().map(candidate =>
    `${candidate.decision} | ${normalizeStatus(candidate.status)} | ${candidate.score.toFixed(1)}/10 | ${candidate.company} | ${candidate.title} | ${candidate.url || "no url"}`
  );
  copyText(lines.join("\n"), `Copied ${lines.length} scout review rows`);
}

function renderPacket() {
  const candidate = state.candidates.find(item => item.id === state.selectedCandidateId) || getScoredCandidates()[0];
  if (!candidate) {
    els.packetPreview.textContent = "Select a scored job to build the packet.";
    return;
  }
  els.packetPreview.textContent = buildPacket(candidate);
}

function buildPacket(candidate) {
  const profile = getProfile();
  return [
    `Job Scout Packet - ${candidate.title} at ${candidate.company}`,
    "",
    `Fit score: ${candidate.score.toFixed(1)}/10`,
    `Decision: ${candidate.decision}`,
    `Status: ${normalizeStatus(candidate.status)}`,
    `Confidence: ${candidate.confidence}`,
    `Resume match: ${Math.round((candidate.resumeSimilarity || 0) * 100)}%`,
    `Company health signal: ${candidate.healthScore}/100 (${candidate.healthBand})`,
    `Posted: ${formatPosted(candidate.posted)}`,
    `Location: ${candidate.location || "Unknown"}`,
    `Work setting: ${candidate.workSetting || "Unknown"}`,
    `Compensation: ${candidate.compensation || "Not listed"}`,
    `Industry: ${candidate.industry || "Not listed"}`,
    `Company website/domain: ${candidate.companyWebsite || candidate.identity?.domain || "Not verified"}`,
    `Source: ${candidate.source || "Manual"}`,
    `Apply: ${candidate.url || "No URL pasted"}`,
    "",
    "Why this fits:",
    ...candidate.reasons.map(reason => `- ${reason}`),
    "",
    "Review before applying:",
    ...(candidate.gaps.length ? candidate.gaps.map(gap => `- ${gap}`) : ["- No major gaps detected from pasted text."]),
    "",
    "Score breakdown:",
    ...Object.entries(candidate.breakdown || {}).map(([key, value]) => `- ${key}: ${Number(value).toFixed(2)}`),
    "",
    "ATS keywords from my profile:",
    profile.skills.slice(0, 18).join(", "),
    "",
    "Resume keywords to mirror when truthful:",
    getResumeKeywords(profile).slice(0, 18).join(", ") || "No resume keywords saved.",
    "",
    "OPT wording:",
    "I am an F-1 OPT candidate with current US work authorization. My role must be related to my field of study. For STEM OPT, I will need an employer/payroll setup that supports the required training-plan process and E-Verify where applicable.",
    "",
    "No-fabrication note:",
    "Tailor the resume by reordering and emphasizing verified experience only. Do not invent skills, metrics, employers, dates, or certifications."
  ].join("\n");
}

function copySelectedPacket() {
  const candidate = state.candidates.find(item => item.id === state.selectedCandidateId) || getScoredCandidates()[0];
  if (!candidate) {
    showToast("Score a job first");
    return;
  }
  copyPacket(candidate);
}

function copyPacket(candidate) {
  copyText(buildPacket(candidate), `Copied packet for ${candidate.company}`);
}

function copyRankedTable() {
  const profile = getProfile();
  const rows = getScoredCandidates()
    .filter(candidate => candidate.score >= profile.minScore)
    .slice(0, 20);
  const table = [
    "| # | Decision | Status | Role | Company | Posted | Location | Source | Fit | Apply |",
    "|---|----------|--------|------|---------|--------|----------|--------|-----|-------|",
    ...rows.map((candidate, index) => `| ${index + 1} | ${escapeCell(candidate.decision)} | ${escapeCell(normalizeStatus(candidate.status))} | ${escapeCell(candidate.title)} | ${escapeCell(candidate.company)} | ${formatPosted(candidate.posted)} | ${escapeCell(candidate.location)} | ${escapeCell(candidate.source)} | ${candidate.score.toFixed(1)}/10 | ${candidate.url ? `[Apply](${candidate.url})` : "n/a"} |`)
  ];
  copyText(table.join("\n"), `Copied ${rows.length} ranked jobs`);
}

function exportVault() {
  saveVault();
  copyText(JSON.stringify(normalizeVault(readJson(STORAGE_KEY)), null, 2), "Copied Job Scout vault");
}

async function importVault() {
  const raw = await requestTextInput({
    title: "Import Job Scout Vault",
    message: "Paste exported Job Scout JSON. Leads, profile, pinned sources, and selected job are merged into this browser.",
    value: "",
    multiline: true
  });
  if (!raw || !raw.trim()) return;
  try {
    const vault = normalizeVault(JSON.parse(raw));
    applyVault(vault);
    saveVault();
    renderAll();
    showToast("Job Scout vault imported");
  } catch (error) {
    showToast("Invalid Job Scout JSON");
  }
}

async function importLeads() {
  const raw = await requestTextInput({
    title: "Import Job Leads",
    message: "Paste JSON jobs/candidates or rows as Company | Title | URL | Location | Source. Common aliases like company_name, job_title, applyLink, salary, and website are accepted.",
    value: "",
    multiline: true
  });
  if (!raw || !raw.trim()) return;
  const parsed = parseLeadImport(raw);
  if (!parsed.length) {
    showToast("No valid leads found");
    return;
  }
  const scored = parsed.map(lead => {
    const base = {
      id: "",
      title: lead.title,
      company: lead.company,
      location: lead.location || "",
      workSetting: lead.workSetting || "",
      posted: lead.posted || "old",
      source: lead.source || "Import",
      compensation: lead.compensation || "",
      industry: lead.industry || "",
      companyWebsite: lead.companyWebsite || "",
      status: normalizeStatus(lead.status),
      url: lead.url || "",
      description: lead.description || "",
      addedAt: lead.addedAt || new Date().toISOString()
    };
    base.id = candidateId(base);
    return scoreCandidate(base, getProfile());
  });
  state.candidates = mergeCandidates(state.candidates, scored);
  state.selectedCandidateId = scored[0]?.id || state.selectedCandidateId;
  saveVault();
  renderAll();
  showToast(`Imported ${scored.length} job leads`);
}

function parseLeadImport(raw) {
  const text = String(raw || "").trim();
  if (!text) return [];
  if (/^[\[{]/.test(text)) {
    try {
      const parsed = JSON.parse(text);
      const rows = Array.isArray(parsed) ? parsed : parsed.jobs || parsed.candidates || parsed.leads || [];
      return rows.map(normalizeImportedLead).filter(lead => lead.company && lead.title);
    } catch (error) {
      return [];
    }
  }
  return text.split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const cells = line.split(/\s*\|\s*/);
      if (cells.length < 2) return null;
      return normalizeImportedLead({
        company: cells[0],
        title: cells[1],
        apply_url: cells[2] || "",
        location: cells[3] || "",
        source: cells[4] || "Pasted row"
      });
    })
    .filter(lead => lead && lead.company && lead.title);
}

function normalizeImportedLead(row) {
  if (!row || typeof row !== "object") return null;
  const lead = {
    company: firstText(row.company, row.company_name, row.employer, row.organization),
    title: firstText(row.title, row.job_title, row.role, row.position),
    location: firstText(row.location, row.locations, row.city_state, row.job_location),
    workSetting: firstText(row.workSetting, row.work_setting, row.remote, row.workplace),
    posted: normalizePosted(firstText(row.posted, row.date_posted, row.dateDiscovered, row.date_discovered, row.date_added)),
    source: firstText(row.source, row.board, row.source_name),
    compensation: firstText(row.compensation, row.salary, row.pay, row.base_salary),
    industry: firstText(row.industry, row.company_industry, row.sector),
    companyWebsite: firstText(row.companyWebsite, row.company_website, row.company_url, row.website),
    status: normalizeStatus(firstText(row.status)),
    url: firstText(row.apply_url, row.url, row.link, row.applyLink, row.apply_link),
    description: firstText(row.description, row.summary, row.snippet, row.about),
    addedAt: firstText(row.addedAt, row.added_at)
  };
  lead.workSetting = normalizeWorkSettingValue(lead.workSetting);
  return lead;
}

function shouldIncludeSource(source, profile) {
  const workSetting = profile.workSetting || "any";
  const remoteAllowed = workSetting === "any" || workSetting === "remote-hybrid-onsite" || workSetting === "remote";
  const remoteOnly = new Set(["himalayas", "remotiveApi", "remotiveRss", "wwrRss", "rwfaRss"]);
  if (remoteOnly.has(source.id) && !remoteAllowed) {
    return false;
  }
  if (source.id === "kubeCareers") {
    return inferRoleFamilies(profile).some(family => ["devops", "cloud", "backend"].includes(family));
  }
  return true;
}

function inferRoleFamilies(profile) {
  const text = normalize([...profile.targetRoles, ...profile.roleVariants, ...profile.skills].join(" "));
  const families = [];
  if (/\b(frontend|front end|react|ui|javascript|typescript)\b/.test(text)) families.push("frontend");
  if (/\b(backend|back end|api|server|python|node|java|go|database)\b/.test(text)) families.push("backend");
  if (/\b(full stack|fullstack|mern|end-to-end)\b/.test(text)) families.push("fullstack");
  if (/\b(devops|sre|cloud|aws|azure|gcp|kubernetes|docker|platform|infrastructure)\b/.test(text)) families.push("devops", "cloud");
  if (/\b(ai|ml|machine learning|model|llm|nlp|computer vision)\b/.test(text)) families.push("ai_ml");
  if (/\b(data|sql|etl|pipeline|analytics|bi|warehouse|spark)\b/.test(text)) families.push("data");
  return unique(families.length ? families : ["backend", "fullstack", "data"]);
}

function buildDirectAtsQuery(role, location, profile) {
  const level = profile.levels.slice(0, 5).map(quote).join(" OR ");
  return `${quote(role)} (${level}) (${quote(location)} OR USA OR "U.S.") (site:greenhouse.io OR site:jobs.lever.co OR site:ashbyhq.com OR site:myworkdayjobs.com OR site:smartrecruiters.com OR site:icims.com OR site:bamboohr.com)`;
}

function buildBuiltInUrl(role, location) {
  const target = getBuiltInRegionalTarget(location);
  return `${target}/jobs?search=${encodeURIComponent(role)}&location=${encodeURIComponent(location)}`;
}

function getBuiltInRegionalTarget(location) {
  const text = normalize(location);
  if (/\b(austin|texas|tx|dallas|houston)\b/.test(text)) return "https://www.builtinaustin.com";
  if (/\b(boston|massachusetts|ma)\b/.test(text)) return "https://www.builtinboston.com";
  if (/\b(charlotte|north carolina|nc|south carolina|sc|virginia|va|georgia|ga|florida|fl)\b/.test(text)) return "https://builtincharlotte.com";
  if (/\b(chicago|illinois|il|wisconsin|wi|michigan|mi|ohio|oh)\b/.test(text)) return "https://www.builtinchicago.org";
  if (/\b(colorado|denver|boulder|co)\b/.test(text)) return "https://www.builtincolorado.com";
  if (/\b(los angeles|southern california|san diego|irvine)\b/.test(text)) return "https://www.builtinla.com";
  if (/\b(new york|nyc|new jersey|nj|connecticut|ct)\b/.test(text)) return "https://www.builtinnyc.com";
  if (/\b(seattle|washington|wa|oregon|or)\b/.test(text)) return "https://www.builtinseattle.com";
  if (/\b(san francisco|bay area|california|ca)\b/.test(text)) return "https://www.builtinsf.com";
  return "https://builtin.com";
}

function buildRemotiveFeedUrl(profile) {
  const families = inferRoleFamilies(profile);
  if (families.includes("devops") || families.includes("cloud")) return "https://remotive.com/remote-jobs/feed/devops";
  if (families.includes("ai_ml")) return "https://remotive.com/remote-jobs/feed/artificial-intelligence";
  if (families.includes("data")) return "https://remotive.com/remote-jobs/feed/data";
  return "https://remotive.com/remote-jobs/feed/software-development";
}

function buildWwrFeedUrl(profile) {
  const families = inferRoleFamilies(profile);
  if (families.includes("frontend")) return "https://weworkremotely.com/categories/remote-front-end-programming-jobs.rss";
  if (families.includes("backend")) return "https://weworkremotely.com/categories/remote-back-end-programming-jobs.rss";
  if (families.includes("devops") || families.includes("cloud")) return "https://weworkremotely.com/categories/remote-devops-sysadmin-jobs.rss";
  return "https://weworkremotely.com/categories/remote-programming-jobs.rss";
}

function buildRwfaFeedUrl(profile) {
  const families = inferRoleFamilies(profile);
  if (families.includes("frontend")) return "https://realworkfromanywhere.com/remote-frontend-jobs/rss.xml";
  if (families.includes("backend")) return "https://realworkfromanywhere.com/remote-backend-jobs/rss.xml";
  if (families.includes("fullstack")) return "https://realworkfromanywhere.com/remote-fullstack-jobs/rss.xml";
  if (families.includes("devops") || families.includes("cloud")) return "https://realworkfromanywhere.com/remote-devops-jobs/rss.xml";
  if (families.includes("ai_ml")) return "https://realworkfromanywhere.com/remote-ai-jobs/rss.xml";
  if (families.includes("data")) return "https://realworkfromanywhere.com/remote-data-jobs/rss.xml";
  return "https://realworkfromanywhere.com/remote-programming-jobs/rss.xml";
}

function copySyncLink() {
  saveVault();
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";
  url.searchParams.set("scout", encodeToken(normalizeVault(readJson(STORAGE_KEY))));
  copyText(url.toString(), "Copied Job Scout sync link");
}

function requestTextInput({ title, message, value = "", multiline = false }) {
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
    input.value = value;
    if (multiline) input.rows = 10;
    else input.type = "text";
    const actions = document.createElement("div");
    actions.className = "settings-dialog-actions";
    const cancel = createButton("Cancel", () => finish(null));
    cancel.className = "secondary-button";
    const save = document.createElement("button");
    save.type = "submit";
    save.className = "primary-button";
    save.textContent = "Save";
    actions.append(cancel, save);
    form.append(heading, note, input, actions);
    dialog.appendChild(form);
    document.body.appendChild(dialog);
    let done = false;
    function finish(result) {
      if (done) return;
      done = true;
      dialog.close();
      dialog.remove();
      resolve(result);
    }
    form.addEventListener("submit", event => {
      event.preventDefault();
      finish(input.value);
    });
    dialog.addEventListener("cancel", event => {
      event.preventDefault();
      finish(null);
    });
    dialog.showModal();
    input.focus();
  });
}

function buildLinkedInJobsUrl(role, location, profile) {
  const params = new URLSearchParams({
    keywords: role,
    location,
    geoId: "103644278",
    origin: "JOB_SEARCH_PAGE_SEARCH_BUTTON",
    refresh: "true",
    sortBy: "DD",
    spellCorrectionEnabled: "true"
  });
  params.set("f_E", "1,2");
  const time = linkedinTime(profile.freshness);
  if (time) params.set("f_TPR", time);
  return `https://www.linkedin.com/jobs/search/?${params.toString()}`;
}

function buildLinkedInPostsUrl(role, location, profile) {
  const params = new URLSearchParams({
    keywords: `"hiring" "${role}" ${location}`,
    origin: "GLOBAL_SEARCH_HEADER",
    sortBy: JSON.stringify(["date_posted"]),
    contentType: JSON.stringify(["jobs"])
  });
  const datePosted = profile.freshness === "1h" || profile.freshness === "24h" ? "past-24h" : profile.freshness === "week" ? "past-week" : "past-month";
  params.set("datePosted", JSON.stringify([datePosted]));
  return `https://www.linkedin.com/search/results/content/?${params.toString()}`;
}

function buildXHiringUrl(role, location, profile) {
  const keywords = getResumeKeywords(profile).slice(0, 5);
  const signal = [
    quote(role),
    keywords.length ? `(${keywords.map(quote).join(" OR ")})` : "",
    `("hiring" OR "#hiring" OR "#job" OR "#jobopening" OR "#nowhiring")`,
    `("${location}" OR remote OR "United States" OR USA)`,
    `("OPT" OR "STEM OPT" OR "visa sponsorship" OR "work authorization" OR "E-Verify")`,
    "lang:en -filter:retweets"
  ].filter(Boolean).join(" ");
  return `https://x.com/search?q=${encodeURIComponent(signal)}&src=typed_query&f=live`;
}

function buildHnAlgoliaUrl(role, location, profile) {
  const keywords = getResumeKeywords(profile).slice(0, 6).join(" ");
  const query = [role, keywords, location, "hiring jobs"].filter(Boolean).join(" ");
  const params = new URLSearchParams({
    dateRange: "all",
    page: "0",
    prefix: "false",
    query,
    sort: "byDate",
    type: "story"
  });
  return `https://hn.algolia.com/?${params.toString()}`;
}

function buildIndeedUrl(role, location, profile) {
  const params = new URLSearchParams({ q: role, l: location, sort: "date" });
  params.set("fromage", profile.freshness === "week" ? "7" : profile.freshness === "month" ? "14" : "1");
  return `https://www.indeed.com/jobs?${params.toString()}`;
}

function buildGoogleJobQuery(role, location, profile) {
  const level = profile.levels.slice(0, 6).map(quote).join(" OR ");
  const auth = profile.authTerms.slice(0, 7).map(quote).join(" OR ");
  return `${quote(role)} (${level}) (${auth}) (${quote(location)} OR USA OR "U.S.") (jobs OR careers OR hiring)`;
}

function buildResumeGoogleQuery(role, location, profile) {
  const keywords = getResumeKeywords(profile).slice(0, 8).map(quote).join(" OR ");
  const keywordBlock = keywords ? `(${keywords})` : "";
  return `${quote(role)} ${keywordBlock} (${quote(location)} OR USA OR "U.S.") (job OR careers OR hiring OR recruiter)`;
}

function buildGoogleUrl(query, freshness) {
  const params = new URLSearchParams({ q: query });
  const tbs = freshness === "1h" ? "qdr:h,sbd:1" : freshness === "24h" ? "qdr:d,sbd:1" : freshness === "week" ? "qdr:w,sbd:1" : "qdr:m,sbd:1";
  params.set("tbs", tbs);
  return `https://www.google.com/search?${params.toString()}`;
}

function buildCompactQuery(role, profile) {
  return [role, getPrimaryLocation(profile), profile.levels.slice(0, 2).join(" ")].filter(Boolean).join(" ");
}

function linkedinTime(freshness) {
  return {
    "1h": "r3600",
    "24h": "r86400",
    week: "r604800",
    month: "r2592000"
  }[freshness] || "r86400";
}

function getPrimaryRole(profile) {
  return profile.targetRoles[0] || profile.roleVariants[0] || "Software Engineer";
}

function getPrimaryLocation(profile) {
  return profile.locations[0] || "United States";
}

function quote(value) {
  return `"${String(value || "").replace(/"/g, "").trim()}"`;
}

function applyTemplate(template, values) {
  return String(template || "").replace(/\{(role|query|location|time)\}/gi, (match, key) => encodeURIComponent(values[key.toLowerCase()] || ""));
}

function matchesFromTerms(text, terms) {
  const haystack = normalize(text);
  return unique((terms || []).filter(term => includesTerm(haystack, term)));
}

function salaryMeetsMinimum(value, minBaseUsd) {
  const minimum = Number(minBaseUsd || 0);
  if (!minimum) return { ok: true, penalty: 0, reason: "" };
  const values = extractSalaryNumbers(value);
  if (!values.length) return { ok: true, penalty: 0, reason: "Salary not listed; keep for review" };
  if (Math.max(...values) >= minimum) return { ok: true, penalty: 0, reason: "" };
  return { ok: false, penalty: .9, reason: `Listed pay appears below $${minimum.toLocaleString()}` };
}

function extractSalaryNumbers(value) {
  const text = String(value || "").replace(/,/g, "");
  const out = [];
  for (const match of text.matchAll(/\b(\d{2,3})(?:\s?-\s?\d{2,3})?\s?k\b/gi)) {
    out.push(Number(match[1]) * 1000);
  }
  for (const match of text.matchAll(/\b([1-9]\d{4,5})\b/g)) {
    out.push(Number(match[1]));
  }
  return out.filter(value => Number.isFinite(value) && value >= 30000);
}

function inferWorkSetting(candidate) {
  const explicit = normalizeWorkSettingValue(candidate.workSetting);
  if (explicit) return { value: explicit, penalty: 0, reason: "" };
  const text = normalize(`${candidate.location} ${candidate.description}`);
  if (/\b(no remote|not remote|non remote|non-remote|in-office|in office|onsite|on-site)\b/.test(text)) {
    return { value: "onsite", penalty: .35, reason: "Work setting looks onsite; confirm commute/relocation" };
  }
  if (/\bhybrid\b/.test(text) && !/\bhybrid cloud|hybrid-cloud|hybrid infrastructure\b/.test(text)) {
    return { value: "hybrid", penalty: 0, reason: "" };
  }
  if (/\b(remote|remote us|remote united states|work from home)\b/.test(text)) {
    return { value: "remote", penalty: 0, reason: "" };
  }
  return { value: "unknown", penalty: .2, reason: "Work setting is unclear" };
}

function workSettingMatches(workSetting, preference) {
  const value = workSetting?.value || "unknown";
  switch (preference) {
    case "remote":
      return value === "remote";
    case "hybrid-onsite":
      return value === "hybrid" || value === "onsite" || value === "unknown";
    case "onsite":
      return value === "onsite" || value === "unknown";
    case "remote-hybrid-onsite":
    case "any":
    default:
      return true;
  }
}

function companyIdentity(candidate) {
  const domain = domainFromUrl(candidate.companyWebsite) || domainFromUrl(candidate.url) || guessDomain(candidate.company);
  return {
    domain,
    logoUrl: domain ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64` : "",
    initials: initials(candidate.company),
    strength: domain ? "domain" : "name"
  };
}

function domainFromUrl(value) {
  try {
    const url = new URL(String(value || ""));
    return url.hostname.replace(/^www\./i, "");
  } catch (error) {
    return "";
  }
}

function guessDomain(company) {
  const overrides = {
    google: "google.com",
    alphabet: "abc.xyz",
    amazon: "amazon.jobs",
    aws: "aws.amazon.com",
    microsoft: "microsoft.com",
    meta: "meta.com",
    apple: "apple.com",
    nvidia: "nvidia.com",
    openai: "openai.com",
    databricks: "databricks.com",
    snowflake: "snowflake.com",
    oracle: "oracle.com",
    salesforce: "salesforce.com",
    adobe: "adobe.com",
    servicenow: "servicenow.com",
    ibm: "ibm.com",
    cisco: "cisco.com",
    intuit: "intuit.com",
    walmart: "walmart.com",
    paypal: "paypal.com",
    linkedin: "linkedin.com"
  };
  const key = normalize(company).replace(/\b(llc|inc|corp|corporation|company|co|ltd|limited|services)\b/g, "").trim();
  const first = key.split(" ")[0];
  return overrides[key] || overrides[first] || "";
}

function getUrlAudit(candidate) {
  const items = [];
  let penalty = 0;
  const rawUrl = String(candidate.url || "").trim();
  if (!rawUrl) {
    return { items: ["No apply URL pasted"], penalty: .45 };
  }
  const domain = domainFromUrl(rawUrl);
  if (!domain) {
    return { items: ["Apply URL is malformed"], penalty: 1.5 };
  }
  if (/(^|\.)example\.(com|org|net)$|localhost|\.test$|\.invalid$/i.test(domain)) {
    items.push("Placeholder/test apply URL");
    penalty += 1.5;
  }
  if (/indeed\.com$/i.test(domain) && /\/pagead\/clk/i.test(rawUrl)) {
    items.push("Indeed tracking URL; open posting and capture real apply URL");
    penalty += .5;
  }
  if (/^(www\.)?(google|bing|duckduckgo|brave)\.com$/i.test(domain)) {
    items.push("Search-results URL, not a direct job URL");
    penalty += .8;
  }
  return { items, penalty };
}

function getSourceQuality(source) {
  const text = normalize(source);
  if (/linkedin/.test(text)) return 92;
  if (/indeed/.test(text)) return 88;
  if (/greenhouse|lever|ashby|workday|smartrecruiters|icims|bamboohr|careers|company/.test(text)) return 90;
  if (/h1b|sponsor/.test(text)) return 84;
  if (/built in|builtin|dice|simplify|hiringcafe|hiring cafe/.test(text)) return 78;
  if (/rss|remotive|we work remotely|real work/.test(text)) return 66;
  if (/google/.test(text)) return 72;
  if (/manual|import/.test(text)) return 62;
  return 68;
}

function getCompanyHealthProxy(candidate, identity, sourceQuality, text) {
  let score = 50;
  const notes = [];
  if (identity.domain) {
    score += 10;
    notes.push("company domain found");
  }
  if (sourceQuality >= 85) {
    score += 8;
    notes.push("strong source");
  }
  if (/\b(public|nasdaq|nyse|fortune|series [abcde]|profitable|growing|funded|ipo)\b/.test(text)) {
    score += 8;
    notes.push("stability signal");
  }
  if (/\b(layoff|restructuring|bankruptcy|shutdown|lawsuit|hiring freeze|stock decline)\b/.test(text)) {
    score -= 16;
    notes.push("risk wording");
  }
  if (/\b(unknown|stealth|confidential client)\b/.test(text)) {
    score -= 8;
    notes.push("identity needs review");
  }
  score = Math.max(0, Math.min(100, score));
  return {
    score,
    band: score >= 75 ? "healthy" : score >= 55 ? "mixed" : "caution",
    note: `Company signal: ${score}/100${notes.length ? ` (${notes.join(", ")})` : ""}`
  };
}

function getDecision(score, profile, warnings, urlAudit, seniorFlags, industryExcludes) {
  const seriousWarnings = warnings.items.some(item => /Citizenship|Clearance|Fee|Unpaid|Commission/.test(item));
  if (seriousWarnings || urlAudit.penalty >= 1.2 || seniorFlags.length || industryExcludes.length) return "Review";
  if (score >= Math.max(7, profile.minScore) && !urlAudit.items.length) return "Apply First";
  if (score >= profile.minScore) return "Review";
  return "Later";
}

function getConfidence(candidate, identity, urlAudit, skillHits) {
  let points = 0;
  if (candidate.description && candidate.description.length > 160) points += 1;
  if (identity.domain) points += 1;
  if (candidate.url && !urlAudit.items.length) points += 1;
  if (skillHits.length >= 3) points += 1;
  if (candidate.location) points += 1;
  return points >= 4 ? "high" : points >= 2 ? "medium" : "low";
}

function renderCompanyAvatar(identity, company) {
  const wrap = document.createElement("span");
  wrap.className = "company-avatar";
  const fallback = initials(company);
  if (identity?.logoUrl) {
    const img = document.createElement("img");
    img.src = identity.logoUrl;
    img.alt = "";
    img.loading = "lazy";
    img.addEventListener("error", () => {
      img.remove();
      wrap.textContent = fallback;
      wrap.classList.add("avatar-fallback");
    });
    wrap.append(img);
  } else {
    wrap.textContent = fallback;
    wrap.classList.add("avatar-fallback");
  }
  return wrap;
}

function pillClassForHealth(health) {
  const text = normalize(health);
  if (/native clean|direct|api|rss/.test(text)) return "pill-fit";
  if (/google|startup|specialty|remote/.test(text)) return "pill-domain";
  if (/optional|noisy|warning/.test(text)) return "pill-warning";
  return "";
}

function compactUrlPreview(url) {
  try {
    const parsed = new URL(url, window.location.href);
    const query = parsed.searchParams.get("q") || parsed.searchParams.get("keywords") || parsed.searchParams.get("search") || parsed.searchParams.get("query") || "";
    const preview = query ? `${parsed.hostname} -> ${decodeURIComponent(query).slice(0, 130)}` : `${parsed.hostname}${parsed.pathname}`;
    return preview.length > 170 ? `${preview.slice(0, 167)}...` : preview;
  } catch (error) {
    return String(url || "").slice(0, 170);
  }
}

function getResumeKeywords(profile) {
  if (profile.resumeKeywords?.length) return unique(profile.resumeKeywords);
  if (!profile.resumeText) return [];
  return extractResumeKeywords(profile.resumeText, profile).slice(0, 40);
}

function extractResumeKeywords(text, profile = {}) {
  const preferred = [
    ...(profile.skills || []),
    ...(profile.prioritySignals || []),
    ...(profile.targetRoles || []),
    ...(profile.roleVariants || [])
  ];
  const counts = tokenCounts(text);
  const preferredHits = preferred.filter(term => includesTerm(normalize(text), term));
  const technical = Array.from(counts.entries())
    .filter(([token, count]) => count >= 1 && token.length >= 3 && !STOP_WORDS.has(token))
    .sort((a, b) => b[1] - a[1] || b[0].length - a[0].length)
    .map(([token]) => token);
  return unique([...preferredHits, ...technical]).slice(0, 60);
}

function cosineSimilarity(left, right) {
  const leftCounts = tokenCounts(left);
  const rightCounts = tokenCounts(right);
  if (!leftCounts.size || !rightCounts.size) return 0;
  const vocabulary = new Set([...leftCounts.keys(), ...rightCounts.keys()]);
  let dot = 0;
  let leftNorm = 0;
  let rightNorm = 0;
  vocabulary.forEach(token => {
    const a = leftCounts.get(token) || 0;
    const b = rightCounts.get(token) || 0;
    dot += a * b;
    leftNorm += a * a;
    rightNorm += b * b;
  });
  if (!leftNorm || !rightNorm) return 0;
  return dot / (Math.sqrt(leftNorm) * Math.sqrt(rightNorm));
}

function tokenCounts(value) {
  const counts = new Map();
  tokenize(value).forEach(token => {
    counts.set(token, (counts.get(token) || 0) + 1);
  });
  return counts;
}

function tokenize(value) {
  return normalize(value)
    .replace(/[^a-z0-9+#. -]/g, " ")
    .split(/\s+/)
    .map(token => token.replace(/^[^a-z0-9]+|[^a-z0-9+#.]+$/g, ""))
    .filter(token => token.length >= 2 && !STOP_WORDS.has(token));
}

function createPill(text, className = "") {
  const pill = document.createElement("span");
  pill.className = `pill ${className}`.trim();
  pill.textContent = text;
  return pill;
}

function createButton(label, handler) {
  const button = document.createElement("button");
  button.type = "button";
  button.textContent = label;
  button.addEventListener("click", handler);
  return button;
}

function createLink(label, url) {
  const link = document.createElement("a");
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener";
  link.textContent = label;
  return link;
}

function candidateId(candidate) {
  return slug(`${candidate.company}-${candidate.title}-${candidate.url || candidate.location}`);
}

function mergeCandidates(left = [], right = []) {
  const byId = new Map();
  [...left, ...right].forEach(candidate => {
    if (!candidate || !candidate.id) return;
    const existing = byId.get(candidate.id) || {};
    byId.set(candidate.id, { ...existing, ...candidate, status: normalizeStatus(candidate.status || existing.status) });
  });
  return Array.from(byId.values());
}

function firstText(...values) {
  for (const value of values) {
    if (Array.isArray(value) && value.length) {
      const joined = value.filter(Boolean).join(", ");
      if (joined.trim()) return joined.trim();
    }
    if (value == null) continue;
    const text = String(value).trim();
    if (text) return text;
  }
  return "";
}

function normalizeStatus(value) {
  const text = String(value || "").trim().toLowerCase();
  const aliases = {
    opened: "Viewed",
    view: "Viewed",
    viewed: "Viewed",
    applied: "Applied",
    submitted: "Applied",
    interviewing: "Interviewing",
    interview: "Interviewing",
    declined: "Rejected",
    rejected: "Rejected",
    ignored: "Ignore",
    ignore: "Ignore",
    expired: "Expired",
    stale: "Expired",
    unopened: "Unopened",
    new: "Unopened"
  };
  return aliases[text] || "Unopened";
}

function normalizePosted(value) {
  const text = normalize(value);
  if (!text) return "old";
  if (/minute|min|just now|less than/.test(text)) return "minutes";
  if (/today|hour|1h|24h|day/.test(text)) return "today";
  if (/week|7d/.test(text)) return "week";
  return "old";
}

function normalizeWorkSettingValue(value) {
  if (typeof value === "boolean") return value ? "remote" : "";
  const text = normalize(value);
  if (!text) return "";
  if (/hybrid/.test(text) && !/hybrid cloud|hybrid-cloud|hybrid infrastructure/.test(text)) return "hybrid";
  if (/remote|work from home/.test(text) && !/not remote|no remote|non-remote|non remote/.test(text)) return "remote";
  if (/onsite|on-site|in office|in-office|office based|not remote|no remote|non-remote/.test(text)) return "onsite";
  return "";
}

function includesTerm(text, term) {
  const cleanTerm = normalize(term);
  return cleanTerm && text.includes(cleanTerm);
}

function normalize(value) {
  return String(value || "").toLowerCase().replace(/\s+/g, " ").trim();
}

function slug(value) {
  return normalize(value).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `lead-${Date.now()}`;
}

function unique(values) {
  return [...new Set((values || []).map(value => String(value || "").trim()).filter(Boolean))];
}

function initials(value) {
  const parts = String(value || "Company").replace(/[^a-zA-Z0-9 ]/g, " ").trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map(part => part[0]?.toUpperCase() || "").join("") || "C";
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, char => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;"
  }[char]));
}

function getFreshnessRank(value) {
  return { minutes: 5, today: 4, "24h": 3, week: 2, old: 1 }[value] || 1;
}

function formatPosted(value) {
  return {
    minutes: "Minutes ago",
    today: "Today",
    "24h": "Within 24h",
    week: "This week",
    old: "Older/unknown"
  }[value] || "Unknown";
}

function formatTime(value) {
  if (!value) return "now";
  try {
    return new Date(value).toLocaleString();
  } catch (error) {
    return "now";
  }
}

function escapeCell(value) {
  return String(value || "n/a").replace(/\|/g, "/");
}

function encodeToken(value) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(value))))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function decodeToken(token) {
  try {
    const normalized = String(token || "").replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    return JSON.parse(decodeURIComponent(escape(atob(padded))));
  } catch (error) {
    return null;
  }
}

function toggleTheme() {
  state.theme = document.documentElement.classList.contains("dark") ? "light" : "dark";
  document.documentElement.classList.toggle("dark", state.theme === "dark");
  syncThemeButton();
  saveVault();
}

function syncThemeButton() {
  els.themeToggle.textContent = document.documentElement.classList.contains("dark") ? "Light mode" : "Dark mode";
}

function copyText(text, message) {
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => showToast(message)).catch(() => showToast("Copy failed"));
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.add("show");
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => {
    els.toast.classList.remove("show");
  }, 2200);
}
