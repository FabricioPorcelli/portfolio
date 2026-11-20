document.addEventListener('DOMContentLoaded', () => {
  const menuToggle = document.getElementById('menu-toggle');
  const navLinks = document.getElementById('nav-links');
  const allLinks = document.querySelectorAll('.nav-link');
  const sections = document.querySelectorAll('section[id]');
  const form = document.getElementById('contact-form');
  const langToggle = document.getElementById('lang-toggle');
  const archiveToggle = document.getElementById('archive-toggle');
  const archiveCollapse = document.getElementById('archive-collapse');

  let translations = {};
  let currentLang = localStorage.getItem('lang') === 'es' ? 'es' : 'en';

  async function loadTranslations() {
    try {
      const res = await fetch('data/translations.json');
      translations = await res.json();
      applyTranslations(currentLang);
    } catch (err) {
      console.error('Error loading translations:', err);
    }
  }

  function applyTranslations(lang) {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      if (translations[key] && translations[key][lang]) {
        el.innerHTML = translations[key][lang];
      }
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      if (translations[key] && translations[key][lang]) {
        el.placeholder = translations[key][lang];
      }
    });
    document.querySelectorAll('[data-i18n-aria-label]').forEach(el => {
      const key = el.getAttribute('data-i18n-aria-label');
      if (translations[key] && translations[key][lang]) {
        el.setAttribute('aria-label', translations[key][lang]);
      }
    });
    const cvLink = document.getElementById('cv-link');
    if (cvLink) {
      cvLink.href = lang === 'es'
        ? 'https://drive.google.com/file/d/1f8SRUOa5fnHLrU_u4GSBYYYCQ_5SyfLI/view?usp=sharing'
        : 'https://drive.google.com/file/d/1CHxCLq-ZYE1xVv3JFR_Th_CoHBLo0Dvc/view?usp=sharing';
    }
    if (langToggle) {
      langToggle.textContent = lang === 'es' ? 'ES' : 'EN';
    }
  }

  function reloadPortfolioData() {
    loadPortfolioData(currentLang);
  }

  if (langToggle) {
    langToggle.addEventListener('click', async () => {
      if (document.body.classList.contains('lang-switching')) return;
      currentLang = currentLang === 'en' ? 'es' : 'en';
      localStorage.setItem('lang', currentLang);
      document.body.classList.add('lang-switching');
      langToggle.classList.add('pulse');
      setTimeout(() => langToggle.classList.remove('pulse'), 450);
      await new Promise(resolve => setTimeout(resolve, 180));
      applyTranslations(currentLang);
      await loadPortfolioData(currentLang);
      revealInViewportInstant();
      document.body.classList.remove('lang-switching');
    });
  }

  if (archiveToggle && archiveCollapse) {
    archiveCollapse.addEventListener('transitionend', (e) => {
      if (e.target === archiveCollapse && e.propertyName === 'grid-template-rows' && archiveCollapse.classList.contains('open')) {
        archiveCollapse.classList.add('expanded');
      }
    });

    archiveToggle.addEventListener('click', () => {
      const open = !archiveCollapse.classList.contains('open');
      if (open) {
        archiveCollapse.classList.add('open');
      } else {
        archiveCollapse.classList.remove('expanded');
        archiveCollapse.classList.remove('open');
      }
      archiveToggle.classList.toggle('open', open);
      archiveToggle.setAttribute('aria-expanded', String(open));
    });
  }

  let menuCloseTimer = null;

  function closeMenu() {
    if (!navLinks.classList.contains('open')) return;
    navLinks.classList.remove('open');
    navLinks.classList.add('closing');
    clearTimeout(menuCloseTimer);
    menuCloseTimer = setTimeout(() => {
      navLinks.classList.remove('closing');
      menuToggle.classList.remove('active');
    }, 180);
  }

  function openMenu() {
    clearTimeout(menuCloseTimer);
    navLinks.classList.remove('closing');
    navLinks.classList.add('open');
    menuToggle.classList.add('active');
  }

  menuToggle.addEventListener('click', () => {
    if (navLinks.classList.contains('open')) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  allLinks.forEach(link => {
    link.addEventListener('click', () => {
      closeMenu();
    });
  });

  function updateActiveLink() {
    let scrollY = window.scrollY + 150;
    sections.forEach(section => {
      const top = section.offsetTop;
      const height = section.offsetHeight;
      const id = section.getAttribute('id');
      if (scrollY >= top && scrollY < top + height) {
        allLinks.forEach(link => {
          link.classList.remove('active');
          if (link.getAttribute('data-section') === id) {
            link.classList.add('active');
          }
        });
      }
    });
  }

  window.addEventListener('scroll', updateActiveLink);

  if (form) {
    form.addEventListener('submit', async function (e) {
      e.preventDefault();

      const name = document.getElementById('name').value.trim();
      const email = document.getElementById('email').value.trim();
      const message = document.getElementById('message').value.trim();
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
      const status = document.getElementById('form-status');
      const submitBtn = form.querySelector('button[type="submit"]');

      const msgs = {
        en: {
          name: 'Please enter your name.',
          email: 'Please enter a valid email.',
          message: 'Please write a message.',
          sending: 'Sending...',
          success: "Message sent! I'll get back to you soon.",
          error: 'Something went wrong. Please try again or email me directly.',
          notConfigured: 'The form is not configured yet.'
        },
        es: {
          name: 'Por favor, ingresá tu nombre.',
          email: 'Por favor, ingresá un email válido.',
          message: 'Por favor, escribí un mensaje.',
          sending: 'Enviando...',
          success: '¡Mensaje enviado! Te respondo pronto.',
          error: 'Algo salió mal. Probá de nuevo o escribime por email.',
          notConfigured: 'El formulario todavía no está configurado.'
        }
      };
      const t = msgs[currentLang] || msgs.en;

      const setStatus = (text, type) => {
        if (!status) return;
        status.textContent = text;
        status.className = `form-status${type ? ' ' + type : ''}`;
      };

      if (!name) { setStatus(t.name, 'error'); return; }
      if (!email || !emailRegex.test(email)) { setStatus(t.email, 'error'); return; }
      if (!message) { setStatus(t.message, 'error'); return; }

      // Honeypot: los bots completan este campo, las personas no.
      if (form.botcheck && form.botcheck.checked) return;

      const action = form.getAttribute('action') || '';
      if (!action || action.includes('TU_WORKER')) {
        setStatus(t.notConfigured, 'error');
        return;
      }

      setStatus(t.sending);
      if (submitBtn) submitBtn.disabled = true;

      try {
        const res = await fetch(form.action, {
          method: 'POST',
          body: new FormData(form),
          headers: { Accept: 'application/json' }
        });
        const data = await res.json().catch(() => ({}));

        if (res.ok && data.success) {
          form.reset();
          setStatus(t.success, 'success');
        } else {
          setStatus(t.error, 'error');
        }
      } catch (err) {
        setStatus(t.error, 'error');
      } finally {
        if (submitBtn) submitBtn.disabled = false;
      }
    });
  }

  const copyEmailBtn = document.getElementById('copy-email');
  const copyFeedback = document.getElementById('copy-feedback');
  const emailAddress = 'fabricioporcelli@gmail.com';

  function legacyCopy(text) {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '-1000px';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    if (!ok) throw new Error('Copy command failed');
  }

  if (copyEmailBtn && copyFeedback) {
    let copyFeedbackTimer = null;
    let copyIconTimer = null;

    copyEmailBtn.addEventListener('click', async () => {
      let copied = false;

      try {
        if (navigator.clipboard && window.isSecureContext) {
          await navigator.clipboard.writeText(emailAddress);
        } else {
          legacyCopy(emailAddress);
        }
        copied = true;
      } catch (err) {
        try {
          legacyCopy(emailAddress);
          copied = true;
        } catch (fallbackErr) {
          copied = false;
        }
      }

      const messageKey = copied ? 'contact.copied' : 'contact.copyError';
      copyFeedback.textContent = (translations[messageKey] && translations[messageKey][currentLang])
        || (copied ? 'Copied' : 'Could not copy');

      clearTimeout(copyFeedbackTimer);
      clearTimeout(copyIconTimer);
      copyEmailBtn.classList.toggle('copied', copied);
      copyFeedback.classList.add('visible');

      copyFeedbackTimer = setTimeout(() => {
        copyFeedback.classList.remove('visible');
        copyIconTimer = setTimeout(() => copyEmailBtn.classList.remove('copied'), 220);
      }, 1400);
    });
  }

  loadTranslations();
  reloadPortfolioData();
  registerReveals();
});

