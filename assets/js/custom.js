// ============================================================
// 1. Sidebar horizontal scroll guard.
// perfect-scrollbar can mis-measure widths in RTL (fractional px
// at zoom/DPI scaling) and allow the sidebar to pan sideways.
// The menu tree must never scroll horizontally: force scrollLeft
// back to its rest position on every scroll event. Vertical
// scrolling (scrollTop) is untouched. The theme auto-loads this
// file (deferred).
// ============================================================
(function () {
  var attach = function () {
    var cw = document.getElementById('R-content-wrapper');
    if (!cw || cw.dataset.noPanGuard) return;
    cw.dataset.noPanGuard = '1';
    cw.addEventListener(
      'scroll',
      function () {
        if (cw.scrollLeft !== 0) {
          cw.scrollLeft = 0;
        }
      },
      { passive: true }
    );
  };
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attach);
  } else {
    attach();
  }
})();

// ============================================================
// 2. Mixed-direction text (RTL pages).
// Site rule: EVERYTHING renders RTL unless explicitly LTR.
// Persian-dominant blocks are therefore never auto-detected — a
// mainly-Persian block that starts with an English term ("**Git**
// یک سیستم ...") simply inherits RTL like any other block.
//
// The only blocks marked LTR here are PURE-LATIN content blocks
// (no Arabic-script character anywhere): fully English paragraphs,
// list items or table cells. Code blocks and inline code are
// always LTR via assets/css/custom.css, and authors can force
// whole sections with <div dir="ltr"> (see README).
// ============================================================
(function () {
  function isRtlChar(c) {
    return (
      (c >= 0x0600 && c <= 0x06ff) || // Arabic
      (c >= 0x0750 && c <= 0x077f) || // Arabic Supplement
      (c >= 0xfb50 && c <= 0xfdff) || // Arabic Presentation Forms-A
      (c >= 0xfe70 && c <= 0xfeff) // Arabic Presentation Forms-B
    );
  }

  function isLatinChar(c) {
    return (c >= 0x0041 && c <= 0x005a) || (c >= 0x0061 && c <= 0x007a);
  }

  function isPureLatin(text) {
    var hasLatin = false;
    for (var i = 0; i < text.length; i++) {
      var c = text.charCodeAt(i);
      if (isRtlChar(c)) return false;
      if (!hasLatin && isLatinChar(c)) hasLatin = true;
    }
    return hasLatin;
  }

  // Article content only (#R-body-inner excludes topbar, breadcrumb
  // and TOC chrome).
  var SELECTOR =
    '#R-body-inner p, #R-body-inner li, #R-body-inner dt, #R-body-inner dd, ' +
    '#R-body-inner blockquote, #R-body-inner td, #R-body-inner th, ' +
    '#R-body-inner figcaption';

  var apply = function () {
    if (document.documentElement.getAttribute('dir') !== 'rtl') return;
    var els = document.querySelectorAll(SELECTOR);
    for (var i = 0; i < els.length; i++) {
      var el = els[i];
      if (el.dataset.ltrMarked) continue;
      el.dataset.ltrMarked = '1';
      if (isPureLatin(el.textContent)) {
        el.style.direction = 'ltr';
      }
    }
  };

  var attach = function () {
    if (document.documentElement.dataset.ltrMarked) return;
    document.documentElement.dataset.ltrMarked = '1';
    apply();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', attach);
  } else {
    attach();
  }
})();
