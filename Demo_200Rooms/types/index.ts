
// Enums
export enum RoleType {
  GUEST = 'Guest',
  DIRECTOR_OPS = 'Director.Operations',
  GENERAL_MANAGER = 'General Manager',
  STAFF = 'Staff'
}

export enum LoyaltyTier {
  SILVER = 'Silver',
  GOLD = 'Gold',
  PLATINUM = 'Platinum',
  DIAMOND = 'Diamond'
}

export enum RoomStatus {
  CLEAN_READY = 'Clean/Ready',
  OCCUPIED = 'Occupied',
  DIRTY_DEPARTURE = 'Dirty/Departure',
  DIRTY_STAYOVER = 'Dirty/Stayover',
  MINIBAR_PENDING = 'Minibar/Pending',
  MAINTENANCE = 'Maintenance'
}

export enum ReservationStatus {
  CHECKED_IN = 'Checked In',
  CHECKED_OUT = 'Checked Out',
  CONFIRMED = 'Confirmed',
  CANCELLED = 'Cancelled'
}

// Interfaces

export interface UserPreferences {
  temperature?: number;
  halal?: boolean;
  lighting?: string;
  language?: string;
  dietary?: string[];
}

export interface User {
  principal: string;
  role: string | RoleType;
  fullName: string;
  hotelId: string;
  loyaltyTier?: string | LoyaltyTier;
  preferences: UserPreferences;
  valenceHistory: { timestamp: number; score: number }[];
}

export interface Property {
  id: string;
  name: string;
  location: string;
  currency: string;
  taxRate: number;
  timezone: string;
}

export interface RoomAttribute {
  id: string;
  name: string;
  type: 'View' | 'Bed' | 'Feature' | 'Location' | 'Accessibility';
  priceModifier: number; // +/- amount per night
  icon?: string;
}

export interface MaintenanceProfile {
  lastRenovated: number;
  conditionScore: number; // 0-100
  noiseLevel: 'Low' | 'Medium' | 'High';
  features: string[]; // e.g., "Smart TV 2024", "Rain Shower"
  openTickets: number;
}

export interface RoomType {
  id: string;
  name: string;
  description: string;
  baseRate: number;
  maxOccupancy: number;
  defaultAttributes: RoomAttribute[];
  amenities: string[]; // Legacy support
  image: string;
  sizeSqM: number;
}

export interface Room {
  id: string;
  typeId: string;
  number: string;
  status: RoomStatus | string;
  // Advanced Features
  attributes: RoomAttribute[]; // Specific to this room (overrides type defaults)
  connectsTo: string[]; // IDs of physical rooms this connects to
  isVirtual: boolean; // If true, this is a "Suite" composed of other rooms
  componentRoomIds: string[]; // If virtual, which rooms make this up?
  maintenanceProfile: MaintenanceProfile;

  iotStatus: {
    temp: number;
    lights: number;
    doorLocked: boolean;
    carbonFootprint: number; // Feature 15: Sustainability
    humidity: number; // Feature 3: EMS
    occupancyDetected: boolean;
  };
  currentGuestId?: string;
  assignedReservationId?: string;
}

export interface Reservation {
  id: string;
  guestId: string;
  propertyId: string;
  roomId?: string;
  roomTypeId: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children: number;
  status: ReservationStatus | string;
  folioId: string;
  rateApplied: number;
  noShowProbability: number;
  paymentMethod: string;
  accompanyingGuests: string[];

  // Phase 1.5 - Advanced Reservation Features
  marketCode?: string;
  sourceCode?: string;
  channel?: string;
  guaranteeType?: 'CC' | 'Deposit' | 'Non-Guaranteed' | 'Company';
  routingInstructions?: {
    type: 'Room&Tax' | 'All' | 'Incidental';
    targetId: string; // Master Folio ID or Company ID
  }[];
  traces?: Trace[];
  alerts?: ReservationAlert[];
  blockId?: string; // If part of a Business Block
  history?: {
    date: string;
    action: string;
    user: string;
    details: string;
  }[];
}

export interface Trace {
  id: string;
  department: string; // e.g., 'Housekeeping', 'Front Desk'
  date: string;       // Action date
  time?: string;      // Action time
  text: string;       // Instructions
  status: 'Pending' | 'Resolved';
  resolvedBy?: string;
  resolvedAt?: string;
}

export interface ReservationAlert {
  id: string;
  type: 'Check-In' | 'Check-Out' | 'In-House' | 'VIP' | 'Security' | 'Critical';
  message: string;
  severity: 'High' | 'Medium' | 'Low';
  isActive?: boolean;
}

