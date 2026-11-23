/**
 * Passing a file from one tab to another. The file is parked in IndexedDB
 * under a random id and the new tab is opened with that id in its URL; the
 * new tab collects the file and removes it. Nothing leaves the browser.
 *
 * Going through storage, instead of messaging the opened window, also covers
 * browsers that load a "new tab" in the same window: the page that loads
 * still finds the file it was asked to show.
 */

export interface HandedFile {
  readonly file: Blob;
  readonly name: string;
}

const DATABASE = "aia-explorer";
const STORE = "handoff";
const HASH_KEY = "open";
/** A parked file nobody collected, e.g. because the pop-up was blocked. */
const STALE_AFTER_MS = 10 * 60 * 1000;

interface Parked extends HandedFile {
  readonly parkedAt: number;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DATABASE, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error("Could not open browser storage"));
  });
}

/** Runs one request in its own transaction and closes the database afterwards. */
async function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const database = await openDatabase();
  try {
    return await new Promise<T>((resolve, reject) => {
      const transaction = database.transaction(STORE, mode);
      const request = run(transaction.objectStore(STORE));
      transaction.oncomplete = () => resolve(request.result);
      transaction.onerror = () => reject(transaction.error ?? new Error("Browser storage failed"));
      transaction.onabort = transaction.onerror;
    });
  } finally {
    database.close();
  }
}

/**
 * Opens the app in a new tab showing `handed`.
 * @throws if browser storage is unavailable.
 */
export async function openInNewTab(handed: HandedFile): Promise<void> {
  const id = crypto.randomUUID();
  const parked: Parked = { ...handed, parkedAt: Date.now() };
  await withStore("readwrite", (store) => store.put(parked, id));

  const url = new URL(location.href);
  url.hash = `${HASH_KEY}=${id}`;
  // With `noopener`, open() returns null whether or not the tab opened, so a
  // blocked pop-up cannot be detected here; the stale sweep cleans up after one.
  window.open(url, "_blank", "noopener");
}

/**
 * The file this tab was opened to show, if any. Removes it from storage and
 * the id from the URL, so a reload does not look for it again.
 */
export async function collectHandedFile(): Promise<HandedFile | undefined> {
  const id = new URLSearchParams(location.hash.slice(1)).get(HASH_KEY);
  if (id === null) return undefined;
  history.replaceState(history.state, "", location.pathname + location.search);

  try {
    const parked = await withStore<Parked | undefined>("readonly", (store) => store.get(id));
    await withStore("readwrite", (store) => store.delete(id));
    void sweepStale();
    return parked ? { file: parked.file, name: parked.name } : undefined;
  } catch {
    return undefined;
  }
}

/** Drops parked files that were never collected. */
async function sweepStale(): Promise<void> {
  const database = await openDatabase();
  try {
    const transaction = database.transaction(STORE, "readwrite");
    const cursor = transaction.objectStore(STORE).openCursor();
    cursor.onsuccess = () => {
      const row = cursor.result;
      if (!row) return;
      if (Date.now() - (row.value as Parked).parkedAt > STALE_AFTER_MS) row.delete();
      row.continue();
    };
    await new Promise<void>((resolve) => {
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => resolve();
    });
  } finally {
    database.close();
  }
}
