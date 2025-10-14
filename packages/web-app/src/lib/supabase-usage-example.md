# Supabase Usage Examples

This file contains examples of how to use Supabase in your Next.js app.

## Basic Setup

The Supabase client is already configured in `src/lib/supabase.ts`. Import it like this:

```typescript
import { supabase } from '@/lib/supabase';
```

## Examples

### 1. Query Data

```typescript
// Fetch all rows from a table
const { data, error } = await supabase.from('your_table').select('*');

// Fetch with filters
const { data, error } = await supabase
  .from('your_table')
  .select('*')
  .eq('column', 'value')
  .order('created_at', { ascending: false });
```

### 2. Insert Data

```typescript
const { data, error } = await supabase
  .from('your_table')
  .insert([{ column1: 'value1', column2: 'value2' }]);
```

### 3. Update Data

```typescript
const { data, error } = await supabase
  .from('your_table')
  .update({ column1: 'new_value' })
  .eq('id', 123);
```

### 4. Delete Data

```typescript
const { data, error } = await supabase
  .from('your_table')
  .delete()
  .eq('id', 123);
```

### 5. Authentication

```typescript
// Sign up a new user
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
});

// Sign in
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123',
});

// Sign out
const { error } = await supabase.auth.signOut();

// Get current user
const {
  data: { user },
} = await supabase.auth.getUser();
```

### 6. Real-time Subscriptions

```typescript
// Subscribe to changes
const channel = supabase
  .channel('table-changes')
  .on(
    'postgres_changes',
    { event: '*', schema: 'public', table: 'your_table' },
    payload => {
      console.log('Change received!', payload);
    }
  )
  .subscribe();

// Don't forget to unsubscribe when component unmounts
channel.unsubscribe();
```

### 7. Storage (File Uploads)

```typescript
// Upload a file
const { data, error } = await supabase.storage
  .from('bucket-name')
  .upload('file-path.png', file);

// Get public URL
const { data } = supabase.storage
  .from('bucket-name')
  .getPublicUrl('file-path.png');
```

## Learn More

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase JavaScript Client](https://supabase.com/docs/reference/javascript)
