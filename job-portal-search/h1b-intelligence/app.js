const DATA = window.H1B_INTELLIGENCE_DATA || { sheets: {}, sheetOrder: [], rowCounts: {} };

const EMPLOYER_TABS = [
  { id: "shortlist", label: "Shortlist", sheet: "Personalized Shortlist" },
  { id: "applyFirst", label: "Apply First", sheet: "Apply First" },
  { id: "strongTargets", label: "Strong Targets", sheet: "Strong Targets" },
  { id: "hiddenGems", label: "Hidden Gems", sheet: "Hidden Gems" },
  { id: "entryLevel", label: "Entry Level", sheet: "Entry Level Evidence" },
  { id: "review", label: "Review", sheet: "Sponsorship Review" }
];

const SPECIAL_TABS = [
  { id: "weekly", label: "Weekly Plan" },
  { id: "insights", label: "Market Insights" },
  { id: "methodology", label: "Methodology" },
  { id: "raw", label: "Raw Data" }
];

const ALL_TABS = [...EMPLOYER_TABS, ...SPECIAL_TABS];
const EMPLOYER_SHEETS = new Set(EMPLOYER_TABS.map(tab => tab.sheet));
const PRIMARY_EMPLOYER_SHEETS = [
  "Apply First",
  "Strong Targets",
  "Hidden Gems",
  "Entry Level Evidence",
  "Sponsorship Review",
  "Personalized Shortlist",
  "Weekly Plan"
];
const STORAGE_KEY = "taran-h1b-intelligence-preferences-v2";
const VAULT_KEY = "taran-h1b-intelligence-vault";
const VAULT_BACKUP_KEY = "taran-h1b-intelligence-vault-backup";
const H1B_PROTECTED_STORAGE_PATTERN = /h1b.*intelligence|h1b.*vault|taran.*h1b/i;
const DEFAULT_ROLE_QUERY = "software data AI";
const EMPLOYER_CARD_BATCH_SIZE = 60;

const state = {
  tab: "applyFirst",
  visibleRows: [],
  visibleSheet: "Apply First",
  selectedRow: null,
  rawSheet: "Personalized Shortlist",
  pinnedEmployers: new Set(),
  favoriteEmployers: new Set(),
  checkedEmployers: new Set(),
  savedEmployerOrder: [],
  customCareerLinks: {},
  employerCardLimit: EMPLOYER_CARD_BATCH_SIZE
};

const els = {};

document.addEventListener("DOMContentLoaded", () => {
  cacheElements();
  populateSummaryMetrics();
  populateTabs();
  populateFilters();
  loadPreferences();
  applySyncFromUrl();
  bindEvents();
  loadTheme();
  render();
});

function cacheElements() {
  Object.assign(els, {
    dataStatus: document.getElementById("dataStatus"),
    themeToggle: document.getElementById("themeToggle"),
    summaryMetrics: document.getElementById("summaryMetrics"),
    searchInput: document.getElementById("searchInput"),
    roleFamilyFilter: document.getElementById("roleFamilyFilter"),
    stateFilter: document.getElementById("stateFilter"),
    cityFilter: document.getElementById("cityFilter"),
    priorityFilter: document.getElementById("priorityFilter"),
    evidenceFilter: document.getElementById("evidenceFilter"),
    confidenceFilter: document.getElementById("confidenceFilter"),
    modelFilter: document.getElementById("modelFilter"),
    minScoreFilter: document.getElementById("minScoreFilter"),
    minNewFilter: document.getElementById("minNewFilter"),
    sponsorTierFilter: document.getElementById("sponsorTierFilter"),
    minEntryFilter: document.getElementById("minEntryFilter"),
    minWageFilter: document.getElementById("minWageFilter"),
    reviewFilter: document.getElementById("reviewFilter"),
    resetFiltersButton: document.getElementById("resetFiltersButton"),
    tabList: document.getElementById("tabList"),
    visibleSummary: document.getElementById("visibleSummary"),
    openTopFiveButton: document.getElementById("openTopFiveButton"),
    copyTopFiveButton: document.getElementById("copyTopFiveButton"),
    openSelectedButton: document.getElementById("openSelectedButton"),
    copySelectedButton: document.getElementById("copySelectedButton"),
    copyPacketsButton: document.getElementById("copyPacketsButton"),
    copyCsvButton: document.getElementById("copyCsvButton"),
    clearCheckedButton: document.getElementById("clearCheckedButton"),
    copySyncButton: document.getElementById("copySyncButton"),
    contentPanel: document.getElementById("contentPanel"),
    selectedPanel: document.getElementById("selectedPanel"),
    pinnedEmployersPanel: document.getElementById("pinnedEmployersPanel"),
    pinnedCount: document.getElementById("pinnedCount"),
    savedEmployersStrip: document.getElementById("savedEmployersStrip"),
    pinnedEmployersGrid: document.getElementById("pinnedEmployersGrid"),
    openPinnedButton: document.getElementById("openPinnedButton"),
    copyPinnedButton: document.getElementById("copyPinnedButton"),
    clearPinnedButton: document.getElementById("clearPinnedButton"),
    clearFavoritesButton: document.getElementById("clearFavoritesButton"),
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
  [
    els.roleFamilyFilter,
    els.stateFilter,
    els.cityFilter,
    els.priorityFilter,
    els.evidenceFilter,
    els.confidenceFilter,
    els.modelFilter,
    els.minScoreFilter,
    els.minNewFilter,
    els.sponsorTierFilter,
    els.minEntryFilter,
    els.minWageFilter,
    els.reviewFilter
  ].forEach(control => {
    control.addEventListener("change", handleFilterChange);
  });

  // H-1B Search Drop Box (starts search only when clicked or Enter)
  setupSearchDropbox({
    input: els.searchInput,
    placeholderPrefix: "Search H-1B records for",
    ariaLabel: "H-1B search suggestions",
    getSuggestions: (query) => {
      const q = query.toLowerCase();
      const sheetName = state.visibleSheet || "Personalized Shortlist";
      const currentRows = getSheetRows(sheetName);
      const matchedNames = new Set();
      const suggestions = [];
      for (const row of currentRows) {
        const emp = (row.employerName || "").trim();
        if (emp && emp.toLowerCase().includes(q) && !matchedNames.has(emp.toLowerCase())) {
          matchedNames.add(emp.toLowerCase());
          suggestions.push({
            type: "employer",
            value: emp,
            title: emp,
            subtext: row.topRoleFamilies || row.employerModel || "",
            badge: row.applicationPriority || "Target"
          });
          if (suggestions.length >= 6) break;
        }
      }
      return suggestions;
    },
    onSearch: (val) => {
      els.searchInput.value = val;
      handleFilterChange();
    }
  });

  els.resetFiltersButton.addEventListener("click", resetFilters);
  els.openTopFiveButton.addEventListener("click", openTopFive);
  els.copyTopFiveButton.addEventListener("click", copyTopFive);
  els.openSelectedButton.addEventListener("click", openCheckedEmployers);
  els.copySelectedButton.addEventListener("click", copyCheckedPackets);
  els.copyPacketsButton.addEventListener("click", copyVisiblePackets);
  els.copyCsvButton.addEventListener("click", copyVisibleCsv);
  els.clearCheckedButton.addEventListener("click", clearCheckedEmployers);
  els.copySyncButton.addEventListener("click", copySyncLink);
  els.openPinnedButton.addEventListener("click", openPinnedEmployers);
  els.copyPinnedButton.addEventListener("click", copyPinnedPackets);
  els.clearPinnedButton.addEventListener("click", clearPinnedEmployers);
  els.clearFavoritesButton.addEventListener("click", clearFavoriteEmployers);
  els.themeToggle.addEventListener("click", toggleTheme);
  els.closeDetailButton.addEventListener("click", () => els.detailDialog.close());
  window.addEventListener("beforeunload", () => {
    persistPreferences();
  });
}

function populateSummaryMetrics() {
  const shortlist = getSheetRows("Personalized Shortlist");
  const applyFirst = getSheetRows("Apply First");
  const weekly = getSheetRows("Weekly Plan");
  const roleFamilies = getSheetRows("Role Families");
  const metrics = [
    ["Shortlist", formatNumber(shortlist.length), "ranked employers"],
    ["Apply First", formatNumber(applyFirst.length), "Tier A targets"],
    ["Weekly Plan", formatNumber(weekly.length), "scheduled employers"],
    ["Role Families", formatNumber(roleFamilies.length), "market tracks"]
  ];
  els.summaryMetrics.replaceChildren(...metrics.map(([label, value, note]) => {
    const card = document.createElement("article");
    card.className = "metric-card";
    card.append(createElement("span", label), createElement("strong", value), createElement("span", note));
    return card;
  }));
  els.dataStatus.textContent = `${formatNumber(Object.values(DATA.rowCounts || {}).reduce((sum, count) => sum + count, 0))} workbook rows loaded`;
}

function populateTabs() {
  const fragment = document.createDocumentFragment();
  ALL_TABS.forEach(tab => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "tab-button";
    button.role = "tab";
    button.textContent = tab.label;
    button.dataset.tab = tab.id;
    button.addEventListener("click", () => {
      state.tab = tab.id;
      resetEmployerCardLimit();
      persistPreferences();
      render();
    });
    fragment.appendChild(button);
  });
  els.tabList.appendChild(fragment);
}

function populateFilters() {
  const rows = EMPLOYER_TABS.flatMap(tab => getSheetRows(tab.sheet));
  fillSelect(els.roleFamilyFilter, "All role families", collectSplitValues(rows, "topRoleFamilies"));
  fillSelect(els.stateFilter, "All states", collectSplitValues(rows, "topWorksiteStates"));
  fillSelect(els.cityFilter, "All cities", collectSplitValues(rows, "topCities"));
  fillSelect(els.priorityFilter, "All priorities", collectValues(rows, "applicationPriority"));
  fillSelect(els.evidenceFilter, "All evidence", collectValues(rows, "sponsorshipEvidence"));
  fillSelect(els.confidenceFilter, "All confidence", collectValues(rows, "dataConfidence"));
  fillSelect(els.modelFilter, "All employer models", collectValues(rows, "employerModel"));
  fillSelect(els.reviewFilter, "All review flags", collectValues(rows, "employerReviewFlag"));
}

function fillSelect(select, label, values) {
  select.innerHTML = "";
  const all = document.createElement("option");
  all.value = "";
  all.textContent = label;
  select.appendChild(all);
  values.forEach(value => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = value;
    select.appendChild(option);
  });
}

