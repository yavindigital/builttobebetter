/* ================================================================
   modal.js — Prototype modal for simulated form submissions
   ================================================================ */
function showPrototypeModal(opts){
  opts = opts || {};
  const title = opts.title || 'Audit Submitted';
  const body  = opts.body  || 'Your audit request has been received. In a live environment, our crawler would begin scanning your website and return results within minutes.';
  const sub   = opts.sub   || '';
  let m = document.getElementById('proto-modal');
  if(!m){
    m = document.createElement('div');
    m.id = 'proto-modal';
    m.innerHTML = `
<div class="modal-box">
  <button class="modal-close" id="modal-close-btn" aria-label="Close">&times;</button>
  <h2 id="modal-title"></h2>
  <p id="modal-body"></p>
  <p id="modal-sub" style="font-size:13px;margin-top:12px;"></p>
</div>`;
    document.body.appendChild(m);
    m.addEventListener('click', function(e){
      if(e.target === m) m.classList.remove('open');
    });
    document.getElementById('modal-close-btn').addEventListener('click', function(){
      m.classList.remove('open');
    });
    document.addEventListener('keydown', function(e){
      if(e.key === 'Escape') m.classList.remove('open');
    });
  }
  document.getElementById('modal-title').textContent = title;
  document.getElementById('modal-body').textContent  = body;
  document.getElementById('modal-sub').textContent   = sub;
  m.classList.add('open');
}
