import React from 'react';

function useCredentials() {
  const [providers, setProviders] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  const fetchList = React.useCallback(async () => {
    setLoading(true);
    try {
      const data = await window.API.credentialsApi.list();
      setProviders(data.credentials || []);
    } catch { /* ignore */ }
    setLoading(false);
  }, []);

  React.useEffect(() => { fetchList(); }, [fetchList]);

  const add = React.useCallback(async (provider, value) => {
    const result = await window.API.credentialsApi.create(provider, value);
    setProviders(p => [...p.filter(x => x.provider !== provider), { provider, metadata: '{}' }]);
    return result;
  }, []);

  const remove = React.useCallback(async (provider) => {
    await window.API.credentialsApi.delete(provider);
    setProviders(p => p.filter(x => x.provider !== provider));
  }, []);

  return { providers, loading, add, remove, refetch: fetchList };
}

export function Settings({ profile, onUpdateProfile, onImportLinkedIn, onResetProfile, onRefetchProfile }) {
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [headline, setHeadline] = React.useState('');
  const [location, setLocation] = React.useState('');
  const [linkedInUrl, setLinkedInUrl] = React.useState('');
  const [keywords, setKeywords] = React.useState('');
  const [radius, setRadius] = React.useState(60);
  const [remote, setRemote] = React.useState(true);
  const [saved, setSaved] = React.useState(false);
  const [importing, setImporting] = React.useState(false);
  const [tab, setTab] = React.useState('profile');

  React.useEffect(() => {
    const onMessage = (e) => {
      if (e.data?.type === 'linkedin-oauth') {
        if (e.data.ok && onRefetchProfile) onRefetchProfile();
      }
    };
    window.addEventListener('message', onMessage);
    return () => window.removeEventListener('message', onMessage);
  }, [onRefetchProfile]);

  React.useEffect(() => {
    if (!profile) return;
    setName(profile.name || '');
    setEmail(profile.email || '');
    setPhone(profile.phone || '');
    setHeadline(profile.headline || '');
    setLocation(profile.location || '');
    setLinkedInUrl(profile.linkedinUrl || '');
    setKeywords(profile.preferences?.keywords?.join(', ') || 'IT, Systemtekniker, DevSecOps');
    setRadius(profile.preferences?.radius || 60);
    setRemote(profile.preferences?.remote ?? true);
  }, [profile]);

  const handleSave = async () => {
    setSaved(false);
    await onUpdateProfile({
      name, email, phone, headline, location,
      preferences: { radius, remote, keywords: keywords.split(',').map(s => s.trim()).filter(Boolean) },
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleLinkedInImport = async () => {
    if (!linkedInUrl.includes('linkedin.com/in/')) return;
    setImporting(true);
    try {
      await onImportLinkedIn(linkedInUrl);
    } catch { /* ignore */ }
    setImporting(false);
  };

  const creds = useCredentials();
  const [newProvider, setNewProvider] = React.useState('');
  const [newValue, setNewValue] = React.useState('');
  const [credError, setCredError] = React.useState(null);
  const [credBusy, setCredBusy] = React.useState(false);

  const handleAddCredential = async (e) => {
    e.preventDefault();
    setCredError(null);
    setCredBusy(true);
    try {
      await creds.add(newProvider, newValue);
      setNewProvider('');
      setNewValue('');
    } catch (err) {
      setCredError(err.message || 'Failed to save credential');
    }
    setCredBusy(false);
  };

  if (!profile) return <div className="view-body"><p className="muted">Loading profile…</p></div>;

  return (
    <div className="settings">
      <div className="settings-tabs">
        <div className={`settings-tab ${tab === 'profile' ? 'active' : ''}`} onClick={() => setTab('profile')}>Profile</div>
        <div className={`settings-tab ${tab === 'linkedin' ? 'active' : ''}`} onClick={() => setTab('linkedin')}>LinkedIn</div>
        <div className={`settings-tab ${tab === 'preferences' ? 'active' : ''}`} onClick={() => setTab('preferences')}>Preferences</div>
        <div className={`settings-tab ${tab === 'credentials' ? 'active' : ''}`} onClick={() => setTab('credentials')}>Credentials</div>
      </div>

      {tab === 'profile' && (
        <div className="settings-section">
          <h3>Personal Info</h3>
          <div className="settings-grid">
            <div className="field"><label>Name</label><input value={name} onChange={e => setName(e.target.value)} /></div>
            <div className="field"><label>Email</label><input value={email} onChange={e => setEmail(e.target.value)} /></div>
            <div className="field"><label>Phone</label><input value={phone} onChange={e => setPhone(e.target.value)} /></div>
            <div className="field"><label>Headline</label><input value={headline} onChange={e => setHeadline(e.target.value)} /></div>
            <div className="field"><label>Location</label><input value={location} onChange={e => setLocation(e.target.value)} /></div>
          </div>
          <button className="btn primary" onClick={handleSave}>{saved ? '✓ Saved' : 'Save'}</button>
        </div>
      )}

      {tab === 'linkedin' && (
        <div className="settings-section">
          <h3>LinkedIn</h3>
          <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>
            Connect your LinkedIn account via OAuth to enable profile import and job search.
          </p>

          {profile?.linkedin_username ? (
            <div className="settings-linkedin-preview">
              <div className="row" style={{ gap: 10, marginBottom: 12 }}>
                <span className="pill success">✓ Connected</span>
                <span className="mono muted" style={{ fontSize: 12 }}>{profile.linkedin_username}</span>
              </div>
              {profile.headline && <p><strong>Headline:</strong> {profile.headline}</p>}
              {profile.skills?.length > 0 && (
                <div style={{ marginTop: 8 }}>
                  <strong>Skills:</strong>
                  <div className="skill-chips">{profile.skills.map(s => <span className="pill" key={s}>{s}</span>)}</div>
                </div>
              )}
              <button className="btn sm" style={{ marginTop: 12 }}
                onClick={() => { window.open('/api/auth/linkedin', 'linkedin-oauth', 'width=600,height=700'); }}>
                Re-connect
              </button>
            </div>
          ) : (
            <div>
              <button className="btn primary" style={{ marginBottom: 14 }}
                onClick={() => { window.open('/api/auth/linkedin', 'linkedin-oauth', 'width=600,height=700'); }}>
                Connect with LinkedIn
              </button>
              <p className="muted" style={{ fontSize: 12 }}>
                Opens a popup to authorize via LinkedIn OAuth 2.0.
                Requires <code>LINKEDIN_CLIENT_ID</code> and <code>LINKEDIN_CLIENT_SECRET</code> in your .env file.
              </p>
            </div>
          )}
        </div>
      )}

      {tab === 'preferences' && (
        <div className="settings-section">
          <h3>Job Preferences</h3>
          <div className="settings-grid">
            <div className="field">
              <label>Commuting radius: {radius} km</label>
              <input type="range" min="10" max="200" value={radius} onChange={e => setRadius(+e.target.value)} />
            </div>
            <div className="field">
              <label>Keywords (comma-separated)</label>
              <input value={keywords} onChange={e => setKeywords(e.target.value)} />
            </div>
            <div className="field">
              <label className="row" style={{ gap: 10, cursor: 'pointer' }}>
                <input type="checkbox" checked={remote} onChange={e => setRemote(e.target.checked)} />
                Include remote jobs
              </label>
            </div>
          </div>
          <button className="btn primary" onClick={handleSave}>{saved ? '✓ Saved' : 'Save'}</button>
        </div>
      )}

      {tab === 'credentials' && (
        <div className="settings-section">
          <h3>API Credentials</h3>
          <p className="muted" style={{ fontSize: 13, marginBottom: 16 }}>
            Store API keys and tokens for external services. Values are encrypted at rest.
          </p>

          {creds.loading ? (
            <p className="muted" style={{ fontSize: 13 }}>Loading…</p>
          ) : (
            <div style={{ marginBottom: 20 }}>
              {creds.providers.length === 0 ? (
                <p className="muted" style={{ fontSize: 13 }}>No credentials stored yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {creds.providers.map(p => (
                    <div key={p.provider} className="row" style={{ gap: 10, alignItems: 'center', padding: '8px 12px', background: 'var(--surface-2)', borderRadius: 'var(--radius)' }}>
                      <span style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{p.provider}</span>
                      <span className="pill">••••••••</span>
                      <button className="btn ghost danger sm" onClick={() => creds.remove(p.provider)}>Remove</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <h4 style={{ margin: '0 0 12px', fontSize: 14 }}>Add Credential</h4>
          <form onSubmit={handleAddCredential}>
            {credError && <div className="login-error" style={{ marginBottom: 12 }}>{credError}</div>}
            <div className="settings-grid" style={{ maxWidth: 360 }}>
              <div className="field">
                <label>Provider</label>
                <input value={newProvider} onChange={e => setNewProvider(e.target.value)}
                  placeholder="e.g. rxresume, affine" disabled={credBusy} />
              </div>
              <div className="field">
                <label>Value (API key / token)</label>
                <input value={newValue} onChange={e => setNewValue(e.target.value)}
                  type="password" placeholder="••••••••" disabled={credBusy} />
              </div>
            </div>
            <button className="btn primary" type="submit" disabled={credBusy || !newProvider || !newValue}>
              {credBusy ? 'Saving…' : 'Save Credential'}
            </button>
          </form>
        </div>
      )}

      <div className="settings-section" style={{ marginTop: 32, opacity: 0.5 }}>
        <button className="btn ghost danger sm" onClick={onResetProfile}>Reset all profile data</button>
      </div>
    </div>
  );
}
