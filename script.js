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
      'Status: quiet work in progress.'
    ];
    status.textContent = phrases[Math.floor(Math.random() * phrases.length)];
  }
})();
