export async function sendSms({
  to,
  message,
}: {
  to: string;
  message: string;
}) {
  // MOCK: Simulate SMS sending to avoid real Twilio charges
  console.log(`[MOCK SMS] Sending to ${to}: ${message}`);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  return { success: true, messageId: `mock_sms_${Date.now()}` };
}
