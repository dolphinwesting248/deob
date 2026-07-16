// Scenario D: Webpack Module Bundle
// Original code (3 modules: utils, api, app)

// Module: utils
function formatDate(date) {
  return date.toISOString().split("T")[0];
}
function sanitize(input) {
  return input.replace(/[<>&"']/g, function(char) {
    return { "<": "&lt;", ">": "&gt;", "&": "&amp;", "\"": "&quot;", "'": "&#39;" }[char];
  });
}
function debounce(fn, delay) {
  var timer;
  return function() {
    var args = arguments;
    var ctx = this;
    clearTimeout(timer);
    timer = setTimeout(function() { fn.apply(ctx, args); }, delay);
  };
}

// Module: api
var BASE_URL = "https://api.example.com";
function fetchEvents(startDate, endDate) {
  var url = BASE_URL + "/events?start=" + formatDate(startDate) + "&end=" + formatDate(endDate);
  return fetch(url).then(function(r) { return r.json(); });
}
function renderEvent(event) {
  return "<div class='event'><h3>" + sanitize(event.title) + "</h3><p>" + event.description + "</p></div>";
}

// Module: app
var loadEvents = debounce(function() {
  fetchEvents(new Date(), new Date(Date.now() + 86400000)).then(function(events) {
    events.forEach(function(e) {
      document.getElementById("event-list").innerHTML += renderEvent(e);
    });
  });
}, 300);

document.getElementById("load-btn").addEventListener("click", loadEvents);
