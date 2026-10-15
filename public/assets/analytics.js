(() => {
  'use strict';
  // Production only: previews and local development never send measurement data.
  if (location.hostname !== 'rccarking.com') return;
  const measurementId = 'G-8VSLEXNZTW';
  const storageKey = 'rcck-analytics-consent-v1';
  const maxAge = 180 * 24 * 60 * 60 * 1000;
  let choice = null;
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (saved && ['granted', 'denied'].includes(saved.value) && Date.now() - saved.time < maxAge) choice = saved.value;
  } catch { /* Consent still works for this page when storage is unavailable. */ }
  let loaded = false;
  const disabledKey = `ga-disable-${measurementId}`;
  window[disabledKey] = choice !== 'granted';
  window.dataLayer = window.dataLayer || [];
  window.gtag = function () { window.dataLayer.push(arguments); };
  window.gtag('consent', 'default', {
    analytics_storage: 'denied', ad_storage: 'denied',
    ad_user_data: 'denied', ad_personalization: 'denied'
  });
  function enable() {
    window[disabledKey] = false;
    window.gtag('consent', 'update', { analytics_storage: 'granted' });
    if (loaded) return;
    loaded = true;
    window.gtag('js', new Date());
    window.gtag('config', measurementId, {
      allow_google_signals: false,
      allow_ad_personalization_signals: false,
      // Shared filter URLs may contain user-entered text; omit queries and hashes.
      page_location: location.origin + location.pathname,
      page_referrer: (() => { try { const u = new URL(document.referrer); return u.origin + u.pathname; } catch { return ''; } })()
    });
    const tag = document.createElement('script');
    tag.async = true;
    tag.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`;
    document.head.append(tag);
  }
  function clearAnalyticsCookies() {
    for (const cookie of document.cookie.split(';')) {
      const name = cookie.split('=')[0].trim();
      if (name !== '_ga' && !name.startsWith('_ga_')) continue;
      for (const domain of ['', location.hostname, '.' + location.hostname]) {
        document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax${domain ? '; Domain=' + domain : ''}`;
      }
    }
  }
  const panel = document.createElement('section');
  panel.className = 'analytics-consent';
  panel.setAttribute('aria-label', 'Analytics cookie choices');
  panel.innerHTML = '<div><strong>Help us improve the garage</strong><p>With your permission, Google Analytics measures visits and how readers use this site. You can read everything without analytics cookies. <a href="/privacy-policy/#analytics">Privacy details</a></p></div><div class="analytics-actions"><button type="button" data-choice="denied">Reject analytics</button><button type="button" data-choice="granted">Accept analytics</button></div>';
  panel.hidden = choice !== null;
  const settings = document.createElement('button');
  settings.type = 'button';
  settings.className = 'analytics-settings';
  settings.textContent = 'Cookie settings';
  settings.addEventListener('click', () => { panel.hidden = false; panel.querySelector('button').focus(); });
  panel.addEventListener('click', event => {
    const button = event.target.closest('button[data-choice]');
    if (!button) return;
    choice = button.dataset.choice;
    try { localStorage.setItem(storageKey, JSON.stringify({ value: choice, time: Date.now() })); } catch {}
    if (choice === 'granted') enable();
    else {
      window[disabledKey] = true;
      window.gtag('consent', 'update', { analytics_storage: 'denied' });
      clearAnalyticsCookies();
    }
    panel.hidden = true;
    settings.focus();
  });
  document.body.append(panel);
  (document.querySelector('.footer > div') || document.body).append(settings);
  if (choice === 'granted') enable();
})();