const revealObserver = 'IntersectionObserver' in window
  ? new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) revealElement(entry.target);
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' })
  : null;

const revealSelectors = '.section-header, .project-card, .edu-item, .exp-list li, .skill-category, .curriculum-download, .contact-info, .contact-form';

function revealElement(el) {
  if (el.classList.contains('visible')) return;
  el.classList.add('visible');
  if (revealObserver) revealObserver.unobserve(el);
  el.addEventListener('transitionend', function onReveal(e) {
    if (e.target !== el || e.propertyName !== 'opacity') return;
    el.classList.remove('reveal', 'visible');
    el.style.removeProperty('--rd');
    el.removeEventListener('transitionend', onReveal);
  });
}

function registerReveals() {
  if (!revealObserver) return;
  document.querySelectorAll(revealSelectors).forEach(el => {
    if (el.dataset.reveal || el.hasAttribute('data-static')) return;
    el.dataset.reveal = '1';
    el.classList.add('reveal');
    const siblings = Array.from(el.parentElement.children).filter(c => c.matches(revealSelectors));
    const index = siblings.indexOf(el);
    el.style.setProperty('--rd', `${Math.min(index * 60, 360)}ms`);
    revealObserver.observe(el);
  });
}

function revealInViewportInstant() {
  document.querySelectorAll('.reveal:not(.visible)').forEach(el => {
    if (el.closest('.archive-collapse:not(.open)')) return;
    const rect = el.getBoundingClientRect();
    if (rect.height > 0 && rect.top < window.innerHeight && rect.bottom > 0) {
      el.classList.remove('reveal');
      el.style.removeProperty('--rd');
    }
  });
}

