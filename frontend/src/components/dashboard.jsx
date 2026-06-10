import React from 'react';

export function Dashboard({ jobs, activities }) {
  const stats = React.useMemo(() => {
    const total = jobs.length;
    const byState = {};
    let matchSum = 0, matchCount = 0;
    let inside60 = 0, outside60 = 0, remote = 0, unknown = 0;
    let thisMonth = 0;
    const now = new Date();
    const month = now.getMonth();
    const year = now.getFullYear();

    jobs.forEach(j => {
      byState[j.state] = (byState[j.state] || 0) + 1;
      if (j.match != null) { matchSum += j.match; matchCount++; }
      if (j.distance != null && j.distance <= 60) inside60++;
      else if (j.distance != null && j.distance > 60) outside60++;
      else if (j.remote) remote++;
      else unknown++;
      if (j.submittedAt) {
        const d = new Date(j.submittedAt);
        if (d.getMonth() === month && d.getFullYear() === year) thisMonth++;
      }
    });

    const avgMatch = matchCount > 0 ? Math.round(matchSum / matchCount) : 0;

    const stateOrder = ['scraped', 'shortlist', 'tailored', 'submitted', 'replied'];
    const stateColors = { scraped: 'var(--ink-4)', shortlist: 'var(--accent)', tailored: 'var(--info)', submitted: 'var(--success)', replied: 'var(--warning)' };
    const maxState = Math.max(...stateOrder.map(s => byState[s] || 0), 1);

    return { total, byState, avgMatch, inside60, outside60, remote, unknown, thisMonth, stateOrder, stateColors, maxState };
  }, [jobs]);

  if (jobs.length === 0) {
    return (
      <div className="dashboard-empty">
        <div className="dashboard-empty-icon">⬡</div>
        <h2>No jobs yet</h2>
        <p>Your pipeline is empty. Start by importing job listings or configuring your search.</p>
        <div className="dashboard-empty-actions">
          <a className="btn primary" href="#pipeline">Go to Pipeline</a>
          <a className="btn" href="#settings">Configure preferences</a>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard">
      <div className="stat-grid">
        <StatCard label="Total jobs" value={stats.total} />
        <StatCard label="Avg match" value={`${stats.avgMatch}%`} />
        <StatCard label="This month" value={stats.thisMonth} sub="submitted" />
        <StatCard label="In range" value={stats.inside60} sub="≤60 km" />
        <StatCard label="Remote" value={stats.remote} />
        <StatCard label="Outside" value={stats.outside60} sub=">60 km" />
      </div>

      <h4 style={{ margin: '24px 0 12px' }}>Pipeline state breakdown</h4>
      <div className="state-bars">
        {stats.stateOrder.filter(s => (stats.byState[s] || 0) > 0).map(state => (
          <div className="state-bar-row" key={state}>
            <div className="state-bar-label">
              <span className="dot" style={{ background: stats.stateColors[state] }} />
              <span style={{ textTransform: 'capitalize' }}>{state}</span>
            </div>
            <div className="state-bar-track">
              <div className="state-bar-fill" style={{
                width: `${(stats.byState[state] / stats.maxState) * 100}%`,
                background: stats.stateColors[state]
              }} />
            </div>
            <span className="state-bar-count">{stats.byState[state]}</span>
          </div>
        ))}
        {stats.stateOrder.filter(s => (stats.byState[s] || 0) === 0).map(state => (
          <div className="state-bar-row muted" key={state}>
            <div className="state-bar-label">
              <span className="dot" style={{ background: stats.stateColors[state], opacity: 0.3 }} />
              <span style={{ textTransform: 'capitalize' }}>{state}</span>
            </div>
            <div className="state-bar-track" />
            <span className="state-bar-count">0</span>
          </div>
        ))}
      </div>

      <h4 style={{ margin: '24px 0 12px' }}>Distance analysis</h4>
      <div className="state-bars">
        {[
          { label: '≤60 km dagpendling', value: stats.inside60, color: 'var(--success)' },
          { label: '>60 km (requires evidence)', value: stats.outside60, color: 'var(--accent)' },
          { label: 'Remote', value: stats.remote, color: 'var(--info)' },
          { label: 'Unknown', value: stats.unknown, color: 'var(--ink-4)' },
        ].filter(d => d.value > 0).map(d => (
          <div className="state-bar-row" key={d.label}>
            <div className="state-bar-label">
              <span className="dot" style={{ background: d.color }} />
              <span>{d.label}</span>
            </div>
            <div className="state-bar-track">
              <div className="state-bar-fill" style={{
                width: `${(d.value / Math.max(stats.inside60, stats.outside60, stats.remote, stats.unknown, 1)) * 100}%`,
                background: d.color
              }} />
            </div>
            <span className="state-bar-count">{d.value}</span>
          </div>
        ))}
      </div>

      <h4 style={{ margin: '24px 0 12px' }}>Activities</h4>
      <div className="card" style={{ padding: '14px 18px', fontSize: 13 }}>
        {activities.length === 0 ? (
          <span className="muted">No activities logged yet.</span>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {activities.slice(0, 10).map((a, i) => (
              <div key={a.id || i} style={{ display: 'flex', gap: 10 }}>
                <span className="mono muted" style={{ fontSize: 11 }}>{a.createdAt?.slice(0, 10)}</span>
                <span>{a.note || a.type || 'Activity'}</span>
                {a.evidence && <span className="pill success" style={{ fontSize: 10 }}>evidence</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, sub }) {
  return (
    <div className="stat-card">
      <div className="stat-value">{value}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}
