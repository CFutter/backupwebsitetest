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

  // Early exit if elements are not found
  if (!subSidebar || !linksContainer || !mainLinks.length) {
    return;
  }

  let hoverTimeout: number | null = null;
  let isSubSidebarOpen = false;
  const STORAGE_KEY = 'openSubSidebarKey';

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
    const subpagesData = (window as any).__SUBPAGES__;
    const subpagesForCategory = subpagesData ? subpagesData[key] : [];

    if (!subpagesForCategory || subpagesForCategory.length === 0) {
      return false;
    }

    const currentPathname = window.location.pathname;
    // Normalize paths to ensure matching works even with trailing slashes
    const normalize = (p: string) => p.replace(/\/+$/, "") || '/';
    const normalizedCurrent = normalize(currentPathname);

    linksContainer.innerHTML = subpagesForCategory.map((href: string) => {
       // Simple name extraction - adjust if your URLs are complex
      const name = href.split('/').filter(Boolean).pop() || 'Overview';
      // Check if this link is the current active page
      const isCurrent = normalize(href) === normalizedCurrent;
      
      return `<li><a href="${href}" ${isCurrent ? 'aria-current="page" class="sub-link active"' : 'class="sub-link"'} >${name}</a></li>`;
    }).join('');

    return true;
  }

  function clearHoverTimeout() {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout);
      hoverTimeout = null;
    }
  }

  function scheduleClose() {
    clearHoverTimeout();
    hoverTimeout = window.setTimeout(() => {
      closeSidebar();
    }, 150); // Slightly increased timing for smoother bridge between gaps
  }

  // --- Event Handlers ---

  mainLinks.forEach(link => {
    link.addEventListener('mouseenter', () => {
      clearHoverTimeout();
      
      const key = link.dataset.subpages;
      // If hovering a link with NO subpages, we should probably close the existing one
      if (!key) {
        if (isSubSidebarOpen) scheduleClose();
        return;
      }

      // Try to populate. If successful, open and persist state.
      if (populateSubSidebar(key)) {
        openSidebar();
        sessionStorage.setItem(STORAGE_KEY, key);
      } else {
        // Hovered a link that has a key but empty data
        if (isSubSidebarOpen) scheduleClose();
      }
    });
  });

  subSidebar.addEventListener('mouseenter', clearHoverTimeout);

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
    if (!isSubSidebarOpen) return;

    const target = e.target as Element;
    const isOverMainSidebar = mainSidebar?.contains(target);
    const isOverSubSidebar = subSidebar.contains(target);
    
    if (!isOverMainSidebar && !isOverSubSidebar) {
      scheduleClose();
    } else {
      // We are over one of the sidebars, keep it open
      clearHoverTimeout();
    }
  });

  // --- Initialization: Restore State ---
  // This runs immediately when the JS loads on the new page
  const savedKey = sessionStorage.getItem(STORAGE_KEY);
  if (savedKey) {
      // Verify the key still valid for this page/data
      if (populateSubSidebar(savedKey)) {
          openSidebar();
          // Optimization: If your CSS supports it, you might want to 
          // add a 'no-transition' class here temporarily to prevent 
          // it from "sliding in" on every page load.
      } else {
          sessionStorage.removeItem(STORAGE_KEY);
      }
  }
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