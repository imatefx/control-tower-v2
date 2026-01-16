"use strict";

module.exports = {
  name: "reports",

  actions: {
    getDashboardMetrics: {
      async handler(ctx) {
        const deployments = await ctx.call("deployments.find", {});
        const products = await ctx.call("products.find", {});
        const clients = await ctx.call("clients.find", {});

        // Count only main products (exclude sub-products that have a parentId)
        const mainProducts = products.filter(p => !p.parentId);
        const eapProducts = mainProducts.filter(p => p.eap && p.eap.isActive).length;
        const completedDeployments = deployments.filter(d => d.status === "Released").length;

        // Group deployments by status
        const deploymentsByStatus = {
          not_started: 0,
          in_progress: 0,
          blocked: 0,
          completed: 0
        };
        deployments.forEach(d => {
          if (d.status === "Not Started") deploymentsByStatus.not_started++;
          else if (d.status === "In Progress") deploymentsByStatus.in_progress++;
          else if (d.status === "Blocked") deploymentsByStatus.blocked++;
          else if (d.status === "Released") deploymentsByStatus.completed++;
        });

        return {
          data: {
            totalProducts: mainProducts.length,
            eapProducts,
            totalClients: clients.length,
            totalDeployments: deployments.length,
            completedDeployments,
            deploymentsByStatus
          }
        };
      }
    },

    getDeploymentReport: {
      async handler(ctx) {
        const deployments = await ctx.call("deployments.find", {});
        const clients = await ctx.call("clients.find", {});

        // Group by product
        const byProductMap = {};
        deployments.forEach(d => {
          if (!byProductMap[d.productId]) {
            byProductMap[d.productId] = {
              productId: d.productId,
              productName: d.productName,
              total: 0,
              completed: 0
            };
          }
          byProductMap[d.productId].total++;
          if (d.status === "Released") byProductMap[d.productId].completed++;
        });
        const byProduct = Object.values(byProductMap).sort((a, b) => b.total - a.total);

        // Group by client
        const clientMap = {};
        clients.forEach(c => {
          clientMap[c.id] = c;
        });

        const byClientMap = {};
        deployments.forEach(d => {
          if (!byClientMap[d.clientId]) {
            const client = clientMap[d.clientId] || {};
            byClientMap[d.clientId] = {
              clientId: d.clientId,
              clientName: d.clientName,
              region: client.region || null,
              tier: client.tier || "standard",
              total: 0,
              inProgress: 0,
              completed: 0
            };
          }
          byClientMap[d.clientId].total++;
          if (d.status === "In Progress") byClientMap[d.clientId].inProgress++;
          if (d.status === "Released") byClientMap[d.clientId].completed++;
        });
        const byClient = Object.values(byClientMap).sort((a, b) => b.total - a.total);

        return { byProduct, byClient };
      }
    },

    getDeploymentTrend: {
      params: { weeks: { type: "number", optional: true, default: 8 } },
      async handler(ctx) {
        const deployments = await ctx.call("deployments.find", {});
        const weeks = ctx.params.weeks;
        const data = [];

        for (let i = weeks - 1; i >= 0; i--) {
          const weekStart = new Date();
          weekStart.setDate(weekStart.getDate() - (i * 7) - weekStart.getDay());
          weekStart.setHours(0, 0, 0, 0);

          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekEnd.getDate() + 7);

          const count = deployments.filter(d => {
            const created = new Date(d.createdAt);
            return created >= weekStart && created < weekEnd;
          }).length;

          data.push({
            week: weekStart.toISOString().split("T")[0],
            count
          });
        }

        return data;
      }
    },

    getStatusBreakdown: {
      async handler(ctx) {
        const deployments = await ctx.call("deployments.find", {});
        const breakdown = {
          "Not Started": 0,
          "In Progress": 0,
          "Blocked": 0,
          "Released": 0
        };

        deployments.forEach(d => {
          if (breakdown[d.status] !== undefined) {
            breakdown[d.status]++;
          }
        });

        return breakdown;
      }
    },

    getClientActivity: {
      params: { limit: { type: "number", optional: true, default: 5 } },
      async handler(ctx) {
        const deployments = await ctx.call("deployments.find", {});
        const clientCounts = {};

        deployments.forEach(d => {
          clientCounts[d.clientName] = (clientCounts[d.clientName] || 0) + 1;
        });

        return Object.entries(clientCounts)
          .sort((a, b) => b[1] - a[1])
          .slice(0, ctx.params.limit)
          .map(([name, count]) => ({ name, count }));
      }
    },

    getTeamPerformance: {
      async handler(ctx) {
        const deployments = await ctx.call("deployments.find", {});
        const personStats = {};

        deployments.forEach(d => {
          if (d.deliveryPerson) {
            if (!personStats[d.deliveryPerson]) {
              personStats[d.deliveryPerson] = { total: 0, released: 0, blocked: 0 };
            }
            personStats[d.deliveryPerson].total++;
            if (d.status === "Released") personStats[d.deliveryPerson].released++;
            if (d.status === "Blocked") personStats[d.deliveryPerson].blocked++;
          }
        });

        return Object.entries(personStats).map(([name, stats]) => ({
          name,
          ...stats,
          successRate: stats.total > 0 ? Math.round((stats.released / stats.total) * 100) : 0
        }));
      }
    },

    getClientHealth: {
      async handler(ctx) {
        const clients = await ctx.call("clients.find", {});
        const deployments = await ctx.call("deployments.find", {});

        return clients.map(client => {
          const clientDeployments = deployments.filter(d => d.clientId === client.id);
          const total = clientDeployments.length;
          const released = clientDeployments.filter(d => d.status === "Released").length;
          const blocked = clientDeployments.filter(d => d.status === "Blocked").length;

          const successRate = total > 0 ? (released / total) * 100 : 0;
          const blockedRate = total > 0 ? (blocked / total) * 100 : 0;

          // Health score: 0-100
          const healthScore = Math.round(
            (successRate * 0.4) +
            ((100 - blockedRate) * 0.3) +
            (total > 0 ? 30 : 0)
          );

          return {
            id: client.id,
            name: client.name,
            totalDeployments: total,
            released,
            blocked,
            successRate: Math.round(successRate),
            healthScore
          };
        }).sort((a, b) => b.healthScore - a.healthScore);
      }
    },

    getUpcomingReleases: {
      params: { days: { type: "number", optional: true, default: 30 } },
      async handler(ctx) {
        const deployments = await ctx.call("deployments.find", {});
        const today = new Date();
        const futureDate = new Date(today.getTime() + ctx.params.days * 24 * 60 * 60 * 1000);

        return deployments
          .filter(d =>
            d.nextDeliveryDate &&
            new Date(d.nextDeliveryDate) >= today &&
            new Date(d.nextDeliveryDate) <= futureDate &&
            d.status !== "Released"
          )
          .sort((a, b) => new Date(a.nextDeliveryDate) - new Date(b.nextDeliveryDate))
          .map(d => ({
            id: d.id,
            productName: d.productName,
            clientName: d.clientName,
            status: d.status,
            nextDeliveryDate: d.nextDeliveryDate,
            deliveryPerson: d.deliveryPerson
          }));
      }
    }
  }
};