function collectValues(rows, key) {
  return [...new Set(rows.map(row => row[key]).filter(Boolean))].sort((a, b) => String(a).localeCompare(String(b)));
}

function collectSplitValues(rows, key) {
  const values = new Set();
  rows.forEach(row => splitList(row[key]).forEach(value => values.add(value)));
  return [...values].sort((a, b) => a.localeCompare(b));
}

function render() {
  syncTabs();
  const employerTab = EMPLOYER_TABS.find(tab => tab.id === state.tab);
  if (employerTab) {
    renderEmployerSheet(employerTab.sheet);
  } else if (state.tab === "weekly") {
    renderWeeklyPlan();
  } else if (state.tab === "insights") {
    renderInsights();
  } else if (state.tab === "methodology") {
    renderMethodology();
  } else {
    renderRawData();
  }
  syncActionButtons();
  renderPinnedEmployers();
}

function syncTabs() {
  els.tabList.querySelectorAll(".tab-button").forEach(button => {
    button.setAttribute("aria-selected", String(button.dataset.tab === state.tab));
  });
}

function renderEmployerSheet(sheetName) {
  state.visibleSheet = sheetName;
  const rows = sortEmployerRowsForView(getSheetRows(sheetName).filter(matchesEmployerFilters));
  state.visibleRows = rows;
  const visibleRows = rows.slice(0, getEmployerCardLimit(rows.length));
  els.visibleSummary.textContent = `${formatNumber(rows.length)} visible from ${sheetName} - showing ${formatNumber(visibleRows.length)}`;
  els.copyPacketsButton.disabled = rows.length === 0;
  els.copyCsvButton.disabled = rows.length === 0;

  const heading = createSectionHeading(sheetName, `${formatNumber(rows.length)} matching employers`);
  const grid = document.createElement("div");
  grid.className = "cards-grid";
  const fragment = document.createDocumentFragment();
  visibleRows.forEach(row => fragment.appendChild(createEmployerCard(row, sheetName)));
  grid.appendChild(fragment);
  const nodes = [heading, grid];
  if (visibleRows.length < rows.length) {
    nodes.push(createEmployerLoadPanel(rows.length, visibleRows.length));
  }
  els.contentPanel.replaceChildren(...nodes);
}

function getEmployerCardLimit(total) {
  const limit = Number(state.employerCardLimit || EMPLOYER_CARD_BATCH_SIZE);
  return Math.min(total, Math.max(EMPLOYER_CARD_BATCH_SIZE, limit));
}

function resetEmployerCardLimit() {
  state.employerCardLimit = EMPLOYER_CARD_BATCH_SIZE;
}

function createEmployerLoadPanel(total, visible) {
  const panel = document.createElement("div");
  panel.className = "progressive-load-panel";
  panel.appendChild(createElement("p", `Showing ${formatNumber(visible)} of ${formatNumber(total)} employer cards for speed. Filters, Open Top-5, Copy Visible Packets, and CSV still use the full matching result set.`, "muted"));
  const actions = document.createElement("div");
  actions.className = "progressive-load-actions";
  actions.append(
    createButton(`Show next ${formatNumber(Math.min(EMPLOYER_CARD_BATCH_SIZE, total - visible))}`, () => {
      state.employerCardLimit = visible + EMPLOYER_CARD_BATCH_SIZE;
      render();
    }),
    createButton("Show all cards", () => {
      if (total > 250 && !window.confirm(`This will render ${formatNumber(total)} rich cards and may be slower. Continue?`)) {
        return;
      }
      state.employerCardLimit = total;
      render();
    })
  );
  panel.appendChild(actions);
  return panel;
}

function getDomainFromUrl(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace(/^www\./i, "");
  } catch {
    return "";
  }
}

