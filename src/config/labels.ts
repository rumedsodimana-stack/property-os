/**
 * Centralized labels: module names, submenus, placeholders, button text
 */
import { CONFIGURATION_MENU_ITEMS } from "../../components/configuration/configurationMenu";

export type ModuleSubmenuItem = { id: string; label: string };

export const MODULE_SUBMENUS: Record<string, ModuleSubmenuItem[]> = {
  portfolio: [],
  front_desk: [
    { id: "grid", label: "Monitor" },
    { id: "roomplan", label: "Timeline" },
    { id: "arrivals", label: "Arrivals" },
    { id: "departures", label: "Departures" },
    { id: "list", label: "Reservations" },
    { id: "guests", label: "Guests" },
    { id: "blocks", label: "Blocks" },
    { id: "reports", label: "Reports" },
    { id: "livebi", label: "Oracle" },
  ],
  housekeeping: [
    { id: "Dashboard", label: "Command" },
    { id: "Rooms", label: "Rooms" },
    { id: "TaskBoard", label: "Tasks" },
    { id: "Attendants", label: "Staff" },
    { id: "Supplies", label: "Inventory" },
    { id: "Reports", label: "Reports" },
  ],
  pos: [
    { id: "Terminal", label: "POS" },
    { id: "TableMap", label: "Table Map" },
    { id: "MenuEng", label: "R&D" },
    { id: "Inventory", label: "Inventory" },
    { id: "Reports", label: "Reports" },
  ],
  events: [
    { id: "List", label: "BEO List" },
    { id: "Calendar", label: "Calendar" },
    { id: "Contracts", label: "Contracts" },
    { id: "Reports", label: "Reports" },
  ],
  recreation: [
    { id: "Overview", label: "Overview" },
    { id: "Spa", label: "Spa" },
    { id: "Gym", label: "Gym" },
    { id: "Pool", label: "Pool" },
    { id: "Beach", label: "Beach" },
    { id: "Inventory", label: "Inventory" },
    { id: "Reports", label: "Reports" },
  ],
  crm: [
    { id: "Overview", label: "Overview" },
    { id: "Profiles", label: "Profiles" },
    { id: "Segments", label: "Segments" },
    { id: "Campaigns", label: "Campaigns" },
    { id: "Tasks", label: "Tasks" },
  ],
  finance: [
    { id: "Overview", label: "Overview" },
    { id: "MasterInventory", label: "Master Inventory" },
    { id: "Payables", label: "Payables" },
    { id: "Cashier", label: "Cashier" },
    { id: "Assets", label: "Assets" },
    { id: "Ledger", label: "Ledger" },
    { id: "LiveBI", label: "Live BI" },
    { id: "MenuEng", label: "Menu Eng." },
    { id: "NightAudit", label: "Night Audit" },
    { id: "Reports", label: "Reports" },
  ],
  hr: [
    { id: "Overview", label: "Overview" },
    { id: "Directory", label: "Staff" },
    { id: "Roster", label: "Roster" },
    { id: "Attendance", label: "Attendance" },
    { id: "Leave", label: "Leave" },
    { id: "Payroll", label: "Payroll" },
    { id: "Performance", label: "Performance" },
    { id: "Transfers", label: "Transfers" },
    { id: "Offboarding", label: "Exits" },
    { id: "Recruitment", label: "Recruitment" },
    { id: "Reports", label: "Reports" },
  ],
  procurement: [
    { id: "Overview", label: "Overview" },
    { id: "Requests", label: "Requests" },
    { id: "RFQs", label: "RFQs" },
    { id: "POs", label: "POs" },
    { id: "Receiving", label: "Receiving" },
    { id: "Suppliers", label: "Suppliers" },
    { id: "Catalogue", label: "Catalogue" },
    { id: "Reports", label: "Reports" },
  ],
  connect: [
    { id: "Inbox", label: "Inbox" },
    { id: "Tasks", label: "Tasks" },
    { id: "Incidents", label: "Incidents" },
    { id: "Reports", label: "Reports" },
  ],
  engineering: [
    { id: "Maintenance", label: "Maintenance" },
    { id: "Assets", label: "Assets" },
    { id: "Energy", label: "Energy" },
    { id: "Reports", label: "Reports" },
  ],
  security: [
    { id: "Operations", label: "Operations" },
    { id: "Surveillance", label: "Surveillance" },
    { id: "Incidents", label: "Incidents" },
  ],
  iot: [
    { id: "All", label: "All Clusters" },
    { id: "Climate", label: "Climate" },
    { id: "Lighting", label: "Lighting" },
    { id: "Utility", label: "Utility" },
    { id: "Power", label: "Power" },
    { id: "Security", label: "Security" },
  ],
  brand_standards: [
    { id: "main", label: "Main Standard" },
    { id: "documents", label: "Documents" },
    { id: "brand_colors", label: "Brand Colors" },
    { id: "ai_brain", label: "AI Brain" },
  ],
  reputation: [
    { id: "overview", label: "Overview" },
    { id: "reviews", label: "Reviews" },
    { id: "analytics", label: "Analytics" },
  ],
  ai_command_center: [
    { id: "dashboard", label: "Strategic Feed" },
    { id: "config", label: "Neural Settings" },
  ],
  ai_architecture: [
    { id: "overview", label: "Overview" },
    { id: "pipeline", label: "Data Pipeline" },
    { id: "learning", label: "Learning" },
  ],
  builder_studio: [
    { id: "dashboard", label: "Control" },
    { id: "chat", label: "Builder Chat" },
    { id: "roadmap", label: "Roadmap" },
    { id: "guardrails", label: "Guardrails" },
  ],
  night_audit: [
    { id: "Monitor", label: "Monitor" },
    { id: "Analytics", label: "Analytics" },
  ],
  configuration: [...CONFIGURATION_MENU_ITEMS.map((item) => ({ id: item.id, label: item.label }))],
};

export const PLACEHOLDERS = {
  search: "Search...",
  jumpToModule: "Jump to module...",
  guestName: "Guest name",
  guestEmail: "Email",
  guestPhone: "Phone",
} as const;

export const BUTTON_LABELS = {
  reports: "Reports",
  openProcurement: "Open Procurement",
  openFrontDesk: "Open Front Desk",
} as const;
