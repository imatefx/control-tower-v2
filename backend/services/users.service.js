"use strict";

const DbMixin = require("../mixins/db.mixin");
const { DataTypes } = require("sequelize");
const bcrypt = require("bcryptjs");

module.exports = {
  name: "users",
  mixins: [DbMixin("users")],

  settings: {
    fields: ["id", "email", "name", "role", "assignedProductIds", "managedTeamIds",
             "maxCapacity", "skills", "notificationPreferences", "lastLoginAt",
             "createdAt", "updatedAt"],
    entityValidator: {
      email: { type: "email" },
      name: { type: "string", min: 1, max: 100 },
      role: { type: "enum", values: ["admin", "user", "viewer", "delivery_lead", "product_owner", "engineering_manager", "general_manager", "head_of_products", "avp"] }
    }
  },

  model: {
    name: "user",
    define: {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      email: { type: DataTypes.STRING(255), allowNull: false, unique: true },
      passwordHash: { type: DataTypes.STRING(255), allowNull: false },
      name: { type: DataTypes.STRING(100), allowNull: false },
      role: {
        type: DataTypes.ENUM("admin", "user", "viewer", "delivery_lead", "product_owner", "engineering_manager", "general_manager", "head_of_products", "avp"),
        defaultValue: "user"
      },
      assignedProductIds: { type: DataTypes.ARRAY(DataTypes.UUID), defaultValue: [] },
      managedTeamIds: { type: DataTypes.ARRAY(DataTypes.UUID), defaultValue: [] },
      maxCapacity: { type: DataTypes.INTEGER, defaultValue: 5 },
      skills: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
      notificationPreferences: {
        type: DataTypes.JSONB,
        defaultValue: { email: true, inApp: true, events: [] }
      },
      lastLoginAt: { type: DataTypes.DATE }
    },
    options: { timestamps: true, paranoid: true, underscored: true }
  },

  actions: {
    createUser: {
      params: {
        email: "email",
        password: "string|min:8",
        name: "string",
        role: { type: "enum", values: ["admin", "user", "viewer", "delivery_lead", "product_owner", "engineering_manager", "general_manager", "head_of_products", "avp"], optional: true }
      },
      async handler(ctx) {
        const { email, password, name, role = "user" } = ctx.params;
        const existing = await this.adapter.findOne({ where: { email } });
        if (existing) throw new Error("Email already exists");

        const passwordHash = await bcrypt.hash(password, 10);
        return this.adapter.insert({ email, passwordHash, name, role });
      }
    },

    findByEmail: {
      params: { email: "email" },
      async handler(ctx) {
        return this.adapter.findOne({ where: { email: ctx.params.email } });
      }
    },

    updateLastLogin: {
      params: { id: "string" },
      async handler(ctx) {
        return this.adapter.updateById(ctx.params.id, { lastLoginAt: new Date() });
      }
    }
  },

  async started() {
    if (this.adapter && this.adapter.model) {
      const force = process.env.DB_SYNC_FORCE === "true";
      await this.adapter.model.sync({ force });
    }

    // Create default admin if not exists
    const adminEmail = process.env.SUPER_ADMIN_EMAIL || "admin@example.com";
    const adminPassword = process.env.SUPER_ADMIN_PASSWORD || "admin123";

    try {
      const existing = await this.adapter.findOne({ where: { email: adminEmail } });
      if (!existing) {
        const passwordHash = await bcrypt.hash(adminPassword, 10);
        await this.adapter.insert({
          email: adminEmail,
          passwordHash,
          name: "Admin",
          role: "admin"
        });
        this.logger.info("Default admin created: " + adminEmail);
      }
    } catch (err) {
      this.logger.error("Failed to create default admin:", err);
    }
  }
};
