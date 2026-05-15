# ADR-001: ISR + Strapi Webhook Strategy

## Context
Static pages need fresh data without sacrificing performance.

## Decision
Use Next.js ISR with revalidatePath triggered by Strapi webhooks on content change.

## Consequences
- Pages revalidate within seconds of CMS update
- No full rebuild required
- Secure via shared secret header validation
