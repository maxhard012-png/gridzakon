// Весы: лёгкий загрузчик. Сцену с Three.js (scene.min.js) подгружаем, только когда блок рядом и страница уже загрузилась.
const stage = document.getElementById('scales');
if (stage) {
  const io = new IntersectionObserver((e) => {
    if (!e.some((x) => x.isIntersecting)) return;
    io.disconnect();
    const idle = (f) => (window.requestIdleCallback ? requestIdleCallback(f, { timeout: 1500 }) : setTimeout(f, 200));
    const go = () => idle(() => import('./scene.min.js?v=202610251618').then((m) => m.boot()).catch((err) => { console.error(err); stage.hidden = true; }));
    if (document.readyState === 'complete') go(); else addEventListener('load', go, { once: true });
  }, { rootMargin: '300px 0px' });
  io.observe(stage);
}
