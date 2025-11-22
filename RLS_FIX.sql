-- ============================================================================
-- FIX FOR INFINITE RECURSION IN party_attendees RLS POLICY
-- Run this SQL script in Supabase SQL Editor to fix the error
-- ============================================================================

-- Step 1: Create a security definer function to check if a user is an attendee
-- This function bypasses RLS, preventing infinite recursion
CREATE OR REPLACE FUNCTION is_party_attendee(p_party_id UUID, p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM party_attendees
    WHERE party_id = p_party_id AND user_id = p_user_id
  );
END;
$$;

-- Step 2: Drop the existing problematic policy
DROP POLICY IF EXISTS "Attendees viewable by party members" ON party_attendees;

-- Step 3: Create a new policy that uses the function instead of direct query
CREATE POLICY "Attendees viewable by party members" ON party_attendees
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM parties
      WHERE id = party_attendees.party_id AND (
        auth.uid() = host_id OR
        is_party_attendee(parties.id, auth.uid())
      )
    )
  );

-- Step 4: Fix other policies that also have the same issue
-- These policies query party_attendees indirectly through the parties policy

-- Fix "Private parties viewable by attendees" policy
DROP POLICY IF EXISTS "Private parties viewable by attendees" ON parties;
CREATE POLICY "Private parties viewable by attendees" ON parties
  FOR SELECT USING (
    is_private = false OR 
    auth.uid() = host_id OR
    (is_private = true AND is_party_attendee(parties.id, auth.uid()))
  );

-- Fix "Requirements viewable by party members" policy
DROP POLICY IF EXISTS "Requirements viewable by party members" ON party_requirements;
CREATE POLICY "Requirements viewable by party members" ON party_requirements
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM parties
      WHERE id = party_requirements.party_id AND (
        auth.uid() = host_id OR
        is_party_attendee(parties.id, auth.uid())
      )
    )
  );

-- Fix "Claims viewable by party members" policy
DROP POLICY IF EXISTS "Claims viewable by party members" ON requirement_claims;
CREATE POLICY "Claims viewable by party members" ON requirement_claims
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM party_requirements pr
      JOIN parties p ON p.id = pr.party_id
      WHERE pr.id = requirement_claims.requirement_id AND (
        auth.uid() = p.host_id OR
        is_party_attendee(p.id, auth.uid())
      )
    )
  );

-- Fix "Memories viewable by party members" policy
DROP POLICY IF EXISTS "Memories viewable by party members" ON party_memories;
CREATE POLICY "Memories viewable by party members" ON party_memories
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM parties
      WHERE id = party_memories.party_id AND (
        auth.uid() = host_id OR
        is_party_attendee(parties.id, auth.uid())
      )
    )
  );

-- Fix "Attendees can create memories" policy
DROP POLICY IF EXISTS "Attendees can create memories" ON party_memories;
CREATE POLICY "Attendees can create memories" ON party_memories
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    is_party_attendee(party_memories.party_id, auth.uid())
  );

-- Fix "Messages viewable by party members" policy
DROP POLICY IF EXISTS "Messages viewable by party members" ON party_messages;
CREATE POLICY "Messages viewable by party members" ON party_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM parties
      WHERE id = party_messages.party_id AND (
        auth.uid() = host_id OR
        is_party_attendee(parties.id, auth.uid())
      )
    )
  );

-- Fix "Party members can send messages" policy
DROP POLICY IF EXISTS "Party members can send messages" ON party_messages;
CREATE POLICY "Party members can send messages" ON party_messages
  FOR INSERT WITH CHECK (
    auth.uid() = user_id AND
    is_party_attendee(party_messages.party_id, auth.uid())
  );

-- ============================================================================
-- VERIFICATION
-- ============================================================================
-- After running this script, test that:
-- 1. You can query party_attendees without errors
-- 2. You can query party_messages without errors
-- 3. RLS policies still work correctly (users can only see what they should)

