import type { BookingStatus, OperationsData } from '../types/domain';
import { demoOperationsData } from '../data/demoData';

export const DATA_STORAGE_KEY = 'servops-home-services-v1';
export const LEGACY_DATA_STORAGE_KEYS = ['adarsh-ops-home-services-v1'];
export const LEGACY_STORAGE_KEYS = ['adarsh-ops-work-orders'];

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export function cloneDemoData(): OperationsData {
  return JSON.parse(JSON.stringify(demoOperationsData)) as OperationsData;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function migrateLegacyWorkOrders(value: unknown): OperationsData | null {
  if (!Array.isArray(value)) return null;
  const base = cloneDemoData();
  const migrated = value
    .filter(isRecord)
    .filter((order) => typeof order.id === 'string' && typeof order.title === 'string')
    .map((order, index) => {
      const status: BookingStatus =
        order.status === 'Completed'
          ? 'Service Completed'
          : order.status === 'In progress'
            ? 'Professional Assigned'
            : 'Booking Received';
      return {
        ...base.bookings[0],
        id: String(order.id).replace('WO-', 'BKG-MIG-'),
        customerId: base.customers[index % base.customers.length].id,
        locationId: base.locations[index % base.locations.length].id,
        category: 'Cleaning' as const,
        serviceName: String(order.title),
        scheduledAt: new Date().toISOString(),
        status,
        professionalId: status === 'Service Completed' ? base.professionals[0].id : null,
        estimatedCost: 1000,
        actualCost: status === 'Service Completed' ? 1000 : null,
        createdAt: new Date().toISOString(),
      };
    });
  if (migrated.length === 0) return null;
  base.bookings = migrated;
  return base;
}

export function validateOperationsData(value: unknown): value is OperationsData {
  if (!isRecord(value)) return false;
  if (value.schemaVersion !== 1) return false;
  const arrayKeys = [
    'locations',
    'customers',
    'professionals',
    'bookings',
    'scheduleAssignments',
    'inventory',
    'inventoryUsage',
    'slaRecords',
    'feedback',
    'demandHistory',
  ] as const;
  return arrayKeys.every((key) => Array.isArray(value[key]));
}

export function readOperationsData(storage: StorageLike = window.localStorage): OperationsData {
  try {
    const saved = storage.getItem(DATA_STORAGE_KEY);
    if (saved) {
      const parsed: unknown = JSON.parse(saved);
      if (validateOperationsData(parsed)) return parsed;
      console.error('ServOps saved data was rejected because its structure is invalid.');
    }

    for (const key of LEGACY_DATA_STORAGE_KEYS) {
      const legacyData = storage.getItem(key);
      if (!legacyData) continue;
      try {
        const parsed: unknown = JSON.parse(legacyData);
        if (validateOperationsData(parsed)) {
          storage.setItem(DATA_STORAGE_KEY, JSON.stringify(parsed));
          return parsed;
        }
      } catch (error) {
        console.error(`Legacy ServOps data at ${key} could not be migrated.`, error);
      }
    }

    for (const key of LEGACY_STORAGE_KEYS) {
      const legacySaved = storage.getItem(key);
      if (!legacySaved) continue;
      try {
        const migrated = migrateLegacyWorkOrders(JSON.parse(legacySaved));
        if (migrated) {
          storage.setItem(DATA_STORAGE_KEY, JSON.stringify(migrated));
          return migrated;
        }
      } catch (error) {
        console.error(`Legacy ServOps data at ${key} could not be migrated.`, error);
      }
    }
  } catch (error) {
    console.error('ServOps saved data could not be read safely.', error);
  }
  return cloneDemoData();
}

export function writeOperationsData(
  data: OperationsData,
  storage: StorageLike = window.localStorage,
): { ok: boolean; error?: unknown } {
  if (!validateOperationsData(data)) {
    return { ok: false, error: new Error('Refusing to save invalid operations data.') };
  }
  try {
    storage.setItem(DATA_STORAGE_KEY, JSON.stringify(data));
    return { ok: true };
  } catch (error) {
    console.error('ServOps operations data could not be saved.', error);
    return { ok: false, error };
  }
}

export function resetOperationsData(
  storage: StorageLike = window.localStorage,
): { ok: boolean; data: OperationsData } {
  const data = cloneDemoData();
  const result = writeOperationsData(data, storage);
  return { ok: result.ok, data };
}