export interface BusinessBlock {
  id: string;
  code: string;       // Block Code
  name: string;       // Group Name
  status: 'Definite' | 'Tentative' | 'Prospect' | 'Cancelled';
  startDate: string;
  endDate: string;
  cutoffDate: string;
  masterFolioId: string;
  companyId?: string;
  contactName: string;
  contactEmail: string;
  contractedRates: Record<string, number>; // roomTypeId -> rate
  roomAllocations: Record<string, Record<string, number>>; // date -> roomTypeId -> count
}


export interface FolioCharge {
  id: string;
  category: string;
  description: string;
  amount: number;
  timestamp: number;
  // Audit fields for POS-PMS integration
  businessDate?: string;
  outletId?: string;
  posOrderId?: string;
  serverName?: string;
  coverCount?: number;
}

export interface Folio {
  id: string;
  reservationId: string;
  charges: FolioCharge[];
  balance: number;
  status: 'Open' | 'Closed';
}

// ============================================================
// PHASE 9: UNIFIED LEDGER & BI ENGINE (Reporting Foundation)
// ============================================================

export interface GLAccount {
  id: string;
  code: string; // e.g. "1001" for Cash, "4001" for Room Revenue
  name: string;
  type: 'Asset' | 'Liability' | 'Equity' | 'Revenue' | 'Expense';
  subType?: string; // e.g. "Current Asset", "F&B Revenue"
  balance: number; // Running balance
}

export interface LedgerEntry {
  id: string;
  transactionId: string; // Links all debits/credits for a single event together
  date: number; // Unix timestamp
  businessDate: string; // The hotel's logical operating day (YYYY-MM-DD)

  // The Accounting
  accountId: string; // Refers to GLAccount.id
  accountCode: string; // GL Code
  debit: number;
  credit: number;

  // Dimensions for BI slicing
  departmentId?: string; // 'FrontDesk', 'F&B', 'Spa'
  outletId?: string; // Specific POS outlet
  userId?: string; // Who triggered it
  reservationId?: string; // If tied to a specific guest
  posOrderId?: string; // If tied to a specific meal/drink

  description: string;
  moduleSource: 'PMS' | 'POS' | 'Procurement' | 'Events' | 'Payroll' | 'Manual';
}

export interface HousekeepingTask {
  id: string;
  roomId: string;
  type: string;
  status: string;
  assignedTo?: string;
}

// POS & F&B
export interface Outlet {
  id: string;
  name: string;
  type: 'Restaurant' | 'Bar' | 'RoomService' | 'Retail' | 'PoolBar';
  seatingCapacity: number;
  // Extended onboarding fields
  description?: string;
  operatingHours?: { open: string; close: string };
  taxRate?: number;       // e.g. 0.10 for 10%
  gratuityRate?: number;  // e.g. 0.15 for 15%
  kdsEnabled?: boolean;
  color?: string;         // accent color for POS UI
  isActive?: boolean;
}

export interface MenuItem {
  id: string;
  outletId: string;
  name: string;
  price: number;
  category: string;
  isHalal: boolean;
  isVegan: boolean;
  allergens: string[];
  department: 'Food' | 'Beverage' | 'Amenity';
  image?: string;
  // Cost & inventory depletion
  ingredients?: { ingredientId: string; qty: number; unit: string; costImpact: number }[];
  foodCost?: number;       // total cost per serving
  foodCostPct?: number;    // food cost % at selling price
  recipeDraftId?: string;  // source draft that generated this item
}

export interface OrderItem {
  menuItemId: string;
  name: string;
  qty: number;
  price: number;
  modifiers?: string[];
  department: 'Food' | 'Beverage' | 'Amenity';
  comment?: string;
  status?: 'Pending' | 'Sent' | 'New' | 'Void';
  firedAt?: number;
  course?: 'Starter' | 'Main' | 'Dessert' | 'Beverage'; // Course for staggered firing
  seatNumber?: number; // Seat-based ordering
  voidedBy?: string; // Staff who voided this item
  voidReason?: string; // Reason for voiding
  // Cost Tracking
  foodCost?: number;
  grossProfit?: number;
  foodCostPct?: number;
}

export interface Table {
  id: string;
  number: string;
  seats: number;
  status: 'Available' | 'Occupied' | 'Reserved' | 'Dirty';
  currentOrderId?: string;
  serverId?: string;   // Assigned server
  guestCount?: number; // Number of guests
  outletId?: string;   // Which outlet this table belongs to
  section?: string;    // Section within the outlet (e.g. 'Main Floor', 'Terrace')
}

