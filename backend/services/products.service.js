"use strict";

const DbMixin = require("../mixins/db.mixin");
const { DataTypes } = require("sequelize");

module.exports = {
  name: "products",
  mixins: [DbMixin("products", ["name", "description"])],

  settings: {
    fields: ["id", "name", "description", "productOwner", "engineeringOwner",
             "deliveryLead", "nextReleaseDate", "parentId", "parentName", "documentation",
             "relevantDocs", "eap", "isAdapter", "adapterServices",
             "notificationEmails", "alertConfig", "subProductCount", "createdAt", "updatedAt"],
    entityValidator: {
      name: { type: "string", min: 1, max: 200 }
    },
    populates: {
      parent: {
        field: "parentId",
        action: "products.get"
      }
    }
  },

  model: {
    name: "product",
    define: {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      name: { type: DataTypes.STRING(200), allowNull: false },
      description: { type: DataTypes.TEXT },
      productOwner: { type: DataTypes.STRING(100) },
      engineeringOwner: { type: DataTypes.STRING(100) },
      deliveryLead: { type: DataTypes.STRING(100) },
      nextReleaseDate: { type: DataTypes.DATEONLY },
      parentId: { type: DataTypes.UUID },
      parentName: { type: DataTypes.STRING(200) },
      documentation: {
        type: DataTypes.JSONB,
        defaultValue: {
          productGuide: null, releaseNotes: null, demoScript: null,
          testCases: null, productionChecklist: null
        }
      },
      relevantDocs: {
        type: DataTypes.JSONB,
        defaultValue: {
          productGuide: true, releaseNotes: true, demoScript: true,
          testCases: true, productionChecklist: true
        }
      },
      eap: {
        type: DataTypes.JSONB,
        defaultValue: {
          isActive: false,
          jiraBoardUrl: null,
          clients: []  // Array of { clientId, clientName, startDate, endDate }
        }
      },
      isAdapter: { type: DataTypes.BOOLEAN, defaultValue: false },
      adapterServices: {
        type: DataTypes.JSONB,
        defaultValue: {
          hasEquipmentSA: false, hasEquipmentSE: false,
          hasMappingService: false, hasConstructionService: false
        }
      },
      notificationEmails: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
      alertConfig: {
        type: DataTypes.JSONB,
        defaultValue: {
          googleChatWebhookUrl: null,
          defaultNotifyOwners: true
        }
      }
    },
    options: { timestamps: true, paranoid: true, underscored: true }
  },

  actions: {
    getWithChildren: {
      params: { id: "string" },
      async handler(ctx) {
        const product = await this.adapter.findById(ctx.params.id);
        if (!product) throw new Error("Product not found");

        const children = await this.adapter.find({ query: { parentId: ctx.params.id } });
        return { ...product, children };
      }
    },

    addDocumentation: {
      params: {
        id: "string",
        title: "string",
        url: "string"
      },
      async handler(ctx) {
        const { id, title, url } = ctx.params;
        const product = await this.adapter.findById(id);
        if (!product) throw new Error("Product not found");

        // Migrate old format if needed
        let docs = this.migrateDocumentation(product);

        const doc = {
          id: require("uuid").v4(),
          title,
          url,
          addedAt: new Date()
        };

        const documentation = [...docs, doc];

        // Use Sequelize model directly for proper JSONB update
        await this.adapter.model.update(
          { documentation },
          { where: { id } }
        );

        // Log audit
        try {
          await ctx.call("audit.log", {
            userId: ctx.meta.user?.id,
            userName: ctx.meta.user?.name,
            userEmail: ctx.meta.user?.email,
            action: "update",
            resourceType: "product",
            resourceId: id,
            resourceName: product.name,
            changes: [{ field: "documentation", oldValue: null, newValue: `Added: ${title}` }],
            metadata: { ipAddress: ctx.meta.ipAddress }
          });
        } catch (err) {
          this.logger.warn("Failed to create audit log:", err.message);
        }

        return this.adapter.findById(id);
      }
    },

    removeDocumentation: {
      params: {
        id: "string",
        docId: "string"
      },
      async handler(ctx) {
        const { id, docId } = ctx.params;
        const product = await this.adapter.findById(id);
        if (!product) throw new Error("Product not found");

        // Migrate old format if needed
        let docs = this.migrateDocumentation(product);
        const removedDoc = docs.find(d => d.id === docId);
        const documentation = docs.filter(d => d.id !== docId);

        // Use Sequelize model directly for proper JSONB update
        await this.adapter.model.update(
          { documentation },
          { where: { id } }
        );

        // Log audit
        try {
          await ctx.call("audit.log", {
            userId: ctx.meta.user?.id,
            userName: ctx.meta.user?.name,
            userEmail: ctx.meta.user?.email,
            action: "update",
            resourceType: "product",
            resourceId: id,
            resourceName: product.name,
            changes: [{ field: "documentation", oldValue: removedDoc?.title || docId, newValue: "Removed" }],
            metadata: { ipAddress: ctx.meta.ipAddress }
          });
        } catch (err) {
          this.logger.warn("Failed to create audit log:", err.message);
        }

        return this.adapter.findById(id);
      }
    },

    getEapProducts: {
      async handler(ctx) {
        const products = await this.adapter.find({});
        return products.filter(p => p.eap && p.eap.isActive);
      }
    },

    // Get products with upcoming releases (deployments within next N days)
    getWithUpcomingReleases: {
      params: {
        days: { type: "number", optional: true, default: 30 }
      },
      async handler(ctx) {
        const { days } = ctx.params;
        const today = new Date();
        const futureDate = new Date(today.getTime() + days * 24 * 60 * 60 * 1000);

        // Get all deployments with upcoming dates
        const deployments = await ctx.call("deployments.find", {});
        const upcomingDeployments = deployments.filter(d =>
          d.nextDeliveryDate &&
          new Date(d.nextDeliveryDate) >= today &&
          new Date(d.nextDeliveryDate) <= futureDate &&
          d.status !== "Released"
        );

        // Group by product
        const productMap = {};
        for (const dep of upcomingDeployments) {
          if (!productMap[dep.productId]) {
            productMap[dep.productId] = {
              productId: dep.productId,
              productName: dep.productName,
              upcomingDeployments: []
            };
          }
          productMap[dep.productId].upcomingDeployments.push({
            id: dep.id,
            clientName: dep.clientName,
            nextDeliveryDate: dep.nextDeliveryDate,
            status: dep.status,
            environment: dep.environment,
            featureName: dep.featureName
          });
        }

        // Sort deployments by date within each product
        const results = Object.values(productMap).map(p => ({
          ...p,
          upcomingDeployments: p.upcomingDeployments.sort(
            (a, b) => new Date(a.nextDeliveryDate) - new Date(b.nextDeliveryDate)
          ),
          nextReleaseDate: p.upcomingDeployments[0]?.nextDeliveryDate
        }));

        // Sort products by earliest release date
        return results.sort((a, b) => new Date(a.nextReleaseDate) - new Date(b.nextReleaseDate));
      }
    }
  },

  hooks: {
    before: {
      create: [
        async function(ctx) {
          if (ctx.params.parentId) {
            const parent = await this.adapter.findById(ctx.params.parentId);
            if (parent) ctx.params.parentName = parent.name;
          }
        }
      ],
      update: [
        async function(ctx) {
          if (ctx.params.parentId) {
            const parent = await this.adapter.findById(ctx.params.parentId);
            if (parent) ctx.params.parentName = parent.name;
          }
          // Store original for audit
          if (ctx.params.id) {
            ctx.locals = ctx.locals || {};
            ctx.locals.originalEntity = await this.adapter.findById(ctx.params.id);
          }
        }
      ]
    },
    after: {
      create: [
        async function(ctx, res) {
          try {
            await ctx.call("audit.log", {
              userId: ctx.meta.user?.id,
              userName: ctx.meta.user?.name,
              userEmail: ctx.meta.user?.email,
              action: "create",
              resourceType: "product",
              resourceId: res.id,
              resourceName: res.name,
              metadata: { ipAddress: ctx.meta.ipAddress }
            });
          } catch (err) {
            this.logger.warn("Failed to create audit log:", err.message);
          }
          return res;
        }
      ],
      update: [
        async function(ctx, res) {
          try {
            const original = ctx.locals?.originalEntity;
            const changes = [];
            if (original) {
              ["name", "description", "productOwner", "engineeringOwner", "deliveryLead"].forEach(field => {
                if (original[field] !== res[field]) {
                  changes.push({ field, oldValue: original[field], newValue: res[field] });
                }
              });
            }
            await ctx.call("audit.log", {
              userId: ctx.meta.user?.id,
              userName: ctx.meta.user?.name,
              userEmail: ctx.meta.user?.email,
              action: "update",
              resourceType: "product",
              resourceId: res.id,
              resourceName: res.name,
              changes: changes.length > 0 ? changes : null,
              metadata: { ipAddress: ctx.meta.ipAddress }
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
              resourceType: "product",
              resourceId: ctx.params.id,
              resourceName: "Product deleted",
              metadata: { ipAddress: ctx.meta.ipAddress }
            });
          } catch (err) {
            this.logger.warn("Failed to create audit log:", err.message);
          }
          return res;
        }
      ],
      list: [
        async function(ctx, res) {
          // Add deployment counts and sub-product counts to each product
          if (res.rows && res.rows.length > 0) {
            const deployments = await ctx.call("deployments.find", {});
            const deploymentCountMap = {};
            deployments.forEach(d => {
              deploymentCountMap[d.productId] = (deploymentCountMap[d.productId] || 0) + 1;
            });

            // Count sub-products for each parent
            const subProductCountMap = {};
            res.rows.forEach(p => {
              if (p.parentId) {
                subProductCountMap[p.parentId] = (subProductCountMap[p.parentId] || 0) + 1;
              }
            });

            res.rows = res.rows.map(p => ({
              ...p,
              deploymentCount: deploymentCountMap[p.id] || 0,
              subProductCount: subProductCountMap[p.id] || 0
            }));
          }
          return res;
        }
      ],
      get: [
        async function(ctx, res) {
          if (res) {
            const deployments = await ctx.call("deployments.find", { query: { productId: res.id } });
            res.deploymentCount = deployments.length;
          }
          return res;
        }
      ]
    }
  },

  methods: {
    /**
     * Migrate old documentation format (object with fixed keys) to new format (array)
     * Old format: { productGuide: url, releaseNotes: url, ... }
     * New format: [{ id, title, url, addedAt }]
     */
    migrateDocumentation(product) {
      const documentation = product.documentation;

      // Already in new format (array)
      if (Array.isArray(documentation)) {
        return documentation;
      }

      // Empty or null - return empty array
      if (!documentation || typeof documentation !== "object") {
        return [];
      }

      // Old format - convert to new format
      const typeLabels = {
        productGuide: "Product Guide",
        releaseNotes: "Release Notes",
        demoScript: "Demo Script",
        testCases: "Test Cases",
        productionChecklist: "Production Checklist"
      };

      const relevantDocs = product.relevantDocs || {};
      const docs = [];

      Object.entries(documentation).forEach(([key, url]) => {
        // Only include if URL exists and doc is marked as relevant
        if (url && relevantDocs[key] !== false) {
          docs.push({
            id: require("uuid").v4(),
            title: typeLabels[key] || key,
            url,
            addedAt: new Date()
          });
        }
      });

      return docs;
    }
  }
};
