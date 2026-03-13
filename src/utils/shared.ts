/**
 * Reusable logic, validators
 */
import type { FormEvent } from 'react';
export const validateEmail = (email: string): boolean => {
  if (!email?.trim()) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
};

export const validatePhone = (phone: string): boolean => {
  if (!phone?.trim()) return false;
  return phone.replace(/\D/g, "").length >= 10;
};

export const clamp = (value: number, min: number, max: number): number =>
  Math.min(Math.max(value, min), max);

/** Format date as YYYY-MM-DD */
export const formatDate = (date: Date | string): string => {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toISOString().split("T")[0];
};

/** Format date with time */
export const formatDateTime = (date: Date | string): string => {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleString();
};

/** Format currency */
export const formatCurrency = (amount: number, currency = "USD"): string =>
  new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);

/** Calculate nights between check-in and check-out */
export const calculateNights = (checkIn: Date, checkOut: Date): number => {
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.ceil((checkOut.getTime() - checkIn.getTime()) / oneDay);
};

/** Validate required string (min length) */
export const validateRequired = (value: string | undefined, minLength = 1): boolean =>
  !!value?.trim() && value.trim().length >= minLength;

/** Validate date range: checkOut must be after checkIn */
export const validateDateRange = (checkIn: Date, checkOut: Date): boolean =>
  checkOut > checkIn;

/** Form submit wrapper */
export const createFormSubmitHandler = <T>(handler: (e: FormEvent) => Promise<T>) =>
  (e: FormEvent) => {
    e.preventDefault();
    handler(e);
  };

