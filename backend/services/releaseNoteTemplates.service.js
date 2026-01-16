"use strict";

const DbMixin = require("../mixins/db.mixin");
const { DataTypes } = require("sequelize");

module.exports = {
  name: "releaseNoteTemplates",
  mixins: [DbMixin("release_note_templates")],

  settings: {
    fields: ["id", "key", "name", "description", "sections", "styling", "isActive", "sortOrder", "createdAt", "updatedAt"],
    entityValidator: {
      key: { type: "string", min: 1, max: 50 },
      name: { type: "string", min: 1, max: 200 }
    }
  },

  model: {
    name: "releaseNoteTemplate",
    define: {
      id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
      key: { type: DataTypes.STRING(50), allowNull: false, unique: true },
      name: { type: DataTypes.STRING(200), allowNull: false },
      description: { type: DataTypes.STRING(500) },
      sections: {
        type: DataTypes.JSONB,
        defaultValue: [],
        // Each section: { key, label, itemTypes[], showDescriptions, isRequired }
      },
      styling: {
        type: DataTypes.JSONB,
        defaultValue: {
          primaryColor: "#1e40af",
          showItemIcons: true,
          showVersion: true,
          showDate: true,
          fontFamily: "system-ui"
        }
      },
      isActive: { type: DataTypes.BOOLEAN, defaultValue: true },
      sortOrder: { type: DataTypes.INTEGER, defaultValue: 0 }
    },
    options: { timestamps: true, paranoid: true, underscored: true }
  },

  actions: {
    getActive: {
      async handler(ctx) {
        return this.adapter.find({
          query: { isActive: true },
          sort: ["sortOrder"]
        });
      }
    },

    getByKey: {
      params: { key: "string" },
      async handler(ctx) {
        return this.adapter.findOne({ where: { key: ctx.params.key } });
      }
    }
  },

  async started() {
    if (this.adapter && this.adapter.model) {
      const force = process.env.DB_SYNC_FORCE === "true";
      await this.adapter.model.sync({ force });
    }

    // Seed default templates if none exist
    await this.seedDefaults();
  },

  methods: {
    async seedDefaults() {
      try {
        // Always update templates to ensure latest configuration
        const existing = await this.adapter.find({});

        const defaultTemplates = [
          {
            key: "standard",
            name: "Standard Changelog",
            description: "Complete changelog with all sections - ideal for developer documentation",
            sortOrder: 1,
            sections: [
              { key: "summary", label: "Summary", itemTypes: [], showDescriptions: true, isRequired: false },
              { key: "features", label: "New Features", itemTypes: ["feature"], showDescriptions: true, isRequired: false },
              { key: "improvements", label: "Improvements", itemTypes: ["improvement"], showDescriptions: true, isRequired: false },
              { key: "bugfixes", label: "Bug Fixes", itemTypes: ["bugfix"], showDescriptions: true, isRequired: false },
              { key: "breaking", label: "Breaking Changes", itemTypes: ["breaking"], showDescriptions: true, isRequired: false },
              { key: "deprecations", label: "Deprecations", itemTypes: ["deprecation", "deprecated"], showDescriptions: true, isRequired: false },
              { key: "security", label: "Security", itemTypes: ["security"], showDescriptions: true, isRequired: false },
              { key: "performance", label: "Performance", itemTypes: ["performance"], showDescriptions: true, isRequired: false },
              { key: "docs", label: "Documentation", itemTypes: ["docs"], showDescriptions: true, isRequired: false }
            ],
            styling: {
              primaryColor: "#1e40af",
              secondaryColor: "#3b82f6",
              showItemIcons: true,
              showVersion: true,
              showDate: true,
              showProductName: true,
              fontFamily: "system-ui",
              headerStyle: "gradient"
            }
          },
          {
            key: "customer",
            name: "Customer-Facing",
            description: "Professional release notes format matching CDG template style",
            sortOrder: 2,
            sections: [
              { key: "summary", label: "Overview / Summary", itemTypes: [], showDescriptions: true, isRequired: false },
              { key: "features", label: "What's New", itemTypes: ["feature"], showDescriptions: true, isRequired: false },
              { key: "improvements", label: "Improvements", itemTypes: ["improvement"], showDescriptions: true, isRequired: false },
              { key: "bugfixes", label: "Bug Fixes", itemTypes: ["bugfix"], showDescriptions: true, isRequired: false },
              { key: "roadmap", label: "Upcoming / Phase 2 Items", itemTypes: ["deprecation", "deprecated"], showDescriptions: true, isRequired: false }
            ],
            styling: {
              primaryColor: "#1e3a5f",
              secondaryColor: "#2563eb",
              showItemIcons: false,
              showVersion: true,
              showDate: true,
              showProductName: true,
              showClient: true,
              showEnvironment: true,
              fontFamily: "system-ui",
              headerStyle: "clean"
            }
          },
          {
            key: "internal",
            name: "Internal Technical",
            description: "Detailed technical release notes for internal teams with all details",
            sortOrder: 3,
            sections: [
              { key: "summary", label: "Overview", itemTypes: [], showDescriptions: true, isRequired: false },
              { key: "breaking", label: "Breaking Changes", itemTypes: ["breaking"], showDescriptions: true, isRequired: false },
              { key: "security", label: "Security Updates", itemTypes: ["security"], showDescriptions: true, isRequired: false },
              { key: "features", label: "Features", itemTypes: ["feature"], showDescriptions: true, isRequired: false },
              { key: "improvements", label: "Improvements", itemTypes: ["improvement"], showDescriptions: true, isRequired: false },
              { key: "performance", label: "Performance", itemTypes: ["performance"], showDescriptions: true, isRequired: false },
              { key: "bugfixes", label: "Bug Fixes", itemTypes: ["bugfix"], showDescriptions: true, isRequired: false },
              { key: "deprecations", label: "Deprecations", itemTypes: ["deprecation", "deprecated"], showDescriptions: true, isRequired: false },
              { key: "docs", label: "Documentation", itemTypes: ["docs"], showDescriptions: true, isRequired: false }
            ],
            styling: {
              primaryColor: "#7c3aed",
              secondaryColor: "#8b5cf6",
              showItemIcons: true,
              showVersion: true,
              showDate: true,
              showProductName: true,
              fontFamily: "monospace",
              headerStyle: "technical"
            }
          }
        ];

        // Upsert templates (update existing or insert new)
        for (const template of defaultTemplates) {
          const existingTemplate = existing.find(e => e.key === template.key);
          if (existingTemplate) {
            // Update existing template
            await this.adapter.updateById(existingTemplate.id, {
              name: template.name,
              description: template.description,
              sections: template.sections,
              styling: template.styling,
              sortOrder: template.sortOrder
            });
            this.logger.info(`Updated template: ${template.key}`);
          } else {
            // Insert new template
            await this.adapter.insert(template);
            this.logger.info(`Inserted template: ${template.key}`);
          }
        }

        this.logger.info("Release note templates synced successfully");
      } catch (err) {
        this.logger.error("Failed to seed release note templates:", err);
      }
    }
  }
};
