"use strict";

const DbMixin = require("../mixins/db.mixin");
const { DataTypes } = require("sequelize");

const RESOURCE_ROLES = [
  { code: "FE", name: "Frontend Developer" },
  { code: "BE", name: "Backend Developer" },
  { code: "UX", name: "UX Designer" },
  { code: "DEVOPS", name: "DevOps Engineer" },
  { code: "ARCH", name: "Solution Architect" },
  { code: "PM", name: "Project Manager" },
  { code: "QA", name: "QA/Test Lead" },
  { code: "TL", name: "Team Lead" },
  { code: "PO", name: "Product Owner" },
  { code: "DATA", name: "Data Engineer/Analyst" },
];

module.exports = {
  name: "resource-allocation",
  mixins: [DbMixin("resource_allocations", ["productName", "role", "comment"])],

  settings: {
    fields: ["id", "productId", "productName", "role", "hours", "comment",
             "startDate", "endDate", "createdAt", "updatedAt"]
  },

  model: {
    name: "resourceAllocation",
    define: {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      productId: { type: DataTypes.UUID, allowNull: false },
      productName: { type: DataTypes.STRING(200) },
      role: { type: DataTypes.STRING(20), allowNull: false },
      hours: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
      comment: { type: DataTypes.TEXT },
      startDate: { type: DataTypes.DATEONLY, allowNull: true },
      endDate: { type: DataTypes.DATEONLY, allowNull: true }
    },
    options: { timestamps: true, paranoid: true, underscored: true }
  },

  actions: {
    getRoles: {
      handler() {
        return RESOURCE_ROLES;
      }
    },

    getByProduct: {
      params: { productId: "string" },
      async handler(ctx) {
        return this.adapter.find({
          query: { productId: ctx.params.productId },
          sort: "-startDate"
        });
      }
    },

    getSummaryByProduct: {
      params: { productId: "string" },
      async handler(ctx) {
        const allocations = await this.adapter.find({
          query: { productId: ctx.params.productId }
        });
        const summary = {};
        let totalHours = 0;
        allocations.forEach(a => {
          const hours = parseFloat(a.hours);
          totalHours += hours;
          if (!summary[a.role]) {
            summary[a.role] = { role: a.role, count: 0, totalHours: 0 };
          }
          summary[a.role].count += 1;
          summary[a.role].totalHours += hours;
        });
        return { totalHours, byRole: Object.values(summary) };
      }
    },

    getAllSummaries: {
      async handler(ctx) {
        const allocations = await this.adapter.find({});
        const summaryByProduct = {};

        allocations.forEach(a => {
          const productId = a.productId;
          if (!summaryByProduct[productId]) {
            summaryByProduct[productId] = {
              productId,
              productName: a.productName,
              totalHours: 0,
              byRole: {}
            };
          }
          const hours = parseFloat(a.hours);
          summaryByProduct[productId].totalHours += hours;

          if (!summaryByProduct[productId].byRole[a.role]) {
            summaryByProduct[productId].byRole[a.role] = { role: a.role, count: 0, totalHours: 0 };
          }
          summaryByProduct[productId].byRole[a.role].count += 1;
          summaryByProduct[productId].byRole[a.role].totalHours += hours;
        });

        // Convert byRole objects to arrays
        Object.values(summaryByProduct).forEach(s => {
          s.byRole = Object.values(s.byRole);
        });

        return summaryByProduct;
      }
    }
  },

  hooks: {
    before: {
      create: [
        async function(ctx) {
          const product = await ctx.call("products.get", { id: ctx.params.productId });
          if (!product) throw new Error("Product not found");
          ctx.params.productName = product.name;
          // Default dates from product if not provided
          if (!ctx.params.startDate && product.createdAt) {
            ctx.params.startDate = product.createdAt.split("T")[0];
          }
          if (!ctx.params.endDate && product.nextReleaseDate) {
            ctx.params.endDate = product.nextReleaseDate;
          }
        }
      ]
    }
  }
};
