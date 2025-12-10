import express, { Request, Response } from "express";
import { authenticateToken } from "../middleware/auth";
import { pool } from "../db";
import multer from "multer";
import fs from "fs";
import path from "path";

const router = express.Router();

interface AuthenticatedRequest extends Request {
  userId?: number;
}

const FILES_DIR = process.env.FILES_DIR || "./uploads";

/* ============================================
   🔧 Configure multer (store file in memory first)
=============================================== */
const upload = multer({ storage: multer.memoryStorage() });

/* ============================================
   📄 GET all cover letters for user
=============================================== */
router.get("/", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const result = await pool.query(
      `SELECT id, name, file_path, created_at
       FROM cover_letters
       WHERE user_id = $1
       ORDER BY created_at DESC`,
      [req.userId]
    );

    res.json({
      count: result.rowCount,
      cover_letters: result.rows
    });
  } catch (err) {
    console.error("Error fetching cover letters:", err);
    res.status(500).json({ error: "Database query failed" });
  }
});

/* ============================================
   📤 Upload a new cover letter
=============================================== */
router.post(
  "/",
  authenticateToken,
  upload.single("file"), // field name must be "file"
  async (req: AuthenticatedRequest, res: Response) => {
    if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

    const { name } = req.body;
    if (!name) return res.status(400).json({ error: "Cover letter name is required." });

    if (!req.file) return res.status(400).json({ error: "File is required." });

    try {
      // Create user's directory if it doesn't exist
      const userDir = path.join(FILES_DIR, String(req.userId));
      if (!fs.existsSync(userDir)) fs.mkdirSync(userDir, { recursive: true });

      // Determine file extension
      const ext = path.extname(req.file.originalname) || ".pdf";

      // Make a filename based on the alias
      const safeAlias = name.replace(/[^a-zA-Z0-9_\-]/g, "_"); // sanitize
      const fileName = `${safeAlias}${ext}`;
      const filePath = path.join(userDir, fileName);

      // Write file to filesystem
      fs.writeFileSync(filePath, req.file.buffer);

      // Save RELATIVE path in DB
      const relativePath = path.relative(".", filePath);

      const insert = await pool.query(
        `INSERT INTO cover_letters (user_id, name, file_path)
         VALUES ($1, $2, $3)
         RETURNING id, name, file_path, created_at`,
        [req.userId, name, relativePath]
      );

      res.json({
        message: "Cover letter uploaded successfully",
        cover_letter: insert.rows[0]
      });
    } catch (err) {
      console.error("Error uploading cover letter:", err);
      res.status(500).json({ error: "Server error while uploading cover letter" });
    }
  }
);

/* ============================================
   🗑 Delete a cover letter
=============================================== */
router.delete("/:id", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

  const { id } = req.params;

  try {
    // First get the record to know file path
    const existing = await pool.query(
      `SELECT file_path FROM cover_letters WHERE id = $1 AND user_id = $2`,
      [id, req.userId]
    );

    if (existing.rowCount === 0)
      return res.status(404).json({ error: "Cover letter not found" });

    const filePath = existing.rows[0].file_path;

    // Delete DB row
    await pool.query(`DELETE FROM cover_letters WHERE id = $1 AND user_id = $2`, [
      id,
      req.userId
    ]);

    // Remove the file from filesystem
    if (filePath && fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    res.json({ message: "Cover letter deleted successfully", id });
  } catch (err) {
    console.error("Error deleting cover letter:", err);
    res.status(500).json({ error: "Server error while deleting cover letter" });
  }
});

export default router;