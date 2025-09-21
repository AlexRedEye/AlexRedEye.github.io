export const Utils = {
  pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
  shuffle(arr) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  },
  safeHandler(logger, fn) {
    return function (ev) {
      try { fn(ev); }
      catch (err) {
        logger?.error(`${err?.message || err}`);
        console.error(err);
      }
    };
  }
};
