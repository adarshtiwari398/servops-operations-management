import type { OperationsData, ServiceCategory } from '../types/domain';

export function calculateKpis(data: OperationsData) {
  const total = data.bookings.length;
  const completed = data.bookings.filter((booking) => booking.status === 'Service Completed');
  const cancelled = data.bookings.filter((booking) => booking.status === 'Cancelled');
  const completedActualCost = completed.reduce((sum, booking) => sum + (booking.actualCost ?? 0), 0);
  const estimatedCost = completed.reduce((sum, booking) => sum + booking.estimatedCost, 0);
  const completedFeedback = data.feedback.filter((item) => completed.some((booking) => booking.id === item.bookingId));
  const averageRating = completedFeedback.length
    ? completedFeedback.reduce((sum, item) => sum + item.rating, 0) / completedFeedback.length
    : 0;
  const onTimeRecords = data.slaRecords.filter((record) => record.onTime !== null);
  const onTime = onTimeRecords.filter((record) => record.onTime).length;
  const slaCompliant = data.slaRecords.filter((record) => !record.slaBreached).length;
  const activeAssignments = data.bookings.filter((booking) =>
    ['Professional Assigned', 'Professional En Route', 'Service Started'].includes(booking.status),
  );
  return {
    totalBookings: total,
    completedBookings: completed.length,
    cancellationRate: total ? (cancelled.length / total) * 100 : 0,
    onTimeArrivalRate: onTimeRecords.length ? (onTime / onTimeRecords.length) * 100 : 0,
    slaCompliance: data.slaRecords.length ? (slaCompliant / data.slaRecords.length) * 100 : 0,
    averageRating,
    costPerCompletedService: completed.length ? completedActualCost / completed.length : 0,
    estimatedVsActualCost: { estimated: estimatedCost, actual: completedActualCost },
    professionalUtilization: data.professionals.length
      ? (activeAssignments.length / (data.professionals.filter((item) => item.active).length || 1)) / 4 * 100
      : 0,
  };
}

export function calculateMovingAverage(
  values: number[],
  windowSize = 3,
): { forecasts: number[]; accuracy: number | null } {
  if (values.length === 0) return { forecasts: [], accuracy: null };
  const forecasts: number[] = [];
  for (let index = 1; index < values.length; index += 1) {
    const start = Math.max(0, index - windowSize);
    const window = values.slice(start, index);
    forecasts.push(window.reduce((sum, value) => sum + value, 0) / window.length);
  }
  const actuals = values.slice(1);
  const matched = Math.min(forecasts.length, actuals.length);
  if (matched === 0) return { forecasts, accuracy: null };
  const errors = actuals.slice(0, matched).map((actual, index) =>
    actual === 0 ? 0 : Math.abs(forecasts[index] - actual) / actual,
  );
  const mape = errors.reduce((sum, value) => sum + value, 0) / matched;
  return { forecasts, accuracy: Math.max(0, 100 - mape * 100) };
}

export function calculateCapacity(
  data: OperationsData,
  locationId: string,
  category: ServiceCategory,
) {
  const demand = data.bookings.filter((booking) =>
    booking.locationId === locationId &&
    booking.category === category &&
    booking.status !== 'Cancelled',
  ).length;
  const professionals = data.professionals.filter((professional) =>
    professional.active &&
    professional.skills.includes(category) &&
    professional.baseLocationId === locationId,
  );
  const availableCapacity = professionals.length * 4;
  const gap = demand - availableCapacity;
  return {
    demand,
    availableCapacity,
    utilization: availableCapacity ? (demand / availableCapacity) * 100 : 100,
    gap,
    additionalProfessionalsRequired: gap > 0 ? Math.ceil(gap / 4) : 0,
  };
}
