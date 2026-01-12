"use strict";

const DbMixin = require("../mixins/db.mixin");
const { DataTypes } = require("sequelize");

module.exports = {
  name: "clients",
  mixins: [DbMixin("clients")],

  settings: {
    fields: ["id", "name", "comments", "createdAt", "updatedAt"],
    entityValidator: {
      name: { type: "string", min: 1, max: 200 }
    }
  },

  model: {
    name: "client",
    define: {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      name: { type: DataTypes.STRING(200), allowNull: false, unique: true },
      comments: { type: DataTypes.TEXT }
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
        }
      ]
    },
    after: {
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
