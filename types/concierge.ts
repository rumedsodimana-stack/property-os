
// ────────────────────────────────────────────────────────────
// Concierge & Guest Services Department — Type Definitions
// ────────────────────────────────────────────────────────────

export type ConciergeRequestType =
  | 'Restaurant Reservation'
  | 'Transportation'
  | 'Tickets'
  | 'Tours'
  | 'Special Request'
  | 'Information'
  | 'Shopping'
  | 'Medical';

export type ConciergeRequestPriority = 'Normal' | 'Urgent' | 'VIP';

export type ConciergeRequestStatus = 'New' | 'In Progress' | 'Completed' | 'Cancelled';

export type TransportationType = 'Airport Transfer' | 'Car Service' | 'Taxi' | 'Limousine' | 'Shuttle';

export type TransportationStatus = 'Scheduled' | 'En Route' | 'Completed' | 'Cancelled' | 'No Show';

export interface ConciergeRequest {
  id: string;
  guestId: string;
  guestName: string;
  roomNumber: string;
  type: ConciergeRequestType;
  priority: ConciergeRequestPriority;
  status: ConciergeRequestStatus;
  assignedTo: string;
  description: string;
  notes: string;
  submittedAt: number;
  updatedAt: number;
  completedAt?: number;
  isVIP: boolean;
}

export interface RestaurantPartner {
  id: string;
  name: string;
  cuisine: string;
  priceRange: '$' | '$$' | '$$$' | '$$$$';
  rating: number;
  phone: string;
  address: string;
  availableSlots: string[];
  hasCommission: boolean;
  commissionRate?: number;
  distance: string;
  isOpen: boolean;
}

export interface RestaurantReservation {
  id: string;
  guestId: string;
  guestName: string;
  roomNumber: string;
  restaurantId: string;
  restaurantName: string;
  date: string;
  time: string;
  partySize: number;
  status: 'Pending' | 'Confirmed' | 'Cancelled' | 'Completed' | 'No Show';
  confirmationNumber?: string;
  specialRequests: string;
  createdAt: number;
}

export interface TransportationBooking {
  id: string;
  guestId: string;
  guestName: string;
  roomNumber: string;
  type: TransportationType;
  pickupLocation: string;
  dropoffLocation: string;
  scheduledDate: string;
  scheduledTime: string;
  passengers: number;
  luggage: number;
  vehicleAssigned?: string;
  driverName?: string;
  driverPhone?: string;
  status: TransportationStatus;
  price: number;
  flightNumber?: string;
  notes: string;
  createdAt: number;
}

export interface TourExperience {
  id: string;
  name: string;
  vendor: string;
  vendorPhone: string;
  category: 'Cultural' | 'Adventure' | 'Nature' | 'Food & Wine' | 'Wellness' | 'Water Sports' | 'City Tour' | 'Day Trip';
  description: string;
  duration: string;
  price: number;
  maxParticipants: number;
  availableDays: string[];
  startTime: string;
  meetingPoint: string;
  includes: string[];
  rating: number;
  isActive: boolean;
}

export interface TourBooking {
  id: string;
  guestId: string;
  guestName: string;
  roomNumber: string;
  tourId: string;
  tourName: string;
  date: string;
  participants: number;
  totalPrice: number;
  status: 'Booked' | 'Confirmed' | 'Completed' | 'Cancelled';
  vendorConfirmation?: string;
  notes: string;
  createdAt: number;
}

export interface LocalDirectoryEntry {
  id: string;
  name: string;
  category: 'Restaurant' | 'Attraction' | 'Hospital' | 'Pharmacy' | 'Embassy' | 'Emergency' | 'Shopping' | 'Entertainment' | 'Transport' | 'Bank';
  address: string;
  phone: string;
  distance: string;
  hours: string;
  rating?: number;
  notes: string;
  isEmergency: boolean;
}

export interface VIPGuestProfile {
  id: string;
  guestId: string;
  guestName: string;
  roomNumber: string;
  loyaltyTier: string;
  arrivalDate: string;
  departureDate: string;
  preferences: string[];
  allergies: string[];
  pastRequests: string[];
  upcomingNeeds: string[];
  personalNotes: string;
  specialOccasion?: string;
  totalStays: number;
  lastVisit?: string;
}
