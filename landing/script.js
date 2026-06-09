/* ═══════════════════════════════════════════════════════════════════════════
   Prism Space Landing Page — JavaScript
   ═══════════════════════════════════════════════════════════════════════════ */

// ─── Live Clock for the Mock Browser ─────────────────────────────────────────
function updateMockClock() {
  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');

  const timeEl = document.getElementById('mock-time');
  const dateEl = document.getElementById('mock-date');
  const greetingEl = document.getElementById('mock-greeting');

  if (timeEl) timeEl.textContent = `${hours}:${minutes}`;

  if (dateEl) {
    const options = { weekday: 'long', month: 'long', day: 'numeric' };
    dateEl.textContent = now.toLocaleDateString('en-US', options);
  }

  if (greetingEl) {
    const hour = now.getHours();
    if (hour < 12) greetingEl.textContent = 'Good Morning';
    else if (hour < 17) greetingEl.textContent = 'Good Afternoon';
    else greetingEl.textContent = 'Good Evening';
  }
}

updateMockClock();
setInterval(updateMockClock, 10000);

// ─── Scroll-reveal Animation ─────────────────────────────────────────────────
function initScrollReveal() {
  const revealTargets = document.querySelectorAll(
    '.feature-card, .tool-card, .arch-node, .arch-service, .cta-section'
  );

  revealTargets.forEach((el) => el.classList.add('reveal'));

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
  );

  revealTargets.forEach((el) => observer.observe(el));
}

initScrollReveal();

// ─── Navbar Background on Scroll ─────────────────────────────────────────────
const nav = document.getElementById('main-nav');
if (nav) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 40) {
      nav.style.borderBottomColor = 'rgba(103, 207, 60, 0.18)';
      nav.style.background = 'rgba(0, 0, 0, 0.88)';
    } else {
      nav.style.borderBottomColor = '';
      nav.style.background = '';
    }
  });
}

// ─── Smooth scroll for anchor links ──────────────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (e) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// ─── Interactive Showcase Tabs ───────────────────────────────────────────────
function initShowcaseTabs() {
  const tabs = document.querySelectorAll('.showcase-tab');
  const views = document.querySelectorAll('.showcase-view');

  if (!tabs.length || !views.length) return;

  tabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      tabs.forEach((t) => t.classList.remove('active'));
      views.forEach((v) => v.classList.remove('active'));

      tab.classList.add('active');

      const targetId = tab.getAttribute('data-target');
      const targetView = document.getElementById(targetId);
      if (targetView) {
        targetView.classList.add('active');
      }
    });
  });
}
initShowcaseTabs();
