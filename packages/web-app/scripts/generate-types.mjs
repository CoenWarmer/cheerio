#!/usr/bin/env node
import { exec } from 'child_process';
import { promisify } from 'util';
import { config } from 'dotenv';
import { expand } from 'dotenv-expand';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local file
const result = config({ path: join(__dirname, '../.env.local') });
expand(result);

const projectId = process.env.SUPABASE_PROJECT_ID;

if (!projectId) {
  console.error('❌ Error: SUPABASE_PROJECT_ID not found in .env.local');
  console.error('');
  console.error('Please add your Supabase project ID to .env.local:');
  console.error('SUPABASE_PROJECT_ID=your-project-id');
  console.error('');
  console.error('You can find your project ID in your Supabase dashboard URL:');
  console.error('https://app.supabase.com/project/YOUR_PROJECT_ID');
  process.exit(1);
}

console.log('🔄 Generating TypeScript types from Supabase...');
console.log(`📦 Project ID: ${projectId}`);

try {
  const command = `supabase gen types typescript --project-id "${projectId}" --schema public`;
  const { stdout, stderr } = await execAsync(command);

  if (stderr && !stderr.includes('Finished supabase gen types')) {
    console.error('⚠️  Warning:', stderr);
  }

  // Write to file
  const fs = await import('fs');
  const outputPath = join(__dirname, '../src/lib/database.types.ts');
  fs.writeFileSync(outputPath, stdout);

  console.log('✅ Types generated successfully!');
  console.log(`📝 Written to: src/lib/database.types.ts`);
} catch (error) {
  console.error('❌ Error generating types:', error.message);
  console.error('');
  console.error('Common issues:');
  console.error('1. Make sure your SUPABASE_PROJECT_ID is correct');
  console.error('2. Check your internet connection');
  console.error('3. Ensure your Supabase project has at least one table');
  console.error('4. You may need to login: npx supabase login');
  process.exit(1);
}
