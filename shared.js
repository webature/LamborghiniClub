// ── CURSOR (pointer devices only) ──
const cur = document.getElementById('cur');
if (cur && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
  document.addEventListener('mousemove', e => {
    cur.style.left = e.clientX + 'px';
    cur.style.top = e.clientY + 'px';
  });
  document.querySelectorAll('a, button, .work-item, .service-card, .service-group, .project-row, input, textarea').forEach(el => {
    el.addEventListener('mouseenter', () => cur.classList.add('big'));
    el.addEventListener('mouseleave', () => cur.classList.remove('big'));
  });
} else if (cur) {
  cur.style.display = 'none';
  document.body.style.cursor = 'auto';
}

// ── CLOCK (GMT) ──
function updateClock() {
  const el = document.getElementById('clock');
  if (!el) return;
  // Always show London time — auto-adjusts for GMT/BST
  const now = new Date();
  const london = new Intl.DateTimeFormat('en-GB', {
    hour: '2-digit', minute: '2-digit',
    timeZone: 'Europe/London',
    hour12: false
  }).format(now);
  // Get timezone abbreviation (GMT or BST)
  const tz = new Intl.DateTimeFormat('en-GB', {
    timeZoneName: 'short',
    timeZone: 'Europe/London'
  }).formatToParts(now).find(p => p.type === 'timeZoneName')?.value || 'GMT';
  el.textContent = `${london} ${tz}`;
}
updateClock();
setInterval(updateClock, 10000);

// ── THEME TOGGLE ──
const THEME_KEY = 'webature_theme';
function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem(THEME_KEY, theme);
  // Update all toggle icons on the page
  document.querySelectorAll('.theme-toggle-icon').forEach(icon => {
    icon.textContent = theme === 'light' ? '☀️' : '🌙';
  });
}
// Load saved theme
const savedTheme = localStorage.getItem(THEME_KEY) || 'dark';
applyTheme(savedTheme);

document.querySelectorAll('.theme-toggle').forEach(btn => {
  btn.addEventListener('click', () => {
    const current = document.documentElement.getAttribute('data-theme') || 'dark';
    applyTheme(current === 'dark' ? 'light' : 'dark');
  });
});

// ── MOBILE MENU ──
const mobBtn = document.querySelector('.mob-menu-btn');
const mobDrawer = document.querySelector('.mob-drawer');
if (mobBtn && mobDrawer) {
  mobBtn.addEventListener('click', () => {
    const isOpen = mobBtn.classList.toggle('open');
    mobDrawer.classList.toggle('open', isOpen);
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });
  // Close on link click
  mobDrawer.querySelectorAll('a').forEach(a => {
    a.addEventListener('click', () => {
      mobBtn.classList.remove('open');
      mobDrawer.classList.remove('open');
      document.body.style.overflow = '';
    });
  });
}

// ── SCROLL REVEAL ──
const io = new IntersectionObserver(entries => {
  entries.forEach((e, i) => {
    if (e.isIntersecting) {
      setTimeout(() => e.target.classList.add('on'), i * 70);
      io.unobserve(e.target);
    }
  });
}, { threshold: 0.08 });
document.querySelectorAll('.js-reveal').forEach(el => io.observe(el));
