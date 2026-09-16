# Taran's Job Command Center

Taran's Job Command Center is a US-focused static job-search launcher. It builds fresh search links across ATS systems, general job boards, startup boards, public-sector portals, H1B sponsor companies, company career pages, and staffing/vendor outreach paths, with OPT-aware search profiles for an international student who is work-authorized in the United States.

## Folder Layout

The job-search app is organized under `public/job-portal-search`.

- `../index.html` is the live app page served at `/job-portal-search/`.
- `../assets/app.js` contains the search logic, URL builders, company data, vendor actions, favorites, sync links, and saved settings.
- `../assets/styles.css` contains the dark command-center UI.
- `../assets/portal-scout-mark.svg` is the local app mark.
- `../job-scout/index.html` is the connected static Job Scout layer for profile-aware lead scoring, source routing, review status, and application packets.
- `../h1b-intelligence/` is the separate workbook-backed H1B sponsor intelligence module.
- `README.md` is this project guide.
- `PROJECT_CONTEXT.md` is local-only planning/context and is ignored by Git.

## Features

- Dark theme by default, with an explicit saved light-mode option.
- Personal US OPT default profile with a max-coverage role pack for software, AI/ML, data, analytics, and cloud/DevOps roles.
- Role packs for broad target coverage, software, AI/ML, data analytics, and cloud/DevOps searches.
- Specific role packs for software engineer, full-stack, backend, frontend, AI engineer, ML engineer, data scientist, data engineer, analytics engineer, BI analyst, cloud/devops, and new-grad software searches.
- Query customization with balanced smart, compact title, broad Boolean, and custom raw-query modes.
- Portable custom source links with `{role}`, `{query}`, `{location}`, `{time}`, and `{company}` tokens.
- Independent per-board custom URL templates from each search result card. Each board keeps its own override and supports `{role}`, `{query}`, `{location}`, `{time}`, `{source}`, and `{portal}` tokens.
- Best Job Boards profile for broad US coverage across the most-used job boards and job-finding sources.
- Fast Apply Routine profile ordered for the fastest daily apply pass: LinkedIn Jobs, Indeed, Direct ATS, LinkedIn Posts, Google, Simplify, HiringCafe, Built In, Dice, Getwork, Glassdoor, and ZipRecruiter.
- Search presets for Backend, Full Stack, AI/ML, Data Analyst, Data Engineer, and New Grad Software. Presets update role, role pack, freshness, profile, sort, and source groups together.
- Daily Search Checklist for Latest 1h, Fast Apply Routine, Favorite Companies, Vendor Outreach, and OPT Resources. Checklist progress resets by date while normal settings stay saved.
- Multi-title search with comma-separated roles.
- Freshness filters from minute-signal searches through older-than ranges.
- Google, DuckDuckGo, Bing, Yahoo, Kagi, Qwant, Brave, and Startpage.
- US market default with major US tech and hiring metros.
- Latest-job ordering for search engines and native LinkedIn, Indeed, Glassdoor, ZipRecruiter, and Dice searches where the source supports it.
- Work-setting, title-match, experience, employment-type, include-keyword, and exclude-keyword filters.
- Profile-driven coverage rules that avoid hiding useful jobs unless the user chooses stricter filters.
- Minute Radar profile for urgent searches: Google/operator searches add "minutes ago" / "just posted" signals while native boards use their closest reliable newest filters.
- Fresh Direct ATS profile for new employer/ATS postings before they fully spread to aggregators.
- OPT-aware authorization modes: broad OPT, no auth filter, current US work authorization, future sponsorship, E-Verify, and exact OPT/STEM OPT.
- More than 75 portal targets across ATS, job board, startup, remote/flexible, public/nonprofit, higher-ed/research, H1B sponsor, vendor, and company career-page categories.
- H1B sponsor company layer with direct-employer/vendor separation, sponsor tiers, aliases, favorites, and company-specific LinkedIn/Indeed/Google search actions.
- Expanded company data from the workbook-backed layer: 500 direct employer rows and 200 staffing/vendor rows, normalized into the restored command-center format.
- Vendor Outreach section with role/location/vendor filters, vendor fit score, LinkedIn recruiter search, LinkedIn Jobs, Indeed, Google contact search, and copy-ready outreach templates.
- Vendor safety reminders based on official job-scam guidance: avoid upfront placement fees, fake-check/equipment scams, and unverified recruiter identities.
- Pinned search operators, copy-all, copy-checked, checked-progress, shareable URLs, related-title suggestions, and company search bundles.
- Opportunity fit scores on search links, based on source priority, freshness support, direct-apply value, entry-level usefulness, and OPT/sponsor research relevance.
- Source badges that show whether a link is native clean, Google advanced, direct apply, minute signal, OPT research, custom, or optional/noisy.
- Open High-Value Batch action for launching the strongest quick-apply links first without removing the broader result set.
- Copy Application Packet action with current role/location/profile, top links, favorite company links, OPT wording, follow-up reminders, and scam/auth safety reminders.
- Pin sync links for carrying pinned portals and settings to another browser or computer without a backend.
- Company search cards with related company results, reset, careers, LinkedIn recruiter/company, LinkedIn jobs/posts, Indeed/Google, Google Company, custom company links, and link-pack open/copy actions.
- Per-company Careers links default to the company careers page and can be updated/reset from the company card; saved custom Careers links are included in local settings and sync URLs.
- Favorite company shortcuts above the company search controls, including instant favorite/unfavorite saving, top-favorites launch/copy actions, and visible LinkedIn Jobs, LinkedIn Posts, LinkedIn Recruiters, LinkedIn Company, Indeed/Google, and Google Company links.
- Job Scout page for profile-aware job discovery, adapted for static GitHub Pages: saved profile, fresh source launcher, source-type routing, manual lead intake, local fit scoring, dedupe, ranked cards, status workflow, markdown table copy, ATS-safe application packet, vault export/import, sync links, and dark UI.
- Job Scout source types based on the researched terminal-app workflow: native/site sources, RSS feed signals, API signals, Google/operator sources, H1B research links, direct ATS radar, social/recruiter signals, and custom user-configured sources.
- Conditional Job Scout source routing: remote-only sources drop out when the saved work-setting profile is hybrid/on-site only; specialty sources such as Kube Careers appear only for cloud, DevOps, platform, backend, or adjacent role profiles.
- Job Scout lead import accepts JSON and simple pasted rows, including aliases such as `company_name`, `job_title`, `applyLink`, `salary`, `website`, `remote`, and `date_posted`.
- Job Scout review board includes Unopened, Viewed, Applied, Interviewing, Rejected, Ignore, and Expired statuses so old leads can remain saved for duplicate detection without crowding active review.
- Job Scout scoring now includes role fit, skill overlap, priority signals, work setting, compensation threshold, source quality, company identity, URL audit, warning evidence, and a static company-health-style risk proxy.
- Job Scout Apply First queue and Open Apply Batch action support a manual daily fetch/review rhythm without background polling or scraping.
- Job Scout resume-match layer inspired by the Python Job-Scout workflow: paste/import resume text, extract keywords locally, calculate browser-side cosine-style resume similarity, show resume-match chips, and include resume evidence in application packets.
- Job Scout social/HN signal sources: X Hiring Posts, Hacker News Jobs, and HN Hiring Search are added as signal launchers for fresh recruiter/startup leads without requiring Twitter API keys or scraping from GitHub Pages.

