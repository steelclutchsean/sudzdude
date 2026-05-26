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
     Quote form → POST /api/quote (Resend via Vercel function)
     ============================================================ */
  const form = document.getElementById('quote-form');

  const escapeText = (s) => {
    const d = document.createElement('div');
    d.textContent = s == null ? '' : String(s);
    return d.innerHTML;
  };

  const showError = (msg) => {
    let alert = form.querySelector('.form-alert');
    if (!alert) {
      alert = document.createElement('div');
      alert.className = 'form-alert';
      alert.setAttribute('role', 'alert');
      const foot = form.querySelector('.form-foot');
      form.insertBefore(alert, foot);
    }
    alert.textContent = msg;
  };

  const showSuccess = (firstName) => {
    form.innerHTML = `
      <div class="form-success" role="status">
        <div class="form-success-icon" aria-hidden="true">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 6 9 17l-5-5"/>
          </svg>
        </div>
        <h3>Got it${firstName ? ', ' + escapeText(firstName) : ''}.</h3>
        <p>Your quote request is in. Jeff will text or email back within 24 hours.</p>
        <div class="form-success-actions">
          <a class="btn btn-primary" href="tel:+15163515961">Call (516) 351-5961</a>
          <a class="btn btn-ghost" href="sms:+15163515961">Text Instead</a>
        </div>
      </div>
    `;
  };

  if (form) {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();

      const data = new FormData(form);
      const get = (k) => String(data.get(k) || '').trim();

      const fields = {
        name: get('name'),
        phone: get('phone'),
        email: get('email'),
        vehicle: get('vehicle'),
        package: get('package'),
        town: get('town'),
        notes: get('notes'),
        website: get('website'), // honeypot
      };

      // Match server-side validation client-side too
      const required = ['name', 'phone', 'email', 'vehicle', 'package', 'town'];
      if (required.some((k) => !fields[k])) {
        const firstInvalid = form.querySelector(':invalid');
        if (firstInvalid && typeof firstInvalid.reportValidity === 'function') {
          firstInvalid.reportValidity();
        }
        return;
      }

      // Clear any prior error
      const existingAlert = form.querySelector('.form-alert');
      if (existingAlert) existingAlert.remove();

      const submitBtn = form.querySelector('button[type="submit"]');
      const originalLabel = submitBtn ? submitBtn.textContent : '';
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = 'Sending…';
      }

      try {
        const r = await fetch('/api/quote', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fields),
        });

        if (r.ok) {
          const firstName = (fields.name.split(' ')[0] || '').trim();
          showSuccess(firstName);
          return;
        }

        const payload = await r.json().catch(() => ({}));
        showError(payload.error || 'Something went wrong. Please call or text (516) 351-5961.');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalLabel;
        }
      } catch (err) {
        console.error('Quote submit failed', err);
        showError('Network error. Please call or text (516) 351-5961.');
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalLabel;
        }
      }
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
