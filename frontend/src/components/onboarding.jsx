import React from 'react';

export function Onboarding({ profile, onUpdateProfile, onImportLinkedIn, onDone, onRefetchProfile }) {
  const [step, setStep] = React.useState(0);
  const [linkedInUrl, setLinkedInUrl] = React.useState('');
  const [importing, setImporting] = React.useState(false);
  const [importError, setImportError] = React.useState(null);
  const [prefs, setPrefs] = React.useState({ radius: 60, remote: true, keywords: ['IT', 'Systemtekniker', 'DevSecOps', 'IT-stöd', 'IT-projektledare'] });
  const pollRef = React.useRef(null);

  const hasProfile = profile?.status === 'ready';
  const totalSteps = 4;

  React.useEffect(() => {
    if (profile?.linkedinUrl && !linkedInUrl) setLinkedInUrl(profile.linkedinUrl);
    if (profile?.preferences) setPrefs(p => ({ ...p, ...profile.preferences }));
  }, [profile]);

  React.useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current); };
  }, []);

  const startImport = async () => {
    if (!linkedInUrl.includes('linkedin.com/in/')) return;
    setImporting(true);
    setImportError(null);
    try {
      await onImportLinkedIn(linkedInUrl);
      pollRef.current = setInterval(async () => {
        try {
          const p = await onRefetchProfile();
          if (p?.status === 'ready') {
            clearInterval(pollRef.current);
            pollRef.current = null;
            setImporting(false);
            setStep(2);
          } else if (p?.status === 'empty') {
            clearInterval(pollRef.current);
            pollRef.current = null;
            setImporting(false);
            setImportError('LinkedIn import failed. Make sure you have logged in via `xvfb-run uvx linkedin-scraper-mcp@latest --login` first.');
          }
        } catch { /* poll again */ }
      }, 2000);
    } catch (err) {
      setImportError(err.message);
      setImporting(false);
    }
  };

  const savePrefs = async () => {
    await onUpdateProfile({ preferences: prefs });
    setStep(3);
  };

  return (
    <div className="onboarding-overlay">
      <div className="onboarding-card">
        <div className="onboarding-steps">
          {Array.from({ length: totalSteps }, (_, i) => (
            <div key={i} className={`onboarding-dot ${i === step ? 'active' : ''} ${i < step ? 'done' : ''}`} />
          ))}
        </div>

        {step === 0 && (
          <div className="onboarding-step">
            <h1>Welcome to Wooking for Work</h1>
            <p className="onboarding-desc">Your command center for job hunting on the Swedish IT market.</p>
            <div className="onboarding-features">
              <div className="of-card">
                <span className="of-icon">◫</span>
                <span>Pipeline kanban — track jobs from scraped to submitted</span>
              </div>
              <div className="of-card">
                <span className="of-icon">◎</span>
                <span>Atlas map — see where jobs are relative to your commute</span>
              </div>
              <div className="of-card">
                <span className="of-icon">✎</span>
                <span>Aktivitetsrapport — auto-built AF monthly reports</span>
              </div>
              <div className="of-card">
                <span className="of-icon">⬡</span>
                <span>Dashboard — live stats from your job hunt</span>
              </div>
            </div>
            <button className="btn primary" onClick={() => setStep(1)}>Get started →</button>
          </div>
        )}

        {step === 1 && (
          <div className="onboarding-step">
            <h1>Connect LinkedIn</h1>
            <p className="onboarding-desc">Import your profile so the system knows your background, skills, and experience.</p>

            <div className="onboarding-field">
              <label>LinkedIn profile URL</label>
              <input value={linkedInUrl} onChange={e => setLinkedInUrl(e.target.value)}
                placeholder="https://linkedin.com/in/your-profile"
                disabled={importing} />
            </div>

            {profile?.status === 'importing' && (
              <div className="onboarding-importing">
                <span className="spinner" />
                <span>Importing your LinkedIn profile…</span>
                <p className="onboarding-skip">
                  <a href="#" onClick={e => { e.preventDefault(); setStep(2); }}>Skip this step</a>
                  — try again later from Settings
                </p>
              </div>
            )}

            {importError && (
              <div className="onboarding-error">
                {importError}
              </div>
            )}

            {hasProfile && !importing && (
              <div className="onboarding-imported">
                <span className="ok">✓</span>
                <span>Profile imported — {profile.name || 'ready'}</span>
                {profile.skills?.length > 0 && (
                  <div className="skill-chips">
                    {profile.skills.slice(0, 8).map(s => <span className="pill" key={s}>{s}</span>)}
                  </div>
                )}
                <button className="btn sm" onClick={() => setStep(2)}>Looks good, continue →</button>
              </div>
            )}

            {!hasProfile && !importing && (
              <>
                <button className="btn primary" onClick={startImport}
                  disabled={!linkedInUrl.includes('linkedin.com/in/')}>
                  Import profile
                </button>
                <p className="onboarding-skip">
                  <a href="#" onClick={e => { e.preventDefault(); setStep(2); }}>Skip this step</a>
                  — you can import LinkedIn later from Settings
                </p>
              </>
            )}
          </div>
        )}

        {step === 2 && (
          <div className="onboarding-step">
            <h1>Your preferences</h1>
            <p className="onboarding-desc">Set your job search criteria. These help filter what's relevant.</p>

            <div className="onboarding-field">
              <label>Commuting radius (km)</label>
              <div className="row" style={{ gap: 12, alignItems: 'center' }}>
                <input type="range" min="10" max="200" value={prefs.radius}
                  onChange={e => setPrefs(p => ({ ...p, radius: +e.target.value }))} />
                <span className="mono" style={{ fontSize: 15, fontWeight: 600, minWidth: 40 }}>{prefs.radius} km</span>
              </div>
            </div>

            <div className="onboarding-field">
              <label>Keywords (comma-separated)</label>
              <input value={prefs.keywords.join(', ')} onChange={e => setPrefs(p => ({ ...p, keywords: e.target.value.split(',').map(s => s.trim()).filter(Boolean) }))} />
            </div>

            <div className="onboarding-field">
              <label className="row" style={{ gap: 10, cursor: 'pointer' }}>
                <input type="checkbox" checked={prefs.remote} onChange={e => setPrefs(p => ({ ...p, remote: e.target.checked }))} />
                Include remote jobs
              </label>
            </div>

            <button className="btn primary" onClick={savePrefs}>Save & continue →</button>
          </div>
        )}

        {step === 3 && (
          <div className="onboarding-step">
            <h1>You're all set!</h1>
            <p className="onboarding-desc">Your profile is ready. Here's what you can do next:</p>
            <div className="onboarding-features">
              <div className="of-card">
                <span className="of-icon">⌕</span>
                <span>Press <span className="kbd">⌘K</span> to open the command palette</span>
              </div>
              <div className="of-card">
                <span className="of-icon">◫</span>
                <span>Go to <strong>Pipeline</strong> to manage your job board</span>
              </div>
              <div className="of-card">
                <span className="of-icon">⬡</span>
                <span>Check <strong>Dashboard</strong> for live stats</span>
              </div>
            </div>
            <button className="btn primary" onClick={onDone}>Start hunting →</button>
          </div>
        )}
      </div>
    </div>
  );
}
