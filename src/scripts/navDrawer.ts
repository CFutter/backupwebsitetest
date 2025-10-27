// src/scripts/navDrawer.ts

function setupLeftDrawer(root: Element) {
  const toggle = root.querySelector<HTMLButtonElement>('.site-menu-toggle');
  const drawer = root.querySelector<HTMLElement>('#site-drawer');
  const backdrop = root.querySelector<HTMLElement>('.site-backdrop');
  const closeBtn = root.querySelector<HTMLButtonElement>('.site-menu-close');

  if (!toggle || !drawer || !backdrop) {
    console.warn('[navDrawer] Missing elements', { toggle, drawer, backdrop });
    return;
  }
  if (closeBtn) closeBtn.hidden = true;

  function openDrawer() {
    drawer.dataset.open = 'true';
    backdrop.hidden = false;
    toggle.setAttribute('aria-expanded', 'true');
    toggle.setAttribute('aria-label', 'Close menu');
    document.documentElement.style.overflow = 'hidden';

    if (closeBtn) closeBtn.hidden = false;
    toggle.classList.add('is-hidden');

    requestAnimationFrame(() => {
      drawer.querySelector<HTMLAnchorElement>('a')?.focus({ preventScroll: true });
    });
  }

  function closeDrawer() {
    drawer.dataset.open = 'false';
    backdrop.hidden = true;
    toggle.setAttribute('aria-expanded', 'false');
    toggle.setAttribute('aria-label', 'Open menu');
    document.documentElement.style.overflow = '';

    if (closeBtn) closeBtn.hidden = true;
    toggle.classList.remove('is-hidden');

    requestAnimationFrame(() => {
      toggle.focus({ preventScroll: true });
    });
  }

  toggle.addEventListener('click', () => {
    drawer.dataset.open === 'true' ? closeDrawer() : openDrawer();
  });
  closeBtn?.addEventListener('click', closeDrawer);
  backdrop.addEventListener('click', closeDrawer);
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer(); });

  const mq = window.matchMedia('(min-width: 901px)');
  function handleMQ(ev: MediaQueryListEvent | MediaQueryList) {
    if ('matches' in ev ? ev.matches : ev.matches) {
      drawer.dataset.open = 'false';
      backdrop.hidden = true;
      toggle.hidden = false;
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open menu');
      if (closeBtn) closeBtn.hidden = true;
      document.documentElement.style.overflow = '';
    }
  }
  handleMQ(mq);
  mq.addEventListener?.('change', handleMQ as (e: MediaQueryListEvent) => void);
}


