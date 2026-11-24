import { describe, expect, it } from 'vitest';
import { cloneDemoData } from './storage';
import {
  createBooking,
  reassignBooking,
  updateBookingStatus,
  validateProfessional,
} from './operationsCrud';

describe('booking and professional workflows', () => {
  it('creates a booking from the operations data model', () => {
    const data = cloneDemoData();
    const booking = createBooking(data, {
      customerId: data.customers[0].id,
      locationId: data.locations[0].id,
      category: 'Cleaning',
      serviceName: 'Kitchen deep cleaning',
      scheduledAt: '2026-11-22T10:00:00+05:30',
      estimatedDurationMinutes: 120,
      estimatedCost: 1200,
    });
    expect(booking.status).toBe('Booking Received');
    expect(booking.professionalId).toBeNull();
    expect(booking.id).toMatch(/^BKG-/);
  });

  it('rejects missing booking input', () => {
    const data = cloneDemoData();
    expect(() => createBooking(data, {
      customerId: '',
      locationId: data.locations[0].id,
      category: 'Cleaning',
      serviceName: '',
      scheduledAt: '',
      estimatedDurationMinutes: 0,
      estimatedCost: -1,
    })).toThrow();
  });

  it('moves a booking through lifecycle statuses', () => {
    const booking = cloneDemoData().bookings[0];
    const updated = updateBookingStatus(booking, 'Cancelled');
    expect(updated.status).toBe('Cancelled');
    expect(updated.cancelledAt).not.toBeNull();
  });

  it('requires a matching skill for reassignment', () => {
    const data = cloneDemoData();
    const result = reassignBooking(data, data.bookings[2], data.professionals[0].id);
    expect(result.error).toContain('does not have');
  });

  it('detects schedule conflicts during reassignment', () => {
    const data = cloneDemoData();
    const conflictingProfessional = data.professionals[0];
    const booking = { ...data.bookings[0], professionalId: null };
    const result = reassignBooking(data, booking, conflictingProfessional.id);
    expect(result.error).not.toBe('Select an active professional.');
  });

  it('validates professional working hours and skills', () => {
    expect(validateProfessional({
      name: '',
      skills: [],
      workingHours: { start: '18:00', end: '09:00' },
    })).not.toBeNull();
  });
});
