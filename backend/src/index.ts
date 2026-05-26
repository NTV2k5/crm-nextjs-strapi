import type { Core } from '@strapi/strapi';

export default {
  register() {},

  async bootstrap({ strapi }: { strapi: Core.Strapi }) {
    try {
      // 1. Create custom roles if they do not exist
      const rolesToCreate = [
        { name: 'Admin', type: 'admin', description: 'System Administrator with full access' },
        { name: 'Manager', type: 'manager', description: 'Sales Manager with dashboard and team access' },
        { name: 'Sales', type: 'sales', description: 'Sales Staff with access to assigned customers/deals' },
      ];

      for (const roleInfo of rolesToCreate) {
        const existingRole = await strapi
          .query('plugin::users-permissions.role')
          .findOne({ where: { type: roleInfo.type } });

        if (!existingRole) {
          await strapi
            .query('plugin::users-permissions.role')
            .create({
              data: {
                name: roleInfo.name,
                type: roleInfo.type,
                description: roleInfo.description,
              },
            });
          strapi.log.info(`Programmatic bootstrap: Created role ${roleInfo.name} (${roleInfo.type})`);
        }
      }

      // 2. Auto-confirm all unconfirmed users so they can log in via /api/auth/local
      const unconfirmedUsers = await strapi
        .query('plugin::users-permissions.user')
        .findMany({ where: { confirmed: false } });

      for (const u of unconfirmedUsers) {
        await strapi
          .query('plugin::users-permissions.user')
          .update({ where: { id: u.id }, data: { confirmed: true } });
        strapi.log.info(`Programmatic bootstrap: Auto-confirmed user ${u.email}`);
      }

      if (unconfirmedUsers.length > 0) {
        strapi.log.info(`Programmatic bootstrap: Confirmed status auto-enabled for all users.`);
      }

      // 3. Assign permissions to authenticated and custom roles
      const roleTypes = ['authenticated', 'admin', 'manager', 'sales'];
      const apis = [
        'customer',
        'note',
        'deal',
        'reminder',
        'contract',
        'invoice',
        'audit-log',
      ];
      const actions = ['find', 'findOne', 'create', 'update', 'delete'];
      const userActions = ['find', 'findOne', 'update', 'destroy'];
      const roleActions = ['find', 'findOne'];
      const uploadAction = 'plugin::upload.content-api.upload';

      for (const type of roleTypes) {
        const roleObj = await strapi
          .query('plugin::users-permissions.role')
          .findOne({ where: { type } });

        if (!roleObj) continue;

        // Content APIs permissions
        for (const api of apis) {
          for (const action of actions) {
            const actionString = `api::${api}.${api}.${action}`;
            const existingPermission = await strapi
              .query('plugin::users-permissions.permission')
              .findOne({
                where: {
                  action: actionString,
                  role: roleObj.id,
                },
              });

            if (!existingPermission) {
              await strapi
                .query('plugin::users-permissions.permission')
                .create({
                  data: {
                    action: actionString,
                    role: roleObj.id,
                  },
                });
            }
          }
        }

        // Users-permissions User permissions
        for (const action of userActions) {
          const actionString = `plugin::users-permissions.user.${action}`;
          const existingPermission = await strapi
            .query('plugin::users-permissions.permission')
            .findOne({
              where: {
                action: actionString,
                role: roleObj.id,
              },
            });

          if (!existingPermission) {
            await strapi
              .query('plugin::users-permissions.permission')
              .create({
                data: {
                  action: actionString,
                  role: roleObj.id,
                },
              });
          }
        }

        // Users-permissions Role permissions
        for (const action of roleActions) {
          const actionString = `plugin::users-permissions.role.${action}`;
          const existingPermission = await strapi
            .query('plugin::users-permissions.permission')
            .findOne({
              where: {
                action: actionString,
                role: roleObj.id,
              },
            });

          if (!existingPermission) {
            await strapi
              .query('plugin::users-permissions.permission')
              .create({
                data: {
                  action: actionString,
                  role: roleObj.id,
                },
              });
          }
        }

        // Upload permissions
        const existingUploadPermission = await strapi
          .query('plugin::users-permissions.permission')
          .findOne({
            where: {
              action: uploadAction,
              role: roleObj.id,
            },
          });

        if (!existingUploadPermission) {
          await strapi
            .query('plugin::users-permissions.permission')
            .create({
              data: {
                action: uploadAction,
                role: roleObj.id,
              },
            });
        }
      }

      strapi.log.info('Programmatic permissions successfully verified/assigned for all roles.');
    } catch (err) {
      strapi.log.error('Error setting up programmatic roles and permissions: ' + (err as Error).message);
    }
  },
};
