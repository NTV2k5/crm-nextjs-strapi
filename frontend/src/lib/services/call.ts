export async function makeCall({
  to,
  twimlUrl,
}: {
  to: string;
  twimlUrl?: string; // Optional for mock
}) {
  // MOCK: Simulate making a call to avoid real Twilio charges
  console.log(`[MOCK CALL] Calling ${to}...`);
  
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  return { success: true, callSid: `mock_call_${Date.now()}` };
}
