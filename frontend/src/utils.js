export function srcInitials(s) {
  if (s === 'AF') return 'AF';
  if (s === 'LinkedIn') return 'in';
  if (s === 'Wise') return 'WI';
  return s.slice(0, 2).toLowerCase();
}

export function daysAgo(d) {
  if (d === 0) return 'today';
  if (d === 1) return 'yesterday';
  if (d < 7) return d + 'd ago';
  if (d < 14) return Math.floor(d / 7) + 'w ago';
  return Math.floor(d / 7) + 'w ago';
}

export function iconForCmd(id) {
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

export function shortUrl(u) {
  if (!u) return '';
  try {
    const p = new URL(u);
    return p.hostname.replace('www.', '') + p.pathname.slice(0, 22) + (p.pathname.length > 22 ? '…' : '');
  } catch {
    return u.slice(0, 32);
  }
}

export function hexToTint(hex, lightness) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const bg = 247, bg_g = 244, bg_b = 237;
  if (lightness >= 0.5) {
    const blend = lightness;
    return `rgb(${Math.round(r * (1 - blend) + bg * blend)}, ${Math.round(g * (1 - blend) + bg_g * blend)}, ${Math.round(b * (1 - blend) + bg_b * blend)})`;
  } else {
    const blend = 1 - lightness * 2;
    return `rgb(${Math.round(r * (1 - blend))}, ${Math.round(g * (1 - blend))}, ${Math.round(b * (1 - blend))})`;
  }
}