function getCompanyIdentity(row) {
  const name = row?.employerName || "Company";
  const domain = getDomainFromUrl(getCareerUrl(row));
  const initials = String(name)
    .replace(/[^a-z0-9 ]/gi, " ")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map(part => part[0].toUpperCase())
    .join("") || "CO";
  const hue = Array.from(String(name)).reduce((sum, char) => sum + char.charCodeAt(0), 0) % 360;
  return {
    name,
    domain,
    initials,
    brandColor: `hsl(${hue} 72% 62%)`,
    logoUrl: domain ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=64` : ""
  };
}

function renderCompanyLogo(row, size = "md") {
  const identity = getCompanyIdentity(row);
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

function createCompanyIdentityHeader(row, options = {}) {
  const header = document.createElement("div");
  header.className = "company-identity-header";
  header.appendChild(renderCompanyLogo(row, options.logoSize || "md"));
  const copy = document.createElement("div");
  copy.className = "company-identity-copy";
  copy.append(
    createElement(options.level || "h3", options.title || `${row.rank || ""}. ${row.employerName || "Unknown employer"}`.trim()),
    createElement("p", options.subtitle || row.applicationPriority || "No priority", "row-subtitle")
  );
  header.appendChild(copy);
  if (options.score) {
    header.appendChild(createElement("div", options.score, "score-badge"));
  }
  return header;
}

function createActionGroup(label, items) {
  const group = document.createElement("div");
  group.className = "action-group";
  group.appendChild(createElement("span", label, "action-group-label"));
  const buttons = document.createElement("div");
  buttons.className = "action-group-buttons";
  items.filter(Boolean).forEach(item => {
    if (item.url) {
      buttons.appendChild(createLink(item.label, item.url));
    } else if (item.handler) {
      buttons.appendChild(createButton(item.label, item.handler));
    }
  });
  if (!buttons.children.length) {
    return document.createDocumentFragment();
  }
  group.appendChild(buttons);
  return group;
}

function findAction(actions, label) {
  return actions.find(action => action.label === label);
}

function createEmployerCard(row, sheetName) {
  const card = document.createElement("article");
  card.className = "company-card";
  const key = getEmployerKey(row);
  if (state.pinnedEmployers.has(key)) {
    card.classList.add("is-pinned");
  }
  if (state.favoriteEmployers.has(key)) {
    card.classList.add("is-favorite");
  }
  if (state.checkedEmployers.has(key)) {
    card.classList.add("is-checked");
  }

  const cardControls = document.createElement("div");
  cardControls.className = "card-controls";
  const checkLabel = document.createElement("label");
  checkLabel.className = "check-control";
  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.checked = state.checkedEmployers.has(key);
  checkbox.addEventListener("change", () => toggleCheckedEmployer(row, checkbox.checked));
  checkLabel.append(checkbox, document.createElement("span"));
  checkLabel.lastChild.textContent = "Select";
  cardControls.append(
    checkLabel,
    createButton(state.pinnedEmployers.has(key) ? "Unpin" : "Pin", () => togglePinnedEmployer(row)),
    createButton(state.favoriteEmployers.has(key) ? "Unfavorite" : "Favorite", () => toggleFavoriteEmployer(row))
  );

  const heading = createCompanyIdentityHeader(row, {
    subtitle: row.applicationPriority || "No priority",
    score: formatScore(row.candidateFitScore)
  });

  const pills = document.createElement("div");
  pills.className = "pill-list";
  [
    row.studentFriendliness,
    row.sponsorshipEvidence,
    row.dataConfidence,
    row.employerModel,
    row.employerReviewFlag,
    state.favoriteEmployers.has(key) ? "favorite" : ""
  ].filter(Boolean).forEach(value => pills.appendChild(createPill(value, /review|staffing|consulting/i.test(value) ? "review" : "")));

  const note = createElement("p", row.whyApply || "No workbook reason supplied.", "card-note");
  const evidence = document.createElement("div");
  evidence.className = "evidence-grid";
  evidence.append(
    createEvidence("New positions", formatNumber(row.newEmploymentPositions)),
    createEvidence("Tech LCAs", formatNumber(row.certifiedTechLcas)),
    createEvidence("Entry cases", formatNumber(row.explicitEntryCases)),
    createEvidence("Median wage", formatCurrency(row.medianAnnualWage))
  );

  const rolePills = document.createElement("div");
  rolePills.className = "pill-list";
  splitList(row.topRoleFamilies).slice(0, 6).forEach(value => rolePills.appendChild(createPill(value)));
  splitList(row.topWorksiteStates).slice(0, 5).forEach(value => rolePills.appendChild(createPill(value, "warning")));

  card.append(cardControls, heading, pills, note, evidence, rolePills, createActions(row, sheetName));
  return card;
}

function createActions(row, sheetName) {
  const actions = document.createElement("div");
  actions.className = "company-action-groups";
  const links = getEmployerActionItems(row);
  actions.append(
    createActionGroup("Primary", [
      findAction(links, "Careers"),
      findAction(links, "Command Center"),
      findAction(links, "LinkedIn Jobs")
    ]),
    createActionGroup("Signals", [
      findAction(links, "LinkedIn Posts"),
      findAction(links, "LinkedIn Recruiters"),
      findAction(links, "LinkedIn Company")
    ]),
    createActionGroup("Research", [
      findAction(links, "Indeed"),
      findAction(links, "Google Company")
    ]),
    createActionGroup("Manage", [
      { label: "Update Link", handler: () => editCareerLink(row) },
      hasCustomCareerLink(row) ? { label: "Reset Link", handler: () => resetCareerLink(row) } : null,
      { label: "Open Pack", handler: () => openEmployerLinkPack(row) },
      { label: "Copy Pack", handler: () => copyEmployerLinkPack(row) },
      { label: "Copy Packet", handler: () => copyRowsAsPackets([row]) },
      { label: "Details", handler: () => showDetails(row, sheetName) }
    ])
  );
  return actions;
}

function renderWeeklyPlan() {
  const rows = sortEmployerRowsForView(getSheetRows("Weekly Plan").filter(matchesWeeklyFilters));
  state.visibleSheet = "Weekly Plan";
  state.visibleRows = rows;
  els.visibleSummary.textContent = `${formatNumber(rows.length)} weekly targets`;
  els.copyPacketsButton.disabled = rows.length === 0;
  els.copyCsvButton.disabled = rows.length === 0;

  const wrapper = document.createElement("div");
  wrapper.className = "cards-grid";
  const weeks = groupBy(rows, row => row.applicationWeek || "Unscheduled");
  Object.entries(weeks).forEach(([week, weekRows]) => {
    const groupCard = document.createElement("article");
    groupCard.className = "week-card";
    groupCard.append(createElement("h3", `Week ${week}`), createElement("p", `${weekRows.length} employers`, "row-subtitle"));
    weekRows.forEach(row => {
      const item = document.createElement("div");
      item.className = "company-card";
      item.append(
        createElement("h3", row.employerName || "Unknown employer"),
        createElement("p", row.whyApply || "", "card-note"),
        createElement("p", row.recommendedAction || "", "row-subtitle"),
        createActions(row, "Weekly Plan")
      );
      groupCard.appendChild(item);
    });
    wrapper.appendChild(groupCard);
  });
  els.contentPanel.replaceChildren(createSectionHeading("Weekly Plan", "Grouped by application week"), wrapper);
}

function renderInsights() {
  state.visibleRows = [];
  els.visibleSummary.textContent = "Market insight sheets";
  els.copyPacketsButton.disabled = true;
  els.copyCsvButton.disabled = true;

  const grid = document.createElement("div");
  grid.className = "insights-grid";
  [
    ["Role Families", "ROLE_FAMILY", "CERTIFIED_LCAS"],
    ["States", "WORKSITE_STATE", "NEW_EMPLOYMENT_POSITIONS"],
    ["Industries", "INDUSTRY", "CERTIFIED_LCAS"],
    ["Salary by Role", "ROLE_FAMILY", "MEDIAN_WAGE"],
    ["Quarter Coverage", "FEDERAL_QUARTER", "CASES"]
  ].forEach(([sheetName, labelColumn, valueColumn]) => {
    grid.appendChild(createInsightCard(sheetName, labelColumn, valueColumn));
  });
  els.contentPanel.replaceChildren(createSectionHeading("Market Insights", "Demand, wage, and coverage context"), grid);
}

function createInsightCard(sheetName, labelColumn, valueColumn) {
  const sheet = getSheet(sheetName);
  const rows = sheet.rows || [];
  const labelKey = keyForColumn(sheet, labelColumn);
  const valueKey = keyForColumn(sheet, valueColumn);
  const card = document.createElement("article");
  card.className = "insight-card";
  card.append(createElement("h3", sheetName), createElement("p", `${formatNumber(rows.length)} rows`, "row-subtitle"));

  const table = createTable(sheet, rows, sheet.columns.slice(0, Math.min(sheet.columns.length, 6)));
  card.appendChild(table);

  if (labelKey && valueKey && rows.length) {
    const top = rows[0];
    card.prepend(createElement("p", `Top: ${top[labelKey] || "n/a"} - ${formatMetric(top[valueKey])}`, "card-note"));
  }
  return card;
}

function renderMethodology() {
  state.visibleRows = [];
  els.visibleSummary.textContent = "Workbook guidance and scoring method";
  els.copyPacketsButton.disabled = true;
  els.copyCsvButton.disabled = true;

  const content = document.createElement("div");
  content.className = "insights-grid";
  content.append(
    createInsightCard("Read Me", "Topic", "Guidance"),
    createInsightCard("Methodology", "Score Component", "Weight"),
    createInsightCard("Application Tracker", "Employer", "Status")
  );
  els.contentPanel.replaceChildren(createSectionHeading("Methodology", "How the score should be interpreted"), content);
}

function renderRawData() {
  const sheet = getSheet(state.rawSheet);
  const rows = filterRawRows(sheet.rows || []);
  state.visibleSheet = state.rawSheet;
  state.visibleRows = rows;
  els.visibleSummary.textContent = `${formatNumber(rows.length)} raw rows from ${state.rawSheet}`;
  els.copyPacketsButton.disabled = !EMPLOYER_SHEETS.has(state.rawSheet) || rows.length === 0;
  els.copyCsvButton.disabled = rows.length === 0;

  const tools = document.createElement("div");
  tools.className = "raw-tools";
  const label = document.createElement("label");
  label.className = "field";
  const select = document.createElement("select");
  DATA.sheetOrder.forEach(sheetName => {
    const option = document.createElement("option");
    option.value = sheetName;
    option.textContent = `${sheetName} (${DATA.rowCounts[sheetName] || 0})`;
    select.appendChild(option);
  });
  select.value = state.rawSheet;
  select.addEventListener("change", () => {
    state.rawSheet = select.value;
    persistPreferences();
    render();
  });
  label.append(createElement("span", "Workbook sheet"), select);
  tools.append(label, createElement("p", "Raw Data exposes every sheet, row, and column from the workbook.", "muted"));

  els.contentPanel.replaceChildren(
    createSectionHeading("Raw Data", "Full workbook view"),
    tools,
    createTable(sheet, rows, sheet.columns)
  );
}

function createTable(sheet, rows, columns) {
  const tableWrap = document.createElement("div");
  tableWrap.className = "table-wrap";
  const table = document.createElement("table");
  const thead = document.createElement("thead");
  const headerRow = document.createElement("tr");
  columns.forEach(column => headerRow.appendChild(createElement("th", column)));
  thead.appendChild(headerRow);
  const tbody = document.createElement("tbody");
  rows.forEach(row => {
    const tr = document.createElement("tr");
    columns.forEach(column => {
      const key = keyForColumn(sheet, column);
      tr.appendChild(createElement("td", formatCell(row[key])));
    });
    tbody.appendChild(tr);
  });
  if (!rows.length) {
    const tr = document.createElement("tr");
    const cell = createElement("td", "No rows for the current filters.");
    cell.colSpan = Math.max(columns.length, 1);
    tr.appendChild(cell);
    tbody.appendChild(tr);
  }
  table.append(thead, tbody);
  tableWrap.appendChild(table);
  return tableWrap;
}

function showDetails(row, sheetName) {
  const sheet = getSheet(sheetName);
  state.selectedRow = row;
  els.detailSheet.textContent = sheetName;
  els.detailTitle.textContent = row.employerName || "Workbook row";
  els.detailBody.replaceChildren(createDetailTabs(row, sheet));
  renderSelectedPanel(row, sheetName);
  els.detailDialog.showModal();
}

function createDetailTabs(row, sheet) {
  const wrapper = document.createElement("div");
  wrapper.className = "detail-tabs";
  const tabList = document.createElement("div");
  tabList.className = "detail-tab-list";
  const panels = document.createElement("div");
  panels.className = "detail-tab-panels";
  const tabs = [
    ["summary", "Summary", [
      ["Priority", row.applicationPriority],
      ["Fit score", formatScore(row.candidateFitScore)],
      ["Why apply", row.whyApply || row.recommendedAction],
      ["Student friendliness", row.studentFriendliness],
      ["Employer model", row.employerModel],
      ["Review flag", row.employerReviewFlag || "None"]
    ]],
    ["evidence", "Evidence", [
      ["Sponsorship evidence", row.sponsorshipEvidence],
      ["Data confidence", row.dataConfidence],
      ["New employment positions", formatNumber(row.newEmploymentPositions)],
      ["New employment cases", formatNumber(row.newEmploymentCases)],
      ["Certified tech LCAs", formatNumber(row.certifiedTechLcas)],
      ["Entry cases", formatNumber(row.explicitEntryCases)],
      ["Early-career signals", formatNumber(row.earlyCareerSignalCases)]
    ]],
    ["roles", "Roles", [
      ["Role families", row.topRoleFamilies],
      ["Top job titles", row.topJobTitles],
      ["Role family count", row.roleFamilyCount],
      ["Trend", row.trendLabel],
      ["Active fiscal years", row.activeFiscalYears]
    ]],
    ["locations", "Locations", [
      ["States", row.topWorksiteStates],
      ["Cities", row.topCities],
      ["Direct employer signal", row.directEmployerSignal],
      ["Secondary entity share", row.secondaryEntityShare],
      ["H1B dependent share", row.h1bDependentShare]
    ]],
    ["wages", "Wages", [
      ["Median annual wage", formatCurrency(row.medianAnnualWage)],
      ["PW level I/II share", row.pwLevel12Share],
      ["Total worker positions", formatNumber(row.totalWorkerPositions)],
      ["Career link", getCareerUrl(row)]
    ]],
    ["raw", "Raw Row", sheet.columns.map(column => [column, formatCell(row[keyForColumn(sheet, column)])])]
  ];

  tabs.forEach(([id, label, entries], index) => {
    const button = createButton(label, () => activateDetailTab(wrapper, id));
    button.className = "detail-tab-button";
    button.dataset.detailTab = id;
    button.setAttribute("aria-selected", String(index === 0));
    tabList.appendChild(button);

    const panel = document.createElement("section");
    panel.className = "detail-tab-panel";
    panel.dataset.detailPanel = id;
    panel.hidden = index !== 0;
    panel.appendChild(createDetailTable(entries));
    panels.appendChild(panel);
  });

  wrapper.append(tabList, panels);
  return wrapper;
}

function activateDetailTab(wrapper, id) {
  wrapper.querySelectorAll("[data-detail-tab]").forEach(button => {
    button.setAttribute("aria-selected", String(button.dataset.detailTab === id));
  });
  wrapper.querySelectorAll("[data-detail-panel]").forEach(panel => {
    panel.hidden = panel.dataset.detailPanel !== id;
  });
}

function createDetailTable(entries) {
  const table = document.createElement("table");
  table.className = "detail-table";
  const tbody = document.createElement("tbody");
  entries.forEach(([label, value]) => {
    const tr = document.createElement("tr");
    tr.append(createElement("th", label), createElement("td", value));
    tbody.appendChild(tr);
  });
  table.appendChild(tbody);
  return table;
}

function renderSelectedPanel(row, sheetName) {
  els.selectedPanel.innerHTML = "";
  els.selectedPanel.append(
    createCompanyIdentityHeader(row, {
      title: row.employerName || "Selected company",
      subtitle: `${sheetName} - Fit ${formatScore(row.candidateFitScore)}`,
      logoSize: "sm"
    }),
    createElement("p", row.whyApply || row.recommendedAction || "No note supplied.", "card-note"),
    createActions(row, sheetName)
  );
}

function renderPinnedEmployers() {
  const rows = getSavedEmployerRows();
  els.pinnedCount.textContent = `${formatNumber(state.pinnedEmployers.size)} pinned / ${formatNumber(state.favoriteEmployers.size)} favorites`;
  els.openPinnedButton.disabled = rows.length === 0;
  els.copyPinnedButton.disabled = rows.length === 0;
  els.clearPinnedButton.disabled = rows.length === 0;
  els.clearFavoritesButton.disabled = state.favoriteEmployers.size === 0;

  if (!rows.length) {
    const empty = document.createElement("article");
    empty.className = "company-card empty-card";
    empty.append(
      createElement("h3", "No saved H-1B companies yet"),
      createElement("p", "Use Pin or Favorite on any employer card to keep the company here with all actions available.", "muted")
    );
    els.savedEmployersStrip.replaceChildren(createElement("span", "Save companies to build a shortcut strip.", "muted"));
    els.pinnedEmployersGrid.replaceChildren(empty);
    return;
  }

  const strip = document.createDocumentFragment();
  rows.slice(0, 12).forEach(row => strip.appendChild(createSavedStripButton(row)));
  els.savedEmployersStrip.replaceChildren(strip);

  const fragment = document.createDocumentFragment();
  rows.forEach(row => fragment.appendChild(createSavedEmployerCard(row, rows)));
  els.pinnedEmployersGrid.replaceChildren(fragment);
}

function createSavedStripButton(row) {
  const button = document.createElement("button");
  button.type = "button";
  button.className = "saved-strip-button";
  button.append(
    renderCompanyLogo(row, "sm"),
    createElement("span", row.employerName || "Employer"),
    createElement("strong", formatScore(row.candidateFitScore))
  );
  button.addEventListener("click", () => {
    state.checkedEmployers.add(getEmployerKey(row));
    renderSelectedPanel(row, row._sourceSheet || state.visibleSheet || "Personalized Shortlist");
    persistPreferences();
    render();
  });
  return button;
}

function createSavedEmployerCard(row, rows) {
  const key = getEmployerKey(row);
  const card = createEmployerCard(row, row._sourceSheet || "Personalized Shortlist");
  const orderedRows = rows.filter(item => isSameSavedGroup(key, getEmployerKey(item)));
  const groupIndex = orderedRows.findIndex(item => getEmployerKey(item) === key);
  const orderControls = document.createElement("div");
  orderControls.className = "saved-order-controls";
  orderControls.append(
    createElement("span", state.pinnedEmployers.has(key) ? "Pinned order" : "Favorite order", "saved-order-label"),
    createButton("Top", () => moveSavedEmployerToTop(row)),
    createButton("Up", () => moveSavedEmployer(row, -1)),
    createButton("Down", () => moveSavedEmployer(row, 1))
  );
  orderControls.querySelectorAll("button")[0].disabled = groupIndex <= 0;
  orderControls.querySelectorAll("button")[1].disabled = groupIndex <= 0;
  orderControls.querySelectorAll("button")[2].disabled = groupIndex < 0 || groupIndex >= orderedRows.length - 1;
  card.prepend(orderControls);
  return card;
}

function syncActionButtons() {
  const selectedRows = getVisibleCheckedRows();
  const uncheckedRows = getUncheckedEmployerRows();
  const batchSize = Math.min(5, uncheckedRows.length);
  els.openTopFiveButton.textContent = selectedRows.length ? `Open Next ${batchSize || 5}` : `Open Top ${batchSize || 5}`;
  els.openTopFiveButton.disabled = uncheckedRows.length === 0;
  els.copyTopFiveButton.textContent = selectedRows.length ? `Copy Next ${batchSize || 5}` : `Copy Top ${batchSize || 5}`;
  els.copyTopFiveButton.disabled = uncheckedRows.length === 0;
  els.openSelectedButton.disabled = selectedRows.length === 0;
  els.copySelectedButton.disabled = selectedRows.length === 0;
  els.clearCheckedButton.disabled = state.checkedEmployers.size === 0;
}

function handleFilterChange() {
  resetEmployerCardLimit();
  persistPreferences();
  render();
}

function toggleCheckedEmployer(row, checked) {
  const key = getEmployerKey(row);
  if (!key) return;
  if (checked) {
    state.checkedEmployers.add(key);
  } else {
    state.checkedEmployers.delete(key);
  }
  persistPreferences();
  render();
}

function togglePinnedEmployer(row, forcePinned) {
  const key = getEmployerKey(row);
  if (!key) return;
  const shouldPin = typeof forcePinned === "boolean" ? forcePinned : !state.pinnedEmployers.has(key);
  if (shouldPin) {
    state.pinnedEmployers.add(key);
    moveSavedKeyToGroupTop(key);
  } else {
    state.pinnedEmployers.delete(key);
    removeSavedKeyIfUnused(key);
  }
  persistPreferences({ replaceVault: true });
  render();
  showToast(`${row.employerName || "Employer"} ${shouldPin ? "pinned" : "unpinned"}`);
}

function toggleFavoriteEmployer(row, forceFavorite) {
  const key = getEmployerKey(row);
  if (!key) return;
  const shouldFavorite = typeof forceFavorite === "boolean" ? forceFavorite : !state.favoriteEmployers.has(key);
  if (shouldFavorite) {
    state.favoriteEmployers.add(key);
    moveSavedKeyToGroupTop(key);
  } else {
    state.favoriteEmployers.delete(key);
    removeSavedKeyIfUnused(key);
  }
  persistPreferences({ replaceVault: true });
  render();
  showToast(`${row.employerName || "Employer"} ${shouldFavorite ? "favorited" : "unfavorited"}`);
}

function clearCheckedEmployers() {
  state.checkedEmployers.clear();
  persistPreferences();
  render();
  showToast("Cleared selected employers");
}

function clearPinnedEmployers() {
  state.pinnedEmployers.clear();
  cleanupSavedEmployerOrder();
  persistPreferences({ replaceVault: true });
  render();
  showToast("Cleared pinned employers");
}

function clearFavoriteEmployers() {
  state.favoriteEmployers.clear();
  cleanupSavedEmployerOrder();
  persistPreferences({ replaceVault: true });
  render();
  showToast("Cleared favorite employers");
}

function openTopFive() {
  const rows = getUncheckedEmployerRows().slice(0, 5);
  openCareerLinks(rows, "All visible employers are already selected", `Opened ${rows.length} employer links`, { markChecked: true });
}

function copyTopFive() {
  const rows = getUncheckedEmployerRows().slice(0, 5);
  if (!rows.length) {
    showToast("All visible employers are already selected");
    return;
  }
  copyEmployerCareerLinks(rows, `Copied ${rows.length} employer career links`);
}

function openCheckedEmployers() {
  openCareerLinks(getVisibleCheckedRows(), "Select visible employers first", "Opened selected employer links");
}

function openPinnedEmployers() {
  openCareerLinks(getSavedEmployerRows(), "Save employers first", "Opened saved employer links");
}

function openCareerLinks(rows, emptyMessage, successMessage, options = {}) {
  const links = rows.map(getCareerUrl).filter(Boolean);
  if (!links.length) {
    showToast(emptyMessage);
    return;
  }
  if (options.markChecked) {
    rows.forEach(row => {
      const key = getEmployerKey(row);
      if (key) state.checkedEmployers.add(key);
    });
    persistPreferences();
  }
  links.forEach(url => window.open(url, "_blank", "noopener"));
  if (options.markChecked) {
    render();
  }
  showToast(successMessage);
}

function copyCheckedPackets() {
  const rows = getVisibleCheckedRows();
  if (!rows.length) {
    showToast("Select visible employers first");
    return;
  }
  copyRowsAsPackets(rows);
}

function copyPinnedPackets() {
  const rows = getSavedEmployerRows();
  if (!rows.length) {
    showToast("Save employers first");
    return;
  }
  copyRowsAsPackets(rows);
}

function getSavedEmployerRows() {
  cleanupSavedEmployerOrder();
  return getSavedEmployerKeys()
    .sort(compareSavedKeys)
    .map(getEmployerByKey)
    .filter(Boolean);
}

function getSavedEmployerKeys() {
  return [...new Set([...state.pinnedEmployers, ...state.favoriteEmployers])];
}

function cleanupSavedEmployerOrder() {
  const saved = new Set(getSavedEmployerKeys());
  state.savedEmployerOrder = state.savedEmployerOrder.filter(key => saved.has(key));
  getSavedEmployerKeys().forEach(key => {
    if (!state.savedEmployerOrder.includes(key)) {
      state.savedEmployerOrder.push(key);
    }
  });
}

function compareSavedKeys(a, b) {
  const groupDiff = getSavedGroupRank(a) - getSavedGroupRank(b);
  if (groupDiff) return groupDiff;
  const indexA = getSavedOrderIndex(a);
  const indexB = getSavedOrderIndex(b);
  return indexA - indexB;
}

function getSavedGroupRank(key) {
  if (state.pinnedEmployers.has(key)) return 0;
  if (state.favoriteEmployers.has(key)) return 1;
  return 2;
}

function getSavedOrderIndex(key) {
  const index = state.savedEmployerOrder.indexOf(key);
  return index >= 0 ? index : Number.MAX_SAFE_INTEGER;
}

function sortEmployerRowsForView(rows) {
  cleanupSavedEmployerOrder();
  return [...rows].sort((a, b) => {
    const keyA = getEmployerKey(a);
    const keyB = getEmployerKey(b);
    const savedDiff = getSavedGroupRank(keyA) - getSavedGroupRank(keyB);
    if (savedDiff) return savedDiff;
    const indexDiff = getSavedOrderIndex(keyA) - getSavedOrderIndex(keyB);
    if (indexDiff) return indexDiff;
    return 0;
  });
}

function isSameSavedGroup(a, b) {
  return getSavedGroupRank(a) === getSavedGroupRank(b);
}

function moveSavedEmployer(row, direction) {
  const key = getEmployerKey(row);
  if (!key) return;
  cleanupSavedEmployerOrder();
  const groupKeys = getSavedEmployerKeys().sort(compareSavedKeys).filter(item => isSameSavedGroup(key, item));
  const currentIndex = groupKeys.indexOf(key);
  const nextIndex = currentIndex + direction;
  if (currentIndex < 0 || nextIndex < 0 || nextIndex >= groupKeys.length) {
    return;
  }
  [groupKeys[currentIndex], groupKeys[nextIndex]] = [groupKeys[nextIndex], groupKeys[currentIndex]];
  writeSavedGroupOrder(key, groupKeys);
  persistPreferences({ replaceVault: true });
  render();
}

function moveSavedEmployerToTop(row) {
  const key = getEmployerKey(row);
  if (!key) return;
  cleanupSavedEmployerOrder();
  const groupKeys = getSavedEmployerKeys().sort(compareSavedKeys).filter(item => isSameSavedGroup(key, item));
  const nextGroupKeys = [key, ...groupKeys.filter(item => item !== key)];
  writeSavedGroupOrder(key, nextGroupKeys);
  persistPreferences({ replaceVault: true });
  render();
}

function moveSavedKeyToGroupTop(key) {
  cleanupSavedEmployerOrder();
  const groupKeys = getSavedEmployerKeys().sort(compareSavedKeys).filter(item => isSameSavedGroup(key, item));
  writeSavedGroupOrder(key, [key, ...groupKeys.filter(item => item !== key)]);
}

function removeSavedKeyIfUnused(key) {
  if (state.pinnedEmployers.has(key) || state.favoriteEmployers.has(key)) {
    return;
  }
  state.savedEmployerOrder = state.savedEmployerOrder.filter(item => item !== key);
}

function writeSavedGroupOrder(referenceKey, groupKeys) {
  const groupRank = getSavedGroupRank(referenceKey);
  const otherKeys = state.savedEmployerOrder.filter(key => getSavedGroupRank(key) !== groupRank);
  if (groupRank === 0) {
    state.savedEmployerOrder = [...groupKeys, ...otherKeys];
    return;
  }
  const pinnedKeys = state.savedEmployerOrder.filter(key => getSavedGroupRank(key) === 0);
  const remainingOtherKeys = otherKeys.filter(key => getSavedGroupRank(key) !== 0);
  state.savedEmployerOrder = [...pinnedKeys, ...groupKeys, ...remainingOtherKeys];
}

function getUncheckedEmployerRows() {
  return state.visibleRows
    .filter(row => row.employerName)
    .filter(row => !state.checkedEmployers.has(getEmployerKey(row)));
}

function copyEmployerCareerLinks(rows, message) {
  const links = rows.map(row => `${row.employerName || "Employer"}: ${getCareerUrl(row)}`).filter(Boolean);
  if (!links.length) {
    showToast("No links to copy");
    return;
  }
  copyText(links.join("\n"), message);
}

function openEmployerLinkPack(row) {
  const links = getEmployerLinkPack(row);
  if (!links.length) {
    showToast("No links to open");
    return;
  }
  links.forEach(url => window.open(url, "_blank", "noopener"));
  showToast(`Opened ${links.length} links for ${row.employerName || "employer"}`);
}

function copyEmployerLinkPack(row) {
  const lines = getEmployerActionItems(row).map(action => `${action.label}: ${action.url}`);
  copyText(lines.join("\n"), `Copied links for ${row.employerName || "employer"}`);
}

function requestTextInput({ title, message, value = "", placeholder = "" }) {
  return new Promise(resolve => {
    const dialog = document.createElement("dialog");
    dialog.className = "settings-dialog";
    const form = document.createElement("form");
    form.method = "dialog";

    const heading = document.createElement("h3");
    heading.textContent = title;
    const note = document.createElement("p");
    note.textContent = message;
    const input = document.createElement("input");
    input.type = "text";
    input.value = value || "";
    input.placeholder = placeholder;

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
      if (settled) return;
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

async function editCareerLink(row) {
  const current = getCareerUrl(row);
  const next = await requestTextInput({
    title: `Update ${row.employerName || "employer"} link`,
    message: "This saved link replaces the workbook/default career search link everywhere on this H-1B page.",
    value: current,
    placeholder: "https://company.com/careers"
  });
  if (next === null) return;
  const trimmed = next.trim();
  const key = getEmployerKey(row);
  if (!trimmed) {
    delete state.customCareerLinks[key];
    persistPreferences({ replaceVault: true });
    render();
    showToast("Custom link removed");
    return;
  }
  if (!/^https?:\/\//i.test(trimmed)) {
    showToast("Use a full https:// link");
    return;
  }
  state.customCareerLinks[key] = trimmed;
  persistPreferences({ replaceVault: true });
  render();
  showToast("Custom link saved");
}

function resetCareerLink(row) {
  const key = getEmployerKey(row);
  delete state.customCareerLinks[key];
  persistPreferences({ replaceVault: true });
  render();
  showToast("Career link reset");
}

function matchesEmployerFilters(row) {
  const text = getSearchText(row);
  const query = normalize(els.searchInput.value);
  if (query && !text.includes(query)) return false;
  if (els.roleFamilyFilter.value && !splitList(row.topRoleFamilies).includes(els.roleFamilyFilter.value)) return false;
  if (els.stateFilter.value && !splitList(row.topWorksiteStates).includes(els.stateFilter.value)) return false;
  if (els.cityFilter.value && !splitList(row.topCities).includes(els.cityFilter.value)) return false;
  if (els.priorityFilter.value && row.applicationPriority !== els.priorityFilter.value) return false;
  if (els.evidenceFilter.value && row.sponsorshipEvidence !== els.evidenceFilter.value) return false;
  if (els.confidenceFilter.value && row.dataConfidence !== els.confidenceFilter.value) return false;
  if (els.modelFilter.value && row.employerModel !== els.modelFilter.value) return false;
  if (Number(els.minScoreFilter.value || 0) && Number(row.candidateFitScore || 0) < Number(els.minScoreFilter.value)) return false;
  if (Number(els.minNewFilter.value || 0) && Number(row.newEmploymentPositions || 0) < Number(els.minNewFilter.value)) return false;
  if (els.sponsorTierFilter.value && getSponsorTier(row) !== els.sponsorTierFilter.value) return false;
  if (Number(els.minEntryFilter.value || 0) && Number(row.explicitEntryCases || 0) < Number(els.minEntryFilter.value)) return false;
  if (Number(els.minWageFilter.value || 0) && Number(row.medianAnnualWage || 0) < Number(els.minWageFilter.value)) return false;
  if (els.reviewFilter.value && row.employerReviewFlag !== els.reviewFilter.value) return false;
  return true;
}

function matchesWeeklyFilters(row) {
  const text = getSearchText(row);
  const query = normalize(els.searchInput.value);
  if (query && !text.includes(query)) return false;
  if (els.roleFamilyFilter.value && !splitList(row.topRoleFamilies).includes(els.roleFamilyFilter.value)) return false;
  if (els.stateFilter.value && !splitList(row.topWorksiteStates).includes(els.stateFilter.value)) return false;
  if (els.priorityFilter.value && row.applicationPriority !== els.priorityFilter.value) return false;
  if (Number(els.minScoreFilter.value || 0) && Number(row.candidateFitScore || 0) < Number(els.minScoreFilter.value)) return false;
  if (els.sponsorTierFilter.value && getSponsorTier(row) !== els.sponsorTierFilter.value) return false;
  if (Number(els.minEntryFilter.value || 0) && Number(row.explicitEntryCases || 0) < Number(els.minEntryFilter.value)) return false;
  if (Number(els.minWageFilter.value || 0) && Number(row.medianAnnualWage || 0) < Number(els.minWageFilter.value)) return false;
  if (els.reviewFilter.value && row.employerReviewFlag !== els.reviewFilter.value) return false;
  return true;
}

function getSponsorTier(row) {
  const score = Number(row.candidateFitScore || 0);
  const positions = Number(row.newEmploymentPositions || 0);
  const evidence = normalize(row.sponsorshipEvidence);
  if (score >= 88 || positions >= 200 || evidence.includes("strong")) return "tier1";
  if (score >= 82 || positions >= 25 || evidence.includes("moderate")) return "tier2";
  return "tier3";
}

function filterRawRows(rows) {
  const query = normalize(els.searchInput.value);
  if (!query) return rows;
  return rows.filter(row => Object.values(row).some(value => normalize(value).includes(query)));
}

function getSearchText(row) {
  return normalize([
    row.employerName,
    row.whyApply,
    row.topRoleFamilies,
    row.topWorksiteStates,
    row.topCities,
    row.topJobTitles,
    row.recommendedAction,
    row.employerReviewFlag
  ].filter(Boolean).join(" "));
}

function resetFilters() {
  [
    els.searchInput,
    els.minScoreFilter,
    els.minNewFilter,
    els.minEntryFilter,
    els.minWageFilter
  ].forEach(input => {
    input.value = "";
  });
  [
    els.roleFamilyFilter,
    els.stateFilter,
    els.cityFilter,
    els.priorityFilter,
    els.evidenceFilter,
    els.confidenceFilter,
    els.modelFilter,
    els.sponsorTierFilter,
    els.reviewFilter
  ].forEach(select => {
    select.value = "";
  });
  resetEmployerCardLimit();
  persistPreferences();
  render();
}

function getEmployerActionItems(row) {
  const actions = [
    { label: "Careers", url: getCareerUrl(row) },
    { label: "Command Center", url: buildCommandCenterUrl(row) },
    { label: "Google Company", url: buildGoogleCompanyUrl(row) },
    { label: "LinkedIn Jobs", url: buildLinkedInJobsUrl(row) },
    { label: "LinkedIn Posts", url: buildLinkedInPostsUrl(row) },
    { label: "LinkedIn Recruiters", url: buildLinkedInRecruiterUrl(row) },
    { label: "LinkedIn Company", url: buildLinkedInCompanyUrl(row) },
    { label: "Indeed", url: buildIndeedUrl(row) }
  ];
  return actions.filter(action => action.url);
}

function getEmployerLinkPack(row) {
  return getEmployerActionItems(row).map(action => action.url).filter(Boolean);
}

function getCareerUrl(row) {
  const key = getEmployerKey(row);
  return state.customCareerLinks[key] || row.careerSearchUrl || buildGoogleCompanyUrl(row);
}

function hasCustomCareerLink(row) {
  return Boolean(state.customCareerLinks[getEmployerKey(row)]);
}

function getCheckedRows() {
  return Array.from(state.checkedEmployers).map(getEmployerByKey).filter(Boolean);
}

function getVisibleCheckedRows() {
  return state.visibleRows
    .filter(row => row.employerName)
    .filter(row => state.checkedEmployers.has(getEmployerKey(row)));
}

function copyVisiblePackets() {
  if (!state.visibleRows.length) {
    showToast("No rows to copy");
    return;
  }
  copyRowsAsPackets(state.visibleRows);
}

function copyRowsAsPackets(rows) {
  const packets = rows.map(row => [
    `Employer: ${row.employerName || "Unknown"}`,
    `Fit score: ${formatScore(row.candidateFitScore)}`,
    `Priority: ${row.applicationPriority || "n/a"}`,
    `Student friendliness: ${row.studentFriendliness || "n/a"}`,
    `Sponsorship evidence: ${row.sponsorshipEvidence || "n/a"}`,
    `Data confidence: ${row.dataConfidence || "n/a"}`,
    `Why apply: ${row.whyApply || row.recommendedAction || "n/a"}`,
    `New employment positions: ${formatNumber(row.newEmploymentPositions)}`,
    `Certified tech LCAs: ${formatNumber(row.certifiedTechLcas)}`,
    `Entry cases: ${formatNumber(row.explicitEntryCases)}`,
    `Top role families: ${row.topRoleFamilies || "n/a"}`,
    `Top states: ${row.topWorksiteStates || "n/a"}`,
    `Top cities: ${row.topCities || "n/a"}`,
    `Median wage: ${formatCurrency(row.medianAnnualWage)}`,
    `Review flag: ${row.employerReviewFlag || "n/a"}`,
    `Career link: ${getCareerUrl(row)}`,
    `LinkedIn jobs: ${buildLinkedInJobsUrl(row)}`,
    `Command Center: ${buildCommandCenterUrl(row)}`
  ].join("\n"));
  copyText(packets.join("\n\n---\n\n"), `Copied ${rows.length} sponsorship packet${rows.length === 1 ? "" : "s"}`);
}

function copyVisibleCsv() {
  if (!state.visibleRows.length) {
    showToast("No rows to copy");
    return;
  }
  const sheet = getSheet(state.visibleSheet);
  const rows = state.visibleRows;
  const csvRows = [sheet.columns.join(",")];
  rows.forEach(row => {
    csvRows.push(sheet.columns.map(column => {
      const value = formatCell(row[keyForColumn(sheet, column)]);
      return `"${String(value).replace(/"/g, '""')}"`;
    }).join(","));
  });
  copyText(csvRows.join("\n"), `Copied ${rows.length} rows as CSV`);
}

