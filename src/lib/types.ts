export const ROLES = ["admin", "presupuestador", "bodega", "consulta"] as const;
export type Role = (typeof ROLES)[number];

export type Origin = "EP" | "NP" | "ND";
export type YieldMode = "rubro" | "insumo";
export type MinorToolMode = "global" | "rubro";
export type PriceScheme = "chamber" | "personal";
export type IndirectPrevail = "general" | "breakdown";
export type LineKind = "material" | "labor" | "equipment" | "transport" | "auxiliary";
export type IndirectGroup = "office" | "site" | "misc" | "tax" | "financial" | "contingency";
export type IndirectMode =
  | "monthly"
  | "total"
  | "percent_contract"
  | "percent_readjustment"
  | "percent_capital"
  | "percent_subtotal"
  | "financial";

export type UserRow = { id: string; email: string; full_name: string; password_hash: string; created_at: string };
export type Profile = { id: string; email: string; full_name: string; created_at: string };
export type Organization = { id: string; name: string; created_at: string };
export type Membership = { id: string; org_id: string; user_id: string; role: Role };
export type Invitation = { id: string; org_id: string; email: string; role: Role; token: string; created_at: string; accepted_at: string };
export type ProjectMember = { id: string; org_id: string; project_id: string; user_id: string };

export type Unit = { id: string; org_id: string; code: string; name: string };
export type UnitConversion = { id: string; org_id: string; from_qty: string; from_unit: string; to_qty: string; to_unit: string };
export type City = { id: string; org_id: string; name: string };
export type Supplier = { id: string; org_id: string; city_id: string; name: string; address: string };
export type Material = { id: string; org_id: string; code: string; name: string; unit: string; chamber_price: string; personal_price: string };
export type MaterialSupplier = { id: string; org_id: string; material_id: string; supplier_id: string };
export type Equipment = {
  id: string; org_id: string; code: string; name: string; hourly_chamber: string; hourly_personal: string;
  yield_rate: string; power: string; brand: string; machine_type: string; uses_gasoline: boolean; chamber_code: string;
};
export type LaborCategory = { id: string; org_id: string; code: string; name: string; hourly_chamber: string; hourly_personal: string };
export type TransportRate = { id: string; org_id: string; code: string; name: string; unit: string; rate_chamber: string; rate_personal: string };
export type CatalogChapter = { id: string; org_id: string; code: string; name: string; sort_order: number };
export type RubroType = { id: string; org_id: string; name: string };
export type CatalogRubro = { id: string; org_id: string; chapter_id: string; type_id: string; code: string; name: string; unit: string; yield_rate: string };
export type CatalogLine = {
  id: string; org_id: string; rubro_id: string; kind: LineKind; ref_id: string; code: string; name: string;
  unit: string; quantity: string; origin: Origin; cpc_code: string; sort_order: number;
};
export type PriceSnapshot = { id: string; org_id: string; captured_on: string; note: string };
export type PriceSnapshotLine = {
  id: string; org_id: string; snapshot_id: string; family: string; item_id: string; code: string; name: string;
  chamber_price: string; personal_price: string;
};
export type CpcCode = { id: string; org_id: string; code: string; description: string };
export type VaeThreshold = { id: string; org_id: string; name: string; percent: string; note: string };

