import { Request, Response, NextFunction } from "express";

const COLORS = {
  reset: "\x1b[0m",
  bright: "\x1b[1m",
  dim: "\x1b[2m",
  red: "\x1b[31m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  magenta: "\x1b[35m",
  cyan: "\x1b[36m",
  white: "\x1b[37m",
  gray: "\x1b[90m",
  bgRed: "\x1b[41m",
  bgGreen: "\x1b[42m",
  bgYellow: "\x1b[43m",
  bgBlue: "\x1b[44m",
};

function getStatusColor(status: number): string {
  if (status >= 500) return COLORS.red;
  if (status >= 400) return COLORS.yellow;
  if (status >= 300) return COLORS.cyan;
  if (status >= 200) return COLORS.green;
  return COLORS.white;
}

function getMethodColor(method: string): string {
  switch (method) {
    case "GET": return COLORS.green;
    case "POST": return COLORS.blue;
    case "PUT": return COLORS.yellow;
    case "PATCH": return COLORS.magenta;
    case "DELETE": return COLORS.red;
    default: return COLORS.white;
  }
}

function formatDuration(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(0)}\u00b5s`;
  if (ms < 1000) return `${ms.toFixed(1)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

export function logger(req: Request, res: Response, next: NextFunction): void {
  const start = Date.now();

  const originalEnd = res.end;
  res.end = function (this: Response, ...args: any[]) {
    const duration = Date.now() - start;
    const status = res.statusCode;
    const statusColor = getStatusColor(status);
    const methodColor = getMethodColor(req.method);

    const timestamp = new Date().toISOString();
    const log = [
      `${COLORS.dim}${timestamp}${COLORS.reset}`,
      `${methodColor}${COLORS.bright}${req.method.padEnd(7)}${COLORS.reset}`,
      `${req.originalUrl}`,
      `${statusColor}${COLORS.bright}${status}${COLORS.reset}`,
      `${COLORS.gray}${formatDuration(duration)}${COLORS.reset}`,
    ].join(" ");

    console.log(log);

    return originalEnd.apply(this, args as any);
  } as any;

  next();
}
