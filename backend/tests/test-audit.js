"use strict";

/**
 * Simple script to test audit log functionality
 * Usage: node tests/test-audit.js
 */

const http = require("http");

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

// Helper to make requests
function request(method, path, data = null, token = null) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const headers = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }

    const options = {
      hostname: url.hostname,
      port: url.port || 80,
      path: url.pathname + url.search,
      method,
      headers,
    };

    const req = http.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(body) });
        } catch (e) {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });

    req.on("error", reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error("Timeout"));
    });

    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function main() {
  console.log("=== Audit Log Test ===\n");
  console.log(`Base URL: ${BASE_URL}\n`);

  // Step 1: Login
  console.log("1. Logging in...");
  const loginRes = await request("POST", "/auth/login", {
    email: "admin@controltower.com",
    password: "admin123"
  });

  if (loginRes.status !== 200) {
    console.error(`   Login failed: ${loginRes.status}`);
    console.error(`   Response: ${JSON.stringify(loginRes.data)}`);
    process.exit(1);
  }

  const token = loginRes.data.token;
  console.log("   Login successful!\n");

  // Step 2: Check current audit logs
  console.log("2. Fetching current audit logs...");
  const auditRes1 = await request("GET", "/api/audit-logs", null, token);

  if (auditRes1.status !== 200) {
    console.error(`   Failed to fetch audit logs: ${auditRes1.status}`);
    console.error(`   Response: ${JSON.stringify(auditRes1.data)}`);
  } else {
    const count1 = auditRes1.data.pagination?.total || 0;
    console.log(`   Current audit log count: ${count1}`);
    if (auditRes1.data.data?.length > 0) {
      console.log(`   Latest log: ${JSON.stringify(auditRes1.data.data[0])}\n`);
    } else {
      console.log("   No audit logs found.\n");
    }
  }

  // Step 3: Create a product (should trigger audit log)
  console.log("3. Creating a test product...");
  const productRes = await request("POST", "/api/products", {
    name: "Audit Test " + Date.now(),
    description: "Testing audit logging"
  }, token);

  if (productRes.status !== 200 && productRes.status !== 201) {
    console.error(`   Failed to create product: ${productRes.status}`);
    console.error(`   Response: ${JSON.stringify(productRes.data)}`);
    process.exit(1);
  }

  const productId = productRes.data.id;
  console.log(`   Product created: ${productId}\n`);

  // Wait for async audit log
  await new Promise(r => setTimeout(r, 1000));

  // Step 4: Check audit logs again
  console.log("4. Checking audit logs after product creation...");
  const auditRes2 = await request("GET", "/api/audit-logs", null, token);

  if (auditRes2.status !== 200) {
    console.error(`   Failed to fetch audit logs: ${auditRes2.status}`);
    console.error(`   Response: ${JSON.stringify(auditRes2.data)}`);
  } else {
    const count2 = auditRes2.data.pagination?.total || 0;
    console.log(`   Audit log count: ${count2}`);

    // Look for our product creation log
    const createLog = auditRes2.data.data?.find(log =>
      log.action === "create" &&
      log.resourceType === "product" &&
      log.resourceId === productId
    );

    if (createLog) {
      console.log(`   ✅ Found audit log for product creation!`);
      console.log(`   Log: ${JSON.stringify(createLog)}\n`);
    } else {
      console.log(`   ❌ No audit log found for product creation`);
      console.log(`   Recent logs: ${JSON.stringify(auditRes2.data.data?.slice(0, 3))}\n`);
    }
  }

  // Step 5: Update the product
  console.log("5. Updating the product...");
  const updateRes = await request("PUT", `/api/products/${productId}`, {
    name: "Audit Test Updated",
    description: "Testing audit logging - updated"
  }, token);

  if (updateRes.status !== 200) {
    console.error(`   Failed to update product: ${updateRes.status}`);
  } else {
    console.log("   Product updated!\n");
  }

  // Wait for async audit log
  await new Promise(r => setTimeout(r, 1000));

  // Step 6: Check for update audit log
  console.log("6. Checking for update audit log...");
  const auditRes3 = await request("GET", "/api/audit-logs", null, token);

  if (auditRes3.status === 200) {
    const updateLog = auditRes3.data.data?.find(log =>
      log.action === "update" &&
      log.resourceType === "product" &&
      log.resourceId === productId
    );

    if (updateLog) {
      console.log(`   ✅ Found audit log for product update!`);
      console.log(`   Changes: ${JSON.stringify(updateLog.changes)}\n`);
    } else {
      console.log(`   ❌ No audit log found for product update\n`);
    }
  }

  // Step 7: Cleanup - delete the product
  console.log("7. Cleaning up...");
  await request("DELETE", `/api/products/${productId}`, null, token);
  console.log("   Test product deleted.\n");

  // Final summary
  console.log("=== Summary ===");
  const auditResFinal = await request("GET", "/api/audit-logs", null, token);
  if (auditResFinal.status === 200) {
    const finalCount = auditResFinal.data.pagination?.total || 0;
    console.log(`Total audit logs: ${finalCount}`);

    // Show recent logs
    console.log("\nRecent audit logs:");
    (auditResFinal.data.data || []).slice(0, 5).forEach((log, i) => {
      console.log(`  ${i + 1}. [${log.action}] ${log.resourceType}: ${log.resourceName} (by ${log.userName || 'Unknown'})`);
    });
  }

  console.log("\nDone!");
}

main().catch(err => {
  console.error("Error:", err.message);
  process.exit(1);
});