export interface PosOrder {
  id: string;
  outletId: string;
  tableId?: string;
  roomId?: string;
  items: OrderItem[];
  status: 'Sent' | 'Ready' | 'Served' | 'Paid' | 'Void' | 'Partially Paid';
  total: number;
  subtotal: number;
  discountAmount: number;
  discountType?: 'Percent' | 'Amount';
  discountValue?: number;
  timestamp: number;
  tips?: number;
  paymentMethod?: 'Card' | 'Cash' | 'App' | 'RoomPost' | 'Voucher' | 'CityLedger';
  cardType?: 'Visa' | 'MasterCard' | 'Amex';
  settlementTimestamp?: number;
  connectSection?: 'IRD' | 'Standard' | 'VIP'; // For routing IRD requests
  pmsTransactionId?: string; // Link to Folio Charge
  voidReason?: string;
  // Enhanced POS Fields
  serverId?: string; // Assigned server
  shiftId?: string; // Shift this order belongs to
  openedBy?: string; // Staff who opened the check
  voidedBy?: string; // Staff who voided
  voidApprovedBy?: string; // Supervisor who approved void
  transferHistory?: { fromTableId: string; toTableId: string; timestamp: number; by: string }[];
  refireCount?: number; // Number of times refired
  guestCount?: number; // Number of guests
  orderType?: 'DineIn' | 'TakeAway' | 'Delivery' | 'RoomService';
  auditLog?: { action: string; by: string; timestamp: number; details?: string }[];
}

// Duplicate Reservation removed
// Duplicate GLAccount removed

export interface Supplier {
  id: string;
  name: string;
  category: 'Food' | 'Beverage' | 'Operating Supplies' | 'Services';
  rating: number;
  paymentTerms: string;
  currency: string;
  complianceFlags: {
    halal: boolean;
    zatca: boolean;
    sustainable: boolean;
    isoCertified: boolean;
  };
  contactEmail: string;
  historicalPerformance: any[];
}

export interface PurchaseOrder {
  id: string;
  rfqId?: string;
  supplierId: string;
  items: { description: string; qty: number; unit: string; cost: number; total: number }[];
  total: number;
  currency: string;
  status: 'Sent' | 'Received' | 'Partially Received' | 'Draft';
  dateIssued: number;
  expectedDelivery: number;
  complianceChecked: boolean;
  ePoFlag: boolean;
}

export interface ProcurementRequest {
  id: string;
  requesterId: string;
  department: string;
  items: { description: string; qty: number; unit: string; estimatedCost: number }[];
  status: 'Pending Approval' | 'Approved' | 'Rejected';
  dateRequested: number;
  priority: 'Low' | 'Medium' | 'High' | 'Emergency';
  notes?: string;
  aiSuggested?: boolean;
}

export interface RFQ {
  id: string;
  requestId: string;
  items: { description: string; qty: number; unit: string }[];
  invitedSuppliers: string[];
  bids: Bid[];
  status: 'Open' | 'Closed';
  deadline: number;
  dateIssued: number;
}

export interface Bid {
  supplierId: string;
  amount: number;
  date: number;
}

export interface Receipt {
  id: string;
  poId: string;
  date: number;
  itemsReceived: any[];
}

export interface Recipe {
  id: string;
  name: string;
  ingredients: { ingredientId: string; qty: number }[];
}

export interface Ingredient {
  id: string;
  itemCode: string;
  name: string;
  unit: string;
  costPerUnit: number;
  supplierId: string;
  isHalal: boolean;
  allergens: string[];
  traceabilityLog: string;
}

export interface RecipeDraft {
  id: string;
  menuItemId?: string; // Linked Menu Item (set after approval)
  name: string;
  version: number;
  createdBy: string;
  createdAt: number;
  category: string;
  status: 'Draft' | 'Pending Approval' | 'Approved' | 'Rejected';
  ingredients: { ingredientId: string; qty: number; unit: string; costImpact: number }[];
  totalCost: number;
  laborCost: number;
  overheadCost: number;
  suggestedPrice: number;
  projectedMargin: number;
  complianceFlags: { halal: boolean };
  aiSuggestions: string[];
  approvedBy?: string;
  approvedAt?: number;
  rejectionNote?: string;  // Feedback when rejected
  outletIds?: string[];    // Which outlets this recipe is available in
  prepTime?: number;
  cookTime?: number;
  allergens?: string[];
  dietaryTags?: string[];
}

export interface MasterInventoryItem {
  id: string;
  sku: string;
  name: string;
  category: string;
  unit: string;
  costPerUnit: number;
  totalStock: number;
  parLevel: number;
  reorderPoint: number;
  locations: { locationId: string; locationName: string; stock: number }[];
}

