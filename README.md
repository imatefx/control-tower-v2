# Control Tower v2

A comprehensive dashboard application for managing products, clients, deployments, and release tracking.

## Architecture

- **Backend**: Node.js + Moleculer microservices + Sequelize ORM + PostgreSQL
- **Frontend**: React + Vite + shadcn/ui + React Router + React Query
- **Auth**: JWT-based authentication

## Project Structure

```
control-tower-v2/
├── backend/
│   ├── services/          # Moleculer microservices
│   ├── mixins/            # Shared mixins (DbMixin)
│   ├── moleculer.config.js
│   └── package.json
├── ui/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── contexts/      # React contexts (Auth, Theme)
│   │   ├── pages/         # Page components
│   │   ├── services/      # API service layer
│   │   └── lib/           # Utilities
│   ├── vite.config.js
│   └── package.json
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file based on `.env.example`:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your database credentials:
   ```
   DATABASE_URL=postgres://user:password@localhost:5432/control_tower
   JWT_SECRET=your-secret-key
   ```

5. Create the database:
   ```bash
   createdb control_tower
   ```

6. Start the backend:
   ```bash
   npm run dev
   ```

The backend will start on http://localhost:3000

### Frontend Setup

1. Navigate to the UI directory:
   ```bash
   cd ui
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will start on http://localhost:5173

## Default Admin User

On first startup, a default admin user is created:
- **Email**: admin@example.com
- **Password**: admin123

Please change the password after first login.

## User Roles

| Role | Description |
|------|-------------|
| admin | Full system access |
| user | Standard user access |
| viewer | Read-only access |
| delivery_lead | Delivery management |
| product_owner | Product management |
| engineering_manager | Engineering management |

## API Endpoints

### Authentication
- `POST /auth/login` - User login
- `POST /auth/verify` - Verify JWT token
- `POST /auth/refresh` - Refresh JWT token

### Users
- `GET /api/users` - List users
- `POST /api/users` - Create user
- `GET /api/users/:id` - Get user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

### Products
- `GET /api/products` - List products
- `POST /api/products` - Create product
- `GET /api/products/:id` - Get product
- `PUT /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product
- `GET /api/products/:id/children` - Get child products
- `GET /api/products/eap` - Get EAP products

### Clients
- `GET /api/clients` - List clients
- `POST /api/clients` - Create client
- `GET /api/clients/:id` - Get client
- `PUT /api/clients/:id` - Update client
- `DELETE /api/clients/:id` - Delete client

### Deployments
- `GET /api/deployments` - List deployments
- `POST /api/deployments` - Create deployment
- `GET /api/deployments/:id` - Get deployment
- `PUT /api/deployments/:id` - Update deployment
- `DELETE /api/deployments/:id` - Delete deployment
- `PUT /api/deployments/:id/status` - Update deployment status

### Checklists
- `GET /api/checklists/deployment/:id` - Get checklist by deployment
- `PUT /api/checklists/:id/item` - Update checklist item

### Release Notes
- `GET /api/release-notes` - List release notes
- `POST /api/release-notes` - Create release note
- `GET /api/release-notes/:id` - Get release note
- `PUT /api/release-notes/:id` - Update release note
- `DELETE /api/release-notes/:id` - Delete release note

### Approvals
- `GET /api/approvals` - List approvals
- `POST /api/approvals` - Request approval
- `PUT /api/approvals/:id/approve` - Approve request
- `PUT /api/approvals/:id/reject` - Reject request

### Reports
- `GET /api/reports/dashboard` - Dashboard metrics
- `GET /api/reports/deployments` - Deployment report
- `GET /api/reports/clients` - Client report

### Engineering
- `GET /api/engineering/capacity` - Team capacity
- `POST /api/engineering/capacity` - Create capacity record
- `GET /api/engineering/allocation` - Resource allocation

### Audit
- `GET /api/audit` - List audit logs

### Config
- `GET /api/config` - List configuration
- `GET /api/config/:key` - Get config value
- `PUT /api/config/:key` - Update config value

## Features

- **Dashboard**: Overview with KPIs, deployment status breakdown, and recent activity
- **Products**: Product catalog with hierarchy (main/sub/standalone) and EAP support
- **Clients**: Client management with tier levels and regional grouping
- **Deployments**: Deployment tracking with 9-item checklist and status workflow
- **Onboarding**: Track new client onboarding progress
- **Release Notes**: Version-based release documentation
- **EAP Dashboard**: Early Access Program tracking
- **Engineering Dashboard**: Team capacity and resource allocation
- **Users**: User management with role-based access control
- **Approvals**: Workflow approvals for releases
- **Reports**: Analytics and reporting
- **Audit Logs**: Activity tracking
- **Settings**: User preferences and system configuration
- **Trash**: Soft-deleted items recovery

## Tech Stack

### Backend
- **Moleculer** - Microservices framework
- **moleculer-db** - Database mixin
- **moleculer-db-adapter-sequelize** - Sequelize adapter
- **moleculer-web** - API gateway
- **Sequelize** - ORM
- **PostgreSQL** - Database
- **jsonwebtoken** - JWT authentication
- **bcryptjs** - Password hashing

### Frontend
- **React 18** - UI library
- **Vite** - Build tool
- **React Router** - Routing
- **TanStack React Query** - Data fetching
- **shadcn/ui** - UI components
- **Radix UI** - Headless components
- **Tailwind CSS** - Styling
- **Lucide React** - Icons
- **Axios** - HTTP client

## License

Proprietary - All rights reserved
