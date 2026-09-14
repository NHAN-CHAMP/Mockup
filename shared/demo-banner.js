(function () {
  const STORAGE_KEY = 'mockup-demo-popup-dismissed';

  function isHomePage() {
    const path = (window.location.pathname || '').replace(/\/+$/, '') || '/';
    return (
      path === '/Mockup' ||
      path === '/Mockup/index.html' ||
      path.endsWith('/Mockup') ||
      path.endsWith('/Mockup/index.html')
    );
  }

  if (!isHomePage()) return;
  if (sessionStorage.getItem(STORAGE_KEY) === '1') return;
  if (document.getElementById('mockup-demo-popup')) return;

  const overlay = document.createElement('div');
  overlay.id = 'mockup-demo-popup';
  overlay.setAttribute('role', 'dialog');
  overlay.setAttribute('aria-modal', 'true');
  overlay.setAttribute('aria-labelledby', 'mockup-demo-popup-title');
  overlay.style.cssText =
    'position:fixed;inset:0;z-index:9999999;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(15,23,42,.55);backdrop-filter:blur(2px);';

  const panel = document.createElement('div');
  panel.style.cssText =
    'width:min(420px,100%);background:#fff7ed;color:#7c2d12;border:1px solid #fdba74;border-radius:12px;box-shadow:0 20px 50px rgba(0,0,0,.25);padding:22px 22px 18px;font-family:Sarabun,system-ui,sans-serif;';

  const title = document.createElement('h2');
  title.id = 'mockup-demo-popup-title';
  title.textContent = 'ระบบสาธิต';
  title.style.cssText = 'margin:0 0 8px;font-size:20px;font-weight:700;color:#9a3412;';

  const body = document.createElement('p');
  body.textContent = 'ข้อมูลจำลองเพื่อการนำเสนอ ไม่ใช่ข้อมูลจริง';
  body.style.cssText = 'margin:0 0 18px;font-size:15px;line-height:1.55;color:#9a3412;';

  const actions = document.createElement('div');
  actions.style.cssText = 'display:flex;justify-content:flex-end;';

  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.textContent = 'ปิด';
  closeBtn.style.cssText =
    'appearance:none;border:0;border-radius:8px;background:#c2410c;color:#fff;font-size:14px;font-weight:600;padding:8px 16px;cursor:pointer;';

  function dismiss() {
    sessionStorage.setItem(STORAGE_KEY, '1');
    overlay.remove();
  }

  closeBtn.addEventListener('click', dismiss);
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) dismiss();
  });
  document.addEventListener('keydown', function onKey(e) {
    if (e.key === 'Escape') {
      document.removeEventListener('keydown', onKey);
      dismiss();
    }
  });

  actions.appendChild(closeBtn);
  panel.appendChild(title);
  panel.appendChild(body);
  panel.appendChild(actions);
  overlay.appendChild(panel);
  document.body.appendChild(overlay);
})();
