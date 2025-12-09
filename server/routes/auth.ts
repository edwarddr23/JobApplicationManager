import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../db';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'defaultsecret';

// ------------------ Login ------------------
router.post('/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const user = await getUserByUsername(username);
    if (!user) return res.status(401).json({ error: 'Invalid username or password' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ error: 'Invalid username or password' });

    // Issue JWT
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });

    res.json({
      message: 'Login successful',
      user: {
        username: user.username,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        token,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// ------------------ Logout ------------------
// With JWT, logout is client-side: just delete the token
router.post('/logout', (req: Request, res: Response) => {
  // Optional: you can implement a token blacklist here if desired
  res.json({ message: 'Logged out (delete token on client)' });
});

// ------------------ Check logged-in ------------------
router.get('/loggedin', (req: Request, res: Response) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader?.split(" ")[1];

  if (!token) return res.json({ loggedIn: false });

  jwt.verify(token, JWT_SECRET, (err, decoded: any) => {
    if (err) return res.json({ loggedIn: false });
    res.json({ loggedIn: true, userId: decoded.userId });
  });
});

// ------------------ Create user ------------------
router.post('/createuser', async (req: Request, res: Response) => {
  const { username, firstname, lastname, email, password } = req.body;

  if (!username || !firstname || !lastname || !password) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await insertUser({ username, firstname, lastname, email, password: hashedPassword });

    const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, { expiresIn: '1h' });

    res.json({
      message: "New user created",
      user: { username, firstname, lastname, email, token }
    });
  } catch (err: unknown) {
    console.error('Create user error:', err);
    if (err instanceof Error && err.message.includes('duplicate key value')) {
      return res.status(409).json({ error: 'Username already exists' });
    }
    res.status(500).json({ error: 'Server error' });
  }
});

// ------------------ Change password ------------------
router.post("/changepassword", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { newPassword, confirmPassword } = req.body;

  if (!newPassword || !confirmPassword) {
    return res.status(400).json({ error: "Both password fields are required." });
  }
  if (newPassword !== confirmPassword) {
    return res.status(400).json({ error: "Passwords do not match." });
  }

  if (!req.userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const result = await pool.query(
      `UPDATE users SET password = $1 WHERE id = $2 RETURNING id`,
      [hashedPassword, req.userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: "User not found." });
    }

    res.json({ message: "Password changed successfully", userId: req.userId });
  } catch (err: unknown) {
    console.error("Change password error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

// ------------------ Helper functions ------------------
async function insertUser(user: { username: string; firstname: string; lastname: string; email: string; password: string }) {
  const result = await pool.query(
    `INSERT INTO users (username, firstname, lastname, email, password)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [user.username, user.firstname, user.lastname, user.email, user.password]
  );
  return result.rows[0];
}

async function getUserByUsername(username: string) {
  const result = await pool.query(`SELECT * FROM users WHERE username = $1`, [username]);
  return result.rows[0];
}

export default router;
