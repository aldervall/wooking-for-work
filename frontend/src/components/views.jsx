import React from 'react';
import { srcInitials, daysAgo, shortUrl } from '../utils';

export function AtlasView({ jobs, onOpen }) {
  const W = 900, H = 620, cx = 440, cy = 320, radiusKmToPx = 2.4;

  const positions = React.useMemo(() => {
    const bearings = {
      Sala: { deg: 0, km: 0 }, Heby: { deg: 200, km: 38 },
      Västerås: { deg: 165, km: 43 }, Stockholm: { deg: 130, km: 110 },
      'EU Remote': { deg: 250, km: 220 }, 'Remote (USA)': { deg: 300, km: 240 },
      'Remote (SE)': { deg: 60, km: 170 }
    };
    return jobs.map(j => {
      const b = bearings[j.location] || { deg: 90, km: (j.distance || 50) + 10 };
      const rad = (b.deg - 90) * Math.PI / 180;
      const insideRadius = (j.distance != null && j.distance <= 60);
      const color = insideRadius ? 'var(--success)' :
        (j.distance != null && j.distance > 60) || j.location.includes('USA') || j.location === 'EU Remote' ? 'var(--accent)' : 'var(--warning)';
      return { ...j, px: cx + Math.cos(rad) * b.km * radiusKmToPx, py: cy + Math.sin(rad) * b.km * radiusKmToPx, color };
    });
  }, [jobs]);

  const stats = React.useMemo(() => {
    let inside = 0, outside = 0, remote = 0;
    jobs.forEach(j => {
      if (j.distance != null && j.distance <= 60) inside++;
      else if (j.remote) remote++;
      else outside++;
    });
    return { inside, outside, remote };
  }, [jobs]);

  return (
    <div className="atlas-wrap">
      <div className="atlas-map">
        <svg viewBox={`0 0 ${W} ${H}`} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
          <path d={`M 80 ${H - 60} Q 200 ${H - 130} 280 ${H - 220} T 420 ${H - 380} Q 520 ${H - 420} 640 ${H - 360} T 820 ${H - 300}`}
            stroke="var(--border-2)" strokeWidth="2" fill="none" strokeDasharray="6 6" opacity="0.55" />
          <path d={`M 60 90 Q 200 110 320 80 T 540 60 Q 700 50 820 80`}
            stroke="var(--border-2)" strokeWidth="1.5" fill="none" strokeDasharray="3 5" opacity="0.4" />
          <circle cx={cx} cy={cy} r={60 * radiusKmToPx} fill="rgba(45, 122, 74, 0.07)"
            stroke="var(--success)" strokeWidth="2" strokeDasharray="8 6" opacity="0.85" />
          <text x={cx + 60 * radiusKmToPx + 12} y={cy - 4} fontFamily="var(--font-display)" fontSize="20" fill="var(--success)">
            60 km dagpendling
          </text>
          <circle cx={cx} cy={cy} r={30 * radiusKmToPx} fill="none"
            stroke="var(--border-2)" strokeWidth="1" strokeDasharray="2 6" opacity="0.6" />
          <circle cx={cx} cy={cy} r="5" fill="var(--ink)" />
          <text x={cx + 10} y={cy - 8} fontFamily="var(--font-display)" fontSize="22" fill="var(--ink)" fontWeight="500">Sala</text>
          {positions.filter(p => p.distance != null && p.distance > 60).map(p => (
            <line key={'l' + p.id} x1={cx} y1={cy} x2={p.px} y2={p.py}
              stroke="var(--accent)" strokeWidth="1" strokeDasharray="3 4" opacity="0.4" />
          ))}
          {positions.map(p => (
            <g key={p.id} className="pin-job" onClick={() => onOpen(p.id)}>
              <circle cx={p.px} cy={p.py} r="11" fill={p.color} stroke="var(--surface)" strokeWidth="2" />
              <text x={p.px} y={p.py + 3.5} textAnchor="middle" fill="white" fontFamily="var(--font-mono)" fontSize="9.5" fontWeight="700">{p.match}</text>
              <text x={p.px + 16} y={p.py - 4} fontFamily="var(--font-sans)" fontSize="12" fill="var(--ink)" fontWeight="500">
                {p.title.length > 24 ? p.title.slice(0, 24) + '…' : p.title}
              </text>
              <text x={p.px + 16} y={p.py + 10} fontFamily="var(--font-mono)" fontSize="10" fill="var(--ink-3)">
                {p.employer} · {p.distance != null ? p.distance + ' km' : 'remote'}
              </text>
            </g>
          ))}
          <g transform="translate(70, 70)">
            <circle r="22" fill="var(--surface)" stroke="var(--border-2)" strokeWidth="1.5" />
            <path d="M 0 -16 L 4 0 L 0 16 L -4 0 Z" fill="var(--ink)" />
            <text y="-26" fontFamily="var(--font-display)" fontSize="14" fill="var(--ink)" textAnchor="middle">N</text>
          </g>
        </svg>
      </div>
      <aside className="atlas-side">
        <h3 style={{ marginBottom: 14 }}>Triage queue</h3>
        <div className="muted" style={{ fontSize: 12, marginBottom: 14 }}>
          5 seconds per job. Use <span className="kbd">←</span> skip · <span className="kbd">→</span> apply · <span className="kbd">↑</span> shortlist.
        </div>
        <div className="section-title">Up next · {jobs.length}</div>
        {jobs.slice(0, 4).map(j => (
          <div key={j.id} onClick={() => onOpen(j.id)} style={{ cursor: 'pointer', padding: '8px 10px', borderRadius: 'var(--radius)', display: 'flex', alignItems: 'center', gap: 10, fontSize: 12.5 }}>
            <span className={'src-chip ' + j.src}>{srcInitials(j.src)}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{j.title}</div>
              <div className="mono muted" style={{ fontSize: 10.5 }}>{j.employer} · {j.distance != null ? j.distance + ' km' : 'remote'}</div>
            </div>
          </div>
        ))}
      </aside>
    </div>
  );
}

