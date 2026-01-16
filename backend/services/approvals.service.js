"use strict";

const DbMixin = require("../mixins/db.mixin");
const { DataTypes } = require("sequelize");

module.exports = {
  name: "approvals",
  mixins: [DbMixin("approvals", ["deploymentName", "productName", "clientName", "requestedByName"])],

  settings: {
    fields: ["id", "deploymentId", "deploymentName", "productId", "productName",
             "clientId", "clientName", "requestedBy", "requestedByName", "requestedAt",
             "status", "reviewedBy", "reviewedByName", "reviewedAt", "comments",
             "rejectionReason", "createdAt", "updatedAt"],
    entityValidator: {
      deploymentId: { type: "uuid" },
      status: { type: "enum", values: ["pending", "approved", "rejected", "cancelled"], optional: true }
    }
  },

  model: {
    name: "approval",
    define: {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      deploymentId: { type: DataTypes.UUID, allowNull: false },
      deploymentName: { type: DataTypes.STRING(200) },
      productId: { type: DataTypes.UUID },
      productName: { type: DataTypes.STRING(200) },
      clientId: { type: DataTypes.UUID },
      clientName: { type: DataTypes.STRING(200) },
      requestedBy: { type: DataTypes.UUID, allowNull: false },
      requestedByName: { type: DataTypes.STRING(100) },
      requestedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
      status: {
        type: DataTypes.ENUM("pending", "approved", "rejected", "cancelled"),
        defaultValue: "pending"
      },
      reviewedBy: { type: DataTypes.UUID },
      reviewedByName: { type: DataTypes.STRING(100) },
      reviewedAt: { type: DataTypes.DATE },
      comments: { type: DataTypes.TEXT },
      rejectionReason: { type: DataTypes.TEXT }
    },
    options: { timestamps: true, paranoid: true, underscored: true }
  },

  actions: {
    requestApproval: {
      params: {
        deploymentId: "string",
        requestedBy: "string",
        requestedByName: "string"
      },
      async handler(ctx) {
        const { deploymentId, requestedBy, requestedByName } = ctx.params;
        const deployment = await ctx.call("deployments.get", { id: deploymentId });
        if (!deployment) throw new Error("Deployment not found");

        return this.adapter.insert({
          deploymentId,
          deploymentName: `${deployment.productName} - ${deployment.clientName}`,
          productId: deployment.productId,
          productName: deployment.productName,
          clientId: deployment.clientId,
          clientName: deployment.clientName,
          requestedBy,
          requestedByName,
          requestedAt: new Date()
        });
      }
    },

    approve: {
      params: {
        id: "string",
        reviewedBy: "string",
        reviewedByName: "string",
        comments: { type: "string", optional: true }
      },
      async handler(ctx) {
        const { id, reviewedBy, reviewedByName, comments } = ctx.params;
        const approval = await this.adapter.findById(id);
        if (!approval) throw new Error("Approval not found");
        if (approval.status !== "pending") throw new Error("Approval already processed");

        const updated = await this.adapter.updateById(id, {
          status: "approved",
          reviewedBy,
          reviewedByName,
          reviewedAt: new Date(),
          comments
        });

        // Update deployment status to Released
        await ctx.call("deployments.updateStatus", {
          id: approval.deploymentId,
          status: "Released",
          author: reviewedByName
        });

        this.broker.emit("approval.completed", { approval: updated, result: "approved" });
        return updated;
      }
    },

    reject: {
      params: {
        id: "string",
        reviewedBy: "string",
        reviewedByName: "string",
        rejectionReason: "string"
      },
      async handler(ctx) {
        const { id, reviewedBy, reviewedByName, rejectionReason } = ctx.params;
        const approval = await this.adapter.findById(id);
        if (!approval) throw new Error("Approval not found");
        if (approval.status !== "pending") throw new Error("Approval already processed");

        const updated = await this.adapter.updateById(id, {
          status: "rejected",
          reviewedBy,
          reviewedByName,
          reviewedAt: new Date(),
          rejectionReason
        });

        this.broker.emit("approval.completed", { approval: updated, result: "rejected" });
        return updated;
      }
    },

    getPending: {
      async handler(ctx) {
        return this.adapter.find({ query: { status: "pending" } });
      }
    },

    getByDeployment: {
      params: { deploymentId: "string" },
      async handler(ctx) {
        return this.adapter.find({ query: { deploymentId: ctx.params.deploymentId } });
      }
    }
  }
};
