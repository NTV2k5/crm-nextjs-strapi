import type { Core } from '@strapi/strapi';

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Plugin => ({});

export default config;

export default () => ({
  "users-permissions": {
    config: { jwtSecret: process.env.JWT_SECRET },
  },
});
