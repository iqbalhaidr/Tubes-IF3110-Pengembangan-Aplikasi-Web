import http from "k6/http";
import { check, sleep } from "k6";

const config = JSON.parse(open("./k6-config.json"));

export const options = {
  scenarios: {
    getAllProducts: {
      executor: "ramping-vus",
      exec: "testGetAllProducts",
      stages: config.loadTest.stages,
      tags: { scenario: "getAllProducts" },
    },
    getProductsWithRange: {
      executor: "ramping-vus",
      exec: "testGetProductsWithRange",
      stages: config.loadTest.stages,
      tags: { scenario: "getProductsWithRange" },
    },
    getProductsWithFilter: {
      executor: "ramping-vus",
      exec: "testGetProductsWithFilter",
      stages: config.loadTest.stages,
      tags: { scenario: "getProductsWithFilter" },
    },
    getProductsWithSearch: {
      executor: "ramping-vus",
      exec: "testGetProductsWithSearch",
      stages: config.loadTest.stages,
      tags: { scenario: "getProductsWithSearch" },
    },
    getProductReviews: {
      executor: "ramping-vus",
      exec: "testGetProductReviews",
      stages: config.loadTest.stages,
      tags: { scenario: "getProductReviews" },
    },
  },
  thresholds: config.loadTest.thresholds,
};

function buildUrl(path, params = {}, values = {}) {
  let url = config.baseUrl + path;
  const queryParams = [];

  for (const [key, paramName] of Object.entries(params)) {
    if (values[key] !== undefined && values[key] !== null) {
      queryParams.push(`${paramName}=${encodeURIComponent(values[key])}`);
    }
  }

  if (queryParams.length > 0) {
    url += "?" + queryParams.join("&");
  }

  return url;
}

function validateResponse(response, testName) {
  if (response.status !== 200) {
    console.error(`${testName}: Status ${response.status}`);
    return false;
  }

  if (!response.body || response.body.length === 0) {
    console.error(`${testName}: Empty response`);
    return false;
  }

  try {
    const data = JSON.parse(response.body);

    // Check if it has data in different possible formats
    let hasData = false;
    
    // Format 1: { data: [...] } - Direct array
    if (data.data && Array.isArray(data.data)) {
      hasData = true;
    }
    // Format 2: { data: { products: [...] } } - Nested array (PHP API)
    else if (data.data && data.data.products && Array.isArray(data.data.products)) {
      hasData = true;
    }
    // Format 3: Array response directly
    else if (Array.isArray(data)) {
      hasData = true;
    }
    // Format 4: { success: true } with other fields
    else if (data.success === true) {
      hasData = true;
    }

    if (!hasData) {
      console.error(`${testName}: No recognizable data in response. Status: ${response.status}. Got: ${JSON.stringify(data).substring(0, 150)}`);
      return false;
    }

    return true;
  } catch (e) {
    console.error(`${testName}: JSON parse error - ${e.message}`);
    console.error(`Response: ${response.body.substring(0, 200)}`);
    return false;
  }
}

export function testGetAllProducts() {
  const endpoint = config.endpoints.getAllProducts;
  const url = buildUrl(endpoint.path);

  const response = http.get(url);
  const success = validateResponse(response, "getAllProducts");

  check(response, {
    "getAllProducts: status 200": (r) => r.status === 200,
  });

  sleep(1);
}

export function testGetProductsWithRange() {
  const endpoint = config.endpoints.getProductsWithRange;
  const url = buildUrl(endpoint.path, endpoint.params, endpoint.testValues);

  const response = http.get(url);
  const success = validateResponse(response, "getProductsWithRange");

  check(response, {
    "getProductsWithRange: status 200": (r) => r.status === 200,
  });

  sleep(1);
}

export function testGetProductsWithFilter() {
  const endpoint = config.endpoints.getProductsWithFilter;
  const url = buildUrl(endpoint.path, endpoint.params, endpoint.testValues);

  const response = http.get(url);
  const success = validateResponse(response, "getProductsWithFilter");

  check(response, {
    "getProductsWithFilter: status 200": (r) => r.status === 200,
  });

  sleep(1);
}

export function testGetProductsWithSearch() {
  const endpoint = config.endpoints.getProductsWithSearch;
  const url = buildUrl(endpoint.path, endpoint.params, endpoint.testValues);

  const response = http.get(url);
  const success = validateResponse(response, "getProductsWithSearch");

  check(response, {
    "getProductsWithSearch: status 200": (r) => r.status === 200,
  });

  sleep(1);
}

export function testGetProductReviews() {
  const endpoint = config.endpoints.getProductReviews;
  const url = buildUrl(endpoint.path);

  const response = http.get(url);
  const success = validateResponse(response, "getProductReviews");

  check(response, {
    "getProductReviews: status 200": (r) => r.status === 200,
  });

  sleep(1);
}

export function setup() {
  console.log("Starting K6 Load Test");
  console.log(`Base URL: ${config.baseUrl}`);

  const testUrl = buildUrl(config.endpoints.getAllProducts.path);
  const testResponse = http.get(testUrl);

  if (testResponse.status !== 200) {
    console.error(`Warning: Endpoint returned status ${testResponse.status}`);
  } else {
    console.log("Endpoint check passed");
  }
}

export function teardown(data) {
  console.log("Load test completed");
}