function copyText(text, message) {
  navigator.clipboard.writeText(text).then(() => showToast(message)).catch(() => showToast("Copy failed"));
}

function getPreferencesSnapshot() {
  return {
    tab: state.tab,
    rawSheet: state.rawSheet,
    filters: {
      search: els.searchInput.value,
      roleFamily: els.roleFamilyFilter.value,
      state: els.stateFilter.value,
      city: els.cityFilter.value,
      priority: els.priorityFilter.value,
      evidence: els.evidenceFilter.value,
      confidence: els.confidenceFilter.value,
      model: els.modelFilter.value,
      minScore: els.minScoreFilter.value,
      minNew: els.minNewFilter.value,
      sponsorTier: els.sponsorTierFilter.value,
      minEntry: els.minEntryFilter.value,
      minWage: els.minWageFilter.value,
      review: els.reviewFilter.value
    },
    pinnedEmployers: Array.from(state.pinnedEmployers),
    favoriteEmployers: Array.from(state.favoriteEmployers),
    checkedEmployers: Array.from(state.checkedEmployers),
    savedEmployerOrder: state.savedEmployerOrder,
    customCareerLinks: sanitizeCustomLinks(state.customCareerLinks)
  };
}

function persistPreferences(options = {}) {
  if (!options.replaceVault) {
    mergeVaultIntoState(readVault());
  }
  const snapshot = getPreferencesSnapshot();
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  saveVault(snapshot, { replace: Boolean(options.replaceVault) });
}

