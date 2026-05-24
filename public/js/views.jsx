// Atlas (map) + Aktivitetsrapport + Run drawer
const { useState: _aS, useMemo: _aM } = React;

// ============ ATLAS ============
function AtlasView({ jobs, onOpen }) {
  // Place jobs on a simulated map relative to Sala (cx, cy).
  // We position by direction (real-ish for the demo cities) and distance.
  const W = 900, H = 620;
  const cx = 440, cy = 320;
  const radiusKmToPx = 2.4; // 60km → 144px

  const positions = _aM(() => {
    // bearings (degrees from north, clockwise) for known cities
    const bearings = {
      'Sala':      { deg: 0,    km: 0 },
      'Heby':      { deg: 200,  km: 38 },
      'Västerås':  { deg: 165,  km: 43 },
      'Stockholm': { deg: 130,  km: 110 },
      'EU Remote': { deg: 250,  km: 220 },
      'Remote (USA)': { deg: 300, km: 240 },
      'Remote (SE)': { deg: 60, km: 170 }
    };
    return jobs.map(j => {
      const b = bearings[j.location] || { deg: 90, km: (j.distance || 50) + 10 };
      const rad = (b.deg - 90) * Math.PI / 180;
      const px = cx + Math.cos(rad) * b.km * radiusKmToPx;
      const py = cy + Math.sin(rad) * b.km * radiusKmToPx;
      const insideRadius = (j.distance != null && j.distance <= 60);
      const color = insideRadius ? 'var(--success)' :
                    (j.distance != null && j.distance > 60) || j.location.includes('USA') || j.location === 'EU Remote' ? 'var(--accent)' :
                    'var(--warning)';
      return { ...j, px, py, color };
    });
  }, [jobs]);

  const stats = _aM(() => {
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
          {/* faint Sweden-ish shoreline */}
          <path d={`M 80 ${H-60} Q 200 ${H-130} 280 ${H-220} T 420 ${H-380} Q 520 ${H-420} 640 ${H-360} T 820 ${H-300}`}
            stroke="var(--border-2)" strokeWidth="2" fill="none" strokeDasharray="6 6" opacity="0.55" />
          <path d={`M 60 90 Q 200 110 320 80 T 540 60 Q 700 50 820 80`}
            stroke="var(--border-2)" strokeWidth="1.5" fill="none" strokeDasharray="3 5" opacity="0.4" />

          {/* 60km dagpendling ring */}
          <circle cx={cx} cy={cy} r={60 * radiusKmToPx} fill="rgba(45, 122, 74, 0.07)"
                  stroke="var(--success)" strokeWidth="2" strokeDasharray="8 6" opacity="0.85" />
          <text x={cx + 60 * radiusKmToPx + 12} y={cy - 4} fontFamily="var(--font-display)" fontSize="20" fill="var(--success)">
            60 km dagpendling
          </text>
          <text x={cx + 60 * radiusKmToPx + 12} y={cy + 16} fontFamily="var(--font-mono)" fontSize="10.5" fill="var(--ink-3)">
            inside = no AF evidence needed
          </text>

          {/* 30km inner ring (subtle) */}
          <circle cx={cx} cy={cy} r={30 * radiusKmToPx} fill="none"
                  stroke="var(--border-2)" strokeWidth="1" strokeDasharray="2 6" opacity="0.6" />

          {/* Sala center */}
          <circle cx={cx} cy={cy} r="5" fill="var(--ink)" />
          <text x={cx + 10} y={cy - 8} fontFamily="var(--font-display)" fontSize="22" fill="var(--ink)" fontWeight="500">
            Sala
          </text>
          <text x={cx + 10} y={cy + 8} fontFamily="var(--font-mono)" fontSize="10" fill="var(--ink-3)">
            home
          </text>

          {/* Distance lines for outside jobs */}
          {positions.filter(p => p.distance != null && p.distance > 60).map(p => (
            <line key={'l'+p.id} x1={cx} y1={cy} x2={p.px} y2={p.py}
                  stroke="var(--accent)" strokeWidth="1" strokeDasharray="3 4" opacity="0.4" />
          ))}

          {/* Job pins */}
          {positions.map(p => (
            <g key={p.id} className="pin-job" onClick={() => onOpen(p.id)}>
              <circle cx={p.px} cy={p.py} r="11" fill={p.color} stroke="var(--surface)" strokeWidth="2" />
              <text x={p.px} y={p.py + 3.5} textAnchor="middle" fill="white" fontFamily="var(--font-mono)" fontSize="9.5" fontWeight="700">
                {p.match}
              </text>
              <text x={p.px + 16} y={p.py - 4} fontFamily="var(--font-sans)" fontSize="12" fill="var(--ink)" fontWeight="500">
                {p.title.length > 24 ? p.title.slice(0, 24) + '…' : p.title}
              </text>
              <text x={p.px + 16} y={p.py + 10} fontFamily="var(--font-mono)" fontSize="10" fill="var(--ink-3)">
                {p.employer} · {p.distance != null ? p.distance + ' km' : 'remote'}
              </text>
            </g>
          ))}

          {/* compass */}
          <g transform="translate(70, 70)">
            <circle r="22" fill="var(--surface)" stroke="var(--border-2)" strokeWidth="1.5" />
            <path d="M 0 -16 L 4 0 L 0 16 L -4 0 Z" fill="var(--ink)" />
            <text y="-26" fontFamily="var(--font-display)" fontSize="14" fill="var(--ink)" textAnchor="middle">N</text>
          </g>

          {/* scale */}
          <g transform={`translate(70, ${H-50})`}>
            <line x1="0" y1="0" x2={60 * radiusKmToPx} y2="0" stroke="var(--ink-2)" strokeWidth="2" />
            <line x1="0" y1="-5" x2="0" y2="5" stroke="var(--ink-2)" strokeWidth="2" />
            <line x1={30 * radiusKmToPx} y1="-3" x2={30 * radiusKmToPx} y2="3" stroke="var(--ink-2)" strokeWidth="1.5" />
            <line x1={60 * radiusKmToPx} y1="-5" x2={60 * radiusKmToPx} y2="5" stroke="var(--ink-2)" strokeWidth="2" />
            <text x="0" y="20" fontFamily="var(--font-mono)" fontSize="10" fill="var(--ink-3)">0</text>
            <text x={30 * radiusKmToPx - 12} y="20" fontFamily="var(--font-mono)" fontSize="10" fill="var(--ink-3)">30km</text>
            <text x={60 * radiusKmToPx - 12} y="20" fontFamily="var(--font-mono)" fontSize="10" fill="var(--ink-3)">60km</text>
          </g>
        </svg>

        <div className="atlas-controls">
          <button className="btn icon">+</button>
          <button className="btn icon">−</button>
          <button className="btn icon" title="Recenter on Sala">⌂</button>
        </div>

        <div className="atlas-legend">
          <div className="row">
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--success)' }} />
            <span>Inside 60 km</span>
            <span className="muted mono" style={{ fontSize: 10, marginLeft: 'auto' }}>{stats.inside}</span>
          </div>
          <div className="row">
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--warning)' }} />
            <span>30–60 km (borderline)</span>
          </div>
          <div className="row">
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent)' }} />
            <span>&gt; 60 km · AF evidence</span>
            <span className="muted mono" style={{ fontSize: 10, marginLeft: 'auto' }}>{stats.outside + stats.remote}</span>
          </div>
        </div>
      </div>

      <aside className="atlas-side">
        <h3 style={{ marginBottom: 14 }}>Triage queue</h3>
        <div className="muted" style={{ fontSize: 12, marginBottom: 14 }}>
          5 seconds per job. Use <span className="kbd">←</span> skip · <span className="kbd">→</span> apply · <span className="kbd">↑</span> shortlist.
        </div>

        <div className="card" style={{ padding: 16, marginBottom: 12 }}>
          <div className="row" style={{ marginBottom: 8 }}>
            <span className="src-chip AF">AF</span>
            <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>12 km · Sala kommun · {daysAgo(1)}</span>
          </div>
          <h3 style={{ fontSize: 18 }}>IT-tekniker, 1st line</h3>
          <div className="muted" style={{ fontSize: 13, marginBottom: 12 }}>Tillsvidare · Svenska krävs · Onsite</div>
          <p style={{ fontSize: 13, color: 'var(--ink-2)', margin: 0, lineHeight: 1.5 }}>
            Vi söker en serviceinriktad IT-tekniker till Sala kommun…
          </p>
          <div className="row" style={{ marginTop: 14, gap: 12 }}>
            <span className="match lg s-hi" style={{ '--p': 86 }}><span>86</span></span>
            <div style={{ fontSize: 12 }}>
              <div style={{ color: 'var(--success)' }}>✓ inside 60 km</div>
              <div style={{ color: 'var(--success)' }}>✓ skill overlap</div>
              <div style={{ color: 'var(--warning)' }}>⚠ onsite only</div>
            </div>
          </div>
        </div>

        <div className="row" style={{ gap: 6 }}>
          <button className="btn" style={{ flex: 1 }}>← skip</button>
          <button className="btn" style={{ flex: 1 }}>★ shortlist</button>
          <button className="btn primary" style={{ flex: 1.2 }}>apply →</button>
        </div>

        <div className="hr" style={{ margin: '18px 0' }} />

        <div className="section-title">Up next · 4</div>
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


