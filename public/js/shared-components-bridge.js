// Shared component library bridge for legacy frontend
// This script loads shared components from the modern frontend and makes them available to legacy code

// Wait for the modern frontend to load and expose shared components
function loadSharedComponents() {
  const checkInterval = setInterval(() => {
    if (window.WK_SHARED) {
      clearInterval(checkInterval);
      console.log('✅ Shared component library loaded');
    }
  }, 100);

  // Fallback: if modern frontend doesn't load, provide basic implementations
  setTimeout(() => {
    if (!window.WK_SHARED) {
      console.log('⚠️ Modern frontend not available, using fallback components');
      window.WK_SHARED = {
        EnhancedTopBar: function TopBarFallback({ onPalette, counts, query, setQuery, reportProgress }) {
          return React.createElement('header', { className: 'topbar' },
            React.createElement('div', { className: 'brand' },
              React.createElement('div', { className: 'brand-mark' }),
              React.createElement('div', { className: 'brand-name' }, 'Wooking <span class="accent">for Work</span>')
            ),
            React.createElement('div', { className: 'qmeter', title: 'Aktivitetsrapport progress' },
              React.createElement('span', { className: 'mono' }, reportProgress?.month || 'MAJ'),
              React.createElement('b', {}, reportProgress?.completed || 9),
              React.createElement('span', {}, `/${reportProgress?.total || 12}`),
              React.createElement('span', { className: 'qmeter-bar' }),
              React.createElement('span', { className: 'ok' }, reportProgress?.status || 'on track')
            ),
            React.createElement('div', { className: 'cmdk', onClick: onPalette },
              React.createElement('span', { style: { color: 'var(--ink-3)' } }, '⌕'),
              React.createElement('span', { style: { flex: 1 } }, 'Quick command, search, jump…'),
              React.createElement('span', {}, React.createElement('span', { className: 'kbd' }, '⌘'), React.createElement('span', { className: 'kbd' }, 'K'))
            )
          );
        },
        EnhancedSidebar: function SidebarFallback({ view, counts, states }) {
          const item = (id, glyph, label, count) => React.createElement('div', {
            className: 'side-item' + (view === id ? ' active' : ''),
            onClick: () => location.hash = id
          }, React.createElement('span', { className: 'glyph' }, glyph), React.createElement('span', {}, label), count && React.createElement('span', { className: 'count' }, count));

          return React.createElement('aside', { className: 'sidebar' },
            React.createElement('div', { className: 'side-group' },
              React.createElement('h4', {}, 'Workspace'),
              item('pipeline', '◫', 'Pipeline', counts.all),
              item('inbox', '☰', 'Inbox', counts.scraped + counts.shortlist),
              item('atlas', '◎', 'Atlas'),
              item('report', '✎', 'Aktivitetsrapport'),
              item('runs', '⟲', 'Runs'),
              item('settings', '⚙', 'Settings')
            ),
            React.createElement('div', { className: 'side-group' },
              React.createElement('h4', {}, 'States'),
              React.createElement('div', { className: 'side-item' }, 
                React.createElement('span', { className: 'dot', style: { background: 'var(--ink-4)' } }),
                React.createElement('span', {}, 'Scraped'),
                React.createElement('span', { className: 'count' }, counts.scraped)
              ),
              React.createElement('div', { className: 'side-item' }, 
                React.createElement('span', { className: 'dot', style: { background: 'var(--accent)' } }),
                React.createElement('span', {}, 'Shortlist'),
                React.createElement('span', { className: 'count' }, counts.shortlist)
              ),
              React.createElement('div', { className: 'side-item' }, 
                React.createElement('span', { className: 'dot', style: { background: 'var(--info)' } }),
                React.createElement('span', {}, 'Tailored'),
                React.createElement('span', { className: 'count' }, counts.tailored)
              ),
              React.createElement('div', { className: 'side-item' }, 
                React.createElement('span', { className: 'dot', style: { background: 'var(--success)' } }),
                React.createElement('span', {}, 'Submitted'),
                React.createElement('span', { className: 'count' }, counts.submitted)
              ),
              React.createElement('div', { className: 'side-item' }, 
                React.createElement('span', { className: 'dot', style: { background: 'var(--warning)' } }),
                React.createElement('span', {}, 'Replied'),
                React.createElement('span', { className: 'count' }, counts.replied)
              )
            )
          );
        },
        ToastStack: function ToastStackFallback({ toasts }) {
          return React.createElement('div', { className: 'toast-stack' },
            toasts.map(t => React.createElement('div', { className: 'toast', key: t.id },
              React.createElement('div', { className: 'head' }, t.head),
              React.createElement('div', { style: { color: 'rgba(255,255,255,0.75)' } }, t.body)
            ))
          );
        }
      };
    }
  }, 2000);
}

// Load shared components when the script is loaded
loadSharedComponents();