// Console color utilities — ANSI escape codes, no dependencies

const enabled = !process.env.NO_COLOR && process.stdout.isTTY;

const c = {
  reset:   enabled ? "\x1b[0m" : "",
  bold:    enabled ? "\x1b[1m" : "",
  dim:     enabled ? "\x1b[2m" : "",
  red:     enabled ? "\x1b[31m" : "",
  green:   enabled ? "\x1b[32m" : "",
  yellow:  enabled ? "\x1b[33m" : "",
  blue:    enabled ? "\x1b[34m" : "",
  magenta: enabled ? "\x1b[35m" : "",
  cyan:    enabled ? "\x1b[36m" : "",
  white:   enabled ? "\x1b[37m" : "",
};

module.exports = c;
