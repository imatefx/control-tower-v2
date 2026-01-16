"use strict";

const DbService = require("moleculer-db");
const SequelizeAdapter = require("moleculer-db-adapter-sequelize");
const { Op } = require("sequelize");

// Services that should be audited
const AUDITED_SERVICES = ["products", "clients", "deployments", "users", "releaseNotes", "approvals"];

module.exports = function(collection, searchFields = ["name"]) {
  return {
    mixins: [DbService],
    adapter: new SequelizeAdapter(process.env.DATABASE_URL, {
      dialect: "postgres",
      logging: process.env.NODE_ENV === "development" ? console.log : false,
      define: {
        timestamps: true,
        underscored: true,
        paranoid: true
      }
    }),
    collection,
    settings: {
      pageSize: 50,
      maxPageSize: 100
    },
    hooks: {
      before: {
        list: [
          function(ctx) {
            // Handle search parameter with ILIKE
            if (ctx.params.search && ctx.params.search.trim()) {
              const searchTerm = `%${ctx.params.search.trim()}%`;
              const searchConditions = searchFields.map(field => ({
                [field]: { [Op.iLike]: searchTerm }
              }));

              ctx.params.query = {
                ...ctx.params.query,
                [Op.or]: searchConditions
              };
            }
          }
        ],
        // Store original entity before update for change tracking
        update: [
          async function(ctx) {
            if (AUDITED_SERVICES.includes(this.name) && ctx.params.id) {
              try {
                ctx.locals = ctx.locals || {};
                ctx.locals.originalEntity = await this.adapter.findById(ctx.params.id);
              } catch (err) {
                this.logger.warn("Could not fetch original entity for audit:", err.message);
              }
            }
          }
        ],
        remove: [
          async function(ctx) {
            if (AUDITED_SERVICES.includes(this.name) && ctx.params.id) {
              try {
                ctx.locals = ctx.locals || {};
                ctx.locals.deletedEntity = await this.adapter.findById(ctx.params.id);
              } catch (err) {
                this.logger.warn("Could not fetch entity for audit:", err.message);
              }
            }
          }
        ]
      },
      after: {
        create: [
          async function(ctx, res) {
            if (AUDITED_SERVICES.includes(this.name)) {
              try {
                await ctx.call("audit.log", {
                  userId: ctx.meta.user?.id,
                  userName: ctx.meta.user?.name,
                  userEmail: ctx.meta.user?.email,
                  action: "create",
                  resourceType: this.name.replace(/s$/, ""), // Remove trailing 's'
                  resourceId: res.id,
                  resourceName: res.name || res.productName || res.featureName || res.title || `${this.name} item`,
                  changes: null,
                  metadata: {
                    ipAddress: ctx.meta.ipAddress,
                    userAgent: ctx.meta.userAgent
                  }
                });
              } catch (err) {
                this.logger.warn("Failed to create audit log:", err.message);
              }
            }
            return res;
          }
        ],
        update: [
          async function(ctx, res) {
            if (AUDITED_SERVICES.includes(this.name)) {
              try {
                const original = ctx.locals?.originalEntity;
                const changes = [];

                if (original) {
                  // Track changes
                  const fieldsToTrack = ["name", "status", "email", "role", "environment", "productName", "clientName", "ownerName", "nextDeliveryDate", "tier", "description"];
                  for (const field of fieldsToTrack) {
                    if (original[field] !== res[field] && (original[field] || res[field])) {
                      changes.push({
                        field,
                        oldValue: original[field],
                        newValue: res[field]
                      });
                    }
                  }
                }

                await ctx.call("audit.log", {
                  userId: ctx.meta.user?.id,
                  userName: ctx.meta.user?.name,
                  userEmail: ctx.meta.user?.email,
                  action: "update",
                  resourceType: this.name.replace(/s$/, ""),
                  resourceId: res.id,
                  resourceName: res.name || res.productName || res.featureName || res.title || `${this.name} item`,
                  changes: changes.length > 0 ? changes : null,
                  metadata: {
                    ipAddress: ctx.meta.ipAddress,
                    userAgent: ctx.meta.userAgent
                  }
                });
              } catch (err) {
                this.logger.warn("Failed to create audit log:", err.message);
              }
            }
            return res;
          }
        ],
        remove: [
          async function(ctx, res) {
            if (AUDITED_SERVICES.includes(this.name)) {
              try {
                const deleted = ctx.locals?.deletedEntity;
                await ctx.call("audit.log", {
                  userId: ctx.meta.user?.id,
                  userName: ctx.meta.user?.name,
                  userEmail: ctx.meta.user?.email,
                  action: "delete",
                  resourceType: this.name.replace(/s$/, ""),
                  resourceId: ctx.params.id,
                  resourceName: deleted?.name || deleted?.productName || deleted?.featureName || `${this.name} item`,
                  changes: null,
                  metadata: {
                    ipAddress: ctx.meta.ipAddress,
                    userAgent: ctx.meta.userAgent
                  }
                });
              } catch (err) {
                this.logger.warn("Failed to create audit log:", err.message);
              }
            }
            return res;
          }
        ]
      }
    },
    methods: {
      entityChanged(type, json, ctx) {
        return this.clearCache();
      }
    },
    async started() {
      try {
        if (this.adapter && this.adapter.model) {
          // Use force: true only in development to recreate tables
          // In production, use migrations instead
          const force = process.env.DB_SYNC_FORCE === "true";
          const alter = process.env.NODE_ENV === "development" || process.env.DB_SYNC_ALTER === "true";
          await this.adapter.model.sync({ force, alter });
          this.logger.info(`Database synced for ${this.name}`);
        }
      } catch (err) {
        this.logger.warn(`Database sync skipped for ${this.name}: ${err.message}`);
      }
    }
  };
};
