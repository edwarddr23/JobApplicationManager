import express, { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool } from '../db';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

declare module 'express-session' {
  interface SessionData {
    userId: number;
  }
}

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'defaultsecret';

// Login endpoint.
router.post('/login', async (req: Request, res: Response) => {
  const { username, password } = req.body;

  // Basic validation
  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    // Fetch the user from the database
    const user = await getUserByUsername(username);

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Compare hashed password
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Log the user in via session
    req.session.userId = user.id;

    // Create JWT token
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '1h' });

    res.json({
      message: 'Login successful',
      user: {
        username: user.username,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        token
      }
    });

  } catch (err: unknown) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Log out endpoint.
router.post('/logout', (req: Request, res: Response) => {
  req.session.destroy((err: Error | null) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ error: 'Server error during logout' });
    }

    // Clear cookie if you’re using cookies
    res.clearCookie('connect.sid'); // default cookie name for express-session
    res.json({ message: 'Logged out' });
  });
});

// Check if user is logged in endpoint.
router.get('/loggedin', (req: Request, res: Response) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(" ")[1];

  if (!token) {
    return res.json({ loggedIn: false });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded: any) => {
    if (err) return res.json({ loggedIn: false });

    res.json({ loggedIn: true, userId: decoded.userId });
  });
});

async function insertUser(user: { username: string, firstname: string, lastname: string, email: string, password: string}) {
  const result = await pool.query(
    `INSERT INTO users (username, firstname, lastname, email, password)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING id`,
    [user.username, user.firstname, user.lastname, user.email, user.password || 'viewer']
  );
  return result.rows[0];
}

async function getUserByUsername(username: string) {
  const result = await pool.query(
    `SELECT * FROM users WHERE username = $1`,
    [username]
  );
  return result.rows[0];
}

// Create user endpoint.
router.post('/createuser', async (req: Request, res: Response) => {
  const { username, firstname, lastname, email, password } = req.body;

  // Basic validation
  if (!username || !firstname || !lastname || !password) {
    return res.status(400).json({ error: "All fields are required." });
  }

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user into Postgres
    const newUser = await insertUser({
      username,
      firstname,
      lastname,
      email,
      password: hashedPassword
    });

    // Create JWT token
    const token = jwt.sign({ userId: newUser.id }, JWT_SECRET, { expiresIn: '1h' });

    // Save in session
    req.session.userId = newUser.id;

    res.json({
      message: "New user created and logged in",
      user: {
        username,
        firstname,
        lastname,
        email,
        token
      }
    });

  } catch (err: unknown) {
    console.error('Create user error:', err);

    // Handle unique constraint violation (username already exists)
    if (err instanceof Error && err.message.includes('duplicate key value')) {
      return res.status(409).json({ error: 'Username already exists' });
    }

    res.status(500).json({ error: 'Server error' });
  }
});

// Change password endpoint.
router.post("/changepassword", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { newPassword, confirmPassword } = req.body;

  // Check if password fields are provided
  if (!newPassword || !confirmPassword) {
    return res.status(400).json({ error: "Both password fields are required." });
  }

  // Check if passwords match
  if (newPassword !== confirmPassword) {
    return res.status(400).json({ error: "Passwords are not equal." });
  }

  if (!req.userId) {
    return res.status(401).json({ error: "Unauthorized" });
  }

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

export default router;
