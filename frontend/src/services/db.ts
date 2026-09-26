// Local-first storage. Each clinician's profile, patients and sessions live in
// IndexedDB in their own browser, so there is no shared server that could leak
// one clinician's patients to another.
import type { Patient, PatientInput, Profile, Session } from '../types/patient';

const DB_NAME = 'docless';
const DB_VERSION = 1;

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('This browser does not support IndexedDB, so DocLess cannot store data.'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains('meta')) db.createObjectStore('meta');
      if (!db.objectStoreNames.contains('patients')) db.createObjectStore('patients', { keyPath: 'id' });
      if (!db.objectStoreNames.contains('sessions')) {
        const sessions = db.createObjectStore('sessions', { keyPath: 'id' });
        sessions.createIndex('patientId', 'patientId', { unique: false });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => {
      dbPromise = null;
      reject(req.error ?? new Error('Could not open local database'));
    };
  });
  return dbPromise;
}

type StoreName = 'meta' | 'patients' | 'sessions';

function wrap<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

async function withStore<T>(
  names: StoreName | StoreName[],
  mode: IDBTransactionMode,
  fn: (tx: IDBTransaction) => Promise<T> | T,
): Promise<T> {
  const db = await openDb();
  const tx = db.transaction(names, mode);
  const done = new Promise<void>((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error ?? new Error('Transaction aborted'));
  });
  done.catch(() => {}); // surfaced below; avoid an unhandled rejection if fn throws first
  let result: T;
  try {
    result = await fn(tx);
  } catch (err) {
    try {
      tx.abort();
    } catch {
      // already finished
    }
    throw err;
  }
  await done;
  return result;
}

export function newId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

const now = () => new Date().toISOString();

// ---- Profile ----

export function getProfile(): Promise<Profile | undefined> {
  return withStore('meta', 'readonly', (tx) => wrap(tx.objectStore('meta').get('profile')));
}

export function saveProfile(profile: Profile): Promise<Profile> {
  const saved = { ...profile, updatedAt: now() };
  return withStore('meta', 'readwrite', async (tx) => {
    await wrap(tx.objectStore('meta').put(saved, 'profile'));
    return saved;
  });
}

// ---- Patients ----

export async function listPatients(): Promise<Patient[]> {
  const all = await withStore('patients', 'readonly', (tx) =>
    wrap(tx.objectStore('patients').getAll() as IDBRequest<Patient[]>),
  );
  return all.sort((a, b) => a.name.localeCompare(b.name));
}

export function getPatient(id: string): Promise<Patient | undefined> {
  return withStore('patients', 'readonly', (tx) => wrap(tx.objectStore('patients').get(id)));
}

export function createPatient(input: PatientInput): Promise<Patient> {
  const ts = now();
  const patient: Patient = { ...input, id: newId(), createdAt: ts, updatedAt: ts };
  return withStore('patients', 'readwrite', async (tx) => {
    await wrap(tx.objectStore('patients').add(patient));
    return patient;
  });
}

export async function updatePatient(id: string, input: PatientInput): Promise<Patient> {
  return withStore('patients', 'readwrite', async (tx) => {
    const store = tx.objectStore('patients');
    const existing = (await wrap(store.get(id))) as Patient | undefined;
    if (!existing) throw new Error('Patient not found');
    const updated: Patient = { ...existing, ...input, id, updatedAt: now() };
    await wrap(store.put(updated));
    return updated;
  });
}

/** Deletes a patient and every session recorded for them. */
export function deletePatient(id: string): Promise<void> {
  return withStore(['patients', 'sessions'], 'readwrite', async (tx) => {
    await wrap(tx.objectStore('patients').delete(id));
    const sessions = tx.objectStore('sessions');
    const keys = await wrap(sessions.index('patientId').getAllKeys(id));
    for (const key of keys) await wrap(sessions.delete(key));
  });
}

// ---- Sessions ----

export async function listSessions(patientId?: string): Promise<Session[]> {
  const all = await withStore('sessions', 'readonly', (tx) => {
    const store = tx.objectStore('sessions');
    return wrap(
      (patientId ? store.index('patientId').getAll(patientId) : store.getAll()) as IDBRequest<Session[]>,
    );
  });
  return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function createSession(
  input: Omit<Session, 'id' | 'createdAt' | 'updatedAt'>,
): Promise<Session> {
  const ts = now();
  const session: Session = { ...input, id: newId(), createdAt: ts, updatedAt: ts };
  return withStore('sessions', 'readwrite', async (tx) => {
    await wrap(tx.objectStore('sessions').add(session));
    return session;
  });
}

export function updateSession(session: Session): Promise<Session> {
  const updated = { ...session, updatedAt: now() };
  return withStore('sessions', 'readwrite', async (tx) => {
    await wrap(tx.objectStore('sessions').put(updated));
    return updated;
  });
}

export function deleteSession(id: string): Promise<void> {
  return withStore('sessions', 'readwrite', async (tx) => {
    await wrap(tx.objectStore('sessions').delete(id));
  });
}

// ---- Export / import / wipe ----

export interface ExportBundle {
  app: 'docless';
  version: 1;
  exportedAt: string;
  profile?: Profile;
  patients: Patient[];
  sessions: Session[];
}

export async function exportAll(): Promise<ExportBundle> {
  const [profile, patients, sessions] = await Promise.all([getProfile(), listPatients(), listSessions()]);
  return { app: 'docless', version: 1, exportedAt: now(), profile, patients, sessions };
}

export async function importAll(bundle: ExportBundle): Promise<{ patients: number; sessions: number }> {
  if (!bundle || bundle.app !== 'docless' || !Array.isArray(bundle.patients) || !Array.isArray(bundle.sessions)) {
    throw new Error('This file is not a DocLess export.');
  }
  await withStore(['meta', 'patients', 'sessions'], 'readwrite', async (tx) => {
    if (bundle.profile) await wrap(tx.objectStore('meta').put(bundle.profile, 'profile'));
    for (const p of bundle.patients) await wrap(tx.objectStore('patients').put(p));
    for (const s of bundle.sessions) await wrap(tx.objectStore('sessions').put(s));
  });
  return { patients: bundle.patients.length, sessions: bundle.sessions.length };
}

export function clearAll(): Promise<void> {
  return withStore(['meta', 'patients', 'sessions'], 'readwrite', async (tx) => {
    await wrap(tx.objectStore('meta').clear());
    await wrap(tx.objectStore('patients').clear());
    await wrap(tx.objectStore('sessions').clear());
  });
}
