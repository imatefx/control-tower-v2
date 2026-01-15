"use strict";

/**
 * E2E Test Script for Control Tower Backend API
 *
 * Usage: node tests/e2e.test.js [--base-url=http://localhost:3000]
 *
 * Tests all major API endpoints including:
 * - Authentication
 * - Users CRUD
 * - Products CRUD
 * - Clients CRUD
 * - Deployments CRUD
 * - Release Notes CRUD
 * - Dashboard metrics
 */

const http = require("http");
const https = require("https");

// Configuration
const BASE_URL = process.argv.find(arg => arg.startsWith("--base-url="))?.split("=")[1] || "http://localhost:3000";
const ADMIN_EMAIL = process.env.TEST_ADMIN_EMAIL || "admin@example.com";
const ADMIN_PASSWORD = process.env.TEST_ADMIN_PASSWORD || "admin123";

// Test state
let authToken = null;
let testProductId = null;
let testClientId = null;
let testDeploymentId = null;
let testUserId = null;
let testReleaseNoteId = null;

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
  dim: "\x1b[2m",
};

// Test results tracking
const results = {
  passed: 0,
  failed: 0,
  skipped: 0,
  tests: [],
};

// Helper function to make HTTP requests
function request(method, path, data = null, customHeaders = {}) {
  return new Promise((resolve, reject) => {
    const url = new URL(path, BASE_URL);
    const isHttps = url.protocol === "https:";
    const client = isHttps ? https : http;

    const headers = {
      "Content-Type": "application/json",
      ...customHeaders,
    };

    if (authToken) {
      headers["Authorization"] = `Bearer ${authToken}`;
    }

    const options = {
      hostname: url.hostname,
      port: url.port || (isHttps ? 443 : 80),
      path: url.pathname + url.search,
      method,
      headers,
    };

    const req = client.request(options, (res) => {
      let body = "";
      res.on("data", (chunk) => (body += chunk));
      res.on("end", () => {
        try {
          const json = body ? JSON.parse(body) : {};
          resolve({ status: res.statusCode, data: json, headers: res.headers });
        } catch (e) {
          resolve({ status: res.statusCode, data: body, headers: res.headers });
        }
      });
    });

    req.on("error", reject);
    req.setTimeout(10000, () => {
      req.destroy();
      reject(new Error("Request timeout"));
    });

    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

// Test helper functions
async function test(name, fn) {
  const startTime = Date.now();
  try {
    await fn();
    const duration = Date.now() - startTime;
    results.passed++;
    results.tests.push({ name, status: "passed", duration });
    console.log(`  ${colors.green}✓${colors.reset} ${name} ${colors.dim}(${duration}ms)${colors.reset}`);
  } catch (error) {
    const duration = Date.now() - startTime;
    results.failed++;
    results.tests.push({ name, status: "failed", duration, error: error.message });
    console.log(`  ${colors.red}✗${colors.reset} ${name} ${colors.dim}(${duration}ms)${colors.reset}`);
    console.log(`    ${colors.red}Error: ${error.message}${colors.reset}`);
  }
}

function skip(name, reason = "") {
  results.skipped++;
  results.tests.push({ name, status: "skipped", reason });
  console.log(`  ${colors.yellow}○${colors.reset} ${name} ${colors.dim}(skipped${reason ? `: ${reason}` : ""})${colors.reset}`);
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || "Assertion failed");
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected ${expected}, got ${actual}`);
  }
}

function assertIncludes(array, value, message) {
  if (!array.includes(value)) {
    throw new Error(message || `Expected array to include ${value}`);
  }
}

// Test suites
async function testAuth() {
  console.log(`\n${colors.cyan}Authentication Tests${colors.reset}`);

  await test("Login with valid credentials", async () => {
    const res = await request("POST", "/auth/login", {
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    });
    assert(res.status === 200, `Expected status 200, got ${res.status}`);
    assert(res.data.token, "Expected token in response");
    authToken = res.data.token;
  });

  await test("Login with invalid credentials", async () => {
    const res = await request("POST", "/auth/login", {
      email: "invalid@example.com",
      password: "wrongpassword",
    });
    assert(res.status === 401 || res.status === 400, `Expected 401 or 400, got ${res.status}`);
  });

  await test("Verify valid token", async () => {
    const res = await request("POST", "/auth/verify", { token: authToken });
    assert(res.status === 200, `Expected status 200, got ${res.status}`);
  });

  await test("Access protected route without token", async () => {
    const savedToken = authToken;
    authToken = null;
    const res = await request("GET", "/api/products");
    authToken = savedToken;
    assert(res.status === 401, `Expected status 401, got ${res.status}`);
  });
}

async function testProducts() {
  console.log(`\n${colors.cyan}Products Tests${colors.reset}`);

  await test("Create product", async () => {
    const res = await request("POST", "/api/products", {
      name: "E2E Test Product",
      description: "Created by E2E test script",
      productOwner: "Test Owner",
      engineeringOwner: "Test Engineer",
      deliveryLead: "Test Lead",
    });
    assert(res.status === 200 || res.status === 201, `Expected 200/201, got ${res.status}`);
    assert(res.data.id, "Expected product ID in response");
    testProductId = res.data.id;
  });

  await test("List products", async () => {
    const res = await request("GET", "/api/products");
    assert(res.status === 200, `Expected status 200, got ${res.status}`);
    assert(Array.isArray(res.data.rows), "Expected rows array in response");
  });

  await test("Get product by ID", async () => {
    if (!testProductId) {
      throw new Error("No test product ID available");
    }
    const res = await request("GET", `/api/products/${testProductId}`);
    assert(res.status === 200, `Expected status 200, got ${res.status}`);
    assertEqual(res.data.id, testProductId, "Product ID mismatch");
  });

  await test("Update product", async () => {
    if (!testProductId) {
      throw new Error("No test product ID available");
    }
    const res = await request("PUT", `/api/products/${testProductId}`, {
      name: "E2E Test Product Updated",
      description: "Updated by E2E test script",
    });
    assert(res.status === 200, `Expected status 200, got ${res.status}`);
  });

  await test("Get product with updated name", async () => {
    if (!testProductId) {
      throw new Error("No test product ID available");
    }
    const res = await request("GET", `/api/products/${testProductId}`);
    assert(res.status === 200, `Expected status 200, got ${res.status}`);
    assertEqual(res.data.name, "E2E Test Product Updated", "Product name not updated");
  });
}

async function testClients() {
  console.log(`\n${colors.cyan}Clients Tests${colors.reset}`);

  await test("Create client", async () => {
    const res = await request("POST", "/api/clients", {
      name: "E2E Test Client",
      contactEmail: "test-client@example.com",
      tier: "enterprise",
      region: "US",
    });
    assert(res.status === 200 || res.status === 201, `Expected 200/201, got ${res.status}`);
    assert(res.data.id, "Expected client ID in response");
    testClientId = res.data.id;
  });

  await test("List clients", async () => {
    const res = await request("GET", "/api/clients");
    assert(res.status === 200, `Expected status 200, got ${res.status}`);
    assert(Array.isArray(res.data.rows), "Expected rows array in response");
  });

  await test("Get client by ID", async () => {
    if (!testClientId) {
      throw new Error("No test client ID available");
    }
    const res = await request("GET", `/api/clients/${testClientId}`);
    assert(res.status === 200, `Expected status 200, got ${res.status}`);
    assertEqual(res.data.id, testClientId, "Client ID mismatch");
  });

  await test("Update client", async () => {
    if (!testClientId) {
      throw new Error("No test client ID available");
    }
    const res = await request("PUT", `/api/clients/${testClientId}`, {
      name: "E2E Test Client Updated",
    });
    assert(res.status === 200, `Expected status 200, got ${res.status}`);
  });
}

async function testDeployments() {
  console.log(`\n${colors.cyan}Deployments Tests${colors.reset}`);

  if (!testProductId || !testClientId) {
    skip("Create deployment", "Requires product and client IDs");
    skip("List deployments", "Requires deployment to be created");
    skip("Get deployment by ID", "Requires deployment ID");
    skip("Update deployment status", "Requires deployment ID");
    return;
  }

  await test("Create deployment", async () => {
    const res = await request("POST", "/api/deployments", {
      productId: testProductId,
      clientId: testClientId,
      deploymentType: "ga",
      environment: "production",
      status: "Not Started",
      featureName: "E2E Test Feature",
      nextDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    });
    assert(res.status === 200 || res.status === 201, `Expected 200/201, got ${res.status}: ${JSON.stringify(res.data)}`);
    assert(res.data.id, "Expected deployment ID in response");
    testDeploymentId = res.data.id;
  });

  await test("List deployments", async () => {
    const res = await request("GET", "/api/deployments");
    assert(res.status === 200, `Expected status 200, got ${res.status}`);
    assert(Array.isArray(res.data.rows), "Expected rows array in response");
  });

  await test("Get deployment by ID", async () => {
    if (!testDeploymentId) {
      throw new Error("No test deployment ID available");
    }
    const res = await request("GET", `/api/deployments/${testDeploymentId}`);
    assert(res.status === 200, `Expected status 200, got ${res.status}`);
    assertEqual(res.data.id, testDeploymentId, "Deployment ID mismatch");
  });

  await test("Update deployment status to In Progress", async () => {
    if (!testDeploymentId) {
      throw new Error("No test deployment ID available");
    }
    const res = await request("PUT", `/api/deployments/${testDeploymentId}/status`, {
      status: "In Progress",
    });
    assert(res.status === 200, `Expected status 200, got ${res.status}`);
  });

  await test("Verify deployment status updated", async () => {
    if (!testDeploymentId) {
      throw new Error("No test deployment ID available");
    }
    const res = await request("GET", `/api/deployments/${testDeploymentId}`);
    assert(res.status === 200, `Expected status 200, got ${res.status}`);
    assertEqual(res.data.status, "In Progress", "Status not updated correctly");
  });

  await test("Update deployment to Blocked", async () => {
    if (!testDeploymentId) {
      throw new Error("No test deployment ID available");
    }
    const res = await request("PUT", `/api/deployments/${testDeploymentId}/status`, {
      status: "Blocked",
    });
    assert(res.status === 200, `Expected status 200, got ${res.status}`);
  });

  await test("Add blocked comment", async () => {
    if (!testDeploymentId) {
      throw new Error("No test deployment ID available");
    }
    const res = await request("POST", `/api/deployments/${testDeploymentId}/comment`, {
      text: "Blocked due to E2E test",
      author: "E2E Test Script",
    });
    assert(res.status === 200, `Expected status 200, got ${res.status}`);
  });
}

async function testUsers() {
  console.log(`\n${colors.cyan}Users Tests${colors.reset}`);

  await test("Create user", async () => {
    const timestamp = Date.now();
    const res = await request("POST", "/api/users", {
      name: "E2E Test User",
      email: `e2e-test-${timestamp}@example.com`,
      password: "testpassword123",
      role: "user",
    });
    assert(res.status === 200 || res.status === 201, `Expected 200/201, got ${res.status}: ${JSON.stringify(res.data)}`);
    assert(res.data.id, "Expected user ID in response");
    testUserId = res.data.id;
  });

  await test("List users", async () => {
    const res = await request("GET", "/api/users");
    assert(res.status === 200, `Expected status 200, got ${res.status}`);
    assert(Array.isArray(res.data.rows), "Expected rows array in response");
  });

  await test("Get user by ID", async () => {
    if (!testUserId) {
      throw new Error("No test user ID available");
    }
    const res = await request("GET", `/api/users/${testUserId}`);
    assert(res.status === 200, `Expected status 200, got ${res.status}`);
    assertEqual(res.data.id, testUserId, "User ID mismatch");
  });

  await test("Update user role", async () => {
    if (!testUserId) {
      throw new Error("No test user ID available");
    }
    const res = await request("PUT", `/api/users/${testUserId}`, {
      role: "delivery_lead",
    });
    assert(res.status === 200, `Expected status 200, got ${res.status}`);
  });

  await test("Verify user role updated", async () => {
    if (!testUserId) {
      throw new Error("No test user ID available");
    }
    const res = await request("GET", `/api/users/${testUserId}`);
    assert(res.status === 200, `Expected status 200, got ${res.status}`);
    assertEqual(res.data.role, "delivery_lead", "User role not updated");
  });
}

async function testReleaseNotes() {
  console.log(`\n${colors.cyan}Release Notes Tests${colors.reset}`);

  if (!testProductId) {
    skip("Create release note", "Requires product ID");
    skip("List release notes", "Requires release note to be created");
    skip("Get release note by ID", "Requires release note ID");
    return;
  }

  await test("Create release note", async () => {
    const res = await request("POST", "/api/release-notes", {
      productId: testProductId,
      version: "1.0.0-e2e-test",
      releaseDate: new Date().toISOString().split("T")[0],
      summary: "E2E Test Release",
      items: [
        { type: "feature", title: "E2E Test Feature", description: "Added by E2E test" },
        { type: "bugfix", title: "E2E Test Bugfix", description: "Fixed by E2E test" },
      ],
    });
    assert(res.status === 200 || res.status === 201, `Expected 200/201, got ${res.status}: ${JSON.stringify(res.data)}`);
    assert(res.data.id, "Expected release note ID in response");
    testReleaseNoteId = res.data.id;
  });

  await test("List release notes", async () => {
    const res = await request("GET", "/api/release-notes");
    assert(res.status === 200, `Expected status 200, got ${res.status}`);
    assert(Array.isArray(res.data.rows), "Expected rows array in response");
  });

  await test("Get release note by ID", async () => {
    if (!testReleaseNoteId) {
      throw new Error("No test release note ID available");
    }
    const res = await request("GET", `/api/release-notes/${testReleaseNoteId}`);
    assert(res.status === 200, `Expected status 200, got ${res.status}`);
    assertEqual(res.data.id, testReleaseNoteId, "Release note ID mismatch");
  });

  await test("Update release note", async () => {
    if (!testReleaseNoteId) {
      throw new Error("No test release note ID available");
    }
    const res = await request("PUT", `/api/release-notes/${testReleaseNoteId}`, {
      summary: "E2E Test Release - Updated",
    });
    assert(res.status === 200, `Expected status 200, got ${res.status}`);
  });
}

async function testDashboard() {
  console.log(`\n${colors.cyan}Dashboard/Reports Tests${colors.reset}`);

  await test("Get dashboard metrics", async () => {
    const res = await request("GET", "/api/reports/dashboard");
    assert(res.status === 200, `Expected status 200, got ${res.status}`);
    assert(res.data.data, "Expected data object in response");
    assert(typeof res.data.data.totalProducts === "number", "Expected totalProducts count");
    assert(typeof res.data.data.totalClients === "number", "Expected totalClients count");
    assert(typeof res.data.data.totalDeployments === "number", "Expected totalDeployments count");
  });

  await test("Get deployment report", async () => {
    const res = await request("GET", "/api/reports/deployments");
    assert(res.status === 200, `Expected status 200, got ${res.status}`);
  });

  await test("Get status breakdown", async () => {
    const res = await request("GET", "/api/reports/status-breakdown");
    assert(res.status === 200, `Expected status 200, got ${res.status}`);
  });

  await test("Get upcoming releases", async () => {
    const res = await request("GET", "/api/reports/upcoming-releases");
    assert(res.status === 200, `Expected status 200, got ${res.status}`);
    assert(Array.isArray(res.data), "Expected array in response");
  });
}

async function testChecklists() {
  console.log(`\n${colors.cyan}Checklists Tests${colors.reset}`);

  if (!testDeploymentId) {
    skip("Get checklists by deployment", "Requires deployment ID");
    skip("Get checklist progress", "Requires deployment ID");
    return;
  }

  await test("Get checklists by deployment", async () => {
    const res = await request("GET", `/api/checklists/deployment/${testDeploymentId}`);
    assert(res.status === 200, `Expected status 200, got ${res.status}`);
  });

  await test("Get checklist progress", async () => {
    const res = await request("GET", `/api/checklists/deployment/${testDeploymentId}/progress`);
    assert(res.status === 200, `Expected status 200, got ${res.status}`);
  });
}

async function cleanup() {
  console.log(`\n${colors.cyan}Cleanup${colors.reset}`);

  // Delete test resources in reverse order
  if (testReleaseNoteId) {
    await test("Delete test release note", async () => {
      const res = await request("DELETE", `/api/release-notes/${testReleaseNoteId}`);
      assert(res.status === 200 || res.status === 204, `Expected 200/204, got ${res.status}`);
    });
  }

  if (testDeploymentId) {
    await test("Delete test deployment", async () => {
      const res = await request("DELETE", `/api/deployments/${testDeploymentId}`);
      assert(res.status === 200 || res.status === 204, `Expected 200/204, got ${res.status}`);
    });
  }

  if (testUserId) {
    await test("Delete test user", async () => {
      const res = await request("DELETE", `/api/users/${testUserId}`);
      assert(res.status === 200 || res.status === 204, `Expected 200/204, got ${res.status}`);
    });
  }

  if (testClientId) {
    await test("Delete test client", async () => {
      const res = await request("DELETE", `/api/clients/${testClientId}`);
      assert(res.status === 200 || res.status === 204, `Expected 200/204, got ${res.status}`);
    });
  }

  if (testProductId) {
    await test("Delete test product", async () => {
      const res = await request("DELETE", `/api/products/${testProductId}`);
      assert(res.status === 200 || res.status === 204, `Expected 200/204, got ${res.status}`);
    });
  }
}

// Main execution
async function main() {
  console.log(`\n${colors.blue}╔════════════════════════════════════════════════════════╗${colors.reset}`);
  console.log(`${colors.blue}║${colors.reset}     ${colors.cyan}Control Tower Backend E2E Test Suite${colors.reset}              ${colors.blue}║${colors.reset}`);
  console.log(`${colors.blue}╚════════════════════════════════════════════════════════╝${colors.reset}`);
  console.log(`\n${colors.dim}Base URL: ${BASE_URL}${colors.reset}`);
  console.log(`${colors.dim}Admin Email: ${ADMIN_EMAIL}${colors.reset}`);

  const startTime = Date.now();

  try {
    // Run test suites
    await testAuth();
    await testProducts();
    await testClients();
    await testDeployments();
    await testUsers();
    await testReleaseNotes();
    await testDashboard();
    await testChecklists();

    // Cleanup test data
    await cleanup();
  } catch (error) {
    console.error(`\n${colors.red}Fatal error: ${error.message}${colors.reset}`);
    console.error(error.stack);
  }

  const duration = Date.now() - startTime;

  // Print summary
  console.log(`\n${colors.blue}════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}Test Summary${colors.reset}`);
  console.log(`${colors.blue}════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`  ${colors.green}Passed:${colors.reset}  ${results.passed}`);
  console.log(`  ${colors.red}Failed:${colors.reset}  ${results.failed}`);
  console.log(`  ${colors.yellow}Skipped:${colors.reset} ${results.skipped}`);
  console.log(`  ${colors.dim}Total:${colors.reset}   ${results.passed + results.failed + results.skipped}`);
  console.log(`  ${colors.dim}Duration:${colors.reset} ${(duration / 1000).toFixed(2)}s`);

  // Print failed tests
  const failedTests = results.tests.filter(t => t.status === "failed");
  if (failedTests.length > 0) {
    console.log(`\n${colors.red}Failed Tests:${colors.reset}`);
    failedTests.forEach(t => {
      console.log(`  ${colors.red}✗${colors.reset} ${t.name}`);
      console.log(`    ${colors.dim}${t.error}${colors.reset}`);
    });
  }

  console.log("");

  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

main();
