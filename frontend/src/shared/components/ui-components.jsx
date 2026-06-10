// ToastStack Component
export function ToastStack({ toasts }) {
  return (
    <div className="toast-stack">
      {toasts.map(t => (
        <div className="toast" key={t.id}>
          <div className="head">{t.head}</div>
          <div style={{ color: 'rgba(255,255,255,0.75)' }}>{t.body}</div>
        </div>
      ))}
    </div>
  );
}

// Enhanced TopBar with Report Progress
export function EnhancedTopBar({ onPalette, counts, query, setQuery, reportProgress }) {
  return (
    <header className="topbar" data-screen-label="Top bar">
      <div className="brand">
        <div className="brand-mark" />
        <div className="brand-name">Wooking <span className="accent">for Work</span></div>
      </div>
      <div className="qmeter" title={`Aktivitetsrapport progress · ${reportProgress?.month || 'MAJ'}`}>
        <span className="mono" style={{ fontSize: 11, color: 'var(--ink-3)' }}>{reportProgress?.month || 'MAJ'}</span>
        <b>{reportProgress?.completed || 9}</b>
        <span style={{ color: 'var(--ink-3)' }}>/ {reportProgress?.total || 12}</span>
        <span className="qmeter-bar" />
        <span className="ok">{reportProgress?.status || 'on track'}</span>
      </div>
      <div className="cmdk" onClick={onPalette}>
        <span style={{ color: 'var(--ink-3)' }}>⌕</span>
        <span style={{ flex: 1 }}>Quick command, search, jump…</span>
        <span><span className="kbd">⌘</span><span className="kbd">K</span></span>
      </div>
      <div className="right">
        <span className="muted" style={{ fontSize: 12 }}>niklas@aldervall.se</span>
        <span className="avatar">NA</span>
      </div>
    </header>
  );
}

// Enhanced Sidebar with State Counts
export function EnhancedSidebar({ view, counts, states }) {
  const item = (id, glyph, label, count, badge) => (
    <div className={'side-item' + (view === id ? ' active' : '')} onClick={() => {
      if (typeof location !== 'undefined') {
        location.hash = id;
      }
    }}>
      <span className="glyph">{glyph}</span>
      <span>{label}</span>
      {count != null && <span className="count">{count}</span>}
      {badge}
    </div>
  );
  
  return (
    <aside className="sidebar" data-screen-label="Sidebar">
      <div className="side-group">
        <h4>Workspace</h4>
        {item('dashboard', '⬡', 'Dashboard')}
        {item('scraper', '⌕', 'Wook Work!')}
        {item('pipeline', '◫', 'Pipeline', counts.all)}
        {item('inbox', '☰', 'Inbox', counts.scraped + counts.shortlist)}
        {item('atlas', '◎', 'Atlas')}
        {item('report', '✎', 'Aktivitetsrapport', null, <span className="pill warning" style={{ fontSize: 10, padding: '0 6px', marginLeft: 6 }}>2d</span>)}
        {item('runs', '⟲', 'Runs')}
        {item('settings', '⚙', 'Settings')}
      </div>

      <div className="side-group">
        <h4>States</h4>
        <div className="side-item"><span className="dot" style={{ background: 'var(--ink-4)' }} /><span>Scraped</span><span className="count">{counts.scraped}</span></div>
        <div className="side-item"><span className="dot" style={{ background: 'var(--accent)' }} /><span>Shortlist</span><span className="count">{counts.shortlist}</span></div>
        <div className="side-item"><span className="dot" style={{ background: 'var(--info)' }} /><span>Tailored</span><span className="count">{counts.tailored}</span></div>
        <div className="side-item"><span className="dot" style={{ background: 'var(--success)' }} /><span>Submitted</span><span className="count">{counts.submitted}</span></div>
        <div className="side-item"><span className="dot" style={{ background: 'var(--warning)' }} /><span>Replied</span><span className="count">{counts.replied}</span></div>
      </div>

      <div className="side-group">
        <h4>Saved searches</h4>
        <div className="side-item"><span className="glyph">⌕</span><span>Remote IT-chef · SE</span></div>
        <div className="side-item"><span className="glyph">⌕</span><span>≤60km Sala · IT</span></div>
        <div className="side-item"><span className="glyph">⌕</span><span>Linux + Python</span></div>
        <div className="side-item muted-2"><span className="glyph">＋</span><span>New search</span></div>
      </div>

      <div className="side-group">
        <h4>Sources</h4>
        <div className="side-item"><span className="src-chip AF" style={{ width: 16, height: 16, fontSize: 8 }}>AF</span><span>Arbetsförmedlingen</span><span className="count">21</span></div>
        <div className="side-item"><span className="src-chip LinkedIn" style={{ width: 16, height: 16, fontSize: 8 }}>in</span><span>LinkedIn</span><span className="count">18</span></div>
        <div className="side-item"><span className="src-chip Wise" style={{ width: 16, height: 16, fontSize: 8 }}>WI</span><span>Wise.se</span><span className="count">8</span></div>
      </div>

      <div style={{ flex: 1 }} />

      <div className="side-group">
        <div className="side-item" onClick={() => {
          if (typeof location !== 'undefined') {
            location.hash = 'settings';
          }
        }}><span className="glyph">⚙</span><span>Settings</span></div>
        <div className="side-item" style={{ color: 'var(--ink-3)', fontSize: 11.5 }}><span className="glyph">⊝</span><span>Submit ON · kill switch off</span></div>
      </div>
    </aside>
  );
}

// Legacy compatibility - attach to window
if (typeof window !== 'undefined') {
  Object.assign(window, {
    EnhancedTopBar, EnhancedSidebar, ToastStack,
  });
  
  // Also export as WK_SHARED namespace
  window.WK_SHARED = {
    EnhancedTopBar, EnhancedSidebar, ToastStack,
  };
}