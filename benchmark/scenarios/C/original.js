// Scenario C: Data Processing Pipeline
// Original code

function processUserData(rawData) {
  // Parse JSON
  var parsed = JSON.parse(rawData);
  if (!Array.isArray(parsed)) {
    throw new Error("Expected array input");
  }

  // Validate entries
  var valid = parsed.filter(function(item) {
    return item.id && item.name && item.email;
  });

  // Transform entries
  var transformed = valid.map(function(item) {
    return {
      id: item.id,
      displayName: item.name.trim().toLowerCase(),
      email: item.email.toLowerCase(),
      domain: item.email.split("@")[1],
      createdAt: new Date(item.created).toISOString()
    };
  });

  // Group by email domain
  var grouped = {};
  transformed.forEach(function(item) {
    if (!grouped[item.domain]) {
      grouped[item.domain] = [];
    }
    grouped[item.domain].push(item);
  });

  // Sort each group alphabetically
  Object.keys(grouped).forEach(function(domain) {
    grouped[domain].sort(function(a, b) {
      return a.displayName.localeCompare(b.displayName);
    });
  });

  // Generate statistics
  var stats = {
    total: transformed.length,
    validDomains: Object.keys(grouped).length,
    topDomain: Object.entries(grouped)
      .sort(function(a, b) { return b[1].length - a[1].length; })[0][0],
    invalidCount: parsed.length - transformed.length
  };

  return { users: grouped, stats: stats };
}
