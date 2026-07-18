// scheduler.js — Async task scheduler
// Priority queue with Promise-based concurrency control (max 3), timeout (5s), retry (2x).
// Used by fingerprint collectors to run in parallel, and by reporter for retry scheduling.
(function () {
  "use strict";

  var MAX_CONCURRENT = 3;
  var DEFAULT_TIMEOUT = 5000;
  var MAX_RETRIES = 2;

  var pending = [];
  var running = 0;

  function Task(fn, priority, label) {
    this.fn = fn;
    this.priority = priority || 0;
    this.label = label || "task";
    this.retries = 0;
    this.promise = null;
    this.resolve = null;
    this.reject = null;
  }

  function enqueue(fn, options) {
    var opts = options || {};
    var task = new Task(fn, opts.priority || 0, opts.label || "task");
    var promise = new Promise(function (resolve, reject) {
      task.resolve = resolve;
      task.reject = reject;
    });
    task.promise = promise;

    // Insert sorted by priority (higher first)
    var inserted = false;
    for (var i = 0; i < pending.length; i++) {
      if (pending[i].priority < task.priority) {
        pending.splice(i, 0, task);
        inserted = true;
        break;
      }
    }
    if (!inserted) pending.push(task);

    processQueue();
    return promise;
  }

  function processQueue() {
    while (running < MAX_CONCURRENT && pending.length > 0) {
      var task = pending.shift();
      executeTask(task);
    }
  }

  function executeTask(task) {
    running++;
    var timedOut = false;
    var timer = setTimeout(function () {
      timedOut = true;
      task.reject(new Error("Task timeout: " + task.label));
      running--;
      processQueue();
    }, DEFAULT_TIMEOUT);

    try {
      var result = task.fn();
      // Handle both sync and Promise returns
      if (result && typeof result.then === "function") {
        result.then(
          function (value) {
            if (!timedOut) {
              clearTimeout(timer);
              task.resolve(value);
              running--;
              processQueue();
            }
          },
          function (err) {
            if (!timedOut) {
              clearTimeout(timer);
              handleRetry(task, err);
            }
          }
        );
      } else {
        clearTimeout(timer);
        if (!timedOut) {
          task.resolve(result);
          running--;
          processQueue();
        }
      }
    } catch (e) {
      clearTimeout(timer);
      if (!timedOut) {
        handleRetry(task, e);
      }
    }
  }

  function handleRetry(task, error) {
    if (task.retries < MAX_RETRIES) {
      task.retries++;
      // Re-queue with lower priority
      task.priority = Math.max(0, task.priority - 1);
      pending.push(task);
      running--;
      processQueue();
    } else {
      task.reject(error);
      running--;
      processQueue();
    }
  }

  function getQueueStats() {
    return {
      pending: pending.length,
      running: running,
      maxConcurrent: MAX_CONCURRENT
    };
  }

  function cancelAll() {
    for (var i = 0; i < pending.length; i++) {
      pending[i].reject(new Error("Cancelled"));
    }
    pending = [];
  }

  globalThis.__SCHEDULER__ = {
    enqueue: enqueue,
    getStats: getQueueStats,
    cancelAll: cancelAll
  };
})();
