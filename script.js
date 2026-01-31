(() => {
  const stamp = new Date().toISOString().replace('T', ' ').replace('Z', ' UTC');
  const el = document.getElementById('buildStamp');
  if (el) el.textContent = `Last updated: ${stamp}`;

  const status = document.getElementById('statusLine');
  if (status) {
    const phrases = [
      'Status: bootstrapping.',
      'Status: indexing starlight.',
      'Status: cataloguing questions.',
      'Status: compressing uncertainty into usable maps.',
      'Status: quiet work in progress.'
    ];
    status.textContent = phrases[Math.floor(Math.random() * phrases.length)];
  }

  // Tiny polish: prefer same-tab navigation for internal links.
  for (const a of document.querySelectorAll('a[href]')) {
    const href = a.getAttribute('href') || '';
    if (href.startsWith('http')) {
      a.setAttribute('target', '_blank');
      a.setAttribute('rel', 'noreferrer');
    }
  }
})();
