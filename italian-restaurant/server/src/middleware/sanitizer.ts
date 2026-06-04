import { Request, Response, NextFunction } from "express";

const HTML_ESCAPE_MAP: Record<string, string> = {
  "&": "&amp;",
  "<": "&lt;",
  ">": "&gt;",
  '"': "&quot;",
  "'": "&#x27;",
  "/": "&#x2F;",
  "`": "&#96;",
};

const XSS_PATTERNS = [
  /<script\b[^>]*>[\s\S]*?<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,
  /data:text\/html/gi,
  /vbscript:/gi,
  /expression\s*\(/gi,
  /<iframe\b[^>]*>/gi,
  /<object\b[^>]*>/gi,
  /<embed\b[^>]*>/gi,
  /<link\b[^>]*>/gi,
  /<meta\b[^>]*>/gi,
  /<base\b[^>]*>/gi,
  /<form\b[^>]*>/gi,
  /<svg\b[^>]*onload/gi,
  /<img\b[^>]*onerror/gi,
  /<body\b[^>]*onload/gi,
];

const SQL_INJECTION_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE|UNION|DECLARE|TRUNCATE)\b)/gi,
  /(--|;|\/\*|\*\/|xp_|sp_)/gi,
  /(\b(OR|AND)\b\s+\d+\s*=\s*\d+)/gi,
  /('\s*(OR|AND)\s+')/gi,
  /(\bWAITFOR\b\s+\bDELAY\b)/gi,
  /(\bBENCHMARK\s*\()/gi,
  /(\bSLEEP\s*\()/gi,
  /(\bLOAD_FILE\s*\()/gi,
  /(\bINTO\s+(OUTFILE|DUMPFILE)\b)/gi,
];

function escapeHTML(str: string): string {
  return str.replace(/[&<>"'`/]/g, (char) => HTML_ESCAPE_MAP[char] || char);
}

export function sanitizeString(input: unknown): unknown {
  if (typeof input !== "string") {
    return input;
  }

  let sanitized = input;

  for (const pattern of XSS_PATTERNS) {
    sanitized = sanitized.replace(pattern, "");
  }

  for (const pattern of SQL_INJECTION_PATTERNS) {
    sanitized = sanitized.replace(pattern, "");
  }

  sanitized = sanitized
    .replace(/\x00/g, "")
    .replace(/\x08/g, "")
    .replace(/\x0B/g, "")
    .replace(/\x0C/g, "")
    .replace(/\x0E/g, "")
    .replace(/\x1F/g, "");

  return sanitized;
}

export function sanitizeObject<T extends Record<string, any>>(obj: T): T {
  if (!obj || typeof obj !== "object") {
    return obj;
  }

  const sanitized = { ...obj } as any;

  for (const key of Object.keys(sanitized)) {
    const value = sanitized[key];

    if (typeof value === "string") {
      sanitized[key] = sanitizeString(value);
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map((item) => {
        if (typeof item === "string") {
          return sanitizeString(item);
        }
        if (item && typeof item === "object") {
          return sanitizeObject(item);
        }
        return item;
      });
    } else if (value && typeof value === "object") {
      sanitized[key] = sanitizeObject(value);
    }
  }

  return sanitized;
}

export function sanitizeHTML(html: string): string {
  let cleaned = html;

  cleaned = cleaned.replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, "");
  cleaned = cleaned.replace(/<iframe\b[^>]*>[\s\S]*?<\/iframe>/gi, "");
  cleaned = cleaned.replace(/<object\b[^>]*>[\s\S]*?<\/object>/gi, "");
  cleaned = cleaned.replace(/<embed\b[^>]*>[\s\S]*?<\/embed>/gi, "");
  cleaned = cleaned.replace(/<form\b[^>]*>[\s\S]*?<\/form>/gi, "");

  cleaned = cleaned.replace(/\bon\w+\s*=\s*(?:"[^"]*"|'[^']*'|`[^`]*`)/gi, "");
  cleaned = cleaned.replace(/javascript\s*:/gi, "");
  cleaned = cleaned.replace(/vbscript\s*:/gi, "");
  cleaned = cleaned.replace(/data\s*:\s*text\/html/gi, "");

  cleaned = cleaned.replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, "");

  const allowedTags = [
    "p", "br", "strong", "em", "u", "i", "b", "ol", "ul", "li",
    "h1", "h2", "h3", "h4", "h5", "h6", "blockquote", "a", "img",
    "table", "thead", "tbody", "tr", "th", "td", "pre", "code",
    "div", "span",
  ];

  const allowedAttributes: Record<string, string[]> = {
    a: ["href", "title", "target"],
    img: ["src", "alt", "title", "width", "height"],
  };

  cleaned = cleaned.replace(/<(\w+)\b([^>]*)>/gi, (match, tag, attrs) => {
    const lowerTag = tag.toLowerCase();
    if (!allowedTags.includes(lowerTag)) {
      return "";
    }

    if (!attrs) {
      return `<${tag}>`;
    }

    const tagAllowed = allowedAttributes[lowerTag] || [];
    const sanitizedAttrs = attrs.replace(
      /(\w+)\s*=\s*(?:"([^"]*)"|'([^']*)')/gi,
      (attrMatch: string, attrName: string, doubleVal: string, singleVal: string) => {
        const val = doubleVal || singleVal;
        if (!tagAllowed.includes(attrName.toLowerCase())) {
          return "";
        }
        if (attrName.toLowerCase() === "href" && /^javascript\s*:/i.test(val)) {
          return "";
        }
        return `${attrName}="${escapeHTML(val)}"`;
      }
    );

    return `<${tag}${sanitizedAttrs}>`;
  });

  cleaned = cleaned.replace(/<\/(\w+)>/gi, (match, tag) => {
    if (!allowedTags.includes(tag.toLowerCase())) {
      return "";
    }
    return match;
  });

  return cleaned;
}

export function sanitizerMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  if (req.body && typeof req.body === "object") {
    req.body = sanitizeObject(req.body);
  }

  if (req.query && typeof req.query === "object") {
    req.query = sanitizeObject(req.query as Record<string, any>);
  }

  if (req.params && typeof req.params === "object") {
    req.params = sanitizeObject(req.params as Record<string, any>);
  }

  next();
}