// ============ AKTIVITETSRAPPORT ============
function ReportView({ jobs, activities }) {
  const month = 'Maj 2026';
  const submitted = jobs.filter(j => j.state === 'submitted' || j.state === 'replied');

  const required = 12;
  const logged = 9;
  const outsideCount = activities.filter(a => {
    const j = jobs.find(x => x.id === a.jobId);
    return j && (j.distance == null || j.distance > 60);
  }).length;
  const pendingReview = submitted.length - activities.length;

  const md = buildMarkdown(activities, jobs, month);

  return (
    <div className="report-grid">
      <div className="report-main">
        <div className="row" style={{ marginBottom: 18 }}>
          <h1 style={{ fontSize: 24 }}>{month}</h1>
          <span className="mono muted" style={{ fontSize: 12 }}>· for Amanda Gärdebring · Arbetsförmedlingen</span>
          <span className="spacer" />
          <button className="btn">← april</button>
          <button className="btn">juni →</button>
          <button className="btn primary">📤 Export &amp; send</button>
        </div>

        <div className="stat-row">
          <Stat label="Required" value={required} trend="on track" />
          <Stat label="Logged" value={<>{logged}<small> / {required}</small></>} trend="↗ +3 this week" />
          <Stat label="Outside 60 km" value={outsideCount} trend="all with evidence" />
          <Stat label="Pending review" value={Math.max(0, pendingReview)} trend="action needed" warn />
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
                  {has ? ` evidence ✓ — ${act.note}` : exempt ? ' within 60 km — no evidence needed' : ' evidence missing'} ·
                  <span style={{ color: 'var(--info)', marginLeft: 4 }}>{shortUrl(job.url)}</span>
                </div>
              </div>
              {outside && <span className="pill accent">{job.distance} km</span>}
              {!job.distance && (job.location.includes('USA') || job.location === 'EU Remote') && <span className="pill accent">{job.location}</span>}
              {exempt && <span className="pill success">12 km ✓</span>}
              <a href="#" onClick={e => e.preventDefault()}>{has ? 'edit' : 'log'}</a>
            </div>
          );
        })}

        <div className="hr" style={{ margin: '20px 0' }} />

        <h4 style={{ marginBottom: 12 }}>Other activities</h4>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          <div className="card row" style={{ padding: '10px 14px', fontSize: 13 }}>
            <span style={{ fontSize: 16 }}>📞</span>
            <div style={{ flex: 1 }}>
              <strong>Networking call</strong> — Erik @ Klarna
              <div className="muted mono" style={{ fontSize: 11 }}>8 maj · 45 min</div>
            </div>
            <a href="#" onClick={e => e.preventDefault()} style={{ fontSize: 12, color: 'var(--info)' }}>+ log</a>
          </div>
          <div className="card row" style={{ padding: '10px 14px', fontSize: 13 }}>
            <span style={{ fontSize: 16 }}>📚</span>
            <div style={{ flex: 1 }}>
              <strong>Course</strong> — Kubernetes CKA
              <div className="muted mono" style={{ fontSize: 11 }}>10 maj · 6 h</div>
            </div>
            <a href="#" onClick={e => e.preventDefault()} style={{ fontSize: 12, color: 'var(--info)' }}>+ log</a>
          </div>
        </div>
        <button className="btn" style={{ marginTop: 14 }}>+ Add manual activity</button>
      </div>

      <aside className="report-side">
        <div className="row" style={{ marginBottom: 12 }}>
          <h4 style={{ margin: 0 }}>Preview · evidence.md</h4>
          <span className="spacer" />
          <span className="muted mono" style={{ fontSize: 10 }}>auto-generated</span>
        </div>
        <div className="md-preview" dangerouslySetInnerHTML={{ __html: md }} />
        <button className="btn primary" style={{ marginTop: 12, width: '100%', justifyContent: 'center' }}>
          ⬇ Download markdown
        </button>
      </aside>
    </div>
  );
}

