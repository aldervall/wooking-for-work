// Mock data for Wooking for Work prototype
// All Swedish job market context — Sala-centric, dagpendling 60km

window.WK_DATA = (() => {
  const jobs = [
    {
      id: 'j-001', src: 'AF', title: 'IT-tekniker, 1st line', employer: 'Sala kommun',
      location: 'Sala', distance: 12, language: 'sv', remote: false, postedDays: 1,
      match: 86, state: 'shortlist', salary: '28-32k SEK', closing: '2026-05-28',
      skills: ['Windows', 'Active Directory', 'Network', 'Support', 'ITIL'],
      url: 'https://arbetsformedlingen.se/platsbanken/annonser/8732419',
      excerpt: 'Vi söker en serviceinriktad IT-tekniker till våra användare på Sala kommun. Du kommer arbeta med 1st line support, felsökning, och underhåll av klientmiljö samt nätverksinfrastruktur.',
      ref: '8732419',
      tags: ['onsite', 'svenska']
    },
    {
      id: 'j-002', src: 'LinkedIn', title: 'IT Manager', employer: 'Scilife',
      location: 'EU Remote', distance: null, language: 'en', remote: true, postedDays: 2,
      match: 78, state: 'shortlist', salary: '€60-75k', closing: '2026-05-31',
      skills: ['IT Operations', 'SaaS', 'Vendor mgmt', 'Compliance', 'GDPR'],
      url: 'https://www.linkedin.com/jobs/view/4361768094/',
      excerpt: 'Scilife is hiring an IT Manager to scale our operations across Europe. You will own the IT roadmap for our SaaS platform serving life sciences companies.',
      ref: '4361768094',
      tags: ['remote', 'EU', 'AF-evidence']
    },
    {
      id: 'j-003', src: 'Wise', title: 'DevOps Engineer', employer: 'Wise',
      location: 'Stockholm', distance: 110, language: 'en', remote: 'hybrid', postedDays: 3,
      match: 71, state: 'scraped', salary: '55-70k SEK',
      skills: ['AWS', 'Terraform', 'Kubernetes', 'Python', 'CI/CD'],
      url: 'https://wise.com/jobs/devops-engineer',
      excerpt: 'Help build the infrastructure that moves billions across borders. We are looking for a senior DevOps engineer to join our SRE team in Stockholm.',
      ref: 'WI-2034',
      tags: ['hybrid', 'english']
    },
    {
      id: 'j-004', src: 'AF', title: 'Systemadministratör', employer: 'Västerås kommun',
      location: 'Västerås', distance: 43, language: 'sv', remote: false, postedDays: 4,
      match: 80, state: 'scraped',
      skills: ['Linux', 'Windows Server', 'VMware', 'Backup', 'AD'],
      url: 'https://arbetsformedlingen.se/platsbanken/annonser/8731002',
      excerpt: 'Västerås kommun söker en systemadministratör till IT-avdelningen. Du arbetar nära verksamheten och har ansvar för servermiljö och drift.',
      ref: '8731002',
      tags: ['onsite', 'svenska']
    },
    {
      id: 'j-005', src: 'LinkedIn', title: 'IT Manager · Remote $200/hr', employer: 'Crossing Hurdles',
      location: 'Remote (USA)', distance: null, language: 'en', remote: true, postedDays: 6,
      match: 52, state: 'submitted', submittedAt: '2026-05-05',
      skills: ['AI', 'Project mgmt', 'Vendor mgmt'],
      url: 'https://jobs.weekday.works/crossing-hurdles-it-manager',
      excerpt: 'Global staffing firm placing IT managers with AI research labs in the US. Contract role, $100-200/hr depending on experience.',
      ref: 'CH-IT-MGR',
      tags: ['contract', 'USA', 'AF-evidence']
    },
    {
      id: 'j-006', src: 'LinkedIn', title: 'Information Technology Project Manager', employer: 'RED Global',
      location: 'Stockholm', distance: 110, language: 'sv', remote: 'hybrid', postedDays: 6,
      match: 64, state: 'submitted', submittedAt: '2026-05-06',
      skills: ['SAP', 'Integration', 'PM', 'Stakeholder mgmt'],
      url: 'https://www.linkedin.com/jobs/view/4379877803/',
      excerpt: 'RED Global is a London-based recruitment firm placing senior IT project managers. This SAP integration role is onsite in Stockholm or remote within Sweden.',
      ref: '4379877803',
      tags: ['10+ år', 'AF-evidence']
    },
    {
      id: 'j-007', src: 'AF', title: 'IT-koordinator', employer: 'Heby kommun',
      location: 'Heby', distance: 38, language: 'sv', remote: false, postedDays: 7,
      match: 74, state: 'scraped',
      skills: ['Koordinering', 'IT-drift', 'Inköp', 'Användarstöd'],
      url: 'https://arbetsformedlingen.se/platsbanken/annonser/8729887',
      excerpt: 'Heby kommun söker en IT-koordinator för att stödja verksamheten med IT-strategi och daglig drift.',
      ref: '8729887',
      tags: ['onsite', 'svenska']
    },
    {
      id: 'j-008', src: 'LinkedIn', title: 'Senior Linux Engineer', employer: 'Curio',
      location: 'Remote (SE)', distance: null, language: 'en', remote: true, postedDays: 5,
      match: 81, state: 'shortlist',
      skills: ['Linux', 'Bash', 'Ansible', 'Python', 'Observability'],
      url: 'https://www.linkedin.com/jobs/view/4380012345/',
      excerpt: 'Curio is a Swedish fintech building the next generation of payment infrastructure. We are looking for a senior Linux engineer to own our compute platform.',
      ref: '4380012345',
      tags: ['remote', 'fintech']
    },
    {
      id: 'j-009', src: 'LinkedIn', title: 'SRE / Platform Engineer', employer: 'Klarna',
      location: 'Remote (SE)', distance: null, language: 'en', remote: true, postedDays: 8,
      match: 79, state: 'tailored',
      tailored: { cvDone: true, pbDone: false },
      skills: ['Kubernetes', 'Go', 'Prometheus', 'Terraform'],
      url: 'https://www.linkedin.com/jobs/view/klarna-sre',
      excerpt: 'Klarna SRE team is hiring platform engineers to scale our Kubernetes fleet.',
      ref: 'KL-SRE-1',
      tags: ['remote']
    },
    {
      id: 'j-010', src: 'LinkedIn', title: 'Junior DevOps', employer: 'Tele2',
      location: 'Stockholm', distance: 110, language: 'sv', remote: 'hybrid', postedDays: 14,
      match: 68, state: 'replied', repliedAt: '2026-05-08',
      skills: ['Azure', 'PowerShell', 'CI/CD'],
      url: 'https://www.linkedin.com/jobs/view/tele2-jr-devops',
      excerpt: 'Tele2 söker en junior DevOps-ingenjör till vårt Stockholmskontor.',
      ref: 'T2-JR',
      tags: ['phone-screen', 'hybrid']
    },
    {
      id: 'j-011', src: 'LinkedIn', title: 'IT Manager · Scilife (tailored)', employer: 'Scilife',
      location: 'EU Remote', distance: null, language: 'en', remote: true, postedDays: 2,
      match: 78, state: 'tailored',
      tailored: { cvDone: true, pbDone: true },
      slug: 'scilife-it-mgr-1715683200',
      skills: ['IT Operations', 'SaaS'],
      url: 'https://www.linkedin.com/jobs/view/4361768094/',
      ref: '4361768094',
      tags: ['remote', 'tailored']
    }
  ];

  const reportActivities = [
    { jobId: 'j-005', evidence: true, note: 'Helt USA-baserad, ingen Sverige-koppling.' },
    { jobId: 'j-006', evidence: true, note: 'Stockholm 110 km > 60 km dagpendling.' },
    { jobId: 'j-002', evidence: true, note: 'EU remote, ingen lokal närvaro i Västmanland.' }
  ];

  const states = [
    { id: 'scraped',    label: 'Scraped',     hint: 'fresh from sources' },
    { id: 'shortlist',  label: 'Shortlist',   hint: 'worth a closer look' },
    { id: 'tailored',   label: 'Tailored',    hint: 'CV + PB generated' },
    { id: 'submitted',  label: 'Submitted',   hint: 'application sent' },
    { id: 'replied',    label: 'Replied',     hint: 'they got back to you' }
  ];

  const commands = [
    { id: 'tailor',      label: 'Tailor CV for selected job',  keys: ['T'],     hint: 'CrewAI · ~12s', group: 'Apply' },
    { id: 'tailor-pb',   label: 'Tailor cover letter',           keys: ['⌘','⇧','L'], hint: 'pb-slug', group: 'Apply' },
    { id: 'apply',       label: 'Tailor & open submit page',     keys: ['⌘','↵'], hint: 'browserless', group: 'Apply' },
    { id: 'shortlist',   label: 'Shortlist this job',            keys: ['S'],     hint: 'add a star', group: 'Triage' },
    { id: 'dismiss',     label: 'Dismiss (out of commuting range)', keys: ['X'],  hint: '>60km filter', group: 'Triage' },
    { id: 'evidence',    label: 'Add to aktivitetsrapport',      keys: ['E'],     hint: '3 of 3 this week ✓', group: 'Triage' },
    { id: 'next',        label: 'Next job',                       keys: ['J'],    hint: '', group: 'Navigate' },
    { id: 'prev',        label: 'Previous job',                   keys: ['K'],    hint: '', group: 'Navigate' },
    { id: 'open',        label: 'Open original ad in new tab',    keys: ['O'],    hint: 'arbetsformedlingen.se', group: 'Navigate' },
    { id: 'go-pipeline', label: 'Go to Pipeline',                 keys: ['G','P'], hint: '', group: 'Navigate' },
    { id: 'go-atlas',    label: 'Go to Atlas (map)',              keys: ['G','M'], hint: '', group: 'Navigate' },
    { id: 'go-report',   label: 'Go to Aktivitetsrapport',        keys: ['G','R'], hint: '9 / 12', group: 'Navigate' },
    { id: 'refresh',     label: 'Refresh all scrapes',            keys: ['⌘','R'], hint: 'AF + LinkedIn + Wise', group: 'System' },
    { id: 'new-search',  label: 'Add saved search',               keys: ['⌘','N'], hint: '', group: 'System' }
  ];

  const runSteps = [
    { id: 's1', label: 'Run queued',                     ts: '09:21:04', state: 'done',     detail: 'API created runs row, enqueued 3 tasks' },
    { id: 's2', label: 'Tailor CV via Reactive Resume',   ts: '09:21:09', state: 'done',     detail: 'duplicated na-svenska-cv → scilife-it-mgr-1715683200 · 3 sections patched', duration: '4.2s' },
    { id: 's3', label: 'Generate personligt brev',        ts: '09:21:13', state: 'done',     detail: 'CrewAI · pb-scilife-it-mgr-1715683200', duration: '11.7s' },
    { id: 's4', label: 'Open application in browserless', ts: '09:21:25', state: 'active',   detail: 'Playwright launched · port :3001 · awaiting page load' },
    { id: 's5', label: 'Manual review (you)',             ts: '—',        state: 'pending',  detail: 'Review form in viewer, complete & submit yourself' },
    { id: 's6', label: 'Mark complete',                   ts: '—',        state: 'pending',  detail: 'Click "Done" → run marked completed, added to aktivitetsrapport' }
  ];

  const cvDiff = [
    { kind: 'header', text: 'Summary' },
    { kind: 'del',    text: '"Senior platform engineer with 8+ years of Linux administration and Kubernetes operator development."' },
    { kind: 'add',    text: '"IT operations leader with 8+ years administering hybrid Windows/Linux environments, with hands-on experience scaling SaaS infrastructure across regulated industries."' },
    { kind: 'header', text: 'Skills emphasised' },
    { kind: 'add',    text: '+ IT operations management, vendor management, ITIL' },
    { kind: 'add',    text: '+ SaaS platform ownership, GDPR compliance' },
    { kind: 'del',    text: '− Kubernetes operator development (de-emphasised — not in JD)' },
    { kind: 'header', text: 'Experience · Sala IT Services' },
    { kind: 'add',    text: '"Led IT operations for 200+ users…" promoted to first bullet' }
  ];

  const aiChatLog = [
    { role: 'user', text: 'How should I frame the gap between 2023 and 2024?' },
    { role: 'ai',   text: 'For the Scilife role I would lead with the freelance / consulting work you did in that window — they care about taking ownership across vendors. Want me to draft a one-line for the CV?' },
    { role: 'user', text: 'Yes, in Swedish for now.' },
    { role: 'ai',   text: 'Förslag: "2023-2024 — Konsult, egen firma. IT-strategi och driftsupport för 3 mindre SaaS-bolag (12-40 anställda)." Replace ‘konsult, egen firma’ with ‘frilans’ if you prefer.' }
  ];

  return { jobs, states, commands, reportActivities, runSteps, cvDiff, aiChatLog };
})();
