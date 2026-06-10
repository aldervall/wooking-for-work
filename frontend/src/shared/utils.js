// Shared Utilities for Wooking for Work
// Compatible with both legacy and modern frontends

// Source initials for job sources
export function srcInitials(src) {
  const map = {
    AF: 'AF',
    LinkedIn: 'in',
    Wise: 'WI',
    // Add more as needed
  };
  return map[src] || src?.slice(0, 2).toUpperCase() || '??';
}

// Calculate days ago from posted date
export function daysAgo(postedDays) {
  if (!postedDays) return 'Today';
  if (postedDays === 1) return 'Yesterday';
  return `${postedDays} days ago`;
}

// Color utilities
export function hexToTint(hex, lightness) {
  // Convert hex to oklch-ish tint by blending toward paper
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  const bg = 247, bg_g = 244, bg_b = 237; // paper
  if (lightness >= 0.5) {
    // tint toward paper
    const blend = lightness;
    const nr = Math.round(r * (1 - blend) + bg * blend);
    const ng = Math.round(g * (1 - blend) + bg_g * blend);
    const nb = Math.round(b * (1 - blend) + bg_b * blend);
    return `rgb(${nr}, ${ng}, ${nb})`;
  } else {
    // shade toward black
    const blend = 1 - lightness * 2;
    const nr = Math.round(r * (1 - blend));
    const ng = Math.round(g * (1 - blend));
    const nb = Math.round(b * (1 - blend));
    return `rgb(${nr}, ${ng}, ${nb})`;
  }
}

// Command icon mapping
export function iconForCmd(cmd) {
  const icons = {
    tailor: '✎',
    'tailor-pb': '📝',
    apply: '📤',
    shortlist: '⭐',
    dismiss: '❌',
    evidence: '📋',
    next: '→',
    prev: '←',
    open: '🔗',
    'go-pipeline': '◫',
    'go-atlas': '◎',
    'go-report': '✎',
    refresh: '⟳',
    'new-search': '⌕',
  };
  return icons[cmd.id] || '⚡';
}

// Legacy compatibility - attach to window
if (typeof window !== 'undefined') {
  Object.assign(window, {
    srcInitials, daysAgo, hexToTint, iconForCmd,
  });
}