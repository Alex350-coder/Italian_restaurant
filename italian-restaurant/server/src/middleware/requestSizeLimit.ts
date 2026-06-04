import { Request, Response, NextFunction } from "express";

const DEFAULT_LIMIT = 1 * 1024 * 1024;
const UPLOAD_LIMIT = 10 * 1024 * 1024;

function parseSize(sizeStr: string): number {
  const match = sizeStr.match(/^(\d+)(mb|kb|gb)?$/i);
  if (!match) {
    return DEFAULT_LIMIT;
  }

  const value = parseInt(match[1], 10);
  const unit = (match[2] || "b").toLowerCase();

  switch (unit) {
    case "gb":
      return value * 1024 * 1024 * 1024;
    case "mb":
      return value * 1024 * 1024;
    case "kb":
      return value * 1024;
    default:
      return value;
  }
}

function getBodySize(req: Request): number {
  const contentLength = req.headers["content-length"];
  if (contentLength) {
    return parseInt(contentLength, 10) || 0;
  }
  return 0;
}

function isUploadPath(path: string): boolean {
  return path.includes("/upload") || path.includes("/file");
}

export function requestSizeLimit(
  defaultMaxSize: string = "1mb",
  uploadMaxSize: string = "10mb"
) {
  const defaultLimit = parseSize(defaultMaxSize);
  const uploadLimit = parseSize(uploadMaxSize);

  return (req: Request, res: Response, next: NextFunction): void => {
    if (req.method === "GET" || req.method === "HEAD" || req.method === "OPTIONS") {
      next();
      return;
    }

    const maxSize = isUploadPath(req.path) ? uploadLimit : defaultLimit;
    const bodySize = getBodySize(req);

    if (bodySize > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
      res.status(413).json({
        success: false,
        error: `Payload too large. Maximum size is ${maxSizeMB}MB`,
      });
      return;
    }

    let receivedBytes = 0;

    req.on("data", (chunk: Buffer) => {
      receivedBytes += chunk.length;

      if (receivedBytes > maxSize) {
        const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1);
        res.status(413).json({
          success: false,
          error: `Payload too large. Maximum size is ${maxSizeMB}MB`,
        });
        req.destroy();
      }
    });

    next();
  };
}

export function defaultRequestSizeLimit() {
  return requestSizeLimit("1mb", "10mb");
}
