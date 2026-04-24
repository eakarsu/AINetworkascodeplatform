// Convert snake_case to camelCase
function snakeToCamel(str) {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

// Convert camelCase to snake_case
function camelToSnake(str) {
  return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

function convertKeys(obj, converter) {
  if (Array.isArray(obj)) {
    return obj.map((item) => convertKeys(item, converter));
  }
  if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
    const converted = {};
    for (const key of Object.keys(obj)) {
      converted[converter(key)] = convertKeys(obj[key], converter);
    }
    return converted;
  }
  return obj;
}

// Middleware: convert request body from camelCase to snake_case
function requestCamelToSnake(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    req.body = convertKeys(req.body, camelToSnake);
  }
  next();
}

// Middleware: convert response JSON from snake_case to camelCase
function responseSnakeToCamel(req, res, next) {
  const originalJson = res.json.bind(res);
  res.json = (data) => {
    if (data && typeof data === 'object') {
      data = convertKeys(data, snakeToCamel);
    }
    return originalJson(data);
  };
  next();
}

module.exports = { requestCamelToSnake, responseSnakeToCamel, convertKeys, camelToSnake, snakeToCamel };
