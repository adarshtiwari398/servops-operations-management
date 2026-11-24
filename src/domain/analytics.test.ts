import { describe, expect, it } from 'vitest';
import { cloneDemoData } from '../services/storage';
import { calculateCapacity, calculateKpis, calculateMovingAverage } from './analytics';
import { rankProfessionals } from './allocation';

describe('operations analytics and allocation', () => {
  it('calculates KPIs from recorded bookings', () => {
    const kpis = calculateKpis(cloneDemoData());
    expect(kpis.totalBookings).toBe(3);
    expect(kpis.completedBookings).toBe(1);
    expect(kpis.cancellationRate).toBe(0);
  });

  it('calculates a location-category capacity gap', () => {
    const data = cloneDemoData();
    const result = calculateCapacity(data, 'LOC-DEL-HK', 'Cleaning');
    expect(result.demand).toBe(1);
    expect(result.availableCapacity).toBe(4);
    expect(result.gap).toBe(-3);
  });

  it('ranks eligible professionals transparently', () => {
    const data = cloneDemoData();
    const candidates = rankProfessionals(data, data.bookings[0]);
    expect(candidates[0].score).toBeGreaterThan(0);
    expect(candidates[0].reasons.length).toBeGreaterThan(0);
  });

  it('calculates moving-average forecasts and accuracy', () => {
    const result = calculateMovingAverage([4, 5, 6, 7]);
    expect(result.forecasts).toEqual([4, 4.5, 5]);
    expect(result.accuracy).not.toBeNull();
  });
});
