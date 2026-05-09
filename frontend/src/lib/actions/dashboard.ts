"use server";
export async function getDashboardStats() {
  const token = "Bearer " + process.env.STRAPI_API_TOKEN;
  const [customers, deals] = await Promise.all([
    fetch(process.env.STRAPI_URL + "/api/customers?pagination[pageSize]=1", { headers: { Authorization: token } }).then(r => r.json()),
    fetch(process.env.STRAPI_URL + "/api/deals", { headers: { Authorization: token } }).then(r => r.json()),
  ]);
  return { totalCustomers: customers.meta?.pagination?.total ?? 0, activeDeals: deals.data?.length ?? 0 };
}
