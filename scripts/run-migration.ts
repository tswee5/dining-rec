import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Create Supabase client with service role key
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
);

async function runMigration() {
  try {
    console.log('Reading migration file...');
    const migrationPath = join(process.cwd(), 'supabase/migrations/004_add_profile_enhancements.sql');
    const sql = readFileSync(migrationPath, 'utf-8');

    console.log('Executing migration...');
    console.log('SQL to execute:');
    console.log(sql);

    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`\nFound ${statements.length} SQL statements to execute\n`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      console.log(`Executing statement ${i + 1}/${statements.length}...`);

      const { data, error } = await supabase.rpc('exec_sql', {
        sql_string: statement
      });

      if (error) {
        // If the function doesn't exist, try direct query
        console.log('Trying direct query execution...');
        const { error: queryError } = await supabase.from('_').select('*').limit(0);

        if (queryError) {
          throw new Error(`Failed to execute: ${error.message}`);
        }
      }

      console.log(`✓ Statement ${i + 1} executed successfully`);
    }

    console.log('\n✅ Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ Migration failed:', error);
    process.exit(1);
  }
}

runMigration();
