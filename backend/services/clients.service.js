"use strict";

const DbMixin = require("../mixins/db.mixin");
const { DataTypes } = require("sequelize");

module.exports = {
  name: "clients",
  mixins: [DbMixin("clients", ["name", "cdgOwner", "comments"])],

  settings: {
    fields: ["id", "name", "cdgOwner", "productIds", "comments", "documentation", "createdAt", "updatedAt"],
    entityValidator: {
      name: { type: "string", min: 1, max: 200 }
    }
  },

  model: {
    name: "client",
    define: {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      name: { type: DataTypes.STRING(200), allowNull: false, unique: true },
      cdgOwner: { type: DataTypes.STRING(200) },
      productIds: { type: DataTypes.JSONB, defaultValue: [] },
      comments: { type: DataTypes.TEXT },
      documentation: { type: DataTypes.JSONB, defaultValue: [] }
    },
    options: { timestamps: true, paranoid: true, underscored: true }
  },

  actions: {
    getWithDeployments: {
      params: { id: "string" },
      async handler(ctx) {
        const client = await this.adapter.findById(ctx.params.id);
        if (!client) throw new Error("Client not found");

        const deployments = await ctx.call("deployments.find", {
          query: { clientId: ctx.params.id }
        });

        return { ...client, deployments };
      }
    },

    canDelete: {
      params: { id: "string" },
      async handler(ctx) {
        const deployments = await ctx.call("deployments.find", {
          query: { clientId: ctx.params.id }
        });
        return { canDelete: deployments.length === 0, deploymentCount: deployments.length };
      }
    },

    addDocumentation: {
      params: {
        id: "string",
        title: "string",
        url: "string"
      },
      async handler(ctx) {
        const { id, title, url } = ctx.params;
        const client = await this.adapter.findById(id);
        if (!client) throw new Error("Client not found");

        const doc = {
          id: require("uuid").v4(),
          title,
          url,
          addedAt: new Date()
        };

        const documentation = [...(client.documentation || []), doc];

        // Use Sequelize model directly for proper JSONB update
        await this.adapter.model.update(
          { documentation },
          { where: { id } }
        );

        return this.adapter.findById(id);
      }
    },

    removeDocumentation: {
      params: {
        id: "string",
        docId: "string"
      },
      async handler(ctx) {
        const { id, docId } = ctx.params;
        const client = await this.adapter.findById(id);
        if (!client) throw new Error("Client not found");

        const documentation = (client.documentation || []).filter(d => d.id !== docId);

        // Use Sequelize model directly for proper JSONB update
        await this.adapter.model.update(
          { documentation },
          { where: { id } }
        );

        return this.adapter.findById(id);
      }
    }
  },

  hooks: {
    before: {
      remove: [
        async function(ctx) {
          const result = await this.actions.canDelete({ id: ctx.params.id });
          if (!result.canDelete) {
            throw new Error(`Cannot delete client with ${result.deploymentCount} active deployments`);
          }
          // Store for audit
          ctx.locals = ctx.locals || {};
          ctx.locals.deletedEntity = await this.adapter.findById(ctx.params.id);
        }
      ],
      update: [
        async function(ctx) {
          if (ctx.params.id) {
            ctx.locals = ctx.locals || {};
            ctx.locals.originalEntity = await this.adapter.findById(ctx.params.id);
          }
        }
      ]
    },
    after: {
      create: [
        async function(ctx, res) {
          try {
            await ctx.call("audit.log", {
              userId: ctx.meta.user?.id,
              userName: ctx.meta.user?.name,
              userEmail: ctx.meta.user?.email,
              action: "create",
              resourceType: "client",
              resourceId: res.id,
              resourceName: res.name,
              metadata: { ipAddress: ctx.meta.ipAddress }
            });
          } catch (err) {
            this.logger.warn("Failed to create audit log:", err.message);
          }
          return res;
        }
      ],
      update: [
        async function(ctx, res) {
          try {
            const original = ctx.locals?.originalEntity;
            const changes = [];
            if (original) {
              ["name", "tier", "contactEmail", "contactPhone"].forEach(field => {
                if (original[field] !== res[field]) {
                  changes.push({ field, oldValue: original[field], newValue: res[field] });
                }
              });
            }
            await ctx.call("audit.log", {
              userId: ctx.meta.user?.id,
              userName: ctx.meta.user?.name,
              userEmail: ctx.meta.user?.email,
              action: "update",
              resourceType: "client",
              resourceId: res.id,
              resourceName: res.name,
              changes: changes.length > 0 ? changes : null,
              metadata: { ipAddress: ctx.meta.ipAddress }
            });
          } catch (err) {
            this.logger.warn("Failed to create audit log:", err.message);
          }
          return res;
        }
      ],
      remove: [
        async function(ctx, res) {
          try {
            const deleted = ctx.locals?.deletedEntity;
            await ctx.call("audit.log", {
              userId: ctx.meta.user?.id,
              userName: ctx.meta.user?.name,
              userEmail: ctx.meta.user?.email,
              action: "delete",
              resourceType: "client",
              resourceId: ctx.params.id,
              resourceName: deleted?.name || "Client deleted",
              metadata: { ipAddress: ctx.meta.ipAddress }
            });
          } catch (err) {
            this.logger.warn("Failed to create audit log:", err.message);
          }
          return res;
        }
      ],
      list: [
        async function(ctx, res) {
          // Add deployment counts to each client
          if (res.rows && res.rows.length > 0) {
            const deployments = await ctx.call("deployments.find", {});
            const countMap = {};
            deployments.forEach(d => {
              countMap[d.clientId] = (countMap[d.clientId] || 0) + 1;
            });
            res.rows = res.rows.map(c => ({
              ...c,
              deploymentCount: countMap[c.id] || 0
            }));
          }
          return res;
        }
      ],
      get: [
        async function(ctx, res) {
          if (res) {
            const deployments = await ctx.call("deployments.find", { query: { clientId: res.id } });
            res.deploymentCount = deployments.length;
          }
          return res;
        }
      ]
    }
  }
};
