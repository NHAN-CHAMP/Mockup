(function () {
  document.addEventListener(
    'submit',
    function (e) {
      const form = e.target;
      if (!(form instanceof HTMLFormElement)) return;
      if (form.dataset.allowSubmit === 'true') return;
      e.preventDefault();
      alert('โหมดสาธิต: ไม่ได้บันทึกข้อมูลจริง');
    },
    true
  );
})();
