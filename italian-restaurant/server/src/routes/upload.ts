import { Router, Response, NextFunction } from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { AuthRequest, requireAuth, requireRole } from "../middleware/auth";

const router = Router();

const uploadsDir = path.resolve("uploads");

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedMimes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Only image files are allowed (JPEG, PNG, GIF, WEBP)"));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
});

router.post(
  "/",
  requireAuth,
  requireRole("admin"),
  (req: AuthRequest, res: Response) => {
    upload.single("image")(req, res, (err: any) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          res.status(400).json({
            success: false,
            error: "File size must be less than 5MB",
          });
          return;
        }
        res.status(400).json({
          success: false,
          error: err.message,
        });
        return;
      }

      if (err) {
        res.status(400).json({
          success: false,
          error: err.message,
        });
        return;
      }

      if (!req.file) {
        res.status(400).json({
          success: false,
          error: "No file uploaded",
        });
        return;
      }

      const fileUrl = `/uploads/${req.file.filename}`;

      res.status(201).json({
        success: true,
        data: {
          url: fileUrl,
          filename: req.file.filename,
          originalName: req.file.originalname,
          size: req.file.size,
          mimetype: req.file.mimetype,
        },
      });
    });
  }
);

router.post(
  "/multiple",
  requireAuth,
  requireRole("admin"),
  (req: AuthRequest, res: Response) => {
    upload.array("images", 10)(req, res, (err: any) => {
      if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
          res.status(400).json({
            success: false,
            error: "File size must be less than 5MB",
          });
          return;
        }
        res.status(400).json({
          success: false,
          error: err.message,
        });
        return;
      }

      if (err) {
        res.status(400).json({
          success: false,
          error: err.message,
        });
        return;
      }

      if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        res.status(400).json({
          success: false,
          error: "No files uploaded",
        });
        return;
      }

      const uploadedFiles = req.files.map((file) => ({
        url: `/uploads/${file.filename}`,
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
      }));

      res.status(201).json({
        success: true,
        data: { files: uploadedFiles },
      });
    });
  }
);

router.delete(
  "/:filename",
  requireAuth,
  requireRole("admin"),
  (req: AuthRequest, res: Response) => {
    try {
      const { filename } = req.params;

      // Prevent path traversal
      const resolved = path.resolve(uploadsDir, filename);
      if (!resolved.startsWith(uploadsDir)) {
        res.status(400).json({
          success: false,
          error: "Invalid filename",
        });
        return;
      }

      const filePath = resolved;

      if (!fs.existsSync(filePath)) {
        res.status(404).json({
          success: false,
          error: "File not found",
        });
        return;
      }

      fs.unlinkSync(filePath);

      res.json({
        success: true,
        data: { message: "File deleted" },
      });
    } catch (error) {
      console.error("Delete file error:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete file",
      });
    }
  }
);

export default router;
