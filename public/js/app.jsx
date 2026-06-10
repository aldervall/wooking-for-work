// Main app shell — Wooking for Work (Migrated to use shared component library)
const { useState: aS, useEffect: aE, useMemo: aM, useCallback: aC } = React;

// Import shared components from the modern frontend
// These are now available as ES modules + window globals
const { EnhancedTopBar, EnhancedSidebar, ToastStack } = window.WK_SHARED || {};

function App() {
  const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
    "theme": "light",
    "accent": "#cc5733",
    "density": "normal",
    "showRunDemo": false
  }/*EDITMODE-END*/;
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  // Apply theme + accent to root
  aE(() => {
    const root = document.documentElement;
    root.classList.toggle('theme-dark', t.theme === 'dark');
    root.classList.remove('density-cozy', 'density-tight');
    if (t.density === 'cozy') root.classList.add('density-cozy');
    if (t.density === 'tight') root.classList.add('density-tight');
    root.style.setProperty('--accent', t.accent);
    // derive accent-tint and accent-soft as oklch with same hue
    root.style.setProperty('--accent-tint', hexToTint(t.accent, 0.92));
    root.style.setProperty('--accent-soft', hexToTint(t.accent, 0.78));
    root.style.setProperty('--accent-ink', hexToTint(t.accent, 0.35));
  }, [t.theme, t.accent, t.density]);

  const [view, setView] = aS(() => (location.hash.replace('#','') || 'pipeline'));
  aE(() => {
    const onHash = () => setView(location.hash.replace('#','') || 'pipeline');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);
  const go = (v) => { location.hash = v; };

  // API hooks
  const { jobs, setJobs, loading: jobsLoading, error: jobsError, moveJob, updateJob, deleteJob } = useJobs();
  const { activities, loading: activitiesLoading } = useActivities();
  const { states, commands, loading: staticLoading, error: staticError } = useStatic();

  const [paletteOpen, setPaletteOpen] = aS(false);
  const [drawerJobId, setDrawerJobId] = aS(null);
  const [runOpen, setRunOpen] = aS(false);
  const [runJobId, setRunJobId] = aS(null);
  const [query, setQuery] = aS('');
  const [toasts, setToasts] = aS([]);
  const drawerJob = jobs.find(j => j.id === drawerJobId);
  const runJob = jobs.find(j => j.id === runJobId);

  const toast = (head, body) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(t => [...t, { id, head, body }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  };

  // Global keyboard shortcuts
  aE(() => {
    const onKey = (e) => {
      const tag = (e.target.tagName || '').toLowerCase();
      const editing = tag === 'input' || tag === 'textarea';
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setPaletteOpen(p => !p);
        return;
      }
      if (editing || paletteOpen) return;
      if (e.key === 'g') {
        const seqHandler = (e2) => {
          if (e2.key === 'p') go('pipeline');
          if (e2.key === 'i') go('inbox');
          if (e2.key === 'm') go('atlas');
          if (e2.key === 'r') go('report');
          if (e2.key === 'u') go('runs');
          window.removeEventListener('keydown', seqHandler);
        };
        window.addEventListener('keydown', seqHandler, { once: true });
        return;
      }
      if (drawerJobId) {
        if (e.key === 'Escape') setDrawerJobId(null);
        if (e.key === 't') setDrawerTailor();
        if (e.key === 'a') openRun(drawerJobId);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [paletteOpen, drawerJobId]);

  const onOpen = (id) => setDrawerJobId(id);
  const onMove = async (id, newState) => {
    const job = jobs.find(j => j.id === id);
    if (!job) return;
    // Optimistic update
    setJobs(arr => arr.map(j => j.id === id ? { ...j, state: newState } : j));
    try {
      await moveJob(id, newState);
      toast('Moved', `"${job.title}" → ${newState}`);
    } catch (err) {
      toast('Error', `Failed to move job: ${err.message}`);
      // Revert on error
      setJobs(arr => arr.map(j => j.id === id ? { ...j, state: job.state } : j));
    }
  };
  const onTailor = async (job) => {
    // Optimistic update
    setJobs(arr => arr.map(j => j.id === job.id ? { ...j, state: 'tailored', tailored: { cvDone: true, pbDone: true } } : j));
    try {
      await updateJob(job.id, { state: 'tailored', tailored: { cvDone: true, pbDone: true } });
      toast('Tailored', `CV + PB generated for ${job.employer}`);
      setDrawerJobId(null);
    } catch (err) {
      toast('Error', `Failed to tailor job: ${err.message}`);
      // Revert on error
      setJobs(arr => arr.map(j => j.id === job.id ? job : j));
    }
  };
  const setDrawerTailor = () => drawerJob && onTailor(drawerJob);
  const onApply = (job) => {
    setDrawerJobId(null);
    openRun(job.id);
  };
  const openRun = (id) => { setRunJobId(id); setRunOpen(true); };
  const onShortlist = async (job) => {
    // Optimistic update
    setJobs(arr => arr.map(j => j.id === job.id ? { ...j, state: 'shortlist' } : j));
    try {
      await moveJob(job.id, 'shortlist');
      toast('Shortlisted', job.title);
    } catch (err) {
      toast('Error', `Failed to shortlist: ${err.message}`);
      // Revert on error
      setJobs(arr => arr.map(j => j.id === job.id ? job : j));
    }
  };
  const onDismiss = async (job) => {
    // Optimistic update
    setJobs(arr => arr.filter(j => j.id !== job.id));
    setDrawerJobId(null);
    try {
      await deleteJob(job.id);
      toast('Dismissed', job.title);
    } catch (err) {
      toast('Error', `Failed to dismiss: ${err.message}`);
      // Revert on error - add job back
      setJobs(arr => [...arr, job]);
    }
  };
  const onRunDone = async () => {
    if (runJob) {
      const oldState = runJob.state;
      // Optimistic update
      setJobs(arr => arr.map(j => j.id === runJob.id ? { ...j, state: 'submitted', submittedAt: new Date().toISOString().split('T')[0] } : j));
      try {
        await updateJob(runJob.id, { state: 'submitted', submittedAt: new Date().toISOString().split('T')[0] });
        toast('Logged', `${runJob.title} added to aktivitetsrapport`);
      } catch (err) {
        toast('Error', `Failed to log run: ${err.message}`);
        // Revert on error
        setJobs(arr => arr.map(j => j.id === runJob.id ? { ...j, state: oldState, submittedAt: null } : j));
      }
    }
    setRunOpen(false);
  };

  const onCmd = (cmd) => {
    setPaletteOpen(false);
    if (cmd.id === 'tailor' && drawerJob) onTailor(drawerJob);
    else if (cmd.id === 'apply' && drawerJob) onApply(drawerJob);
    else if (cmd.id === 'shortlist' && drawerJob) onShortlist(drawerJob);
    else if (cmd.id === 'dismiss' && drawerJob) onDismiss(drawerJob);
    else if (cmd.id === 'go-pipeline') go('pipeline');
    else if (cmd.id === 'go-atlas')    go('atlas');
    else if (cmd.id === 'go-report')   go('report');
    else if (cmd.id === 'refresh')     toast('Refresh', 'Scrapers queued · AF, LinkedIn, Wise');
    else toast(cmd.label, 'Demo: action wired');
  };

  // counts for sidebar
  const counts = aM(() => {
    const c = { scraped: 0, shortlist: 0, tailored: 0, submitted: 0, replied: 0, all: jobs.length };
    jobs.forEach(j => { if (c[j.state] != null) c[j.state]++; });
    return c;
  }, [jobs]);

  // Run demo if toggled
  aE(() => { if (t.showRunDemo && jobs.length) openRun(jobs.find(j => j.state === 'tailored')?.id || jobs[0].id); }, [t.showRunDemo]);

  // Show loading state
  if (jobsLoading || activitiesLoading || staticLoading) {
    return <LoadingSpinner />;
  }

  // Show error state
  if (jobsError || staticError) {
    return <ErrorView error={jobsError || staticError} />;
  }

  return (
    <div className="app">
      <EnhancedTopBar onPalette={() => setPaletteOpen(true)} counts={counts} go={go} query={query} setQuery={setQuery}
        reportProgress={{ month: 'MAJ', completed: 9, total: 12, status: 'on track' }} />
      <EnhancedSidebar view={view} go={go} counts={counts} states={states} />
      <main className="main">
        {view === 'pipeline' && (
          <React.Fragment>
            <div className="view-header">
              <h1>Pipeline</h1>
              <span className="crumb">drag cards between columns to advance state</span>
              <span className="filler" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Filter jobs…"
                style={{ padding: '5px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface-2)', color: 'var(--ink)', fontSize: 13, width: 200 }}
              />
              <button className="btn">⟳ Refresh scrapes</button>
              <button className="btn primary" onClick={() => go('report')}>📄 Aktivitetsrapport · 9/12</button>
            </div>
            <div className="view-body">
              <Pipeline jobs={jobs} states={states} onOpen={onOpen} onMove={onMove} query={query} />
            </div>
          </React.Fragment>
        )}

        {view === 'inbox' && (
          <React.Fragment>
            <div className="view-header">
              <h1>Inbox</h1>
              <span className="crumb">all jobs, sorted by match · use <span className="kbd">j</span><span className="kbd">k</span> to navigate</span>
              <span className="filler" />
              <input
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Filter jobs…"
                style={{ padding: '5px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface-2)', color: 'var(--ink)', fontSize: 13, width: 200 }}
              />
            </div>
            <div className="view-body">
              <InboxView jobs={jobs} onOpen={onOpen} query={query} />
            </div>
          </React.Fragment>
        )}

        {view === 'atlas' && (
          <React.Fragment>
            <div className="view-header">
              <h1>Atlas</h1>
              <span className="crumb">jobs by location · 60 km dagpendling radius around Sala</span>
              <span className="filler" />
              <span className="pill"><span className="dot" style={{ background: 'var(--success)' }} />inside ✓</span>
              <span className="pill"><span className="dot" style={{ background: 'var(--accent)' }} />AF-evidence</span>
            </div>
            <div className="view-body">
              <AtlasView jobs={jobs} onOpen={onOpen} />
            </div>
          </React.Fragment>
        )}

        {view === 'report' && (
          <React.Fragment>
            <div className="view-header">
              <h1>Aktivitetsrapport</h1>
              <span className="crumb">Maj 2026 · auto-built from submitted runs</span>
              <span className="filler" />
              <span className="pill warning">⏰ due in 2 days</span>
            </div>
            <div className="view-body">
              <ReportView jobs={jobs} activities={activities} />
            </div>
          </React.Fragment>
        )}

        {view === 'runs' && <RunsView openRun={openRun} jobs={jobs} />}

        {view === 'settings' && <SettingsView />}
      </main>

      <CommandPalette
        commands={commands}
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        onRun={onCmd}
        contextJob={drawerJob}
      />
      <DetailDrawer
        job={drawerJob}
        open={!!drawerJobId}
        onClose={() => setDrawerJobId(null)}
        onTailor={onTailor}
        onApply={onApply}
        onShortlist={onShortlist}
        onDismiss={onDismiss}
        cvDiff={window.WK_DATA?.cvDiff}
        aiChatLog={window.WK_DATA?.aiChatLog}
      />
      <RunDrawer
        open={runOpen}
        onClose={() => setRunOpen(false)}
        job={runJob}
        steps={window.WK_DATA?.runSteps}
        onDone={onRunDone}
      />

      <ToastStack toasts={toasts} />

      <TweaksPanel title="Tweaks">
        <TweakSection label="Appearance" />
        <TweakRadio label="Theme" value={t.theme}
          options={['light', 'dark']}
          onChange={(v) => setTweak('theme', v)} />
        <TweakColor label="Accent" value={t.accent}
          options={['#cc5733', '#2f6fb3', '#7a4cdb', '#2d7a4a', '#b03a2e']}
          onChange={(v) => setTweak('accent', v)} />
        <TweakRadio label="Density" value={t.density}
          options={['cozy', 'normal', 'tight']}
          onChange={(v) => setTweak('density', v)} />
        <TweakSection label="Demo" />
        <TweakToggle label="Open run drawer on load" value={t.showRunDemo}
          onChange={(v) => setTweak('showRunDemo', v)} />
      </TweaksPanel>
    </div>
  );
}

function hexToTint(hex, lightness) {
  // Convert hex to oklch-ish tint by blending toward paper
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const bg = 247, bg_g = 244, bg_b = 237; // paper
  if (lightness >= 0.5) {
    // tint toward paper
    const blend = lightness;
    const nr = Math.round(r * (1 - blend) + bg * blend);
    const ng = Math.round(g * (1 - blend) + bg_g * blend);
    const nb = Math.round(b * (1 - blend) + bg_b * blend);
    return `rgb(${nr}, ${ng}, ${nb})`;
  } else {
    // shade toward black
    const blend = 1 - lightness * 2;
    const nr = Math.round(r * (1 - blend));
    const ng = Math.round(g * (1 - blend));
    const nb = Math.round(b * (1 - blend));
    return `rgb(${nr}, ${ng}, ${nb})`;
  }
}

// Legacy component definitions removed - now using shared component library via window.WK_SHARED

function RunsView({ openRun, jobs }) {
  const submitted = jobs.filter(j => j.state === 'submitted' || j.state === 'replied');
  return (
    <React.Fragment>
      <div className="view-header">
        <h1>Runs</h1>
        <span className="crumb">application runs · click to replay timeline</span>
        <span className="filler" />
      </div>
      <div className="view-body" style={{ padding: 22 }}>
        <div className="card" style={{ padding: 0 }}>
          {submitted.map(j => (
            <div key={j.id} onClick={() => openRun(j.id)} style={{
              padding: '14px 18px',
              borderBottom: '1px solid var(--border)',
              cursor: 'pointer',
              display: 'grid',
              gridTemplateColumns: '32px 1fr auto auto auto',
              gap: 14,
              alignItems: 'center'
            }}>
              <span className={'src-chip ' + j.src} style={{ width: 26, height: 26, fontSize: 11 }}>{srcInitials(j.src)}</span>
              <div>
                <div style={{ fontWeight: 500 }}>{j.title}</div>
                <div className="mono muted" style={{ fontSize: 11 }}>
                  {j.employer} · run completed {j.submittedAt || '—'} · 4 steps · 17s total
                </div>
              </div>
              <span className="pill success">✓ done</span>
              <span className="pill" style={{ background: 'var(--surface-2)' }}>CV · PB</span>
              <a href="#" style={{ color: 'var(--info)', fontSize: 12 }}>view →</a>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 22 }}>
          <h4 style={{ marginBottom: 10 }}>Queue (live)</h4>
          <div className="card" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--accent)', animation: 'pulse 1.4s infinite' }} />
            <span style={{ fontWeight: 500 }}>BullMQ · resume-tailor queue</span>
            <span className="muted" style={{ fontSize: 12 }}>idle · 0 in progress · 3 completed today</span>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
}

function SettingsView() {
  return (
    <React.Fragment>
      <div className="view-header">
        <h1>Settings</h1>
        <span className="crumb">integrations · allowlist · scrapers</span>
      </div>
      <div className="view-body" style={{ padding: 22 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18 }}>
          <IntegrationCard name="Reactive Resume" status="connected" detail="API key · base resume na-svenska-cv · 4 tailored docs" host="rxresume.example.com" />
          <IntegrationCard name="AFFiNE" status="connected" detail="workspace ef4c1ba3 · 18 docs · last sync 2m ago" host="affine.example.com" />
          <IntegrationCard name="LinkedIn (via MCP)" status="connected" detail="xvfb-browser pool · 12 scrapes today" host="scripts/linkedin-mcp.sh" />
          <IntegrationCard name="Arbetsförmedlingen API" status="connected" detail="direct REST · 21 active queries" host="jobsearch.api.jobtechdev.se" />
          <IntegrationCard name="Browserless" status="connected" detail="port :3001 · idle · 4 sessions today" host="localhost:3001" />
          <IntegrationCard name="OpenAI" status="connected" detail="gpt-4o · tailoring + chat · €4.21 this month" host="api.openai.com" />
        </div>

        <h4 style={{ marginTop: 26, marginBottom: 10 }}>Job search defaults</h4>
        <div className="card" style={{ padding: '16px 18px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 14, fontSize: 14 }}>
            <span className="muted">Home base</span><span>Sala, Västmanland</span>
            <span className="muted">Dagpendling radius</span><span><b>60 km</b> <span className="muted" style={{ fontSize: 12 }}>(default per AF rule)</span></span>
            <span className="muted">Allow remote</span><span>Sweden · EU · global (auto-evidence)</span>
            <span className="muted">Languages</span><span>svenska, english</span>
            <span className="muted">Excluded employers</span><span><span className="pill">Bemanning AB</span> <span className="pill">Other Recruiter</span></span>
          </div>
        </div>

        <h4 style={{ marginTop: 26, marginBottom: 10 }}>Safety</h4>
        <div className="card" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 14 }}>
          <div style={{ flex: 1 }}>
            <div style={{ fontWeight: 600 }}>Auto-submit kill switch</div>
            <div className="muted" style={{ fontSize: 12 }}>When ON, Wooking opens forms in browserless but never clicks Submit. Always check before disabling.</div>
          </div>
          <span className="pill success"><span className="dot" style={{ background: 'var(--success)' }}/>ON</span>
        </div>
      </div>
    </React.Fragment>
  );
}

function IntegrationCard({ name, status, detail, host }) {
  return (
    <div className="card" style={{ padding: '14px 16px' }}>
      <div className="row" style={{ marginBottom: 6 }}>
        <strong>{name}</strong>
        <span className="spacer" />
        <span className="pill success"><span className="dot" style={{ background: 'var(--success)' }}/>{status}</span>
      </div>
      <div className="muted" style={{ fontSize: 12.5 }}>{detail}</div>
      <div className="mono muted" style={{ fontSize: 11, marginTop: 6 }}>{host}</div>
    </div>
  );
}

// Legacy component definitions removed - now using shared component library via window.WK_SHARED

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
