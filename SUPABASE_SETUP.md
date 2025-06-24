# Supabase Setup voor Sensible Docs Audit Trail

## 🚀 Quick Setup Guide

### 1. Maak Supabase Account
1. Ga naar [supabase.com](https://supabase.com)
2. Klik "Start your project"
3. Log in met GitHub
4. Maak een nieuw project

### 2. Database Schema Aanmaken

Ga naar je Supabase project → SQL Editor en voer uit:

```sql
-- Create audit_events table
CREATE TABLE public.audit_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    sequence BIGINT NOT NULL,
    event_type TEXT NOT NULL,
    action TEXT NOT NULL,
    user_id TEXT NOT NULL,
    document_id TEXT,
    details JSONB DEFAULT '{}',
    session_id TEXT DEFAULT 'unknown',
    hash TEXT NOT NULL,
    previous_hash TEXT DEFAULT '',
    user_agent TEXT DEFAULT 'unknown',
    ip_address TEXT DEFAULT 'unknown',
    
    CREATED_AT TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_audit_events_timestamp ON public.audit_events(timestamp DESC);
CREATE INDEX idx_audit_events_sequence ON public.audit_events(sequence);
CREATE INDEX idx_audit_events_user_id ON public.audit_events(user_id);
CREATE INDEX idx_audit_events_event_type ON public.audit_events(event_type);
CREATE INDEX idx_audit_events_document_id ON public.audit_events(document_id) WHERE document_id IS NOT NULL;

-- Create unique constraint for sequence
CREATE UNIQUE INDEX idx_audit_events_sequence_unique ON public.audit_events(sequence);

-- Add Row Level Security (RLS)
ALTER TABLE public.audit_events ENABLE ROW LEVEL SECURITY;

-- Create policy for authenticated users (adjust based on your needs)
CREATE POLICY "Allow all operations for authenticated users" ON public.audit_events
    FOR ALL USING (true);

-- Or more restrictive policy:
-- CREATE POLICY "Allow read for authenticated users" ON public.audit_events
--     FOR SELECT USING (auth.role() = 'authenticated');
-- 
-- CREATE POLICY "Allow insert for service role" ON public.audit_events
--     FOR INSERT WITH CHECK (auth.role() = 'service_role');
```

### 3. Environment Variables Instellen

#### Lokaal (`.env.local`):
```bash
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key
```

#### Vercel:
1. Ga naar Vercel project → Settings → Environment Variables
2. Voeg toe:
   - `SUPABASE_URL` = `https://your-project-ref.supabase.co`
   - `SUPABASE_ANON_KEY` = `your-anon-key`

**Je vindt deze credentials in:**
- Supabase project → Settings → API
- URL = Project URL
- Key = anon/public key

### 4. Test de Setup

Na deployment kun je testen of het werkt:

1. Ga naar je app
2. Log in als admin
3. Ga naar Audit Log pagina
4. Check of er events worden getoond
5. Test filters en export functionaliteit

## 🔧 Advanced Configuration

### Custom Policies
Voor production gebruik meer specifieke RLS policies:

```sql
-- Only allow reading audit logs for admin users
CREATE POLICY "Admin read access" ON public.audit_events
    FOR SELECT 
    USING (
        auth.jwt() ->> 'user_role' = 'admin'
        OR auth.jwt() ->> 'role' = 'admin'
    );

-- Only allow inserting through service role
CREATE POLICY "Service role insert" ON public.audit_events
    FOR INSERT 
    WITH CHECK (auth.role() = 'service_role');
```

### Database Cleanup
Auto-cleanup oude entries (optioneel):

```sql
-- Function to clean up old audit events (keep last 10,000)
CREATE OR REPLACE FUNCTION cleanup_old_audit_events()
RETURNS void AS $$
BEGIN
    DELETE FROM public.audit_events 
    WHERE id NOT IN (
        SELECT id FROM public.audit_events 
        ORDER BY sequence DESC 
        LIMIT 10000
    );
END;
$$ LANGUAGE plpgsql;

-- Schedule cleanup (requires pg_cron extension)
-- SELECT cron.schedule('cleanup-audit', '0 2 * * *', 'SELECT cleanup_old_audit_events();');
```

## 📊 Monitoring & Analytics

### Useful Queries

```sql
-- Events per day
SELECT 
    DATE(timestamp) as date,
    COUNT(*) as events
FROM public.audit_events 
GROUP BY DATE(timestamp) 
ORDER BY date DESC;

-- Most active users
SELECT 
    user_id,
    COUNT(*) as event_count
FROM public.audit_events 
GROUP BY user_id 
ORDER BY event_count DESC 
LIMIT 10;

-- Event types distribution
SELECT 
    event_type,
    COUNT(*) as count
FROM public.audit_events 
GROUP BY event_type 
ORDER BY count DESC;

-- Check integrity
SELECT 
    sequence,
    hash,
    previous_hash,
    LAG(hash) OVER (ORDER BY sequence) as expected_previous_hash
FROM public.audit_events 
ORDER BY sequence;
```

## 🚨 Troubleshooting

### Common Issues:

1. **"relation does not exist" error**
   - Check if table is created in correct schema (public)
   - Verify SQL was executed successfully

2. **RLS blocking inserts**
   - Check RLS policies
   - Use service role key for server operations

3. **Connection issues**
   - Verify SUPABASE_URL and SUPABASE_ANON_KEY
   - Check if credentials are correctly set in Vercel

4. **Performance issues**
   - Ensure indexes are created
   - Consider partitioning for large datasets

### Debug Mode:
Add to your environment:
```bash
DEBUG_SUPABASE=true
```

## 💰 Costs & Limits

**Supabase Free Tier:**
- 500MB database storage
- 2GB bandwidth/month
- 50,000 monthly active users
- Unlimited API requests

**Voor Sensible Docs audit trail:**
- ~1KB per audit event
- 500MB = ~500,000 events
- Perfect voor demo/testing!

**Upgrade overwegen bij:**
- >100 gebruikers
- >10,000 events/dag
- Productie gebruik 