function loadPreferences() {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
    if (stored) applyPreferences(stored);
    mergeVaultIntoState(readVault());
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    mergeVaultIntoState(readVault());
  }
}

function applySyncFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const tabId = params.get("h1bTab");
  if (tabId && ALL_TABS.some(tab => tab.id === tabId)) {
    state.tab = tabId;
  }
  const token = params.get("h1bPrefs");
  if (!token) return;
  const prefs = decodeSyncToken(token);
  if (!prefs) {
    showToast("Sync link could not be read");
    return;
  }
  applyPreferences(prefs, { mergeSaved: true });
  persistPreferences();
  showToast("H-1B settings synced");
}

function applyPreferences(prefs, options = {}) {
  if (!prefs || typeof prefs !== "object") return;
  const validTab = ALL_TABS.some(tab => tab.id === prefs.tab);
  if (validTab) state.tab = prefs.tab;
  if (DATA.sheets[prefs.rawSheet]) state.rawSheet = prefs.rawSheet;

  const filters = prefs.filters || {};
  setControlValue(els.searchInput, filters.search || "");
  setControlValue(els.roleFamilyFilter, filters.roleFamily || "");
  setControlValue(els.stateFilter, filters.state || "");
  setControlValue(els.cityFilter, filters.city || "");
  setControlValue(els.priorityFilter, filters.priority || "");
  setControlValue(els.evidenceFilter, filters.evidence || "");
  setControlValue(els.confidenceFilter, filters.confidence || "");
  setControlValue(els.modelFilter, filters.model || "");
  setControlValue(els.minScoreFilter, filters.minScore || "");
  setControlValue(els.minNewFilter, filters.minNew || "");
  setControlValue(els.sponsorTierFilter, filters.sponsorTier || "");
  setControlValue(els.minEntryFilter, filters.minEntry || "");
  setControlValue(els.minWageFilter, filters.minWage || "");
  setControlValue(els.reviewFilter, filters.review || "");

  const pinned = new Set(Array.isArray(prefs.pinnedEmployers) ? prefs.pinnedEmployers : []);
  const favorites = new Set(Array.isArray(prefs.favoriteEmployers) ? prefs.favoriteEmployers : []);
  state.pinnedEmployers = options.mergeSaved ? new Set([...state.pinnedEmployers, ...pinned]) : pinned;
  state.favoriteEmployers = options.mergeSaved ? new Set([...state.favoriteEmployers, ...favorites]) : favorites;
  state.checkedEmployers = new Set(Array.isArray(prefs.checkedEmployers) ? prefs.checkedEmployers : []);
  state.savedEmployerOrder = Array.isArray(prefs.savedEmployerOrder) ? prefs.savedEmployerOrder.filter(key => typeof key === "string") : [];
  cleanupSavedEmployerOrder();
  state.customCareerLinks = options.mergeSaved
    ? { ...state.customCareerLinks, ...sanitizeCustomLinks(prefs.customCareerLinks || {}) }
    : sanitizeCustomLinks(prefs.customCareerLinks || {});
}

