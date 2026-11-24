import type { OperationsData } from '../types/domain';

export const DEMO_DATA_LABEL = 'Simulated Indian home-services operations data';

export const demoOperationsData: OperationsData = {
  schemaVersion: 1,
  locations: [
    { id: 'LOC-DEL-HK', city: 'New Delhi', area: 'Hauz Khas', pincode: '110016', latitude: 28.5494, longitude: 77.2001 },
    { id: 'LOC-BLR-HSR', city: 'Bengaluru', area: 'HSR Layout', pincode: '560102', latitude: 12.9121, longitude: 77.6446 },
    { id: 'LOC-MUM-BND', city: 'Mumbai', area: 'Bandra West', pincode: '400050', latitude: 19.0596, longitude: 72.8295 },
  ],
  customers: [
    { id: 'CUS-1001', name: 'Simulated Customer A', phoneMasked: '****1042', locationId: 'LOC-DEL-HK', repeatCustomer: true },
    { id: 'CUS-1002', name: 'Simulated Customer B', phoneMasked: '****2819', locationId: 'LOC-BLR-HSR', repeatCustomer: false },
    { id: 'CUS-1003', name: 'Simulated Customer C', phoneMasked: '****7336', locationId: 'LOC-MUM-BND', repeatCustomer: true },
  ],
  professionals: [
    { id: 'PRO-201', name: 'Amit Kumar', phoneMasked: '****5108', baseLocationId: 'LOC-DEL-HK', skills: ['Cleaning', 'Appliance Repair'], workingHours: { start: '08:00', end: '20:00' }, rating: 4.8, completedJobs: 186, cancellationRate: 2.1, rejectionRate: 1.4, active: true },
    { id: 'PRO-202', name: 'Meera Nair', phoneMasked: '****8921', baseLocationId: 'LOC-BLR-HSR', skills: ['Cleaning', 'Salon & Beauty'], workingHours: { start: '09:00', end: '19:00' }, rating: 4.7, completedJobs: 142, cancellationRate: 3.2, rejectionRate: 2.5, active: true },
    { id: 'PRO-203', name: 'Rahul Sharma', phoneMasked: '****4463', baseLocationId: 'LOC-MUM-BND', skills: ['Plumbing', 'Electrical'], workingHours: { start: '08:00', end: '18:00' }, rating: 4.6, completedJobs: 121, cancellationRate: 4.1, rejectionRate: 3.0, active: true },
  ],
  bookings: [
    { id: 'BKG-2026-001', customerId: 'CUS-1001', locationId: 'LOC-DEL-HK', category: 'Cleaning', serviceName: 'Deep bathroom cleaning', scheduledAt: '2026-11-21T10:00:00+05:30', estimatedDurationMinutes: 120, status: 'Service Completed', professionalId: 'PRO-201', estimatedCost: 1350, actualCost: 1280, cancelledAt: null, rescheduledFrom: null, createdAt: '2026-11-20T09:15:00+05:30' },
    { id: 'BKG-2026-002', customerId: 'CUS-1002', locationId: 'LOC-BLR-HSR', category: 'Salon & Beauty', serviceName: 'Haircut and styling', scheduledAt: '2026-11-21T11:30:00+05:30', estimatedDurationMinutes: 60, status: 'Professional Assigned', professionalId: 'PRO-202', estimatedCost: 950, actualCost: null, cancelledAt: null, rescheduledFrom: null, createdAt: '2026-11-21T08:20:00+05:30' },
    { id: 'BKG-2026-003', customerId: 'CUS-1003', locationId: 'LOC-MUM-BND', category: 'Plumbing', serviceName: 'Tap leakage repair', scheduledAt: '2026-11-21T14:00:00+05:30', estimatedDurationMinutes: 90, status: 'Confirmed', professionalId: 'PRO-203', estimatedCost: 1100, actualCost: null, cancelledAt: null, rescheduledFrom: null, createdAt: '2026-11-21T09:05:00+05:30' },
  ],
  scheduleAssignments: [
    { id: 'SCH-001', bookingId: 'BKG-2026-001', professionalId: 'PRO-201', startAt: '2026-11-21T10:00:00+05:30', endAt: '2026-11-21T12:00:00+05:30' },
    { id: 'SCH-002', bookingId: 'BKG-2026-002', professionalId: 'PRO-202', startAt: '2026-11-21T11:30:00+05:30', endAt: '2026-11-21T12:30:00+05:30' },
    { id: 'SCH-003', bookingId: 'BKG-2026-003', professionalId: 'PRO-203', startAt: '2026-11-21T14:00:00+05:30', endAt: '2026-11-21T15:30:00+05:30' },
  ],
  inventory: [
    { id: 'INV-001', name: 'Disinfectant concentrate', category: 'Cleaning', quantity: 8, unit: 'litre', minimumStock: 10, reorderQuantity: 20, supplier: 'Safecare Distributors', unitCost: 180 },
    { id: 'INV-002', name: 'Teflon tape', category: 'Plumbing', quantity: 24, unit: 'roll', minimumStock: 12, reorderQuantity: 30, supplier: 'Metro Hardware Supply', unitCost: 35 },
    { id: 'INV-003', name: 'Replacement fuse kit', category: 'Electrical', quantity: 6, unit: 'kit', minimumStock: 8, reorderQuantity: 15, supplier: 'Metro Hardware Supply', unitCost: 220 },
  ],
  inventoryUsage: [
    { id: 'USE-001', bookingId: 'BKG-2026-001', itemId: 'INV-001', quantity: 2, recordedAt: '2026-11-21T12:05:00+05:30' },
  ],
  slaRecords: [
    { bookingId: 'BKG-2026-001', scheduledArrivalAt: '2026-11-21T10:00:00+05:30', actualArrivalAt: '2026-11-21T09:58:00+05:30', completedAt: '2026-11-21T12:05:00+05:30', onTime: true, slaMinutes: 15, slaBreached: false },
    { bookingId: 'BKG-2026-002', scheduledArrivalAt: '2026-11-21T11:30:00+05:30', actualArrivalAt: null, completedAt: null, onTime: null, slaMinutes: 15, slaBreached: false },
    { bookingId: 'BKG-2026-003', scheduledArrivalAt: '2026-11-21T14:00:00+05:30', actualArrivalAt: null, completedAt: null, onTime: null, slaMinutes: 15, slaBreached: false },
  ],
  feedback: [
    { id: 'FB-001', bookingId: 'BKG-2026-001', rating: 4.8, comment: 'Simulated feedback: bathroom finish was satisfactory.', complaintType: 'None', resolutionStatus: 'Resolved', refundAmount: 0, reworkRequired: false },
  ],
  demandHistory: [
    { date: '2026-11-18', locationId: 'LOC-DEL-HK', category: 'Cleaning', bookingCount: 4 },
    { date: '2026-11-19', locationId: 'LOC-DEL-HK', category: 'Cleaning', bookingCount: 5 },
    { date: '2026-11-20', locationId: 'LOC-DEL-HK', category: 'Cleaning', bookingCount: 6 },
  ],
};
