(function () {
  if (document.getElementById('mockup-demo-banner')) return;
  const bar = document.createElement('div');
  bar.id = 'mockup-demo-banner';
  bar.setAttribute('role', 'status');
  bar.style.cssText =
    'position:fixed;top:0;left:0;right:0;z-index:9999999;background:#92400e;color:#fff;text-align:center;padding:6px 12px;font-size:13px;font-family:system-ui,sans-serif;';
  bar.textContent = 'ระบบสาธิต — ข้อมูลจำลองเพื่อการนำเสนอ ไม่ใช่ข้อมูลจริง';
  document.body.prepend(bar);
  document.body.style.paddingTop = '36px';
})();
