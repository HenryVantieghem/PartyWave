# Supabase Setup Guide for The Hangout

## 1. Create Supabase Project

1. Go to [Supabase](https://supabase.com/) and create a new project
2. Wait for the project to be fully provisioned
3. Save your project URL and anon key

## 2. Configure Environment Variables

1. Copy `.env.example` to `.env`
2. Fill in your Supabase credentials:

```env
EXPO_PUBLIC_SUPABASE_URL=your-project-url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## 3. Run Database Setup

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Create a new query
4. Copy and paste the entire contents of `supabase-setup.sql`
5. Run the query

This will create:
- All database tables
- Indexes for performance
- Row Level Security (RLS) policies
- Database functions and triggers
- Realtime subscriptions

## 3.5 Run Crew System Migration

**NEW - Crew System Tables (v2.0)**

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Create a new query
4. Copy and paste the entire contents of `DATABASE_MIGRATION_CREWS.sql`
5. Run the query

This will create the crew system tables:

### Tables Created:
- **party_crews** - Main crew/group table
- **crew_members** - Crew membership and roles
- **crew_invites** - Crew invitation management
- **crew_activity** - Crew activity feed
- **crew_vouches** - Trust network through crew vouching

### Features:
- ✅ Complete RLS policies for crew privacy
- ✅ Optimized indexes for performance
- ✅ Auto-updating member counts via triggers
- ✅ Auto-expiring invites after 7 days
- ✅ Crew types: Inner Circle (2-8), Extended (8-20), Open (unlimited)
- ✅ Privacy settings: Private, Closed, Public
- ✅ Role-based access: Owner, Admin, Member

### Storage Bucket for Crews:

Create an additional storage bucket:

**crew-avatars** (Public)
- For crew group pictures
- Max file size: 2MB
- Allowed types: image/jpeg, image/png, image/webp

**Storage Policy**:
```sql
-- Anyone can view
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'crew-avatars');

-- Crew admins can upload
CREATE POLICY "Crew admins can upload" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'crew-avatars' AND auth.role() = 'authenticated');

-- Crew admins can update
CREATE POLICY "Crew admins can update" ON storage.objects FOR UPDATE
  USING (bucket_id = 'crew-avatars' AND auth.role() = 'authenticated');

-- Crew admins can delete
CREATE POLICY "Crew admins can delete" ON storage.objects FOR DELETE
  USING (bucket_id = 'crew-avatars' AND auth.role() = 'authenticated');
```

### Enable Realtime for Crew Tables:

In Supabase Dashboard → Database → Replication, enable realtime for:
- `crew_activity`
- `crew_members`
- `crew_invites`

## 4. Setup Storage Buckets

### Create Buckets

In Supabase Dashboard → Storage, create the following buckets:

1. **avatars** (Public)
   - For user profile pictures
   - Max file size: 2MB
   - Allowed types: image/jpeg, image/png, image/webp

2. **party-covers** (Public)
   - For party cover images
   - Max file size: 5MB
   - Allowed types: image/jpeg, image/png, image/webp

3. **party-memories** (Private)
   - For party photos and videos
   - Max file size: 50MB
   - Allowed types: image/*, video/*

4. **stories** (Private)
   - For temporary story content
   - Max file size: 20MB
   - Allowed types: image/*, video/*
   - Auto-delete: 24 hours

### Storage Policies

For each bucket, add these policies:

**avatars**:
```sql
-- Anyone can view
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');

-- Users can upload their own avatar
CREATE POLICY "Users can upload avatar" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can update their own avatar
CREATE POLICY "Users can update own avatar" ON storage.objects FOR UPDATE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can delete their own avatar
CREATE POLICY "Users can delete own avatar" ON storage.objects FOR DELETE
  USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
```

**party-covers**:
```sql
-- Anyone can view
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'party-covers');

-- Authenticated users can upload
CREATE POLICY "Authenticated users can upload" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'party-covers' AND auth.role() = 'authenticated');

-- Users can update covers they uploaded
CREATE POLICY "Users can update own covers" ON storage.objects FOR UPDATE
  USING (bucket_id = 'party-covers' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can delete covers they uploaded
CREATE POLICY "Users can delete own covers" ON storage.objects FOR DELETE
  USING (bucket_id = 'party-covers' AND auth.uid()::text = (storage.foldername(name))[1]);
```

**party-memories & stories**:
```sql
-- Only party members can view
CREATE POLICY "Party members can view" ON storage.objects FOR SELECT
  USING (bucket_id = 'party-memories' AND auth.role() = 'authenticated');

-- Users can upload their own memories
CREATE POLICY "Users can upload memories" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'party-memories' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Users can delete their own memories
CREATE POLICY "Users can delete own memories" ON storage.objects FOR DELETE
  USING (bucket_id = 'party-memories' AND auth.uid()::text = (storage.foldername(name))[1]);
```

## 5. Enable Realtime

In Supabase Dashboard → Database → Replication:

Enable realtime for these tables:
- `party_messages`
- `party_attendees`
- `parties`

## 6. Email Templates (Optional)

Configure email templates in Authentication → Email Templates:
- Customize signup confirmation email
- Customize password reset email
- Add your app branding

## 7. Authentication Settings

In Authentication → Settings:
- Enable email confirmations (optional)
- Set site URL: `thehangout://`
- Add redirect URLs: `thehangout://**, http://localhost:19006/**`
- Configure password requirements

## 8. Test Your Setup

Run this query to verify everything is set up:

```sql
SELECT
  (SELECT COUNT(*) FROM profiles) as profiles_count,
  (SELECT COUNT(*) FROM parties) as parties_count,
  (SELECT COUNT(*) FROM party_attendees) as attendees_count;
```

## Troubleshooting

### Issue: RLS policies not working
- Make sure RLS is enabled on all tables
- Verify auth.uid() is returning the correct user ID
- Check policy conditions match your use case

### Issue: Storage uploads failing
- Verify bucket policies are set correctly
- Check file size limits
- Ensure MIME types are allowed

### Issue: Realtime not working
- Confirm tables are added to replication
- Check that RLS policies allow SELECT access
- Verify subscription permissions

## Next Steps

1. Install dependencies: `npm install`
2. Start the app: `npm start`
3. Test authentication flow
4. Create your first party!

For issues or questions, check:
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord](https://discord.supabase.com)
