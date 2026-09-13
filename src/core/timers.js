export const Timers = (() => {
  const bag = new Map();
  function set(key, fn, delay) {
    if (bag.has(key)) clearTimeout(bag.get(key));
    const id = setTimeout(() => { bag.delete(key); fn(); }, delay);
    bag.set(key, id);
    return id;
  }
  function clear(key) {
    if (bag.has(key)) { clearTimeout(bag.get(key)); bag.delete(key); }
  }
  function clearAll() {
    bag.forEach(id => clearTimeout(id));
    bag.clear();
  }
  return { set, clear, clearAll };
})();
