Control Tower - Product Requirements Document


When building the application, control tower should consider 
1. A delivery lead (optional ) 
2. A complete product life cycle - whatever that it can include 
3. A deployment process 
4. EAP - once running an EAP deployment, we need the options to select multiple clients



  A comprehensive dashboard application for managing products, clients, deployments, and release tracking.

  ---
  Table of Contents

  1. #1-overview
  2. #2-user-roles--authentication
  3. #3-pages--features
  4. #4-data-models
  5. #5-navigation--shortcuts
  6. #6-search-filter--sort
  7. #7-notifications--alerts
  8. #8-charts--visualizations
  9. #9-integrations
  10. #10-theme--responsiveness
  11. #11-api-specification

  ---
  1. Overview

  1.1 Purpose

  Control Tower is a centralized dashboard for tracking:
  - Products - Software products with documentation, releases, and ownership
  - Clients - Customer organizations using the products
  - Deployments - Product rollouts to clients with status tracking
  - Onboarding - Client deployment progress monitoring
  - Release Notes - Version-based release documentation

  1.2 Key Capabilities
  Capability: Product Management
  Description: CRUD for products with parent-child hierarchy, EAP support, adapter configuration
  ────────────────────────────────────────
  Capability: Client Management
  Description: CRUD for clients with deployment tracking
  ────────────────────────────────────────
  Capability: Deployment Tracking
  Description: Status-based workflow (Not Started → In Progress → Blocked/Released)
  ────────────────────────────────────────
  Capability: Checklist System
  Description: 9-item standard deployment checklist with progress tracking
  ────────────────────────────────────────
  Capability: Documentation Links
  Description: Customizable documentation types for products and deployments
  ────────────────────────────────────────
  Capability: Release Notes
  Description: Version-based release documentation with item types
  ────────────────────────────────────────
  Capability: Google Sheets Sync
  Description: Bi-directional sync for Products, Clients, Deployments
  ────────────────────────────────────────
  Capability: CSV Export
  Description: Export data for offline analysis
  ────────────────────────────────────────
  Capability: Notifications
  Description: Deadline-based alerts and blocked deployment notifications
  ---
  2. User Roles & Authentication

  2.1 Authentication
  ┌──────────────────┬─────────────────────────────────────┐
  │     Feature      │             Description             │
  ├──────────────────┼─────────────────────────────────────┤
  │ Login Method     │ Email + Password                    │
  ├──────────────────┼─────────────────────────────────────┤
  │ Token Type       │ JWT with refresh capability         │
  ├──────────────────┼─────────────────────────────────────┤
  │ Session Storage  │ localStorage                        │
  ├──────────────────┼─────────────────────────────────────┤
  │ Auto-logout      │ On token expiration or 401 response │
  ├──────────────────┼─────────────────────────────────────┤
  │ Protected Routes │ All routes except /login            │
  └──────────────────┴─────────────────────────────────────┘
  2.2 User Roles
  ┌───────┬─────────────────────────────────────────────────────────────────────────────┐
  │ Role  │                                 Permissions                                 │
  ├───────┼─────────────────────────────────────────────────────────────────────────────┤
  │ Admin │ Full access: manage users, all CRUD operations, settings configuration      │
  ├───────┼─────────────────────────────────────────────────────────────────────────────┤
  │ User  │ Standard access: manage products, clients, deployments (no user management) │
  └───────┴─────────────────────────────────────────────────────────────────────────────┘
  2.3 User Data Model

  User {
    id: string
    email: string (unique)
    name: string
    role: "admin" | "user"
    createdAt: timestamp
  }

  ---
  3. Pages & Features

  3.1 Dashboard

  Purpose: Overview of key metrics and deployment status

  KPI Cards (8 metrics)
  ┌────────────────────────────────┬────────────────────────────────────────────┐
  │             Metric             │                Description                 │
  ├────────────────────────────────┼────────────────────────────────────────────┤
  │ Active Deployments             │ Count of non-Released deployments          │
  ├────────────────────────────────┼────────────────────────────────────────────┤
  │ Releases This Month            │ Deployments released in current month      │
  ├────────────────────────────────┼────────────────────────────────────────────┤
  │ Overdue Items                  │ Deployments past delivery date             │
  ├────────────────────────────────┼────────────────────────────────────────────┤
  │ Stalled Projects               │ Deployments with <30% checklist completion │
  ├────────────────────────────────┼────────────────────────────────────────────┤
  │ Products Without Deployments   │ Products with zero deployments             │
  ├────────────────────────────────┼────────────────────────────────────────────┤
  │ Products Missing Documentation │ Products with incomplete docs              │
  ├────────────────────────────────┼────────────────────────────────────────────┤
  │ EAP Products Active            │ Products with active EAP status            │
  ├────────────────────────────────┼────────────────────────────────────────────┤
  │ Total Unique EAP Clients       │ Clients in EAP programs                    │
  └────────────────────────────────┴────────────────────────────────────────────┘
  Components
  Component: Deployment Trend Chart
  Description: 8-week line chart of weekly deployment creation
  ────────────────────────────────────────
  Component: Upcoming Releases Timeline
  Description: Grid of upcoming releases sorted by urgency (This Week/Next Week/This Month)
  ────────────────────────────────────────
  Component: Client Deployment Activity
  Description: Top 5 clients by deployment count
  ────────────────────────────────────────
  Component: Gantt Chart
  Description: 4-week sliding timeline with navigation, fullscreen toggle, status-colored bars
  ────────────────────────────────────────
  Component: Recently Viewed
  Description: Sidebar showing last visited items
  ---
  3.2 Products

  Purpose: Manage software products and their documentation

  Product Fields
  ┌──────────────────┬────────┬──────────┬────────────────────────────────────────────────┐
  │      Field       │  Type  │ Required │                  Description                   │
  ├──────────────────┼────────┼──────────┼────────────────────────────────────────────────┤
  │ name             │ string │ Yes      │ Product name                                   │
  ├──────────────────┼────────┼──────────┼────────────────────────────────────────────────┤
  │ description      │ string │ No       │ Product description                            │
  ├──────────────────┼────────┼──────────┼────────────────────────────────────────────────┤
  │ productOwner     │ string │ No       │ Name of product owner                          │
  ├──────────────────┼────────┼──────────┼────────────────────────────────────────────────┤
  │ engineeringOwner │ string │ No       │ Name of engineering owner                      │
  ├──────────────────┼────────┼──────────┼────────────────────────────────────────────────┤
  │ nextReleaseDate  │ date   │ No       │ Target release date                            │
  ├──────────────────┼────────┼──────────┼────────────────────────────────────────────────┤
  │ parentId         │ string │ No       │ Reference to parent product (for sub-projects) │
  └──────────────────┴────────┴──────────┴────────────────────────────────────────────────┘
  Product Documentation
  ┌─────────────────────┬──────┬──────────────────────────────┐
  │        Field        │ Type │         Description          │
  ├─────────────────────┼──────┼──────────────────────────────┤
  │ productGuide        │ URL  │ Link to product guide        │
  ├─────────────────────┼──────┼──────────────────────────────┤
  │ releaseNotes        │ URL  │ Link to release notes        │
  ├─────────────────────┼──────┼──────────────────────────────┤
  │ demoScript          │ URL  │ Link to demo script          │
  ├─────────────────────┼──────┼──────────────────────────────┤
  │ testCases           │ URL  │ Link to test cases           │
  ├─────────────────────┼──────┼──────────────────────────────┤
  │ productionChecklist │ URL  │ Link to production checklist │
  └─────────────────────┴──────┴──────────────────────────────┘
  Relevant Docs Configuration

  - Track which documentation types are applicable per product
  - Boolean flags for each doc type

  EAP (Early Access Program) Configuration
  ┌──────────────┬──────────┬──────────────────────────────────┐
  │    Field     │   Type   │           Description            │
  ├──────────────┼──────────┼──────────────────────────────────┤
  │ isActive     │ boolean  │ Whether EAP is active            │
  ├──────────────┼──────────┼──────────────────────────────────┤
  │ startDate    │ date     │ EAP start date                   │
  ├──────────────┼──────────┼──────────────────────────────────┤
  │ endDate      │ date     │ EAP end date                     │
  ├──────────────┼──────────┼──────────────────────────────────┤
  │ jiraBoardUrl │ URL      │ Link to Jira board               │
  ├──────────────┼──────────┼──────────────────────────────────┤
  │ clientIds    │ string[] │ List of participating client IDs │
  └──────────────┴──────────┴──────────────────────────────────┘
  Adapter Configuration
  ┌────────────────────────┬─────────┬───────────────────────────────┐
  │         Field          │  Type   │          Description          │
  ├────────────────────────┼─────────┼───────────────────────────────┤
  │ isAdapter              │ boolean │ Whether product is an adapter │
  ├────────────────────────┼─────────┼───────────────────────────────┤
  │ hasEquipmentSA         │ boolean │ Equipment Service Assurance   │
  ├────────────────────────┼─────────┼───────────────────────────────┤
  │ hasEquipmentSE         │ boolean │ Equipment Service Enablement  │
  ├────────────────────────┼─────────┼───────────────────────────────┤
  │ hasMappingService      │ boolean │ Mapping Service               │
  ├────────────────────────┼─────────┼───────────────────────────────┤
  │ hasConstructionService │ boolean │ Construction Service          │
  └────────────────────────┴─────────┴───────────────────────────────┘
  Additional Fields
  ┌────────────────────┬──────────┬───────────────────────────────────┐
  │       Field        │   Type   │            Description            │
  ├────────────────────┼──────────┼───────────────────────────────────┤
  │ notificationEmails │ string[] │ Email addresses for notifications │
  └────────────────────┴──────────┴───────────────────────────────────┘
  Product Detail Page

  - All product metadata
  - Sub-projects list (if parent product)
  - Related deployments with statistics
  - Status breakdown (pie/bar)
  - Release checklist progress
  - Documentation completeness score
  - Upcoming releases timeline
  - Notes panel with threaded comments

  ---
  3.3 Clients

  Purpose: Manage customer organizations

  Client Fields
  ┌──────────┬────────┬──────────┬────────────────────────┐
  │  Field   │  Type  │ Required │      Description       │
  ├──────────┼────────┼──────────┼────────────────────────┤
  │ name     │ string │ Yes      │ Client name            │
  ├──────────┼────────┼──────────┼────────────────────────┤
  │ comments │ string │ No       │ Notes about the client │
  └──────────┴────────┴──────────┴────────────────────────┘
  Client Detail Page

  - Client metadata
  - Total deployments count
  - Average checklist completion
  - Documentation readiness score
  - On-time delivery rate
  - Upcoming releases timeline
  - Status breakdown chart

  Validation Rules

  - Cannot delete clients with active deployments

  ---
  3.4 Deployments

  Purpose: Track product rollouts to clients

  Deployment Fields
  ┌──────────────────┬────────┬──────────┬─────────────────────────────────────────────┐
  │      Field       │  Type  │ Required │                 Description                 │
  ├──────────────────┼────────┼──────────┼─────────────────────────────────────────────┤
  │ clientId         │ string │ Yes      │ Reference to client                         │
  ├──────────────────┼────────┼──────────┼─────────────────────────────────────────────┤
  │ clientName       │ string │ Yes      │ Denormalized client name                    │
  ├──────────────────┼────────┼──────────┼─────────────────────────────────────────────┤
  │ productId        │ string │ Yes      │ Reference to product                        │
  ├──────────────────┼────────┼──────────┼─────────────────────────────────────────────┤
  │ productName      │ string │ Yes      │ Denormalized product name                   │
  ├──────────────────┼────────┼──────────┼─────────────────────────────────────────────┤
  │ status           │ enum   │ Yes      │ Not Started, In Progress, Blocked, Released │
  ├──────────────────┼────────┼──────────┼─────────────────────────────────────────────┤
  │ deploymentType   │ enum   │ Yes      │ ga, eap, feature-release, client-specific   │
  ├──────────────────┼────────┼──────────┼─────────────────────────────────────────────┤
  │ environment      │ enum   │ No       │ qa, sandbox, production                     │
  ├──────────────────┼────────┼──────────┼─────────────────────────────────────────────┤
  │ nextDeliveryDate │ date   │ No       │ Target delivery date                        │
  ├──────────────────┼────────┼──────────┼─────────────────────────────────────────────┤
  │ featureName      │ string │ No       │ Feature name (for feature-release type)     │
  ├──────────────────┼────────┼──────────┼─────────────────────────────────────────────┤
  │ releaseItems     │ string │ No       │ Description of what's included              │
  ├──────────────────┼────────┼──────────┼─────────────────────────────────────────────┤
  │ deliveryPerson   │ string │ No       │ Responsible person                          │
  ├──────────────────┼────────┼──────────┼─────────────────────────────────────────────┤
  │ notes            │ string │ No       │ General notes                               │
  └──────────────────┴────────┴──────────┴─────────────────────────────────────────────┘
  Deployment Documentation
  ┌──────────────────┬──────┬───────────────────────┐
  │      Field       │ Type │      Description      │
  ├──────────────────┼──────┼───────────────────────┤
  │ runbook          │ URL  │ Deployment guide      │
  ├──────────────────┼──────┼───────────────────────┤
  │ releaseNotesLink │ URL  │ Link to release notes │
  ├──────────────────┼──────┼───────────────────────┤
  │ qaReport         │ URL  │ QA/test results       │
  └──────────────────┴──────┴───────────────────────┘
  Service Status Tracking (for Adapters)
  Field: equipmentSAStatus
  Values: not_started, in_progress, completed, na
  Description: Equipment SA status
  ────────────────────────────────────────
  Field: equipmentSEStatus
  Values: not_started, in_progress, completed, na
  Description: Equipment SE status
  ────────────────────────────────────────
  Field: mappingStatus
  Values: not_started, in_progress, completed, na
  Description: Mapping Service status
  ────────────────────────────────────────
  Field: constructionStatus
  Values: not_started, in_progress, completed, na
  Description: Construction Service status
  Status History

  StatusHistoryEntry {
    id: string
    text: string
    author: string
    timestamp: date
    type: "status_change"
    fromStatus: string
    toStatus: string
  }

  Blocked Comments

  BlockedComment {
    id: string
    text: string
    author: string
    timestamp: date
    parentId: string | null  // For threaded replies
  }

  View Modes
  ┌─────────────┬─────────────────────────────────────────────────────────────────────────┐
  │    Mode     │                               Description                               │
  ├─────────────┼─────────────────────────────────────────────────────────────────────────┤
  │ Grid View   │ Card-based layout showing all deployments                               │
  ├─────────────┼─────────────────────────────────────────────────────────────────────────┤
  │ Kanban View │ Column-based by status (Not Started → In Progress → Blocked → Released) │
  └─────────────┴─────────────────────────────────────────────────────────────────────────┘
  Deployment Checklist (Standard 9 Items)

  1. Requirements Finalized
  2. API Ready
  3. Backend Ready
  4. Frontend Ready
  5. Test Cases Approved
  6. UAT Completed
  7. Release Notes Added
  8. Documentation Uploaded
  9. Go-Live Validation Completed

  Checklist Actions

  - Toggle individual items
  - Mark all complete
  - Reset all items
  - Track completion percentage

  ---
  3.5 Onboarding

  Purpose: Monitor client deployment progress

  Features

  - View all clients with deployment data
  - Per-client metrics:
    - Number of projects/deployments
    - Average checklist completion (circular progress)
    - Blocked deployments count
    - Individual project progress bars
  - Search clients
  - Color-coded progress (emerald: 100%, amber: blocked, blue: in-progress)

  ---
  3.6 Release Notes

  Purpose: Document version releases

  Release Note Fields
  ┌─────────────┬────────┬──────────┬──────────────────────┐
  │    Field    │  Type  │ Required │     Description      │
  ├─────────────┼────────┼──────────┼──────────────────────┤
  │ productId   │ string │ Yes      │ Reference to product │
  ├─────────────┼────────┼──────────┼──────────────────────┤
  │ version     │ string │ Yes      │ Version number       │
  ├─────────────┼────────┼──────────┼──────────────────────┤
  │ releaseDate │ date   │ No       │ Release date         │
  ├─────────────┼────────┼──────────┼──────────────────────┤
  │ title       │ string │ No       │ Release title        │
  ├─────────────┼────────┼──────────┼──────────────────────┤
  │ summary     │ string │ No       │ Release summary      │
  ├─────────────┼────────┼──────────┼──────────────────────┤
  │ items       │ array  │ No       │ Release items        │
  └─────────────┴────────┴──────────┴──────────────────────┘
  Release Item Types
  ┌─────────────┬───────────────┬─────────┬─────────────────────────┐
  │    Type     │     Icon      │  Color  │       Description       │
  ├─────────────┼───────────────┼─────────┼─────────────────────────┤
  │ feature     │ Sparkles      │ Emerald │ New feature             │
  ├─────────────┼───────────────┼─────────┼─────────────────────────┤
  │ improvement │ TrendingUp    │ Blue    │ Enhancement             │
  ├─────────────┼───────────────┼─────────┼─────────────────────────┤
  │ bugfix      │ Bug           │ Rose    │ Bug fix                 │
  ├─────────────┼───────────────┼─────────┼─────────────────────────┤
  │ security    │ Shield        │ Amber   │ Security update         │
  ├─────────────┼───────────────┼─────────┼─────────────────────────┤
  │ performance │ Zap           │ Purple  │ Performance improvement │
  ├─────────────┼───────────────┼─────────┼─────────────────────────┤
  │ breaking    │ AlertTriangle │ Red     │ Breaking change         │
  ├─────────────┼───────────────┼─────────┼─────────────────────────┤
  │ deprecated  │ Clock         │ Slate   │ Deprecated feature      │
  ├─────────────┼───────────────┼─────────┼─────────────────────────┤
  │ docs        │ FileText      │ Cyan    │ Documentation update    │
  └─────────────┴───────────────┴─────────┴─────────────────────────┘
  Release Item Fields
  ┌─────────────┬────────┬──────────────────────┐
  │    Field    │  Type  │     Description      │
  ├─────────────┼────────┼──────────────────────┤
  │ type        │ enum   │ Item type from above │
  ├─────────────┼────────┼──────────────────────┤
  │ title       │ string │ Item title           │
  ├─────────────┼────────┼──────────────────────┤
  │ description │ string │ Item description     │
  ├─────────────┼────────┼──────────────────────┤
  │ visibility  │ enum   │ public, internal     │
  └─────────────┴────────┴──────────────────────┘
  Features

  - Search by version, title, content
  - Filter by product
  - Preview formatted release notes
  - Copy to clipboard
  - PDF export
  - Sort by release date

  ---
  3.7 EAP Dashboard

  Purpose: Track Early Access Program status

  KPI Cards
  ┌─────────────────────┬─────────────────────────────────┐
  │       Metric        │           Description           │
  ├─────────────────────┼─────────────────────────────────┤
  │ Total EAP Products  │ Products with EAP configuration │
  ├─────────────────────┼─────────────────────────────────┤
  │ Active EAP Programs │ Currently active EAP products   │
  ├─────────────────────┼─────────────────────────────────┤
  │ Ending Soon         │ EAP ending within 30 days       │
  ├─────────────────────┼─────────────────────────────────┤
  │ Expired             │ Past end date                   │
  ├─────────────────────┼─────────────────────────────────┤
  │ Unique EAP Clients  │ Total clients in EAP programs   │
  ├─────────────────────┼─────────────────────────────────┤
  │ EAP Deployments     │ Deployments with type=eap       │
  └─────────────────────┴─────────────────────────────────┘
  EAP Product List

  - Product name with EAP indicator
  - Status badge (Active, Ending Soon, Expired, No End Date)
  - Days remaining
  - Associated clients
  - Jira board link
  - Start/end dates

  ---
  3.8 Users (Admin Only)

  Purpose: Manage application users

  Features

  - List all users with search
  - Create new users
  - Edit user details and role
  - Delete users
  - View creation date

  ---
  3.9 Settings

  Purpose: Application configuration

  Google Sheets Sync
  ┌──────────────────┬─────────────────────────────┐
  │     Setting      │         Description         │
  ├──────────────────┼─────────────────────────────┤
  │ Google Sheet URL │ URL to the sync spreadsheet │
  ├──────────────────┼─────────────────────────────┤
  │ Apps Script URL  │ Web app URL for sync        │
  ├──────────────────┼─────────────────────────────┤
  │ Enable/Disable   │ Toggle sync functionality   │
  ├──────────────────┼─────────────────────────────┤
  │ Last Sync        │ Timestamp of last sync      │
  └──────────────────┴─────────────────────────────┘
  Sync Actions

  - Sync Products to Sheet
  - Sync Deployments to Sheet
  - Sync Clients to Sheet
  - Pull from Sheet (import)

  Documentation Types Configuration

  Product Documentation Types (customizable):
  - Add new types
  - Edit labels
  - Delete types
  - Reorder types
  - Defaults: Product Guide, Release Notes, Demo Script, Test Cases, Prod Checklist

  Deployment Documentation Types (customizable):
  - Add new types
  - Edit labels
  - Delete types
  - Reorder types
  - Defaults: Runbook, Release Notes Link, QA Report

  CSV Export

  - Export Products
  - Export Deployments
  - Export Clients
  - Date-stamped filenames

  ---
  4. Data Models

  4.1 Products Collection

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

  4.2 Clients Collection

  interface Client {
    id: string;
    name: string;
    comments?: string;
    createdAt: Date;
    updatedAt: Date;
  }

  4.3 Deployments Collection

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

  4.4 Checklists Collection

  interface ChecklistItem {
    id: string;
    deploymentId: string;
    item: string;
    isCompleted: boolean;
    createdAt: Date;
    updatedAt: Date;
  }

  4.5 Release Notes Collection

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

  4.6 Config Collection

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

  4.7 Users Collection

  interface User {
    id: string;
    email: string;
    name: string;
    role: 'admin' | 'user';
    createdAt: Date;
  }

  ---
  5. Navigation & Shortcuts

  5.1 Navigation Structure
  ┌────────────────┬────────────────┬─────────────────────────┐
  │     Route      │      Page      │       Description       │
  ├────────────────┼────────────────┼─────────────────────────┤
  │ /              │ Dashboard      │ Main overview           │
  ├────────────────┼────────────────┼─────────────────────────┤
  │ /products      │ Products       │ Product list            │
  ├────────────────┼────────────────┼─────────────────────────┤
  │ /products/:id  │ Product Detail │ Single product          │
  ├────────────────┼────────────────┼─────────────────────────┤
  │ /clients       │ Clients        │ Client list             │
  ├────────────────┼────────────────┼─────────────────────────┤
  │ /clients/:id   │ Client Detail  │ Single client           │
  ├────────────────┼────────────────┼─────────────────────────┤
  │ /deployments   │ Deployments    │ Deployment list         │
  ├────────────────┼────────────────┼─────────────────────────┤
  │ /onboarding    │ Onboarding     │ Progress tracking       │
  ├────────────────┼────────────────┼─────────────────────────┤
  │ /release-notes │ Release Notes  │ Version documentation   │
  ├────────────────┼────────────────┼─────────────────────────┤
  │ /eap           │ EAP Dashboard  │ Early access tracking   │
  ├────────────────┼────────────────┼─────────────────────────┤
  │ /users         │ Users          │ User management (admin) │
  ├────────────────┼────────────────┼─────────────────────────┤
  │ /settings      │ Settings       │ App configuration       │
  ├────────────────┼────────────────┼─────────────────────────┤
  │ /login         │ Login          │ Authentication          │
  └────────────────┴────────────────┴─────────────────────────┘
  5.2 Keyboard Shortcuts
  ┌──────────┬─────────────────────────────────────────────┐
  │ Shortcut │                   Action                    │
  ├──────────┼─────────────────────────────────────────────┤
  │ /        │ Open command palette (global search)        │
  ├──────────┼─────────────────────────────────────────────┤
  │ n        │ Create new deployment (on deployments page) │
  ├──────────┼─────────────────────────────────────────────┤
  │ g + h    │ Go to Dashboard                             │
  ├──────────┼─────────────────────────────────────────────┤
  │ g + p    │ Go to Products                              │
  ├──────────┼─────────────────────────────────────────────┤
  │ g + d    │ Go to Deployments                           │
  ├──────────┼─────────────────────────────────────────────┤
  │ g + c    │ Go to Clients                               │
  ├──────────┼─────────────────────────────────────────────┤
  │ g + o    │ Go to Onboarding                            │
  ├──────────┼─────────────────────────────────────────────┤
  │ Escape   │ Close modal/palette/dropdown                │
  └──────────┴─────────────────────────────────────────────┘
  5.3 Command Palette

  - Activated with / key
  - Search across products, clients, deployments
  - Shows item type with icon
  - Max 8 results
  - Click to navigate
  - Escape to close

  5.4 Recently Viewed

  - Sidebar section showing last visited items
  - Tracks products, clients, deployments
  - Clickable for quick navigation

  ---
  6. Search, Filter & Sort

  6.1 Global Search
  ┌────────────┬────────────────────────────────┐
  │  Feature   │          Description           │
  ├────────────┼────────────────────────────────┤
  │ Activation │ / key or search icon           │
  ├────────────┼────────────────────────────────┤
  │ Scope      │ Products, Clients, Deployments │
  ├────────────┼────────────────────────────────┤
  │ Fields     │ Name/title fields              │
  ├────────────┼────────────────────────────────┤
  │ Results    │ Max 8, sorted by relevance     │
  └────────────┴────────────────────────────────┘
  6.2 Deployments Filters
  ┌─────────────┬─────────────────────────────────────────────┐
  │   Filter    │                   Values                    │
  ├─────────────┼─────────────────────────────────────────────┤
  │ Status      │ Not Started, In Progress, Blocked, Released │
  ├─────────────┼─────────────────────────────────────────────┤
  │ Environment │ QA, Sandbox, Production                     │
  ├─────────────┼─────────────────────────────────────────────┤
  │ Urgency     │ Upcoming, Overdue, Stalled                  │
  ├─────────────┼─────────────────────────────────────────────┤
  │ By ID       │ Deployment ID search                        │
  └─────────────┴─────────────────────────────────────────────┘
  6.3 Sorting
  ┌───────────────┬───────────────────────────────────┐
  │     Page      │           Sort Options            │
  ├───────────────┼───────────────────────────────────┤
  │ Products      │ Name, hierarchy                   │
  ├───────────────┼───────────────────────────────────┤
  │ Clients       │ Name, deployment count            │
  ├───────────────┼───────────────────────────────────┤
  │ Deployments   │ Deadline, status, client, product │
  ├───────────────┼───────────────────────────────────┤
  │ Release Notes │ Release date (newest first)       │
  └───────────────┴───────────────────────────────────┘
  6.4 URL Persistence

  - Filters saved to URL params
  - Deep linking support
  - Back button preserves state

  ---
  7. Notifications & Alerts

  7.1 Toast Notifications
  ┌─────────┬───────┬─────────────┬───────────┐
  │  Type   │ Color │    Icon     │ Duration  │
  ├─────────┼───────┼─────────────┼───────────┤
  │ Success │ Green │ CheckCircle │ 4 seconds │
  ├─────────┼───────┼─────────────┼───────────┤
  │ Error   │ Red   │ AlertCircle │ 4 seconds │
  ├─────────┼───────┼─────────────┼───────────┤
  │ Info    │ Blue  │ Info        │ 4 seconds │
  └─────────┴───────┴─────────────┴───────────┘
  7.2 Notification Center
  ┌──────────┬───────┬────────────────────────────────────────┐
  │ Severity │ Color │                Triggers                │
  ├──────────┼───────┼────────────────────────────────────────┤
  │ Critical │ Red   │ Overdue deployments, urgent deadlines  │
  ├──────────┼───────┼────────────────────────────────────────┤
  │ Warning  │ Amber │ Blocked deployments, 5-7 day deadlines │
  ├──────────┼───────┼────────────────────────────────────────┤
  │ Info     │ Blue  │ General notifications                  │
  └──────────┴───────┴────────────────────────────────────────┘
  7.3 Notification Types
  ┌───────────────────┬──────────────────────────────┐
  │       Type        │         Description          │
  ├───────────────────┼──────────────────────────────┤
  │ Upcoming Deadline │ Delivery date within 7 days  │
  ├───────────────────┼──────────────────────────────┤
  │ Overdue           │ Past delivery date           │
  ├───────────────────┼──────────────────────────────┤
  │ Blocked           │ Deployment status is Blocked │
  └───────────────────┴──────────────────────────────┘
  7.4 Features

  - Bell icon with badge counter
  - Click to navigate to deployment
  - Dismiss individual/all
  - Persisted dismissal state

  ---
  8. Charts & Visualizations

  8.1 Deployment Trend Chart

  - Type: Line chart
  - Data: Weekly deployment creation count
  - Range: 8 weeks
  - Features: Responsive, tooltip on hover

  8.2 Gantt Chart

  - Type: Timeline bars
  - Range: 4-week sliding window
  - Colors: Status-based (slate/blue/amber/emerald)
  - Features:
    - Navigation arrows
    - Fullscreen toggle
    - Click to open deployment
    - Escape to close fullscreen

  8.3 Timeline Strip

  - Type: Grid of cards
  - Data: Upcoming releases
  - Sorting: By deadline
  - Features: Urgency indicator (pulsing dot), hover effects

  8.4 Progress Indicators
  ┌───────────────┬───────────────────────────┐
  │     Type      │           Usage           │
  ├───────────────┼───────────────────────────┤
  │ Circular Ring │ Client/product completion │
  ├───────────────┼───────────────────────────┤
  │ Linear Bar    │ Checklist progress        │
  ├───────────────┼───────────────────────────┤
  │ Percentage    │ Numeric completion        │
  └───────────────┴───────────────────────────┘
  8.5 Status Colors
  ┌─────────────┬─────────┐
  │   Status    │  Color  │
  ├─────────────┼─────────┤
  │ Not Started │ Slate   │
  ├─────────────┼─────────┤
  │ In Progress │ Blue    │
  ├─────────────┼─────────┤
  │ Blocked     │ Amber   │
  ├─────────────┼─────────┤
  │ Released    │ Emerald │
  └─────────────┴─────────┘
  ---
  9. Integrations

  9.1 Google Sheets Sync

  Configuration

  - Google Sheet URL
  - Apps Script Web App URL
  - Enable/disable toggle

  Sheets Structure

  Products Sheet:
  id | name | parentId | parentName | description | productOwner |
  engineeringOwner | nextReleaseDate | productGuide | releaseNotes |
  demoScript | testCases | productionChecklist | updatedAt

  Deployments Sheet:
  id | clientId | clientName | productId | productName | status |
  deploymentType | nextDeliveryDate | notes | updatedAt

  Clients Sheet:
  id | name | comments | updatedAt

  Operations

  - Push to sheet (write)
  - Pull from sheet (read/import)
  - Conflict resolution via updatedAt
  - Auto-create sheets with headers

  9.2 CSV Export
  ┌─────────────┬─────────────────────────────────────────────────────┐
  │   Export    │                       Fields                        │
  ├─────────────┼─────────────────────────────────────────────────────┤
  │ Products    │ ID, Name, Parent, Description, Owners, Release Date │
  ├─────────────┼─────────────────────────────────────────────────────┤
  │ Deployments │ ID, Client, Product, Status, Type, Date, Progress   │
  ├─────────────┼─────────────────────────────────────────────────────┤
  │ Clients     │ ID, Name, Notes                                     │
  └─────────────┴─────────────────────────────────────────────────────┘
  ---
  10. Theme & Responsiveness

  10.1 Theme Support
  ┌─────────────┬─────────────────────────────────┐
  │   Feature   │           Description           │
  ├─────────────┼─────────────────────────────────┤
  │ Modes       │ Light, Dark                     │
  ├─────────────┼─────────────────────────────────┤
  │ Detection   │ System preference on first load │
  ├─────────────┼─────────────────────────────────┤
  │ Persistence │ localStorage                    │
  ├─────────────┼─────────────────────────────────┤
  │ Toggle      │ Sidebar button                  │
  └─────────────┴─────────────────────────────────┘
  10.2 Color Palette

  Status Colors:
  - Slate (neutral)
  - Blue (info/in-progress)
  - Emerald (success/released)
  - Amber (warning/blocked)
  - Rose (error)

  Avatar Colors:
  - Products: Indigo, Violet, Fuchsia, Pink, Cyan, Teal, Emerald
  - Clients: Blue, Emerald, Purple, Amber, Rose, Cyan, Indigo

  10.3 Breakpoints
  ┌────────────┬────────┬────────────────┐
  │ Breakpoint │ Width  │  Description   │
  ├────────────┼────────┼────────────────┤
  │ sm         │ 640px  │ Small devices  │
  ├────────────┼────────┼────────────────┤
  │ md         │ 768px  │ Medium devices │
  ├────────────┼────────┼────────────────┤
  │ lg         │ 1024px │ Large devices  │
  ├────────────┼────────┼────────────────┤
  │ xl         │ 1280px │ Extra large    │
  └────────────┴────────┴────────────────┘
  10.4 Mobile Adaptations

  - Drawer menu replaces sidebar
  - Horizontal scroll for data-heavy views
  - Touch-friendly tap targets
  - Responsive grid layouts

  ---
  11. API Specification

  11.1 Authentication Endpoints
  ┌────────┬────────────────┬───────────────────────────┐
  │ Method │    Endpoint    │        Description        │
  ├────────┼────────────────┼───────────────────────────┤
  │ POST   │ /auth/login    │ Login with email/password │
  ├────────┼────────────────┼───────────────────────────┤
  │ POST   │ /auth/register │ Register new user         │
  ├────────┼────────────────┼───────────────────────────┤
  │ POST   │ /auth/refresh  │ Refresh JWT token         │
  └────────┴────────────────┴───────────────────────────┘
  Login Request

  {
    "email": "user@example.com",
    "password": "password123"
  }

  Login Response

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

  11.2 CRUD Endpoints
  ┌────────┬────────────────────────┬─────────────────┐
  │ Method │        Endpoint        │   Description   │
  ├────────┼────────────────────────┼─────────────────┤
  │ GET    │ /api/{collection}      │ List all items  │
  ├────────┼────────────────────────┼─────────────────┤
  │ GET    │ /api/{collection}/{id} │ Get single item │
  ├────────┼────────────────────────┼─────────────────┤
  │ POST   │ /api/{collection}      │ Create item     │
  ├────────┼────────────────────────┼─────────────────┤
  │ PUT    │ /api/{collection}/{id} │ Update item     │
  ├────────┼────────────────────────┼─────────────────┤
  │ DELETE │ /api/{collection}/{id} │ Delete item     │
  └────────┴────────────────────────┴─────────────────┘
  Collections: products, clients, deployments, checklists, releaseNotes, users

  11.3 Configuration Endpoints
  ┌────────┬───────────────────┬──────────────────┐
  │ Method │     Endpoint      │   Description    │
  ├────────┼───────────────────┼──────────────────┤
  │ GET    │ /api/config/{key} │ Get config value │
  ├────────┼───────────────────┼──────────────────┤
  │ POST   │ /api/config/{key} │ Set config value │
  └────────┴───────────────────┴──────────────────┘
  11.4 User Management (Admin Only)
  ┌────────┬─────────────────┬────────────────┐
  │ Method │    Endpoint     │  Description   │
  ├────────┼─────────────────┼────────────────┤
  │ GET    │ /api/users      │ List all users │
  ├────────┼─────────────────┼────────────────┤
  │ POST   │ /api/users      │ Create user    │
  ├────────┼─────────────────┼────────────────┤
  │ PUT    │ /api/users/{id} │ Update user    │
  ├────────┼─────────────────┼────────────────┤
  │ DELETE │ /api/users/{id} │ Delete user    │
  └────────┴─────────────────┴────────────────┘
  11.5 Error Responses

  {
    "error": true,
    "message": "Error description",
    "code": "ERROR_CODE"
  }

  11.6 Standard Headers

  Authorization: Bearer <jwt-token>
  Content-Type: application/json

  ---
  Appendix A: Standard Checklist Items

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
  Appendix B: Default Documentation Types

  Product Documentation

  1. Product Guide
  2. Release Notes
  3. Demo Script
  4. Test Cases
  5. Production Checklist

  Deployment Documentation

  1. Runbook / Deployment Guide
  2. Release Notes Link
  3. Test Results / QA Report

  ---
  Appendix C: Deployment Type Definitions
  ┌──────────────────────┬─────────────────┬─────────────────────────────┐
  │         Type         │       Key       │         Description         │
  ├──────────────────────┼─────────────────┼─────────────────────────────┤
  │ General Availability │ ga              │ Standard production release │
  ├──────────────────────┼─────────────────┼─────────────────────────────┤
  │ Early Access Program │ eap             │ Beta/preview release        │
  ├──────────────────────┼─────────────────┼─────────────────────────────┤
  │ Feature Release      │ feature-release │ Specific feature deployment │
  ├──────────────────────┼─────────────────┼─────────────────────────────┤
  │ Client-Specific      │ client-specific │ Custom client deployment    │
  └──────────────────────┴─────────────────┴─────────────────────────────┘
  ---
  Appendix D: Environment Definitions
  ┌─────────────┬────────────┬───────────────────────────┐
  │ Environment │    Key     │        Description        │
  ├─────────────┼────────────┼───────────────────────────┤
  │ QA          │ qa         │ Quality assurance testing │
  ├─────────────┼────────────┼───────────────────────────┤
  │ Sandbox     │ sandbox    │ Pre-production testing    │
  ├─────────────┼────────────┼───────────────────────────┤
  │ Production  │ production │ Live environment          │
  └─────────────┴────────────┴───────────────────────────┘
  ---
  Appendix E: Release Item Types
  ┌─────────────────┬─────────────┬───────────────┬─────────┬─────────────────────┐
  │      Type       │     Key     │     Icon      │  Color  │     Description     │
  ├─────────────────┼─────────────┼───────────────┼─────────┼─────────────────────┤
  │ New Feature     │ feature     │ Sparkles      │ Emerald │ New functionality   │
  ├─────────────────┼─────────────┼───────────────┼─────────┼─────────────────────┤
  │ Improvement     │ improvement │ TrendingUp    │ Blue    │ Enhancement         │
  ├─────────────────┼─────────────┼───────────────┼─────────┼─────────────────────┤
  │ Bug Fix         │ bugfix      │ Bug           │ Rose    │ Defect fix          │
  ├─────────────────┼─────────────┼───────────────┼─────────┼─────────────────────┤
  │ Security        │ security    │ Shield        │ Amber   │ Security patch      │
  ├─────────────────┼─────────────┼───────────────┼─────────┼─────────────────────┤
  │ Performance     │ performance │ Zap           │ Purple  │ Speed/optimization  │
  ├─────────────────┼─────────────┼───────────────┼─────────┼─────────────────────┤
  │ Breaking Change │ breaking    │ AlertTriangle │ Red     │ Incompatible change │
  ├─────────────────┼─────────────┼───────────────┼─────────┼─────────────────────┤
  │ Deprecated      │ deprecated  │ Clock         │ Slate   │ Removal notice      │
  ├─────────────────┼─────────────┼───────────────┼─────────┼─────────────────────┤
  │ Documentation   │ docs        │ FileText      │ Cyan    │ Doc updates         │
  └─────────────────┴─────────────┴───────────────┴─────────┴─────────────────────┘
  ---
  Document Version: 1.0
  Generated: January 2025

  ---
  This comprehensive requirements document covers all features, data models, API specifications, and UI behaviors of your Control Tower application. You can use this as a foundation to rebuild with any tech stack you choose.