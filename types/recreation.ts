export type RecreationOutletType = 'spa' | 'gym' | 'pool' | 'beach';

export interface RecreationOutlet {
  id: string;
  name: string;
  type: RecreationOutletType;
  location: string;
  hours: { open: string; close: string };
  capacity?: number;
  costCenter?: string;
  taxProfile?: string;
}

export interface SpaService {
  id: string;
  outletId: string;
  name: string;
  durationMinutes: number;
  price: number;
  addOns?: { id: string; name: string; price: number }[];
  roomType?: string;
  therapistSkills?: string[];
  taxCode?: string;
}

export type SpaReservationStatus =
  | 'held'
  | 'confirmed'
  | 'checked_in'
  | 'in_service'
  | 'completed'
  | 'no_show'
  | 'cancelled';

export interface SpaReservation {
  id: string;
  guestId?: string;
  externalCustomer?: { name: string; contact?: string };
  outletId: string;
  serviceId: string;
  therapistId?: string;
  roomId?: string;
  startAt: string;
  endAt: string;
  addOns?: string[];
  status: SpaReservationStatus;
  folioId?: string;
  paymentStatus?: 'unpaid' | 'paid' | 'posted';
  notes?: string;
  source?: string;
}

export interface Therapist {
  id: string;
  outletId: string;
  name: string;
  skills: string[];
  active: boolean;
}

export interface TreatmentRoom {
  id: string;
  outletId: string;
  roomType?: string;
  status: 'available' | 'occupied' | 'maintenance';
}

export interface GymMembershipPlan {
  id: string;
  outletId: string;
  name: string;
  termMonths: number;
  price: number;
  accessScope: 'gym_only' | 'gym_pool' | 'all_recreation';
  autoRenew?: boolean;
}

export interface GymMembership {
  id: string;
  memberId: string;
  planId: string;
  outletId: string;
  startDate: string;
  endDate: string;
  status: 'active' | 'frozen' | 'expired' | 'cancelled';
  paymentStatus?: 'unpaid' | 'paid' | 'posted';
  recurringBillingToken?: string;
}

export interface ClassSchedule {
  id: string;
  outletId: string;
  title: string;
  trainerId?: string;
  startAt: string;
  endAt: string;
  capacity: number;
  price?: number;
  waitlist?: boolean;
}

export interface ClassBooking {
  id: string;
  classId: string;
  memberId?: string;
  guestId?: string;
  status: 'booked' | 'checked_in' | 'completed' | 'no_show' | 'cancelled';
  chargeId?: string;
}

export interface PoolPass {
  id: string;
  outletId: string;
  date: string;
  capacity: number;
  sold: number;
  priceTier?: string;
}

export interface CabanaBooking {
  id: string;
  outletId: string;
  slotStart: string;
  slotEnd: string;
  pax: number;
  status: 'booked' | 'checked_in' | 'completed' | 'cancelled' | 'no_show';
  deposit?: number;
  folioId?: string;
}

export interface EquipmentRental {
  id: string;
  outletId: string;
  itemId: string;
  qty: number;
  issuedAt: string;
  dueAt: string;
  returnedAt?: string;
  deposit?: number;
  charges?: number;
  status: 'issued' | 'returned' | 'late' | 'damaged';
}

export interface RecInventoryItem {
  id: string; // format: ri_<outletId>_<masterItemId>
  outletId: string;
  masterItemId: string;
  onHand: number;
  reserved: number;
  reorderPoint: number;
  uom?: string;
  usagePerUnit?: number;
}

export interface RecCharge {
  id: string;
  type: 'spa_service' | 'membership' | 'class' | 'day_pass' | 'rental' | 'retail';
  amount: number;
  tax?: number;
  discounts?: number;
  paymentMethod?: 'cash' | 'card' | 'folio' | 'external';
  glCode?: string;
  costCenter?: string;
  folioId?: string;
  status: 'pending' | 'posted';
  sourceRef?: string;
  outletId?: string;
  createdAt: string;
}

export interface RecChargeInput extends Omit<RecCharge, 'id' | 'createdAt' | 'status'> {
  status?: RecCharge['status'];
}
