"use strict";

const DbMixin = require("../mixins/db.mixin");
const { DataTypes } = require("sequelize");

module.exports = {
  name: "audit",
  mixins: [DbMixin("audit_logs")],

  settings: {
    fields: ["id", "userId", "userName", "userEmail", "action", "resourceType",
             "resourceId", "resourceName", "changes", "metadata", "timestamp"]
  },

  model: {
    name: "auditLog",
    define: {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      userId: { type: DataTypes.UUID },
      userName: { type: DataTypes.STRING(100) },
      userEmail: { type: DataTypes.STRING(255) },
      action: {
        type: DataTypes.STRING(50),
        allowNull: false
        // create, update, delete, restore, login, logout, status_change, approve, reject, export, import
      },
      resourceType: {
        type: DataTypes.STRING(50)
        // product, client, deployment, user, releaseNote, config, webhook, workflow, approval, auth
      },
      resourceId: { type: DataTypes.UUID },
      resourceName: { type: DataTypes.STRING(200) },
      changes: { type: DataTypes.JSONB },  // Array of { field, oldValue, newValue }
      metadata: {
        type: DataTypes.JSONB,
        defaultValue: {}
        // { ipAddress, userAgent, requestId }
      },
      timestamp: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
    },
    options: { timestamps: false, paranoid: false, underscored: true }
  },

  actions: {
    log: {
      params: {
        userId: { type: "string", optional: true },
        userName: { type: "string", optional: true },
        userEmail: { type: "string", optional: true },
        action: "string",
        resourceType: { type: "string", optional: true },
        resourceId: { type: "string", optional: true },
        resourceName: { type: "string", optional: true },
        changes: { type: "array", optional: true },
        metadata: { type: "object", optional: true }
      },
      async handler(ctx) {
        return this.adapter.insert({
          ...ctx.params,
          timestamp: new Date()
        });
      }
    },

    getByResource: {
      params: {
        resourceType: "string",
        resourceId: "string"
      },
      async handler(ctx) {
        const logs = await this.adapter.find({
          query: {
            resourceType: ctx.params.resourceType,
            resourceId: ctx.params.resourceId
          }
        });
        return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      }
    },

    getByUser: {
      params: { userId: "string" },
      async handler(ctx) {
        const logs = await this.adapter.find({ query: { userId: ctx.params.userId } });
        return logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      }
    },

    search: {
      params: {
        userId: { type: "string", optional: true },
        action: { type: "string", optional: true },
        resourceType: { type: "string", optional: true },
        startDate: { type: "string", optional: true },
        endDate: { type: "string", optional: true },
        page: { type: "any", optional: true },
        limit: { type: "any", optional: true },
        search: { type: "string", optional: true }
      },
      async handler(ctx) {
        const { userId, action, resourceType, startDate, endDate, search } = ctx.params;
        const page = parseInt(ctx.params.page) || 1;
        const limit = parseInt(ctx.params.limit) || 50;
        let logs = await this.adapter.find({});

        if (userId) logs = logs.filter(l => l.userId === userId);
        if (action) logs = logs.filter(l => l.action === action);
        if (resourceType) logs = logs.filter(l => l.resourceType === resourceType);
        if (startDate) logs = logs.filter(l => new Date(l.timestamp) >= new Date(startDate));
        if (endDate) logs = logs.filter(l => new Date(l.timestamp) <= new Date(endDate));
        if (search) {
          const searchLower = search.toLowerCase();
          logs = logs.filter(l =>
            (l.resourceName && l.resourceName.toLowerCase().includes(searchLower)) ||
            (l.userName && l.userName.toLowerCase().includes(searchLower))
          );
        }

        logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

        const total = logs.length;
        const offset = (page - 1) * limit;
        const data = logs.slice(offset, offset + limit);

        return {
          data,
          pagination: {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit)
          }
        };
      }
    }
  }
};