function readStoredJson(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "null") || null;
  } catch {
    return null;
  }
}

function readProtectedVaultSnapshots() {
  const snapshots = [];
  const seen = new Set();
  [VAULT_BACKUP_KEY, VAULT_KEY, STORAGE_KEY].forEach(key => {
    const value = readStoredJson(key);
    if (value) {
      seen.add(key);
      snapshots.push(value);
    }
  });

  try {
    for (let index = 0; index < localStorage.length; index += 1) {
      const key = localStorage.key(index);
      if (!key || seen.has(key) || !H1B_PROTECTED_STORAGE_PATTERN.test(key)) {
        continue;
      }
      const value = readStoredJson(key);
      if (value && typeof value === "object" && !Array.isArray(value)) {
        snapshots.push(value);
      }
    }
  } catch {
    // Direct keys above are enough when storage enumeration is unavailable.
  }
  return snapshots;
}

function normalizeVault(raw) {
  const source = raw?.h1bVault || raw?.settings || raw || {};
  const pinned = Array.isArray(source.pinnedEmployers) ? source.pinnedEmployers : [];
  const favorites = Array.isArray(source.favoriteEmployers) ? source.favoriteEmployers : [];
  const order = Array.isArray(source.savedEmployerOrder) ? source.savedEmployerOrder : [];
  return {
    version: 2,
    updatedAt: source.updatedAt || "",
    pinnedEmployers: pinned.filter(key => getEmployerByKey(key)),
    favoriteEmployers: favorites.filter(key => getEmployerByKey(key)),
    savedEmployerOrder: order.filter(key => typeof key === "string" && getEmployerByKey(key)),
    customCareerLinks: sanitizeCustomLinks(source.customCareerLinks || {})
  };
}

