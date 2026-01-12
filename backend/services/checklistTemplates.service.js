"use strict";

const DbMixin = require("../mixins/db.mixin");
const { DataTypes } = require("sequelize");

module.exports = {
  name: "checklistTemplates",
  mixins: [DbMixin("checklist_templates")],

  settings: {
    fields: ["id", "key", "label", "description", "sortOrder", "isActive", "createdAt", "updatedAt"],
    entityValidator: {
      key: { type: "string", min: 1, max: 50 },
      label: { type: "string", min: 1, max: 200 },
      description: { type: "string", optional: true, max: 500 },
      sortOrder: { type: "number", optional: true },
      isActive: { type: "boolean", optional: true }
    }
  },

  model: {
    name: "checklist_template",
    define: {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      key: { type: DataTypes.STRING(50), allowNull: false, unique: true },
      label: { type: DataTypes.STRING(200), allowNull: false },
      description: { type: DataTypes.STRING(500), allowNull: true },
      sortOrder: { type: DataTypes.INTEGER, defaultValue: 0 },
      isActive: { type: DataTypes.BOOLEAN, defaultValue: true }
    },
    options: { timestamps: true, paranoid: true, underscored: true }
  },

  actions: {
    // Get all active checklist templates ordered by sortOrder
    getActive: {
      async handler(ctx) {
        const items = await this.adapter.find({
          query: { isActive: true },
          sort: ["sortOrder", "createdAt"]
        });
        return items;
      }
    },

    // Reorder checklist templates
    reorder: {
      params: {
        items: { type: "array", items: { type: "object", props: { id: "string", sortOrder: "number" } } }
      },
      async handler(ctx) {
        const { items } = ctx.params;
        for (const item of items) {
          await this.adapter.updateById(item.id, { sortOrder: item.sortOrder });
        }
        return this.adapter.find({ sort: ["sortOrder", "createdAt"] });
      }
    },

    // Seed default checklist items if none exist
    seedDefaults: {
      async handler(ctx) {
        const existing = await this.adapter.find({});
        if (existing.length > 0) {
          return { message: "Checklist templates already exist", count: existing.length };
        }

        const defaultItems = [
          { key: "requirements", label: "Requirements Gathering", sortOrder: 1 },
          { key: "design", label: "Design & Architecture", sortOrder: 2 },
          { key: "development", label: "Development", sortOrder: 3 },
          { key: "testing", label: "Testing", sortOrder: 4 },
          { key: "documentation", label: "Documentation", sortOrder: 5 },
          { key: "training", label: "Training", sortOrder: 6 },
          { key: "deployment", label: "Deployment", sortOrder: 7 },
          { key: "validation", label: "Validation", sortOrder: 8 },
          { key: "handover", label: "Handover", sortOrder: 9 }
        ];

        for (const item of defaultItems) {
          await this.adapter.insert({ ...item, isActive: true });
        }

        return { message: "Default checklist templates created", count: defaultItems.length };
      }
    }
  },

  async started() {
    // Seed defaults on service start
    try {
      await this.actions.seedDefaults();
    } catch (err) {
      this.logger.warn("Could not seed checklist templates:", err.message);
    }
  }
};