function shortUrl(u) {
  if (!u) return '';
  try { const p = new URL(u); return p.hostname.replace('www.', '') + p.pathname.slice(0, 22) + (p.pathname.length > 22 ? '…' : ''); }
  catch { return u.slice(0, 32); }
}

function Stat({ label, value, trend, warn }) {
  return (
    <div className="stat">
      <div className="l">{label}</div>
      <div className="n">{value}</div>
      <div className={'trend' + (warn ? ' warn' : '')}>{trend}</div>
    </div>
  );
}

function buildMarkdown(activities, jobs, month) {
  const lines = [];
  lines.push('<span class="h"># Underlag aktivitetsrapport</span>');
  lines.push('<b>Datum:</b> 31 maj 2026');
  lines.push('<b>Till:</b> Amanda Gärdebring, Arbetsförmedlingen');
  lines.push('<b>Från:</b> Niklas Aldervall');
  lines.push('');
  lines.push('<span class="h">## Sammanfattning</span>');
  lines.push('Nedan följer underlag som styrker att de sökta tjänsterna är belägna utanför dagpendlingavstånd från Sala (60 km).');
  lines.push('');
  activities.forEach((a, i) => {
    const j = jobs.find(x => x.id === a.jobId);
    if (!j) return;
    lines.push(`<span class="h">## ${i + 1}. ${j.title} – ${j.employer}</span>`);
    lines.push(`<b>Plats:</b> <span class="warn-text">${j.location}</span>`);
    lines.push(`<b>Källa:</b> <span class="url">${shortUrl(j.url)}</span>`);
    lines.push(`<b>Bevis:</b> ${a.note}`);
    lines.push('');
  });
  lines.push('<span class="h">## Slutsats</span>');
  lines.push('Inga av tjänsterna ligger inom 60 km dagpendling från Sala, Västmanlands län.');
  return lines.join('\n');
}


