"use strict";

const DbMixin = require("../mixins/db.mixin");
const { DataTypes } = require("sequelize");

module.exports = {
  name: "releaseNotes",
  mixins: [DbMixin("release_notes")],

  settings: {
    fields: ["id", "productId", "templateId", "version", "releaseDate", "title", "summary", "items", "createdAt", "updatedAt"],
    entityValidator: {
      productId: { type: "uuid" },
      version: { type: "string" }
    }
  },

  model: {
    name: "releaseNote",
    define: {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      productId: { type: DataTypes.UUID, allowNull: false },
      templateId: { type: DataTypes.UUID },
      version: { type: DataTypes.STRING(50), allowNull: false },
      releaseDate: { type: DataTypes.DATEONLY },
      title: { type: DataTypes.STRING(200) },
      summary: { type: DataTypes.TEXT },
      items: {
        type: DataTypes.JSONB,
        defaultValue: []
        // Each item: { type, title, description, visibility }
      }
    },
    options: { timestamps: true, paranoid: true, underscored: true }
  },

  async started() {
    // Sync model to add any new columns
    if (this.adapter && this.adapter.model) {
      await this.adapter.model.sync({ alter: true });
    }
  },

  actions: {
    getByProduct: {
      params: { productId: "string" },
      async handler(ctx) {
        const notes = await this.adapter.find({ query: { productId: ctx.params.productId } });
        return notes.sort((a, b) => new Date(b.releaseDate || 0) - new Date(a.releaseDate || 0));
      }
    },

    addItem: {
      params: {
        id: "string",
        type: { type: "enum", values: ["feature", "improvement", "bugfix", "security", "performance", "breaking", "deprecated", "docs"] },
        title: "string",
        description: { type: "string", optional: true },
        visibility: { type: "enum", values: ["public", "internal"], optional: true }
      },
      async handler(ctx) {
        const { id, type, title, description, visibility = "public" } = ctx.params;
        const note = await this.adapter.findById(id);
        if (!note) throw new Error("Release note not found");

        const newItem = {
          id: require("uuid").v4(),
          type,
          title,
          description,
          visibility
        };

        const items = [...(note.items || []), newItem];
        return this.adapter.updateById(id, { items });
      }
    },

    removeItem: {
      params: { id: "string", itemId: "string" },
      async handler(ctx) {
        const note = await this.adapter.findById(ctx.params.id);
        if (!note) throw new Error("Release note not found");

        const items = (note.items || []).filter(i => i.id !== ctx.params.itemId);
        return this.adapter.updateById(ctx.params.id, { items });
      }
    },

    getForExport: {
      params: {
        id: "string",
        templateId: { type: "string", optional: true }
      },
      async handler(ctx) {
        const note = await this.adapter.findById(ctx.params.id);
        if (!note) throw new Error("Release note not found");

        // Get template - use provided templateId, note's templateId, or default to 'standard'
        const templateIdToUse = ctx.params.templateId || note.templateId;
        let template;

        if (templateIdToUse) {
          template = await ctx.call("releaseNoteTemplates.get", { id: templateIdToUse });
        }

        if (!template) {
          template = await ctx.call("releaseNoteTemplates.getByKey", { key: "standard" });
        }

        // Get product info
        const product = await ctx.call("products.get", { id: note.productId });

        return {
          releaseNote: note,
          template: template,
          product: product
        };
      }
    }
  }
};