// HR Models
export interface EmployeeProfile {
  principal: string;
  fullName: string;
  role: string;
  nationality: string;
  hourlyRate: number;
  overtimeRate: number;
  skills: { name: string; score: number }[];
  performanceScore: number;
  aiPerformanceScore?: number;
  performanceFeedback?: string[];
  status: 'Active' | 'OnLeave' | 'Terminated';
  trainingProgress?: { moduleId: string; status: 'Pending' | 'In Progress' | 'Completed'; score?: number }[];
}

export interface Candidate {
  id: string;
  name: string;
  roleApplied: string;
  stage: 'Applied' | 'Screening' | 'Interview' | 'Offer' | 'Hired';
  matchScore: number; // AI Score
  resumeUrl?: string;
  notes: string;
  appliedDate: number;
}

export interface TrainingModule {
  id: string;
  title: string;
  category: 'Service' | 'Compliance' | 'Technical' | 'Soft Skills';
  duration: number; // minutes
  assignedToRoles: string[];
  aiGeneratedContent: boolean;
  completionRate: number;
}

export interface Shift {
  id: string;
  employeeId: string;
  start: string;
  end: string;
  actualStart?: string;
  actualEnd?: string;
  status: 'Scheduled' | 'ClockedIn' | 'Completed' | 'Absent';
  department: string;
}

export interface PayrollRun {
  id: string;
  employeeId: string;
  periodStart: string;
  periodEnd: string;
  basePay: number;
  overtimePay: number;
  tips: number;
  deductions: number;
  netPay: number;
  status: 'Draft' | 'Approved' | 'Paid';
}

// PMS - REVENUE MANAGEMENT EXPANSION
export interface YieldRule {
  id: string;
  name: string;
  condition: { metric: string; operator: string; value: number };
  action: { adjustmentType: string; valueType: string; value: number };
  isActive: boolean;
  aiConfidence?: number;
}

export interface BEOAgendaItem {
  id: string;
  timeStart: string; // HH:mm format
  timeEnd: string;
  title: string;
  departmentResponsibility: 'Banquet' | 'AV' | 'Kitchen' | 'FrontDesk' | 'All';
  isCompleted: boolean;
}

export interface BEOFoodItem {
  recipeId: string;
  quantity: number;
  serveTime: string;
  specialRequests?: string;
}

// ---------------- NEW: EVENTS & CATERING (Replacing Salesforce/Delphi) ----------------
export interface BanquetEvent {
  id: string;
  name: string;
  clientName: string;
  type: 'Wedding' | 'Conference' | 'Gala' | 'Meeting';
  startDate: string;
  endDate: string;
  pax: number;
  venueId: string;
  status: 'Tentative' | 'Definite' | 'Actualized' | 'Cancelled';
  totalValue: number;
  bfeoUrl?: string; // Digital BEO
  agenda?: BEOAgendaItem[];
  foodAndBeverage?: BEOFoodItem[];
  setupStyle?: 'Classroom' | 'Theater' | 'Banquet' | 'U-Shape' | 'Custom';
  isAIGenerated?: boolean;
}

// ---------------- NEW: ENGINEERING & ASSETS (Replacing HotSOS/TMS) ----------------
export interface Asset {
  id: string;
  name: string;
  category: 'HVAC' | 'Plumbing' | 'Electrical' | 'FF&E';
  location: string;
  installDate: number;
  warrantyEnd: number;
  healthScore: number; // IoT Driven
  nextServiceDate: number;
}

export interface MaintenanceTask {
  id: string;
  assetId: string;
  type: 'Preventive' | 'Corrective';
  description: string;
  priority: 'Low' | 'Medium' | 'High';
  status: 'Open' | 'In Progress' | 'Completed';
  technicianId?: string;
}

// ---------------- NEW: SECURITY & VISITORS (Replacing Proxyclick) ----------------
export interface Visitor {
  id: string;
  fullName: string;
  hostEmployeeId: string;
  purpose: string;
  checkInTime: number;
  checkOutTime?: number;
  status: 'On Site' | 'Checked Out';
  badgeNumber?: string;
}

// ---------------- COMMUNICATION & INCIDENTS ----------------

export type Priority = 'Low' | 'Medium' | 'High' | 'Critical' | 'Urgent';

export interface CommsMessage {
  id: string;
  senderId: string; // Principal
  receiverId: string; // Principal or Group ID
  type: 'Chat' | 'Email' | 'Alert';
  content: string;
  attachments?: string[]; // URLs
  timestamp: number;
  read: boolean;
  threadId?: string;
}

export type TaskDepartment = 'Housekeeping' | 'MiniBar' | 'IRD' | 'Concierge' | 'Maintenance' | 'General' | 'Kitchen' | 'Bar' | 'Security' | 'Events';

