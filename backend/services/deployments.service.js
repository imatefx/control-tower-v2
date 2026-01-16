"use strict";

const DbMixin = require("../mixins/db.mixin");
const { DataTypes } = require("sequelize");

module.exports = {
  name: "deployments",
  mixins: [DbMixin("deployments", ["productName", "clientName", "featureName"])],

  settings: {
    fields: ["id", "clientId", "clientName", "clientIds", "clientNames", "productId", "productName", "status",
             "deploymentType", "environment", "nextDeliveryDate", "featureName",
             "releaseItems", "deliveryPerson", "ownerId", "ownerName", "notes", "documentation", "relevantDocs",
             "equipmentSAStatus", "equipmentSEStatus", "mappingStatus", "constructionStatus",
             "blockedComments", "statusHistory", "notificationEmails", "lastNotificationSent", "createdAt", "updatedAt"],
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
      clientId: { type: DataTypes.UUID },
      clientName: { type: DataTypes.STRING(200) },
      clientIds: { type: DataTypes.ARRAY(DataTypes.UUID), defaultValue: [] },
      clientNames: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
      productId: { type: DataTypes.UUID, allowNull: false },
      productName: { type: DataTypes.STRING(200), allowNull: false },
      ownerId: { type: DataTypes.UUID },
      ownerName: { type: DataTypes.STRING(100) },
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
      statusHistory: { type: DataTypes.JSONB, defaultValue: [] },
      notificationEmails: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
      lastNotificationSent: { type: DataTypes.JSONB, defaultValue: {} }
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

        // Use Sequelize model directly for proper JSONB update
        await this.adapter.model.update(
          { status, statusHistory },
          { where: { id } }
        );

        // Fetch and return the updated entity
        const updated = await this.adapter.findById(id);

        // Audit log for status change
        try {
          await ctx.call("audit.log", {
            userId: ctx.meta.user?.id,
            userName: ctx.meta.user?.name || author,
            userEmail: ctx.meta.user?.email,
            action: "status_change",
            resourceType: "deployment",
            resourceId: id,
            resourceName: updated.productName || "Deployment",
            changes: [{ field: "status", oldValue: oldStatus, newValue: status }],
            metadata: { ipAddress: ctx.meta.ipAddress, userAgent: ctx.meta.userAgent }
          });
        } catch (err) {
          this.logger.warn("Failed to create audit log:", err.message);
        }

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

        // Use Sequelize model directly for proper JSONB update
        await this.adapter.model.update(
          { blockedComments },
          { where: { id } }
        );

        return this.adapter.findById(id);
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
      list: [
        function(ctx) {
          // Initialize query object if not present
          if (!ctx.params.query) {
            ctx.params.query = {};
          }
          // Move filter params from top-level to query object for moleculer-db
          if (ctx.params.productId) {
            ctx.params.query.productId = ctx.params.productId;
            this.logger.info(`Filtering deployments by productId: ${ctx.params.productId}`);
          }
          if (ctx.params.clientId) {
            ctx.params.query.clientId = ctx.params.clientId;
          }
          if (ctx.params.status) {
            ctx.params.query.status = ctx.params.status;
          }
        }
      ],
      create: [
        async function(ctx) {
          const product = await ctx.call("products.get", { id: ctx.params.productId });
          if (!product) throw new Error("Product not found");
          ctx.params.productName = product.name;

          // Handle multi-client for EAP deployments
          if (ctx.params.deploymentType === "eap" && ctx.params.clientIds && ctx.params.clientIds.length > 0) {
            const clientNames = [];
            for (const clientId of ctx.params.clientIds) {
              const client = await ctx.call("clients.get", { id: clientId });
              if (client) clientNames.push(client.name);
            }
            ctx.params.clientNames = clientNames;
            // Set first client as primary for backwards compatibility
            ctx.params.clientId = ctx.params.clientIds[0];
            ctx.params.clientName = clientNames[0] || "";
          } else if (ctx.params.clientId) {
            const client = await ctx.call("clients.get", { id: ctx.params.clientId });
            if (!client) throw new Error("Client not found");
            ctx.params.clientName = client.name;
            ctx.params.clientIds = [ctx.params.clientId];
            ctx.params.clientNames = [client.name];
          }

          // Owner fallback logic: selected owner > delivery lead > engineering owner
          if (!ctx.params.ownerId && !ctx.params.ownerName) {
            if (product.deliveryLead) {
              ctx.params.ownerName = product.deliveryLead;
            } else if (product.engineeringOwner) {
              ctx.params.ownerName = product.engineeringOwner;
            }
          }
        }
      ]
    },
    after: {
      create: [
        async function(ctx, res) {
          // Get checklist items from templates
          let checklistItems;
          try {
            const templates = await ctx.call("checklistTemplates.getActive");
            if (templates && templates.length > 0) {
              checklistItems = templates.map(t => t.label);
            }
          } catch (err) {
            this.logger.warn("Could not fetch checklist templates:", err.message);
          }

          // Fallback to defaults if no templates
          if (!checklistItems || checklistItems.length === 0) {
            checklistItems = [
              "Requirements Gathering",
              "Design & Architecture",
              "Development",
              "Testing",
              "Documentation",
              "Training",
              "Deployment",
              "Validation",
              "Handover"
            ];
          }

          for (const item of checklistItems) {
            await ctx.call("checklists.create", { deploymentId: res.id, item, isCompleted: false });
          }

          // Audit log
          try {
            await ctx.call("audit.log", {
              userId: ctx.meta.user?.id,
              userName: ctx.meta.user?.name,
              userEmail: ctx.meta.user?.email,
              action: "create",
              resourceType: "deployment",
              resourceId: res.id,
              resourceName: res.productName,
              metadata: { clientName: res.clientName, environment: res.environment }
            });
          } catch (err) {
            this.logger.warn("Failed to create audit log:", err.message);
          }

          this.broker.emit("deployment.created", res);
          return res;
        }
      ],
      update: [
        async function(ctx, res) {
          try {
            await ctx.call("audit.log", {
              userId: ctx.meta.user?.id,
              userName: ctx.meta.user?.name,
              userEmail: ctx.meta.user?.email,
              action: "update",
              resourceType: "deployment",
              resourceId: res.id,
              resourceName: res.productName,
              metadata: { clientName: res.clientName }
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
            await ctx.call("audit.log", {
              userId: ctx.meta.user?.id,
              userName: ctx.meta.user?.name,
              userEmail: ctx.meta.user?.email,
              action: "delete",
              resourceType: "deployment",
              resourceId: ctx.params.id,
              resourceName: "Deployment deleted",
              metadata: {}
            });
          } catch (err) {
            this.logger.warn("Failed to create audit log:", err.message);
          }
          return res;
        }
      ]
    }
  }
};
