export default {
  async afterCreate({ result }: { result: { email?: string; name?: string } }) {
    if (result.email && process.env.FRONTEND_URL) {
      try {
        await fetch(`${process.env.FRONTEND_URL}/api/emails/welcome`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: result.email, name: result.name }),
        });
      } catch (error) {
        console.error("Failed to send welcome email:", error);
      }
    }
  },
};