window.addEventListener('load', () => {
  setTimeout(() => {
    document.querySelectorAll('.reveal:not(.visible)').forEach(el => {
      if (el.closest('.archive-collapse:not(.open)')) return;
      const rect = el.getBoundingClientRect();
      if (rect.height > 0 && rect.top < window.innerHeight && rect.bottom > 0) {
        revealElement(el);
      }
    });
  }, 1200);
});

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, char => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }[char]));
}

function safeUrl(value) {
  const url = String(value ?? '').trim();
  if (!url) return '';
  if (/^(javascript|data|vbscript):/i.test(url)) return '';
  return url;
}

function safeColor(value) {
  const color = String(value ?? '').trim();
  return /^#[0-9a-f]{3,8}$/i.test(color) ? color : 'var(--accent-blue)';
}

async function loadPortfolioData(lang) {
  try {
    const res = await fetch('data/data.json');
    const data = await res.json();
    renderSkills(data.skills, lang || 'en');
    renderProjects(data.projects, lang || 'en', 'projects-grid');
    renderProjects(data.archivedProjects || [], lang || 'en', 'archive-grid');
    registerReveals();
  } catch (err) {
    console.error('Error loading portfolio data:', err);
  }
}

function renderSkills(skillsData, lang) {
  const grid = document.getElementById('skills-grid');
  if (!grid) return;

  const categories = skillsData.categories || [];

  grid.innerHTML = categories.map(cat => {
    const catName = escapeHtml(cat.name[lang] || cat.name.en);
    const color = safeColor(cat.color);
    const items = cat.items.map(item =>
      `<span class="skill-tag"><span class="skill-dot" style="color: ${color}">●</span> ${escapeHtml(item)}</span>`
    ).join('');
    return `
      <div class="skill-category" style="--skill-accent: ${color}">
        <h4 class="skill-category-title">${catName}</h4>
        <div class="skill-items">${items}</div>
      </div>
    `;
  }).join('');
}

