// /** [DIAG4] */
export function installEventTrap(label = 'GLOBAL') {
  // /** [DIAG4] */
  if (typeof window === 'undefined' || window.__DIAG4_TRAP__) return; // /** [DIAG4] */
  window.__DIAG4_TRAP__ = true; // /** [DIAG4] */

  const origAdd = EventTarget.prototype.addEventListener; // /** [DIAG4] */
  // /** [DIAG4] */
  EventTarget.prototype.addEventListener = function (type, listener, options) {
    try { // /** [DIAG4] */
      const opts = typeof options === 'boolean' ? { capture: !!options } : (options || {}); // /** [DIAG4] */
      const passive = opts.passive === undefined ? '(default)' : String(opts.passive); // /** [DIAG4] */
      const interesting = /^(wheel|scroll|touchstart|touchmove|pointerdown|pointermove)$/i.test(type); // /** [DIAG4] */
      if (interesting) { // /** [DIAG4] */
        // eslint-disable-next-line no-console
        console.log('[DIAG4][listener]', { target: this?.constructor?.name, type, passive, capture: !!opts.capture, label }); // /** [DIAG4] */
      }
    } catch {} // /** [DIAG4] */
    return origAdd.call(this, type, listener, options); // /** [DIAG4] */
  };
}

