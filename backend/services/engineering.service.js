"use strict";

const DbMixin = require("../mixins/db.mixin");
const { DataTypes } = require("sequelize");

module.exports = {
  name: "engineering",
  mixins: [DbMixin("team_capacity")],

  settings: {
    fields: ["id", "userId", "userName", "managerId", "managerName", "maxCapacity",
             "currentLoad", "utilizationPercent", "skills", "availability",
             "unavailableDates", "createdAt", "updatedAt"]
  },

  model: {
    name: "teamCapacity",
    define: {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      userId: { type: DataTypes.UUID, allowNull: false },
      userName: { type: DataTypes.STRING(100) },
      managerId: { type: DataTypes.UUID },
      managerName: { type: DataTypes.STRING(100) },
      maxCapacity: { type: DataTypes.INTEGER, defaultValue: 5 },
      currentLoad: { type: DataTypes.INTEGER, defaultValue: 0 },
      utilizationPercent: { type: DataTypes.FLOAT, defaultValue: 0 },
      skills: { type: DataTypes.ARRAY(DataTypes.STRING), defaultValue: [] },
      availability: {
        type: DataTypes.ENUM("available", "busy", "overloaded", "unavailable"),
        defaultValue: "available"
      },
      unavailableDates: { type: DataTypes.JSONB, defaultValue: [] }
    },
    options: { timestamps: true, paranoid: true, underscored: true }
  },

  actions: {
    getDashboard: {
      params: { managerId: { type: "string", optional: true } },
      async handler(ctx) {
        const { managerId } = ctx.params;
        let teamMembers = await this.adapter.find({});

        if (managerId) {
          teamMembers = teamMembers.filter(t => t.managerId === managerId);
        }

        const deployments = await ctx.call("deployments.find", {});
        const teamUserIds = teamMembers.map(t => t.userId);

        const teamDeployments = deployments.filter(d =>
          teamUserIds.some(id => d.deliveryPerson && d.deliveryPerson.includes(id))
        );

        const activeAssignments = teamDeployments.filter(d => d.status !== "Released").length;
        const blocked = teamDeployments.filter(d => d.status === "Blocked").length;
        const overdue = teamDeployments.filter(d =>
          d.nextDeliveryDate &&
          new Date(d.nextDeliveryDate) < new Date() &&
          d.status !== "Released"
        ).length;

        const totalCapacity = teamMembers.reduce((sum, t) => sum + t.maxCapacity, 0);
        const totalLoad = teamMembers.reduce((sum, t) => sum + t.currentLoad, 0);
        const utilization = totalCapacity > 0 ? Math.round((totalLoad / totalCapacity) * 100) : 0;

        return {
          teamMembers: teamMembers.length,
          activeAssignments,
          teamUtilization: utilization,
          blockedByTeam: blocked,
          overdueAssignments: overdue,
          capacityBreakdown: teamMembers.map(t => ({
            userId: t.userId,
            name: t.userName,
            current: t.currentLoad,
            max: t.maxCapacity,
            utilization: t.utilizationPercent
          }))
        };
      }
    },

    getTeamMembers: {
      params: { managerId: "string" },
      async handler(ctx) {
        return this.adapter.find({ query: { managerId: ctx.params.managerId } });
      }
    },

    updateCapacity: {
      params: {
        userId: "string",
        maxCapacity: { type: "number", optional: true },
        skills: { type: "array", optional: true },
        availability: { type: "string", optional: true }
      },
      async handler(ctx) {
        const { userId, ...updates } = ctx.params;
        const capacity = await this.adapter.findOne({ where: { userId } });
        if (!capacity) throw new Error("Team member capacity not found");

        if (updates.maxCapacity !== undefined) {
          updates.utilizationPercent = capacity.currentLoad > 0
            ? Math.round((capacity.currentLoad / updates.maxCapacity) * 100)
            : 0;
        }

        return this.adapter.updateById(capacity.id, updates);
      }
    },

    reassign: {
      params: {
        deploymentId: "string",
        fromUserId: "string",
        toUserId: "string",
        reason: { type: "string", optional: true }
      },
      async handler(ctx) {
        const { deploymentId, fromUserId, toUserId, reason } = ctx.params;

        // Get the to user's name
        const toUser = await ctx.call("users.get", { id: toUserId });
        if (!toUser) throw new Error("Target user not found");

        // Update deployment
        const deployment = await ctx.call("deployments.update", {
          id: deploymentId,
          deliveryPerson: toUser.name
        });

        // Update capacity records
        const fromCapacity = await this.adapter.findOne({ where: { userId: fromUserId } });
        const toCapacity = await this.adapter.findOne({ where: { userId: toUserId } });

        if (fromCapacity) {
          const newLoad = Math.max(0, fromCapacity.currentLoad - 1);
          await this.adapter.updateById(fromCapacity.id, {
            currentLoad: newLoad,
            utilizationPercent: fromCapacity.maxCapacity > 0
              ? Math.round((newLoad / fromCapacity.maxCapacity) * 100)
              : 0
          });
        }

        if (toCapacity) {
          const newLoad = toCapacity.currentLoad + 1;
          await this.adapter.updateById(toCapacity.id, {
            currentLoad: newLoad,
            utilizationPercent: toCapacity.maxCapacity > 0
              ? Math.round((newLoad / toCapacity.maxCapacity) * 100)
              : 0
          });
        }

        this.broker.emit("deployment.reassigned", {
          deployment,
          fromUserId,
          toUserId,
          reason
        });

        return deployment;
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

          // Calculate time in current status
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
        const teamMembers = await this.adapter.find({});

        const overloaded = teamMembers.filter(t => t.utilizationPercent > 100);
        const busy = teamMembers.filter(t => t.utilizationPercent >= 80 && t.utilizationPercent <= 100);
        const available = teamMembers.filter(t => t.utilizationPercent < 80);

        return {
          summary: {
            total: teamMembers.length,
            overloaded: overloaded.length,
            busy: busy.length,
            available: available.length
          },
          members: teamMembers.map(t => ({
            id: t.id,
            userId: t.userId,
            name: t.userName,
            currentLoad: t.currentLoad,
            maxCapacity: t.maxCapacity,
            utilization: t.utilizationPercent,
            availability: t.availability,
            skills: t.skills
          }))
        };
      }
    }
  }
};