export interface Task {
  id: string;
  title: string;
  description: string;
  department: TaskDepartment; // Routing Logic
  assigneeId?: string; // Principal, initially null if auto-delegated to pool
  delegatorId: string; // Principal
  acceptedBy?: string; // Staff member who accepted the request
  priority: Priority;
  status: 'Open' | 'In Progress' | 'Done' | 'Blocked';
  dueDate: number;
  aiSuggested: boolean;
  linkedIncidentId?: string;
}

export interface Incident {
  id: string;
  type: 'Guest Complaint' | 'Food Safety' | 'Maintenance' | 'Security' | 'Staff Injury';
  description: string;
  reportedBy: string;
  priority: Priority;
  status: 'Reported' | 'Investigating' | 'Resolved' | 'Closed';
  resolutionNotes?: string;
  timestamp: number;
  costImpact?: number; // e.g., Compensation
  complianceFlags: {
    pdpl: boolean; // Bahrain Data Privacy
    zatca: boolean; // Financial impact logged
  };
  aiRouting?: string; // "Auto-routed to Engineering"
}

// For Dashboard Analytics
export interface KPI {
  label: string;
  value: string | number;
  trend: number; // Percentage change
  unit?: string;
}

// Chat Message for AI Concierge
export interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: number;
  valence?: number; // AI detected sentiment of user message
}

// AI SUGGESTIONS MODULE
export interface Suggestion {
  id: string;
  sourceId: string; // The bot ID (Guest or Staff principal)
  sourceName: string;
  role: 'Guest Bot' | 'Staff Bot';
  type: 'Error Report' | 'Improvement' | 'Feature Request';
  module: 'POS' | 'PMS' | 'Housekeeping' | 'General' | 'App';
  content: string; // The actual suggestion
  technicalDetails?: string; // "Latency > 200ms on /api/orders"
  priority: 'Low' | 'Medium' | 'High';
  status: 'New' | 'Analyzing' | 'Implemented' | 'Ignored';
  timestamp: number;
}

// Brand Standards Types
export interface BrandDocument {
  id: string;
  category: 'asset' | 'license' | 'guideline' | 'sop' | 'agreement' | 'job_description' | 'system_doc';
  title: string;
  description: string;
  fileUrl: string;
  fileType: string; // 'pdf', 'image', 'video', 'doc'
  version: string;
  uploadedBy: string;
  uploadedAt: string;
  status: 'draft' | 'pending_review' | 'approved' | 'archived';
  metadata: Record<string, any>;
  tags?: string[];
}

export interface BrandChange {
  id: string;
  documentId: string;
  changeType: 'new' | 'updated' | 'deleted';
  detectedChanges: string[];
  suggestedSystemChanges?: string[];
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedAt?: string;
  notes?: string;
}


// ---------------- ORACLE AI BACKEND ----------------

export interface OracleContext {
  moduleId: string;
  fieldId?: string;
  currentValue?: any;
  dependencies?: string[];
}

export interface OracleAnalysisResponse {
  analysis: string;
  proposedChanges: {
    target: string;
    action: string;
    value: any;
  }[];
  affectedModules: string[];
  riskLevel: 'Low' | 'Medium' | 'High';
  diagnostics?: string;
}

export interface SystemConfigurationMap {
  modules: {
    [key: string]: {
      name: string;
      config: { [key: string]: any };
      dependencies: string[];
    };
  };
  flows: {
    [key: string]: {
      source: string;
      trigger: string;
      target: string;
      action: string;
    };
  };
}

// POS Shift Management
export interface POSShift {
  id: string;
  outletId: string;
  staffId: string;
  staffName: string;
  openedAt: number;
  closedAt?: number;
  status: 'Open' | 'Closed';
  openingFloat: number; // Starting cash
  closingFloat?: number;
  expectedCash?: number;
  actualCash?: number;
  variance?: number;
  totalSales: number;
  totalVoids: number;
  totalDiscounts: number;
  transactionCount: number;
}

// POS Role Permissions
export interface POSPermissions {
  canVoidItems: boolean;
  canVoidOrders: boolean;
  canApplyDiscount: boolean;
  maxDiscountPercent: number;
  canTransferTable: boolean;
  canRefund: boolean;
  canAccessReports: boolean;
  canManageMenu: boolean;
  canOpenCloseShift: boolean;
  canOverridePrice: boolean;
  requiresApprovalForVoid: boolean;
  requiresApprovalForHighDiscount: boolean;
  highDiscountThreshold: number; // Percentage above which approval needed
}

