# Supabase MCP Integration Setup

This guide shows how to integrate Supabase MCP (Model Context Protocol) with Claude Code so that Claude can directly execute database migrations and queries without manual intervention.

## What is MCP?

Model Context Protocol (MCP) allows Claude to interact with external services like Supabase through specialized tools. Once configured, Claude can:
- Execute SQL queries directly
- Run database migrations
- Query table schemas
- Insert/update/delete data
- All without requiring you to copy-paste SQL into Supabase Dashboard

## Prerequisites

- Node.js 18+ installed
- Claude Code CLI (claude-code) installed
- Supabase project with Service Role Key

## Step 1: Get Your Supabase Credentials

You need these two values from your Supabase project:

1. **SUPABASE_URL**: Your project URL (e.g., `https://abcdefgh.supabase.co`)
2. **SUPABASE_SERVICE_ROLE_KEY**: Your service role key (NOT the anon key)

To find them:
1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Project Settings** > **API**
4. Copy:
   - **Project URL** → This is your `SUPABASE_URL`
   - **service_role** key → This is your `SUPABASE_SERVICE_ROLE_KEY` (click "Reveal" to see it)

## Step 2: Understand Supabase MCP Architecture

**Important**: Supabase MCP is a **hosted cloud service** - no package installation needed!

Instead of installing an npm package, you connect to Supabase's hosted MCP server at:
```
https://mcp.supabase.com/mcp
```

This server runs in Supabase's cloud and handles all database operations securely.

## Step 3: Configure Claude Code

### Option A: Using Claude Code Config File (Recommended)

1. Find your Claude Code config location:
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Linux**: `~/.config/claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`

2. Edit the config file to add Supabase MCP server:

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp"
    }
  }
}
```

3. **That's it!** The hosted MCP server will handle authentication via your browser when you first use it.

### Authentication

When you first use the Supabase MCP server, Claude Code will:
1. Open a browser window
2. Ask you to log in to your Supabase account
3. Request permission to access your projects
4. Securely store your authentication token

**No manual credential management needed!**

## Step 4: Restart Claude Code

After updating the configuration:

1. Quit Claude Code completely
2. Restart Claude Code
3. The Supabase MCP tools should now be available

## Step 5: Verify Integration

Once Claude Code restarts, I (Claude) will have access to new Supabase tools like:
- `mcp__supabase__query` - Execute SQL queries
- `mcp__supabase__listTables` - List all tables
- `mcp__supabase__describeTable` - Get table schema
- `mcp__supabase__insert` - Insert rows
- `mcp__supabase__update` - Update rows
- `mcp__supabase__delete` - Delete rows

You can verify by asking me: "What tables are in my Supabase database?"

## Usage Examples

Once configured, you can ask me to:

### Run Migration
```
"Claude, run the migration file supabase/migrations/004_add_profile_enhancements.sql"
```

I'll be able to:
1. Read the migration file
2. Execute it directly against your database
3. Verify the changes
4. Report any errors

### Query Data
```
"Show me all user preferences in the database"
```

I'll execute:
```sql
SELECT * FROM user_preferences LIMIT 10;
```

### Check Schema
```
"What columns does the restaurants table have?"
```

I'll describe the table schema automatically.

### Insert Test Data
```
"Add a test user preference for user ID xyz"
```

I'll construct and execute the INSERT statement.

## Security Best Practices

⚠️ **Important Security Notes:**

1. **Service Role Key is Powerful**: The service role key bypasses Row Level Security (RLS) policies. Only use it in trusted environments.

2. **Never Commit Credentials**: Add config files with credentials to `.gitignore`:
   ```bash
   echo "claude_desktop_config.json" >> .gitignore
   ```

3. **Use Environment Variables**: For production or shared projects, prefer environment variables over hardcoded credentials.

4. **Rotate Keys Periodically**: Generate new service role keys every 3-6 months in Supabase Dashboard.

5. **Monitor Database Activity**: Check Supabase Dashboard > Logs regularly for unusual activity.

## Troubleshooting

### Issue: "MCP server not found" or "Connection refused"

**Solution:**
- Verify your config file has the correct URL: `https://mcp.supabase.com/mcp`
- Check your internet connection
- Try restarting Claude Code completely
- Verify the config file is valid JSON (no trailing commas, correct brackets)

### Issue: "Connection failed" or "Authentication error"

**Solution:**
- Clear any cached authentication: Log out of Supabase in your browser
- Try the authentication flow again when prompted by Claude Code
- Check your Supabase account has access to the project
- Verify your Supabase project is active and not paused
- Make sure you're logged into the correct Supabase account

### Issue: "Tools not appearing in Claude Code"

**Solution:**
- Restart Claude Code completely (quit and reopen)
- Check config file syntax is valid JSON (use a JSON validator)
- Verify the config file is in the correct location
- Complete the browser authentication flow when prompted
- Look for error messages in Claude Code's MCP panel or logs

### Issue: "Permission denied" errors

**Solution:**
- Check that you've granted the MCP server permission to access your project during authentication
- Verify your Supabase account has the necessary permissions (Owner or Admin role)
- Try re-authenticating by logging out and back in through Claude Code
- Check RLS policies in your database aren't blocking the operations

## Alternative: Supabase CLI

If MCP setup doesn't work, you can also use Supabase CLI:

```bash
# Install Supabase CLI
npm install -g supabase

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

Then I can use bash commands to execute migrations via CLI.

## Benefits of MCP Integration

Once configured, you get:

✅ **Automatic Migration Execution**: I can run migrations without manual steps
✅ **Real-time Verification**: I can verify changes immediately after execution
✅ **Schema Inspection**: I can check table structures to avoid errors
✅ **Data Seeding**: I can populate test data automatically
✅ **Rollback Support**: I can execute rollback scripts if needed
✅ **Debugging**: I can query data to troubleshoot issues

## Next Steps

After setup:
1. Ask me to verify the connection: "List all tables in Supabase"
2. Ask me to run the pending migration: "Run migration 004"
3. Test with a simple query: "Show me the user_preferences schema"

## Support

For MCP-specific issues:
- [Anthropic MCP Documentation](https://modelcontextprotocol.io)
- [Supabase MCP Server GitHub](https://github.com/modelcontextprotocol/servers/tree/main/src/supabase)

For Supabase issues:
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Community](https://github.com/supabase/supabase/discussions)