export function ReportView({ jobs, activities }) {
  const month = 'Maj 2026';
  const submitted = jobs.filter(j => j.state === 'submitted' || j.state === 'replied');

  return (
    <div className="report-grid">
      <div className="report-main">
        <div className="row" style={{ marginBottom: 18 }}>
          <h1 style={{ fontSize: 24 }}>{month}</h1>
          <span className="spacer" />
          <button className="btn primary">📤 Export & send</button>
        </div>

        <h4 style={{ marginBottom: 12 }}>Logged activities</h4>
        {submitted.map(job => {
          const act = activities.find(a => a.jobId === job.id);
          const has = !!act;
          const outside = job.distance != null && job.distance > 60;
          const exempt = job.distance != null && job.distance <= 60;
          const flag = !has && !exempt;
          return (
            <div className={'report-row' + (flag ? ' warn' : '')} key={job.id}>
              <input type="checkbox" defaultChecked={has} />
              <div>
                <div className="row" style={{ gap: 6 }}>
                  <span className={'src-chip ' + job.src}>{srcInitials(job.src)}</span>
                  <span className="title">{job.title}</span>
                  <span className="muted" style={{ fontSize: 13 }}>· {job.employer}</span>
                </div>
                <div className="meta">
                  submitted {job.submittedAt || 'recently'} ·
                  {has ? ` evidence ✓ — ${act.note}` : exempt ? ' within 60 km — no evidence needed' : ' evidence missing'}
                </div>
              </div>
              {outside && <span className="pill accent">{job.distance} km</span>}
              {exempt && <span className="pill success">{job.distance} km ✓</span>}
            </div>
          );
        })}
      </div>

      <aside className="report-side">
        <h4 style={{ margin: 0 }}>Preview · evidence.md</h4>
        <div className="md-preview">
          {activities.map((a, i) => {
            const j = jobs.find(x => x.id === a.jobId);
            if (!j) return null;
            return (
              <div key={i} style={{ marginBottom: 8, fontSize: 12 }}>
                <strong>{i + 1}. {j.title} – {j.employer}</strong><br />
                Plats: {j.location}<br />
                Bevis: {a.note}
              </div>
            );
          })}
        </div>
      </aside>
    </div>
  );
}

