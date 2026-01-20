"use strict";

const nodemailer = require("nodemailer");
const axios = require("axios");

module.exports = {
  name: "alerts",

  settings: {
    smtp: {
      host: process.env.SMTP_HOST || "localhost",
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    },
    fromEmail: process.env.SMTP_FROM || "noreply@controltower.com",
    appUrl: process.env.APP_URL || "http://localhost:5173",
    googleChat: {
      defaultWebhook: process.env.GOOGLE_CHAT_WEBHOOK_URL
    }
  },

  actions: {
    /**
     * Send an alert for a deployment event
     * Dispatches to email and/or Google Chat based on configuration
     */
    send: {
      params: {
        deploymentId: "string",
        eventType: "string", // created, statusChanged, blocked, released, approaching, overdue
        eventData: { type: "object", optional: true }
      },
      async handler(ctx) {
        const { deploymentId, eventType, eventData } = ctx.params;

        // Get deployment and related data
        const deployment = await ctx.call("deployments.get", { id: deploymentId });
        if (!deployment) {
          throw new Error("Deployment not found");
        }

        const product = await ctx.call("products.get", { id: deployment.productId });
        const alertConfig = deployment.alertConfig || {};

        // Check if alerts are enabled
        if (alertConfig.enabled === false) {
          return { sent: false, reason: "Alerts disabled for this deployment" };
        }

        // Check if this event type should trigger alerts
        const events = alertConfig.events || {};
        const eventMap = {
          created: events.onCreated !== false,
          statusChanged: events.onStatusChange !== false,
          blocked: events.onBlocked !== false,
          released: events.onReleased !== false,
          approaching: events.onApproaching !== false,
          overdue: events.onOverdue !== false
        };

        if (!eventMap[eventType]) {
          return { sent: false, reason: `Event type '${eventType}' is disabled` };
        }

        const results = { email: null, googleChat: null };

        // Send email alerts
        const recipients = await this.collectRecipients(ctx, deployment, product, alertConfig);
        if (recipients.length > 0) {
          const emailContent = this.buildEmailContent(deployment, product, eventType, eventData);
          try {
            await this.actions.sendEmail(ctx, {
              to: recipients,
              subject: emailContent.subject,
              body: emailContent.body,
              html: emailContent.html
            });
            results.email = { sent: true, recipients: recipients.length };
          } catch (error) {
            results.email = { sent: false, error: error.message };
            this.logger.error("Failed to send email:", error.message);
          }
        }

        // Send Google Chat alert
        const googleChatConfig = alertConfig.googleChat || {};
        if (googleChatConfig.enabled !== false) {
          const webhookUrl = this.resolveGoogleChatWebhook(deployment, product);
          if (webhookUrl) {
            const chatMessage = this.buildGoogleChatCard(deployment, product, eventType, eventData);
            try {
              await this.actions.sendGoogleChat(ctx, {
                webhookUrl,
                message: chatMessage
              });
              results.googleChat = { sent: true };
            } catch (error) {
              results.googleChat = { sent: false, error: error.message };
              this.logger.error("Failed to send Google Chat:", error.message);
            }
          }
        }

        // Log to audit
        try {
          await ctx.call("audit.log", {
            userId: ctx.meta.user?.id || "system",
            userName: ctx.meta.user?.name || "System",
            userEmail: ctx.meta.user?.email || "system@controltower.com",
            action: "alert_sent",
            resourceType: "deployment",
            resourceId: deploymentId,
            resourceName: `${deployment.productName} - ${deployment.clientName}`,
            metadata: { eventType, results }
          });
        } catch (err) {
          this.logger.warn("Failed to log alert audit:", err.message);
        }

        return { sent: true, results };
      }
    },

    /**
     * Send an email notification
     */
    sendEmail: {
      params: {
        to: "array",
        subject: "string",
        body: "string",
        html: { type: "string", optional: true }
      },
      async handler(ctx) {
        const { to, subject, body, html } = ctx.params;

        if (!this.settings.smtp.auth.user) {
          this.logger.warn("SMTP not configured, skipping email send");
          return { sent: false, reason: "SMTP not configured" };
        }

        const transporter = nodemailer.createTransport(this.settings.smtp);

        const mailOptions = {
          from: this.settings.fromEmail,
          to: to.join(", "),
          subject,
          text: body,
          html: html || body
        };

        const result = await transporter.sendMail(mailOptions);
        this.logger.info(`Email sent to ${to.length} recipients: ${subject}`);
        return { sent: true, messageId: result.messageId };
      }
    },

    /**
     * Send a Google Chat notification
     */
    sendGoogleChat: {
      params: {
        webhookUrl: "string",
        message: "object"
      },
      async handler(ctx) {
        const { webhookUrl, message } = ctx.params;

        const response = await axios.post(webhookUrl, message, {
          headers: { "Content-Type": "application/json" }
        });

        this.logger.info("Google Chat message sent successfully");
        return { sent: true, status: response.status };
      }
    },

    /**
     * Test email configuration
     */
    testEmail: {
      params: {
        email: "string"
      },
      async handler(ctx) {
        const { email } = ctx.params;

        return this.actions.sendEmail(ctx, {
          to: [email],
          subject: "Control Tower - Test Email",
          body: "This is a test email from Control Tower. If you received this, email notifications are working correctly!",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #333;">Control Tower - Test Email</h2>
              <p>This is a test email from Control Tower.</p>
              <p>If you received this, email notifications are working correctly!</p>
              <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
              <p style="color: #666; font-size: 12px;">This is an automated message from Control Tower.</p>
            </div>
          `
        });
      }
    },

    /**
     * Test Google Chat webhook
     */
    testGoogleChat: {
      params: {
        webhookUrl: "string"
      },
      async handler(ctx) {
        const { webhookUrl } = ctx.params;

        const testMessage = {
          cards: [{
            header: {
              title: "Control Tower - Test Message",
              subtitle: "Webhook Test"
            },
            sections: [{
              widgets: [{
                textParagraph: {
                  text: "This is a test message from Control Tower. If you see this, your Google Chat webhook is configured correctly!"
                }
              }]
            }]
          }]
        };

        return this.actions.sendGoogleChat(ctx, {
          webhookUrl,
          message: testMessage
        });
      }
    },

    /**
     * Get recipients for a deployment
     */
    getRecipients: {
      params: {
        deploymentId: "string"
      },
      async handler(ctx) {
        const { deploymentId } = ctx.params;
        const deployment = await ctx.call("deployments.get", { id: deploymentId });
        if (!deployment) {
          throw new Error("Deployment not found");
        }

        const product = await ctx.call("products.get", { id: deployment.productId });
        const alertConfig = deployment.alertConfig || {};

        return this.collectRecipients(ctx, deployment, product, alertConfig);
      }
    }
  },

  methods: {
    /**
     * Collect all recipients for a deployment alert
     */
    async collectRecipients(ctx, deployment, product, alertConfig) {
      const recipients = new Set();

      // Add notification emails from deployment
      if (deployment.notificationEmails && Array.isArray(deployment.notificationEmails)) {
        deployment.notificationEmails.forEach(email => recipients.add(email));
      }

      // Add additional emails from alert config
      if (alertConfig.additionalEmails && Array.isArray(alertConfig.additionalEmails)) {
        alertConfig.additionalEmails.forEach(email => recipients.add(email));
      }

      // Add product owners if enabled
      if (alertConfig.notifyProductOwners !== false && product) {
        if (product.productOwner) {
          const user = await this.findUserByName(ctx, product.productOwner);
          if (user?.email) recipients.add(user.email);
        }
      }

      // Add engineering owners if enabled
      if (alertConfig.notifyEngineeringOwners !== false && product) {
        if (product.engineeringOwner) {
          const user = await this.findUserByName(ctx, product.engineeringOwner);
          if (user?.email) recipients.add(user.email);
        }
      }

      // Add delivery lead if enabled
      if (alertConfig.notifyDeliveryLead !== false && product) {
        if (product.deliveryLead) {
          const user = await this.findUserByName(ctx, product.deliveryLead);
          if (user?.email) recipients.add(user.email);
        }
      }

      // Add deployment owner
      if (deployment.ownerName) {
        const user = await this.findUserByName(ctx, deployment.ownerName);
        if (user?.email) recipients.add(user.email);
      }

      // Add delivery person
      if (deployment.deliveryPerson) {
        const user = await this.findUserByName(ctx, deployment.deliveryPerson);
        if (user?.email) recipients.add(user.email);
      }

      return Array.from(recipients).filter(Boolean);
    },

    /**
     * Find user by name and return their email
     */
    async findUserByName(ctx, name) {
      if (!name) return null;
      try {
        const users = await ctx.call("users.find", { query: { name } });
        return users.length > 0 ? users[0] : null;
      } catch (error) {
        return null;
      }
    },

    /**
     * Resolve Google Chat webhook URL
     * Priority: deployment override > product config > global config
     */
    resolveGoogleChatWebhook(deployment, product) {
      const alertConfig = deployment.alertConfig || {};
      const googleChatConfig = alertConfig.googleChat || {};

      // Check deployment-specific webhook
      if (googleChatConfig.webhookUrl) {
        return googleChatConfig.webhookUrl;
      }

      // Check if should use product webhook
      if (googleChatConfig.useProductWebhook !== false && product) {
        const productAlertConfig = product.alertConfig || {};
        if (productAlertConfig.googleChatWebhookUrl) {
          return productAlertConfig.googleChatWebhookUrl;
        }
      }

      // Fall back to global webhook
      return this.settings.googleChat.defaultWebhook;
    },

    /**
     * Build email content for a deployment alert
     */
    buildEmailContent(deployment, product, eventType, eventData) {
      const statusEmoji = {
        "Not Started": "⏳",
        "In Progress": "🔄",
        "Blocked": "🚫",
        "Released": "✅"
      };

      const eventTitles = {
        created: "New Deployment Created",
        statusChanged: "Deployment Status Changed",
        blocked: "Deployment Blocked",
        released: "Deployment Released",
        approaching: "Deployment Approaching",
        overdue: "Deployment Overdue"
      };

      const subject = `[Control Tower] ${eventTitles[eventType] || eventType}: ${deployment.productName} - ${deployment.clientName}`;

      const body = `
Control Tower Deployment Alert
==============================

Event: ${eventTitles[eventType] || eventType}
Product: ${deployment.productName}
Client: ${deployment.clientName}
Status: ${statusEmoji[deployment.status] || ""} ${deployment.status}
Environment: ${deployment.environment || "N/A"}
${deployment.nextDeliveryDate ? `Delivery Date: ${deployment.nextDeliveryDate}` : ""}

${eventData?.message || ""}

View Deployment: ${this.settings.appUrl}/deployments/${deployment.id}

---
This is an automated notification from Control Tower.
      `.trim();

      const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f5f5f5; padding: 20px; }
    .container { background: white; border-radius: 8px; padding: 24px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .header { border-bottom: 2px solid #3b82f6; padding-bottom: 16px; margin-bottom: 16px; }
    .title { font-size: 20px; font-weight: bold; color: #333; margin: 0; }
    .event-type { color: #3b82f6; font-size: 14px; margin-top: 4px; }
    .details { margin: 16px 0; }
    .detail-row { display: flex; margin-bottom: 8px; }
    .detail-label { width: 120px; color: #666; font-size: 14px; }
    .detail-value { font-weight: 500; color: #333; }
    .status { display: inline-block; padding: 4px 12px; border-radius: 4px; font-size: 14px; font-weight: 500; }
    .status-released { background: #d1fae5; color: #065f46; }
    .status-blocked { background: #fee2e2; color: #991b1b; }
    .status-inprogress { background: #dbeafe; color: #1e40af; }
    .status-notstarted { background: #f3f4f6; color: #374151; }
    .btn { display: inline-block; background: #3b82f6; color: white; padding: 10px 20px; border-radius: 6px; text-decoration: none; margin-top: 16px; }
    .footer { margin-top: 24px; padding-top: 16px; border-top: 1px solid #eee; color: #666; font-size: 12px; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 class="title">Control Tower Alert</h1>
      <div class="event-type">${eventTitles[eventType] || eventType}</div>
    </div>
    <div class="details">
      <div class="detail-row">
        <span class="detail-label">Product:</span>
        <span class="detail-value">${deployment.productName}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Client:</span>
        <span class="detail-value">${deployment.clientName}</span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Status:</span>
        <span class="detail-value">
          <span class="status status-${deployment.status.toLowerCase().replace(" ", "")}">${statusEmoji[deployment.status] || ""} ${deployment.status}</span>
        </span>
      </div>
      <div class="detail-row">
        <span class="detail-label">Environment:</span>
        <span class="detail-value">${deployment.environment || "N/A"}</span>
      </div>
      ${deployment.nextDeliveryDate ? `
      <div class="detail-row">
        <span class="detail-label">Delivery Date:</span>
        <span class="detail-value">${deployment.nextDeliveryDate}</span>
      </div>
      ` : ""}
    </div>
    <a href="${this.settings.appUrl}/deployments/${deployment.id}" class="btn">View Deployment</a>
    <div class="footer">This is an automated notification from Control Tower.</div>
  </div>
</body>
</html>
      `;

      return { subject, body, html };
    },

    /**
     * Build Google Chat card message for a deployment alert
     */
    buildGoogleChatCard(deployment, product, eventType, eventData) {
      const statusEmoji = {
        "Not Started": "⏳",
        "In Progress": "🔄",
        "Blocked": "🚫",
        "Released": "✅"
      };

      const eventTitles = {
        created: "New Deployment Created",
        statusChanged: "Deployment Status Changed",
        blocked: "🚨 Deployment Blocked",
        released: "🎉 Deployment Released",
        approaching: "⏰ Deployment Approaching",
        overdue: "⚠️ Deployment Overdue"
      };

      return {
        cards: [{
          header: {
            title: "Control Tower Alert",
            subtitle: eventTitles[eventType] || eventType
          },
          sections: [{
            widgets: [
              {
                keyValue: {
                  topLabel: "Product",
                  content: deployment.productName,
                  icon: "BOOKMARK"
                }
              },
              {
                keyValue: {
                  topLabel: "Client",
                  content: deployment.clientName,
                  icon: "MEMBERSHIP"
                }
              },
              {
                keyValue: {
                  topLabel: "Status",
                  content: `${statusEmoji[deployment.status] || ""} ${deployment.status}`,
                  icon: "FLIGHT_DEPARTURE"
                }
              },
              ...(deployment.environment ? [{
                keyValue: {
                  topLabel: "Environment",
                  content: deployment.environment,
                  icon: "HOTEL_ROOM_TYPE"
                }
              }] : []),
              ...(deployment.nextDeliveryDate ? [{
                keyValue: {
                  topLabel: "Delivery Date",
                  content: deployment.nextDeliveryDate,
                  icon: "INVITE"
                }
              }] : []),
              {
                buttons: [{
                  textButton: {
                    text: "VIEW DEPLOYMENT",
                    onClick: {
                      openLink: {
                        url: `${this.settings.appUrl}/deployments/${deployment.id}`
                      }
                    }
                  }
                }]
              }
            ]
          }]
        }]
      };
    }
  }
};
