/**
 * Centralized status → color/class mappings
 * Single source for room, reservation, and other status styling.
 */
import { RoomStatus, ReservationStatus } from "../../types";

export const getRoomStatusColor = (status: RoomStatus | string): string => {
  switch (status) {
    case RoomStatus.CLEAN_READY: return "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
    case RoomStatus.DIRTY_DEPARTURE: return "bg-rose-500/10 text-rose-500 border-rose-500/20";
    case RoomStatus.DIRTY_STAYOVER: return "brand-bg-accent-subtle brand-text-accent brand-border-accent-subtle";
    case RoomStatus.MINIBAR_PENDING: return "bg-violet-500/10 text-violet-500 border-violet-500/20";
    case RoomStatus.MAINTENANCE: return "bg-zinc-800 text-zinc-500 border-zinc-700";
    case RoomStatus.OCCUPIED: return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    default: return "bg-blue-500/10 text-blue-500 border-blue-500/20";
  }
};

export const getRoomStatusDot = (status: string): string => {
  switch (status) {
    case RoomStatus.CLEAN_READY: return "bg-emerald-500";
    case RoomStatus.DIRTY_DEPARTURE: return "bg-rose-500";
    case RoomStatus.DIRTY_STAYOVER: return "brand-bg-accent";
    case RoomStatus.MAINTENANCE: return "bg-zinc-500";
    case RoomStatus.OCCUPIED: return "bg-blue-500";
    default: return "bg-violet-500";
  }
};

export const getReservationStatusColor = (status: ReservationStatus | string): string => {
  switch (status) {
    case ReservationStatus.CHECKED_IN: return "bg-violet-500/10 text-violet-400 border-violet-500/20";
    case ReservationStatus.CONFIRMED: return "bg-teal-500/10 text-teal-400 border-teal-500/20";
    case ReservationStatus.CHECKED_OUT: return "bg-zinc-800 text-zinc-400 border-zinc-700";
    case ReservationStatus.CANCELLED: return "bg-rose-500/10 text-rose-400 border-rose-500/20";
    default: return "bg-zinc-800 text-zinc-400 border-zinc-700";
  }
};

export const getTaskPriorityClass = (priority: string): string => {
  switch (priority) {
    case "Urgent": return "bg-rose-500/15 text-rose-200 border border-rose-500/30";
    case "Critical": return "bg-rose-500/10 text-rose-300 border border-rose-500/20";
    case "High": return "brand-bg-accent-subtle brand-text-accent border brand-border-accent-subtle";
    case "Medium": return "bg-blue-500/10 text-blue-200 border border-blue-500/20";
    case "Low": return "bg-emerald-500/10 text-emerald-200 border border-emerald-500/20";
    default: return "bg-zinc-800 text-zinc-300 border border-zinc-700";
  }
};
