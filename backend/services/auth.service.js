"use strict";

const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");

module.exports = {
  name: "auth",

  settings: {
    jwtSecret: process.env.JWT_SECRET || "control-tower-secret",
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || "12h"
  },

  actions: {
    login: {
      params: {
        email: "email",
        password: "string"
      },
      async handler(ctx) {
        const { email, password } = ctx.params;
        const user = await ctx.call("users.findByEmail", { email });

        if (!user) {
          throw new Error("Invalid credentials");
        }

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) {
          throw new Error("Invalid credentials");
        }

        await ctx.call("users.updateLastLogin", { id: user.id });

        const token = jwt.sign(
          { id: user.id, email: user.email, role: user.role, name: user.name },
          this.settings.jwtSecret,
          { expiresIn: this.settings.jwtExpiresIn }
        );

        return {
          token,
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
          }
        };
      }
    },

    verify: {
      params: { token: "string" },
      handler(ctx) {
        try {
          const decoded = jwt.verify(ctx.params.token, this.settings.jwtSecret);
          return { valid: true, user: decoded };
        } catch (err) {
          return { valid: false, error: err.message };
        }
      }
    },

    refresh: {
      params: { token: "string" },
      async handler(ctx) {
        const result = await this.actions.verify({ token: ctx.params.token });
        if (!result.valid) throw new Error("Invalid token");

        const user = await ctx.call("users.get", { id: result.user.id });
        if (!user) throw new Error("User not found");

        const newToken = jwt.sign(
          { id: user.id, email: user.email, role: user.role, name: user.name },
          this.settings.jwtSecret,
          { expiresIn: this.settings.jwtExpiresIn }
        );

        return { token: newToken, user };
      }
    }
  }
};
