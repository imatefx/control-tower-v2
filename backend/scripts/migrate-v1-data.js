#!/usr/bin/env node
/**
 * Migration script to import Control Tower v1 data into v2
 * Usage: node scripts/migrate-v1-data.js
 */

require("dotenv").config();
const fs = require("fs");
const path = require("path");
const { Sequelize } = require("sequelize");
const { v4: uuidv4 } = require("uuid");

const V1_DB_PATH = "/Users/stalin/dev/iia/common/control-tower/db";

const sequelize = new Sequelize(process.env.DATABASE_URL, {
  dialect: "postgres",
  logging: false,
});

// Parse SQL INSERT values
function parseValues(valuesStr) {
  const values = [];
  let current = "";
  let inString = false;
  let depth = 0;

  for (let i = 0; i < valuesStr.length; i++) {
    const char = valuesStr[i];

    if (char === "'" && !inString) {
      inString = true;
      continue;
    }

    if (char === "'" && inString) {
      if (valuesStr[i + 1] === "'") {
        current += "'";
        i++;
        continue;
      }
      inString = false;
      continue;
    }

    if (!inString) {
      if (char === "{" || char === "[") depth++;
      if (char === "}" || char === "]") depth--;

      if (char === "," && depth === 0) {
        values.push(parseValue(current.trim()));
        current = "";
        continue;
      }
    }

    current += char;
  }

  if (current.trim()) {
    values.push(parseValue(current.trim()));
  }

  return values;
}

function parseValue(val) {
  if (val === "null" || val === "NULL") return null;
  if (val === "true") return true;
  if (val === "false") return false;
  if (/^-?\d+$/.test(val)) return parseInt(val, 10);
  if (/^-?\d+\.\d+$/.test(val)) return parseFloat(val);
  return val;
}

function parseSqlFile(sqlContent, columns) {
  const rows = [];
  const regex = /VALUES\s*\((.+?)\);/gs;
  let match;

  while ((match = regex.exec(sqlContent)) !== null) {
    const values = parseValues(match[1]);
    if (values.length === columns.length) {
      const row = {};
      columns.forEach((col, i) => {
        row[col] = values[i];
      });
      rows.push(row);
    }
  }

  return rows;
}

