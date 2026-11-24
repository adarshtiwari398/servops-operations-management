export type ServiceCategory =
  | 'Cleaning'
  | 'Plumbing'
  | 'Electrical'
  | 'Appliance Repair'
  | 'Salon & Beauty';

export type BookingStatus =
  | 'Booking Received'
  | 'Confirmed'
  | 'Professional Assigned'
  | 'Professional En Route'
  | 'Service Started'
  | 'Service Completed'
  | 'Cancelled'
  | 'Rescheduled';

export type LocationRecord = {
  id: string;
  city: string;
  area: string;
  pincode: string;
  latitude: number;
  longitude: number;
};

export type Customer = {
  id: string;
  name: string;
  phoneMasked: string;
  locationId: string;
  repeatCustomer: boolean;
};

export type Professional = {
  id: string;
  name: string;
  phoneMasked: string;
  baseLocationId: string;
  skills: ServiceCategory[];
  workingHours: { start: string; end: string };
  rating: number;
  completedJobs: number;
  cancellationRate: number;
  rejectionRate: number;
  active: boolean;
};

export type Booking = {
  id: string;
  customerId: string;
  locationId: string;
  category: ServiceCategory;
  serviceName: string;
  scheduledAt: string;
  estimatedDurationMinutes: number;
  status: BookingStatus;
  professionalId: string | null;
  estimatedCost: number;
  actualCost: number | null;
  cancelledAt: string | null;
  rescheduledFrom: string | null;
  createdAt: string;
};

export type ScheduleAssignment = {
  id: string;
  bookingId: string;
  professionalId: string;
  startAt: string;
  endAt: string;
};

export type InventoryItem = {
  id: string;
  name: string;
  category: 'Cleaning' | 'Plumbing' | 'Electrical' | 'Consumable';
  quantity: number;
  unit: string;
  minimumStock: number;
  reorderQuantity: number;
  supplier: string;
  unitCost: number;
};

export type InventoryUsage = {
  id: string;
  bookingId: string;
  itemId: string;
  quantity: number;
  recordedAt: string;
};

export type SlaRecord = {
  bookingId: string;
  scheduledArrivalAt: string;
  actualArrivalAt: string | null;
  completedAt: string | null;
  onTime: boolean | null;
  slaMinutes: number;
  slaBreached: boolean;
};

export type CustomerFeedback = {
  id: string;
  bookingId: string;
  rating: number;
  comment: string;
  complaintType: 'None' | 'Delay' | 'Quality' | 'Professional Behavior' | 'Cost';
  resolutionStatus: 'Resolved' | 'Open' | 'Rework';
  refundAmount: number;
  reworkRequired: boolean;
};

export type DemandObservation = {
  date: string;
  locationId: string;
  category: ServiceCategory;
  bookingCount: number;
};

export type OperationsData = {
  schemaVersion: 1;
  locations: LocationRecord[];
  customers: Customer[];
  professionals: Professional[];
  bookings: Booking[];
  scheduleAssignments: ScheduleAssignment[];
  inventory: InventoryItem[];
  inventoryUsage: InventoryUsage[];
  slaRecords: SlaRecord[];
  feedback: CustomerFeedback[];
  demandHistory: DemandObservation[];
};
