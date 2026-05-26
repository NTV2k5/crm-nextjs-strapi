interface CustomerFilters { status?: string; search?: string }
export async function fetchCustomers(filters?: CustomerFilters) {
  const params = new URLSearchParams();
  if (filters?.status) params.append("filters[status][$eq]", filters.status);
  if (filters?.search) params.append("filters[name][$containsi]", filters.search);
  const res = await fetch("/api/customers?" + params.toString());
  if (!res.ok) throw new Error("Failed to fetch customers");
  return res.json();
}
