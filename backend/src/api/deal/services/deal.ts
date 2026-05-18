import { factories } from '@strapi/strapi';
export default factories.createCoreService('api::deal.deal');

import { factories } from "@strapi/strapi";
export default factories.createCoreService("api::deal.deal", ({ strapi }) => ({
  async updateStage(documentId: string, newStage: string) {
    return strapi.entityService.update("api::deal.deal", documentId as unknown as number, {
      data: { stage: newStage as "new" | "qualified" | "proposal" | "negotiation" | "won" | "lost" },
    });
  },
}));
