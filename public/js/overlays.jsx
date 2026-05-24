// Command palette (⌘K) + Detail drawer
const { useState: _useS, useEffect: _useE, useMemo: _useM, useRef: _useR } = React;

// ============ COMMAND PALETTE ============
function CommandPalette({ commands, open, onClose, onRun, contextJob }) {
  const [q, setQ] = _useS('');
  const [sel, setSel] = _useS(0);
  const inputRef = _useR(null);

  _useE(() => {
    if (open) {
      setQ('');
      setSel(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [open]);

  const filtered = _useM(() => {
    const all = commands;
    if (!q) return all;
    const qq = q.toLowerCase();
    return all.filter(c => c.label.toLowerCase().includes(qq) || c.hint.toLowerCase().includes(qq));
  }, [commands, q]);

  const grouped = _useM(() => {
    const m = {};
    filtered.forEach(c => { (m[c.group] = m[c.group] || []).push(c); });
    return m;
  }, [filtered]);

  const flat = filtered;

  _useE(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setSel(s => Math.min(flat.length - 1, s + 1)); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setSel(s => Math.max(0, s - 1)); }
      if (e.key === 'Enter')     { e.preventDefault(); flat[sel] && onRun(flat[sel]); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, flat, sel]);

  if (!open) return null;
  return (
    <div className="palette-backdrop" onClick={onClose}>
      <div className="palette" onClick={e => e.stopPropagation()}>
        <div className="palette-search">
          <span style={{ color: 'var(--accent)', fontWeight: 600 }}>›</span>
          <input
            ref={inputRef}
            value={q}
            onChange={e => { setQ(e.target.value); setSel(0); }}
            placeholder={contextJob ? `Action for "${contextJob.title}"…` : 'Type a command, search jobs, navigate…'}
          />
          <span className="kbd">esc</span>
        </div>
        <div className="palette-list">
          {Object.entries(grouped).map(([g, items]) => (
            <div className="palette-group" key={g}>
              <div className="palette-group-label">{g}</div>
              {items.map((c) => {
                const idx = flat.indexOf(c);
                return (
                  <div
                    key={c.id}
                    className={'palette-item' + (idx === sel ? ' active' : '')}
                    onMouseEnter={() => setSel(idx)}
                    onClick={() => onRun(c)}
                  >
                    <span style={{ width: 20, textAlign: 'center', color: 'var(--ink-3)' }}>
                      {iconForCmd(c.id)}
                    </span>
                    <span className="label">{c.label}</span>
                    {c.hint && <span className="hint">{c.hint}</span>}
                    <span className="keys">
                      {c.keys.map((k, i) => <span className="kbd" key={i}>{k}</span>)}
                    </span>
                  </div>
                );
              })}
            </div>
          ))}
          {flat.length === 0 && (
            <div style={{ padding: '24px 18px', color: 'var(--ink-3)', textAlign: 'center', fontSize: 13 }}>
              No commands match. Try "tailor", "apply", "atlas"…
            </div>
          )}
        </div>
        <div className="palette-foot">
          <span><span className="kbd">↑</span><span className="kbd">↓</span> navigate</span>
          <span><span className="kbd">↵</span> run</span>
          <span><span className="kbd">esc</span> close</span>
          <span style={{ marginLeft: 'auto' }}>Wooking · ⌘K</span>
        </div>
      </div>
    </div>
  );
}

function iconForCmd(id) {
  if (id.startsWith('tailor')) return '✨';
  if (id === 'apply') return '🚀';
  if (id === 'shortlist') return '★';
  if (id === 'dismiss') return '⊘';
  if (id === 'evidence') return '📄';
  if (id.startsWith('go-')) return '→';
  if (id === 'open') return '↗';
  if (id === 'refresh') return '⟳';
  return '·';
}


// ============ DETAIL DRAWER ============
function DetailDrawer({ job, open, onClose, onTailor, onApply, onShortlist, onDismiss, cvDiff, aiChatLog }) {
  const [tab, setTab] = _useS('overview');

  _useE(() => { if (open) setTab('overview'); }, [open, job?.id]);

  if (!open || !job) return null;
  const matchClass = job.match >= 80 ? 's-hi' : job.match >= 65 ? 's-med' : 's-lo';
  const inRange = job.distance != null && job.distance <= 60;
  const outOfRange = job.distance != null && job.distance > 60;

  return (
    <React.Fragment>
      <div className="drawer-backdrop" onClick={onClose} />
      <div className="drawer">
        <div className="drawer-head">
          <span className={'match lg ' + matchClass} style={{ '--p': job.match }}>
            <span>{job.match}%</span>
          </span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="row" style={{ gap: 6, marginBottom: 4 }}>
              <span className={'src-chip ' + job.src}>{srcInitials(job.src)}</span>
              <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>
                {job.src === 'AF' ? 'arbetsformedlingen.se' : job.src === 'LinkedIn' ? 'linkedin.com' : 'wise.com'} · ref {job.ref}
              </span>
              <span className="muted" style={{ fontSize: 11 }}>· {daysAgo(job.postedDays)}</span>
            </div>
            <h2>{job.title}</h2>
            <div className="row" style={{ gap: 8, marginTop: 6, color: 'var(--ink-2)', fontSize: 13.5 }}>
              <span>{job.employer}</span>
              <span>·</span>
              <span>{job.location}</span>
              {job.distance != null && (
                <span className="pill" style={{ background: inRange ? 'var(--success-soft)' : 'var(--warning-soft)', color: inRange ? 'var(--success)' : 'var(--warning)', borderColor: 'transparent' }}>
                  {job.distance} km {inRange ? '✓ dagpendling' : outOfRange ? '⚠ >60 km' : ''}
                </span>
              )}
              {job.salary && <span className="muted">· {job.salary}</span>}
            </div>
          </div>
          <button className="btn ghost icon" onClick={onClose} aria-label="Close">✕</button>
        </div>

        <div className="drawer-tabs">
          <div className={'drawer-tab' + (tab==='overview'?' active':'')} onClick={() => setTab('overview')}>Overview</div>
          <div className={'drawer-tab' + (tab==='cv'?' active':'')} onClick={() => setTab('cv')}>
            Tailor CV <span className="count">diff</span>
          </div>
          <div className={'drawer-tab' + (tab==='pb'?' active':'')} onClick={() => setTab('pb')}>Cover letter</div>
          <div className={'drawer-tab' + (tab==='chat'?' active':'')} onClick={() => setTab('chat')}>AI Chat</div>
        </div>

        <div className="drawer-body">
          {tab === 'overview' && <OverviewTab job={job} inRange={inRange} outOfRange={outOfRange} />}
          {tab === 'cv'       && <DiffTab cvDiff={cvDiff} job={job} />}
          {tab === 'pb'       && <CoverTab job={job} />}
          {tab === 'chat'     && <ChatTab log={aiChatLog} />}
        </div>

        <div className="drawer-foot">
          <button className="btn" onClick={() => onShortlist(job)}>★ Shortlist</button>
          <button className="btn" onClick={() => onTailor(job)}>✨ Tailor CV + PB</button>
          <a className="btn" href={job.url} target="_blank" rel="noopener noreferrer">↗ Open original</a>
          <span className="spacer" />
          <button className="btn ghost danger" onClick={() => onDismiss(job)}>Dismiss</button>
          <button className="btn primary" onClick={() => onApply(job)}>🚀 Jag vill ansöka!</button>
        </div>
      </div>
    </React.Fragment>
  );
}

function OverviewTab({ job, inRange, outOfRange }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 280px', gap: 24 }}>
      <div>
        <h4 style={{ marginBottom: 10 }}>Why this matches you</h4>
        <div className="card" style={{ marginBottom: 18, padding: '12px 14px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 13 }}>
            <ReasonRow ok={inRange || job.remote} text={
              inRange ? `Within 60km dagpendling — ${job.distance} km from Sala` :
              job.remote ? `Remote allowed (${job.location})` :
              outOfRange ? `${job.distance} km — outside 60 km dagpendling (auto-flagged as AF evidence)` : `Location: ${job.location}`
            } warn={outOfRange && !job.remote} />
            <ReasonRow ok={job.language === 'sv' || job.language === 'en'} text={`Language: ${job.language === 'sv' ? 'Swedish (match)' : 'English (match)'}`} />
            <ReasonRow ok={true} text="Skills overlap" />
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', paddingLeft: 22 }}>
              {(job.skills || []).map(s => <span className="pill" key={s} style={{ fontSize: 10.5 }}>{s}</span>)}
            </div>
            {job.remote === false && job.distance > 30 && (
              <ReasonRow ok={false} text="Onsite-only and over 30 km — verify with employer if hybrid possible." warn />
            )}
          </div>
        </div>

        <h4 style={{ marginBottom: 10 }}>Job ad</h4>
        <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 'var(--radius)', padding: 14, fontSize: 13.5, lineHeight: 1.55, color: 'var(--ink-2)' }}>
          <p style={{ margin: 0 }}>{job.excerpt}</p>
          <p style={{ marginTop: 12, marginBottom: 0, color: 'var(--ink-3)', fontSize: 12, fontStyle: 'italic' }}>
            [Full ad text continues — scraped {daysAgo(job.postedDays)}, last verified just now]
          </p>
        </div>
      </div>

      <div>
        <h4 style={{ marginBottom: 10 }}>Quick facts</h4>
        <div className="card" style={{ padding: 0 }}>
          <Fact label="Employer" value={job.employer} />
          <Fact label="Source" value={`${job.src} · ${job.ref}`} mono />
          <Fact label="Location" value={job.location} />
          {job.distance != null && <Fact label="Distance" value={`${job.distance} km · ${inRange ? '✓ dagpendling' : '⚠ outside 60 km'}`} />}
          {job.salary && <Fact label="Salary" value={job.salary} />}
          {job.closing && <Fact label="Closing" value={job.closing} mono />}
          <Fact label="Scraped" value="2026-05-12 09:14" mono />
        </div>
        {outOfRange && (
          <div className="card" style={{ marginTop: 12, background: 'var(--accent-tint)', borderColor: 'var(--accent-soft)' }}>
            <div className="section-title" style={{ color: 'var(--accent-ink)' }}>AF Evidence</div>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--accent-ink)' }}>
              This job is outside 60 km dagpendling. Applying counts toward your monthly aktivitetsrapport with auto-generated evidence.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function ReasonRow({ ok, text, warn }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
      <span style={{ color: ok ? 'var(--success)' : warn ? 'var(--warning)' : 'var(--danger)', fontWeight: 700, width: 14, flexShrink: 0 }}>
        {ok ? '✓' : warn ? '⚠' : '✕'}
      </span>
      <span>{text}</span>
    </div>
  );
}

function Fact({ label, value, mono }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', gap: 12, padding: '10px 14px', borderBottom: '1px solid var(--border)', fontSize: 13 }}>
      <span style={{ color: 'var(--ink-3)', fontSize: 11.5, textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>{label}</span>
      <span className={mono ? 'mono' : ''} style={{ fontSize: mono ? 12 : 13 }}>{value}</span>
    </div>
  );
}

function DiffTab({ cvDiff, job }) {
  return (
    <div>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', marginBottom: 14 }}>
        <h4 style={{ margin: 0 }}>AI diff — what tailoring will change</h4>
        <span className="muted" style={{ fontSize: 12 }}>base · na-svenska-cv</span>
        <span className="spacer" />
        <button className="btn sm">⟳ Re-run</button>
        <button className="btn sm primary">Apply changes</button>
      </div>
      <div className="row" style={{ marginBottom: 12, fontSize: 12, color: 'var(--ink-3)' }}>
        <span>Slug</span>
        <span className="mono" style={{ background: 'var(--surface-2)', padding: '2px 8px', borderRadius: 4 }}>
          {(job.slug || `${job.employer.toLowerCase().replace(/[^a-z]+/g,'-')}-${job.title.split(' ')[0].toLowerCase()}-1715683200`)}
        </span>
      </div>
      <div className="diff">
        {cvDiff.map((d, i) => {
          if (d.kind === 'header') return <div className="h-row" key={i}>{d.text}</div>;
          if (d.kind === 'del')    return <div key={i}><span className="del">{d.text}</span></div>;
          if (d.kind === 'add')    return <div key={i}><span className="add">{d.text}</span></div>;
          return null;
        })}
      </div>
      <div className="muted" style={{ marginTop: 12, fontSize: 12 }}>
        ⚠ Generates a duplicate in Reactive Resume. Original CV untouched. CrewAI completion ~12s.
      </div>
    </div>
  );
}

function CoverTab({ job }) {
  return (
    <div>
      <div className="row" style={{ marginBottom: 12 }}>
        <h4 style={{ margin: 0 }}>Personligt brev</h4>
        <span className="muted mono" style={{ fontSize: 11 }}>pb-{job.employer.toLowerCase().replace(/[^a-z]+/g,'-')}-...</span>
        <span className="spacer" />
        <span className="muted" style={{ fontSize: 11 }}>autosaved 3s ago</span>
        <button className="btn sm">⟳ Regenerate</button>
      </div>
      <div className="card" style={{ padding: '18px 22px', fontSize: 14, lineHeight: 1.6, fontFamily: 'var(--font-display)' }}>
        <p style={{ margin: 0 }}>Hej {job.employer},</p>
        <p>Jag söker härmed tjänsten som <strong>{job.title}</strong>. Med 8 års erfarenhet av drift och support i hybrida Windows/Linux-miljöer ser jag att min profil ligger nära den ni beskriver i annonsen — särskilt vad gäller {(job.skills || ['IT-drift']).slice(0, 2).join(', ').toLowerCase()}.</p>
        <p>I min senaste roll på Sala IT Services ansvarade jag för IT-driften för 200+ användare. Jag införde rutiner för {job.skills?.includes('Active Directory') ? 'Active Directory-administration' : 'systemövervakning'} som halverade antalet 1st-line-ärenden under sex månader.</p>
        <p>Jag bor i Sala men är van vid {job.remote ? 'distansarbete' : 'dagpendling till uppdrag i regionen'}. Jag svarar gärna på frågor och bifogar mitt CV.</p>
        <p style={{ marginBottom: 0 }}>Med vänlig hälsning,<br/>Niklas Aldervall</p>
      </div>
      <div className="muted" style={{ marginTop: 12, fontSize: 12 }}>Slug: <code className="mono">pb-{job.employer.toLowerCase().replace(/[^a-z]+/g,'-')}-{job.title.split(' ')[0].toLowerCase()}-1715683200</code></div>
    </div>
  );
}

function ChatTab({ log }) {
  const [draft, setDraft] = _useS('');
  return (
    <div>
      <h4 style={{ marginBottom: 10 }}>AI Chat · context: this job</h4>
      <div className="chat">
        {log.map((m, i) => (
          <div key={i} className={'bubble ' + m.role}>{m.text}</div>
        ))}
      </div>
      <div className="chat-input">
        <input
          value={draft}
          onChange={e => setDraft(e.target.value)}
          placeholder="Ask anything about this job…"
        />
        <button className="btn primary sm" onClick={() => setDraft('')}>↵ Send</button>
      </div>
      <div className="muted" style={{ marginTop: 8, fontSize: 11, fontFamily: 'var(--font-mono)' }}>
        gpt-4o · context: job + your base CV + last 3 messages
      </div>
    </div>
  );
}

Object.assign(window, { CommandPalette, DetailDrawer });
