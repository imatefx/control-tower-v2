"use strict";

const DbMixin = require("../mixins/db.mixin");
const { DataTypes } = require("sequelize");

module.exports = {
  name: "products",
  mixins: [DbMixin("products")],

  settings: {
    fields: ["id", "name", "description", "productOwner", "engineeringOwner",
             "deliveryLead", "nextReleaseDate", "parentId", "parentName", "documentation",
             "relevantDocs", "eap", "isAdapter", "adapterServices",
             "notificationEmails", "subProductCount", "createdAt", "updatedAt"],
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
          isActive: false, startDate: null, endDate: null,
          jiraBoardUrl: null, clientIds: []
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
      notificationEmails: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] }
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

    getEapProducts: {
      async handler(ctx) {
        const products = await this.adapter.find({});
        return products.filter(p => p.eap && p.eap.isActive);
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
        }
      ]
    },
    after: {
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
  }
};
