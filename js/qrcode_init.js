/* ============================================================
   qrcode_init.js — QR Code floating action button + modal
   ============================================================ */

(function () {
  'use strict';

  var fab      = document.getElementById('qr-fab');
  var modal    = document.getElementById('qr-modal');
  var closeBtn = document.getElementById('qr-close');
  var urlText  = document.getElementById('qr-url-text');
  var codeDiv  = document.getElementById('qr-code-div');
  var generated = false;

  function openModal() {
    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    if (!generated) {
      var url = window.location.href;
      urlText.textContent = url;
      new QRCode(codeDiv, {
        text:         url,
        width:        220,
        height:       220,
        colorDark:    '#000000',
        colorLight:   '#ffffff',
        correctLevel: QRCode.CorrectLevel.H
      });
      generated = true;
    }
  }

  function closeModal() {
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }

  if (fab)      fab.addEventListener('click', openModal);
  if (closeBtn) closeBtn.addEventListener('click', closeModal);
  if (modal)    modal.addEventListener('click', function (e) {
    if (e.target === modal) closeModal();
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeModal();
  });
})();
