import type {
  Booking,
  BookingStatus,
  OperationsData,
  Professional,
  ScheduleAssignment,
  ServiceCategory,
} from '../types/domain';

export function validateBookingInput(input: {
  customerId: string;
  locationId: string;
  category: ServiceCategory;
  serviceName: string;
  scheduledAt: string;
  estimatedDurationMinutes: number;
  estimatedCost: number;
}): string | null {
  if (!input.customerId || !input.locationId || !input.serviceName.trim()) return 'Customer, location, and service name are required.';
  if (!Number.isFinite(input.estimatedDurationMinutes) || input.estimatedDurationMinutes <= 0) return 'Enter a valid service duration.';
  if (!Number.isFinite(input.estimatedCost) || input.estimatedCost < 0) return 'Enter a valid estimated cost.';
  if (!input.scheduledAt || Number.isNaN(new Date(input.scheduledAt).getTime())) return 'Enter a valid booking date and time.';
  return null;
}

export function createBooking(
  data: OperationsData,
  input: Omit<Booking, 'id' | 'createdAt' | 'status' | 'professionalId' | 'actualCost' | 'cancelledAt' | 'rescheduledFrom'>,
): Booking {
  const error = validateBookingInput(input);
  if (error) throw new Error(error);
  const sequence = data.bookings.length + 1;
  return {
    ...input,
    id: `BKG-2026-${String(sequence).padStart(3, '0')}`,
    status: 'Booking Received',
    professionalId: null,
    actualCost: null,
    cancelledAt: null,
    rescheduledFrom: null,
    createdAt: new Date().toISOString(),
  };
}

export function updateBookingStatus(booking: Booking, status: BookingStatus): Booking {
  const cancelledAt = status === 'Cancelled' ? new Date().toISOString() : booking.cancelledAt;
  return { ...booking, status, cancelledAt };
}

export function reassignBooking(
  data: OperationsData,
  booking: Booking,
  professionalId: string,
): { data: OperationsData; error?: string } {
  const professional = data.professionals.find((item) => item.id === professionalId && item.active);
  if (!professional) return { data, error: 'Select an active professional.' };
  if (!professional.skills.includes(booking.category)) {
    return { data, error: `${professional.name} does not have the required ${booking.category} skill.` };
  }

  const start = new Date(booking.scheduledAt);
  const end = new Date(start.getTime() + booking.estimatedDurationMinutes * 60_000);
  const conflict = data.scheduleAssignments.find((assignment) => {
    if (assignment.professionalId !== professionalId || assignment.bookingId === booking.id) return false;
    const otherStart = new Date(assignment.startAt);
    const otherEnd = new Date(assignment.endAt);
    return start < otherEnd && end > otherStart;
  });
  if (conflict) return { data, error: `${professional.name} has a schedule conflict with ${conflict.bookingId}.` };

  const updatedBooking: Booking = {
    ...booking,
    professionalId,
    status: 'Professional Assigned',
  };
  const assignment: ScheduleAssignment = {
    id: `SCH-${booking.id}`,
    bookingId: booking.id,
    professionalId,
    startAt: booking.scheduledAt,
    endAt: end.toISOString(),
  };
  return {
    data: {
      ...data,
      bookings: data.bookings.map((item) => item.id === booking.id ? updatedBooking : item),
      scheduleAssignments: [
        ...data.scheduleAssignments.filter((item) => item.bookingId !== booking.id),
        assignment,
      ],
      slaRecords: data.slaRecords.map((record) =>
        record.bookingId === booking.id
          ? { ...record, scheduledArrivalAt: booking.scheduledAt }
          : record,
      ),
    },
  };
}

export function validateProfessional(input: Pick<Professional, 'name' | 'skills' | 'workingHours'>): string | null {
  if (!input.name.trim()) return 'Professional name is required.';
  if (input.skills.length === 0) return 'Add at least one skill.';
  if (!input.workingHours.start || !input.workingHours.end) return 'Working hours are required.';
  if (input.workingHours.start >= input.workingHours.end) return 'Working hours must have an end after the start.';
  return null;
}
