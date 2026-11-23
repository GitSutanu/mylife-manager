// IndexedDB wrapper. Version 2 safely repairs missing stores/indexes from older builds.
const DB = {
  db: null,
  open() {
    return new Promise((resolve, reject) => {
      if (!('indexedDB' in window) || !window.indexedDB) {
        reject(new Error('IndexedDB is not available in this browser or browsing mode.'));
        return;
      }

      let request;
      try {
        request = indexedDB.open('mylife', 2);
      } catch (error) {
        reject(error);
        return;
      }

      request.onupgradeneeded = () => {
        const db = request.result;
        const tx = request.transaction;
        const ensureStore = (name, options, indexes = []) => {
          const store = db.objectStoreNames.contains(name)
            ? tx.objectStore(name)
            : db.createObjectStore(name, options);
          for (const [indexName, keyPath] of indexes) {
            if (!store.indexNames.contains(indexName)) {
              store.createIndex(indexName, keyPath);
            }
          }
        };

        ensureStore('tasks', { keyPath: 'id' }, [
          ['status', 'status'], ['priority', 'priority'], ['category', 'category'],
          ['person', 'person'], ['due', 'due'], ['created', 'created']
        ]);
        ensureStore('notes', { keyPath: 'id' }, [['taskId', 'taskId']]);
        ensureStore('activity', { keyPath: 'id' }, [['taskId', 'taskId']]);
        ensureStore('reminderLog', { keyPath: 'key' });
        ensureStore('settings', { keyPath: 'k' });
      };

      request.onsuccess = () => {
        this.db = request.result;
        this.db.onversionchange = () => {
          this.db.close();
          this.db = null;
        };
        resolve(this.db);
      };
      request.onerror = () => reject(request.error || new Error('Could not open the MyLife database.'));
      request.onblocked = () => reject(new Error('Database upgrade is blocked by another open MyLife tab. Close other MyLife tabs and reload.'));
    });
  },
  run(stores, mode, callback) {
    return new Promise((resolve, reject) => {
      if (!this.db) { reject(new Error('Database connection is not open.')); return; }
      let tx;
      try {
        tx = this.db.transaction(stores, mode);
        let result;
        tx.oncomplete = () => resolve(result);
        tx.onerror = () => reject(tx.error || new Error('Database transaction failed.'));
        tx.onabort = () => reject(tx.error || new Error('Database transaction was aborted.'));
        result = callback(tx);
      } catch (error) {
        reject(error);
      }
    });
  },
  all(storeName) {
    return new Promise((resolve, reject) => {
      if (!this.db) { reject(new Error('Database connection is not open.')); return; }
      try {
        const request = this.db.transaction(storeName).objectStore(storeName).getAll();
        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error || new Error(`Could not read ${storeName}.`));
      } catch (error) { reject(error); }
    });
  },
  put(storeName, value) { return this.run(storeName, 'readwrite', tx => tx.objectStore(storeName).put(value)); },
  del(storeName, id) { return this.run(storeName, 'readwrite', tx => tx.objectStore(storeName).delete(id)); },
  clear(storeName) { return this.run(storeName, 'readwrite', tx => tx.objectStore(storeName).clear()); },
  uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
};
