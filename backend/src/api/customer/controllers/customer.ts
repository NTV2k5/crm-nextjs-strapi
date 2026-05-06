import { factories } from '@strapi/strapi';
export default factories.createCoreController('api::customer.customer');

import { factories } from "@strapi/strapi";
export default factories.createCoreController("api::customer.customer", ({ strapi }) => ({
  async findLatest(ctx) {
    const entries = await strapi.entityService.findMany("api::customer.customer", {
      sort: { createdAt: "desc" },
      limit: 10,
    });
    return { data: entries };
  },
}));