async function migrate() {
  console.log("Starting migration from Control Tower v1 to v2...\n");

  try {
    await sequelize.authenticate();
    console.log("Connected to database.\n");

    // Read SQL files
    const productsSql = fs.readFileSync(path.join(V1_DB_PATH, "products.sql"), "utf8");
    const clientsSql = fs.readFileSync(path.join(V1_DB_PATH, "clients.sql"), "utf8");
    const deploymentsSql = fs.readFileSync(path.join(V1_DB_PATH, "deployments.sql"), "utf8");
    const checklistsSql = fs.readFileSync(path.join(V1_DB_PATH, "checklists.sql"), "utf8");
    const releaseNotesSql = fs.readFileSync(path.join(V1_DB_PATH, "release_notes.sql"), "utf8");

    // Parse with known column order from v1 schema
    const products = parseSqlFile(productsSql, [
      "id", "name", "description", "product_owner", "engineering_owner",
      "next_release_date", "parent_id", "documentation", "relevant_docs", "eap",
      "is_adapter", "has_equipment_sa", "has_equipment_se", "has_mapping_service",
      "has_construction_service", "notification_emails", "notes", "created_at", "updated_at"
    ]);

    const clients = parseSqlFile(clientsSql, [
      "id", "name", "comments", "created_at", "updated_at"
    ]);

    const deployments = parseSqlFile(deploymentsSql, [
      "id", "client_id", "product_id", "status", "deployment_type", "environment",
      "next_delivery_date", "feature_name", "release_items", "notes", "blocked_comments",
      "status_history", "equipment_sa_status", "equipment_se_status", "mapping_status",
      "construction_status", "created_at", "updated_at", "documentation", "relevant_docs"
    ]);

    const checklists = parseSqlFile(checklistsSql, [
      "id", "deployment_id", "item", "is_completed", "order", "created_at", "updated_at"
    ]);

    const releaseNotes = parseSqlFile(releaseNotesSql, [
      "id", "product_id", "version", "release_date", "title", "summary", "items", "history",
      "created_at", "updated_at"
    ]);

    console.log(`Found: ${products.length} products, ${clients.length} clients, ${deployments.length} deployments`);
    console.log(`       ${checklists.length} checklist items, ${releaseNotes.length} release notes\n`);

    // Create lookup maps
    const productMap = new Map(products.map(p => [p.id, p]));
    const clientMap = new Map(clients.map(c => [c.id, c]));

    // Generic client for null client_id deployments
    const genericClientId = "00000000-0000-0000-0000-000000000000";

    // 1. Import Products
    console.log("Importing products...");
    let productCount = 0;
    for (const p of products) {
      try {
        const doc = typeof p.documentation === 'string' ? p.documentation : JSON.stringify(p.documentation || {});
        const relevantDocs = typeof p.relevant_docs === 'string' ? p.relevant_docs : JSON.stringify(p.relevant_docs || {});
        const eap = p.eap ? (typeof p.eap === 'string' ? p.eap : JSON.stringify(p.eap)) : null;

        // notification_emails is a varchar[] array, not jsonb
        let emails = p.notification_emails || [];
        if (typeof emails === 'string') {
          try { emails = JSON.parse(emails); } catch(e) { emails = []; }
        }
        const emailsArray = '{' + emails.map(e => '"' + e + '"').join(',') + '}';

        await sequelize.query(`
          INSERT INTO products (id, name, description, product_owner, engineering_owner,
            next_release_date, parent_id, documentation, relevant_docs, eap,
            notification_emails, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8::jsonb, $9::jsonb, $10::jsonb, $11::varchar[], $12, $13)
          ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
        `, {
          bind: [p.id, p.name, p.description, p.product_owner, p.engineering_owner,
                 p.next_release_date, p.parent_id, doc, relevantDocs, eap, emailsArray,
                 p.created_at, p.updated_at]
        });
        productCount++;
      } catch (err) {
        console.error(`  Error product ${p.name}: ${err.message}`);
      }
    }
    console.log(`  Imported ${productCount} products.\n`);

    // 2. Import Clients
    console.log("Importing clients...");

    // Create generic client first
    await sequelize.query(`
      INSERT INTO clients (id, name, comments, created_at, updated_at)
      VALUES ($1, $2, $3, NOW(), NOW())
      ON CONFLICT (id) DO NOTHING
    `, { bind: [genericClientId, "Generic (No Client)", "Auto-created for deployments without client"] });

    let clientCount = 0;
    for (const c of clients) {
      try {
        await sequelize.query(`
          INSERT INTO clients (id, name, comments, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5)
          ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()
        `, { bind: [c.id, c.name, c.comments, c.created_at, c.updated_at] });
        clientCount++;
      } catch (err) {
        console.error(`  Error client ${c.name}: ${err.message}`);
      }
    }
    console.log(`  Imported ${clientCount} clients.\n`);

    // 3. Import Deployments
    console.log("Importing deployments...");
    let deploymentCount = 0;
    for (const d of deployments) {
      try {
        const client = d.client_id ? clientMap.get(d.client_id) : null;
        const product = productMap.get(d.product_id);

        const clientId = d.client_id || genericClientId;
        const clientName = client?.name || "Generic (No Client)";
        const productName = product?.name || "Unknown Product";

        // Map deployment type
        let deploymentType = d.deployment_type;
        if (deploymentType === "generic") deploymentType = "ga";

        const notes = typeof d.notes === 'string' ? d.notes : JSON.stringify(d.notes || []);
        const doc = typeof d.documentation === 'string' ? d.documentation : JSON.stringify(d.documentation || {});

        // relevant_docs is varchar[] array, not jsonb
        let relevantDocsArr = d.relevant_docs || [];
        if (typeof relevantDocsArr === 'string') {
          try { relevantDocsArr = JSON.parse(relevantDocsArr); } catch(e) { relevantDocsArr = []; }
        }
        if (!Array.isArray(relevantDocsArr)) relevantDocsArr = [];
        const relevantDocs = '{' + relevantDocsArr.map(r => '"' + (r || '').replace(/"/g, '\\"') + '"').join(',') + '}';

        const blockedComments = typeof d.blocked_comments === 'string' ? d.blocked_comments : JSON.stringify(d.blocked_comments || []);
        const statusHistory = typeof d.status_history === 'string' ? d.status_history : JSON.stringify(d.status_history || []);

        await sequelize.query(`
          INSERT INTO deployments (id, client_id, client_name, product_id, product_name,
            status, deployment_type, environment, next_delivery_date, feature_name,
            release_items, notes, documentation, relevant_docs,
            equipment_s_a_status, equipment_s_e_status, mapping_status, construction_status,
            blocked_comments, status_history, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13::jsonb, $14::varchar[],
                  $15, $16, $17, $18, $19::jsonb, $20::jsonb, $21, $22)
          ON CONFLICT (id) DO UPDATE SET status = EXCLUDED.status, updated_at = NOW()
        `, {
          bind: [d.id, clientId, clientName, d.product_id, productName,
                 d.status, deploymentType, d.environment, d.next_delivery_date, d.feature_name,
                 d.release_items, notes, doc, relevantDocs,
                 d.equipment_sa_status || "not_started", d.equipment_se_status || "not_started",
                 d.mapping_status || "not_started", d.construction_status || "not_started",
                 blockedComments, statusHistory, d.created_at, d.updated_at]
        });
        deploymentCount++;
      } catch (err) {
        console.error(`  Error deployment ${d.id}: ${err.message}`);
      }
    }
    console.log(`  Imported ${deploymentCount} deployments.\n`);

    // 4. Import Checklists (individual rows, v1 style)
    console.log("Importing checklists...");
    let checklistCount = 0;
    for (const c of checklists) {
      try {
        const isCompleted = c.is_completed === true || c.is_completed === "true" || c.is_completed === 1;
        await sequelize.query(`
          INSERT INTO checklists (id, deployment_id, item, is_completed, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6)
          ON CONFLICT (id) DO UPDATE SET is_completed = EXCLUDED.is_completed, updated_at = NOW()
        `, { bind: [c.id, c.deployment_id, c.item, isCompleted, c.created_at, c.updated_at] });
        checklistCount++;
      } catch (err) {
        console.error(`  Error checklist ${c.id}: ${err.message}`);
      }
    }
    console.log(`  Imported ${checklistCount} checklist items.\n`);

    // 5. Import Release Notes
    console.log("Importing release notes...");
    let releaseCount = 0;
    for (const rn of releaseNotes) {
      try {
        const items = typeof rn.items === 'string' ? rn.items : JSON.stringify(rn.items || []);
        await sequelize.query(`
          INSERT INTO release_notes (id, product_id, version, release_date, summary, items, created_at, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6::jsonb, $7, $8)
          ON CONFLICT (id) DO UPDATE SET summary = EXCLUDED.summary, updated_at = NOW()
        `, { bind: [rn.id, rn.product_id, rn.version, rn.release_date, rn.summary, items, rn.created_at, rn.updated_at] });
        releaseCount++;
      } catch (err) {
        console.error(`  Error release note ${rn.id}: ${err.message}`);
      }
    }
    console.log(`  Imported ${releaseCount} release notes.\n`);

    console.log("Migration completed successfully!");

  } catch (error) {
    console.error("Migration failed:", error.message);
    process.exit(1);
  } finally {
    await sequelize.close();
  }
}

migrate();
