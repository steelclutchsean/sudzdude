(() => {
  'use strict';

  /* ============================================================
     Year stamp
     ============================================================ */
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ============================================================
     Mobile nav drawer
     ============================================================ */
  const toggle = document.getElementById('nav-toggle');
  const closeBtn = document.getElementById('nav-close');
  const menu = document.getElementById('mobile-menu');

  const openMenu = () => {
    menu.classList.add('open');
    menu.setAttribute('aria-hidden', 'false');
    toggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  };
  const closeMenu = () => {
    menu.classList.remove('open');
    menu.setAttribute('aria-hidden', 'true');
    toggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  };

  if (toggle) toggle.addEventListener('click', openMenu);
  if (closeBtn) closeBtn.addEventListener('click', closeMenu);
  document.querySelectorAll('[data-close-menu]').forEach(el => {
    el.addEventListener('click', closeMenu);
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && menu.classList.contains('open')) closeMenu();
  });

  /* ============================================================
     Header background on scroll
     ============================================================ */
  const header = document.getElementById('site-header');
  const onScroll = () => {
    if (!header) return;
    header.classList.toggle('scrolled', window.scrollY > 40);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ============================================================
     Package card → preselect dropdown in form
     ============================================================ */
  document.querySelectorAll('[data-package]').forEach(link => {
    link.addEventListener('click', () => {
      const pkg = link.getAttribute('data-package');
      const select = document.getElementById('qf-package');
      if (select && pkg) select.value = pkg;
    });
  });

  /* ============================================================
     Quote form → mailto
     ============================================================ */
  const form = document.getElementById('quote-form');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();

      const data = new FormData(form);
      const get = key => String(data.get(key) || '').trim();

      const name = get('name');
      const phone = get('phone');
      const email = get('email');
      const vehicle = get('vehicle');
      const pkg = get('package');
      const town = get('town');
      const notes = get('notes');

      // Light client-side check (matches `required` attrs).
      if (!name || !phone || !email || !vehicle || !pkg || !town) {
        const firstInvalid = form.querySelector(':invalid');
        if (firstInvalid && typeof firstInvalid.reportValidity === 'function') {
          firstInvalid.reportValidity();
        }
        return;
      }

      const subject = `Quote request — ${pkg} — ${name}`;
      const bodyLines = [
        `Hi Jeff,`,
        ``,
        `I'd like a quote for the ${pkg} package.`,
        ``,
        `Name: ${name}`,
        `Phone: ${phone}`,
        `Email: ${email}`,
        `Vehicle: ${vehicle}`,
        `Town: ${town}`,
        ``,
        notes ? `Notes:` : '',
        notes,
        ``,
        `— Sent from sudzdude.com`,
      ].filter(line => line !== '');

      const body = bodyLines.join('\n');
      const mailto = `mailto:detail@sudzdude.com?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      window.location.href = mailto;
    });
  }

  /* ============================================================
     Reveal on scroll (IntersectionObserver)
     ============================================================ */
  const reveals = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && reveals.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in-view');
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -10% 0px', threshold: 0.05 });
    reveals.forEach(el => io.observe(el));
  } else {
    reveals.forEach(el => el.classList.add('in-view'));
  }
})();