## Recent Updates

- Added `/job-portal-search/job-scout/` and connected it from Command Center and H1B Intelligence navigation.
- Job Scout is browser-safe and static: it launches accurate searches and scores pasted/imported leads locally instead of pretending to run server-side scraping from GitHub Pages.
- Upgraded Job Scout with ideas extracted from the researched `wallentx/jobscout` project: multiple source types, user-configurable sources, conditional source selection, import aliases, duplicate-friendly statuses, Apply First review board, URL audit, source quality, company identity, and health/risk evidence.
- Added features from the researched Python Job-Scout project: resume text matching, keyword extraction, X/Twitter hiring query launcher, Hacker News job/search launchers, and top-fit recommendation evidence.
- Google Advanced Search precision: single-domain source searches use `as_sitesearch=` instead of burying `site:` inside the main query.
- Company career page searches use working `inurl:` patterns for careers, jobs, people, talent, employment, openings, and join-us pages.
- iCIMS searches use the root `icims.com` domain so subdomain-hosted jobs are included.
- ZipRecruiter freshness mapping now uses tighter 3-day, 7-day, and 30-day windows where supported.
- OPT/STEM-OPT source curation: removed low-yield remote-only, government/public-sector, nonprofit, and senior-only boards from the launcher while keeping higher-ed/research employer search.
- Board-specific query formatting: LinkedIn/Indeed keep Boolean role packs, while simpler boards use plain role keywords so their search boxes do not misread Google-style operators.
- Minute-level search options: 5m, 10m, 15m, 30m, 45m signal modes, plus 2h, 3h, and 6h windows. Minute choices are treated as freshness signals where exact minute filters are not supported by the source.
- Long-query fix: default searches now use balanced role-pack wording, the aggregate Direct ATS source is shortened to high-use ATS domains, and broad Boolean mode is explicit instead of automatic.
- Source expansion: restored and added high-use boards such as Monster, CareerBuilder, FlexJobs, Getwork, SimplyHired, Talent.com, The Muse, Adzuna, Jora, Jooble, Nexxt, Snagajob, Ladders, College Recruiter, Hired, and Startup Jobs.
- Source refinement: low-signal ATS engines remain optional through `Extra ATS`; remote-only and public/nonprofit boards are available in separate optional groups so they do not crowd the daily OPT-focused flow.
- Native board search cleanup: LinkedIn, Indeed, and other job-board search boxes now receive compact role text by default, while Google/operator-only sources keep `site:` and advanced Boolean syntax.
- Company actions are now available directly inside each company box, with favorite-company cards and portable custom-link sync.
- Per-board Update Link controls let a specific source card use a custom URL template without changing any other job board.
- Fast Apply upgrade: added the daily routine profile, daily checklist, search presets, high-value batching, opportunity scores, source badges, application packet copying, and top-favorite company pack actions.

## Run Locally

Open `public/job-portal-search/index.html` in a browser. No build step is required for the standalone job-search page.

## Deploy To GitHub Pages

In this portfolio repository, the job-search page is published from `public/job-portal-search` during the normal Vite/GitHub Pages build. Keep `index.html` and `assets/` in that folder so the live `/job-portal-search/` URL keeps working.