// ============ RUN DRAWER (when "Jag vill ansöka!" is pressed) ============
function RunDrawer({ open, onClose, job, steps, onDone }) {
  if (!open || !job) return null;
  return (
    <React.Fragment>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="drawer" style={{ width: 'min(1200px, 92vw)' }}>
        <div className="drawer-head" style={{ alignItems: 'center' }}>
          <div className="row" style={{ gap: 10 }}>
            <span className="pill accent" style={{ padding: '3px 10px', fontSize: 11 }}>
              <span className="dot" style={{ background: 'var(--accent)' }} />
              LIVE RUN
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
            {steps.map(s => (
              <div className={'timeline-step ' + s.state} key={s.id}>
                <div className="label">{s.label}</div>
                <div className="meta">{s.ts}{s.duration ? ` · ${s.duration}` : ''}</div>
                <div className="detail">{s.detail}</div>
              </div>
            ))}

            <div className="hr" style={{ margin: '20px 0' }} />

            <h4 style={{ marginBottom: 10 }}>Artifacts</h4>
            <div className="card" style={{ padding: '8px 12px', marginBottom: 6, fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 16 }}>📄</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong>CV</strong>
                <div className="mono muted" style={{ fontSize: 10.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {(job.slug || 'scilife-it-mgr')}-1715683200.json
                </div>
              </div>
              <a href="#" onClick={e => e.preventDefault()} style={{ color: 'var(--info)', fontSize: 12 }}>view</a>
            </div>
            <div className="card" style={{ padding: '8px 12px', fontSize: 12.5, display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 16 }}>✉</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong>Personligt brev</strong>
                <div className="mono muted" style={{ fontSize: 10.5, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  pb-{(job.slug || 'scilife-it-mgr')}.json
                </div>
              </div>
              <a href="#" onClick={e => e.preventDefault()} style={{ color: 'var(--info)', fontSize: 12 }}>view</a>
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
              <span className="live"><span style={{ display: 'inline-block', width: 6, height: 6, borderRadius: '50%', background: 'white', marginRight: 5 }} />LIVE</span>
              <span style={{ color: 'rgba(255,255,255,0.6)' }}>browserless · :3001</span>
            </div>

            <div className="run-viewport">
              <div className="muted mono" style={{ fontSize: 11, marginBottom: 16 }}>
                [mock viewport — what browserless is rendering]
              </div>
              <h2 style={{ fontSize: 24 }}>Apply for {job.title}</h2>
              <p className="muted" style={{ fontSize: 14 }}>Please fill in the form below. Fields marked * are required.</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 18, marginTop: 20 }}>
                <FormField label="FULL NAME *" value="Niklas Aldervall" autofilled />
                <FormField label="EMAIL *" value="niklas@aldervall.se" autofilled />
                <FormField label="PHONE" value="+46 70 123 45 67" autofilled />
                <FormField label="LINKEDIN URL" value="linkedin.com/in/aldervall" autofilled />
              </div>

              <div style={{ marginTop: 18 }}>
                <div className="mono muted" style={{ fontSize: 10, marginBottom: 6, letterSpacing: '0.06em' }}>UPLOAD CV (PDF) *</div>
                <div style={{ border: '1.5px dashed var(--border-2)', borderRadius: 6, padding: 14, display: 'flex', alignItems: 'center', gap: 12, background: 'var(--success-soft)' }}>
                  <span style={{ fontSize: 22 }}>📄</span>
                  <div>
                    <div style={{ fontWeight: 600 }}>{(job.slug || 'scilife-it-mgr')}-1715683200.pdf</div>
                    <div className="mono muted" style={{ fontSize: 11 }}>312 KB · auto-uploaded by Wooking</div>
                  </div>
                  <span style={{ marginLeft: 'auto', color: 'var(--success)', fontWeight: 600 }}>✓ ready</span>
                </div>
              </div>

              <div style={{ marginTop: 18 }}>
                <div className="mono muted" style={{ fontSize: 10, marginBottom: 6, letterSpacing: '0.06em' }}>WHY DO YOU WANT THIS ROLE?</div>
                <div style={{ border: '1px solid var(--border-2)', borderRadius: 6, padding: 12, minHeight: 90, fontSize: 13, color: 'var(--ink-2)' }}>
                  <span style={{ color: 'var(--accent)', borderLeft: '2px solid var(--accent)', paddingLeft: 6, fontStyle: 'italic', fontSize: 12 }}>
                    cursor here — Wooking never auto-types this field
                  </span>
                </div>
              </div>

              <div style={{ marginTop: 22, display: 'flex', gap: 10, alignItems: 'center' }}>
                <button style={{ padding: '10px 20px', background: '#0a66c2', color: 'white', border: 0, borderRadius: 5, fontSize: 14, cursor: 'pointer', fontWeight: 600 }}>
                  Submit application
                </button>
                <span style={{ color: 'var(--ink-3)', fontSize: 13 }}>← you click this, not us</span>
              </div>
            </div>

            <div className="run-foot">
              <span style={{ fontSize: 14 }}>Did you submit the form?</span>
              <span className="muted" style={{ fontSize: 12 }}>Marking done logs this run to aktivitetsrapport · 1 of 3 this week</span>
              <span className="spacer" />
              <button className="btn ghost danger">⊘ Cancel run</button>
              <button className="btn primary" onClick={onDone}>✓ Done — log it</button>
            </div>
          </div>
        </div>
      </div>
    </React.Fragment>
  );
}

function FormField({ label, value, autofilled }) {
  return (
    <div>
      <div className="mono muted" style={{ fontSize: 10, marginBottom: 6, letterSpacing: '0.06em' }}>{label}</div>
      <div style={{
        border: '1px solid var(--border-2)',
        borderRadius: 5,
        padding: 9,
        background: autofilled ? 'var(--success-soft)' : 'var(--surface)',
        fontSize: 13.5,
        display: 'flex',
        alignItems: 'center'
      }}>
        <span style={{ flex: 1 }}>{value}</span>
        {autofilled && <span style={{ color: 'var(--success)', fontSize: 11, fontWeight: 600 }}>↩ autofilled</span>}
      </div>
    </div>
  );
}

Object.assign(window, { AtlasView, ReportView, RunDrawer });