export type Project = {
  id: string; org_id: string; name: string; proposed_date: string; proponent: string; owner_name: string;
  calculated_by: string; reviewed_by: string; description: string; province: string; canton: string; parish: string;
  sector: string; address: string; yield_mode: YieldMode; minor_tool_mode: MinorToolMode; minor_tool_percent: string;
  transport_materials: boolean; transport_equipment: boolean; price_scheme: PriceScheme; indirect_percent: string;
  indirect_prevail: IndirectPrevail; contributors_enabled: boolean; vae_threshold_id: string; work_start: string;
  calendar_id: string; created_at: string;
};
export type ProjectChapter = { id: string; org_id: string; project_id: string; name: string; sort_order: number };
export type ProjectRubro = {
  id: string; org_id: string; project_id: string; chapter_id: string; catalog_rubro_id: string; code: string; name: string;
  unit: string; quantity: string; yield_rate: string; is_subcontract: boolean; proposed_value: string; is_auxiliary: boolean;
  minor_tool_percent: string; origin: Origin; rubro_type: string; sort_order: number;
};
export type ProjectLine = {
  id: string; org_id: string; project_id: string; rubro_id: string; kind: LineKind; catalog_id: string;
  auxiliary_rubro_id: string; code: string; name: string; unit: string; quantity: string; unit_price: string;
  cpc_code: string; origin: Origin; sort_order: number;
};
export type Contributor = {
  id: string; org_id: string; project_id: string; company: string; material_percent: string; labor_percent: string;
  equipment_percent: string; transport_percent: string;
};
export type IndirectItemRow = {
  id: string; org_id: string; project_id: string; group_name: IndirectGroup; name: string; enabled: boolean;
  mode: IndirectMode; monthly_cost: string; months: string; direct_total: string; percent: string;
  advance_percent: string; premium_percent: string; guarantee_percent: string; sort_order: number;
};
export type AdjustmentSymbol = {
  id: string; org_id: string; project_id: string; code: string; name: string; family: string; scope: string; sort_order: number;
};
export type SymbolComponent = { id: string; org_id: string; project_id: string; symbol_id: string; line_id: string };
export type PolynomialTerm = { id: string; org_id: string; project_id: string; symbol_id: string; coefficient: string };
export type PriceIndex = { id: string; org_id: string; project_id: string; symbol_id: string; kind: string; period_label: string; value: string };
export type CrewWeight = { id: string; org_id: string; project_id: string; labor_id: string; name: string; weight: string };
export type AdjustmentMemo = { id: string; org_id: string; project_id: string; body: string; author: string; memo_date: string };
export type WorkCalendar = {
  id: string; org_id: string; project_id: string; name: string; mon: string; tue: string; wed: string; thu: string; fri: string; sat: string; sun: string;
};
export type ScheduleGroup = { id: string; org_id: string; project_id: string; name: string; chapter_id: string; sort_order: number };
export type ScheduleTask = {
  id: string; org_id: string; project_id: string; rubro_id: string; group_id: string; start_date: string; duration_days: string; responsible: string;
};
export type ValuedPeriod = { id: string; org_id: string; project_id: string; name: string; start_date: string; end_date: string; sort_order: number };
export type ValuedAllocation = { id: string; org_id: string; project_id: string; period_id: string; rubro_id: string; percent: string; is_subperiod: boolean };
export type WarehouseMovement = {
  id: string; org_id: string; project_id: string; kind: "in" | "out"; material_name: string; rubro_id: string; quantity: string;
  unit_price: string; invoice: string; supplier_name: string; movement_date: string;
};
export type ContractAdvance = { id: string; org_id: string; project_id: string; amount: string; advance_date: string; note: string };
export type Deduction = { id: string; org_id: string; project_id: string; name: string; mode: string; amount: string };
export type PaymentCertificate = {
  id: string; org_id: string; project_id: string; number: number; period_label: string; certificate_date: string; amortization_percent: string;
};
export type CertificateLine = { id: string; org_id: string; project_id: string; certificate_id: string; rubro_id: string; quantity_period: string; quantity_previous: string };
export type CertificateAdjustment = { id: string; org_id: string; project_id: string; certificate_id: string; symbol_id: string; index_period: string; index_base: string };

export type Database = {
  users: UserRow[];
  profiles: Profile[];
  organizations: Organization[];
  organization_members: Membership[];
  invitations: Invitation[];
  project_members: ProjectMember[];
  units: Unit[];
  unit_conversions: UnitConversion[];
  cities: City[];
  suppliers: Supplier[];
  materials: Material[];
  material_suppliers: MaterialSupplier[];
  equipment: Equipment[];
  labor_categories: LaborCategory[];
  transport_rates: TransportRate[];
  catalog_chapters: CatalogChapter[];
  rubro_types: RubroType[];
  catalog_rubros: CatalogRubro[];
  catalog_apu_lines: CatalogLine[];
  price_snapshots: PriceSnapshot[];
  price_snapshot_lines: PriceSnapshotLine[];
  cpc_codes: CpcCode[];
  vae_thresholds: VaeThreshold[];
  projects: Project[];
  project_chapters: ProjectChapter[];
  project_rubros: ProjectRubro[];
  project_apu_lines: ProjectLine[];
  contributors: Contributor[];
  indirect_items: IndirectItemRow[];
  adjustment_symbols: AdjustmentSymbol[];
  symbol_components: SymbolComponent[];
  polynomial_terms: PolynomialTerm[];
  price_indices: PriceIndex[];
  crew_weights: CrewWeight[];
  adjustment_memos: AdjustmentMemo[];
  work_calendars: WorkCalendar[];
  schedule_groups: ScheduleGroup[];
  schedule_tasks: ScheduleTask[];
  valued_periods: ValuedPeriod[];
  valued_allocations: ValuedAllocation[];
  warehouse_movements: WarehouseMovement[];
  contract_advances: ContractAdvance[];
  deductions: Deduction[];
  payment_certificates: PaymentCertificate[];
  certificate_lines: CertificateLine[];
  certificate_adjustments: CertificateAdjustment[];
};

export const TABLE_NAMES = [
  "users", "profiles", "organizations", "organization_members", "invitations", "project_members", "units", "unit_conversions",
  "cities", "suppliers", "materials", "material_suppliers", "equipment", "labor_categories", "transport_rates",
  "catalog_chapters", "rubro_types", "catalog_rubros", "catalog_apu_lines", "price_snapshots", "price_snapshot_lines",
  "cpc_codes", "vae_thresholds", "projects", "project_chapters", "project_rubros", "project_apu_lines", "contributors",
  "indirect_items", "adjustment_symbols", "symbol_components", "polynomial_terms", "price_indices", "crew_weights",
  "adjustment_memos", "work_calendars", "schedule_groups", "schedule_tasks", "valued_periods", "valued_allocations",
  "warehouse_movements", "contract_advances", "deductions", "payment_certificates", "certificate_lines", "certificate_adjustments",
] as const;

export type TableName = (typeof TABLE_NAMES)[number];
