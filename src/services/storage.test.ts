import { describe, expect, it } from 'vitest';
import {
  cloneDemoData,
  validateOperationsData,
  writeOperationsData,
  readOperationsData,
  DATA_STORAGE_KEY,
  LEGACY_STORAGE_KEYS,
  LEGACY_DATA_STORAGE_KEYS,
} from './storage';

function memoryStorage(initial: string | null = null) {
  let value = initial;
  return {
    getItem: () => value,
    setItem: (_key: string, next: string) => { value = next; },
    removeItem: () => { value = null; },
  };
}

describe('operations data storage', () => {
  it('clones demo data so records are not shared', () => {
    const first = cloneDemoData();
    first.bookings[0].status = 'Cancelled';
    expect(cloneDemoData().bookings[0].status).toBe('Service Completed');
  });

  it('validates the versioned data shape', () => {
    expect(validateOperationsData(cloneDemoData())).toBe(true);
    expect(validateOperationsData({ schemaVersion: 1, bookings: [] })).toBe(false);
    expect(validateOperationsData(null)).toBe(false);
  });

  it('reads and writes data safely', () => {
    const storage = memoryStorage();
    const data = cloneDemoData();
    expect(writeOperationsData(data, storage).ok).toBe(true);
    expect(readOperationsData(storage)).toEqual(data);
  });

  it('falls back to demo data for invalid JSON', () => {
    const storage = memoryStorage('{invalid');
    expect(readOperationsData(storage).schemaVersion).toBe(1);
  });

  it('migrates legacy work orders into the versioned data model', () => {
    const initialValues = new Map<string, string>([
      [LEGACY_STORAGE_KEYS[0], JSON.stringify([
        { id: 'WO-2418', title: 'Inspect storage area', status: 'In progress' },
      ])],
    ]);
    const storage = {
      getItem: (key: string) => initialValues.get(key) ?? null,
      setItem: (key: string, value: string) => { initialValues.set(key, value); },
      removeItem: (key: string) => { initialValues.delete(key); },
    };
    const migrated = readOperationsData(storage);
    expect(migrated.bookings[0].serviceName).toBe('Inspect storage area');
    expect(initialValues.has(DATA_STORAGE_KEY)).toBe(true);
  });

  it('migrates existing operations data from the old project key', () => {
    const data = cloneDemoData();
    data.bookings[0].serviceName = 'Preserved saved booking';
    const initialValues = new Map<string, string>([
      [LEGACY_DATA_STORAGE_KEYS[0], JSON.stringify(data)],
    ]);
    const storage = {
      getItem: (key: string) => initialValues.get(key) ?? null,
      setItem: (key: string, value: string) => { initialValues.set(key, value); },
      removeItem: (key: string) => { initialValues.delete(key); },
    };
    const migrated = readOperationsData(storage);
    expect(migrated.bookings[0].serviceName).toBe('Preserved saved booking');
    expect(initialValues.get(DATA_STORAGE_KEY)).toBe(JSON.stringify(migrated));
  });

  it('refuses to write structurally invalid data', () => {
    const storage = memoryStorage();
    const result = writeOperationsData({ schemaVersion: 1 } as never, storage);
    expect(result.ok).toBe(false);
  });
});
