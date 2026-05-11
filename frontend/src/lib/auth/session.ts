export async function getServerSession() {
  const { cookies } = await import("next/headers");
  const jwt = (await cookies()).get("jwt")?.value;
  if (!jwt) return null;
  try {
    const res = await fetch(process.env.STRAPI_URL + "/api/users/me?populate=role", {
      headers: { Authorization: "Bearer " + jwt },
      cache: "no-store",
    });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}
