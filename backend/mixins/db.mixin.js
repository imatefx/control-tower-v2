"use strict";

const DbService = require("moleculer-db");
const SequelizeAdapter = require("moleculer-db-adapter-sequelize");

module.exports = function(collection) {
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
          await this.adapter.model.sync({ force });
          this.logger.info(`Database synced for ${this.name}`);
        }
      } catch (err) {
        this.logger.warn(`Database sync skipped for ${this.name}: ${err.message}`);
      }
    }
  };
};
