/* Read only this browser's existing daily-game progress; no network or tracking. */
(() => {
  const progress = document.getElementById('daily-progress');
  const link = document.getElementById('daily-play');
  if (!progress || !link) return;
  let timer;
  function refresh() {
    clearTimeout(timer);
    const now = new Date();
    const key = now.getFullYear() + '-' + (now.getMonth() + 1) + '-' + now.getDate();
    progress.textContent = 'One daily word, plus unlimited practice rounds.';
    link.textContent = "Play today's word";
    try {
      const saved = JSON.parse(localStorage.getItem('wordstreak_daily_' + key));
      if (saved && Array.isArray(saved.guesses) && saved.guesses.length > 0 && saved.guesses.length <= 6 && saved.guesses.every(g => typeof g === 'string' && /^[a-z]{5}$/.test(g))) {
        if (saved.over === true) {
          progress.textContent = saved.won === true ? 'Daily word solved in ' + saved.guesses.length + '/6 guesses. A new word arrives tomorrow.' : "Today's daily puzzle is complete. A new word arrives tomorrow.";
          link.textContent = 'View result or practise';
        } else if (saved.guesses.length < 6) {
          progress.textContent = 'Daily puzzle in progress: ' + saved.guesses.length + '/6 guesses used on this browser.';
          link.textContent = 'Continue daily word';
        }
      }
    } catch {}
    const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    timer = setTimeout(refresh, midnight.getTime() - now.getTime() + 100);
  }
  window.addEventListener('pageshow', refresh);
  window.addEventListener('storage', refresh);
  document.addEventListener('visibilitychange', () => { if (!document.hidden) refresh(); });
  refresh();
})();
