/* ================================================================
   anim.js — Scroll reveal + count-up animations
   ================================================================ */
(function(){
  /* ── SCROLL REVEAL ── */
  function revealOnScroll(){
    const els = document.querySelectorAll('.scroll-reveal');
    if(!els.length) return;
    const io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting){
          e.target.style.transition = 'opacity .55s ease, transform .55s ease';
          e.target.style.opacity = '1';
          e.target.style.transform = 'translateY(0)';
          io.unobserve(e.target);
        }
      });
    }, {threshold: 0.12});
    els.forEach(function(el){
      el.style.transform = 'translateY(22px)';
      io.observe(el);
    });
  }

  /* ── COUNT-UP ── */
  function animateCount(el, target, suffix, duration){
    suffix = suffix || '';
    duration = duration || 1400;
    const start = performance.now();
    function step(now){
      const pct = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - pct, 3);
      el.textContent = Math.round(target * ease) + suffix;
      if(pct < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ── INIT COUNTS ── */
  function initCounts(){
    const counts = document.querySelectorAll('[data-count]');
    if(!counts.length) return;
    const io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){
        if(e.isIntersecting){
          const el = e.target;
          animateCount(el, parseFloat(el.dataset.count), el.dataset.suffix || '');
          io.unobserve(el);
        }
      });
    }, {threshold: 0.5});
    counts.forEach(function(el){ io.observe(el); });
  }

  document.addEventListener('DOMContentLoaded', function(){
    revealOnScroll();
    initCounts();
  });
})();
