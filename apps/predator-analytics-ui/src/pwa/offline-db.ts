// PWA Offline Database v63.0-ELITE
// IndexedDB для офлайн риск-карток + Background Sync

interface ServiceWorkerRegistrationWithSync extends ServiceWorkerRegistration {
  sync: SyncManager;
}
interface SyncManager {
  register(tag: string): Promise<void>;
}

const DB_NAME = "predator-offline";
const DB_VERSION = 1;

interface RiskCard {
  id: string;
  companyName: string;
  riskScore: number;
  timestamp: string;
  synced: boolean;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("riskCards")) {
        const store = db.createObjectStore("riskCards", { keyPath: "id" });
        store.createIndex("synced", "synced", { unique: false });
        store.createIndex("timestamp", "timestamp", { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function saveRiskCard(card: RiskCard): Promise<void> {
  const db = await openDB();
  const tx = db.transaction("riskCards", "readwrite");
  tx.objectStore("riskCards").put({ ...card, synced: false });
}

export async function getOfflineRiskCards(): Promise<RiskCard[]> {
  const db = await openDB();
  const tx = db.transaction("riskCards", "readonly");
  const request = tx.objectStore("riskCards").getAll();
  return new Promise((resolve) => {
    request.onsuccess = () => resolve(request.result);
  });
}

export async function syncPendingCards(
  syncFn: (card: RiskCard) => Promise<boolean>
): Promise<number> {
  const db = await openDB();
  const tx = db.transaction("riskCards", "readwrite");
  const index = tx.objectStore("riskCards").index("synced");
  const unsynced = await new Promise<RiskCard[]>((resolve) => {
    const req = index.getAll(IDBKeyRange.only(false));
    req.onsuccess = () => resolve(req.result);
  });

  let synced = 0;
  for (const card of unsynced) {
    try {
      const ok = await syncFn(card);
      if (ok) {
        tx.objectStore("riskCards").put({ ...card, synced: true });
        synced++;
      }
    } catch {
      // retry next time
    }
  }
  return synced;
}

// Register background sync
if ("serviceWorker" in navigator && "SyncManager" in window) {
  navigator.serviceWorker.ready.then((reg: ServiceWorkerRegistration) => {
    (reg as ServiceWorkerRegistrationWithSync).sync.register("predator-sync-risk-cards").catch(() => {});
  });
}