// POS Audit Entry
export interface POSAuditEntry {
  id: string;
  orderId?: string;
  shiftId?: string;
  action: 'ORDER_CREATED' | 'ORDER_SENT' | 'ORDER_VOID' | 'ITEM_VOID' | 'DISCOUNT_APPLIED' | 'PAYMENT_RECEIVED' | 'TABLE_TRANSFER' | 'REFIRE' | 'SHIFT_OPEN' | 'SHIFT_CLOSE' | 'PRICE_OVERRIDE';
  performedBy: string;
  approvedBy?: string; // For actions requiring supervisor approval
  timestamp: number;
  details: string;
  previousValue?: any;
  newValue?: any;
}


// ---------------- NEW: FINANCE EXPANSION (AP & Cashier) ----------------

export interface Invoice {
  id: string;
  supplierId: string;
  amount: number;
  date: number; // Received Date
  dueDate: number;
  status: 'Received' | 'Approved' | 'Paid' | 'Overdue';
  glAccountId: string; // Expense Category
  notes?: string;
  poId?: string; // Linked Purchase Order
}

export interface CashierDrop {
  id: string;
  cashierId: string; // Employee Principal
  shiftId: string;
  declaredCash: number;
  systemCash: number; // From POS
  variance: number; // Declared - System
  notes: string;
  status: 'Pending' | 'Verified' | 'Investigating';
  timestamp: number;
  verifiedBy?: string;
}

// ============================================================
// HR MODULE — ADVANCED TYPES (World-Class Hotel HR System)
// ============================================================

export interface Permission {
  module: 'POS' | 'HR' | 'Rooms' | 'Accounts' | 'Config' | 'Procurement' | 'Events' | 'Reports' | 'Engineering' | 'Security' | 'IoT' | 'Brand' | 'AI';
  action: 'view' | 'create' | 'edit' | 'delete' | 'approve' | 'export';
  scope: 'own' | 'department' | 'outlet' | 'property' | 'all';
}

export interface SystemRole {
  id: string;
  name: string;
  description: string;
  permissions: Permission[];
  isSystemDefault: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface PayGrade {
  id: string;
  name: string;
  minSalary: number;
  maxSalary: number;
  currency: string;
  overtimeMultiplier: number;
  nightDifferential?: number;
  holidayMultiplier?: number;
}

// ------------------- Advanced Rostering Types -------------------


export interface JobDescription {
  id: string;
  title: string;
  departmentId: string;
  costCenterId: string;
  systemRoleId: string;
  payGradeId: string;
  contractTypes: ('Full-time' | 'Part-time' | 'Seasonal' | 'Contractor')[];
  headcountBudget: number;
  headcountFilled: number;
  responsibilities: string[];
  minRequirements: string[];
  kpis: { name: string; target: string; unit: string }[];
  careerPathNextId?: string;
  careerPathPrevId?: string;
  isActive: boolean;
  createdAt: number;
}

export interface AuditLogEntry {
  field: string;
  oldValue: any;
  newValue: any;
  changedBy: string;
  changedAt: number;
  reason: string;
  effectiveDate?: number;
}

export interface PromotionRecord {
  id: string;
  fromJobId: string;
  toJobId: string;
  fromRole: string;
  toRole: string;
  fromSalary: number;
  toSalary: number;
  effectiveDate: number;
  approvedBy: string;
  reason: string;
  timestamp: number;
}

export interface SalaryChangeRecord {
  id: string;
  oldSalary: number;
  newSalary: number;
  reason: 'Annual Increment' | 'Promotion' | 'Market Adjustment' | 'Correction' | 'Other';
  effectiveDate: number;
  approvedBy: string;
  timestamp: number;
}

export interface TransferRecord {
  id: string;
  fromDepartmentId: string;
  toDepartmentId: string;
  fromCostCenterId: string;
  toCostCenterId: string;
  fromPropertyId?: string;
  toPropertyId?: string;
  transferType: 'Internal' | 'Property' | 'Secondment';
  effectiveDate: number;
  endDate?: number;
  reason: string;
  gratuityImpact: 'Continue' | 'Settle';
  gratuityAmountIfSettled?: number;
  approvedBy: string;
  timestamp: number;
}

export interface CrossTraining {
  id: string;
  employeeId: string;
  targetRoleId: string;
  targetRoleName: string;
  trainerId: string;
  trainerName: string;
  startDate: number;
  targetDate: number;
  completedDate?: number;
  modules: { name: string; completedAt?: number; signedOff?: boolean }[];
  completionPct: number;
  status: 'In Progress' | 'Completed' | 'Cancelled';
  coverageEligible: boolean;
}

export interface StaffMember {
  // Identity
  id: string;
  principal: string;
  employeeId: string;
  fullName: string;
  photo?: string;
  nationality: string;
  dateOfBirth?: number;
  gender?: 'Male' | 'Female' | 'Other' | 'Prefer not to say';
  phone?: string;
  email?: string;
  address?: string;
  emergencyContact?: { name: string; relationship: string; phone: string };
  idNumber?: string;
  idExpiry?: number;
  workPermitExpiry?: number;