function readVault() {
  return readProtectedVaultSnapshots()
    .map(normalizeVault)
    .reduce((acc, item) => mergeVaults(acc, item), normalizeVault({}));
}

function readCurrentVaultKeysOnly() {
  const primary = normalizeVault(readStoredJson(VAULT_KEY));
  const backup = normalizeVault(readStoredJson(VAULT_BACKUP_KEY));
  return {
    version: 2,
    updatedAt: primary.updatedAt || backup.updatedAt || "",
    pinnedEmployers: [...new Set([...backup.pinnedEmployers, ...primary.pinnedEmployers])],
    favoriteEmployers: [...new Set([...backup.favoriteEmployers, ...primary.favoriteEmployers])],
    savedEmployerOrder: [...new Set([...backup.savedEmployerOrder, ...primary.savedEmployerOrder])],
    customCareerLinks: { ...backup.customCareerLinks, ...primary.customCareerLinks }
  };
}

function mergeVaults(...vaults) {
  return vaults.reduce((acc, itemRaw) => {
    const item = normalizeVault(itemRaw);
    return {
      version: 2,
      updatedAt: item.updatedAt || acc.updatedAt || "",
      pinnedEmployers: [...new Set([...acc.pinnedEmployers, ...item.pinnedEmployers])],
      favoriteEmployers: [...new Set([...acc.favoriteEmployers, ...item.favoriteEmployers])],
      savedEmployerOrder: [...new Set([...acc.savedEmployerOrder, ...item.savedEmployerOrder])],
      customCareerLinks: { ...acc.customCareerLinks, ...item.customCareerLinks }
    };
  }, {
    version: 2,
    updatedAt: "",
    pinnedEmployers: [],
    favoriteEmployers: [],
    savedEmployerOrder: [],
    customCareerLinks: {}
  });
}