const projectIcons = {
  folder: '<svg class="project-folder" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"/></svg>',
  server: '<svg class="project-icon-server" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/></svg>',
  wrench: '<svg class="project-icon-wrench" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
  weather: '<svg class="project-icon-weather" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="M20 12h2"/><path d="m19.07 4.93-1.41 1.41"/><path d="M15.947 12.65a4 4 0 0 0-5.925-4.128"/><path d="M13 22H7a5 5 0 1 1 4.9-6H13a3 3 0 0 1 0 6Z"/></svg>',
  cart: '<svg class="project-icon-cart" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8" cy="21" r="1"/><circle cx="19" cy="21" r="1"/><path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12"/></svg>'
};

function renderProjects(projects, lang, gridId) {
  const grid = document.getElementById(gridId || 'projects-grid');
  if (!grid) return;

  if (!projects.length) {
    grid.innerHTML = '';
    return;
  }

  grid.innerHTML = projects.map(p => {
    const desc = typeof p.description === 'object' ? (p.description[lang] || p.description.en) : p.description;
    const iconAccent = p.icon === 'server' ? '#58a6ff' : (p.icon === 'wrench' ? '#3fb950' : (p.icon === 'weather' ? '#39c5cf' : (p.icon === 'cart' ? '#e4d6a9' : '#d29922')));
    const icon = `<span class="project-icon-tile" style="--tile-accent: ${iconAccent}">${projectIcons[p.icon] || projectIcons.folder}</span>`;
    const detailLabel = lang === 'es' ? 'Ver detalles' : 'View details';
    const privateLabel = lang === 'es' ? 'Repositorio privado' : 'Private repository';

    const githubUrl = safeUrl(p.githubUrl);
    const externalUrl = safeUrl(p.externalUrl);
    const detailUrl = safeUrl(p.detailUrl);
    const statusUrl = safeUrl(p.statusUrl);
    const statusBadgeSrc = safeUrl(p.statusBadge);

    const githubLink = githubUrl
      ? `<a href="${escapeHtml(githubUrl)}" class="project-ext-link" title="GitHub" aria-label="GitHub" target="_blank" rel="noopener noreferrer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/></svg>
        </a>`
      : '';

    const externalLink = externalUrl && externalUrl !== '#'
      ? `<a href="${escapeHtml(externalUrl)}" class="project-ext-link project-ext-link-external" title="External link" aria-label="External link" target="_blank" rel="noopener noreferrer">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>
        </a>`
      : '';

    const privateBadge = p.privateRepo
      ? `<span class="project-private" tabindex="0" aria-label="${escapeHtml(privateLabel)}">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          <span class="project-private-tooltip">${escapeHtml(privateLabel)}</span>
        </span>`
      : '';

    const workingBadge = p.working
      ? `<span class="project-working"><span class="working-dot"></span>working</span>`
      : '';

    const overlayLink = detailUrl
      ? `<a class="project-card-link" href="${escapeHtml(detailUrl)}" aria-label="${escapeHtml(p.title)}"></a>`
      : '';

    const statusBadgeImg = statusBadgeSrc
      ? `<img class="project-status-badge" src="${escapeHtml(statusBadgeSrc)}" alt="Service status" loading="lazy">`
      : '';

    const statusBadge = statusUrl && statusBadgeImg
      ? `<a class="project-status-link" href="${escapeHtml(statusUrl)}" target="_blank" rel="noopener noreferrer" aria-label="Service status">${statusBadgeImg}</a>`
      : statusBadgeImg;

    const headerRight = (workingBadge || githubLink || privateBadge || externalLink || statusBadge)
      ? `<div class="project-header-right">
          ${workingBadge}
          <div class="project-ext-links">
            ${githubLink}
            ${privateBadge}
            ${externalLink}
          </div>
          ${statusBadge}
        </div>`
      : '';

    const detailHint = detailUrl
      ? `<div class="project-footer">
          <span class="project-detail-hint">${detailLabel} <span class="arrow">→</span></span>
        </div>`
      : '';

    return `
      <article class="project-card">
        ${overlayLink}
        <div class="project-header">
          ${icon}
          ${headerRight}
        </div>
        <h3 class="project-title">${escapeHtml(p.title)}</h3>
        <p class="project-desc">${escapeHtml(desc)}</p>
        ${detailHint}
      </article>
    `;
  }).join('');
}
