import type { Core } from '@strapi/strapi';

const config: Core.Config.Middlewares = [
  'strapi::logger',
  'strapi::errors',
  'strapi::security',
  'strapi::cors',
  'strapi::poweredBy',
  'strapi::query',
  'strapi::body',
  'strapi::session',
  'strapi::favicon',
  'strapi::public',
];

export default config;

export default [
  "strapi::logger",
  "strapi::errors",
  { name: "strapi::cors", config: { origin: ["http://localhost:3000"] } },
  "strapi::body",
  "strapi::public",
];