function mergeVaultIntoState(raw) {
  const vault = normalizeVault(raw);
  vault.pinnedEmployers.forEach(key => state.pinnedEmployers.add(key));
  vault.favoriteEmployers.forEach(key => state.favoriteEmployers.add(key));
  state.savedEmployerOrder = [...new Set([...vault.savedEmployerOrder, ...state.savedEmployerOrder])];
  state.customCareerLinks = { ...state.customCareerLinks, ...vault.customCareerLinks };
  cleanupSavedEmployerOrder();
}

function saveVault(snapshot = getPreferencesSnapshot(), options = {}) {
  const current = {
    version: 2,
    updatedAt: new Date().toISOString(),
    pinnedEmployers: snapshot.pinnedEmployers || [],
    favoriteEmployers: snapshot.favoriteEmployers || [],
    savedEmployerOrder: snapshot.savedEmployerOrder || [],
    customCareerLinks: sanitizeCustomLinks(snapshot.customCareerLinks || {})
  };
  const vault = options.replace ? current : mergeVaults(readCurrentVaultKeysOnly(), current);
  const serialized = JSON.stringify(vault);
  localStorage.setItem(VAULT_KEY, serialized);
  localStorage.setItem(VAULT_BACKUP_KEY, serialized);
}

function setControlValue(control, value) {
  if (!control) return;
  if (control.tagName === "SELECT") {
    control.value = [...control.options].some(option => option.value === value) ? value : "";
  } else {
    control.value = value;
  }
}

function sanitizeCustomLinks(links) {
  if (!links || typeof links !== "object" || Array.isArray(links)) return {};
  return Object.fromEntries(Object.entries(links).filter(([, value]) => typeof value === "string" && /^https?:\/\//i.test(value)));
}

function copySyncLink() {
  const url = new URL(window.location.href);
  url.search = "";
  url.hash = "";
  url.searchParams.set("h1bPrefs", encodeSyncToken(getPreferencesSnapshot()));
  copyText(url.toString(), "Copied portable H-1B sync link");
}

function encodeSyncToken(value) {
  return btoa(unescape(encodeURIComponent(JSON.stringify(value))))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function decodeSyncToken(token) {
  try {
    const normalized = token.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, "=");
    return JSON.parse(decodeURIComponent(escape(atob(padded))));
  } catch {
    return null;
  }
}

function showToast(message) {
  els.toast.textContent = message;
  clearTimeout(showToast.timeout);
  showToast.timeout = setTimeout(() => {
    els.toast.textContent = "";
  }, 2200);
}

function getSheet(sheetName) {
  return DATA.sheets[sheetName] || { name: sheetName, columns: [], columnKeys: [], rows: [] };
}

function getSheetRows(sheetName) {
  return getSheet(sheetName).rows || [];
}

function keyForColumn(sheet, column) {
  const index = sheet.columns.indexOf(column);
  return index >= 0 ? sheet.columnKeys[index] : "";
}

function createSectionHeading(title, meta) {
  const heading = document.createElement("div");
  heading.className = "section-heading";
  const block = document.createElement("div");
  block.append(createElement("p", "Workbook view", "eyebrow"), createElement("h2", title));
  heading.append(block, createElement("span", meta, "status-pill"));
  return heading;
}

function createEvidence(label, value) {
  const item = document.createElement("div");
  item.className = "evidence-item";
  item.append(createElement("span", label), createElement("strong", value || "0"));
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

function createPill(text, className = "") {
  const tone = className || getPillToneClass(text);
  const pill = createElement("span", text, tone ? `pill ${tone}` : "pill");
  return pill;
}

function getPillToneClass(text) {
  const value = String(text || "").toLowerCase();
  if (/review|caution|warning|staffing|consulting/.test(value)) return "review";
  if (/favorite|pinned|selected/.test(value)) return "favorite";
  if (/very high|strong|tier a|apply first/.test(value)) return "strong";
  if (/moderate|tier b/.test(value)) return "moderate";
  if (/direct employer|stronger direct/.test(value)) return "direct";
  if (/h1b|h-1b|sponsor|e-verify|opt/.test(value)) return "sponsor";
  if (/entry|early|new grad/.test(value)) return "entry";
  return "";
}

function createElement(tag, text, className = "") {
  const element = document.createElement(tag);
  if (className) element.className = className;
  element.textContent = text == null || text === "" ? "n/a" : String(text);
  return element;
}

function getEmployerKey(row) {
  if (!row) return "";
  return row._employerKey || normalizeEmployerKey(row.employerName);
}

function normalizeEmployerKey(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9 ]+/g, " ")
    .replace(/\b(INCORPORATED|INC|CORPORATION|CORP|COMPANY|CO|LLC|LLP|LP|LTD|LIMITED|PLC)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function getEmployerByKey(key) {
  if (!key) return null;
  for (const sheetName of PRIMARY_EMPLOYER_SHEETS) {
    const row = getSheetRows(sheetName).find(item => getEmployerKey(item) === key);
    if (row) return row;
  }
  return null;
}

function buildGoogleCompanyUrl(row) {
  const query = `"${row.employerName || ""}" careers jobs sponsorship ${DEFAULT_ROLE_QUERY}`;
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

function buildLinkedInJobsUrl(row) {
  const params = new URLSearchParams();
  params.set("keywords", `${row.employerName || ""} ${DEFAULT_ROLE_QUERY}`);
  params.set("location", "United States");
  params.set("sortBy", "DD");
  return `https://www.linkedin.com/jobs/search/?${params.toString()}`;
}

function buildLinkedInPostsUrl(row) {
  const params = new URLSearchParams();
  params.set("keywords", `"${row.employerName || ""}" hiring ${DEFAULT_ROLE_QUERY}`);
  params.set("origin", "GLOBAL_SEARCH_HEADER");
  params.set("sortBy", "[\"date_posted\"]");
  params.set("datePosted", "[\"past-week\"]");
  params.set("contentType", "[\"jobs\"]");
  return `https://www.linkedin.com/search/results/content/?${params.toString()}`;
}

function buildLinkedInRecruiterUrl(row) {
  const params = new URLSearchParams();
  params.set("keywords", `"${row.employerName || ""}" recruiter "talent acquisition" ${DEFAULT_ROLE_QUERY}`);
  params.set("origin", "GLOBAL_SEARCH_HEADER");
  return `https://www.linkedin.com/search/results/people/?${params.toString()}`;
}

function buildLinkedInCompanyUrl(row) {
  const params = new URLSearchParams();
  params.set("keywords", row.employerName || "");
  params.set("origin", "GLOBAL_SEARCH_HEADER");
  return `https://www.linkedin.com/search/results/companies/?${params.toString()}`;
}

function buildIndeedUrl(row) {
  const params = new URLSearchParams();
  params.set("q", `${row.employerName || ""} ${DEFAULT_ROLE_QUERY}`);
  params.set("l", "United States");
  params.set("sort", "date");
  return `https://www.indeed.com/jobs?${params.toString()}`;
}

function buildCommandCenterUrl(row) {
  const params = new URLSearchParams();
  params.set("profile", "freshDirect");
  params.set("rolePack", "all-role-families");
  params.set("companyRole", "Software Engineer");
  params.set("companyFilter", row.employerName || "");
  params.set("companyLocation", "usa");
  params.set("companyTime", "24hours");
  params.set("companySort", "latest");
  return `../?${params.toString()}#careersHeading`;
}

function splitList(value) {
  return String(value || "").split(",").map(item => item.trim()).filter(Boolean);
}

function normalize(value) {
  return String(value || "").toLowerCase();
}

function groupBy(rows, getter) {
  return rows.reduce((acc, row) => {
    const key = getter(row);
    if (!acc[key]) acc[key] = [];
    acc[key].push(row);
    return acc;
  }, {});
}

function formatScore(value) {
  return Number.isFinite(Number(value)) ? Number(value).toFixed(1) : "n/a";
}

function formatNumber(value) {
  if (value == null || value === "") return "0";
  const number = Number(value);
  return Number.isFinite(number) ? number.toLocaleString() : String(value);
}

function formatCurrency(value) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0
    ? number.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 })
    : "n/a";
}

function formatMetric(value) {
  if (String(value).match(/^\d+(\.\d+)?$/)) {
    return formatNumber(value);
  }
  return formatCell(value);
}

function formatCell(value) {
  if (value == null || value === "") return "";
  if (typeof value === "number") return Number.isInteger(value) ? value.toLocaleString() : value.toLocaleString(undefined, { maximumFractionDigits: 3 });
  return String(value);
}

function toggleTheme() {
  document.documentElement.classList.toggle("dark");
  localStorage.setItem("h1b-intel-theme", document.documentElement.classList.contains("dark") ? "dark" : "light");
  syncThemeButton();
}

function loadTheme() {
  const stored = localStorage.getItem("h1b-intel-theme");
  if (stored === "light") {
    document.documentElement.classList.remove("dark");
  } else {
    document.documentElement.classList.add("dark");
  }
  syncThemeButton();
}

function syncThemeButton() {
  els.themeToggle.textContent = document.documentElement.classList.contains("dark") ? "Light mode" : "Dark mode";
}
