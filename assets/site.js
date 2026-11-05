/* No analytics network requests until the visitor opts in. This is not an ads CMP. */
(() => {
  const key = 'ba_analytics_consent';
  const id = 'G-VCXTW15M2M';
  let consent = 'denied';
  try { consent = localStorage.getItem(key) || 'denied'; } catch {}
  const dialog = document.querySelector('#ba-privacy');
  document.querySelectorAll('[data-privacy-open]').forEach(button => button.addEventListener('click', () => dialog.showModal()));
  document.querySelector('[data-privacy-close]').addEventListener('click', () => dialog.close());
  function choose(value) {
    try { localStorage.setItem(key, value); } catch {}
    if (value === 'denied') {
      window['ga-disable-' + id] = true;
      for (const entry of document.cookie.split(';')) {
        const name = entry.split('=')[0].trim();
        if (!/^_ga(?:_|$)|^_gid$|^_gat/.test(name)) continue;
        for (const domain of ['', ';domain=' + location.hostname, ';domain=.brightarcade.in']) {
          document.cookie = name + '=;Max-Age=0;path=/' + domain;
        }
      }
    }
    location.reload();
  }
  document.querySelector('[data-analytics-allow]').addEventListener('click', () => choose('granted'));
  document.querySelector('[data-analytics-deny]').addEventListener('click', () => choose('denied'));
  document.querySelector('#ba-consent-status').textContent = consent === 'granted' ? 'Analytics is allowed on this browser.' : 'Analytics is off on this browser.';
  if (consent !== 'granted') return;
  window.dataLayer = window.dataLayer || [];
  window.gtag = function(){ window.dataLayer.push(arguments); };
  window.gtag('js', new Date());
  window.gtag('config', id, { send_page_view: true });
  const script = document.createElement('script');
  script.async = true;
  script.src = 'https://www.googletagmanager.com/gtag/js?id=' + id;
  document.head.appendChild(script);
})();
