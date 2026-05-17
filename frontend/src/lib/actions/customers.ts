"use server";
interface CustomerAttr { name: string; email: string; phone: string; status: string }
interface CustomerItem { attributes: CustomerAttr }
export async function exportCustomersCSV(filters: Record<string, string>) {
  const params = new URLSearchParams(filters);
  const res = await fetch(process.env.STRAPI_URL + "/api/customers?" + params + "&pagination[pageSize]=500", {
    headers: { Authorization: "Bearer " + process.env.STRAPI_API_TOKEN },
  });
  const { data } = await res.json();
  const csv = ["Name,Email,Phone,Status", ...data.map((c: CustomerItem) =>
    [c.attributes.name, c.attributes.email, c.attributes.phone, c.attributes.status].join(",")
  )].join("\n");
  return csv;
}
