import express, { Request, Response } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import session from 'express-session';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { pool, testConnection } from './db'
import { authenticateToken } from './middleware/auth';
import { initializeTables } from './db/init';

declare module 'express-session' {
  interface SessionData {
    userId: number;
  }
}

dotenv.config();

const app = express();

const SERVER_PORT = process.env.SERVER_PORT ? parseInt(process.env.SERVER_PORT, 10) : 5000;

const JWT_SECRET = process.env.JWT_SECRET || 'defaultsecret';

interface AuthenticatedRequest extends Request {
  userId?: number;
}

app.use(cors());
app.use(express.json());

// Session configuration.
app.use(express.json());
app.use(session({
    secret: 'ks012A[}1a:>7fc',
    resave: false,
    saveUninitialized: false,
    // 1 hour max age.
    cookie: { maxAge: 3600000 }
}));

// DB Initialization.
(async () => {
  await testConnection();
  await initializeTables();
})();

// Root endpoint.
app.get('/', (req, res) => {
    res.send("Welcome to the API!");
});

// Login endpoint.
app.post('/login', async (req: Request, res: Response) => {
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
app.post('/logout', (req: Request, res: Response) => {
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

app.get('/loggedin', (req: Request, res: Response) => {
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
app.post('/createuser', async (req: Request, res: Response) => {
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
app.post("/changepassword", authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
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

// Fetch all applications endpoint.
app.get('/applications', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userId) {
    return res.status(401).json({ error: 'Unauthorized: Missing user ID' });
  }

  try {
    const result = await pool.query(
      `
      SELECT 
        a.id,
        a.user_id,
        u.username,
        a.company_id,
        c.name AS company_name,
        a.job_board_id,
        jb.name AS job_board_name,
        a.job_title,
        a.status,
        a.applied_at,
        a.last_updated
      FROM applications a
      JOIN users u ON a.user_id = u.id
      JOIN companies c ON a.company_id = c.id
      JOIN job_boards jb ON a.job_board_id = jb.id
      WHERE a.user_id = $1
      ORDER BY a.applied_at DESC
      `,
      [req.userId]
    );

    res.json(result.rows);
  } catch (err: unknown) {
    console.error('Error fetching applications:', err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// Fetch all job boards endpoint.
app.get('/jobboards', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const result = await pool.query('SELECT id, name FROM job_boards ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching job boards:', err);
    res.status(500).json({ error: 'Database query failed' });
  }
});

// Submit (post) application endpoint.
app.post('/application', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  if (!req.userId) {
    return res.status(401).json({ error: 'Unauthorized: Missing user ID' });
  }

  const { companyName, jobTitle, jobBoardId, status } = req.body;

  if (!companyName || !jobTitle || !jobBoardId || !status) {
    return res.status(400).json({ error: 'All fields are required.' });
  }

  try {
    // Ensure the company exists
    let companyResult = await pool.query(
      'SELECT id FROM companies WHERE name = $1',
      [companyName]
    );

    let companyId: string;

    if (companyResult.rows.length === 0) {
      // Insert new company
      const insertCompany = await pool.query(
        'INSERT INTO companies (name) VALUES ($1) RETURNING id',
        [companyName]
      );
      companyId = insertCompany.rows[0].id;
    } else {
      companyId = companyResult.rows[0].id;
    }

    // Insert the application
    await pool.query(
      `INSERT INTO applications (user_id, company_id, job_board_id, job_title, status)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.userId, companyId, jobBoardId, jobTitle, status]
    );

    res.json({ message: 'Application submitted successfully' });
  } catch (err) {
    console.error('Error inserting application:', err);
    res.status(500).json({ error: 'Server error while submitting application' });
  }
});

// Application status update endpoint.
app.patch('/applications/:userId/:companyId/:jobBoardId', async (req, res) => {
  const { userId, companyId, jobBoardId } = req.params;
  const { status } = req.body;

  if (!['applied','offer','rejected','withdrawn'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status' });
  }

  try {
    await pool.query(
      `UPDATE applications
       SET status = $1,
           last_updated = now()
       WHERE user_id = $2 AND company_id = $3 AND job_board_id = $4`,
      [status, userId, companyId, jobBoardId]
    );
    res.json({ message: 'Status updated' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// Delete application endpoint.
app.delete('/applications/:id', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  if (!req.userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const result = await pool.query(
      `DELETE FROM applications WHERE id = $1 AND user_id = $2 RETURNING *`,
      [id, req.userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.json({ message: 'Application deleted', deleted: result.rows[0] });
  } catch (err) {
    console.error('Error deleting application:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

app.listen(SERVER_PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${SERVER_PORT}`);
    console.log(`See at http://localhost:${SERVER_PORT}/`)
})