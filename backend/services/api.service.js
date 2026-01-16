"use strict";

const ApiGateway = require("moleculer-web");
const jwt = require("jsonwebtoken");

module.exports = {
  name: "api",
  mixins: [ApiGateway],

  settings: {
    port: process.env.PORT || 3000,
    ip: "0.0.0.0",

    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: ["Content-Type", "Authorization"],
      credentials: false
    },

    routes: [
      // Public routes (no auth)
      {
        path: "/auth",
        whitelist: ["auth.login", "auth.verify", "auth.refresh"],
        aliases: {
          "POST /login": "auth.login",
          "POST /verify": "auth.verify",
          "POST /refresh": "auth.refresh"
        },
        bodyParsers: { json: true }
      },

      // Protected routes
      {
        path: "/api",
        authorization: true,
        whitelist: ["**"],
        aliases: {
          // Users
          "GET /users": "users.list",
          "GET /users/:id": "users.get",
          "POST /users": "users.createUser",
          "PUT /users/:id": "users.update",
          "DELETE /users/:id": "users.remove",

          // Products
          "GET /products": "products.list",
          "GET /products/:id": "products.get",
          "GET /products/:id/children": "products.getWithChildren",
          "POST /products": "products.create",
          "PUT /products/:id": "products.update",
          "DELETE /products/:id": "products.remove",
          "GET /products/eap/active": "products.getEapProducts",
          "GET /products/upcoming-releases": "products.getWithUpcomingReleases",

          // Clients
          "GET /clients": "clients.list",
          "GET /clients/:id": "clients.get",
          "GET /clients/:id/deployments": "clients.getWithDeployments",
          "POST /clients": "clients.create",
          "PUT /clients/:id": "clients.update",
          "DELETE /clients/:id": "clients.remove",
          "POST /clients/:id/documentation": "clients.addDocumentation",
          "DELETE /clients/:id/documentation/:docId": "clients.removeDocumentation",

          // Deployments
          "GET /deployments": "deployments.list",
          "GET /deployments/:id": "deployments.get",
          "POST /deployments": "deployments.create",
          "PUT /deployments/:id": "deployments.update",
          "DELETE /deployments/:id": "deployments.remove",
          "PUT /deployments/:id/status": "deployments.updateStatus",
          "POST /deployments/:id/comment": "deployments.addBlockedComment",
          "GET /deployments/status/:status": "deployments.getByStatus",
          "GET /deployments/overdue": "deployments.getOverdue",
          "GET /deployments/upcoming": "deployments.getUpcoming",
          "GET /deployments/product/:productId/with-children": "deployments.getByProductWithChildren",

          // Checklists
          "GET /checklists/deployment/:deploymentId": "checklists.getByDeployment",
          "POST /checklists": "checklists.create",
          "PUT /checklists/:id/toggle": "checklists.toggleItem",
          "PUT /checklists/deployment/:deploymentId/complete": "checklists.markAllComplete",
          "PUT /checklists/deployment/:deploymentId/reset": "checklists.resetAll",
          "GET /checklists/deployment/:deploymentId/progress": "checklists.getProgress",

          // Checklist Templates (Admin)
          "GET /checklist-templates": "checklistTemplates.list",
          "GET /checklist-templates/active": "checklistTemplates.getActive",
          "GET /checklist-templates/:id": "checklistTemplates.get",
          "POST /checklist-templates": "checklistTemplates.create",
          "PUT /checklist-templates/:id": "checklistTemplates.update",
          "DELETE /checklist-templates/:id": "checklistTemplates.remove",
          "POST /checklist-templates/reorder": "checklistTemplates.reorder",
          "POST /checklist-templates/seed": "checklistTemplates.seedDefaults",

          // Release Note Templates
          "GET /release-note-templates": "releaseNoteTemplates.list",
          "GET /release-note-templates/active": "releaseNoteTemplates.getActive",
          "GET /release-note-templates/:id": "releaseNoteTemplates.get",

          // Release Notes
          "GET /release-notes": "releaseNotes.list",
          "GET /release-notes/:id": "releaseNotes.get",
          "GET /release-notes/product/:productId": "releaseNotes.getByProduct",
          "GET /release-notes/:id/export": "releaseNotes.getForExport",
          "POST /release-notes": "releaseNotes.create",
          "PUT /release-notes/:id": "releaseNotes.update",
          "DELETE /release-notes/:id": "releaseNotes.remove",
          "POST /release-notes/:id/items": "releaseNotes.addItem",
          "DELETE /release-notes/:id/items/:itemId": "releaseNotes.removeItem",

          // Approvals
          "GET /approvals": "approvals.list",
          "GET /approvals/pending": "approvals.getPending",
          "GET /approvals/:id": "approvals.get",
          "POST /approvals/request": "approvals.requestApproval",
          "POST /approvals/:id/approve": "approvals.approve",
          "POST /approvals/:id/reject": "approvals.reject",
          "GET /approvals/deployment/:deploymentId": "approvals.getByDeployment",

          // Audit Logs
          "GET /audit-logs": "audit.search",
          "GET /audit-logs/:id": "audit.get",
          "GET /audit-logs/resource/:resourceType/:resourceId": "audit.getByResource",
          "GET /audit-logs/user/:userId": "audit.getByUser",

          // Config
          "GET /config/:key": "config.getValue",
          "POST /config/:key": "config.setValue",
          "GET /config/doc-types": "config.getDocTypes",
          "GET /config/deployment-doc-types": "config.getDeploymentDocTypes",
          "POST /config/doc-types": "config.setDocTypes",
          "POST /config/deployment-doc-types": "config.setDeploymentDocTypes",

          // Reports
          "GET /reports/dashboard": "reports.getDashboardMetrics",
          "GET /reports/deployments": "reports.getDeploymentReport",
          "GET /reports/deployment-trend": "reports.getDeploymentTrend",
          "GET /reports/status-breakdown": "reports.getStatusBreakdown",
          "GET /reports/client-activity": "reports.getClientActivity",
          "GET /reports/team-performance": "reports.getTeamPerformance",
          "GET /reports/client-health": "reports.getClientHealth",
          "GET /reports/upcoming-releases": "reports.getUpcomingReleases",

          // Engineering
          "GET /engineering/dashboard": "engineering.getDashboard",
          "GET /engineering/team/:managerId": "engineering.getTeamMembers",
          "GET /engineering/capacity": "engineering.list",
          "POST /engineering/capacity": "engineering.create",
          "PUT /engineering/capacity/:id": "engineering.update",
          "POST /engineering/reassign": "engineering.reassign",
          "GET /engineering/bottlenecks": "engineering.getBottlenecks",
          "GET /engineering/utilization": "engineering.getUtilizationReport",

          // Resource Allocation
          "GET /resource-allocation": "resource-allocation.list",
          "GET /resource-allocation/roles": "resource-allocation.getRoles",
          "GET /resource-allocation/summaries": "resource-allocation.getAllSummaries",
          "GET /resource-allocation/product/:productId": "resource-allocation.getByProduct",
          "GET /resource-allocation/product/:productId/summary": "resource-allocation.getSummaryByProduct",
          "GET /resource-allocation/:id": "resource-allocation.get",
          "POST /resource-allocation": "resource-allocation.create",
          "PUT /resource-allocation/:id": "resource-allocation.update",
          "DELETE /resource-allocation/:id": "resource-allocation.remove"
        },
        bodyParsers: { json: { limit: "10MB" } },

        onBeforeCall(ctx, route, req, res) {
          ctx.meta.user = req.$ctx.meta.user;
        }
      }
    ],

    onError(req, res, err) {
      res.setHeader("Content-Type", "application/json");
      res.writeHead(err.code || 500);
      res.end(JSON.stringify({
        error: true,
        message: err.message,
        code: err.code || "INTERNAL_ERROR"
      }));
    }
  },

  methods: {
    authorize(ctx, route, req) {
      const auth = req.headers["authorization"];
      if (!auth || !auth.startsWith("Bearer ")) {
        return Promise.reject(new ApiGateway.Errors.UnAuthorizedError("NO_TOKEN"));
      }

      const token = auth.slice(7);
      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "control-tower-secret");
        ctx.meta.user = decoded;
        return Promise.resolve(ctx);
      } catch (err) {
        return Promise.reject(new ApiGateway.Errors.UnAuthorizedError("INVALID_TOKEN"));
      }
    }
  }
};
