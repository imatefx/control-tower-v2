# CDG Control Tower - Product Documentation

**Version:** 1.3.7
**Last Updated:** January 2026

---

## Table of Contents

1. [Overview](#1-overview)
2. [Getting Started](#2-getting-started)
3. [Architecture](#3-architecture)
4. [User Roles & Permissions](#4-user-roles--permissions)
5. [Core Modules](#5-core-modules)
6. [API Reference](#6-api-reference)
7. [Database Schema](#7-database-schema)
8. [Configuration](#8-configuration)
9. [Security](#9-security)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Overview

### 1.1 What is CDG Control Tower?

CDG Control Tower is a comprehensive deployment management and release tracking platform designed for enterprise software delivery teams. It provides real-time visibility into product releases, client deployments, and team resource allocation.

### 1.2 Key Features

- **Deployment Tracking** - Track deployments across multiple products, clients, and environments
- **Product Management** - Manage product catalog with parent-child hierarchy support
- **Client Management** - Maintain client database with product associations
- **Release Planning** - Plan and monitor upcoming releases with timeline views
- **Approval Workflows** - Request and manage deployment approvals
- **Resource Allocation** - Allocate and track team resources across products
- **Checklist Management** - Configurable deployment checklists with progress tracking
- **Audit Logging** - Complete audit trail for all system changes
- **Multi-View Support** - Cards, List, Kanban, Gantt, and Grouped views
- **Role-Based Access Control** - Granular permissions based on user roles

### 1.3 Technology Stack

| Component | Technology |
|-----------|------------|
| Frontend | React 18, Vite, TailwindCSS |
| UI Components | Radix UI, Lucide Icons |
| State Management | TanStack React Query |
| Routing | React Router v6 |
| Backend | Moleculer.js Microservices |
| Database | PostgreSQL with Sequelize ORM |
| Authentication | JWT (JSON Web Tokens) |
| API | REST API |

---

## 2. Getting Started

### 2.1 Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### 2.2 Installation

```bash
# Clone the repository
git clone https://github.com/imatefx/control-tower-v2.git
cd control-tower-v2

# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../ui
npm install
```

### 2.3 Environment Configuration

**Backend (.env)**
```env
NODE_ENV=development
PORT=3000
DATABASE_URL=postgresql://user:password@localhost:5432/control_tower
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=12h
SUPER_ADMIN_EMAIL=admin@example.com
SUPER_ADMIN_PASSWORD=admin123
```

**Frontend (.env)**
```env
VITE_API_URL=http://localhost:3000/api
```

### 2.4 Running the Application

```bash
# Start backend (from backend directory)
npm run dev

# Start frontend (from ui directory)
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

### 2.5 Default Login

```
Email: admin@example.com
Password: admin123
```

---

## 3. Architecture

### 3.1 System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │  Pages  │ │Components│ │Contexts │ │Services │           │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
└─────────────────────────┬───────────────────────────────────┘
                          │ HTTP/REST
┌─────────────────────────▼───────────────────────────────────┐
│                    API Gateway (Moleculer)                   │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │  Auth   │ │Products │ │ Clients │ │Deploys  │ ...       │
│  └─────────┘ └─────────┘ └─────────┘ └─────────┘           │
└─────────────────────────┬───────────────────────────────────┘
                          │ Sequelize ORM
┌─────────────────────────▼───────────────────────────────────┐
│                      PostgreSQL Database                     │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Directory Structure

```
control-tower-v2/
├── backend/
│   ├── services/          # Moleculer microservices
│   │   ├── api.service.js       # API Gateway
│   │   ├── auth.service.js      # Authentication
│   │   ├── products.service.js  # Products CRUD
│   │   ├── clients.service.js   # Clients CRUD
│   │   ├── deployments.service.js
│   │   ├── users.service.js
│   │   ├── approvals.service.js
│   │   ├── audit.service.js
│   │   └── ...
│   ├── mixins/            # Shared mixins
│   │   └── db.mixin.js          # Database & audit mixin
│   └── moleculer.config.js
│
├── ui/
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   │   ├── ui/              # Base components (Button, Card, etc.)
│   │   │   └── layout/          # Layout components (Header, Sidebar)
│   │   ├── contexts/      # React contexts
│   │   │   ├── AuthContext.jsx
│   │   │   └── ThemeContext.jsx
│   │   ├── pages/         # Page components
│   │   ├── services/      # API service layer
│   │   │   └── api.js
│   │   ├── hooks/         # Custom hooks
│   │   ├── utils/         # Utility functions
│   │   └── App.jsx        # Main app with routing
│   └── package.json
│
└── DOCUMENTATION.md
```

### 3.3 Frontend Architecture

**State Management:**
- **React Query** for server state (API data caching, mutations)
- **React Context** for client state (auth, theme)
- **Local State** (useState) for component-specific state

**Routing:**
- Protected routes with role-based access control
- Nested routes for detail/edit pages
- Automatic redirect for unauthenticated users

---

## 4. User Roles & Permissions

### 4.1 Available Roles

| Role | Description |
|------|-------------|
| `admin` | Full system access, can manage users and settings |
| `user` | Standard user with create/edit capabilities |
| `viewer` | Read-only access to all modules |
| `delivery_lead` | Can approve deployments, manage resources |
| `product_owner` | Can approve, manage products and EAP |
| `engineering_manager` | Can approve, manage engineering tasks |
| `general_manager` | Executive-level access |
| `head_of_products` | Product leadership access |
| `avp` | Assistant VP level access |

### 4.2 Permission Matrix

| Module | Admin | User | Viewer | Delivery Lead | Product Owner | Eng Manager |
|--------|-------|------|--------|---------------|---------------|-------------|
| Dashboard | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Upcoming Releases | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| Products | ✅ CRUD | ✅ CRUD | ✅ View | ✅ CRUD | ✅ CRUD | ✅ CRUD |
| Clients | ✅ CRUD | ✅ CRUD | ✅ View | ✅ CRUD | ✅ CRUD | ✅ CRUD |
| Deployments | ✅ CRUD | ✅ CRUD | ✅ View | ✅ CRUD | ✅ CRUD | ✅ CRUD |
| Onboarding | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ |
| Release Notes | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| EAP Dashboard | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ |
| Resource Allocation | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Users | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Approvals | ✅ | ❌ | ❌ | ✅ | ✅ | ❌ |
| Reports | ✅ | ❌ | ❌ | ✅ | ✅ | ✅ |
| Audit Logs | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Checklist Items | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| Settings | ✅ Full | ✅ Profile | ✅ Profile | ✅ Profile | ✅ Profile | ✅ Profile |
| Trash | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

### 4.3 Permission Helper Functions

```javascript
// Available in AuthContext
const {
  hasRole,           // Check if user has specific role(s)
  isAdmin,           // Check if user is admin
  isDeliveryLead,    // Check if admin or delivery_lead
  isEngineeringManager, // Check if admin or engineering_manager
  canApprove,        // Check if can approve (admin, delivery_lead, eng_manager)
  canEdit            // Check if can edit (admin, user, delivery_lead, product_owner, eng_manager)
} = useAuth()
```

---

## 5. Core Modules

### 5.1 Dashboard

**Path:** `/dashboard`

The main command center providing real-time visibility into delivery operations.

**Features:**
- KPI Cards (Total Products, Clients, Active Deployments, Completed)
- Delivery Timeline (next 30 days)
- Release Forecast (This Week, Next Week, This Month)
- Deployment Health Status distribution
- In-Progress deployments with overdue tracking
- Alert cards for overdue and blocked items

---

### 5.2 Upcoming Releases (Shareholder Dashboard)

**Path:** `/releases`

Executive-level dashboard for tracking upcoming product releases.

**Features:**
- Summary KPI Cards:
  - Total Upcoming releases
  - This Week releases
  - In Progress count
  - Overdue count
  - Blocked count
  - Average Progress percentage
- Quick Stats Bar (GA, EAP, Feature, Client-Specific breakdown)
- Release Timeline grouped by week
- Color-coded release cards by type
- Urgency indicators for overdue/imminent releases

---

### 5.3 Products

**Path:** `/products`, `/products/:id`, `/products/:id/edit`

Manage the product catalog with hierarchy support.

**Features:**
- Card and List view modes
- Filter by product type (Main, Sub-products, All)
- Parent-child product relationships
- Product ownership (Delivery Lead, Product Owner, Engineering Owner)
- EAP (Early Access Program) designation with client tracking
- Adapter product configuration
- Health score calculation
- Statistics: Deployments count, Sub-products count

**Product Fields:**
| Field | Description |
|-------|-------------|
| name | Product name |
| description | Product description |
| productOwner | Product owner name |
| engineeringOwner | Engineering owner name |
| deliveryLead | Delivery lead name |
| parentId | Parent product ID (for sub-products) |
| isAdapter | Whether product is an adapter |
| adapterServices | Adapter service configuration |
| eap | EAP configuration (isActive, jiraBoardUrl, clients) |
| documentation | Documentation links |
| notificationEmails | Email addresses for notifications |

---

### 5.4 Clients

**Path:** `/clients`, `/clients/:id`, `/clients/:id/edit`

Manage client database and associations.

**Features:**
- Card and List view modes
- Product association per client
- CDG Owner assignment
- Documentation links management
- Notes/comments field
- Statistics: Products count, Deployments count

**Client Fields:**
| Field | Description |
|-------|-------------|
| name | Client name |
| cdgOwner | CDG owner name |
| productIds | Associated product IDs |
| comments | Notes/comments |
| documentation | Array of documentation links |

---

### 5.5 Deployments

**Path:** `/deployments`, `/deployments/:id`, `/deployments/:id/edit`

Track and manage all deployments with multiple views.

**View Modes:**
1. **Grouped** (default) - Hierarchical view by parent products → sub-products → client cards
2. **Cards** - Card grid view
3. **List** - Table view with sorting
4. **Kanban** - Board view by status
5. **Gantt** - Timeline chart view

**Deployment Types:**
| Type | Description | Icon Color |
|------|-------------|------------|
| `ga` | General Availability Release | Green |
| `eap` | Early Access Program | Purple |
| `feature-release` | Feature Release | Blue |
| `client-specific` | Client-Specific Deployment | Amber |

**Status Values:**
- Not Started
- In Progress
- Blocked
- Released

**Environments:**
- QA
- Sandbox
- Production

**Deployment Fields:**
| Field | Description |
|-------|-------------|
| clientId/clientIds | Client(s) for deployment |
| productId | Product being deployed |
| deploymentType | Type of deployment |
| environment | Target environment |
| status | Current status |
| nextDeliveryDate | Target delivery date |
| featureName | Feature name (for feature releases) |
| releaseItems | Release items list |
| deliveryPerson | Assigned delivery person |
| ownerId | Owner user ID |
| notes | Deployment notes |
| documentation | Documentation links |
| equipmentSAStatus | Equipment SA status (adapters) |
| equipmentSEStatus | Equipment SE status (adapters) |
| mappingStatus | Mapping status (adapters) |
| constructionStatus | Construction status (adapters) |
| blockedComments | Blocked reason comments |
| statusHistory | History of status changes |
| notificationEmails | Notification recipients |
| checklistProgress | Calculated checklist completion % |

---

### 5.6 Approvals

**Path:** `/approvals`

Manage deployment and release approvals.

**Features:**
- Card and List view modes
- Tabs for Pending and All approvals
- Approve/Reject with comments
- Stats cards (Pending, Approved, Rejected)
- Linked to deployment details

**Approval Status:**
- Pending
- Approved
- Rejected
- Cancelled

**Note:** Approving an approval automatically updates the deployment status to "Released".

---

### 5.7 Reports

**Path:** `/reports`

Analytics and reporting dashboard.

**Features:**
- Filter by product, client, date range
- KPI cards (Products, Clients, Deployments, Completion Rate)
- Deployment status breakdown chart
- Top products by deployments
- Client activity table
- Export functionality (CSV, PDF)

---

### 5.8 EAP Dashboard

**Path:** `/eap`

Early Access Program management dashboard.

**Features:**
- EAP-specific metrics
- Products with active EAP
- Client enrollment tracking
- EAP deployment status

---

### 5.9 Resource Allocation

**Path:** `/resource-allocation`, `/resource-allocation/:productId`

Allocate and track team resources across products.

**Available Roles:**
| Code | Role |
|------|------|
| FE | Frontend Developer |
| BE | Backend Developer |
| UX | UX Designer |
| DEVOPS | DevOps Engineer |
| ARCH | Solution Architect |
| PM | Project Manager |
| QA | QA/Test Lead |
| TL | Team Lead |
| PO | Product Owner |
| DATA | Data Engineer/Analyst |

**Allocation Fields:**
- Product
- Role
- Hours
- Start Date
- End Date
- Comment

---

### 5.10 Checklist Items

**Path:** `/checklist-items`

Manage deployment checklist templates.

**Features:**
- Create/Edit/Delete checklist items
- Reorder items via drag-and-drop
- Seed default templates
- Mark templates as active

**Default Checklist Items:**
1. Requirements reviewed and signed off
2. Development completed
3. Code review completed
4. Unit tests written and passing
5. Integration tests completed
6. QA testing completed
7. UAT completed and signed off
8. Documentation updated
9. Release notes prepared
10. Deployment runbook reviewed
11. Rollback plan documented
12. Stakeholders notified
13. Production deployment completed
14. Post-deployment verification
15. Monitoring and alerts configured

---

### 5.11 Release Notes

**Path:** `/release-notes`

Manage and view release notes.

**Features:**
- Create/Edit/Delete release notes
- Version tracking
- Release items by type
- PDF export

**Item Types:**
- Feature
- Improvement
- Bug Fix
- Security
- Performance
- Breaking Change
- Deprecated
- Documentation

**Visibility:**
- Public
- Internal

---

### 5.12 Users

**Path:** `/users` (Admin only)

Manage user accounts and roles.

**Features:**
- Card and List view modes
- Create/Edit/Delete users
- Role assignment
- Password management
- Color-coded role badges

---

### 5.13 Audit Logs

**Path:** `/audit` (Admin only)

Complete audit trail for all system changes.

**Features:**
- Filter by action (create, update, delete, login, logout, approve, reject, status_change)
- Filter by resource type
- Search functionality
- Detailed change history
- User and timestamp tracking

---

### 5.14 Settings

**Path:** `/settings`

User settings and system configuration.

**Tabs:**
1. **Profile** - Name, email, password change
2. **Appearance** - Theme selection (Light, Dark, System)
3. **Notifications** - Email, deployment, approval, weekly digest preferences
4. **System** (Admin only) - System-wide configuration

---

### 5.15 Trash

**Path:** `/trash` (Admin only)

View and recover deleted items.

**Features:**
- View soft-deleted products, clients, deployments
- Restore deleted records
- Permanent deletion (if implemented)

---

## 6. API Reference

### 6.1 Authentication

**Base URL:** `/auth`

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/login` | User login |
| POST | `/verify` | Verify JWT token |
| POST | `/refresh` | Refresh JWT token |

**Login Request:**
```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Login Response:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "admin"
  }
}
```

---

### 6.2 Products API

**Base URL:** `/api/products`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List all products |
| GET | `/:id` | Get product by ID |
| GET | `/:id/children` | Get product with children |
| POST | `/` | Create product |
| PUT | `/:id` | Update product |
| DELETE | `/:id` | Delete product (soft) |
| PUT | `/:id/restore` | Restore deleted product |
| GET | `/eap/active` | Get active EAP products |
| GET | `/upcoming-releases` | Get products with upcoming releases |

---

### 6.3 Clients API

**Base URL:** `/api/clients`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List all clients |
| GET | `/:id` | Get client by ID |
| GET | `/:id/deployments` | Get client with deployments |
| POST | `/` | Create client |
| PUT | `/:id` | Update client |
| DELETE | `/:id` | Delete client (soft) |
| PUT | `/:id/restore` | Restore deleted client |
| POST | `/:id/documentation` | Add documentation link |
| DELETE | `/:id/documentation/:docId` | Remove documentation link |

---

### 6.4 Deployments API

**Base URL:** `/api/deployments`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List all deployments |
| GET | `/:id` | Get deployment by ID |
| POST | `/` | Create deployment |
| PUT | `/:id` | Update deployment |
| DELETE | `/:id` | Delete deployment (soft) |
| PUT | `/:id/restore` | Restore deleted deployment |
| PUT | `/:id/status` | Update status with history |
| GET | `/by-status` | Get by status |
| GET | `/product/:productId/with-children` | Get for product and children |

---

### 6.5 Checklists API

**Base URL:** `/api/checklists`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/deployment/:deploymentId` | Get checklist for deployment |
| POST | `/` | Create checklist item |
| PUT | `/:id/toggle` | Toggle item completion |
| PUT | `/deployment/:deploymentId/complete` | Mark all complete |
| PUT | `/deployment/:deploymentId/reset` | Reset all items |
| GET | `/deployment/:deploymentId/progress` | Get progress stats |

---

### 6.6 Approvals API

**Base URL:** `/api/approvals`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List all approvals |
| GET | `/:id` | Get approval by ID |
| POST | `/request` | Request approval |
| PUT | `/:id/approve` | Approve request |
| PUT | `/:id/reject` | Reject request |
| GET | `/deployment/:deploymentId` | Get approvals for deployment |

---

### 6.7 Users API

**Base URL:** `/api/users`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List all users |
| GET | `/:id` | Get user by ID |
| POST | `/` | Create user |
| PUT | `/:id` | Update user |
| DELETE | `/:id` | Delete user |

---

### 6.8 Audit Logs API

**Base URL:** `/api/audit-logs`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | List audit logs |
| GET | `/:id` | Get log by ID |
| GET | `/resource/:type/:id` | Get logs for resource |
| GET | `/user/:userId` | Get logs for user |

---

### 6.9 Reports API

**Base URL:** `/api/reports`

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/dashboard` | Dashboard metrics |
| GET | `/deployments` | Deployment report |
| GET | `/deployment-trend` | Deployment trends |
| GET | `/status-breakdown` | Status breakdown |
| GET | `/client-activity` | Client activity |
| GET | `/team-performance` | Team performance |
| GET | `/client-health` | Client health |
| GET | `/upcoming-releases` | Upcoming releases |

---

### 6.10 Other APIs

**Checklist Templates:** `/api/checklist-templates`
**Release Notes:** `/api/release-notes`
**Release Note Templates:** `/api/release-note-templates`
**Engineering:** `/api/engineering`
**Resource Allocation:** `/api/resource-allocation`
**Config:** `/api/config`

---

## 7. Database Schema

### 7.1 Core Tables

**users**
```sql
- id (UUID, PK)
- email (VARCHAR, UNIQUE)
- passwordHash (VARCHAR)
- name (VARCHAR)
- role (ENUM)
- assignedProductIds (UUID[])
- managedTeamIds (UUID[])
- maxCapacity (INTEGER)
- skills (VARCHAR[])
- notificationPreferences (JSONB)
- lastLoginAt (TIMESTAMP)
- createdAt (TIMESTAMP)
- updatedAt (TIMESTAMP)
- deletedAt (TIMESTAMP)
```

**products**
```sql
- id (UUID, PK)
- name (VARCHAR)
- description (TEXT)
- productOwner (VARCHAR)
- engineeringOwner (VARCHAR)
- deliveryLead (VARCHAR)
- nextReleaseDate (DATE)
- parentId (UUID, FK -> products)
- parentName (VARCHAR)
- documentation (JSONB)
- relevantDocs (JSONB)
- eap (JSONB)
- isAdapter (BOOLEAN)
- adapterServices (JSONB)
- notificationEmails (VARCHAR[])
- createdAt (TIMESTAMP)
- updatedAt (TIMESTAMP)
- deletedAt (TIMESTAMP)
```

**clients**
```sql
- id (UUID, PK)
- name (VARCHAR)
- cdgOwner (VARCHAR)
- productIds (UUID[])
- comments (TEXT)
- documentation (JSONB)
- createdAt (TIMESTAMP)
- updatedAt (TIMESTAMP)
- deletedAt (TIMESTAMP)
```

**deployments**
```sql
- id (UUID, PK)
- clientId (UUID, FK -> clients)
- clientName (VARCHAR)
- clientIds (UUID[])
- clientNames (VARCHAR[])
- productId (UUID, FK -> products)
- productName (VARCHAR)
- status (VARCHAR)
- deploymentType (VARCHAR)
- environment (VARCHAR)
- nextDeliveryDate (DATE)
- featureName (VARCHAR)
- releaseItems (TEXT[])
- deliveryPerson (VARCHAR)
- ownerId (UUID)
- ownerName (VARCHAR)
- notes (TEXT)
- documentation (JSONB)
- relevantDocs (JSONB)
- equipmentSAStatus (VARCHAR)
- equipmentSEStatus (VARCHAR)
- mappingStatus (VARCHAR)
- constructionStatus (VARCHAR)
- blockedComments (TEXT)
- statusHistory (JSONB)
- notificationEmails (VARCHAR[])
- lastNotificationSent (TIMESTAMP)
- createdAt (TIMESTAMP)
- updatedAt (TIMESTAMP)
- deletedAt (TIMESTAMP)
```

**approvals**
```sql
- id (UUID, PK)
- deploymentId (UUID, FK -> deployments)
- deploymentName (VARCHAR)
- productId (UUID)
- productName (VARCHAR)
- clientId (UUID)
- clientName (VARCHAR)
- requestedBy (UUID)
- requestedByName (VARCHAR)
- requestedAt (TIMESTAMP)
- status (ENUM)
- reviewedBy (UUID)
- reviewedByName (VARCHAR)
- reviewedAt (TIMESTAMP)
- comments (TEXT)
- rejectionReason (TEXT)
- createdAt (TIMESTAMP)
- updatedAt (TIMESTAMP)
```

**audit_logs**
```sql
- id (UUID, PK)
- userId (UUID)
- userName (VARCHAR)
- userEmail (VARCHAR)
- action (VARCHAR)
- resourceType (VARCHAR)
- resourceId (UUID)
- resourceName (VARCHAR)
- changes (JSONB)
- metadata (JSONB)
- createdAt (TIMESTAMP)
```

---

## 8. Configuration

### 8.1 Environment Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment | development |
| `PORT` | Server port | 3000 |
| `DATABASE_URL` | PostgreSQL connection string | - |
| `JWT_SECRET` | JWT signing secret | - |
| `JWT_EXPIRES_IN` | Token expiration | 12h |
| `SUPER_ADMIN_EMAIL` | Default admin email | - |
| `SUPER_ADMIN_PASSWORD` | Default admin password | - |
| `VITE_API_URL` | Frontend API URL | /api |

### 8.2 Configurable Settings

**Product Documentation Types:**
- Product Guide
- Release Notes
- Demo Script
- Test Cases
- Production Checklist

**Deployment Documentation Types:**
- Runbook
- Release Notes Link
- QA Report

---

## 9. Security

### 9.1 Authentication

- **JWT-based Authentication** - Stateless token-based auth
- **Token Expiration** - Configurable (default 12 hours)
- **Password Hashing** - Bcrypt for secure password storage
- **Auto-logout** - Frontend clears auth on 401 responses

### 9.2 Authorization

- **Role-based Access Control** - Frontend and backend level
- **Protected Routes** - JWT validation on all /api routes
- **Permission Helpers** - Built-in helper functions for role checking

### 9.3 Audit Trail

- Complete change tracking for all data mutations
- User identification on every action
- Field-level change tracking (old value → new value)
- Metadata capture (timestamps, user agent, IP)

### 9.4 Data Protection

- **Soft Deletes** - Paranoid mode for all entities
- **Data Recovery** - Restore deleted records via Trash
- **Input Validation** - Server-side validation on all inputs

---

## 10. Troubleshooting

### 10.1 Common Issues

**Login fails with "Invalid credentials"**
- Verify email and password are correct
- Check if user exists in database
- Ensure password meets minimum requirements (8 characters)

**API returns 401 Unauthorized**
- Check if JWT token is present in localStorage
- Verify token has not expired
- Try logging out and logging back in

**Page shows "No permission" error**
- Verify user has required role for the page
- Check role assignment in Users management
- Contact admin to update role if needed

**Deployments not showing in Grouped view**
- Ensure deployments have valid productId
- Verify products have proper parent-child relationships
- Check that deployment has a target date set

### 10.2 Support

For issues and feature requests, please create an issue at:
https://github.com/imatefx/control-tower-v2/issues

---

## Appendix

### A. Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Ctrl/Cmd + K` | Quick search |
| `Esc` | Close dialogs |

### B. Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.3.7 | Jan 2026 | Fix Profile menu navigation |
| 1.3.6 | Jan 2026 | Add Shareholder Dashboard |
| 1.3.5 | Jan 2026 | Add grouped deployments view |
| 1.3.4 | Jan 2026 | Add toast notifications |
| 1.3.3 | Jan 2026 | Upcoming releases feature |

---

*Documentation generated for CDG Control Tower v1.3.7*
