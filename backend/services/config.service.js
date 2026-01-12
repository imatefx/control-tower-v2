"use strict";

const DbMixin = require("../mixins/db.mixin");
const { DataTypes } = require("sequelize");

module.exports = {
  name: "config",
  mixins: [DbMixin("configs")],

  settings: {
    fields: ["id", "key", "value", "createdAt", "updatedAt"]
  },

  model: {
    name: "config",
    define: {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      key: { type: DataTypes.STRING(100), allowNull: false, unique: true },
      value: { type: DataTypes.JSONB }
    },
    options: { timestamps: true, paranoid: false, underscored: true }
  },

  actions: {
    getValue: {
      params: { key: "string" },
      async handler(ctx) {
        const config = await this.adapter.findOne({ where: { key: ctx.params.key } });
        return config ? config.value : null;
      }
    },

    setValue: {
      params: {
        key: "string",
        value: "any"
      },
      async handler(ctx) {
        const { key, value } = ctx.params;
        const existing = await this.adapter.findOne({ where: { key } });
        if (existing) {
          return this.adapter.updateById(existing.id, { value });
        }
        return this.adapter.insert({ key, value });
      }
    },

    getDocTypes: {
      async handler(ctx) {
        const value = await this.actions.getValue({ key: "docTypes" });
        return value || [
          { key: "productGuide", label: "Product Guide", order: 1 },
          { key: "releaseNotes", label: "Release Notes", order: 2 },
          { key: "demoScript", label: "Demo Script", order: 3 },
          { key: "testCases", label: "Test Cases", order: 4 },
          { key: "productionChecklist", label: "Production Checklist", order: 5 }
        ];
      }
    },

    getDeploymentDocTypes: {
      async handler(ctx) {
        const value = await this.actions.getValue({ key: "deploymentDocTypes" });
        return value || [
          { key: "runbook", label: "Runbook", order: 1 },
          { key: "releaseNotesLink", label: "Release Notes Link", order: 2 },
          { key: "qaReport", label: "QA Report", order: 3 }
        ];
      }
    },

    setDocTypes: {
      params: { docTypes: "array" },
      async handler(ctx) {
        return this.actions.setValue({ key: "docTypes", value: ctx.params.docTypes });
      }
    },

    setDeploymentDocTypes: {
      params: { docTypes: "array" },
      async handler(ctx) {
        return this.actions.setValue({ key: "deploymentDocTypes", value: ctx.params.docTypes });
      }
    }
  },

  async started() {
    if (this.adapter && this.adapter.model) {
      const force = process.env.DB_SYNC_FORCE === "true";
      await this.adapter.model.sync({ force });
    }

    // Initialize default configs
    const docTypes = await this.actions.getValue({ key: "docTypes" });
    if (!docTypes) {
      await this.actions.setValue({
        key: "docTypes",
        value: [
          { key: "productGuide", label: "Product Guide", order: 1 },
          { key: "releaseNotes", label: "Release Notes", order: 2 },
          { key: "demoScript", label: "Demo Script", order: 3 },
          { key: "testCases", label: "Test Cases", order: 4 },
          { key: "productionChecklist", label: "Production Checklist", order: 5 }
        ]
      });
    }

    const deploymentDocTypes = await this.actions.getValue({ key: "deploymentDocTypes" });
    if (!deploymentDocTypes) {
      await this.actions.setValue({
        key: "deploymentDocTypes",
        value: [
          { key: "runbook", label: "Runbook", order: 1 },
          { key: "releaseNotesLink", label: "Release Notes Link", order: 2 },
          { key: "qaReport", label: "QA Report", order: 3 }
        ]
      });
    }
  }
};
