import { useEffect, useState, useCallback } from 'react';
import { subscribeToItems } from '../kernel/firestoreService';
import {
  SpaReservation,
  GymMembership,
  ClassSchedule,
  ClassBooking,
  CabanaBooking,
  EquipmentRental,
  RecInventoryItem,
  GymMembershipPlan
} from '../../types/recreation';
import { recreationService } from './recreationService';

type Unsub = () => void;

export const useRecreationController = () => {
  const [spaReservations, setSpaReservations] = useState<SpaReservation[]>([]);
  const [memberships, setMemberships] = useState<GymMembership[]>([]);
  const [classSchedules, setClassSchedules] = useState<ClassSchedule[]>([]);
  const [classBookings, setClassBookings] = useState<ClassBooking[]>([]);
  const [cabanaBookings, setCabanaBookings] = useState<CabanaBooking[]>([]);
  const [rentals, setRentals] = useState<EquipmentRental[]>([]);
  const [recInventory, setRecInventory] = useState<RecInventoryItem[]>([]);
  const [plans, setPlans] = useState<GymMembershipPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const handleError = (err: unknown) => {
    const message = err instanceof Error ? err.message : String(err);
    setError(message);
  };

  useEffect(() => {
    const unsubs: Unsub[] = [];
    try {
      unsubs.push(subscribeToItems<SpaReservation>('spa_reservations', setSpaReservations, handleError));
      unsubs.push(subscribeToItems<GymMembership>('gym_memberships', setMemberships, handleError));
      unsubs.push(subscribeToItems<ClassSchedule>('class_schedules', setClassSchedules, handleError));
      unsubs.push(subscribeToItems<ClassBooking>('class_bookings', setClassBookings, handleError));
      unsubs.push(subscribeToItems<CabanaBooking>('cabana_bookings', setCabanaBookings, handleError));
      unsubs.push(subscribeToItems<EquipmentRental>('equipment_rentals', setRentals, handleError));
      unsubs.push(subscribeToItems<RecInventoryItem>('rec_inventory', setRecInventory, handleError));
      unsubs.push(subscribeToItems<GymMembershipPlan>('gym_membership_plans', setPlans, handleError));
    } catch (e: any) {
      setError(e?.message || 'Failed to subscribe recreation data');
    } finally {
      setLoading(false);
    }
    return () => unsubs.forEach(u => u && u());
  }, []);

  const createSpaReservation = useCallback(recreationService.createSpaReservation, []);
  const updateSpaReservation = useCallback(recreationService.updateSpaReservation, []);
  const updateSpaStatus = useCallback(recreationService.updateSpaReservationStatus, []);
  const createMembershipPlan = useCallback(recreationService.createMembershipPlan, []);
  const sellMembership = useCallback(recreationService.sellMembership, []);
  const renewMembership = useCallback(recreationService.renewMembership, []);
  const updateMembershipStatus = useCallback(recreationService.updateMembershipStatus, []);
  const bookClass = useCallback(recreationService.bookClass, []);
  const createClassSchedule = useCallback(recreationService.createClassSchedule, []);
  const bookCabana = useCallback(recreationService.bookCabana, []);
  const updateCabanaStatus = useCallback(recreationService.updateCabanaStatus, []);
  const issueRental = useCallback(recreationService.issueEquipmentRental, []);
  const returnRental = useCallback(recreationService.completeEquipmentReturn, []);
  const reserveInventory = useCallback(recreationService.reserveInventory, []);
  const consumeInventory = useCallback(recreationService.consumeInventory, []);
  const releaseInventory = useCallback(recreationService.releaseInventory, []);
  const setReorderPoint = useCallback(recreationService.setInventoryReorderPoint, []);

  return {
    data: {
      spaReservations,
      memberships,
      classSchedules,
      classBookings,
      cabanaBookings,
      rentals,
      recInventory,
      plans,
    },
    loading,
    error,
    actions: {
      createSpaReservation,
      updateSpaReservation,
      updateSpaStatus,
      createMembershipPlan,
      sellMembership,
      renewMembership,
      updateMembershipStatus,
      bookClass,
      createClassSchedule,
      bookCabana,
      updateCabanaStatus,
      issueRental,
      returnRental,
      reserveInventory,
      consumeInventory,
      releaseInventory,
      setReorderPoint,
    }
  };
};
