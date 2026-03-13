import { fetchItem, updateItem } from "../kernel/firestoreService";
import {
  SpaReservation,
  SpaReservationStatus,
  GymMembership,
  GymMembershipPlan,
  ClassBooking,
  ClassSchedule,
  CabanaBooking,
  EquipmentRental,
  RecChargeInput,
  RecInventoryItem
} from "../../types/recreation";
import { recreationFinanceBridge, RecFinanceParams } from "./recreationFinanceBridge";
import { recreationInventoryBridge } from "./recreationInventoryBridge";
import { recreationProcurementBridge } from "./recreationProcurementBridge";
import { requireString, requireDateIso, requireNonNegative } from "./validation";

export interface CreateSpaReservationInput extends Omit<SpaReservation, "id" | "status"> {
  status?: SpaReservationStatus;
}

export interface SellMembershipInput {
  memberId: string;
  planId: string;
  outletId: string;
  startDate?: string;
}

export interface RecordChargeInput {
  charge: RecChargeInput;
  finance: RecFinanceParams;
}

const buildId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
const normalizeDate = (value: string, name: string) => requireDateIso(value, name);

export const recreationService = {
  // SPA
  async createSpaReservation(payload: CreateSpaReservationInput): Promise<string> {
    const startAt = normalizeDate(payload.startAt, 'Start time');
    const endAt = normalizeDate(payload.endAt, 'End time');
    if (new Date(endAt) <= new Date(startAt)) throw new Error('End time must be after start time');

    const reservation: SpaReservation = {
      id: buildId('spa_res'),
      status: payload.status || 'confirmed',
      outletId: requireString(payload.outletId, 'Outlet ID'),
      serviceId: requireString(payload.serviceId, 'Service ID'),
      guestId: payload.guestId,
      therapistId: payload.therapistId,
      roomId: payload.roomId,
      startAt,
      endAt,
      addOns: payload.addOns || [],
      paymentStatus: payload.paymentStatus || 'unpaid',
      notes: payload.notes,
      externalCustomer: payload.externalCustomer,
      folioId: payload.folioId,
      source: payload.source
    };
    await updateItem('spa_reservations', reservation.id, reservation);
    return reservation.id;
  },

  async updateSpaReservation(id: string, updates: Partial<SpaReservation>) {
    await updateItem('spa_reservations', id, updates);
  },

  async updateSpaReservationStatus(id: string, status: SpaReservationStatus, updates: Partial<SpaReservation> = {}) {
    await updateItem('spa_reservations', id, { status, ...updates });
  },

  // MEMBERSHIPS
  async createMembershipPlan(plan: Omit<GymMembershipPlan, "id">): Promise<string> {
    const id = buildId('gym_plan');
    const record: GymMembershipPlan = {
      id,
      outletId: requireString(plan.outletId, 'Outlet ID'),
      name: requireString(plan.name, 'Plan name'),
      termMonths: Number(plan.termMonths) || 1,
      price: requireNonNegative(plan.price, 'Price'),
      accessScope: plan.accessScope || 'gym_only',
      autoRenew: plan.autoRenew ?? false
    };
    await updateItem('gym_membership_plans', id, record);
    return id;
  },

  async sellMembership(input: SellMembershipInput, plan?: GymMembershipPlan): Promise<string> {
    const start = input.startDate ? normalizeDate(input.startDate, 'Start date') : new Date().toISOString();
    const termMonths = plan?.termMonths ?? 1;
    const endDate = new Date(start);
    endDate.setMonth(endDate.getMonth() + termMonths);

    const membership: GymMembership = {
      id: buildId('gym_mem'),
      memberId: requireString(input.memberId, 'Member ID'),
      planId: requireString(input.planId, 'Plan ID'),
      outletId: requireString(input.outletId, 'Outlet ID'),
      startDate: start,
      endDate: endDate.toISOString(),
      status: 'active',
      paymentStatus: 'unpaid'
    };
    await updateItem('gym_memberships', membership.id, membership);
    return membership.id;
  },

  async renewMembership(membershipId: string, plan?: GymMembershipPlan): Promise<void> {
    const existing = await fetchItem<GymMembership>('gym_memberships', membershipId);
    if (!existing) throw new Error(`Membership ${membershipId} not found`);
    const endDate = new Date(existing.endDate || new Date().toISOString());
    endDate.setMonth(endDate.getMonth() + (plan?.termMonths ?? 1));
    await updateItem('gym_memberships', membershipId, {
      endDate: endDate.toISOString(),
      status: 'active',
      paymentStatus: 'unpaid'
    });
  },

  async updateMembershipStatus(membershipId: string, status: GymMembership['status'], note?: string) {
    await updateItem('gym_memberships', membershipId, {
      status,
      notes: note,
      updatedAt: new Date().toISOString()
    });
  },

  // CLASSES
  async bookClass(classId: string, memberId?: string, guestId?: string): Promise<string> {
    const booking: ClassBooking = {
      id: buildId('class_book'),
      classId,
      memberId,
      guestId,
      status: 'booked'
    };
    await updateItem('class_bookings', booking.id, booking);
    return booking.id;
  },

  async createClassSchedule(schedule: ClassSchedule): Promise<void> {
    const payload: ClassSchedule = {
      ...schedule,
      id: schedule.id || buildId('class'),
      title: requireString(schedule.title, 'Class title'),
      outletId: requireString(schedule.outletId, 'Outlet ID'),
      startAt: normalizeDate(schedule.startAt, 'Start time'),
      endAt: normalizeDate(schedule.endAt, 'End time'),
      capacity: requireNonNegative(schedule.capacity, 'Capacity'),
      price: schedule.price,
      waitlist: schedule.waitlist
    };
    await updateItem('class_schedules', payload.id, payload);
  },

  // POOL/BEACH
  async bookCabana(booking: CabanaBooking): Promise<string> {
    const slotStart = normalizeDate(booking.slotStart, 'Slot start');
    const slotEnd = normalizeDate(booking.slotEnd, 'Slot end');
    if (new Date(slotEnd) <= new Date(slotStart)) {
      throw new Error('Cabana end time must be after start time');
    }

    const pax = booking.pax == null ? 1 : requireNonNegative(booking.pax, 'Pax');
    const deposit = booking.deposit != null ? requireNonNegative(booking.deposit, 'Deposit') : undefined;

    const payload: CabanaBooking = {
      ...booking,
      id: booking.id || buildId('cabana'),
      outletId: requireString(booking.outletId, 'Outlet ID'),
      slotStart,
      slotEnd,
      pax,
      status: booking.status || 'booked',
      deposit,
      folioId: booking.folioId
    };
    await updateItem('cabana_bookings', payload.id, payload);
    return payload.id;
  },

  async updateCabanaStatus(id: string, status: CabanaBooking['status']) {
    await updateItem('cabana_bookings', id, { status });
  },

  // RENTALS
  async issueEquipmentRental(rental: Omit<EquipmentRental, "id" | "status">): Promise<string> {
    const issuedAt = rental.issuedAt ? normalizeDate(rental.issuedAt, 'Issued at') : new Date().toISOString();
    const dueAt = rental.dueAt ? normalizeDate(rental.dueAt, 'Due at') : issuedAt;
    if (new Date(dueAt) < new Date(issuedAt)) {
      throw new Error('Rental due time cannot be before issue time');
    }

    const qty = requireNonNegative(rental.qty, 'Quantity');
    const record: EquipmentRental = {
      ...rental,
      id: buildId('rental'),
      status: 'issued',
      issuedAt,
      dueAt,
      qty,
    };
    await updateItem('equipment_rentals', record.id, record);
    return record.id;
  },

  async completeEquipmentReturn(rentalId: string, options?: { damageFee?: number; lateFee?: number }) {
    const rental = await fetchItem<EquipmentRental>('equipment_rentals', rentalId);
    if (!rental) throw new Error(`Rental ${rentalId} not found`);
    const charges = (options?.damageFee || 0) + (options?.lateFee || 0);
    await updateItem('equipment_rentals', rentalId, {
      status: charges > 0 ? 'damaged' : 'returned',
      returnedAt: new Date().toISOString(),
      charges
    });
  },

  // CHARGES
  async recordCharge(input: RecordChargeInput) {
    return recreationFinanceBridge.postRecCharge(input.charge, input.finance);
  },

  // INVENTORY
  async reserveInventory(outletId: string, masterItemId: string, qty: number): Promise<RecInventoryItem> {
    return recreationInventoryBridge.reserve(requireString(outletId, 'Outlet ID'), requireString(masterItemId, 'Master item ID'), requireNonNegative(qty, 'Quantity'));
  },

  async consumeInventory(outletId: string, masterItemId: string, qty: number): Promise<RecInventoryItem> {
    const inv = await recreationInventoryBridge.consume(requireString(outletId, 'Outlet ID'), requireString(masterItemId, 'Master item ID'), requireNonNegative(qty, 'Quantity'));
    await recreationProcurementBridge.raiseIfLow(inv, { outletId, masterItemId });
    return inv;
  },

  async releaseInventory(outletId: string, masterItemId: string, qty: number): Promise<RecInventoryItem> {
    return recreationInventoryBridge.release(requireString(outletId, 'Outlet ID'), requireString(masterItemId, 'Master item ID'), requireNonNegative(qty, 'Quantity'));
  },

  async setInventoryReorderPoint(outletId: string, masterItemId: string, reorderPoint: number): Promise<RecInventoryItem> {
    return recreationInventoryBridge.setReorderPoint(requireString(outletId, 'Outlet ID'), requireString(masterItemId, 'Master item ID'), requireNonNegative(reorderPoint, 'Reorder point'));
  }
};
