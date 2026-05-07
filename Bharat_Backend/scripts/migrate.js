import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { Client } from 'pg';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const schemasDir = path.join(__dirname, '..', 'schemas');

async function run() {
  const cmd = process.argv[2] || 'up';
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.error('DATABASE_URL environment variable is required to run migrations.');
    process.exit(1);
  }

  const client = new Client({ connectionString: dbUrl });
  await client.connect();

  try {
    if (cmd === 'up') {
      const files = fs.readdirSync(schemasDir)
        .filter(f => f.match(/^\d+_.*\.sql$/))
        .sort();

      for (const file of files) {
        const sql = fs.readFileSync(path.join(schemasDir, file), 'utf8');
        console.log('Running', file);
        await client.query(sql);
      }

      console.log('Migrations applied.');
    } else if (cmd === 'status') {
      console.log('Available migration files:');
      fs.readdirSync(schemasDir)
        .filter(f => f.match(/^\d+_.*\.sql$/))
        .sort()
        .forEach(f => console.log(' -', f));
    } else {
      console.error('Unknown command', cmd);
      process.exit(1);
    }
  } finally {
    await client.end();
  }
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
