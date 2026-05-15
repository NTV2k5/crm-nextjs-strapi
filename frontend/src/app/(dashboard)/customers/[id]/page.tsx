export default async function CustomerDetailPage({ params }: { params: { id: string } }) {
  const res = await fetch(process.env.STRAPI_URL + "/api/customers/" + params.id + "?populate=*", {
    headers: { Authorization: "Bearer " + process.env.STRAPI_API_TOKEN },
    next: { tags: ["customer-" + params.id] },
  });
  const { data } = await res.json();
  return (
    <div>
      <h1>{data?.attributes?.name}</h1>
      <p>{data?.attributes?.email}</p>
    </div>
  );
}
