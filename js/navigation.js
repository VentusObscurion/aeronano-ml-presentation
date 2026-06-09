/* ============================================================
   navigation.js — Scroll spy, progress bar, hamburger menu
   ============================================================ */

(function () {
  'use strict';

  const navbar   = document.getElementById('navbar');
  const navLinks = document.querySelectorAll('.nav-link');
  const progress = document.getElementById('scroll-progress');
  const hamburger = document.getElementById('hamburger');
  const navList  = document.getElementById('nav-links');
  const sections = document.querySelectorAll('section[id]');

  /* ---------- Scroll progress bar ---------- */
  function updateProgress() {
    const scrollTop    = window.scrollY;
    const docHeight    = document.documentElement.scrollHeight - window.innerHeight;
    const pct          = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    progress.style.width = pct + '%';
  }

  /* ---------- Active nav link via IntersectionObserver ---------- */
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          navLinks.forEach((a) => {
            a.classList.toggle('active', a.dataset.section === entry.target.id);
          });
        }
      });
    },
    { rootMargin: '-40% 0px -50% 0px', threshold: 0 }
  );

  sections.forEach((s) => observer.observe(s));

  /* ---------- Hamburger toggle ---------- */
  hamburger.addEventListener('click', () => {
    navList.classList.toggle('open');
  });

  /* Close mobile menu on nav-link click */
  navLinks.forEach((a) => {
    a.addEventListener('click', () => navList.classList.remove('open'));
  });

  /* ---------- Smooth anchor scroll (fallback for older browsers) ---------- */
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener('click', (e) => {
      const target = document.querySelector(anchor.getAttribute('href'));
      if (target) {
        e.preventDefault();
        const offset = target.getBoundingClientRect().top + window.scrollY - 70;
        window.scrollTo({ top: offset, behavior: 'smooth' });
      }
    });
  });

  /* ---------- Plotly resize on scroll into view ---------- */
  const plotIds = ['pbe-plot', 'regime-plot'];
  const plotObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && window.Plotly) {
          Plotly.relayout(entry.target.id, { autosize: true });
        }
      });
    },
    { threshold: 0.1 }
  );

  plotIds.forEach((id) => {
    const el = document.getElementById(id);
    if (el) plotObserver.observe(el);
  });

  /* ---------- Event listeners ---------- */
  window.addEventListener('scroll', updateProgress, { passive: true });
  updateProgress();
})();
