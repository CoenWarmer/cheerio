# TypeScript Types from Supabase

This project uses auto-generated TypeScript types from your Supabase database schema for full type safety.

## Setup

### 1. Get Your Project ID

Find your Supabase project ID from your project URL:

- Go to https://app.supabase.com
- Open your project
- The URL will look like: `https://app.supabase.com/project/abcdefghijk`
- Your project ID is the last part: `abcdefghijk`

### 2. Add to Environment Variables

Add your project ID to `.env.local`:

```bash
SUPABASE_PROJECT_ID=your-project-id
```

**Important**: Make sure you have a `.env.local` file (not just `.env.local.example`). If you haven't created it yet:

```bash
cp .env.local.example .env.local
# Then edit .env.local with your actual values
```

### 3. Generate Types

Whenever you make changes to your database schema, regenerate the types:

```bash
yarn supabase:types
```

This command:

- Loads your environment variables from `.env.local`
- Connects to your Supabase project
- Generates TypeScript types from your database schema
- Updates `src/lib/database.types.ts` with the latest schema

## Usage Examples

### Basic Query with Types

```typescript
import { supabase } from '@/lib/supabase';

// TypeScript knows the structure of your 'posts' table
const { data, error } = await supabase.from('posts').select('*');

// data is typed as: Post[] | null
// Auto-completion works for all columns!
```

### Insert with Types

```typescript
import { supabase } from '@/lib/supabase';
import type { TablesInsert } from '@/lib/database.types';

// Define the shape of data to insert
type NewPost = TablesInsert<'posts'>;

const newPost: NewPost = {
  title: 'My Post',
  content: 'Hello world',
  // TypeScript will error if you're missing required fields
  // or include fields that don't exist
};

const { data, error } = await supabase
  .from('posts')
  .insert(newPost)
  .select()
  .single();
```

### Update with Types

```typescript
import { supabase } from '@/lib/supabase';
import type { TablesUpdate } from '@/lib/database.types';

type PostUpdate = TablesUpdate<'posts'>;

const updates: PostUpdate = {
  title: 'Updated Title',
  // Only include fields you want to update
};

const { data, error } = await supabase
  .from('posts')
  .update(updates)
  .eq('id', postId)
  .select()
  .single();
```

### Select Specific Columns

```typescript
// TypeScript knows which columns exist
const { data, error } = await supabase
  .from('posts')
  .select('id, title, created_at');

// Type inference works automatically
```

### Using Row Types Directly

```typescript
import type { Tables } from '@/lib/database.types';

// Get the type for a single row
type Post = Tables<'posts'>;

function displayPost(post: Post) {
  console.log(post.title);
  console.log(post.content);
  // TypeScript autocomplete works here!
}
```

### Join Tables with Types

```typescript
const { data, error } = await supabase.from('posts').select(`
    *,
    author:profiles(*)
  `);

// TypeScript infers the nested structure
```

### Using Enums

If your database has enums:

```typescript
import type { Enums } from '@/lib/database.types';

type PostStatus = Enums<'post_status'>;

const status: PostStatus = 'published'; // or 'draft', etc.
```

## Type Helpers

The generated types include helpful utilities:

- `Tables<'table_name'>` - Get the row type for a table
- `TablesInsert<'table_name'>` - Get the insert type (what fields are required/optional)
- `TablesUpdate<'table_name'>` - Get the update type (all fields optional)
- `Enums<'enum_name'>` - Get enum values
- `Database` - The full database schema type

## Best Practices

1. **Regenerate After Schema Changes**: Run `yarn supabase:types` after any database migration
2. **Commit Types to Git**: Include `database.types.ts` in version control
3. **Use Type Helpers**: Use `Tables<>`, `TablesInsert<>`, etc. instead of accessing `Database` directly
4. **Type Your Functions**: Always type function parameters and return values using these types

## Example Component

```typescript
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { Tables } from '@/lib/database.types';

type Post = Tables<'posts'>;

export default function PostsList() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPosts() {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (data) {
        setPosts(data); // Type-safe!
      }
      setLoading(false);
    }

    fetchPosts();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {posts.map((post) => (
        <div key={post.id}>
          <h2>{post.title}</h2>
          <p>{post.content}</p>
        </div>
      ))}
    </div>
  );
}
```

## Troubleshooting

### "Missing SUPABASE_PROJECT_ID"

Make sure you've added `SUPABASE_PROJECT_ID` to your `.env.local` file.

### "Command failed"

Ensure:

1. You have internet connection
2. Your Supabase project ID is correct
3. You're logged into Supabase CLI (may need to run `npx supabase login`)

### Types Not Updating

After changing your database schema:

1. Apply migrations in Supabase dashboard
2. Run `yarn supabase:types` to regenerate
3. Restart your dev server