  // Employment
  jobDescriptionId: string;
  jobTitle: string;
  departmentId: string;
  departmentName: string;
  costCenterId: string;
  payGradeId: string;
  systemRoleId: string;
  contractType: 'Full-time' | 'Part-time' | 'Seasonal' | 'Contractor';
  hireDate: number;
  probationEndDate?: number;
  confirmationDate?: number;
  reportingManagerId?: string;

  // Pay
  basicSalary: number;
  currency: string;
  hourlyRate: number;
  overtimeRate: number;
  allowances?: { name: string; amount: number }[];

  // Status & Lifecycle
  status: 'Active' | 'OnLeave' | 'Suspended' | 'Terminated' | 'Alumni';
  exitType?: 'Resignation' | 'Termination' | 'EndOfContract' | 'Retirement';
  exitDate?: number;
  lastWorkingDay?: number;
  exitReason?: string;
  exitInterviewNotes?: string;
  rehireEligible?: boolean;
  noticePeriodDays?: number;

  // Career History (append-only)
  promotionHistory: PromotionRecord[];
  salaryHistory: SalaryChangeRecord[];
  transferHistory: TransferRecord[];

  // Performance
  performanceScore: number;
  aiPerformanceScore?: number;
  performanceFeedback?: string[];
  lastReviewDate?: number;
  nextReviewDate?: number;

  // Skills & Training
  skills: { name: string; score: number; certifiedAt?: number; expiresAt?: number }[];
  crossTrainedRoleIds: string[];
  certifications: { name: string; issuedAt: number; expiresAt?: number; fileUrl?: string }[];
  trainingProgress?: { moduleId: string; status: 'Pending' | 'In Progress' | 'Completed'; score?: number }[];

  // Gratuity
  gratuityStartDate: number;
  accruedGratuity?: number;

