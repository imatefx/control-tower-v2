"use strict";

const Cron = require("moleculer-cron");

module.exports = {
  name: "notifications",
  mixins: [Cron],

  settings: {
    // Email configuration (would be set via env vars in production)
    smtp: {
      host: process.env.SMTP_HOST || "localhost",
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    },
    fromEmail: process.env.SMTP_FROM || "noreply@controltower.com"
  },

  crons: [
    {
      name: "DeploymentNotifications",
      cronTime: "0 9 * * *", // Run daily at 9 AM
      onTick: async function() {
        this.logger.info("Running deployment notification check...");
        await this.call("notifications.checkDeploymentNotifications");
      },
      runOnInit: false,
      timeZone: "America/New_York"
    }
  ],

  actions: {
    checkDeploymentNotifications: {
      async handler(ctx) {
        const deployments = await ctx.call("deployments.find", {});
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const notifications = [];

        for (const deployment of deployments) {
          if (deployment.status === "Released" || !deployment.nextDeliveryDate) continue;

          const deliveryDate = new Date(deployment.nextDeliveryDate);
          deliveryDate.setHours(0, 0, 0, 0);
          const daysUntil = Math.ceil((deliveryDate - today) / (1000 * 60 * 60 * 24));

          // Collect all recipients
          const recipients = await this.collectRecipients(ctx, deployment);
          if (recipients.length === 0) continue;

          const lastSent = deployment.lastNotificationSent || {};
          const todayStr = today.toISOString().split("T")[0];

          // Check notification rules
          let shouldNotify = false;
          let notificationType = null;
          let subject = "";
          let message = "";

          if (daysUntil === 7 && lastSent["7_days"] !== todayStr) {
            shouldNotify = true;
            notificationType = "7_days";
            subject = `[Reminder] Deployment in 7 days: ${deployment.productName}`;
            message = this.buildNotificationMessage(deployment, "7 days", daysUntil);
          } else if (daysUntil === 3 && lastSent["3_days"] !== todayStr) {
            shouldNotify = true;
            notificationType = "3_days";
            subject = `[Reminder] Deployment in 3 days: ${deployment.productName}`;
            message = this.buildNotificationMessage(deployment, "3 days", daysUntil);
          } else if (daysUntil === 0 && lastSent["due_today"] !== todayStr) {
            shouldNotify = true;
            notificationType = "due_today";
            subject = `[ACTION REQUIRED] Deployment Due Today: ${deployment.productName}`;
            message = this.buildNotificationMessage(deployment, "due today", daysUntil);
          } else if (daysUntil < 0 && lastSent["overdue"] !== todayStr) {
            // Overdue - send daily
            shouldNotify = true;
            notificationType = "overdue";
            subject = `[OVERDUE] Deployment ${Math.abs(daysUntil)} days overdue: ${deployment.productName}`;
            message = this.buildNotificationMessage(deployment, "overdue", daysUntil);
          }

          if (shouldNotify) {
            notifications.push({
              deploymentId: deployment.id,
              recipients,
              subject,
              message,
              notificationType
            });

            // Update last notification sent
            const updatedLastSent = { ...lastSent, [notificationType]: todayStr };
            await ctx.call("deployments.update", {
              id: deployment.id,
              lastNotificationSent: updatedLastSent
            });
          }
        }

        // Send notifications
        for (const notification of notifications) {
          await this.sendNotification(ctx, notification);
        }

        this.logger.info(`Processed ${deployments.length} deployments, sent ${notifications.length} notifications`);
        return { processed: deployments.length, sent: notifications.length };
      }
    },

    sendTestNotification: {
      params: {
        deploymentId: "string",
        email: "string"
      },
      async handler(ctx) {
        const deployment = await ctx.call("deployments.get", { id: ctx.params.deploymentId });
        if (!deployment) throw new Error("Deployment not found");

        const today = new Date();
        const deliveryDate = new Date(deployment.nextDeliveryDate);
        const daysUntil = Math.ceil((deliveryDate - today) / (1000 * 60 * 60 * 24));

        const notification = {
          deploymentId: deployment.id,
          recipients: [ctx.params.email],
          subject: `[Test] Deployment Reminder: ${deployment.productName}`,
          message: this.buildNotificationMessage(deployment, "test", daysUntil),
          notificationType: "test"
        };

        await this.sendNotification(ctx, notification);
        return { success: true, sentTo: ctx.params.email };
      }
    },

    getNotificationRecipients: {
      params: { deploymentId: "string" },
      async handler(ctx) {
        const deployment = await ctx.call("deployments.get", { id: ctx.params.deploymentId });
        if (!deployment) throw new Error("Deployment not found");
        return this.collectRecipients(ctx, deployment);
      }
    }
  },

  methods: {
    async collectRecipients(ctx, deployment) {
      const recipients = new Set();

      // Add custom notification emails
      if (deployment.notificationEmails && deployment.notificationEmails.length > 0) {
        deployment.notificationEmails.forEach(email => recipients.add(email));
      }

      // Get product info for PO and EO
      if (deployment.productId) {
        try {
          const product = await ctx.call("products.get", { id: deployment.productId });
          if (product) {
            // Add Product Owner email (assuming name might be email or we lookup)
            if (product.productOwner) {
              const poUser = await this.findUserByName(ctx, product.productOwner);
              if (poUser && poUser.email) recipients.add(poUser.email);
            }
            // Add Engineering Owner email
            if (product.engineeringOwner) {
              const eoUser = await this.findUserByName(ctx, product.engineeringOwner);
              if (eoUser && eoUser.email) recipients.add(eoUser.email);
            }
            // Add Delivery Lead email
            if (product.deliveryLead) {
              const dlUser = await this.findUserByName(ctx, product.deliveryLead);
              if (dlUser && dlUser.email) recipients.add(dlUser.email);
            }
          }
        } catch (err) {
          this.logger.warn(`Could not fetch product for deployment ${deployment.id}: ${err.message}`);
        }
      }

      // Add delivery person email
      if (deployment.deliveryPerson) {
        const dpUser = await this.findUserByName(ctx, deployment.deliveryPerson);
        if (dpUser && dpUser.email) recipients.add(dpUser.email);
      }

      // Add owner email
      if (deployment.ownerName) {
        const ownerUser = await this.findUserByName(ctx, deployment.ownerName);
        if (ownerUser && ownerUser.email) recipients.add(ownerUser.email);
      }

      // Add all General Managers - they receive alerts for ALL deployments
      try {
        const generalManagers = await ctx.call("users.find", { query: { role: "general_manager" } });
        generalManagers.forEach(gm => {
          if (gm.email) recipients.add(gm.email);
        });
      } catch (err) {
        this.logger.warn(`Could not fetch general managers: ${err.message}`);
      }

      return Array.from(recipients);
    },

    async findUserByName(ctx, name) {
      if (!name) return null;
      try {
        const users = await ctx.call("users.find", { query: { name } });
        return users.length > 0 ? users[0] : null;
      } catch (err) {
        this.logger.warn(`Could not find user by name ${name}: ${err.message}`);
        return null;
      }
    },

    buildNotificationMessage(deployment, type, daysUntil) {
      const clientInfo = deployment.clientNames && deployment.clientNames.length > 0
        ? deployment.clientNames.join(", ")
        : deployment.clientName || "N/A";

      const statusEmoji = {
        "Not Started": "🔵",
        "In Progress": "🟡",
        "Blocked": "🔴",
        "Released": "🟢"
      };

      let urgencyMessage = "";
      if (type === "overdue") {
        urgencyMessage = `⚠️ This deployment is ${Math.abs(daysUntil)} day(s) OVERDUE and requires immediate attention.`;
      } else if (type === "due today") {
        urgencyMessage = "🚨 This deployment is DUE TODAY. Please ensure all tasks are completed.";
      } else if (type === "3 days") {
        urgencyMessage = "⏰ Only 3 days remaining. Please verify all checklist items are on track.";
      } else if (type === "7 days") {
        urgencyMessage = "📅 You have 7 days until deployment. Please review the status and prepare accordingly.";
      }

      return `
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
DEPLOYMENT NOTIFICATION
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

${urgencyMessage}

📦 Product: ${deployment.productName}
🏢 Client(s): ${clientInfo}
📋 Type: ${deployment.deploymentType?.toUpperCase() || "N/A"}
🌐 Environment: ${deployment.environment || "N/A"}
📅 Delivery Date: ${deployment.nextDeliveryDate || "Not set"}
${statusEmoji[deployment.status] || "⚪"} Status: ${deployment.status}

👤 Owner: ${deployment.ownerName || "Not assigned"}
👷 Delivery Person: ${deployment.deliveryPerson || "Not assigned"}

${deployment.featureName ? `🎯 Feature: ${deployment.featureName}` : ""}
${deployment.notes ? `📝 Notes: ${deployment.notes}` : ""}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
View deployment: ${process.env.APP_URL || "http://localhost:5173"}/deployments/${deployment.id}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

This is an automated notification from Control Tower.
`;
    },

    async sendNotification(ctx, notification) {
      const { recipients, subject, message, deploymentId, notificationType } = notification;

      this.logger.info(`Sending ${notificationType} notification for deployment ${deploymentId} to ${recipients.length} recipients`);

      // In production, this would use nodemailer or similar
      // For now, emit an event and log
      this.broker.emit("notification.email", {
        to: recipients,
        subject,
        body: message,
        deploymentId,
        type: notificationType,
        sentAt: new Date()
      });

      // Log to audit
      try {
        await ctx.call("audit.create", {
          action: "notification_sent",
          entityType: "deployment",
          entityId: deploymentId,
          details: {
            recipients,
            notificationType,
            subject
          },
          performedBy: "system"
        });
      } catch (err) {
        this.logger.warn(`Could not create audit log: ${err.message}`);
      }

      // For development, just log the email
      this.logger.info(`
========== EMAIL NOTIFICATION ==========
To: ${recipients.join(", ")}
Subject: ${subject}
Body:
${message}
========================================
      `);

      return true;
    }
  },

  started() {
    this.logger.info("Notification service started");
  }
};