export function RunDrawer({ open, onClose, job, onDone }) {
  if (!open || !job) return null;
  return (
    <>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="drawer" style={{ width: 'min(1200px, 92vw)' }}>
        <div className="drawer-head" style={{ alignItems: 'center' }}>
          <div className="row" style={{ gap: 10 }}>
            <span className="pill accent" style={{ padding: '3px 10px', fontSize: 11 }}>
              <span className="dot" style={{ background: 'var(--accent)' }} /> LIVE RUN
            </span>
            <span className="mono muted" style={{ fontSize: 11 }}>run_id: 019c4...e3a</span>
          </div>
          <div style={{ flex: 1, textAlign: 'right' }}>
            <h2 style={{ fontSize: 18 }}>{job.title} · {job.employer}</h2>
            <div className="mono muted" style={{ fontSize: 11 }}>started 09:21 · {job.src} #{job.ref}</div>
          </div>
          <button className="btn ghost icon" onClick={onClose}>✕</button>
        </div>

        <div className="run-wrap" style={{ flex: 1, minHeight: 0 }}>
          <div className="run-side">
            <h4 style={{ marginBottom: 16 }}>Timeline</h4>
            <div className="timeline-step pending">
              <div className="label">Queue run</div>
              <div className="meta">ready · awaiting steps</div>
            </div>
          </div>

          <div className="run-stage">
            <div className="run-tab-bar">
              <div className="traffic">
                <span style={{ background: '#e3582b' }} />
                <span style={{ background: '#f0c419' }} />
                <span style={{ background: '#4a9c5d' }} />
              </div>
              <div className="url-bar">
                <span style={{ color: 'rgba(255,255,255,0.55)' }}>🔒</span>
                <span>{job.src === 'AF' ? 'arbetsformedlingen.se' : (job.url || 'careers.example.com')}/apply</span>
              </div>
            </div>

            <div className="run-viewport">
              <h2 style={{ fontSize: 24 }}>Apply for {job.title}</h2>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginTop: 20 }}>
                <FormField label="FULL NAME *" value="Niklas Aldervall" autofilled />
                <FormField label="EMAIL *" value="niklas@aldervall.se" autofilled />
                <FormField label="PHONE" value="+46 73 267 12 31" autofilled />
                <FormField label="LINKEDIN URL" value="linkedin.com/in/aldervall" autofilled />
              </div>
            </div>

            <div className="run-foot">
              <span style={{ fontSize: 14 }}>Did you submit the form?</span>
              <span className="spacer" />
              <button className="btn ghost danger" onClick={onClose}>⊘ Cancel run</button>
              <button className="btn primary" onClick={onDone}>✓ Done — log it</button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

function FormField({ label, value, autofilled }) {
  return (
    <div>
      <div className="mono muted" style={{ fontSize: 10, marginBottom: 6, letterSpacing: '0.06em' }}>{label}</div>
      <div style={{
        border: '1px solid var(--border-2)', borderRadius: 5, padding: 9,
        background: autofilled ? 'var(--success-soft)' : 'var(--surface)', fontSize: 13.5, display: 'flex', alignItems: 'center'
      }}>
        <span style={{ flex: 1 }}>{value}</span>
        {autofilled && <span style={{ color: 'var(--success)', fontSize: 11, fontWeight: 600 }}>↩ autofilled</span>}
      </div>
    </div>
  );
}
