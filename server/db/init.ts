import bcrypt from 'bcrypt';
import { pool } from './index';

export async function createUsersTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username TEXT UNIQUE NOT NULL,
        firstname TEXT NOT NULL,
        lastname TEXT NOT NULL,
        email TEXT,
        password TEXT NOT NULL
    );
  `;
  await pool.query(query);
  console.log('Users table ensured.');
}

export async function createCompaniesTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS companies (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT UNIQUE NOT NULL,
        website TEXT,
        location TEXT,
        created_at TIMESTAMPTZ DEFAULT now()
    );
  `;
  await pool.query(query);
  console.log('Companies table ensured.');
}

export async function createJobBoardsTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS job_boards (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name TEXT UNIQUE NOT NULL,
        url TEXT
    );
  `;
  await pool.query(query);
  console.log('Job boards table ensured.');
}

export async function createApplicationsTable() {
  const query = `
    CREATE TABLE IF NOT EXISTS applications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id),
        company_id UUID REFERENCES companies(id),
        job_board_id UUID REFERENCES job_boards(id),
        job_title TEXT NOT NULL,
        status TEXT CHECK (status IN ('applied','offer','rejected','withdrawn')),
        applied_at TIMESTAMPTZ DEFAULT now(),
        last_updated TIMESTAMPTZ DEFAULT now()
    );
  `;
  await pool.query(query);
  console.log('Applications table ensured.');
}

export async function seedJobBoards() {
  // Check if job_boards table already has entries
  const result = await pool.query('SELECT COUNT(*) FROM job_boards');
  const count = parseInt(result.rows[0].count, 10);

  if (count > 0) {
    console.log('Job boards already seeded.');
    return;
  }

  const query = `
    INSERT INTO job_boards (id, name, url) VALUES
        (gen_random_uuid(), 'Indeed', 'https://www.indeed.com'),
        (gen_random_uuid(), 'LinkedIn', 'https://www.linkedin.com/jobs'),
        (gen_random_uuid(), 'Glassdoor', 'https://www.glassdoor.com'),
        (gen_random_uuid(), 'ZipRecruiter', 'https://www.ziprecruiter.com'),
        (gen_random_uuid(), 'Monster', 'https://www.monster.com'),
        (gen_random_uuid(), 'SimplyHired', 'https://www.simplyhired.com'),
        (gen_random_uuid(), 'CareerBuilder', 'https://www.careerbuilder.com'),
        (gen_random_uuid(), 'Dice', 'https://www.dice.com'),
        (gen_random_uuid(), 'AngelList', 'https://angel.co/jobs'),
        (gen_random_uuid(), 'Stack Overflow Jobs', 'https://stackoverflow.com/jobs'),
        (gen_random_uuid(), 'Hired', 'https://hired.com'),
        (gen_random_uuid(), 'FlexJobs', 'https://www.flexjobs.com'),
        (gen_random_uuid(), 'Remote.co', 'https://remote.co/remote-jobs'),
        (gen_random_uuid(), 'Job.com', 'https://www.job.com'),
        (gen_random_uuid(), 'Snagajob', 'https://www.snagajob.com');
  `;

  await pool.query(query);
  console.log('Job boards seeded successfully.');
}

// Showcase and dev purposes only:
export async function seedCompanies() {
  const companies = [
    { name: 'TechCorp', website: 'https://techcorp.com', location: 'NY' },
    { name: 'BizSoft', website: 'https://bizsoft.com', location: 'CA' },
    { name: 'InnovateX', website: 'https://innovatex.com', location: 'TX' },
    { name: 'NextGen Solutions', website: 'https://nextgensolutions.com', location: 'WA' },
    { name: 'Alpha Systems', website: 'https://alphasystems.com', location: 'MA' },
    { name: 'BetaWorks', website: 'https://betaworks.com', location: 'FL' },
    { name: 'CloudNine', website: 'https://cloudnine.com', location: 'CO' },
    { name: 'DataForge', website: 'https://dataforge.com', location: 'IL' },
    { name: 'QuantumLeap', website: 'https://quantumleap.com', location: 'CA' },
    { name: 'Visionary Labs', website: 'https://visionarylabs.com', location: 'NY' },
  ];

  for (const c of companies) {
    await pool.query(
      `INSERT INTO companies (name, website, location)
       VALUES ($1, $2, $3)
       ON CONFLICT (name) DO NOTHING`,
      [c.name, c.website, c.location]
    );
  }
  console.log('Companies seeded.');
}


export async function seedUsers() {
  const users = [
    { username: 'alice', firstname: 'Alice', lastname: 'Anderson', email: 'alice@example.com', password: 'password123' },
    { username: 'bob', firstname: 'Bob', lastname: 'Brown', email: 'bob@example.com', password: 'password123' },
  ];

  for (const u of users) {
    const hashedPassword = await bcrypt.hash(u.password, 10);
    try {
      await pool.query(
        `INSERT INTO users (username, firstname, lastname, email, password)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (username) DO NOTHING`,
        [u.username, u.firstname, u.lastname, u.email, hashedPassword]
      );
    } catch (err) {
      console.error('Error seeding user:', err);
    }
  }
  console.log('Users seeded.');
}

export async function seedApplications() {
  try {
    // Fetch existing IDs
    const { rows: users } = await pool.query('SELECT id, username FROM users ORDER BY username ASC');
    const { rows: companies } = await pool.query('SELECT id, name FROM companies ORDER BY name ASC');
    const { rows: jobBoards } = await pool.query('SELECT id, name FROM job_boards ORDER BY name ASC');

    if (users.length === 0 || companies.length === 0 || jobBoards.length === 0) {
      console.log('Cannot seed applications: missing users, companies, or job boards.');
      return;
    }

    const jobTitles = [
      'Frontend Developer',
      'Backend Developer',
      'Fullstack Developer',
      'Data Analyst',
      'DevOps Engineer',
      'Product Manager',
      'QA Engineer',
      'UX Designer',
    ];

    const statuses: ('applied' | 'offer' | 'rejected' | 'withdrawn')[] = [
      'applied', 'offer', 'rejected', 'withdrawn',
    ];

    const applications: any[] = [];

    users.forEach(user => {
      for (let i = 0; i < 7; i++) {
        const company = companies[i % companies.length];
        const jobBoard = jobBoards[i % jobBoards.length];
        const jobTitle = jobTitles[i % jobTitles.length];
        const status = statuses[Math.floor(Math.random() * statuses.length)];

        // Random timestamp in the past 30 days
        const applied_at = new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000));

        applications.push({
          user_id: user.id,
          company_id: company.id,
          job_board_id: jobBoard.id,
          job_title: jobTitle,
          status,
          applied_at,
        });
      }
    });

    for (const app of applications) {
        const appliedISO = app.applied_at.toISOString();
        await pool.query(
            `INSERT INTO applications 
                (user_id, company_id, job_board_id, job_title, status, applied_at, last_updated)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            ON CONFLICT DO NOTHING`,
            [app.user_id, app.company_id, app.job_board_id, app.job_title, app.status, appliedISO, appliedISO]
        );

    }

    console.log(`${applications.length} applications seeded.`);
  } catch (err) {
    console.error('Error seeding applications:', err);
  }
}

export async function initializeTables() {
    await createUsersTable();
    await createCompaniesTable();
    await createJobBoardsTable();
    await createApplicationsTable();

    await seedUsers();
    await seedCompanies();
    await seedJobBoards();
    await seedApplications();

    console.log('All tables initialized.');
}