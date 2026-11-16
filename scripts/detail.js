document.addEventListener('DOMContentLoaded', () => {
  const langToggle = document.getElementById('lang-toggle');
  let translations = {};
  let currentLang = localStorage.getItem('lang') === 'es' ? 'es' : 'en';

  async function loadTranslations() {
    try {
      const res = await fetch('../data/translations.json');
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
    if ( langToggle ) langToggle.textContent = lang === 'es' ? 'ES' : 'EN';
    document.documentElement.lang = lang;
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
      document.body.classList.remove('lang-switching');
    });
  }

  loadTranslations();
});
