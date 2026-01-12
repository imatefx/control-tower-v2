"use strict";

const DbMixin = require("../mixins/db.mixin");
const { DataTypes } = require("sequelize");

module.exports = {
  name: "checklists",
  mixins: [DbMixin("checklists")],

  settings: {
    fields: ["id", "deploymentId", "item", "isCompleted", "createdAt", "updatedAt"],
    entityValidator: {
      deploymentId: { type: "uuid" },
      item: { type: "string" },
      isCompleted: { type: "boolean", optional: true }
    }
  },

  model: {
    name: "checklist",
    define: {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      deploymentId: { type: DataTypes.UUID, allowNull: false },
      item: { type: DataTypes.STRING(200), allowNull: false },
      isCompleted: { type: DataTypes.BOOLEAN, defaultValue: false }
    },
    options: { timestamps: true, paranoid: true, underscored: true }
  },

  actions: {
    getByDeployment: {
      params: { deploymentId: "string" },
      async handler(ctx) {
        return this.adapter.find({ query: { deploymentId: ctx.params.deploymentId } });
      }
    },

    toggleItem: {
      params: { id: "string" },
      async handler(ctx) {
        const item = await this.adapter.findById(ctx.params.id);
        if (!item) throw new Error("Checklist item not found");
        return this.adapter.updateById(ctx.params.id, { isCompleted: !item.isCompleted });
      }
    },

    markAllComplete: {
      params: { deploymentId: "string" },
      async handler(ctx) {
        const items = await this.adapter.find({ query: { deploymentId: ctx.params.deploymentId } });
        for (const item of items) {
          await this.adapter.updateById(item.id, { isCompleted: true });
        }
        return this.adapter.find({ query: { deploymentId: ctx.params.deploymentId } });
      }
    },

    resetAll: {
      params: { deploymentId: "string" },
      async handler(ctx) {
        const items = await this.adapter.find({ query: { deploymentId: ctx.params.deploymentId } });
        for (const item of items) {
          await this.adapter.updateById(item.id, { isCompleted: false });
        }
        return this.adapter.find({ query: { deploymentId: ctx.params.deploymentId } });
      }
    },

    getProgress: {
      params: { deploymentId: "string" },
      async handler(ctx) {
        const items = await this.adapter.find({ query: { deploymentId: ctx.params.deploymentId } });
        const total = items.length;
        const completed = items.filter(i => i.isCompleted).length;
        return {
          total,
          completed,
          percentage: total > 0 ? Math.round((completed / total) * 100) : 0
        };
      }
    }
  }
};
