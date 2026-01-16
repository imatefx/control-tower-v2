"use strict";

const DbMixin = require("../mixins/db.mixin");
const { DataTypes } = require("sequelize");

module.exports = {
  name: "engineering",
  mixins: [DbMixin("team_capacity", ["teamName"])],

  settings: {
    fields: ["id", "teamName", "totalCapacity", "allocatedCapacity", "availableCapacity",
             "weekStart", "createdAt", "updatedAt"]
  },

  model: {
    name: "teamCapacity",
    define: {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      teamName: { type: DataTypes.STRING(100), allowNull: false },
      totalCapacity: { type: DataTypes.INTEGER, defaultValue: 0 },
      allocatedCapacity: { type: DataTypes.INTEGER, defaultValue: 0 },
      availableCapacity: { type: DataTypes.INTEGER, defaultValue: 0 },
      weekStart: { type: DataTypes.DATEONLY }
    },
    options: { timestamps: true, paranoid: true, underscored: true }
  },

  actions: {
    getDashboard: {
      async handler(ctx) {
        const teams = await this.adapter.find({});
        const deployments = await ctx.call("deployments.find", {});

        const activeAssignments = deployments.filter(d => d.status !== "Released").length;
        const blocked = deployments.filter(d => d.status === "Blocked").length;
        const overdue = deployments.filter(d =>
          d.nextDeliveryDate &&
          new Date(d.nextDeliveryDate) < new Date() &&
          d.status !== "Released"
        ).length;

        const totalCapacity = teams.reduce((sum, t) => sum + t.totalCapacity, 0);
        const allocatedCapacity = teams.reduce((sum, t) => sum + t.allocatedCapacity, 0);
        const utilization = totalCapacity > 0 ? Math.round((allocatedCapacity / totalCapacity) * 100) : 0;

        return {
          teams: teams.length,
          activeAssignments,
          teamUtilization: utilization,
          blockedByTeam: blocked,
          overdueAssignments: overdue,
          capacityBreakdown: teams.map(t => ({
            id: t.id,
            name: t.teamName,
            total: t.totalCapacity,
            allocated: t.allocatedCapacity,
            available: t.availableCapacity
          }))
        };
      }
    },

    getTeamMembers: {
      params: { managerId: "string" },
      async handler(ctx) {
        return this.adapter.find({});
      }
    },

    getBottlenecks: {
      async handler(ctx) {
        const deployments = await ctx.call("deployments.find", {});
        const blockedReasons = {};
        const statusDurations = {};

        deployments.forEach(d => {
          if (d.status === "Blocked" && d.blockedComments && d.blockedComments.length > 0) {
            const reason = d.blockedComments[0].text.substring(0, 50);
            blockedReasons[reason] = (blockedReasons[reason] || 0) + 1;
          }

          if (d.statusHistory && d.statusHistory.length > 0) {
            const lastChange = d.statusHistory[d.statusHistory.length - 1];
            const days = Math.floor((Date.now() - new Date(lastChange.timestamp)) / (1000 * 60 * 60 * 24));
            if (!statusDurations[d.status]) statusDurations[d.status] = [];
            statusDurations[d.status].push(days);
          }
        });

        const avgDurations = {};
        Object.entries(statusDurations).forEach(([status, durations]) => {
          avgDurations[status] = Math.round(durations.reduce((a, b) => a + b, 0) / durations.length);
        });

        return {
          blockerCategories: Object.entries(blockedReasons)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([reason, count]) => ({ reason, count })),
          averageTimeInStatus: avgDurations,
          totalBlocked: deployments.filter(d => d.status === "Blocked").length
        };
      }
    },

    getUtilizationReport: {
      async handler(ctx) {
        const teams = await this.adapter.find({});

        const totalCapacity = teams.reduce((sum, t) => sum + t.totalCapacity, 0);
        const allocatedCapacity = teams.reduce((sum, t) => sum + t.allocatedCapacity, 0);
        const availableCapacity = teams.reduce((sum, t) => sum + t.availableCapacity, 0);

        return {
          summary: {
            totalTeams: teams.length,
            totalCapacity,
            allocatedCapacity,
            availableCapacity,
            utilization: totalCapacity > 0 ? Math.round((allocatedCapacity / totalCapacity) * 100) : 0
          },
          teams: teams.map(t => ({
            id: t.id,
            teamName: t.teamName,
            totalCapacity: t.totalCapacity,
            allocatedCapacity: t.allocatedCapacity,
            availableCapacity: t.availableCapacity,
            weekStart: t.weekStart
          }))
        };
      }
    }
  }
};
