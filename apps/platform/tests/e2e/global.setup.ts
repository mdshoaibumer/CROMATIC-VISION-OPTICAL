import { execSync } from 'child_process';
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

async function globalSetup() {
  console.log('Running Database Seed script...');
  try {
    execSync('go run scripts/seed_test_db.go', { stdio: 'inherit' });
    console.log('Database seeded successfully.');
  } catch (error) {
    console.error('Failed to seed database:', error);
    throw error;
  }
}

export default globalSetup;
