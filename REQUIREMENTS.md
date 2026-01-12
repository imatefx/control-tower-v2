# Control Tower - Product Requirements Document

> A comprehensive dashboard application for managing products, clients, deployments, and release tracking from delivery lead and engineering manager perspectives.

---

## Table of Contents

1. [Overview](#1-overview)
2. [Technical Architecture](#2-technical-architecture)
3. [Design Principles](#3-design-principles)
4. [User Roles & Authentication](#4-user-roles--authentication)
5. [Pages & Features](#5-pages--features)
6. [Data Models](#6-data-models)
7. [Navigation & Shortcuts](#7-navigation--shortcuts)
8. [Search, Filter & Sort](#8-search-filter--sort)
9. [Notifications & Alerts](#9-notifications--alerts)
10. [Charts & Visualizations](#10-charts--visualizations)
11. [Integrations](#11-integrations)
12. [Theme & Responsiveness](#12-theme--responsiveness)
13. [API Specification](#13-api-specification)
14. [Audit Logging](#14-audit-logging)
15. [Workflow Automation](#15-workflow-automation)
16. [Reporting & Analytics](#16-reporting--analytics)
17. [Data Management](#17-data-management)

---

## 1. Overview

### 1.1 Purpose

Control Tower is a centralized dashboard for tracking:
- **Products** - Software products with documentation, releases, and ownership
- **Clients** - Customer organizations using the products
- **Deployments** - Product rollouts to clients with status tracking
- **Onboarding** - Client deployment progress monitoring
- **Release Notes** - Version-based release documentation

### 1.2 Key Perspectives

Control Tower is designed with the following perspectives in mind:

| Perspective | Description |
|-------------|-------------|
| **Delivery Lead** | Primary user persona - needs visibility into all deployments, blockers, deadlines, and team workload |
| **Engineering Manager** | Technical leadership persona - needs visibility into team capacity, resource allocation, technical health, and cross-product dependencies |
| **Product Life Cycle** | Tracks products from inception through EAP, GA releases, and ongoing maintenance |
| **Deployment Process** | Full workflow from "Not Started" through checklist completion to "Released" |
| **EAP Management** | Early Adopter Program support with multi-client selection and tracking |

### 1.3 Key Capabilities

| Capability | Description |
|------------|-------------|
| Product Management | CRUD for products with parent-child hierarchy, EAP support, adapter configuration |
| Client Management | CRUD for clients with deployment tracking |
| Deployment Tracking | Status-based workflow (Not Started → In Progress → Blocked/Released) |
| Checklist System | 9-item standard deployment checklist with progress tracking |
| Documentation Links | Customizable documentation types for products and deployments |
| Release Notes | Version-based release documentation with item types |
| Google Sheets Sync | Bi-directional sync for Products, Clients, Deployments |
| CSV Export | Export data for offline analysis |
| Notifications | Deadline-based alerts and blocked deployment notifications |
| Audit Logging | Track all user actions with field-level change history |
| Workflow Automation | Auto status transitions, approval workflows, scheduled notifications |
| Reporting & Analytics | Deployment metrics, team performance, client health scores |
| Resource Management | Team capacity planning, workload distribution, resource allocation views |
| Engineering Insights | Technical health indicators, dependency tracking, bottleneck identification |

---

## 2. Technical Architecture

### 2.1 Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Backend Runtime** | Node.js | Server-side JavaScript runtime |
| **Backend Framework** | Moleculer | Microservices framework with service mesh |
| **Database Layer** | moleculer-db + moleculer-db-adapter-sequelize | Moleculer DbMixin with Sequelize adapter for PostgreSQL |
| **Database** | PostgreSQL | Primary data store |
| **Frontend Framework** | React | UI component library |
| **UI Components** | shadcn/ui | Pre-built accessible components |
| **Routing** | React Router | Client-side routing |
| **Authentication** | JWT | Token-based auth with refresh capability |

### 2.2 Project Structure

```
control-tower-v2/
├── backend/                 # Backend services
│   ├── services/           # Moleculer services (with inline model definitions via DbMixin)
│   │   ├── api.service.js  # API gateway (moleculer-web)
│   │   ├── auth.service.js # Authentication
│   │   ├── products.service.js
│   │   ├── clients.service.js
│   │   ├── deployments.service.js
│   │   ├── checklists.service.js
│   │   ├── releaseNotes.service.js
│   │   ├── users.service.js
│   │   ├── audit.service.js
│   │   ├── workflows.service.js
│   │   ├── webhooks.service.js
│   │   ├── reports.service.js
│   │   ├── engineering.service.js
│   │   └── email.service.js
│   ├── mixins/             # Shared mixins (db.mixin.js with Sequelize adapter)
│   ├── middleware/         # Auth, validation, audit
│   ├── utils/              # Helper functions
│   └── moleculer.config.js # Moleculer configuration
├── ui/                      # Frontend application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── pages/          # Page components
│   │   ├── hooks/          # Custom React hooks
│   │   ├── contexts/       # React contexts (auth, theme)
│   │   ├── services/       # API client services
│   │   ├── utils/          # Helper functions
│   │   └── App.jsx         # Main app with router
│   ├── public/
│   └── index.html
├── .env                     # Environment variables
├── .env.example            # Environment template
└── README.md
```

### 2.3 Backend Architecture (Moleculer)

#### Service Communication
| Pattern | Use Case |
|---------|----------|
| Request-Response | CRUD operations, data queries |
| Events | Audit logging, webhook triggers, notifications |
| Broadcast | Cache invalidation, real-time updates |

#### Moleculer Services Structure with DbMixin
```javascript
"use strict";

const DbMixin = require("../mixins/db.mixin");

// Example service structure using moleculer-db with Sequelize adapter
module.exports = {
  name: "deployments",
  mixins: [DbMixin("deployments")],  // DbMixin creates table and provides CRUD actions

  settings: {
    // Fields exposed via API (whitelist)
    fields: ["id", "clientId", "clientName", "productId", "productName", "status",
             "deploymentType", "environment", "nextDeliveryDate", "createdAt", "updatedAt"],

    // Field validation using fastest-validator
    entityValidator: {
      clientId: { type: "uuid" },
      productId: { type: "uuid" },
      status: { type: "enum", values: ["Not Started", "In Progress", "Blocked", "Released"] },
      deploymentType: { type: "enum", values: ["ga", "eap", "feature-release", "client-specific"] }
    }
  },

  // Model definition for Sequelize (defined in DbMixin or inline)
  model: {
    name: "deployment",
    define: {
      id: { type: "uuid", primaryKey: true, defaultValue: "UUIDV4" },
      clientId: { type: "uuid", allowNull: false },
      clientName: { type: "string", allowNull: false },
      productId: { type: "uuid", allowNull: false },
      productName: { type: "string", allowNull: false },
      status: { type: "string", defaultValue: "Not Started" },
      deploymentType: { type: "string", defaultValue: "ga" },
      // ... additional fields
    },
    options: {
      timestamps: true,
      paranoid: true,  // Soft delete with deletedAt
      underscored: true
    }
  },

  actions: {
    // DbMixin provides: list, find, count, get, create, insert, update, remove
    // Custom actions extend the base CRUD:

    updateStatus: {
      params: { id: "uuid", status: "string" },
      async handler(ctx) {
        const { id, status } = ctx.params;
        const entity = await this.adapter.updateById(id, { status });
        await ctx.emit("deployment.statusChanged", { entity, newStatus: status });
        return entity;
      }
    },

    requestApproval: {
      params: { id: "uuid" },
      async handler(ctx) {
        // Approval workflow logic
      }
    }
  },

  events: {
    "deployment.created": { /* trigger webhooks */ },
    "deployment.statusChanged": { /* notifications */ }
  },

  methods: {
    // Helper methods available to actions
  },

  // Lifecycle hooks
  async afterConnected() {
    // Called after database connection established
    // Good place for initial data seeding
  }
};
```

#### DbMixin Configuration (mixins/db.mixin.js)
```javascript
"use strict";

const DbService = require("moleculer-db");
const SequelizeAdapter = require("moleculer-db-adapter-sequelize");
const Sequelize = require("sequelize");

module.exports = function(collection) {
  return {
    mixins: [DbService],

    adapter: new SequelizeAdapter(process.env.DATABASE_URL, {
      dialect: "postgres",
      logging: process.env.NODE_ENV === "development" ? console.log : false,
      define: {
        timestamps: true,
        underscored: true,
        paranoid: true  // Enables soft delete
      }
    }),

    // Collection/table name
    collection,

    settings: {
      // Pagination defaults
      pageSize: 50,
      maxPageSize: 100
    },

    methods: {
      // Transform entity before returning (e.g., remove sensitive fields)
      entityChanged(type, json, ctx) {
        return this.clearCache();
      }
    },

    async started() {
      // Sync model with database (creates table if not exists)
      if (process.env.NODE_ENV !== "production") {
        await this.adapter.sync();
      }
    }
  };
};
```

#### DbMixin Provided Actions (CRUD)
| Action | Method | Endpoint | Description |
|--------|--------|----------|-------------|
| `list` | GET | /api/{service} | List entities with pagination, filtering, sorting |
| `find` | GET | /api/{service}/find | Find entities matching query |
| `count` | GET | /api/{service}/count | Count entities matching query |
| `get` | GET | /api/{service}/:id | Get single entity by ID |
| `create` | POST | /api/{service} | Create new entity |
| `insert` | POST | /api/{service}/insert | Bulk insert entities |
| `update` | PUT | /api/{service}/:id | Update entity by ID |
| `remove` | DELETE | /api/{service}/:id | Remove entity (soft delete with paranoid) |

#### DbMixin Query Parameters
| Parameter | Type | Description |
|-----------|------|-------------|
| `page` | number | Page number (default: 1) |
| `pageSize` | number | Items per page (default: 50, max: 100) |
| `sort` | string | Sort field (prefix with `-` for descending) |
| `search` | string | Search term for text fields |
| `searchFields` | string[] | Fields to search in |
| `query` | object | Filter conditions |
| `populate` | string[] | Related entities to include |

### 2.4 Frontend Architecture (React)

#### State Management
| Concern | Approach |
|---------|----------|
| Auth State | React Context with localStorage persistence |
| Server State | React Query (TanStack Query) for caching |
| UI State | Local component state |
| Theme | React Context with localStorage persistence |

#### Component Organization
```
ui/src/
├── components/
│   ├── ui/                 # shadcn components
│   │   ├── button.jsx
│   │   ├── card.jsx
│   │   ├── dialog.jsx
│   │   └── ...
│   ├── layout/
│   │   ├── Sidebar.jsx
│   │   ├── Header.jsx
│   │   └── PageLayout.jsx
│   ├── forms/
│   │   ├── ProductForm.jsx
│   │   ├── DeploymentForm.jsx
│   │   └── ...
│   └── shared/
│       ├── DataTable.jsx
│       ├── StatusBadge.jsx
│       └── ...
├── pages/
│   ├── Dashboard.jsx
│   ├── Products/
│   │   ├── ProductList.jsx
│   │   └── ProductDetail.jsx
│   ├── Deployments/
│   │   ├── DeploymentList.jsx
│   │   └── DeploymentDetail.jsx
│   └── ...
```

### 2.5 Authentication Flow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Login     │────▶│   Backend   │────▶│  Database   │
│   Form      │     │  Auth Svc   │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
       │                   │
       │                   ▼
       │            ┌─────────────┐
       │            │ JWT Token   │
       │            │ (12hr exp)  │
       │            └─────────────┘
       │                   │
       ▼                   ▼
┌─────────────┐     ┌─────────────┐
│ localStorage│◀────│  Response   │
│ (token +    │     │  to client  │
│  user)      │     └─────────────┘
└─────────────┘
       │
       ▼
┌─────────────┐
│ Auth Context│
│ (React)     │
└─────────────┘
```

#### Token Configuration
| Setting | Value | Notes |
|---------|-------|-------|
| Token Type | JWT | JSON Web Token |
| Expiration | 12 hours | Configurable via JWT_EXPIRES_IN env |
| Refresh | Yes | Automatic refresh before expiry |
| Storage | localStorage | Persists across sessions |
| Super Admin | .env | SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD |

### 2.6 Database Schema Overview

> **Note**: All models are defined inline within their respective Moleculer services using the DbMixin pattern with moleculer-db-adapter-sequelize. Tables are auto-synced in development mode via `adapter.sync()`.

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Products   │     │   Clients    │     │    Users     │
├──────────────┤     ├──────────────┤     ├──────────────┤
│ id           │     │ id           │     │ id           │
│ name         │     │ name         │     │ email        │
│ parentId ────┼──┐  │ comments     │     │ name         │
│ ...          │  │  │ ...          │     │ role         │
└──────────────┘  │  └──────────────┘     │ ...          │
       │          │         │              └──────────────┘
       │          └─────────┼─────────────────────┘
       │                    │
       ▼                    ▼
┌──────────────────────────────┐     ┌──────────────┐
│        Deployments           │     │  Checklists  │
├──────────────────────────────┤     ├──────────────┤
│ id                           │◀────│ deploymentId │
│ productId ───────────────────┼──┐  │ item         │
│ clientId ────────────────────┼──┤  │ isCompleted  │
│ status                       │  │  └──────────────┘
│ ...                          │  │
└──────────────────────────────┘  │
       │                          │
       ▼                          │
┌──────────────┐                  │
│  Approvals   │                  │
├──────────────┤                  │
│ deploymentId │                  │
│ status       │                  │
│ ...          │                  │
└──────────────┘                  │
                                  │
┌──────────────┐                  │
│ ReleaseNotes │◀─────────────────┘
├──────────────┤
│ productId    │
│ version      │
│ ...          │
└──────────────┘
```

---

## 3. Design Principles

### 3.1 UI/UX Principles

| Principle | Implementation |
|-----------|----------------|
| **Pages over Popups** | Use full pages for create/edit forms, not modal dialogs. Modals only for confirmations and quick actions |
| **Delivery Lead First** | Dashboard and views optimized for delivery lead daily workflow |
| **Engineering Manager Views** | Dedicated views for team capacity, resource allocation, and technical health metrics |
| **Progressive Disclosure** | Show summary first, details on demand |
| **Consistent Navigation** | Sidebar always visible, breadcrumbs on detail pages |
| **Responsive Design** | Mobile-friendly with drawer navigation on small screens |

### 3.2 Product Life Cycle Support

Control Tower tracks products through their complete life cycle:

| Phase | Features |
|-------|----------|
| **Planning** | Create product, set owners, link documentation |
| **Development** | Track sub-projects (parent-child), set release dates |
| **EAP (Early Adopter)** | Enable EAP, select multiple clients, track Jira board |
| **Release** | Create deployments, run checklists, generate release notes |
| **Maintenance** | Track client deployments, monitor health, handle blockers |
| **Deprecation** | Mark deprecated in release notes, notify clients |

### 3.3 Deployment Process Workflow

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│ Not Started │────▶│ In Progress │────▶│  Blocked    │────▶│  Released   │
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘
       │                   │                   │                   │
       │                   │                   │                   │
       ▼                   ▼                   ▼                   ▼
  Created with        Checklist           Add blocked        All checklist
  basic info         in progress          comments           items done
                                                             Approval (if req)
```

#### Checklist-Driven Progress
The 9-item checklist gates deployment progress:
1. Requirements Finalized
2. API Ready
3. Backend Ready
4. Frontend Ready
5. Test Cases Approved
6. UAT Completed
7. Release Notes Added
8. Documentation Uploaded
9. Go-Live Validation Completed

### 3.4 EAP (Early Adopter Program) Design

#### EAP Configuration per Product
| Field | Purpose |
|-------|---------|
| isActive | Toggle EAP status |
| startDate | EAP program start |
| endDate | EAP program end (triggers notifications) |
| jiraBoardUrl | Link to Jira for tracking EAP feedback |
| clientIds[] | **Multi-select** clients participating in EAP |

#### EAP Client Selection
- When configuring EAP, user can select **multiple clients** from dropdown
- Selected clients appear as chips/tags
- EAP deployments automatically linked to selected clients
- EAP Dashboard shows all active programs with client counts

#### EAP Workflow
```
1. Product Owner enables EAP on product
2. Selects multiple clients for EAP participation
3. Creates EAP deployments (type: 'eap') for each client
4. Tracks progress via EAP Dashboard
5. Collects feedback via linked Jira board
6. When EAP ends, converts to GA deployments
```

### 3.5 Data Principles

| Principle | Implementation |
|-----------|----------------|
| **Soft Delete** | Never permanently delete, use deletedAt timestamp |
| **Audit Everything** | Log all create/update/delete with field-level changes |
| **Denormalization** | Store clientName/productName on deployments for performance |
| **Timestamps** | Always track createdAt, updatedAt on all records |

### 3.6 API Design Principles

| Principle | Implementation |
|-----------|----------------|
| **RESTful** | Standard HTTP methods (GET, POST, PUT, DELETE) |
| **Consistent Response** | Always return { data, pagination } or { error, message, code } |
| **Pagination** | All list endpoints paginated with page, limit, total |
| **Filtering** | Query params for filtering (status, clientId, etc.) |
| **Validation** | Validate all inputs, return clear error messages |

---

## 4. User Roles & Authentication

### 4.1 Authentication

| Feature | Description |
|---------|-------------|
| Login Method | Email + Password |
| Token Type | JWT with refresh capability |
| Token Expiry | 12 hours (configurable via env) |
| Session Storage | localStorage |
| Auto-logout | On token expiration or 401 response |
| Protected Routes | All routes except /login |
| Super Admin | Configured via backend .env (SUPER_ADMIN_EMAIL) |

### 4.2 User Roles

| Role | Description |
|------|-------------|
| **Admin** | Full system access: manage users, all CRUD operations, settings, audit logs, backups |
| **User** | Standard access: manage products, clients, deployments (no user/settings management) |
| **Viewer** | Read-only access: view all data, no create/update/delete permissions |
| **Delivery Lead** | Deployment focused: manage deployments and clients, view products, approve releases |
| **Product Owner** | Product focused: manage assigned products and their deployments only |
| **Engineering Manager** | Team oversight: view all products/deployments, manage team assignments, access capacity planning and engineering reports |

### 4.3 Permission Matrix

| Resource | Admin | User | Viewer | Delivery Lead | Product Owner | Engineering Manager |
|----------|-------|------|--------|---------------|---------------|---------------------|
| **Products** | CRUD | CRUD | R | R | CRUD (assigned only) | R (all) + U (team assignments) |
| **Clients** | CRUD | CRUD | R | CRUD | R | R |
| **Deployments** | CRUD | CRUD | R | CRUD | CRUD (own products) | R + U (delivery person) |
| **Release Notes** | CRUD | CRUD | R | R | CRUD (own products) | R |
| **Users** | CRUD | - | - | - | - | R (team members) |
| **Settings** | CRUD | - | - | - | - | - |
| **Audit Logs** | R | - | - | - | - | R |
| **Workflow Rules** | CRUD | - | - | - | - | R |
| **Webhooks** | CRUD | - | - | - | - | - |
| **Reports** | R | R | R | R | R (own products) | R (full + team reports) |
| **Approvals** | Approve/Reject | Request | - | Approve/Reject | Request | Approve/Reject |
| **Backups** | CRUD | - | - | - | - | - |
| **Trash/Restore** | CRUD | R | - | R | R | R |
| **Team Capacity** | R | - | - | R | - | CRUD |
| **Resource Allocation** | R | - | - | - | - | CRUD |

**Legend:** C=Create, R=Read, U=Update, D=Delete, `-`=No Access

### 4.4 Role-Specific Behaviors

#### Product Owner Restrictions
- Can only view/edit products in their `assignedProductIds` array
- Can manage deployments for their assigned products only
- Can create release notes for their assigned products only
- Dashboard shows metrics for assigned products only

#### Delivery Lead Capabilities
- Can approve deployment releases
- Receives notifications for blocked deployments
- Can manage all clients and deployments
- Cannot modify product configurations

#### Viewer Limitations
- Cannot create, update, or delete any records
- Can export data to CSV
- Can use search and filters
- Cannot access settings or admin pages

#### Engineering Manager Capabilities
- Can view all products, clients, and deployments across the organization
- Can assign/reassign delivery persons to deployments
- Can manage team capacity and resource allocation
- Has access to Engineering Dashboard with team-specific metrics
- Can approve deployment releases
- Can view audit logs for accountability
- Receives notifications for team blockers and capacity issues
- Can create and manage team-based report configurations
- Can view cross-product dependencies and bottlenecks
- Has access to workload distribution and capacity planning tools

### 4.5 User Data Model

```
User {
  id: string
  email: string (unique)
  name: string
  role: "admin" | "user" | "viewer" | "delivery_lead" | "product_owner" | "engineering_manager"
  assignedProductIds: string[] (for product_owner role)
  managedTeamIds: string[] (for engineering_manager role - user IDs of team members)
  notificationPreferences: {
    email: boolean
    inApp: boolean
    events: string[]
  }
  lastLoginAt: timestamp
  createdAt: timestamp
  updatedAt: timestamp
  deletedAt: timestamp (soft delete)
}
```

---

## 5. Pages & Features

### 5.1 Dashboard

**Purpose**: Overview of key metrics and deployment status

#### KPI Cards (8 metrics)
| Metric | Description |
|--------|-------------|
| Active Deployments | Count of non-Released deployments |
| Releases This Month | Deployments released in current month |
| Overdue Items | Deployments past delivery date |
| Stalled Projects | Deployments with <30% checklist completion |
| Products Without Deployments | Products with zero deployments |
| Products Missing Documentation | Products with incomplete docs |
| EAP Products Active | Products with active EAP status |
| Total Unique EAP Clients | Clients in EAP programs |

#### Components
| Component | Description |
|-----------|-------------|
| Deployment Trend Chart | 8-week line chart of weekly deployment creation |
| Upcoming Releases Timeline | Grid of upcoming releases sorted by urgency (This Week/Next Week/This Month) |
| Client Deployment Activity | Top 5 clients by deployment count |
| Gantt Chart | 4-week sliding timeline with navigation, fullscreen toggle, status-colored bars |
| Recently Viewed | Sidebar showing last visited items |

---

### 5.2 Products

**Purpose**: Manage software products and their documentation

#### Product Fields

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Product name |
| description | string | No | Product description |
| productOwner | string | No | Name of product owner |
| engineeringOwner | string | No | Name of engineering owner |
| nextReleaseDate | date | No | Target release date |
| parentId | string | No | Reference to parent product (for sub-projects) |

#### Product Documentation
| Field | Type | Description |
|-------|------|-------------|
| productGuide | URL | Link to product guide |
| releaseNotes | URL | Link to release notes |
| demoScript | URL | Link to demo script |
| testCases | URL | Link to test cases |
| productionChecklist | URL | Link to production checklist |

#### Relevant Docs Configuration
- Track which documentation types are applicable per product
- Boolean flags for each doc type

#### EAP (Early Access Program) Configuration
| Field | Type | Description |
|-------|------|-------------|
| isActive | boolean | Whether EAP is active |
| startDate | date | EAP start date |
| endDate | date | EAP end date |
| jiraBoardUrl | URL | Link to Jira board |
| clientIds | string[] | List of participating client IDs |

#### Adapter Configuration
| Field | Type | Description |
|-------|------|-------------|
| isAdapter | boolean | Whether product is an adapter |
| hasEquipmentSA | boolean | Equipment Service Assurance |
| hasEquipmentSE | boolean | Equipment Service Enablement |
| hasMappingService | boolean | Mapping Service |
| hasConstructionService | boolean | Construction Service |

#### Additional Fields
| Field | Type | Description |
|-------|------|-------------|
| notificationEmails | string[] | Email addresses for notifications |

#### Product Detail Page
- All product metadata
- Sub-projects list (if parent product)
- Related deployments with statistics
- Status breakdown (pie/bar)
- Release checklist progress
- Documentation completeness score
- Upcoming releases timeline
- Notes panel with threaded comments

---

### 5.3 Clients

**Purpose**: Manage customer organizations

#### Client Fields
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Client name |
| comments | string | No | Notes about the client |

#### Client Detail Page
- Client metadata
- Total deployments count
- Average checklist completion
- Documentation readiness score
- On-time delivery rate
- Upcoming releases timeline
- Status breakdown chart

#### Validation Rules
- Cannot delete clients with active deployments

---

### 5.4 Deployments

**Purpose**: Track product rollouts to clients

#### Deployment Fields
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| clientId | string | Yes | Reference to client |
| clientName | string | Yes | Denormalized client name |
| productId | string | Yes | Reference to product |
| productName | string | Yes | Denormalized product name |
| status | enum | Yes | Not Started, In Progress, Blocked, Released |
| deploymentType | enum | Yes | ga, eap, feature-release, client-specific |
| environment | enum | No | qa, sandbox, production |
| nextDeliveryDate | date | No | Target delivery date |
| featureName | string | No | Feature name (for feature-release type) |
| releaseItems | string | No | Description of what's included |
| deliveryPerson | string | No | Responsible person |
| notes | string | No | General notes |

#### Deployment Documentation
| Field | Type | Description |
|-------|------|-------------|
| runbook | URL | Deployment guide |
| releaseNotesLink | URL | Link to release notes |
| qaReport | URL | QA/test results |

#### Service Status Tracking (for Adapters)
| Field | Values | Description |
|-------|--------|-------------|
| equipmentSAStatus | not_started, in_progress, completed, na | Equipment SA status |
| equipmentSEStatus | not_started, in_progress, completed, na | Equipment SE status |
| mappingStatus | not_started, in_progress, completed, na | Mapping Service status |
| constructionStatus | not_started, in_progress, completed, na | Construction Service status |

#### Status History
```
StatusHistoryEntry {
  id: string
  text: string
  author: string
  timestamp: date
  type: "status_change"
  fromStatus: string
  toStatus: string
}
```

#### Blocked Comments
```
BlockedComment {
  id: string
  text: string
  author: string
  timestamp: date
  parentId: string | null  // For threaded replies
}
```

#### View Modes
| Mode | Description |
|------|-------------|
| Grid View | Card-based layout showing all deployments |
| Kanban View | Column-based by status (Not Started → In Progress → Blocked → Released) |

#### Deployment Checklist (Standard 9 Items)
1. Requirements Finalized
2. API Ready
3. Backend Ready
4. Frontend Ready
5. Test Cases Approved
6. UAT Completed
7. Release Notes Added
8. Documentation Uploaded
9. Go-Live Validation Completed

#### Checklist Actions
- Toggle individual items
- Mark all complete
- Reset all items
- Track completion percentage

---

### 5.5 Onboarding

**Purpose**: Monitor client deployment progress

#### Features
- View all clients with deployment data
- Per-client metrics:
  - Number of projects/deployments
  - Average checklist completion (circular progress)
  - Blocked deployments count
  - Individual project progress bars
- Search clients
- Color-coded progress (emerald: 100%, amber: blocked, blue: in-progress)

---

### 5.6 Release Notes

**Purpose**: Document version releases

#### Release Note Fields
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| productId | string | Yes | Reference to product |
| version | string | Yes | Version number |
| releaseDate | date | No | Release date |
| title | string | No | Release title |
| summary | string | No | Release summary |
| items | array | No | Release items |

#### Release Item Types
| Type | Icon | Color | Description |
|------|------|-------|-------------|
| feature | Sparkles | Emerald | New feature |
| improvement | TrendingUp | Blue | Enhancement |
| bugfix | Bug | Rose | Bug fix |
| security | Shield | Amber | Security update |
| performance | Zap | Purple | Performance improvement |
| breaking | AlertTriangle | Red | Breaking change |
| deprecated | Clock | Slate | Deprecated feature |
| docs | FileText | Cyan | Documentation update |

#### Release Item Fields
| Field | Type | Description |
|-------|------|-------------|
| type | enum | Item type from above |
| title | string | Item title |
| description | string | Item description |
| visibility | enum | public, internal |

#### Features
- Search by version, title, content
- Filter by product
- Preview formatted release notes
- Copy to clipboard
- PDF export
- Sort by release date

---

### 5.7 EAP Dashboard

**Purpose**: Track Early Access Program status

#### KPI Cards
| Metric | Description |
|--------|-------------|
| Total EAP Products | Products with EAP configuration |
| Active EAP Programs | Currently active EAP products |
| Ending Soon | EAP ending within 30 days |
| Expired | Past end date |
| Unique EAP Clients | Total clients in EAP programs |
| EAP Deployments | Deployments with type=eap |

#### EAP Product List
- Product name with EAP indicator
- Status badge (Active, Ending Soon, Expired, No End Date)
- Days remaining
- Associated clients
- Jira board link
- Start/end dates

---

### 5.8 Engineering Dashboard (Engineering Manager)

**Purpose**: Team capacity planning, resource allocation, and engineering health metrics

#### KPI Cards
| Metric | Description |
|--------|-------------|
| Team Members | Count of managed team members |
| Active Assignments | Deployments assigned to team members |
| Team Utilization | Percentage of team capacity in use |
| Blocked by Team | Deployments blocked due to team dependencies |
| Overdue Assignments | Team assignments past delivery date |
| Avg Lead Time | Average deployment time for team |

#### Team Capacity View
| Component | Description |
|-----------|-------------|
| Capacity Grid | Visual grid of team members with current workload |
| Utilization Bars | Per-person utilization percentage |
| Availability Indicators | Green/Yellow/Red capacity status |
| Assignment Count | Active deployments per team member |
| Skills Matrix | Optional skill tags for team members |

#### Resource Allocation
| Component | Description |
|-----------|-------------|
| Allocation Table | Team member assignments with drag-and-drop reallocation |
| Product Distribution | Pie chart of assignments by product |
| Client Distribution | Pie chart of assignments by client |
| Upcoming Releases | Timeline of team's upcoming deliveries |
| Conflict Detection | Highlight over-allocated resources |

#### Team Performance Metrics
| Metric | Description |
|--------|-------------|
| Deployments Completed | Team total for period |
| On-Time Rate | Percentage delivered by target date |
| Blocked Resolution Time | Average time to unblock |
| Checklist Velocity | Average checklist items per day |
| Cross-Team Dependencies | Dependencies on other teams |

#### Bottleneck Analysis
| Component | Description |
|-----------|-------------|
| Bottleneck Chart | Visualization of where deployments stall |
| Blocker Categories | Breakdown of blocking reasons |
| Dependency Graph | Cross-product/team dependencies |
| Recommendations | AI-suggested resource adjustments |

#### Features
- Filter by team member, product, client, time period
- Export team reports to PDF/CSV
- Set capacity alerts and thresholds
- View historical trends
- Compare team performance over time

---

### 5.9 Users (Admin Only)

**Purpose**: Manage application users

#### Features
- List all users with search
- Create new users
- Edit user details and role
- Delete users
- View creation date
- Assign team members to Engineering Managers

---

### 5.10 Settings

**Purpose**: Application configuration

#### Google Sheets Sync
| Setting | Description |
|---------|-------------|
| Google Sheet URL | URL to the sync spreadsheet |
| Apps Script URL | Web app URL for sync |
| Enable/Disable | Toggle sync functionality |
| Last Sync | Timestamp of last sync |

#### Sync Actions
- Sync Products to Sheet
- Sync Deployments to Sheet
- Sync Clients to Sheet
- Pull from Sheet (import)

#### Documentation Types Configuration

**Product Documentation Types** (customizable):
- Add new types
- Edit labels
- Delete types
- Reorder types
- Defaults: Product Guide, Release Notes, Demo Script, Test Cases, Prod Checklist

**Deployment Documentation Types** (customizable):
- Add new types
- Edit labels
- Delete types
- Reorder types
- Defaults: Runbook, Release Notes Link, QA Report

#### CSV Export
- Export Products
- Export Deployments
- Export Clients
- Date-stamped filenames

#### Workflow Rules (Admin Only)
| Component | Description |
|-----------|-------------|
| Rules List | Table of all workflow rules with status toggle |
| Rule Builder | Form to create/edit workflow rules |
| Trigger Config | Select trigger type and conditions |
| Action Config | Select action type and parameters |
| Test Rule | Dry-run rule against sample data |

#### Webhooks Management (Admin Only)
| Component | Description |
|-----------|-------------|
| Webhooks List | Table of configured webhooks |
| Add Webhook | Form with URL, events, secret |
| Test Webhook | Send test payload |
| Logs View | Recent webhook delivery attempts |

#### Email Configuration (Admin Only)
| Component | Description |
|-----------|-------------|
| SMTP Settings | Server, port, credentials |
| Test Email | Send test email to verify config |
| Templates | View/preview email templates |

#### Backup Management (Admin Only)
| Component | Description |
|-----------|-------------|
| Backup List | Table of available backups |
| Create Backup | Manual backup trigger |
| Restore | Restore from selected backup |
| Retention Settings | Configure backup retention |

---

### 5.11 Audit Logs (Admin Only)

**Purpose**: View system activity and changes

#### Features
| Component | Description |
|-----------|-------------|
| Log Table | Filterable table of audit events |
| Filters | User, resource type, action, date range |
| Detail Modal | Full change diff view |
| Export | Download filtered logs as CSV |

#### Log Entry Display
- Timestamp with relative time
- User avatar and name
- Action badge (create/update/delete)
- Resource type and name
- Summary of changes
- Expandable detail view

---

### 5.12 Reports

**Purpose**: Analytics and performance metrics

#### Dashboard Tab
| Component | Description |
|-----------|-------------|
| Date Range Picker | 7d, 30d, 90d, 1y, custom |
| KPI Cards | Key metrics with trends |
| Charts Grid | Interactive visualizations |

#### Deployment Metrics Tab
| Chart | Description |
|-------|-------------|
| Lead Time Chart | Line chart of average lead time |
| Deployment Frequency | Bar chart of releases per period |
| Status Funnel | Funnel showing conversion rates |
| Failure Analysis | Pie chart of blocked reasons |

#### Team Performance Tab
| Component | Description |
|-----------|-------------|
| Leaderboard | Ranked list by deployments |
| Workload Chart | Distribution pie chart |
| Individual Stats | Per-person metrics cards |

#### Client Health Tab
| Component | Description |
|-----------|-------------|
| Health Score Table | Clients ranked by health score |
| Client Comparison | Side-by-side metrics |
| Trend Charts | Health trends over time |

#### Engineering Manager Tab (Engineering Manager Role)
| Component | Description |
|-----------|-------------|
| Team Utilization Report | Capacity usage over time |
| Resource Allocation History | Assignment changes and trends |
| Bottleneck Analysis | Where deployments are getting stuck |
| Cross-Team Dependencies | Dependencies and blockers from other teams |
| Skill Gap Analysis | Skills needed vs available |
| Forecasting | Projected workload based on pipeline |

#### Export & Share
- Export to PDF
- Generate shareable link
- Schedule automated reports

---

### 5.13 Approvals

**Purpose**: Review and approve deployment releases

#### Features
| Component | Description |
|-----------|-------------|
| Pending Queue | List of pending approvals |
| Approval Card | Deployment details, requester, request time |
| Quick Actions | Approve/Reject buttons |
| Comments | Add comments when approving/rejecting |
| History | Past approvals with results |

#### Header Badge
- Badge counter on navigation showing pending approval count
- Clicking navigates to Approvals page

---

### 5.14 Trash (Admin Only)

**Purpose**: View and restore deleted items

#### Features
| Component | Description |
|-----------|-------------|
| Tab Navigation | Products, Clients, Deployments tabs |
| Deleted Items List | Items with deletion date, deleted by |
| Restore Action | Restore individual item |
| Bulk Restore | Restore multiple selected items |
| Permanent Delete | Remove permanently (confirmation required) |
| Auto-Purge Notice | Shows days until automatic permanent deletion |

---

## 6. Data Models

> **Implementation Note**: All data models below are implemented as inline model definitions within their respective Moleculer services using the `moleculer-db` mixin with `moleculer-db-adapter-sequelize`. Each service defines its model schema in the `model` property, and the DbMixin handles table creation, CRUD operations, and database synchronization. The TypeScript interfaces below serve as documentation for the data structure.

### 6.1 Products Collection

**Service**: `products.service.js`

```typescript
interface Product {
  id: string;
  name: string;
  description?: string;
  productOwner?: string;
  engineeringOwner?: string;
  nextReleaseDate?: Date;

  // Hierarchy
  parentId?: string;
  parentName?: string;

  // Documentation
  documentation: {
    productGuide?: string;
    releaseNotes?: string;
    demoScript?: string;
    testCases?: string;
    productionChecklist?: string;
  };

  // Relevant docs flags
  relevantDocs: {
    productGuide: boolean;
    releaseNotes: boolean;
    demoScript: boolean;
    testCases: boolean;
    productionChecklist: boolean;
  };

  // EAP
  eap?: {
    isActive: boolean;
    startDate?: Date;
    endDate?: Date;
    jiraBoardUrl?: string;
    clientIds: string[];
  };

  // Adapter
  isAdapter?: boolean;
  adapterServices?: {
    hasEquipmentSA: boolean;
    hasEquipmentSE: boolean;
    hasMappingService: boolean;
    hasConstructionService: boolean;
  };

  notificationEmails?: string[];

  createdAt: Date;
  updatedAt: Date;
}
```

### 6.2 Clients Collection

**Service**: `clients.service.js`

```typescript
interface Client {
  id: string;
  name: string;
  comments?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### 6.3 Deployments Collection

**Service**: `deployments.service.js`

```typescript
type DeploymentStatus = 'Not Started' | 'In Progress' | 'Blocked' | 'Released';
type DeploymentType = 'ga' | 'eap' | 'feature-release' | 'client-specific';
type Environment = 'qa' | 'sandbox' | 'production';
type ServiceStatus = 'not_started' | 'in_progress' | 'completed' | 'na';

interface Deployment {
  id: string;
  clientId: string;
  clientName: string;
  productId: string;
  productName: string;
  status: DeploymentStatus;
  deploymentType: DeploymentType;
  environment?: Environment;
  nextDeliveryDate?: Date;
  featureName?: string;
  releaseItems?: string;
  deliveryPerson?: string;
  notes?: string;

  // Documentation
  documentation?: {
    runbook?: string;
    releaseNotesLink?: string;
    qaReport?: string;
  };
  relevantDocs?: string[];

  // Service status (for adapters)
  equipmentSAStatus?: ServiceStatus;
  equipmentSEStatus?: ServiceStatus;
  mappingStatus?: ServiceStatus;
  constructionStatus?: ServiceStatus;

  // Comments
  blockedComments?: Array<{
    id: string;
    text: string;
    author: string;
    timestamp: Date;
    parentId?: string;
  }>;

  // History
  statusHistory?: Array<{
    id: string;
    text: string;
    author: string;
    timestamp: Date;
    type: 'status_change';
    fromStatus: string;
    toStatus: string;
  }>;

  createdAt: Date;
  updatedAt: Date;
}
```

### 6.4 Checklists Collection

**Service**: `checklists.service.js`

```typescript
interface ChecklistItem {
  id: string;
  deploymentId: string;
  item: string;
  isCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

### 6.5 Release Notes Collection

**Service**: `releaseNotes.service.js`

```typescript
type ReleaseItemType = 'feature' | 'improvement' | 'bugfix' | 'security' |
                       'performance' | 'breaking' | 'deprecated' | 'docs';

interface ReleaseNote {
  id: string;
  productId: string;
  version: string;
  releaseDate?: Date;
  title?: string;
  summary?: string;
  items?: Array<{
    type: ReleaseItemType;
    title: string;
    description?: string;
    visibility: 'public' | 'internal';
  }>;
  createdAt: Date;
  updatedAt: Date;
}
```

### 6.6 Config Collection

**Service**: `config.service.js`

```typescript
interface Config {
  docTypes: Array<{
    key: string;
    label: string;
    order: number;
  }>;
  deploymentDocTypes: Array<{
    key: string;
    label: string;
    order: number;
  }>;
}
```

### 6.7 Users Collection

**Service**: `users.service.js`

```typescript
type UserRole = 'admin' | 'user' | 'viewer' | 'delivery_lead' | 'product_owner' | 'engineering_manager';

interface User {
  id: string;
  email: string;
  passwordHash: string;
  name: string;
  role: UserRole;
  assignedProductIds?: string[];  // For product_owner role
  managedTeamIds?: string[];  // For engineering_manager role - user IDs of team members
  maxCapacity?: number;  // Maximum concurrent deployments (for capacity planning)
  skills?: string[];  // Skill tags for resource matching
  notificationPreferences?: {
    email: boolean;
    inApp: boolean;
    events: string[];  // Event types to receive notifications for
  };
  lastLoginAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;  // Soft delete
}
```

### 6.8 Audit Logs Collection

**Service**: `audit.service.js`

```typescript
type AuditAction = 'create' | 'update' | 'delete' | 'restore' | 'login' |
                   'logout' | 'status_change' | 'approve' | 'reject' |
                   'export' | 'import' | 'backup' | 'restore_backup';

type AuditResourceType = 'product' | 'client' | 'deployment' | 'user' |
                         'releaseNote' | 'config' | 'webhook' | 'workflow' |
                         'approval' | 'auth' | 'backup';

interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: AuditAction;
  resourceType: AuditResourceType;
  resourceId?: string;
  resourceName?: string;
  changes?: Array<{
    field: string;
    oldValue: any;
    newValue: any;
  }>;
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    requestId?: string;
  };
  timestamp: Date;
}
```

### 6.9 Approvals Collection

**Service**: `approvals.service.js`

```typescript
type ApprovalStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

interface Approval {
  id: string;
  deploymentId: string;
  deploymentName: string;
  productId: string;
  productName: string;
  clientId: string;
  clientName: string;
  requestedBy: string;
  requestedByName: string;
  requestedAt: Date;
  status: ApprovalStatus;
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: Date;
  comments?: string;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### 6.10 Webhooks Collection

**Service**: `webhooks.service.js`

```typescript
type WebhookEvent = 'deployment.created' | 'deployment.updated' |
                    'deployment.status_changed' | 'deployment.released' |
                    'deployment.blocked' | 'approval.requested' |
                    'approval.completed' | 'product.created' |
                    'product.updated' | 'client.created' | 'client.updated';

interface Webhook {
  id: string;
  name: string;
  url: string;
  events: WebhookEvent[];
  secret?: string;  // For HMAC signature verification
  headers?: Record<string, string>;
  isActive: boolean;
  retryCount: number;  // Default: 3
  lastTriggeredAt?: Date;
  lastStatus?: 'success' | 'failed';
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface WebhookLog {
  id: string;
  webhookId: string;
  webhookName: string;
  event: WebhookEvent;
  payload: object;
  url: string;
  responseStatus?: number;
  responseBody?: string;
  success: boolean;
  error?: string;
  attempts: number;
  createdAt: Date;
}
```

### 6.11 Workflow Rules Collection

**Service**: `workflows.service.js`

```typescript
type TriggerType = 'checklist_complete' | 'date_passed' | 'status_change' |
                   'schedule' | 'field_change';

type ActionType = 'status_change' | 'notification' | 'webhook' |
                  'approval_request' | 'email';

interface WorkflowRule {
  id: string;
  name: string;
  description?: string;
  isActive: boolean;
  trigger: {
    type: TriggerType;
    conditions: Record<string, any>;
    // Examples:
    // checklist_complete: { percentage: 100 }
    // date_passed: { field: 'nextDeliveryDate', daysAfter: 0 }
    // status_change: { from: 'In Progress', to: 'Blocked' }
    // schedule: { cron: '0 9 * * 1' }
  };
  action: {
    type: ActionType;
    params: Record<string, any>;
    // Examples:
    // status_change: { newStatus: 'Released' }
    // notification: { template: 'deadline_reminder', recipients: ['delivery_person'] }
    // webhook: { webhookId: 'xxx' }
    // approval_request: { approverRoles: ['admin', 'delivery_lead'] }
  };
  priority: number;  // Lower = executes first
  createdAt: Date;
  updatedAt: Date;
}
```

### 6.12 Backups Collection

**Service**: `backups.service.js`

```typescript
type BackupStatus = 'in_progress' | 'completed' | 'failed';

interface Backup {
  id: string;
  filename: string;
  filepath: string;
  size: number;  // In bytes
  collections: string[];
  recordCounts: Record<string, number>;
  triggeredBy: 'auto' | 'manual';
  triggeredByUser?: string;
  triggeredByUserName?: string;
  status: BackupStatus;
  error?: string;
  createdAt: Date;
  completedAt?: Date;
  expiresAt: Date;
}
```

### 6.13 Import Jobs Collection

**Service**: `imports.service.js`

```typescript
type ImportStatus = 'pending' | 'validating' | 'importing' | 'completed' | 'failed';
type ImportStrategy = 'skip' | 'update' | 'replace';

interface ImportJob {
  id: string;
  collection: string;
  filename: string;
  filepath: string;
  status: ImportStatus;
  strategy: ImportStrategy;
  totalRecords: number;
  processedRecords: number;
  successCount: number;
  errorCount: number;
  skippedCount: number;
  errors?: Array<{
    row: number;
    field?: string;
    message: string;
    data?: any;
  }>;
  createdBy: string;
  createdByName: string;
  createdAt: Date;
  completedAt?: Date;
}
```

### 6.14 Email Configuration Collection

**Service**: `email.service.js`

```typescript
interface EmailConfig {
  id: string;
  smtpHost: string;
  smtpPort: number;
  smtpUser: string;
  smtpPassword: string;  // Encrypted
  fromAddress: string;
  fromName: string;
  isActive: boolean;
  lastTestedAt?: Date;
  lastTestResult?: 'success' | 'failed';
  lastTestError?: string;
  updatedAt: Date;
}

interface EmailTemplate {
  id: string;
  key: string;  // e.g., 'deadline_reminder', 'approval_request'
  subject: string;
  bodyHtml: string;
  bodyText: string;
  variables: string[];  // Available template variables
  isCustomized: boolean;
  updatedAt: Date;
}
```

### 6.15 Team Capacity Collection

**Service**: `engineering.service.js`

```typescript
interface TeamCapacity {
  id: string;
  userId: string;  // Team member
  userName: string;
  managerId: string;  // Engineering Manager
  managerName: string;
  maxCapacity: number;  // Maximum concurrent deployments
  currentLoad: number;  // Current active deployments
  utilizationPercent: number;  // Calculated: (currentLoad / maxCapacity) * 100
  skills: string[];  // Skill tags
  availability: 'available' | 'busy' | 'overloaded' | 'unavailable';
  unavailableDates?: Array<{
    startDate: Date;
    endDate: Date;
    reason: string;  // vacation, sick, training, etc.
  }>;
  createdAt: Date;
  updatedAt: Date;
}

interface ResourceAllocation {
  id: string;
  deploymentId: string;
  deploymentName: string;
  userId: string;  // Assigned team member
  userName: string;
  assignedBy: string;  // Engineering Manager who made assignment
  assignedByName: string;
  assignedAt: Date;
  estimatedEffort: number;  // In hours or story points
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'assigned' | 'in_progress' | 'completed' | 'reassigned';
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

### 6.16 Report Configurations Collection

**Service**: `reports.service.js`

```typescript
type ReportType = 'deployment_metrics' | 'team_performance' | 'client_health' | 'trends' | 'engineering_capacity';
type ReportFrequency = 'daily' | 'weekly' | 'monthly';

interface ReportConfig {
  id: string;
  name: string;
  type: ReportType;
  filters: {
    dateRange: {
      type: 'relative' | 'absolute';
      relativeDays?: number;  // e.g., 30 for last 30 days
      startDate?: Date;
      endDate?: Date;
    };
    productIds?: string[];
    clientIds?: string[];
    deliveryPersons?: string[];
    statuses?: string[];
  };
  schedule?: {
    isActive: boolean;
    frequency: ReportFrequency;
    recipients: string[];  // Email addresses
    dayOfWeek?: number;  // 0-6 for weekly
    dayOfMonth?: number;  // 1-31 for monthly
    time: string;  // HH:mm format
    lastSentAt?: Date;
  };
  shareToken?: string;  // For shareable links
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 7. Navigation & Shortcuts

### 7.1 Navigation Structure

| Route | Page | Access | Description |
|-------|------|--------|-------------|
| / | Dashboard | All | Main overview |
| /products | Products | All | Product list |
| /products/:id | Product Detail | All | Single product |
| /clients | Clients | All | Client list |
| /clients/:id | Client Detail | All | Single client |
| /deployments | Deployments | All | Deployment list |
| /deployments/:id | Deployment Detail | All | Single deployment |
| /onboarding | Onboarding | All | Progress tracking |
| /release-notes | Release Notes | All | Version documentation |
| /eap | EAP Dashboard | All | Early access tracking |
| /reports | Reports | All | Analytics and metrics |
| /engineering | Engineering Dashboard | Engineering Manager | Team capacity and resource allocation |
| /approvals | Approvals | Admin, Delivery Lead, Engineering Manager | Approval queue |
| /audit-logs | Audit Logs | Admin, Engineering Manager | System activity logs |
| /trash | Trash | Admin | Deleted items |
| /users | Users | Admin | User management |
| /settings | Settings | Admin | App configuration |
| /login | Login | Public | Authentication |

### 7.2 Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `/` | Open command palette (global search) |
| `n` | Create new deployment (on deployments page) |
| `g + h` | Go to Dashboard |
| `g + p` | Go to Products |
| `g + d` | Go to Deployments |
| `g + c` | Go to Clients |
| `g + o` | Go to Onboarding |
| `g + r` | Go to Reports |
| `g + e` | Go to Engineering Dashboard |
| `g + a` | Go to Approvals |
| `Escape` | Close modal/palette/dropdown |

### 7.3 Command Palette

- Activated with `/` key
- Search across products, clients, deployments
- Shows item type with icon
- Max 8 results
- Click to navigate
- Escape to close

### 7.4 Recently Viewed

- Sidebar section showing last visited items
- Tracks products, clients, deployments
- Clickable for quick navigation

---

## 8. Search, Filter & Sort

### 8.1 Global Search

| Feature | Description |
|---------|-------------|
| Activation | `/` key or search icon |
| Scope | Products, Clients, Deployments |
| Fields | Name/title fields |
| Results | Max 8, sorted by relevance |

### 8.2 Deployments Filters

| Filter | Values |
|--------|--------|
| Status | Not Started, In Progress, Blocked, Released |
| Environment | QA, Sandbox, Production |
| Urgency | Upcoming, Overdue, Stalled |
| By ID | Deployment ID search |

### 8.3 Sorting

| Page | Sort Options |
|------|--------------|
| Products | Name, hierarchy |
| Clients | Name, deployment count |
| Deployments | Deadline, status, client, product |
| Release Notes | Release date (newest first) |

### 8.4 URL Persistence

- Filters saved to URL params
- Deep linking support
- Back button preserves state

---

## 9. Notifications & Alerts

### 9.1 Toast Notifications

| Type | Color | Icon | Duration |
|------|-------|------|----------|
| Success | Green | CheckCircle | 4 seconds |
| Error | Red | AlertCircle | 4 seconds |
| Info | Blue | Info | 4 seconds |

### 9.2 Notification Center

| Severity | Color | Triggers |
|----------|-------|----------|
| Critical | Red | Overdue deployments, urgent deadlines |
| Warning | Amber | Blocked deployments, 5-7 day deadlines |
| Info | Blue | General notifications |

### 9.3 Notification Types

| Type | Description |
|------|-------------|
| Upcoming Deadline | Delivery date within 7 days |
| Overdue | Past delivery date |
| Blocked | Deployment status is Blocked |
| Team Overloaded | Team member capacity exceeds threshold (Engineering Manager) |
| Resource Conflict | Multiple high-priority assignments for same person (Engineering Manager) |
| Dependency Alert | Cross-team dependency at risk (Engineering Manager) |

### 9.4 Features

- Bell icon with badge counter
- Click to navigate to deployment
- Dismiss individual/all
- Persisted dismissal state

---

## 10. Charts & Visualizations

### 10.1 Deployment Trend Chart

- **Type**: Line chart
- **Data**: Weekly deployment creation count
- **Range**: 8 weeks
- **Features**: Responsive, tooltip on hover

### 10.2 Gantt Chart

- **Type**: Timeline bars
- **Range**: 4-week sliding window
- **Colors**: Status-based (slate/blue/amber/emerald)
- **Features**:
  - Navigation arrows
  - Fullscreen toggle
  - Click to open deployment
  - Escape to close fullscreen

### 10.3 Timeline Strip

- **Type**: Grid of cards
- **Data**: Upcoming releases
- **Sorting**: By deadline
- **Features**: Urgency indicator (pulsing dot), hover effects

### 10.4 Progress Indicators

| Type | Usage |
|------|-------|
| Circular Ring | Client/product completion |
| Linear Bar | Checklist progress |
| Percentage | Numeric completion |

### 10.5 Status Colors

| Status | Color |
|--------|-------|
| Not Started | Slate |
| In Progress | Blue |
| Blocked | Amber |
| Released | Emerald |

---

## 11. Integrations

### 11.1 Google Sheets Sync

#### Configuration
- Google Sheet URL
- Apps Script Web App URL
- Enable/disable toggle

#### Sheets Structure

**Products Sheet**:
```
id | name | parentId | parentName | description | productOwner |
engineeringOwner | nextReleaseDate | productGuide | releaseNotes |
demoScript | testCases | productionChecklist | updatedAt
```

**Deployments Sheet**:
```
id | clientId | clientName | productId | productName | status |
deploymentType | nextDeliveryDate | notes | updatedAt
```

**Clients Sheet**:
```
id | name | comments | updatedAt
```

#### Operations
- Push to sheet (write)
- Pull from sheet (read/import)
- Conflict resolution via updatedAt
- Auto-create sheets with headers

### 11.2 CSV Export

| Export | Fields |
|--------|--------|
| Products | ID, Name, Parent, Description, Owners, Release Date |
| Deployments | ID, Client, Product, Status, Type, Date, Progress |
| Clients | ID, Name, Notes |

---

## 12. Theme & Responsiveness

### 12.1 Theme Support

| Feature | Description |
|---------|-------------|
| Modes | Light, Dark |
| Detection | System preference on first load |
| Persistence | localStorage |
| Toggle | Sidebar button |

### 12.2 Color Palette

**Status Colors**:
- Slate (neutral)
- Blue (info/in-progress)
- Emerald (success/released)
- Amber (warning/blocked)
- Rose (error)

**Avatar Colors**:
- Products: Indigo, Violet, Fuchsia, Pink, Cyan, Teal, Emerald
- Clients: Blue, Emerald, Purple, Amber, Rose, Cyan, Indigo

### 12.3 Breakpoints

| Breakpoint | Width | Description |
|------------|-------|-------------|
| sm | 640px | Small devices |
| md | 768px | Medium devices |
| lg | 1024px | Large devices |
| xl | 1280px | Extra large |

### 12.4 Mobile Adaptations

- Drawer menu replaces sidebar
- Horizontal scroll for data-heavy views
- Touch-friendly tap targets
- Responsive grid layouts

---

## 13. API Specification

### 13.1 Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/login | Login with email/password |
| POST | /auth/register | Register new user |
| POST | /auth/refresh | Refresh JWT token |

#### Login Request
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

#### Login Response
```json
{
  "token": "jwt-token-here",
  "refreshToken": "refresh-token-here",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "name": "User Name",
    "role": "admin"
  }
}
```

### 13.2 CRUD Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/{collection} | List all items |
| GET | /api/{collection}/{id} | Get single item |
| POST | /api/{collection} | Create item |
| PUT | /api/{collection}/{id} | Update item |
| DELETE | /api/{collection}/{id} | Delete item |

**Collections**: products, clients, deployments, checklists, releaseNotes, users

### 13.3 Configuration Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/config/{key} | Get config value |
| POST | /api/config/{key} | Set config value |

### 13.4 User Management (Admin Only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/users | List all users |
| POST | /api/users | Create user |
| PUT | /api/users/{id} | Update user |
| DELETE | /api/users/{id} | Delete user |

### 13.5 Audit Log Endpoints (Admin Only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/audit-logs | List audit logs with filters |
| GET | /api/audit-logs/:id | Get single audit log entry |
| GET | /api/audit-logs/resource/:type/:id | Get logs for specific resource |
| POST | /api/audit-logs/export | Export filtered logs to CSV |

#### Query Parameters for GET /api/audit-logs
| Parameter | Type | Description |
|-----------|------|-------------|
| userId | string | Filter by user ID |
| action | string | Filter by action type |
| resourceType | string | Filter by resource type |
| resourceId | string | Filter by resource ID |
| startDate | ISO date | Filter from date |
| endDate | ISO date | Filter to date |
| page | number | Page number (default: 1) |
| limit | number | Items per page (default: 50) |

### 13.6 Approval Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/approvals | List all approvals |
| GET | /api/approvals/pending | List pending approvals |
| GET | /api/approvals/:id | Get single approval |
| POST | /api/deployments/:id/request-approval | Request approval for deployment |
| POST | /api/approvals/:id/approve | Approve deployment |
| POST | /api/approvals/:id/reject | Reject deployment |
| POST | /api/approvals/:id/cancel | Cancel approval request |

#### Approve/Reject Request Body
```json
{
  "comments": "Optional comments or rejection reason"
}
```

### 13.7 Webhook Endpoints (Admin Only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/webhooks | List all webhooks |
| GET | /api/webhooks/:id | Get single webhook |
| POST | /api/webhooks | Create webhook |
| PUT | /api/webhooks/:id | Update webhook |
| DELETE | /api/webhooks/:id | Delete webhook |
| POST | /api/webhooks/:id/test | Test webhook with sample payload |
| GET | /api/webhooks/:id/logs | Get delivery logs for webhook |

#### Create/Update Webhook Request
```json
{
  "name": "Slack Notification",
  "url": "https://example.com/webhook",
  "events": ["deployment.released", "deployment.blocked"],
  "secret": "optional-secret-for-hmac",
  "headers": {
    "X-Custom-Header": "value"
  },
  "isActive": true,
  "retryCount": 3
}
```

### 13.8 Workflow Rule Endpoints (Admin Only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/workflow-rules | List all workflow rules |
| GET | /api/workflow-rules/:id | Get single rule |
| POST | /api/workflow-rules | Create workflow rule |
| PUT | /api/workflow-rules/:id | Update workflow rule |
| DELETE | /api/workflow-rules/:id | Delete workflow rule |
| POST | /api/workflow-rules/:id/test | Test rule with sample data |
| PUT | /api/workflow-rules/:id/toggle | Enable/disable rule |

#### Create/Update Workflow Rule Request
```json
{
  "name": "Auto-release on complete checklist",
  "description": "Automatically release deployment when checklist is 100%",
  "isActive": true,
  "trigger": {
    "type": "checklist_complete",
    "conditions": {
      "percentage": 100
    }
  },
  "action": {
    "type": "status_change",
    "params": {
      "newStatus": "Released"
    }
  },
  "priority": 10
}
```

### 13.9 Reporting Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/reports/deployment-metrics | Get deployment KPIs |
| GET | /api/reports/team-performance | Get team performance metrics |
| GET | /api/reports/client-health | Get client health scores |
| GET | /api/reports/trends | Get trend data |
| POST | /api/reports/export | Export report to PDF |
| GET | /api/report-configs | List saved report configs |
| POST | /api/report-configs | Save report configuration |
| PUT | /api/report-configs/:id | Update report config |
| DELETE | /api/report-configs/:id | Delete report config |
| GET | /api/reports/shared/:token | Get shared report (public) |

#### Query Parameters for Report Endpoints
| Parameter | Type | Description |
|-----------|------|-------------|
| startDate | ISO date | Start of date range |
| endDate | ISO date | End of date range |
| productIds | string[] | Filter by products |
| clientIds | string[] | Filter by clients |
| deliveryPersons | string[] | Filter by delivery persons |

### 13.10 Engineering Manager Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/engineering/dashboard | Get engineering dashboard metrics |
| GET | /api/engineering/team | Get team members for manager |
| GET | /api/engineering/capacity | Get team capacity overview |
| PUT | /api/engineering/capacity/:userId | Update team member capacity |
| GET | /api/engineering/allocations | List resource allocations |
| POST | /api/engineering/allocations | Create resource allocation |
| PUT | /api/engineering/allocations/:id | Update allocation |
| DELETE | /api/engineering/allocations/:id | Remove allocation |
| POST | /api/engineering/reassign | Reassign deployment to different team member |
| GET | /api/engineering/bottlenecks | Get bottleneck analysis |
| GET | /api/engineering/dependencies | Get cross-team dependencies |
| GET | /api/engineering/forecasting | Get workload forecasting |
| GET | /api/engineering/utilization | Get utilization report |

#### Dashboard Response
```json
{
  "teamMembers": 8,
  "activeAssignments": 24,
  "teamUtilization": 75,
  "blockedByTeam": 2,
  "overdueAssignments": 3,
  "avgLeadTime": 14.5,
  "capacityBreakdown": [
    { "userId": "...", "name": "...", "current": 3, "max": 4, "utilization": 75 }
  ]
}
```

#### Reassign Request Body
```json
{
  "deploymentId": "deployment-uuid",
  "fromUserId": "current-assignee-uuid",
  "toUserId": "new-assignee-uuid",
  "reason": "Optional reason for reassignment"
}
```

### 13.11 Data Management Endpoints (Admin Only)

#### Backup Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/admin/backups | List all backups |
| POST | /api/admin/backups | Create manual backup |
| GET | /api/admin/backups/:id | Get backup details |
| DELETE | /api/admin/backups/:id | Delete backup |
| POST | /api/admin/backups/:id/restore | Restore from backup |
| GET | /api/admin/backups/:id/download | Download backup file |

#### Export Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/export/:collection | Export collection to CSV/JSON |
| POST | /api/export/full | Export all data |

#### Export Request Body
```json
{
  "format": "csv",
  "columns": ["id", "name", "status"],
  "filters": {
    "status": "Released",
    "startDate": "2025-01-01"
  },
  "includeDeleted": false
}
```

#### Import Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/import/:collection | Start import job |
| GET | /api/import/jobs | List import jobs |
| GET | /api/import/jobs/:id | Get import job status |
| POST | /api/import/validate | Validate import file |

#### Import Request (multipart/form-data)
| Field | Type | Description |
|-------|------|-------------|
| file | File | CSV or JSON file |
| strategy | string | skip, update, or replace |

#### Trash/Restore Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/trash/:collection | List deleted items |
| POST | /api/trash/:collection/:id/restore | Restore deleted item |
| DELETE | /api/trash/:collection/:id | Permanently delete |
| POST | /api/trash/:collection/bulk-restore | Restore multiple items |
| DELETE | /api/trash/:collection/purge | Permanently delete all |

### 13.12 Email Configuration Endpoints (Admin Only)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /api/admin/email-config | Get email configuration |
| PUT | /api/admin/email-config | Update email configuration |
| POST | /api/admin/email-config/test | Send test email |
| GET | /api/admin/email-templates | List email templates |
| PUT | /api/admin/email-templates/:key | Update email template |
| POST | /api/admin/email-templates/:key/preview | Preview template |

### 13.13 Error Responses

```json
{
  "error": true,
  "message": "Error description",
  "code": "ERROR_CODE",
  "details": {}
}
```

#### Standard Error Codes
| Code | HTTP Status | Description |
|------|-------------|-------------|
| UNAUTHORIZED | 401 | Missing or invalid token |
| FORBIDDEN | 403 | Insufficient permissions |
| NOT_FOUND | 404 | Resource not found |
| VALIDATION_ERROR | 400 | Invalid request data |
| CONFLICT | 409 | Resource conflict (duplicate) |
| RATE_LIMITED | 429 | Too many requests |
| INTERNAL_ERROR | 500 | Server error |

### 13.14 Standard Headers

```
Authorization: Bearer <jwt-token>
Content-Type: application/json
X-Request-ID: <unique-request-id>
```

### 13.15 Pagination Response Format

All list endpoints return paginated responses:

```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "limit": 50,
    "total": 150,
    "totalPages": 3,
    "hasNext": true,
    "hasPrev": false
  }
}
```

### 13.16 Rate Limiting

| Endpoint Type | Limit | Window |
|---------------|-------|--------|
| Authentication | 10 requests | 1 minute |
| Standard API | 100 requests | 1 minute |
| Export/Import | 5 requests | 1 minute |
| Webhooks | 1000 requests | 1 hour |

---

## 14. Audit Logging

### 14.1 Overview

Comprehensive audit logging system that tracks all user actions and data changes for compliance, debugging, and accountability.

### 14.2 Audit Events

| Event Category | Events Tracked |
|----------------|----------------|
| Authentication | login, logout, login_failed, token_refresh |
| Products | create, update, delete, restore |
| Clients | create, update, delete, restore |
| Deployments | create, update, delete, status_change, checklist_update |
| Release Notes | create, update, delete |
| Users | create, update, delete, role_change |
| Settings | config_update, webhook_create, workflow_update |
| Approvals | request, approve, reject |
| Data Management | export, import, backup, restore |

### 14.3 Audit Log Data Model

```typescript
interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  action: 'create' | 'update' | 'delete' | 'restore' | 'login' | 'logout' |
          'status_change' | 'approve' | 'reject' | 'export' | 'import';
  resourceType: 'product' | 'client' | 'deployment' | 'user' | 'releaseNote' |
                'config' | 'webhook' | 'workflow' | 'approval' | 'auth';
  resourceId?: string;
  resourceName?: string;
  changes?: Array<{
    field: string;
    oldValue: any;
    newValue: any;
  }>;
  metadata?: {
    ipAddress?: string;
    userAgent?: string;
    requestId?: string;
  };
  timestamp: Date;
}
```

### 14.4 Audit Log Features

| Feature | Description |
|---------|-------------|
| Field-Level Tracking | Records before/after values for all field changes |
| Immutable Records | Audit logs cannot be modified or deleted |
| Retention Policy | Configurable retention period (default: 1 year) |
| Search & Filter | Filter by user, resource, action, date range |
| Export | Export audit logs to CSV for compliance reporting |
| Real-time | Logs created synchronously with each action |

### 14.5 Audit Log Page (Admin Only)

| Component | Description |
|-----------|-------------|
| Filter Panel | User, resource type, action type, date range |
| Log Table | Timestamp, user, action, resource, summary |
| Detail View | Full change diff with before/after values |
| Export Button | Download filtered logs as CSV |
| Pagination | 50 records per page with infinite scroll |

---

## 15. Workflow Automation

### 15.1 Overview

Configurable workflow engine for automating status transitions, notifications, and integrations.

### 15.2 Auto Status Transitions

| Trigger | Condition | Action |
|---------|-----------|--------|
| Checklist Complete | All 9 items checked | Status → "Released" (if approval not required) |
| Overdue Detection | Past delivery date + status "Not Started" | Status → "Blocked" |
| Stalled Detection | <30% checklist + >7 days since update | Flag as stalled |
| EAP Expiry | EAP end date passed | Notify product owner |

### 15.3 Approval Workflows

#### Approval Configuration
| Setting | Description |
|---------|-------------|
| Require Approval | Toggle approval requirement for "Released" status |
| Approver Roles | Roles that can approve (Admin, Delivery Lead) |
| Auto-Approve | Optional auto-approval after X days |
| Escalation | Escalate to admin if no response in X days |

#### Approval Process
1. User requests approval for deployment release
2. Notification sent to approvers
3. Approver reviews deployment details
4. Approve with optional comments OR Reject with reason
5. If approved: status changes to "Released"
6. If rejected: status remains, requester notified

#### Approval Data Model
```typescript
interface Approval {
  id: string;
  deploymentId: string;
  deploymentName: string;
  requestedBy: string;
  requestedByName: string;
  requestedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  reviewedBy?: string;
  reviewedByName?: string;
  reviewedAt?: Date;
  comments?: string;
  rejectionReason?: string;
}
```

### 15.4 Scheduled Notifications

| Notification | Frequency | Recipients | Trigger |
|--------------|-----------|------------|---------|
| Deadline Reminder | Daily 9 AM | Delivery person | Delivery date within 7 days |
| Overdue Alert | Immediate | Delivery person + Admin | Past delivery date |
| Blocked Alert | Immediate | Product notification emails | Status changed to Blocked |
| Weekly Summary | Monday 9 AM | All users | Weekly deployment stats |
| Stalled Projects | Daily | Delivery person | <30% progress, no update 7+ days |
| Pending Approvals | Daily | Approvers | Approvals pending >24 hours |
| Capacity Alert | Immediate | Engineering Manager | Team member exceeds 90% capacity |
| Resource Conflict | Immediate | Engineering Manager | Multiple critical assignments overlap |
| Team Weekly Report | Monday 9 AM | Engineering Manager | Team performance summary |
| Dependency Risk | Daily | Engineering Manager | Cross-team dependency at risk |

### 15.5 Email Notifications

#### Email Configuration
| Setting | Description |
|---------|-------------|
| SMTP Host | Email server hostname |
| SMTP Port | Server port (default: 587) |
| SMTP User | Authentication username |
| SMTP Password | Authentication password |
| From Address | Sender email address |
| From Name | Sender display name |

#### Email Templates
| Template | Trigger | Variables |
|----------|---------|-----------|
| deadline_reminder | 7 days before delivery | deployment, product, client, date |
| overdue_alert | Past delivery date | deployment, product, client, days_overdue |
| blocked_notification | Status → Blocked | deployment, product, client, blocker |
| approval_request | Approval requested | deployment, product, requester |
| approval_result | Approved/Rejected | deployment, result, reviewer, comments |
| weekly_summary | Monday schedule | stats, upcoming, overdue, blocked |
| capacity_alert | Team member over capacity | team_member, current_load, max_capacity, assignments |
| resource_conflict | Assignment overlap | team_member, conflicting_assignments, dates |
| team_weekly_report | Monday schedule | team_stats, utilization, completed, blocked |
| dependency_risk | Dependency at risk | deployment, dependency, blocking_team, risk_level |

### 15.6 Webhook Integration

#### Webhook Configuration
| Field | Type | Description |
|-------|------|-------------|
| name | string | Webhook identifier |
| url | string | HTTP endpoint URL |
| events | string[] | Events to trigger webhook |
| secret | string | HMAC signing secret |
| isActive | boolean | Enable/disable webhook |
| headers | object | Custom HTTP headers |
| retryCount | number | Retry attempts (default: 3) |

#### Webhook Events
| Event | Payload |
|-------|---------|
| deployment.created | Full deployment object |
| deployment.updated | Deployment with changes array |
| deployment.status_changed | Deployment, fromStatus, toStatus |
| deployment.released | Deployment, releaseDate |
| deployment.blocked | Deployment, blockedReason |
| deployment.reassigned | Deployment, fromUser, toUser, reason |
| approval.requested | Approval, deployment |
| approval.completed | Approval, deployment, result |
| capacity.threshold_exceeded | TeamMember, currentLoad, maxCapacity |
| allocation.created | ResourceAllocation, deployment, assignee |
| allocation.updated | ResourceAllocation, changes |

#### Webhook Payload Format
```json
{
  "event": "deployment.status_changed",
  "timestamp": "2025-01-15T10:30:00Z",
  "data": {
    "deployment": { ... },
    "fromStatus": "In Progress",
    "toStatus": "Released"
  },
  "signature": "sha256=..."
}
```

#### Webhook Data Model
```typescript
interface Webhook {
  id: string;
  name: string;
  url: string;
  events: string[];
  secret?: string;
  headers?: Record<string, string>;
  isActive: boolean;
  retryCount: number;
  lastTriggeredAt?: Date;
  lastStatus?: 'success' | 'failed';
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
}

interface WebhookLog {
  id: string;
  webhookId: string;
  event: string;
  payload: object;
  responseStatus?: number;
  responseBody?: string;
  success: boolean;
  error?: string;
  attempts: number;
  createdAt: Date;
}
```

### 15.7 Workflow Rules Configuration

| Field | Type | Description |
|-------|------|-------------|
| name | string | Rule name |
| description | string | Rule description |
| isActive | boolean | Enable/disable rule |
| triggerType | enum | checklist_complete, date_passed, status_change, schedule |
| triggerConditions | object | Specific conditions for trigger |
| actionType | enum | status_change, notification, webhook, approval_request |
| actionParams | object | Parameters for the action |
| priority | number | Execution order (lower = first) |

---

## 16. Reporting & Analytics

### 16.1 Overview

Comprehensive reporting dashboard providing insights into deployment performance, team productivity, and client health.

### 16.2 Deployment Metrics

| Metric | Calculation | Description |
|--------|-------------|-------------|
| Lead Time | Released date - Created date | Average time from creation to release |
| Cycle Time | Time in each status | Average time spent per status |
| Deployment Frequency | Count per period | Deployments released per week/month |
| Failure Rate | Blocked / Total × 100 | Percentage of deployments that get blocked |
| On-Time Rate | On-time / Total × 100 | Percentage delivered by target date |
| Checklist Velocity | Items completed / day | Average checklist progress rate |

### 16.3 Team Performance

| Metric | Description |
|--------|-------------|
| Deployments per Person | Count of deployments by delivery person |
| Average Lead Time per Person | Individual delivery speed |
| Workload Distribution | Pie chart of active deployments per person |
| On-Time Delivery Rate | Per-person on-time percentage |
| Blocked Resolution Time | Average time to unblock per person |

### 16.4 Client Health

| Metric | Description |
|--------|-------------|
| Deployments per Client | Total and active deployments |
| Client Success Rate | % of deployments released successfully |
| Average Delivery Time | Mean lead time for client's deployments |
| Blocked Rate | % of client deployments that get blocked |
| Documentation Score | % of required docs completed |
| Health Score | Composite score (0-100) based on above metrics |

#### Client Health Score Calculation
```
Health Score = (
  (Success Rate × 0.3) +
  (On-Time Rate × 0.3) +
  (100 - Blocked Rate) × 0.2) +
  (Documentation Score × 0.2)
)
```

### 16.5 Trend Analysis

| Report | Description |
|--------|-------------|
| Deployment Velocity | Week-over-week deployment count trend |
| Status Distribution | Stacked area chart of status over time |
| Lead Time Trend | Line chart of average lead time per week |
| Blocked Trend | Blocked deployments over time with causes |
| Product Comparison | Side-by-side metrics for products |
| Client Comparison | Compare metrics across clients |

### 16.6 Reports Page Features

| Component | Description |
|-----------|-------------|
| Date Range Picker | Select reporting period (7d, 30d, 90d, 1y, custom) |
| Dashboard View | KPI cards with key metrics |
| Charts Section | Interactive charts (hover for details) |
| Drill-Down | Click metrics to see underlying data |
| Export | PDF report generation |
| Share | Generate shareable report link |
| Schedule | Configure automated report emails |

### 16.7 Report Data Models

```typescript
interface ReportConfig {
  id: string;
  name: string;
  type: 'deployment_metrics' | 'team_performance' | 'client_health' | 'trends';
  filters: {
    dateRange: { start: Date; end: Date };
    productIds?: string[];
    clientIds?: string[];
    deliveryPersons?: string[];
  };
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly';
    recipients: string[];
    dayOfWeek?: number;
    dayOfMonth?: number;
    time: string;
  };
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}
```

---

## 17. Data Management

### 17.1 Soft Delete

All primary entities support soft delete for data recovery.

| Feature | Description |
|---------|-------------|
| Soft Delete Field | `deletedAt` timestamp (null = active) |
| Recovery Period | 30 days (configurable) |
| Trash View | Admin page showing deleted items |
| Restore | Restore individual or bulk items |
| Permanent Delete | Remove after recovery period or manual |
| Cascade | Soft delete related records (e.g., deployments when client deleted) |

#### Soft Delete Behavior
- Deleted items excluded from normal queries
- Deleted items remain in database with `deletedAt` timestamp
- Related records soft-deleted together (configurable)
- Automatic permanent deletion after retention period

### 17.2 Backup & Restore

| Feature | Description |
|---------|-------------|
| Automated Backups | Daily at 2 AM (configurable) |
| Manual Backup | Admin-triggered full backup |
| Backup Contents | All collections, configurations, uploaded files |
| Backup Format | Compressed JSON archive |
| Retention | 30 days (configurable) |
| Restore | Point-in-time restore from any backup |

#### Backup Data Model
```typescript
interface Backup {
  id: string;
  filename: string;
  size: number;
  collections: string[];
  recordCounts: Record<string, number>;
  triggeredBy: 'auto' | 'manual';
  triggeredByUser?: string;
  status: 'in_progress' | 'completed' | 'failed';
  error?: string;
  createdAt: Date;
  expiresAt: Date;
}
```

### 17.3 Data Export

| Export Type | Format | Contents |
|-------------|--------|----------|
| Products | CSV/JSON | All product fields |
| Clients | CSV/JSON | All client fields |
| Deployments | CSV/JSON | All deployment fields with resolved names |
| Release Notes | CSV/JSON | All release notes with items |
| Audit Logs | CSV | Filtered audit events |
| Full Export | JSON | All collections combined |

#### Export Features
- Column selection for CSV exports
- Date range filters
- Status filters
- Include/exclude soft-deleted items
- Download or email delivery

### 17.4 Data Import

| Import Type | Format | Validation |
|-------------|--------|------------|
| Products | CSV/JSON | Name required, parent validation |
| Clients | CSV/JSON | Name required, unique check |
| Deployments | CSV/JSON | Client and product existence |
| Release Notes | CSV/JSON | Product existence, version format |

#### Import Options
| Option | Description |
|--------|-------------|
| Skip Duplicates | Skip records with matching ID |
| Update Existing | Update if ID exists, create if not |
| Replace All | Delete existing and import fresh |
| Validate Only | Check for errors without importing |

#### Import Data Model
```typescript
interface ImportJob {
  id: string;
  collection: string;
  filename: string;
  status: 'pending' | 'validating' | 'importing' | 'completed' | 'failed';
  strategy: 'skip' | 'update' | 'replace';
  totalRecords: number;
  processedRecords: number;
  successCount: number;
  errorCount: number;
  errors?: Array<{
    row: number;
    field: string;
    message: string;
  }>;
  createdBy: string;
  createdAt: Date;
  completedAt?: Date;
}
```

### 17.5 Data Retention

| Data Type | Default Retention | Configurable |
|-----------|-------------------|--------------|
| Active Records | Indefinite | No |
| Soft-Deleted Records | 30 days | Yes |
| Audit Logs | 1 year | Yes |
| Webhook Logs | 30 days | Yes |
| Backups | 30 days | Yes |
| Import Jobs | 7 days | Yes |

---

## Appendix A: Standard Checklist Items

1. Requirements Finalized
2. API Ready
3. Backend Ready
4. Frontend Ready
5. Test Cases Approved
6. UAT Completed
7. Release Notes Added
8. Documentation Uploaded
9. Go-Live Validation Completed

---

## Appendix B: Default Documentation Types

### Product Documentation
1. Product Guide
2. Release Notes
3. Demo Script
4. Test Cases
5. Production Checklist

### Deployment Documentation
1. Runbook / Deployment Guide
2. Release Notes Link
3. Test Results / QA Report

---

## Appendix C: Deployment Type Definitions

| Type | Key | Description |
|------|-----|-------------|
| General Availability | ga | Standard production release |
| Early Access Program | eap | Beta/preview release |
| Feature Release | feature-release | Specific feature deployment |
| Client-Specific | client-specific | Custom client deployment |

---

## Appendix D: Environment Definitions

| Environment | Key | Description |
|-------------|-----|-------------|
| QA | qa | Quality assurance testing |
| Sandbox | sandbox | Pre-production testing |
| Production | production | Live environment |

---

## Appendix E: Release Item Types

| Type | Key | Icon | Color | Description |
|------|-----|------|-------|-------------|
| New Feature | feature | Sparkles | Emerald | New functionality |
| Improvement | improvement | TrendingUp | Blue | Enhancement |
| Bug Fix | bugfix | Bug | Rose | Defect fix |
| Security | security | Shield | Amber | Security patch |
| Performance | performance | Zap | Purple | Speed/optimization |
| Breaking Change | breaking | AlertTriangle | Red | Incompatible change |
| Deprecated | deprecated | Clock | Slate | Removal notice |
| Documentation | docs | FileText | Cyan | Doc updates |

---

## Appendix F: Glossary

| Term | Definition |
|------|------------|
| **Deployment** | A specific instance of a product being rolled out to a client |
| **EAP** | Early Adopter Program - a pre-release testing phase with select clients |
| **Lead Time** | Time from deployment creation to release |
| **Cycle Time** | Time spent in each deployment status |
| **Checklist** | Standard 9-item verification list for deployment readiness |
| **Adapter** | A product type that connects different systems/services |
| **Soft Delete** | Marking a record as deleted without permanent removal |
| **Workflow Rule** | Automated trigger-action pair for system automation |
| **Webhook** | HTTP callback triggered by system events |
| **Approval Workflow** | Process requiring explicit approval before status change |
| **Health Score** | Composite metric (0-100) indicating client deployment success |
| **Team Capacity** | Maximum concurrent deployments a team member can handle |
| **Resource Allocation** | Assignment of team members to specific deployments |
| **Utilization** | Percentage of team member capacity currently in use |
| **Bottleneck** | Point in the deployment process where work accumulates |
| **Cross-Team Dependency** | Deployment blocked by another team's work |
| **Capacity Planning** | Process of forecasting and managing team workload |

---

## Appendix G: User Roles Summary

| Role | Primary Use Case | Key Permissions |
|------|------------------|-----------------|
| **Admin** | System administrators | Full access to all features |
| **User** | General team members | CRUD on products, clients, deployments |
| **Viewer** | Stakeholders, executives | Read-only access to all data |
| **Delivery Lead** | Deployment managers | Manage deployments, approve releases |
| **Product Owner** | Product managers | Manage assigned products only |
| **Engineering Manager** | Team leads, technical managers | Team capacity, resource allocation, approve releases, engineering reports |

---

## Appendix H: Validation Rules

### Product Validation
| Field | Rules |
|-------|-------|
| name | Required, 1-200 characters, unique |
| description | Optional, max 2000 characters |
| productOwner | Optional, max 100 characters |
| engineeringOwner | Optional, max 100 characters |
| nextReleaseDate | Optional, must be future date if set |
| parentId | Optional, must reference existing product |
| documentation URLs | Optional, must be valid URL format |
| notificationEmails | Optional, must be valid email format |

### Client Validation
| Field | Rules |
|-------|-------|
| name | Required, 1-200 characters, unique |
| comments | Optional, max 2000 characters |

### Deployment Validation
| Field | Rules |
|-------|-------|
| clientId | Required, must reference existing client |
| productId | Required, must reference existing product |
| status | Required, must be valid status enum |
| deploymentType | Required, must be valid type enum |
| environment | Optional, must be valid environment enum |
| nextDeliveryDate | Optional, must be valid date |
| featureName | Required if deploymentType is 'feature-release' |
| documentation URLs | Optional, must be valid URL format |

### User Validation
| Field | Rules |
|-------|-------|
| email | Required, valid email format, unique |
| password | Required on create, min 8 characters, 1 uppercase, 1 number |
| name | Required, 1-100 characters |
| role | Required, must be valid role enum (admin, user, viewer, delivery_lead, product_owner, engineering_manager) |
| assignedProductIds | Required if role is 'product_owner' |
| managedTeamIds | Required if role is 'engineering_manager' |
| maxCapacity | Optional, positive integer, default 5 |
| skills | Optional, array of strings |

### Release Note Validation
| Field | Rules |
|-------|-------|
| productId | Required, must reference existing product |
| version | Required, semantic versioning format (x.y.z) |
| releaseDate | Optional, must be valid date |
| title | Optional, max 200 characters |
| summary | Optional, max 2000 characters |
| items[].type | Required, must be valid item type enum |
| items[].title | Required, max 200 characters |
| items[].visibility | Required, must be 'public' or 'internal' |

---

## Appendix I: Error Codes Reference

### Authentication Errors (AUTH_*)
| Code | Description | Resolution |
|------|-------------|------------|
| AUTH_INVALID_CREDENTIALS | Email or password incorrect | Verify credentials |
| AUTH_TOKEN_EXPIRED | JWT token has expired | Refresh token or re-login |
| AUTH_TOKEN_INVALID | JWT token is malformed | Re-authenticate |
| AUTH_ACCOUNT_LOCKED | Account locked after failed attempts | Contact admin |
| AUTH_INSUFFICIENT_ROLE | User lacks required role | Request access from admin |

### Validation Errors (VALIDATION_*)
| Code | Description | Resolution |
|------|-------------|------------|
| VALIDATION_REQUIRED | Required field missing | Provide required field |
| VALIDATION_FORMAT | Invalid format | Check field format requirements |
| VALIDATION_UNIQUE | Duplicate value exists | Use different value |
| VALIDATION_REFERENCE | Referenced entity not found | Verify reference ID |
| VALIDATION_ENUM | Invalid enum value | Use valid enum option |

### Resource Errors (RESOURCE_*)
| Code | Description | Resolution |
|------|-------------|------------|
| RESOURCE_NOT_FOUND | Entity does not exist | Verify ID |
| RESOURCE_DELETED | Entity was soft deleted | Restore or use different entity |
| RESOURCE_CONFLICT | Concurrent modification | Refresh and retry |
| RESOURCE_LOCKED | Entity is locked | Wait or contact admin |

### Permission Errors (PERMISSION_*)
| Code | Description | Resolution |
|------|-------------|------------|
| PERMISSION_DENIED | Insufficient permissions | Request access |
| PERMISSION_OWNER_REQUIRED | Must be resource owner | Contact owner |
| PERMISSION_ADMIN_REQUIRED | Admin access needed | Contact admin |

### System Errors (SYSTEM_*)
| Code | Description | Resolution |
|------|-------------|------------|
| SYSTEM_DATABASE_ERROR | Database operation failed | Retry or contact support |
| SYSTEM_EXTERNAL_SERVICE | External service unavailable | Retry later |
| SYSTEM_RATE_LIMITED | Too many requests | Wait and retry |
| SYSTEM_MAINTENANCE | System under maintenance | Try again later |

---

## Appendix J: Webhook Event Reference

| Event | Trigger | Payload Contents |
|-------|---------|------------------|
| deployment.created | New deployment created | Full deployment object |
| deployment.updated | Deployment fields modified | Deployment + changes array |
| deployment.status_changed | Status field changed | Deployment, fromStatus, toStatus |
| deployment.released | Status changed to Released | Deployment, releaseDate |
| deployment.blocked | Status changed to Blocked | Deployment, blockerInfo |
| deployment.checklist_updated | Checklist item toggled | Deployment, checklistItem, isCompleted |
| deployment.reassigned | Deployment reassigned | Deployment, fromUser, toUser, reason, assignedBy |
| approval.requested | Approval requested | Approval, deployment, requester |
| approval.completed | Approval approved/rejected | Approval, deployment, reviewer, result |
| product.created | New product created | Full product object |
| product.updated | Product fields modified | Product + changes array |
| client.created | New client created | Full client object |
| client.updated | Client fields modified | Client + changes array |
| user.created | New user created | User (without password) |
| user.role_changed | User role modified | User, oldRole, newRole |
| capacity.threshold_exceeded | Team member over capacity | TeamMember, currentLoad, maxCapacity, manager |
| capacity.available | Team member became available | TeamMember, previousLoad, newLoad |
| allocation.created | Resource allocation created | ResourceAllocation, deployment, assignee, assignedBy |
| allocation.updated | Resource allocation modified | ResourceAllocation, changes |
| allocation.removed | Resource allocation removed | ResourceAllocation, removedBy, reason |

---

## Appendix K: Environment Variables

### Backend Configuration
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| NODE_ENV | Yes | development | Environment (development/production) |
| PORT | No | 3000 | Server port |
| DATABASE_URL | Yes | - | PostgreSQL connection string |
| JWT_SECRET | Yes | - | Secret for JWT signing |
| JWT_EXPIRES_IN | No | 12h | Token expiration time |
| SUPER_ADMIN_EMAIL | Yes | - | Super admin email address |
| SUPER_ADMIN_PASSWORD | Yes | - | Super admin initial password |
| CORS_ORIGIN | No | * | Allowed CORS origins |
| LOG_LEVEL | No | info | Logging level |

### Email Configuration
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| SMTP_HOST | No | - | SMTP server hostname |
| SMTP_PORT | No | 587 | SMTP server port |
| SMTP_USER | No | - | SMTP authentication user |
| SMTP_PASSWORD | No | - | SMTP authentication password |
| EMAIL_FROM_ADDRESS | No | - | Sender email address |
| EMAIL_FROM_NAME | No | Control Tower | Sender display name |

### Backup Configuration
| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| BACKUP_DIR | No | ./backups | Backup storage directory |
| BACKUP_RETENTION_DAYS | No | 30 | Days to retain backups |
| BACKUP_SCHEDULE | No | 0 2 * * * | Cron schedule for auto-backup |

---

## Appendix L: Version History

| Version | Date | Changes |
|---------|------|---------|
| 2.2 | January 2025 | Updated to use moleculer-db with moleculer-db-adapter-sequelize (DbMixin pattern) instead of standalone Sequelize; inline model definitions in services |
| 2.1 | January 2025 | Added Engineering Manager persona with team capacity planning, resource allocation, engineering dashboard, bottleneck analysis, and cross-team dependency tracking |
| 2.0 | January 2025 | Added role-based permissions, audit logging, workflow automation, reporting & analytics, data management features |
| 1.0 | January 2025 | Initial release with core product, client, deployment, and release notes management |

---

*Document Version: 2.2*
*Last Updated: January 2025*
*Generated for: Control Tower Production-Ready Release*
