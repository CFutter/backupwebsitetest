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

    // show right-side X, hide left hamburger
    if (closeBtn) closeBtn.hidden = false;
    toggle.classList.add('is-hidden');

    // optional: focus first link
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

    // hide X, show hamburger
    if (closeBtn) closeBtn.hidden = true;
    toggle.classList.remove('is-hidden');

    requestAnimationFrame(() => {
      toggle.focus({ preventScroll: true });
    });
  }

  // Toggle handlers
  toggle.addEventListener('click', () => {
    drawer.dataset.open === 'true' ? closeDrawer() : openDrawer();
  });
  closeBtn?.addEventListener('click', closeDrawer);
  backdrop.addEventListener('click', closeDrawer);
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeDrawer(); });

  // Reset when breakpoint crosses to desktop
  const mq = window.matchMedia('(min-width: 901px)');
  function handleMQ(ev: MediaQueryListEvent | MediaQueryList) {
    if ('matches' in ev ? ev.matches : ev.matches) {
      // desktop: ensure closed state
      drawer.dataset.open = 'false';
      backdrop.hidden = true;
      toggle.hidden = false;
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open menu');
      if (closeBtn) closeBtn.hidden = true;
      document.documentElement.style.overflow = '';
    }
  }
  // Initial check and listener
  handleMQ(mq);
  mq.addEventListener?.('change', handleMQ as (e: MediaQueryListEvent) => void);
}

function init() {
  document.querySelectorAll('[data-component="site-sidebar"]').forEach(setupLeftDrawer);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init, { once: true });
} else {
  init();
}