import type { Booking, LocationRecord, OperationsData, Professional } from '../types/domain';

export const ALLOCATION_WEIGHTS = {
  skill: 30,
  availability: 25,
  distance: 20,
  workload: 15,
  rating: 10,
} as const;

export type AllocationCandidate = {
  professional: Professional;
  score: number;
  eligible: boolean;
  reasons: string[];
  breakdown: {
    skill: number;
    availability: number;
    distance: number;
    workload: number;
    rating: number;
  };
};

function haversineKm(a: LocationRecord, b: LocationRecord): number {
  const radians = (value: number) => (value * Math.PI) / 180;
  const dLat = radians(b.latitude - a.latitude);
  const dLon = radians(b.longitude - a.longitude);
  const lat1 = radians(a.latitude);
  const lat2 = radians(b.latitude);
  const h = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 6371 * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function minuteOfDay(iso: string): number {
  const date = new Date(iso);
  return date.getHours() * 60 + date.getMinutes();
}

function timeToMinutes(time: string): number {
  const [hour, minute] = time.split(':').map(Number);
  return hour * 60 + minute;
}

export function rankProfessionals(data: OperationsData, booking: Booking): AllocationCandidate[] {
  const bookingLocation = data.locations.find((location) => location.id === booking.locationId);
  const start = new Date(booking.scheduledAt);
  const end = new Date(start.getTime() + booking.estimatedDurationMinutes * 60_000);

  return data.professionals
    .filter((professional) => professional.active)
    .map((professional) => {
      const baseLocation = data.locations.find((location) => location.id === professional.baseLocationId);
      const distanceKm = bookingLocation && baseLocation ? haversineKm(bookingLocation, baseLocation) : 999;
      const conflict = data.scheduleAssignments.find((assignment) => {
        if (assignment.professionalId !== professional.id || assignment.bookingId === booking.id) return false;
        const otherStart = new Date(assignment.startAt);
        const otherEnd = new Date(assignment.endAt);
        return start < otherEnd && end > otherStart;
      });
      const workingStart = timeToMinutes(professional.workingHours.start);
      const workingEnd = timeToMinutes(professional.workingHours.end);
      const bookingStart = minuteOfDay(booking.scheduledAt);
      const bookingEnd = bookingStart + booking.estimatedDurationMinutes;
      const hasSkill = professional.skills.includes(booking.category);
      const withinHours = bookingStart >= workingStart && bookingEnd <= workingEnd;
      const reasons: string[] = [];
      const breakdown = {
        skill: hasSkill ? ALLOCATION_WEIGHTS.skill : 0,
        availability: withinHours && !conflict ? ALLOCATION_WEIGHTS.availability : 0,
        distance: Math.max(0, ALLOCATION_WEIGHTS.distance * (1 - Math.min(distanceKm, 25) / 25)),
        workload: 0,
        rating: (professional.rating / 5) * ALLOCATION_WEIGHTS.rating,
      };
      if (hasSkill) reasons.push(`Required ${booking.category} skill matched`);
      else reasons.push(`Missing required ${booking.category} skill`);
      if (conflict) reasons.push(`Schedule conflict with ${conflict.bookingId}`);
      else if (withinHours) reasons.push(`Available within ${professional.workingHours.start}-${professional.workingHours.end}`);
      else reasons.push('Booking falls outside working hours');
      reasons.push(distanceKm < 999 ? `${distanceKm.toFixed(1)} km from customer location` : 'Location distance unavailable');

      const activeJobs = data.bookings.filter((item) =>
        item.professionalId === professional.id &&
        !['Cancelled', 'Service Completed'].includes(item.status),
      ).length;
      breakdown.workload = Math.max(0, ALLOCATION_WEIGHTS.workload * (1 - Math.min(activeJobs, 4) / 4));
      reasons.push(`${activeJobs} active assignment${activeJobs === 1 ? '' : 's'} reduce workload score`);
      const eligible = hasSkill && withinHours && !conflict;
      const score = eligible
        ? Math.round(breakdown.skill + breakdown.availability + breakdown.distance + breakdown.workload + breakdown.rating)
        : 0;
      return { professional, score, eligible, reasons, breakdown };
    })
    .sort((a, b) => b.score - a.score);
}
