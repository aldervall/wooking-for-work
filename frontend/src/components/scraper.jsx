import React from 'react';

const API = '/api';

const SRCS = {
  AF: { label: 'Arbetsförmedlingen', short: 'AF', color: '#50b7a0' },
  LinkedIn: { label: 'LinkedIn', short: 'in', color: '#0a66c2' },
};

export function WookWork({ profile }) {
  const [logs, setLogs] = React.useState([]);
  const [running, setRunning] = React.useState(false);
  const [runId, setRunId] = React.useState(null);
  const [keywords, setKeywords] = React.useState('IT, Systemtekniker, DevSecOps');
  const [status, setStatus] = React.useState('idle');
  const [scrapedJobs, setScrapedJobs] = React.useState([]);
  const [currentSource, setCurrentSource] = React.useState(null);
  const [tailorJob, setTailorJob] = React.useState(null);
  const logEndRef = React.useRef(null);
  const esRef = React.useRef(null);

  const connectSSE = React.useCallback(() => {
    if (esRef.current) esRef.current.close();
    const es = new EventSource(`${API}/scrape/stream`);
    esRef.current = es;

    es.addEventListener('connected', () => {
      setLogs(prev => [...prev, { timestamp: new Date().toISOString(), level: 'system', message: 'Connected to live log' }]);
    });

    es.addEventListener('log', (e) => {
      try {
        const { entry } = JSON.parse(e.data);
        setLogs(prev => [...prev, entry]);

        if (entry.level === 'step') {
          const lower = entry.message.toLowerCase();
          if (lower.includes('arbetsförmedlingen') || lower.includes('arbetsformedlingen')) setCurrentSource('AF');
          else if (lower.includes('linkedin')) setCurrentSource('LinkedIn');
        }

        if (entry.level === 'job' && entry.data) {
          const { headline, employer, src, url, ref } = entry.data;
          if (headline && employer) {
            setScrapedJobs(prev => {
              if (prev.some(j => j.ref === ref && j.src === src)) return prev;
              return [...prev, {
                ref, src: src || 'AF',
                title: headline, employer, url, match: Math.floor(Math.random() * 30) + 50,
              }];
            });
          }
        }

        if (entry.level === 'done') {
          setCurrentSource(null);
        }
      } catch { /* ignore */ }
    });

    es.addEventListener('active', () => {
      setRunning(true);
      setStatus('running');
    });

    es.addEventListener('error', () => {
      if (es.readyState === EventSource.CLOSED) {
        setLogs(prev => [...prev, { timestamp: new Date().toISOString(), level: 'system', message: 'Live log disconnected' }]);
      }
    });
  }, []);

  React.useEffect(() => {
    connectSSE();
    return () => { esRef.current?.close(); };
  }, [connectSSE]);

  React.useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const startScrape = async () => {
    const kw = keywords.split(',').map(s => s.trim()).filter(Boolean);
    setLogs([]);
    setScrapedJobs([]);
    setRunning(true);
    setCurrentSource(null);
    setTailorJob(null);
    setStatus('starting');
    try {
      const res = await fetch(`${API}/scrape/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keywords: kw, municipality: '', remote: true }),
      });
      const data = await res.json();
      if (res.ok) {
        setRunId(data.runId);
        setStatus('running');
      } else {
        setLogs(prev => [...prev, { timestamp: new Date().toISOString(), level: 'error', message: data.error }]);
        setStatus('error');
        setRunning(false);
      }
    } catch (err) {
      setLogs(prev => [...prev, { timestamp: new Date().toISOString(), level: 'error', message: err.message }]);
      setStatus('error');
      setRunning(false);
    }
  };

  const logLevel = (entry) => {
    switch (entry.level) {
      case 'step': return 'log-step';
      case 'success': return 'log-success';
      case 'error': return 'log-error';
      case 'warn': return 'log-warn';
      case 'job': return 'log-job';
      case 'debug': return 'log-debug';
      case 'done': return 'log-done';
      case 'system': return 'log-system';
      default: return 'log-info';
    }
  };

  const time = (ts) => {
    try { return new Date(ts).toLocaleTimeString(); } catch { return ''; }
  };

  const goToInbox = () => { location.hash = 'inbox'; };

  const matchClass = (m) => m >= 80 ? 's-hi' : m >= 65 ? 's-med' : 's-lo';

  return (
    <div className="scraper">
      <div className="view-header">
        <h1>Wook Work!</h1>
        <span className="crumb">hunt new leads on Arbetsförmedlingen + LinkedIn</span>
      </div>

      <div className="scraper-controls">
        <div className="scraper-inputs">
          <div className="field">
            <label>Keywords (comma-separated)</label>
            <input value={keywords} onChange={e => setKeywords(e.target.value)}
              placeholder="IT, Systemtekniker, DevSecOps"
              disabled={running} />
          </div>
          <button className="btn primary" onClick={startScrape} disabled={running}>
            {running ? (
              <><span className="spinner-sm" /> Hunting…</>
            ) : '▶ Wook Work!'}
          </button>
        </div>
        <div className="scraper-status">
          {status === 'idle' && <span className="pill">Ready</span>}
          {status === 'starting' && <span className="pill accent">Starting…</span>}
          {status === 'running' && <span className="pill accent"><span className="spinner-sm" /> Running</span>}
          {status === 'error' && <span className="pill danger">Error</span>}
          {runId && <span className="mono muted" style={{ fontSize: 11 }}>run: {runId.slice(0, 8)}…</span>}
        </div>
      </div>

      <div className="scraper-sources-bar">
        {Object.entries(SRCS).map(([key, s]) => (
          <div key={key}
            className={'scraper-source-chip' + (currentSource === key ? ' active' : '')}
            style={{ '--src-color': s.color }}>
            <span className="scraper-source-dot" />
            <span className="scraper-source-label">{s.label}</span>
            {currentSource === key && <span className="scraper-source-seeking"><span className="spinner-sm" /> searching…</span>}
          </div>
        ))}
        {scrapedJobs.length > 0 && !running && (
          <span className="scraper-done-badge">{scrapedJobs.length} new jobs</span>
        )}
      </div>

      <div className="scraper-body">
        <div className="scraper-terminal-col">
          <div className="log-terminal">
            <div className="log-header">
              <span className="log-title">Live Log</span>
              <span className="log-count">{logs.length} events</span>
              {logs.length > 0 && (
                <button className="btn ghost sm" onClick={() => setLogs([])} style={{ marginLeft: 'auto' }}>
                  Clear
                </button>
              )}
            </div>
            <div className="log-body">
              {logs.length === 0 ? (
                <div className="log-empty">
                  <div className="log-empty-icon">⌕</div>
                  <p>Press <strong>Start hunting</strong> to begin searching for new job listings.<br />
                  Results will stream here in real-time.</p>
                </div>
              ) : (
                logs.map((entry, i) => (
                  <div key={i} className={`log-entry ${logLevel(entry)}`}>
                    <span className="log-time">{time(entry.timestamp)}</span>
                    <span className="log-level">{entry.level.toUpperCase()}</span>
                    <span className="log-msg">{entry.message}</span>
                  </div>
                ))
              )}
              <div ref={logEndRef} />
            </div>
          </div>
        </div>

        <div className="scraper-results-col">
          <div className="scraper-results-card">
            <div className="scraper-results-header">
              <span className="log-title">The Catch</span>
              <span className="log-count">{scrapedJobs.length} found</span>
              {!running && scrapedJobs.length > 0 && (
                <button className="btn ghost sm" style={{ marginLeft: 'auto' }} onClick={() => { setScrapedJobs([]); setTailorJob(null); }}>
                  Clear
                </button>
              )}
            </div>
            <div className="scraper-results-body">
              {scrapedJobs.length === 0 && !running && (
                <div className="log-empty">
                  <div className="log-empty-icon">◫</div>
                  <p>No leads yet.<br />Wook Work! to see results appear here.</p>
                </div>
              )}
              {scrapedJobs.length === 0 && running && (
                <div className="log-empty">
                  <div className="log-empty-icon"><span className="spinner-sm" /></div>
                  <p>Waiting for results…</p>
                </div>
              )}
              {scrapedJobs.map((job, i) => (
                <div key={`${job.src}-${job.ref}-${i}`} className="scraper-job-row">
                  <div className="scraper-job-primary">
                    <span className={'src-chip ' + job.src}>{SRCS[job.src]?.short || job.src}</span>
                    <div className="scraper-job-info">
                      <div className="scraper-job-title">{job.title}</div>
                      <div className="scraper-job-employer">{job.employer}</div>
                    </div>
                    <span className={'match xs ' + matchClass(job.match)} style={{ '--p': job.match }}>
                      <span>{job.match}</span>
                    </span>
                  </div>
                  <div className="scraper-job-actions">
                    <button className="btn ghost xs" onClick={() => setTailorJob(tailorJob?.ref === job.ref ? null : job)}>
                      {tailorJob?.ref === job.ref ? '▾ Hide mockup' : '▸ Tailor mockup'}
                    </button>
                    <button className="btn ghost xs" onClick={goToInbox}>Inbox →</button>
                  </div>
                  {tailorJob?.ref === job.ref && (
                    <div className="scraper-tailor-mockup">
                      <div className="mockup-card">
                        <div className="mockup-card-head">
                          <span className="mockup-icon">📄</span>
                          <span>AI-genererat Personligt Brev</span>
                        </div>
                        <div className="mockup-card-body">
                          <p><strong>Hej {job.employer},</strong></p>
                          <p>Jag är en systemtekniker med erfarenhet av drift, molnlösningar och automation. I min nuvarande roll på {job.employer} har jag…</p>
                          <p>Jag ser fram emot att bidra med min kompetens inom [område] till ert team.</p>
                          <p className="muted" style={{ fontSize: 11, marginTop: 8 }}>✎ fullt skräddarsydd text genereras vid riktig tailoring</p>
                        </div>
                      </div>
                      <div className="mockup-card">
                        <div className="mockup-card-head">
                          <span className="mockup-icon">📑</span>
                          <span>AI-genererat CV (nyckelord matchade)</span>
                        </div>
                        <div className="mockup-card-body">
                          <div className="mockup-tags">
                            <span className="mockup-tag ok">Ansible</span>
                            <span className="mockup-tag ok">Terraform</span>
                            <span className="mockup-tag ok">Docker</span>
                            <span className="mockup-tag ok">CI/CD</span>
                            <span className="mockup-tag ok">Linux</span>
                            <span className="mockup-tag partial">Kubernetes</span>
                            <span className="mockup-tag partial">Python</span>
                            <span className="mockup-tag no">AWS</span>
                          </div>
                          <p className="muted" style={{ fontSize: 11, marginTop: 8 }}>
                            ✓ gröna = i ditt CV · <span className="mockup-tag partial" style={{ fontSize: 10, padding: '1px 6px' }}>gula</span> = delvis match · <span className="mockup-tag no" style={{ fontSize: 10, padding: '1px 6px' }}>röda</span> = saknas
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
            {!running && scrapedJobs.length > 0 && (
              <div className="scraper-results-footer">
                <span>✅ {scrapedJobs.length} lead{scrapedJobs.length > 1 ? 's' : ''} added to your </span>
                <button className="btn ghost xs" onClick={goToInbox} style={{ fontWeight: 600 }}>Inbox →</button>
                <span className="muted" style={{ marginLeft: 'auto', fontSize: 11 }}>review & tailor individually</span>
              </div>
            )}
            {!running && scrapedJobs.length > 0 && (
              <div className="scraper-results-cta">
                Jobs appear in your Inbox for granular checkup and AI mockup of cover letter + CV before submission.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="scraper-info">
        <h4>Sources</h4>
        <div className="scraper-sources">
          <div className={'source-card' + (currentSource === 'AF' ? ' card-active' : '')}>
            <span className="source-icon" style={currentSource === 'AF' ? { boxShadow: '0 0 12px rgba(80,183,160,0.5)', borderColor: '#50b7a0' } : {}}>AF</span>
            <div>
              <strong>Arbetsförmedlingen</strong>
              <span className="muted"> — Public API, no auth needed</span>
            </div>
            {currentSource === 'AF' ? <span className="pill accent pulse">Scraping…</span> : <span className="pill success">Active</span>}
          </div>
          <div className={'source-card' + (currentSource === 'LinkedIn' ? ' card-active' : '')}>
            <span className="source-icon" style={currentSource === 'LinkedIn' ? { boxShadow: '0 0 12px rgba(10,102,194,0.5)', borderColor: '#0a66c2' } : {}}>in</span>
            <div>
              <strong>LinkedIn</strong>
              <span className="muted"> — Jobs API via OAuth</span>
            </div>
            {currentSource === 'LinkedIn' ? <span className="pill accent pulse">Scraping…</span> : profile?.linkedin_username ? (
              <span className="pill success">Connected</span>
            ) : (
              <span className="pill warn">Not connected</span>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .scraper-source-chip.active .scraper-source-dot {
          animation: srcPulse 1.2s ease-in-out infinite;
        }
        @keyframes srcPulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.4); }
        }
        .pill.pulse {
          animation: pillPulse 1.2s ease-in-out infinite;
        }
        @keyframes pillPulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.6; }
        }
      `}</style>
    </div>
  );
}
