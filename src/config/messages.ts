/**
 * Centralized validation and UI messages
 */
export const VALIDATION_MESSAGES = {
  guestNameRequired: "Guest name is required",
  validEmailRequired: "Valid email is required",
  validPhoneRequired: "Valid phone number is required",
  checkInCheckOutRequired: "Check-in and check-out dates are required",
  checkOutAfterCheckIn: "Check-out must be after check-in",
  adultsRequired: "At least one adult is required",
  roomTypeRequired: "Room type must be selected",
} as const;
