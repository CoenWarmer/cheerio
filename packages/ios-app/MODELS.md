# Swift Model Generation

## Overview

While there's no official Supabase CLI for Swift code generation, we provide several approaches to keep your Swift models in sync with the database schema.

## Option 1: Custom Script (Basic)

We've included a basic script that generates Swift models by fetching sample data:

```bash
cd packages/ios-app
yarn install
yarn generate-models
```

This will output Swift structs based on your database tables.

**Limitations:**

- Infers types from sample data (may not be 100% accurate)
- Doesn't handle complex nested structures automatically
- Requires at least one row in each table

## Option 2: quicktype (Recommended for Production)

Install `quicktype` globally:

```bash
npm install -g quicktype
```

Generate Swift models from JSON:

```bash
# Fetch data from your API
curl http://localhost:3001/api/rooms | jq '.data[0]' > room-sample.json

# Generate Swift model
quicktype --lang swift \
  --src room-sample.json \
  --out CheerioApp/Models/Room.swift \
  --struct-or-class struct \
  --protocol Codable
```

**Advantages:**

- More sophisticated type inference
- Handles nested objects and arrays better
- Can merge multiple samples for better accuracy

## Option 3: Manual Sync

Since the database schema doesn't change frequently:

1. Keep the TypeScript types updated:

   ```bash
   cd packages/web-app
   yarn supabase:types
   ```

2. Manually update Swift models when schema changes
3. Reference `src/lib/database.types.ts` for the source of truth

## Current Models

The following models are maintained manually:

- `Room.swift` - Maps to `rooms` table
- `Message.swift` - Maps to `messages` table (with nested attachment handling)
- `Activity.swift` - Maps to `user_activity` table

## Tips

- Always test decoded models with real API data
- Handle optional fields properly (`String?` vs `String`)
- Use custom `init(from:)` for complex nested structures
- Keep `CodingKeys` in sync with API field names (camelCase vs snake_case)

## Future Improvements

Consider:

- Creating a TypeScript → Swift converter
- Using SwiftGen for more automation
- Building a Supabase Swift CLI plugin
