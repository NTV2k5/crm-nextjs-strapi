export const CACHE_TAGS = {
  CUSTOMERS: "customers",
  DEALS: "deals",
  INVOICES: "invoices",
  customer: (id: string) => "customer-" + id,
  deal: (id: string) => "deal-" + id,
} as const;
