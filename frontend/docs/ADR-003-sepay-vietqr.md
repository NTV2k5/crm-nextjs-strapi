# ADR-003: Sepay Webhook + VietQR Payment Integration

## Context
Need automated bank payment reconciliation without manual bookkeeping.

## Decision
Integrate Sepay webhook to receive bank transaction events.
Use VietQR API to generate payment QR codes per invoice.

## Consequences
+ Automated payment status updates
+ Reduced manual accounting effort
+ Bank-grade HMAC-SHA256 signature security
