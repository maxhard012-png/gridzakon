(() => {
'use strict';
const $=id=>document.getElementById(id);
document.querySelectorAll('#revs [data-r]').forEach((button,i)=>button.setAttribute('aria-label','Открыть отзыв клиента '+(i+1)));
  const groups = JSON.parse($('galleryData').textContent);
  const dialog = $('gallery');
  const stage = $('galleryStage');
  let group = [], index = 0, returnFocus = null, scrollPosition = 0;
  function stopMedia() { const v = stage.querySelector('video'); if (v) { v.pause(); v.removeAttribute('src'); v.load(); } }
  function renderMedia() {
    stopMedia();
    const item = group[index];
    stage.replaceChildren();
    $('galleryTitle').textContent = item.label;
    $('galleryCount').textContent = `${index + 1} / ${group.length}`;
    $('galleryOriginal').href = item.href || item.src;
    $('galleryOriginal').textContent = item.href ? 'Полный выпуск ↗' : item.video ? 'Открыть видео ↗' : 'Открыть оригинал ↗';
    $('galleryPrev').hidden = $('galleryNext').hidden = group.length < 2;
    const media = document.createElement(item.video ? 'video' : 'img');
    if (item.video) {
      media.controls = true;
      media.playsInline = true;
      media.preload = 'metadata';
      if (item.href) media.autoplay = true;
      media.poster = item.poster;
      media.setAttribute('aria-label', item.label);
    } else media.alt = item.label;
    media.src = item.src;
    media.addEventListener('error', () => {
      const message = document.createElement('p');
      message.className = 'media-error';
      message.setAttribute('role', 'status');
      message.textContent = 'Не удалось загрузить материал. Попробуйте открыть оригинал по ссылке ниже.';
      stage.replaceChildren(message);
    }, { once: true });
    stage.append(media);
  }
  function openGallery(trigger) {
    group = groups[trigger.dataset.gallery];
    if (!group?.length) return;
    index = Number(trigger.dataset.index) || 0;
    returnFocus = trigger;
    scrollPosition = scrollY;
    dialog.classList.toggle('wide', trigger.dataset.gallery === 'press');
    renderMedia();
    dialog.showModal();
    document.body.style.position = 'fixed';
    document.body.style.top = `-${scrollPosition}px`;
    document.body.style.width = '100%';
    $('galleryClose').focus();
  }
  document.querySelectorAll('[data-gallery]').forEach(button => button.addEventListener('click', () => openGallery(button)));
  $('galleryClose').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    stopMedia(); stage.replaceChildren();
    document.body.style.position = document.body.style.top = document.body.style.width = '';
    const previousBehavior = document.documentElement.style.scrollBehavior;
    document.documentElement.style.scrollBehavior = 'auto';
    scrollTo(0, scrollPosition);
    document.documentElement.style.scrollBehavior = previousBehavior;
    returnFocus?.focus({ preventScroll: true });
  });
  dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
  function navigate(delta) { index = (index + delta + group.length) % group.length; renderMedia(); }
  $('galleryPrev').addEventListener('click', () => navigate(-1));
  $('galleryNext').addEventListener('click', () => navigate(1));
  dialog.addEventListener('keydown', e => {
    if (e.target.tagName === 'VIDEO') return;
    if (e.key === 'ArrowRight') { e.preventDefault(); navigate(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); navigate(-1); }
  });

  const documents = (window.GRIDZAKON_DOCUMENTS || []).filter(doc => doc.title && doc.url && /^(https:\/\/|assets\/documents\/)/.test(doc.url));
  if (documents.length) {
    $('documentsIntro').textContent = 'Документы в Word для вашей ситуации.';
    documents.forEach(doc => {
      const a = document.createElement('a');
      a.className = 'document-link'; a.textContent = doc.title + ' ↓'; a.href = doc.url;
      if (doc.url.startsWith('assets/')) a.download = '';
      else { a.target = '_blank'; a.rel = 'noopener'; }
      $('documentList').append(a);
    });
  }


})();
