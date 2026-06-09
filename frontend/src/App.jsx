import React from 'react';
import { useJobs, useActivities, useStatic, useProfile } from './shared/hooks/shared-hooks';
import { hexToTint } from './shared/utils';
import { useAuth } from './shared/auth/AuthContext';
import { LoginPage } from './components/auth/LoginPage';

import { LoadingSpinner, ErrorView } from './components/ui-states';
import { Pipeline } from './components/pipeline';
import { CommandPalette, DetailDrawer } from './components/overlays';
import { AtlasView, ReportView, RunDrawer } from './components/views';
import { Dashboard } from './components/dashboard';
import { Onboarding } from './components/onboarding';
import { Settings } from './components/settings';
import { WookWork } from './components/scraper';
import { useTweaks, TweaksPanel, TweakSection, TweakRadio, TweakColor, TweakToggle } from './components/tweaks-panel';
import { EnhancedSidebar, EnhancedTopBar } from './shared/components/ui-components.jsx';
import { ToastStack } from './shared/components/ui-components.jsx';

export default function App() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const TWEAK_DEFAULTS = { theme: 'light', accent: '#cc5733', density: 'normal', showRunDemo: false };
  const [t, setTweak] = useTweaks(TWEAK_DEFAULTS);

  React.useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('theme-dark', t.theme === 'dark');
    root.classList.remove('density-cozy', 'density-tight');
    if (t.density === 'cozy') root.classList.add('density-cozy');
    if (t.density === 'tight') root.classList.add('density-tight');
    root.style.setProperty('--accent', t.accent);
    root.style.setProperty('--accent-tint', hexToTint(t.accent, 0.92));
    root.style.setProperty('--accent-soft', hexToTint(t.accent, 0.78));
    root.style.setProperty('--accent-ink', hexToTint(t.accent, 0.35));
  }, [t.theme, t.accent, t.density]);

  const [view, setView] = React.useState(() => (location.hash.replace('#', '') || 'pipeline'));
  React.useEffect(() => {
    const onHash = () => setView(location.hash.replace('#', '') || 'pipeline');
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const { jobs, setJobs, loading: jobsLoading, error: jobsError, moveJob, updateJob, deleteJob } = useJobs({}, isAuthenticated);
  const { activities, loading: activitiesLoading } = useActivities({}, isAuthenticated);
  const { states, commands, loading: staticLoading, error: staticError } = useStatic(isAuthenticated);
  const { profile, loading: profileLoading, updateProfile, importLinkedIn, resetProfile, refetch: refetchProfile } = useProfile(isAuthenticated);

  const [paletteOpen, setPaletteOpen] = React.useState(false);
  const [drawerJobId, setDrawerJobId] = React.useState(null);
  const [runOpen, setRunOpen] = React.useState(false);
  const [runJobId, setRunJobId] = React.useState(null);
  const [query, setQuery] = React.useState('');
  const [toasts, setToasts] = React.useState([]);
  const drawerJob = jobs.find(j => j.id === drawerJobId);
  const runJob = jobs.find(j => j.id === runJobId);

  const toast = (head, body) => {
    const id = Math.random().toString(36).slice(2);
    setToasts(t => [...t, { id, head, body }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  };

  React.useEffect(() => {
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
          if (e2.key === 'p') location.hash = 'pipeline';
          if (e2.key === 'i') location.hash = 'inbox';
          if (e2.key === 'm') location.hash = 'atlas';
          if (e2.key === 'r') location.hash = 'report';
          if (e2.key === 'u') location.hash = 'runs';
          if (e2.key === 's') location.hash = 'settings';
          if (e2.key === 'f') location.hash = 'scraper';
          window.removeEventListener('keydown', seqHandler);
        };
        window.addEventListener('keydown', seqHandler, { once: true });
        return;
      }
      if (drawerJobId) {
        if (e.key === 'Escape') setDrawerJobId(null);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [paletteOpen, drawerJobId]);

  const onOpen = (id) => setDrawerJobId(id);
  const onMove = async (id, newState) => {
    const job = jobs.find(j => j.id === id);
    if (!job) return;
    setJobs(arr => arr.map(j => j.id === id ? { ...j, state: newState } : j));
    try {
      await moveJob(id, newState);
      toast('Moved', `"${job.title}" → ${newState}`);
    } catch (err) {
      toast('Error', `Failed to move job: ${err.message}`);
      setJobs(arr => arr.map(j => j.id === id ? { ...j, state: job.state } : j));
    }
  };

  const onTailor = async (job) => {
    setJobs(arr => arr.map(j => j.id === job.id ? { ...j, state: 'tailored', tailored: { cvDone: true, pbDone: true } } : j));
    try {
      await updateJob(job.id, { state: 'tailored', tailored: { cvDone: true, pbDone: true } });
      toast('Tailored', `CV + PB generated for ${job.employer}`);
      setDrawerJobId(null);
    } catch (err) {
      toast('Error', `Failed to tailor job: ${err.message}`);
      setJobs(arr => arr.map(j => j.id === job.id ? job : j));
    }
  };

  const onApply = (job) => { setDrawerJobId(null); setRunJobId(job.id); setRunOpen(true); };
  const onShortlist = async (job) => {
    setJobs(arr => arr.map(j => j.id === job.id ? { ...j, state: 'shortlist' } : j));
    try {
      await moveJob(job.id, 'shortlist');
      toast('Shortlisted', job.title);
    } catch (err) {
      toast('Error', `Failed to shortlist: ${err.message}`);
      setJobs(arr => arr.map(j => j.id === job.id ? job : j));
    }
  };
  const onDismiss = async (job) => {
    setJobs(arr => arr.filter(j => j.id !== job.id));
    setDrawerJobId(null);
    try {
      await deleteJob(job.id);
      toast('Dismissed', job.title);
    } catch (err) {
      toast('Error', `Failed to dismiss: ${err.message}`);
      setJobs(arr => [...arr, job]);
    }
  };
  const onRunDone = async () => {
    if (runJob) {
      setJobs(arr => arr.map(j => j.id === runJob.id ? { ...j, state: 'submitted', submittedAt: new Date().toISOString().split('T')[0] } : j));
      try {
        await updateJob(runJob.id, { state: 'submitted', submittedAt: new Date().toISOString().split('T')[0] });
        toast('Logged', `${runJob.title} added to aktivitetsrapport`);
      } catch (err) {
        toast('Error', `Failed to log run: ${err.message}`);
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
    else if (cmd.id === 'go-pipeline') location.hash = 'pipeline';
    else if (cmd.id === 'go-atlas') location.hash = 'atlas';
    else if (cmd.id === 'go-report') location.hash = 'report';
    else toast(cmd.label, 'Demo: action wired');
  };

  const counts = React.useMemo(() => {
    const c = { scraped: 0, shortlist: 0, tailored: 0, submitted: 0, replied: 0, all: jobs.length };
    jobs.forEach(j => { if (c[j.state] != null) c[j.state]++; });
    return c;
  }, [jobs]);

  React.useEffect(() => {
    if (t.showRunDemo && jobs.length) setRunJobId(jobs.find(j => j.state === 'tailored')?.id || jobs[0].id);
  }, [t.showRunDemo, jobs]);

  if (authLoading) return <LoadingSpinner />;
  if (!isAuthenticated) return <LoginPage />;

  if (jobsLoading || activitiesLoading || staticLoading || profileLoading) return <LoadingSpinner />;
  if (jobsError || staticError) return <ErrorView error={jobsError || staticError} />;

  const needsOnboarding = !profile || profile.status === 'empty' || profile.status === 'importing';
  const handleOnboardingDone = async () => {
    if (profile?.status !== 'ready') await updateProfile({ status: 'ready' });
    location.hash = 'dashboard';
  };

  return (
    <>
      {needsOnboarding && (
        <Onboarding profile={profile} onUpdateProfile={updateProfile}
          onImportLinkedIn={importLinkedIn} onRefetchProfile={refetchProfile}
          onDone={handleOnboardingDone} />
      )}
      <div className="app">
      <EnhancedTopBar onPalette={() => setPaletteOpen(true)} counts={counts} query={query} setQuery={setQuery}
        reportProgress={{ month: 'MAJ', completed: 9, total: 12, status: 'on track' }} />
      <EnhancedSidebar view={view} counts={counts} states={states} />
      <main className="main">
        {view === 'dashboard' && (
          <>
            <div className="view-header">
              <h1>Dashboard</h1>
              <span className="crumb">live stats from your job hunt</span>
            </div>
            <div className="view-body"><Dashboard jobs={jobs} activities={activities} runs={[]} /></div>
          </>
        )}
        {view === 'scraper' && (
          <>
            <div className="view-body" style={{ padding: 0 }}>
              <WookWork profile={profile} />
            </div>
          </>
        )}
        {view === 'pipeline' && (
          <>
            <div className="view-header">
              <h1>Pipeline</h1>
              <span className="crumb">drag cards between columns to advance state</span>
              <span className="spacer" />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Filter jobs…"
                style={{ padding: '5px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface-2)', color: 'var(--ink)', fontSize: 13, width: 200 }} />
            </div>
            <div className="view-body">
              <Pipeline jobs={jobs} states={states} onOpen={onOpen} onMove={onMove} query={query} />
            </div>
          </>
        )}
        {view === 'inbox' && (
          <>
            <div className="view-header">
              <h1>Inbox</h1>
              <span className="spacer" />
              <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Filter jobs…"
                style={{ padding: '5px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius)', background: 'var(--surface-2)', color: 'var(--ink)', fontSize: 13, width: 200 }} />
            </div>
            <div className="view-body"><InboxView jobs={jobs} onOpen={onOpen} query={query} /></div>
          </>
        )}
        {view === 'atlas' && (
          <>
            <div className="view-header">
              <h1>Atlas</h1>
              <span className="crumb">jobs by location · 60 km dagpendling radius around Sala</span>
            </div>
            <div className="view-body"><AtlasView jobs={jobs} onOpen={onOpen} /></div>
          </>
        )}
        {view === 'report' && (
          <>
            <div className="view-header">
              <h1>Aktivitetsrapport</h1>
              <span className="crumb">Maj 2026 · auto-built from submitted runs</span>
              <span className="spacer" />
              <span className="pill warning">⏰ due in 2 days</span>
            </div>
            <div className="view-body"><ReportView jobs={jobs} activities={activities} /></div>
          </>
        )}
        {view === 'settings' && (
          <>
            <div className="view-header">
              <h1>Settings</h1>
              <span className="crumb">your profile &amp; preferences</span>
            </div>
            <div className="view-body">
              <Settings profile={profile} onUpdateProfile={updateProfile}
                onImportLinkedIn={importLinkedIn} onResetProfile={resetProfile}
                onRefetchProfile={refetchProfile} />
            </div>
          </>
        )}
        {view === 'runs' && (
          <>
            <div className="view-header">
              <h1>Runs</h1>
              <span className="crumb">application runs · click to replay timeline</span>
              <span className="spacer" />
            </div>
            <div className="view-body" style={{ padding: 22 }}>
              {jobs.filter(j => j.state === 'submitted' || j.state === 'replied').map(j => (
                <div key={j.id} onClick={() => { setRunJobId(j.id); setRunOpen(true); }} style={{ cursor: 'pointer', padding: '10px 14px', borderBottom: '1px solid var(--border)' }}>
                  <strong>{j.title}</strong> · {j.employer}
                </div>
              ))}
            </div>
          </>
        )}
      </main>

      <CommandPalette commands={commands} open={paletteOpen} onClose={() => setPaletteOpen(false)} onRun={onCmd} contextJob={drawerJob} />
      <DetailDrawer job={drawerJob} open={!!drawerJobId} onClose={() => setDrawerJobId(null)} onTailor={onTailor}
        onApply={onApply} onShortlist={onShortlist} onDismiss={onDismiss} />
      <RunDrawer open={runOpen} onClose={() => setRunOpen(false)} job={runJob} onDone={onRunDone} />
      <ToastStack toasts={toasts} />
      <TweaksPanel title="Tweaks">
        <TweakSection label="Appearance" />
        <TweakRadio label="Theme" value={t.theme} options={['light', 'dark']} onChange={(v) => setTweak('theme', v)} />
        <TweakColor label="Accent" value={t.accent} options={['#cc5733', '#2f6fb3', '#7a4cdb', '#2d7a4a', '#b03a2e']} onChange={(v) => setTweak('accent', v)} />
        <TweakRadio label="Density" value={t.density} options={['cozy', 'normal', 'tight']} onChange={(v) => setTweak('density', v)} />
        <TweakSection label="Demo" />
        <TweakToggle label="Open run drawer on load" value={t.showRunDemo} onChange={(v) => setTweak('showRunDemo', v)} />
      </TweaksPanel>
    </div>
    </>
  );
}
