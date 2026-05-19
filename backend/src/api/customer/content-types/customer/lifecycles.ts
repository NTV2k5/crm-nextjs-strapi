export default {
  async afterCreate({ result }: { result: { email?: string; name?: string } }) {
    if (result.email) {
      await fetch((process.env.FRONTEND_URL ?? "") + "/api/emails/welcome", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: result.email, name: result.name }),
      });
    }
  },
};
