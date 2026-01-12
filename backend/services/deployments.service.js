"use strict";

const DbMixin = require("../mixins/db.mixin");
const { DataTypes } = require("sequelize");

module.exports = {
  name: "deployments",
  mixins: [DbMixin("deployments")],

  settings: {
    fields: ["id", "clientId", "clientName", "productId", "productName", "status",
             "deploymentType", "environment", "nextDeliveryDate", "featureName",
             "releaseItems", "deliveryPerson", "notes", "documentation", "relevantDocs",
             "equipmentSAStatus", "equipmentSEStatus", "mappingStatus", "constructionStatus",
             "blockedComments", "statusHistory", "createdAt", "updatedAt"],
    entityValidator: {
      clientId: { type: "uuid" },
      productId: { type: "uuid" },
      status: { type: "enum", values: ["Not Started", "In Progress", "Blocked", "Released"], optional: true },
      deploymentType: { type: "enum", values: ["ga", "eap", "feature-release", "client-specific"], optional: true }
    }
  },

  model: {
    name: "deployment",
    define: {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      clientId: { type: DataTypes.UUID, allowNull: false },
      clientName: { type: DataTypes.STRING(200), allowNull: false },
      productId: { type: DataTypes.UUID, allowNull: false },
      productName: { type: DataTypes.STRING(200), allowNull: false },
      status: {
        type: DataTypes.ENUM("Not Started", "In Progress", "Blocked", "Released"),
        defaultValue: "Not Started"
      },
      deploymentType: {
        type: DataTypes.ENUM("ga", "eap", "feature-release", "client-specific"),
        defaultValue: "ga"
      },
      environment: { type: DataTypes.ENUM("qa", "sandbox", "production") },
      nextDeliveryDate: { type: DataTypes.DATEONLY },
      featureName: { type: DataTypes.STRING(200) },
      releaseItems: { type: DataTypes.TEXT },
      deliveryPerson: { type: DataTypes.STRING(100) },
      notes: { type: DataTypes.TEXT },
      documentation: {
        type: DataTypes.JSONB,
        defaultValue: { runbook: null, releaseNotesLink: null, qaReport: null }
      },
      relevantDocs: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
      equipmentSAStatus: { type: DataTypes.STRING(20), defaultValue: "not_started" },
      equipmentSEStatus: { type: DataTypes.STRING(20), defaultValue: "not_started" },
      mappingStatus: { type: DataTypes.STRING(20), defaultValue: "not_started" },
      constructionStatus: { type: DataTypes.STRING(20), defaultValue: "not_started" },
      blockedComments: { type: DataTypes.JSONB, defaultValue: [] },
      statusHistory: { type: DataTypes.JSONB, defaultValue: [] }
    },
    options: { timestamps: true, paranoid: true, underscored: true }
  },

  actions: {
    updateStatus: {
      params: {
        id: "string",
        status: { type: "enum", values: ["Not Started", "In Progress", "Blocked", "Released"] },
        author: { type: "string", optional: true }
      },
      async handler(ctx) {
        const { id, status, author = "System" } = ctx.params;
        const deployment = await this.adapter.findById(id);
        if (!deployment) throw new Error("Deployment not found");

        const oldStatus = deployment.status;
        const historyEntry = {
          id: require("uuid").v4(),
          text: `Status changed from ${oldStatus} to ${status}`,
          author,
          timestamp: new Date(),
          type: "status_change",
          fromStatus: oldStatus,
          toStatus: status
        };

        const statusHistory = [...(deployment.statusHistory || []), historyEntry];
        const updated = await this.adapter.updateById(id, { status, statusHistory });

        this.broker.emit("deployment.statusChanged", { deployment: updated, fromStatus: oldStatus, toStatus: status });
        return updated;
      }
    },

    addBlockedComment: {
      params: {
        id: "string",
        text: "string",
        author: "string",
        parentId: { type: "string", optional: true }
      },
      async handler(ctx) {
        const { id, text, author, parentId } = ctx.params;
        const deployment = await this.adapter.findById(id);
        if (!deployment) throw new Error("Deployment not found");

        const comment = {
          id: require("uuid").v4(),
          text,
          author,
          timestamp: new Date(),
          parentId: parentId || null
        };

        const blockedComments = [...(deployment.blockedComments || []), comment];
        return this.adapter.updateById(id, { blockedComments });
      }
    },

    getByStatus: {
      params: { status: "string" },
      async handler(ctx) {
        return this.adapter.find({ query: { status: ctx.params.status } });
      }
    },

    getOverdue: {
      async handler(ctx) {
        const all = await this.adapter.find({});
        const today = new Date();
        return all.filter(d =>
          d.nextDeliveryDate &&
          new Date(d.nextDeliveryDate) < today &&
          d.status !== "Released"
        );
      }
    },

    getUpcoming: {
      params: { days: { type: "number", optional: true, default: 7 } },
      async handler(ctx) {
        const all = await this.adapter.find({});
        const today = new Date();
        const futureDate = new Date(today.getTime() + ctx.params.days * 24 * 60 * 60 * 1000);
        return all.filter(d =>
          d.nextDeliveryDate &&
          new Date(d.nextDeliveryDate) >= today &&
          new Date(d.nextDeliveryDate) <= futureDate &&
          d.status !== "Released"
        );
      }
    }
  },

  hooks: {
    before: {
      create: [
        async function(ctx) {
          const client = await ctx.call("clients.get", { id: ctx.params.clientId });
          const product = await ctx.call("products.get", { id: ctx.params.productId });
          if (!client) throw new Error("Client not found");
          if (!product) throw new Error("Product not found");
          ctx.params.clientName = client.name;
          ctx.params.productName = product.name;
        }
      ]
    },
    after: {
      create: [
        async function(ctx, res) {
          // Create default checklist items
          const checklistItems = [
            "Requirements Finalized",
            "API Ready",
            "Backend Ready",
            "Frontend Ready",
            "Test Cases Approved",
            "UAT Completed",
            "Release Notes Added",
            "Documentation Uploaded",
            "Go-Live Validation Completed"
          ];
          for (const item of checklistItems) {
            await ctx.call("checklists.create", { deploymentId: res.id, item, isCompleted: false });
          }
          this.broker.emit("deployment.created", res);
          return res;
        }
      ]
    }
  }
};
