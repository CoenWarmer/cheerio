#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables from web-app
const envPath = path.join(__dirname, '../../web-app/.env.local');
const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const [key, ...values] = line.split('=');
  if (key && values.length) {
    envVars[key.trim()] = values.join('=').trim();
  }
});

const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  envVars.SUPABASE_SERVICE_ROLE_KEY || envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

// Fetch table schemas
async function generateSwiftModels() {
  const tables = ['events', 'messages', 'profiles', 'user_activity'];

  console.log('Fetching database schema...');

  for (const table of tables) {
    try {
      // Fetch one row to get the structure
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error(`Error fetching ${table}:`, error);
        continue;
      }

      console.log(`\nGenerated Swift model for ${table}:`);
      console.log(generateSwiftStruct(table, data));
    } catch (err) {
      console.error(`Error processing ${table}:`, err);
    }
  }
}

function generateSwiftStruct(tableName, sampleData) {
  const structName = toPascalCase(tableName.replace(/_/g, ' '));

  let swift = `import Foundation\n\n`;
  swift += `struct ${structName}: Codable, Identifiable {\n`;

  if (sampleData) {
    for (const [key, value] of Object.entries(sampleData)) {
      const swiftType = inferSwiftType(value);
      const propertyName = toCamelCase(key);
      swift += `    let ${propertyName}: ${swiftType}\n`;
    }
  }

  swift += `\n    enum CodingKeys: String, CodingKey {\n`;
  if (sampleData) {
    for (const key of Object.keys(sampleData)) {
      const propertyName = toCamelCase(key);
      if (propertyName !== key) {
        swift += `        case ${propertyName} = "${key}"\n`;
      } else {
        swift += `        case ${propertyName}\n`;
      }
    }
  }
  swift += `    }\n`;
  swift += `}\n`;

  return swift;
}

function inferSwiftType(value) {
  if (value === null) return 'String?';
  if (typeof value === 'string') {
    if (value.match(/^\d{4}-\d{2}-\d{2}T/)) return 'String'; // ISO date
    return 'String';
  }
  if (typeof value === 'number') {
    return Number.isInteger(value) ? 'Int' : 'Double';
  }
  if (typeof value === 'boolean') return 'Bool';
  if (Array.isArray(value)) return '[String]'; // Simplified
  if (typeof value === 'object') return '[String: Any]'; // Simplified
  return 'String';
}

function toPascalCase(str) {
  return str
    .replace(/\w+/g, w => w[0].toUpperCase() + w.slice(1).toLowerCase())
    .replace(/\s/g, '');
}

function toCamelCase(str) {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

generateSwiftModels();
