/* ================================================================
   layout.js — Mounts shared header + footer on every page
   ================================================================ */
(function(){
  const S = window.SITE;

  /* ── HEADER ── */
  const navLinks = S.nav.map(n =>
    `<a href="${n.href}" class="nav-link">${n.label}</a>`
  ).join('');

  const header = `
<header id="site-header">
  <div class="header-inner">
    <a href="index.html" class="logo-wrap" aria-label="${S.name} Home" style="display:flex;align-items:center;gap:10px;text-decoration:none;">
      <div class="logo-mark">
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
          <path d="M9 2L16 6V12L9 16L2 12V6L9 2Z" stroke="white" stroke-width="1.5" stroke-linejoin="round"/>
          <path d="M9 6L12 8V12L9 14L6 12V8L9 6Z" fill="white" fill-opacity="0.7"/>
        </svg>
      </div>
      <div class="logo-wordmark">Built to Be <em>Better</em></div>
    </a>
    <button class="hamburger" id="hamburger" aria-label="Open menu" aria-expanded="false">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="4" x2="20" y1="6" y2="6"/>
        <line x1="4" x2="20" y1="12" y2="12"/>
        <line x1="4" x2="20" y1="18" y2="18"/>
      </svg>
    </button>
    <nav class="main-nav" id="main-nav" aria-label="Main navigation">
      ${navLinks}
      <button onclick="openAuditForm()" class="nav-cta" style="font-family:inherit;cursor:pointer;">${S.ctaLabel}</button>
    </nav>
  </div>
  <div class="mobile-menu" id="mobile-menu" aria-hidden="true">
    ${navLinks}
    <button onclick="openAuditForm()" class="mobile-cta" style="font-family:inherit;cursor:pointer;border:none;width:100%;">${S.ctaLabel}</button>
  </div>
</header>`;

  /* ── FOOTER ── */
  const footerLinks = S.nav.map(n =>
    `<li><a href="${n.href}">${n.label}</a></li>`
  ).join('');

  const footer = `
<footer id="site-footer">
  <div class="footer-inner">
    <div class="footer-col">
      <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
        <div class="logo-mark" style="width:28px;height:28px;">
          <svg width="16" height="16" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
            <path d="M9 2L16 6V12L9 16L2 12V6L9 2Z" stroke="white" stroke-width="1.5" stroke-linejoin="round"/>
            <path d="M9 6L12 8V12L9 14L6 12V8L9 6Z" fill="white" fill-opacity="0.7"/>
          </svg>
        </div>
        <div class="logo-wordmark" style="font-size:16px;">Built to Be <em>Better</em></div>
      </div>
      <p style="font-size:13px;max-width:220px;line-height:1.7;">${S.tagline}</p>
    </div>
    <div class="footer-col">
      <h4>Quick Links</h4>
      <ul>${footerLinks}</ul>
    </div>
    <div class="footer-col">
      <h4>Contact</h4>
      <p><a href="mailto:${S.email}">${S.email}</a></p>
    </div>
    <div class="footer-col">
      <h4>Services</h4>
      <ul>
        <li><a href="#audit-form">Website Image Audit</a></li>
        <li><a href="#optimization">Image Optimization</a></li>
        <li><a href="#optimization">WebP Conversion</a></li>
      </ul>
    </div>
  </div>
  <div class="footer-bottom">
    <p>We analyze the image resources used by your website so you can make informed decisions about website optimization.</p>
    <p style="margin-top:8px;">Audit results and full-site projections are estimates based on the pages and resources available to our crawler at the time of analysis. Actual optimization results vary by website, image content, platform, hosting environment, and implementation.</p>
    <p style="margin-top:12px;">&copy; ${new Date().getFullYear()} Built to Be Better. All rights reserved. &mdash; A <strong style="color:rgba(238,242,255,0.5);">DPA/GDS</strong> &amp; <strong style="color:rgba(238,242,255,0.5);">Tribe Maker</strong> collaboration.</p>
  </div>
</footer>`;

  /* ── INJECT ── */
  const headerTarget = document.getElementById('header-mount');
  const footerTarget = document.getElementById('footer-mount');
  if(headerTarget) headerTarget.outerHTML = header;
  if(footerTarget) footerTarget.outerHTML = footer;

  /* ── HAMBURGER ── */
  document.addEventListener('click', function(e){
    const btn  = document.getElementById('hamburger');
    const menu = document.getElementById('mobile-menu');
    if(!btn || !menu) return;
    if(btn.contains(e.target)){
      const open = menu.classList.toggle('open');
      btn.setAttribute('aria-expanded', open);
      menu.setAttribute('aria-hidden', !open);
    } else if(!menu.contains(e.target)){
      menu.classList.remove('open');
      btn.setAttribute('aria-expanded', false);
      menu.setAttribute('aria-hidden', true);
    }
  });
})();
