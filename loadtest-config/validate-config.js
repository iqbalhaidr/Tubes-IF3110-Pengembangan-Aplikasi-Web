const fs = require("fs");
const path = require("path");

function validateConfig() {
  console.log("Validating k6-config.json...");

  let hasErrors = false;
  let hasWarnings = false;

  const configPath = path.join(__dirname, "k6-config.json");
  if (!fs.existsSync(configPath)) {
    console.error("ERROR: k6-config.json not found!");
    console.error("Please copy k6-config.example.json to k6-config.json and configure it.\n");
    process.exit(1);
  }

  let config;
  try {
    const configContent = fs.readFileSync(configPath, "utf8");
    config = JSON.parse(configContent);
  } catch (error) {
    console.error("ERROR: Failed to parse config file");
    console.error(`   ${error.message}\n`);
    process.exit(1);
  }

  if (!config.baseUrl) {
    console.error("ERROR: baseUrl is required");
    hasErrors = true;
  } else {
    try {
      new URL(config.baseUrl);
    } catch (error) {
      console.error(`ERROR: Invalid URL format: ${config.baseUrl}`);
      hasErrors = true;
    }
  }

  const requiredEndpoints = [
    "getAllProducts",
    "getProductsWithRange",
    "getProductsWithFilter",
    "getProductsWithSearch",
  ];

  for (const endpointName of requiredEndpoints) {
    const endpoint = config.endpoints?.[endpointName];
    if (!endpoint) {
      console.error(`ERROR: Missing endpoint: ${endpointName}`);
      hasErrors = true;
      continue;
    }

    if (!endpoint.path) {
      console.error(`ERROR: ${endpointName} is missing 'path'`);
      hasErrors = true;
    }

    if (!endpoint.method) {
      console.error(`ERROR: ${endpointName} is missing 'method'`);
      hasErrors = true;
    }

    if (endpoint.params && Object.keys(endpoint.params).length > 0) {
      if (!endpoint.testValues || Object.keys(endpoint.testValues).length === 0) {
        console.warn(`WARNING: ${endpointName} has params but no testValues`);
        hasWarnings = true;
      }
    }
  }

  if (!config.database) {
    console.error("ERROR: database configuration is missing");
    hasErrors = true;
  } else {
    const requiredDbFields = ["type", "host", "port", "name", "user", "password"];
    for (const field of requiredDbFields) {
      if (!config.database[field]) {
        console.error(`ERROR: database.${field} is required`);
        hasErrors = true;
      }
    }

    if (!["mysql", "mariadb", "postgresql"].includes(config.database.type)) {
      console.error(`ERROR: Unsupported database type: ${config.database.type}`);
      console.error("Supported types: mysql, mariadb, postgresql");
      hasErrors = true;
    }

    if (config.seeding?.enabled) {
      if (!config.database.schema) {
        console.error("ERROR: database.schema is required when seeding is enabled");
        hasErrors = true;
      } else {
        const requiredTables = ["user", "store", "product", "category", "categoryItem"];
        if (!config.database.schema.tables) {
          console.error("ERROR: database.schema.tables is required");
          hasErrors = true;
        } else {
          for (const table of requiredTables) {
            if (!config.database.schema.tables[table]) {
              console.error(`ERROR: database.schema.tables.${table} is required`);
              hasErrors = true;
            }
          }
        }

        if (!config.database.schema.columns) {
          console.error("ERROR: database.schema.columns is required");
          hasErrors = true;
        } else {
          const requiredColumnSets = {
            user: ["id", "email", "password", "role", "name", "address", "balance", "createdAt", "updatedAt"],
            store: ["id", "userId", "name", "description", "logoPath", "balance", "createdAt", "updatedAt"],
            product: ["id", "storeId", "name", "description", "price", "stock", "imagePath", "createdAt", "updatedAt"],
            category: ["id", "name"],
            categoryItem: ["categoryId", "productId"],
          };

          for (const [tableName, requiredCols] of Object.entries(requiredColumnSets)) {
            if (!config.database.schema.columns[tableName]) {
              console.error(`ERROR: database.schema.columns.${tableName} is required`);
              hasErrors = true;
            } else {
              for (const col of requiredCols) {
                if (!config.database.schema.columns[tableName][col]) {
                  console.error(`ERROR: database.schema.columns.${tableName}.${col} is required`);
                  hasErrors = true;
                }
              }
            }
          }
        }
      }
    }
  }

  if (config.seeding?.enabled) {
    if (config.seeding.productsCount < 20) {
      console.warn(`WARNING: productsCount (${config.seeding.productsCount}) is low`);
      console.warn("Recommended: at least 20 products for meaningful load testing");
      hasWarnings = true;
    }
  } else {
    console.warn("WARNING: Seeding is disabled");
    console.warn("Make sure your database has enough test data");
    hasWarnings = true;
  }

  if (!config.loadTest?.stages || config.loadTest.stages.length === 0) {
    console.error("ERROR: loadTest.stages is required");
    hasErrors = true;
  } else {
    const maxVUs = Math.max(...config.loadTest.stages.map((s) => s.target));
    if (maxVUs > 200) {
      console.warn("WARNING: High VU count may overwhelm your system");
      hasWarnings = true;
    }
  }

  if (!config.loadTest?.thresholds) {
    console.warn("WARNING: No thresholds defined");
    hasWarnings = true;
  }

  if (!config.validation) {
    console.warn("WARNING: No validation rules defined");
    hasWarnings = true;
  }

  if (hasErrors) {
    console.error("VALIDATION FAILED - Please fix the errors above\n");
    process.exit(1);
  } else if (hasWarnings) {
    console.warn("VALIDATION PASSED WITH WARNINGS\n");
  } else {
    console.log("VALIDATION PASSED - Configuration looks good!\n");
  }
}

if (require.main === module) {
  validateConfig();
}

module.exports = { validateConfig };