// Sub-sidebar logic
function setupSubSidebar() {
  const subSidebar = document.querySelector<HTMLElement>('.sub-sidebar');
  const linksContainer = document.querySelector<HTMLUListElement>('#sub-sidebar-links');
  const mainLinks = document.querySelectorAll<HTMLAnchorElement>('.site-nav a');
  const mainSidebar = document.querySelector<HTMLElement>('#site-drawer');

  const PIN_KEY = 'subSidebarPinned';
  const mqDesktop = window.matchMedia('(min-width: 901px)');
  const isDesktop = () => mqDesktop.matches;

  const pinBtn = subSidebar.querySelector<HTMLButtonElement>('.sub-pin');
  
  let isPinned = (localStorage.getItem(PIN_KEY) === '1');
  if (pinBtn) {
    pinBtn.setAttribute('aria-pressed', isPinned ? 'true' : 'false');
  }
  if (isPinned && isDesktop()) {
    document.documentElement.classList.add('sub-pinned');
  }

  // Early exit if elements are not found
  if (!subSidebar || !linksContainer || !mainLinks.length) {
    return;
  }

  let hoverTimeout: number | null = null;
  let isSubSidebarOpen = false;
  const STORAGE_KEY = 'openSubSidebarKey';

  
  // --- Rehydrate immediately (prevents flicker) — ADD THIS BLOCK ---

  const savedKey = sessionStorage.getItem(STORAGE_KEY);

  if (isDesktop()) {
    if (isPinned) {
      // If pinned, keep it open even if not hovering
      if (savedKey && populateSubSidebar(savedKey)) {
        subSidebar.classList.add('open');
        isSubSidebarOpen = true;
      } else {
        // If there's no saved submenu, keep panel open but empty (or you can choose to close)
        subSidebar.classList.add('open');
        isSubSidebarOpen = true;
      }
    } else if (savedKey && populateSubSidebar(savedKey)) {
      subSidebar.classList.add('open');
      isSubSidebarOpen = true;
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
    }
  }
  
  // Runtime takes over from bootstrap class
  document.documentElement.classList.remove('sub-open');
  

  // --- Helper Functions ---

  function openSidebar() {
    subSidebar.classList.add('open');
    isSubSidebarOpen = true;
  }

  function closeSidebar() {
    subSidebar.classList.remove('open');
    // Do not clear innerHTML immediately to avoid visual flashing if reopened quickly
    isSubSidebarOpen = false;
    // Clear persistence when specifically closing due to hover-away
    sessionStorage.removeItem(STORAGE_KEY);
  }

  function populateSubSidebar(key: string): boolean {
    const itemsMap = (window as any).__SUBPAGE_ITEMS__ as
      | Record<string, { href: string; label?: string; icon?: string }[]>
      | undefined;
  
    const subpagesData = (window as any).__SUBPAGES__ as Record<string, string[]> | undefined;
    const subItems = itemsMap?.[key];
  
    // If we have items with labels, use them; otherwise fall back to href array
    const items: { href: string; label: string }[] = subItems
      ? subItems.map(it => ({ href: it.href, label: it.label ?? it.href.split('/').pop() ?? 'Overview' }))
      : (subpagesData?.[key] ?? []).map(href => {
          const last = decodeURIComponent(href.split('/').filter(Boolean).pop() || 'Overview');
          const label = last.includes('-')
            ? last.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ')
            : last;
          return { href, label };
        });
  
    if (!items.length) return false;
  
    const normalize = (p: string) => (p.replace(/\/+$/, '') || '/');
    const normalizedCurrent = normalize(window.location.pathname);
  
    linksContainer.textContent = '';
    for (const { href, label } of items) {
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = href;
      a.className = 'sub-link';
  
      // Active state
      const isCurrent = normalize(href) === normalizedCurrent;
      if (isCurrent) {
        a.classList.add('active');
        a.setAttribute('aria-current', 'page');
      }
  
      // Optional icon (kept as-is if you wired SUB_ICONS)
      const iconMap: Record<string, string> | undefined = (window as any).__SUB_ICONS__;
      if (iconMap) {
        const lastSeg = href.split('/').filter(Boolean).pop() || '';
        const keyKebab = decodeURIComponent(lastSeg).toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        const svg = iconMap[keyKebab] || iconMap[lastSeg.toLowerCase().replace(/[\s-]/g, '')]; // fallback to “compressed”
        if (svg) {
          const i = document.createElement('span');
          i.className = 'sub-icon';
          i.setAttribute('aria-hidden', 'true');
          i.innerHTML = svg;
          a.appendChild(i);
        }
      }
  
      // Text
      const t = document.createElement('span');
      t.className = 'sub-text';
      t.textContent = label;
      a.appendChild(t);
  
      li.appendChild(a);
      linksContainer.appendChild(li);
    }
  
    return true;
  }


  function clearHoverTimeout() {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      hoverTimeout = null;
    }
  }

  function scheduleClose() {
    if (isPinned) return; // when pinned, never auto-close
    clearHoverTimeout();
    hoverTimeout = window.setTimeout(() => closeSidebar(), 150);
  }

  // --- Event Handlers ---

  mainLinks.forEach(link => {
    link.addEventListener('mouseenter', () => {
      if (!isDesktop()) return;
      clearHoverTimeout();
      
      const key = link.dataset.subpages;
      // If hovering a link with NO subpages, we should probably close the existing one
      if (!key) {
        if (!isPinned && isSubSidebarOpen) scheduleClose();
        return;
      }

      // Try to populate. If successful, open and persist state.
      if (populateSubSidebar(key)) {
        openSidebar();
        sessionStorage.setItem(STORAGE_KEY, key);
      } else {
        // Hovered a link that has a key but empty data
        if (!isPinned && isSubSidebarOpen) scheduleClose();
      }
    });
  });

  subSidebar.addEventListener('mouseenter', clearHoverTimeout);

    
  pinBtn?.addEventListener('click', () => {
    isPinned = !isPinned;
    localStorage.setItem(PIN_KEY, isPinned ? '1' : '0');
    pinBtn.setAttribute('aria-pressed', isPinned ? 'true' : 'false');

    if (isPinned) {
      document.documentElement.classList.add('sub-pinned');
      // Ensure open
      subSidebar.classList.add('open');
      isSubSidebarOpen = true;

      // If no key is saved but we’re hovering a main link, try to capture it
      const currentKey = sessionStorage.getItem(STORAGE_KEY);
      if (!currentKey) {
        // noop; panel can remain empty until hover/click selects a category
      }
    } else {
      document.documentElement.classList.remove('sub-pinned');
      // If pointer is not over either sidebar now, allow it to close
      // (the existing mouseover bridge will handle it shortly)
      scheduleClose();
    }
  });
  
  mqDesktop.addEventListener?.('change', (ev) => {
    if (!ev.matches) {
      // Entered mobile
      subSidebar.classList.remove('open');
      isSubSidebarOpen = false;
      document.documentElement.classList.remove('sub-open');
      document.documentElement.classList.remove('sub-pinned');
      // Keep PIN_KEY and STORAGE_KEY so desktop restores state
    } else {
      // Back to desktop: restore classes
      if (localStorage.getItem(PIN_KEY) === '1') {
        document.documentElement.classList.add('sub-pinned');
        subSidebar.classList.add('open');
        isSubSidebarOpen = true;
  
        const k = sessionStorage.getItem(STORAGE_KEY);
        if (k) populateSubSidebar(k);
      }
    }
  });

  // When clicking ANY link in the sub-sidebar or main sidebar, 
  // we want to ENSURE it stays open during the navigation start.
  // The sessionStorage handles the *next* page load, but this prevents 
  // `scheduleClose` from firing if the mouse jitters during click.
  const allSidebarLinks = [...mainLinks, ...subSidebar.querySelectorAll('a')];
  allSidebarLinks.forEach(link => {
      link.addEventListener('click', () => {
          clearHoverTimeout();
          // If we clicked a main link that HAS subpages, ensure it's saved as active
          const key = (link as HTMLElement).dataset.subpages;
          if (key) {
             sessionStorage.setItem(STORAGE_KEY, key);
          }
      });
  })

  document.addEventListener('mouseover', (e) => {
    if (!isDesktop() || !isSubSidebarOpen || isPinned) return;
  
    const target = e.target as Element;
  
    // Only count as "main nav hover" if over a real link (icon or its text),
    // not just any empty part of the sidebar rail.
    const mainLink = target.closest?.('.site-nav a');
    const isOverMainLink = !!mainLink;
    const isOverSubSidebar = subSidebar.contains(target);
  
    if (!isOverMainLink && !isOverSubSidebar) {
      scheduleClose();
    } else {
      clearHoverTimeout();
    }
  });
}

// --- Initialization ---

function init() {
  document.querySelectorAll('[data-component="site-sidebar"]').forEach(setupLeftDrawer);

  if (document.querySelector('.sub-sidebar')) {
    setupSubSidebar();
  }
}

// Support for standard load AND Astro View Transitions (astro:page-load)
// This ensures it re-runs correctly if you use Astro's <ViewTransitions />
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

document.addEventListener('astro:page-load', () => {
    // This event fires once on initial load, and again after every view transition.
    // We check if init has already run to avoid double-binding on the very first load 
    // if DOMContentLoaded fired first.
    if ((window as any)._sidebarInitialized) return;
    init();
});