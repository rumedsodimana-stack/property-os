
// ────────────────────────────────────────────────────────────
// Spa & Wellness Department — Type Definitions
// ────────────────────────────────────────────────────────────

export type SpaAppointmentStatus = 'Booked' | 'In Progress' | 'Completed' | 'No Show' | 'Cancelled';

export type SpaTreatmentCategory = 'Massage' | 'Facial' | 'Body Treatment' | 'Hair' | 'Nails' | 'Packages' | 'Wellness Programs';

export type TherapistAvailability = 'Available' | 'In Session' | 'On Break' | 'Off Duty';

export interface SpaAddOn {
  id: string;
  name: string;
  price: number;
  duration: number; // minutes
}

export interface SpaAppointment {
  id: string;
  guestId: string;
  guestName: string;
  treatmentId: string;
  therapistId: string;
  roomId: string;
  date: string; // ISO date
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  status: SpaAppointmentStatus;
  notes: string;
  totalPrice: number;
  addOns: SpaAddOn[];
  createdAt: number;
}

export interface SpaTreatment {
  id: string;
  name: string;
  category: SpaTreatmentCategory;
  duration: number; // minutes
  price: number;
  description: string;
  isActive: boolean;
  requiredProducts: string[]; // product IDs
  popularity: number; // 0-100
}

export interface TherapistScheduleSlot {
  day: string; // e.g. 'Monday'
  startTime: string;
  endTime: string;
}

export interface SpaTherapist {
  id: string;
  name: string;
  specializations: SpaTreatmentCategory[];
  certifications: string[];
  rating: number; // 1-5
  availability: TherapistAvailability;
  schedule: TherapistScheduleSlot[];
  bookingsToday: number;
  imageUrl?: string;
}

export interface SpaProduct {
  id: string;
  name: string;
  category: string;
  stock: number;
  minStock: number;
  unitPrice: number;
  supplier: string;
  usagePerTreatment: number;
  lastRestocked?: string;
}

export interface SpaRoom {
  id: string;
  name: string;
  type: 'Treatment' | 'Sauna' | 'Steam' | 'Relaxation' | 'Salon';
  status: 'Available' | 'Occupied' | 'Maintenance';
}

export interface SpaRevenueEntry {
  date: string;
  revenue: number;
  treatments: number;
  avgSpend: number;
}
