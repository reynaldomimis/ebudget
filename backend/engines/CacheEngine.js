class CacheEngine {
  constructor() {
    this.cache = new Map();
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    if (Date.now() > item.expiry) {
      this.cache.delete(key);
      return null;
    }
    return item.value;
  }

  set(key, value, ttl = 300000) {
    this.cache.set(key, {
      value,
      expiry: Date.now() + ttl
    });
  }

  invalidate(keyPattern) {
    if (!keyPattern) {
        this.cache.clear();
        return;
    }
    for (const key of this.cache.keys()) {
      if (key.includes(keyPattern)) {
        this.cache.delete(key);
      }
    }
  }
}

module.exports = new CacheEngine();
