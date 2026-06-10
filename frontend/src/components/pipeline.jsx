import React from 'react';
import { srcInitials, daysAgo } from '../utils';

const STATE_COLORS = {
  scraped: 'var(--ink-4)', shortlist: 'var(--accent)', tailored: 'var(--info)',
  submitted: 'var(--success)', replied: 'var(--warning)',
};

export function Pipeline({ jobs, states, onOpen, onMove, query }) {
  const [dragId, setDragId] = React.useState(null);
  const [dropCol, setDropCol] = React.useState(null);

  const filtered = React.useMemo(() => {
    if (!query) return jobs;
    const q = query.toLowerCase();
    return jobs.filter(j =>
      j.title.toLowerCase().includes(q) ||
      j.employer.toLowerCase().includes(q) ||
      (j.skills || []).some(s => s.toLowerCase().includes(q))
    );
  }, [jobs, query]);

  const byState = React.useMemo(() => {
    const m = {};
    states.forEach(s => m[s.id] = []);
    filtered.forEach(j => { if (m[j.state]) m[j.state].push(j); });
    Object.values(m).forEach(arr => arr.sort((a, b) => b.match - a.match));
    return m;
  }, [filtered, states]);

  return (
    <div className="pipeline">
      {states.map(s => (
        <KanbanColumn
          key={s.id} state={s} jobs={byState[s.id] || []} onOpen={onOpen}
          onDragStart={(e, id) => { setDragId(id); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', id); }}
          onDragOver={(e) => { e.preventDefault(); setDropCol(s.id); }}
          onDrop={(e) => { e.preventDefault(); if (dragId) onMove(dragId, s.id); setDragId(null); setDropCol(null); }}
          isDropTarget={dropCol === s.id} dragId={dragId}
          onDragEnd={() => { setDragId(null); setDropCol(null); }}
        />
      ))}
    </div>
  );
}

function KanbanColumn({ state, jobs, onOpen, onDragStart, onDragOver, onDrop, isDropTarget, dragId, onDragEnd }) {
  return (
    <div className="kcol">
      <div className="kcol-head">
        <span className="dot" style={{ background: STATE_COLORS[state.id] }} />
        <h3>{state.label}</h3>
        <span className="count tnum">{jobs.length}</span>
        <span className="add" title="Add job here">＋</span>
      </div>
      <div className={'kcol-body' + (isDropTarget ? ' drop-target' : '')} onDragOver={onDragOver} onDrop={onDrop}>
        {jobs.map(j => (
          <JobCard
            key={j.id} job={j} onClick={() => onOpen(j.id)}
            draggable onDragStart={(e) => onDragStart(e, j.id)} onDragEnd={onDragEnd}
            isDragging={dragId === j.id}
          />
        ))}
        {jobs.length === 0 && (
          <div style={{ padding: '14px 10px', textAlign: 'center', fontSize: 12, color: 'var(--ink-4)',
            fontStyle: 'italic', border: '1px dashed var(--border)', borderRadius: 'var(--radius)' }}>
            {state.hint}
          </div>
        )}
      </div>
    </div>
  );
}

export function JobCard({ job, onClick, draggable, onDragStart, onDragEnd, isDragging }) {
  const matchClass = job.match >= 80 ? 's-hi' : job.match >= 65 ? 's-med' : 's-lo';
  const outOfRange = job.distance && job.distance > 60;
  return (
    <div className={'kcard' + (isDragging ? ' dragging' : '') + (outOfRange && job.state === 'submitted' ? ' highlight' : '')}
      onClick={onClick} draggable={draggable} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="top">
        <span className={'src-chip ' + job.src}>{srcInitials(job.src)}</span>
        <span className="role" style={{ flex: 1 }}>{job.title}</span>
        <span className={'match sm ' + matchClass} style={{ '--p': job.match }}><span>{job.match}</span></span>
      </div>
      <div className="co">{job.employer}</div>
      <div className="meta">
        <span>{job.location}</span>
        {job.distance != null && (
          <span style={{ color: outOfRange ? 'var(--danger)' : job.distance <= 60 ? 'var(--success)' : 'var(--warning)' }}>
            · {job.distance} km
          </span>
        )}
        <span className="spacer" />
        <span>{daysAgo(job.postedDays)}</span>
      </div>
    </div>
  );
}

export function InboxView({ jobs, onOpen, query }) {
  const filtered = React.useMemo(() => {
    const sorted = [...jobs].sort((a, b) => b.match - a.match);
    if (!query) return sorted;
    const q = query.toLowerCase();
    return sorted.filter(j => j.title.toLowerCase().includes(q) || j.employer.toLowerCase().includes(q));
  }, [jobs, query]);

  return (
    <div className="inbox">
      <div className="inbox-head">
        <div></div><div>Src</div><div>Title · Employer</div><div>Location</div><div>Match</div><div>State</div><div>Posted</div>
      </div>
      <div style={{ overflow: 'auto', flex: 1 }}>
        {filtered.map(j => {
          const matchClass = j.match >= 80 ? 's-hi' : j.match >= 65 ? 's-med' : 's-lo';
          return (
            <div className="inbox-row" key={j.id} onClick={() => onOpen(j.id)}>
              <input type="checkbox" onClick={e => e.stopPropagation()} style={{ margin: 0 }} />
              <span className={'src-chip ' + j.src}>{srcInitials(j.src)}</span>
              <div>
                <div className="col-title">{j.title}</div>
                <div className="col-meta">{j.employer} · ref {j.ref}</div>
              </div>
              <div className="col-loc">{j.location}</div>
              <div>
                <span className={'match sm ' + matchClass} style={{ '--p': j.match }}><span>{j.match}</span></span>
              </div>
              <div>
                {j.state === 'scraped' && <span className="pill muted"><span className="dot" style={{ background: 'var(--ink-4)' }} />new</span>}
                {j.state === 'shortlist' && <span className="pill accent">★ shortlist</span>}
                {j.state === 'tailored' && <span className="pill info">⚡ tailored</span>}
                {j.state === 'submitted' && <span className="pill success">↗ submitted</span>}
                {j.state === 'replied' && <span className="pill warning">💬 replied</span>}
              </div>
              <div className="col-meta">{daysAgo(j.postedDays)}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
