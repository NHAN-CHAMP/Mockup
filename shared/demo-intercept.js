(function () {
  const base = '/Mockup';

  function alertDemo(msg) {
    window.alert(msg || 'โหมดสาธิต: หน้าที่เลือกยังไม่มีในชุดสาธิตนี้');
  }

  document.addEventListener(
    'submit',
    function (e) {
      const form = e.target;
      if (!(form instanceof HTMLFormElement)) return;
      if (form.dataset.allowSubmit === 'true') return;
      e.preventDefault();
      alertDemo('โหมดสาธิต: ไม่ได้บันทึกข้อมูลจริง');
    },
    true
  );

  let pageSet = null;
  async function loadPages() {
    if (pageSet) return pageSet;
    try {
      const res = await fetch(`${base}/shared/existing-pages.json`, { cache: 'force-cache' });
      const data = await res.json();
      pageSet = new Set(data.pages || []);
    } catch (_) {
      pageSet = new Set();
    }
    return pageSet;
  }

  function normalize(href) {
    try {
      const u = new URL(href, window.location.origin);
      if (!u.pathname.startsWith(base)) return null;
      let p = u.pathname;
      if (p.endsWith('/')) p += 'index.html';
      if (!p.endsWith('.html') && !p.split('/').pop().includes('.')) p = p.replace(/\/?$/, '') + '/index.html';
      return p;
    } catch (_) {
      return null;
    }
  }

  document.addEventListener(
    'click',
    async function (e) {
      const a = e.target && e.target.closest ? e.target.closest('a[href]') : null;
      if (!a) return;
      if (a.dataset.allowNav === 'true') return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

      const href = a.getAttribute('href') || '';
      if (!href || href === '#' || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:')) {
        if (href === '#' || a.hasAttribute('data-demo-missing')) {
          e.preventDefault();
          alertDemo();
        }
        return;
      }

      const path = normalize(href);
      if (!path) return;

      const pages = await loadPages();
      if (pages.size && !pages.has(path)) {
        e.preventDefault();
        alertDemo();
      }
    },
    true
  );
})();
