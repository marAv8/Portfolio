// src/components/Mobile/MobileScrollDriver.js
export function attachScrollIndex(listEl, onIndex) {
  if (!listEl) return () => {};
  const sections = Array.from(listEl.querySelectorAll(".m-section"));
  if (!sections.length) return () => {};

  const io = new IntersectionObserver(
    (entries) => {
      // Pick the section most in view
      const best = entries
        .filter(e => e.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (best) {
        const idx = sections.indexOf(best.target);
        onIndex?.(idx);
      }
    },
    { root: listEl, threshold: [0.5, 0.75, 0.9] }
  );

  sections.forEach(s => io.observe(s));
  return () => io.disconnect();
}
