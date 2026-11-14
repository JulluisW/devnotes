// 📘 Day 11: a stand-in for a third-party script (analytics, chat widget, ads).
// It's loaded with next/script strategy="lazyOnload" in app/layout.tsx, so it
// downloads only after the page has finished loading, when the browser is idle.
(function () {
  var key = 'devnotes-page-views';
  var count = 1;
  try {
    count = Number(sessionStorage.getItem(key) || 0) + 1;
    sessionStorage.setItem(key, String(count));
  } catch (e) {}
  console.log('[page-views] script ran ' + Math.round(performance.now()) + ' ms after the page started loading. Full page loads this session: ' + count);
})();