  // Audit
  auditLog: AuditLogEntry[];
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  type: 'Annual' | 'Sick' | 'Emergency' | 'Maternity' | 'Paternity' | 'Unpaid' | 'Public Holiday';
  startDate: number;
  endDate: number;
  daysRequested: number;
  reason?: string;
  status: 'Pending' | 'Approved' | 'Rejected' | 'Cancelled';
  approvedBy?: string;
  approvedAt?: number;
  rejectionNote?: string;
  submittedAt: number;
  isPaid: boolean;
  payImpact?: number;
}

export interface LeaveBalance {
  employeeId: string;
  annual: { entitled: number; used: number; pending: number; remaining: number };
  sick: { entitled: number; used: number; remaining: number };
  unpaid: { used: number };
  year: number;
  lastUpdated: number;
}

export interface AttendanceLog {
  id: string;
  employeeId: string;
  shiftId?: string;
  date: number;
  scheduledStart?: string;
  scheduledEnd?: string;
  actualClockIn?: number;
  actualClockOut?: number;
  totalHoursWorked?: number;
  regularHours?: number;
  overtimeHours?: number;
  status: 'Present' | 'Late' | 'Absent' | 'OnLeave' | 'Holiday' | 'Off';
  lateMinutes?: number;
  notes?: string;
  manualOverride?: boolean;
  overrideBy?: string;
  overrideReason?: string;
}

export interface ShiftPattern {
  id: string;
  name: string;
  startTime: string; // e.g., "08:00"
  endTime: string; // e.g., "17:00"
  breakDurationMinutes: number;
  totalHours: number;
}

export interface RosterShift {
  id: string;
  employeeId: string;
  shiftPatternId: string;
  date: number; // Timestamp for the day
  actualStartTime?: number; // Timestamp
  actualEndTime?: number; // Timestamp
  status: 'Scheduled' | 'Clocked In' | 'Clocked Out' | 'Missed' | 'On Leave';
  notes?: string;
}

export interface Deduction {
  name: string;
  amount: number;
  type: 'Fixed' | 'Percentage';
  isRecurring: boolean;
}

export interface Benefit {
  name: string;
  amount: number;
  taxable: boolean;
}

export interface PayrollEntry {
  employeeId: string;
  employeeName: string;
  jobTitle: string;
  costCenterId: string;
  departmentName: string;
  basicPay: number;
  overtimePay: number;
  holidayPay: number;
  tips: number;
  serviceChargeShare: number;
  allowances: number;
  grossPay: number;
  deductions: Deduction[];
  totalDeductions: number;
  benefits?: Benefit[];
  taxJurisdiction?: string;
  taxRate?: number;
  netPay: number;
  gratuityAccrued: number;
  isFinalPay?: boolean;
  finalSettlement?: FinalSettlement;
  // End of payroll entry
}

export interface FinalSettlement {
  employeeId: string;
  regularPay: number;
  unusedLeavePayout: number;
  gratuityAmount: number;
  noticePay: number;
  deductions: number;
  totalNet: number;
  gratuityFormula: string;
  calculatedAt: number;
}

export interface FullPayrollRun {
  id: string;
  period: string;
  periodStart: number;
  periodEnd: number;
  propertyId: string;
  status: 'Draft' | 'Under Review' | 'Approved' | 'Locked' | 'Posted';
  entries: PayrollEntry[];
  totalHeadcount: number;
  totalGross: number;
  totalDeductions: number;
  totalNetPay: number;
  totalGratuityAccrued: number;
  totalOvertimeCost: number;
  totalTipsDistributed: number;
  glPosted: boolean;
  glPostingTimestamp?: number;
  glEntries?: { accountId: string; debit?: number; credit?: number; description: string }[];
  createdBy: string;
  approvedBy?: string;
  approvedAt?: number;
  lockedAt?: number;
  submittedAt: number;
}

export interface GratuityRecord {
  employeeId: string;
  basicSalary: number;
  dailyRate: number;
  yearsServed: number;
  daysEarned: number;
  grossGratuity: number;
  percentageApplicable: number;
  netGratuity: number;
  formula: string;
  calculatedAt: number;
}

export interface PerformanceReview {
  id: string;
  employeeId: string;
  employeeName: string;
  reviewerId: string;
  reviewerName: string;
  reviewType: 'Probation' | 'Annual' | 'Mid-Year' | 'Promotion' | 'PIP';
  period: string;
  reviewDate: number;
  kpiScores: { kpiName: string; target: string; actual: string; score: number }[];
  behaviouralRatings: { competency: string; rating: 1 | 2 | 3 | 4 | 5 }[];
  overallRating: 'Exceeds Expectations' | 'Meets Expectations' | 'Needs Improvement' | 'Unsatisfactory';
  overallScore: number;
  managerNotes: string;
  nineBoxPerformance: 'High' | 'Medium' | 'Low';
  nineBoxPotential: 'High' | 'Medium' | 'Low';
  promotionRecommended: boolean;
  promotionReadinessScore: number;
  developmentPlan?: string;
  guestSatisfactionScore?: number;
  upsellConversionRate?: number;
  attendanceScore?: number;
  status: 'Draft' | 'Submitted' | 'Staff Acknowledged';
  acknowledgedAt?: number;
}

export interface OffboardingTask {
  id: string;
  title: string;
  assignedTo: 'HR' | 'IT' | 'Manager' | 'Finance' | 'Operations';
  dueDate: number;
  completedAt?: number;
  completedBy?: string;
  status: 'Pending' | 'Completed' | 'Overdue';
}

export interface OffboardingChecklist {
  id: string;
  employeeId: string;
  employeeName: string;
  exitType: 'Resignation' | 'Termination' | 'EndOfContract' | 'Retirement';
  lastWorkingDay: number;
  noticePeriodServed: boolean;
  initiatedAt: number;
  initiatedBy: string;
  hrTasks: OffboardingTask[];
  itTasks: OffboardingTask[];
  opsTasks: OffboardingTask[];
  financeTasks: OffboardingTask[];
  finalSettlement?: FinalSettlement;
  status: 'In Progress' | 'Completed';
  accessRevoked: boolean;
  accessRevokedAt?: number;
  alumniArchived: boolean;
}

// ============================================================
// REVENUE & DISTRIBUTION MODULE (Phase 3)
// ============================================================

export interface PackageInclusion {
  id: string;
  name: string; // e.g., "Breakfast", "Spa Credit"
  amount: number;
  calculationRule: 'Per Person' | 'Per Room' | 'Per Stay';
  routingCode: string; // e.g., "F&B_REV", "SPA_REV"
}

export interface RatePlan {
  id: string;
  code: string; // e.g., "BAR", "ADV"
  name: string;
  description: string;
  baseRateAmount: number; // For flat Base rates
  currency: string;
  type: 'Base' | 'Derived';
  derivedFromId?: string; // e.g., matches "BAR"
  derivedAdjustmentType?: 'Percentage' | 'Flat';
  derivedAdjustmentValue?: number; // e.g., -10 for 10% off
  inclusions: PackageInclusion[];
  cancellationPolicy: 'Non-Refundable' | 'Flexible 24h' | 'Flexible 48h' | 'Flexible 6pm';
  guaranteeType: 'Credit Card' | 'Deposit' | 'Company' | 'None';
  isActive: boolean;
}

export * from "./contracts";
