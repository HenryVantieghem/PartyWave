# 🚀 The Hangout - Execution Roadmap

**Last Updated**: 2025-11-22
**Overall Progress**: 32% Complete
**Current Phase**: Phase 3 - Crew Features
**Status**: ✅ Phase 1 & 2 COMPLETE | 🎯 Phase 3 In Progress (22%)

---

## 📊 Overall Progress Dashboard

```
Phase 1: Foundation               ██████████ 100% (12/12 tasks) ✅ COMPLETE
Phase 2: Party Creation Overhaul  ██████████ 100% (9/9 tasks)  ✅ COMPLETE
Phase 3: Crew Features            ██░░░░░░░░  22% (2/9 tasks)  🔄 CURRENT
Phase 4: Advanced Features        ░░░░░░░░░░   0% (0/9 tasks)
Phase 5: Polish & Optimization    ░░░░░░░░░░   0% (0/11 tasks)
Phase 6: Pre-Launch               ░░░░░░░░░░   0% (0/10 tasks)
Phase 7: Launch                   ░░░░░░░░░░   0% (0/9 tasks)
───────────────────────────────────────────────
TOTAL:                            ███░░░░░░░  32% (23/72 tasks)
```

**Current Status**: ✅ Phase 1 & 2 COMPLETE | 🔄 Phase 3 In Progress | 🎯 Real-time Crew Activity & Quick Plans Live

---

## 🎯 Quick Commands

**How to use this execution roadmap**:

- **"Execute the next task"** - I'll find the next ⏳ NOT_STARTED task and implement it
- **"Continue execution"** - I'll resume from wherever we left off
- **"Execute Phase X"** - I'll complete an entire phase
- **"Show current progress"** - I'll summarize what's done and what's next
- **"Skip to Phase X"** - I'll update dependencies and jump ahead (not recommended)
- **"Review Phase X"** - I'll validate all tasks in a phase are properly completed

**Status Legend**:
- ✅ COMPLETED - Task is done and validated
- 🔄 IN_PROGRESS - Currently being worked on
- ⏳ NOT_STARTED - Ready to be executed
- ⏸️ BLOCKED - Waiting on dependency or decision
- ⚠️ NEEDS_REVIEW - Implementation complete, needs validation
- ❌ FAILED - Attempted but needs retry/rework

---

## 📋 PHASE 1: Foundation ✅ COMPLETE

**Goal**: Build core crew system and remove mock data
**Status**: ✅ COMPLETED (100% complete - 12/12 tasks)
**Completion Date**: 2025-11-21
**Critical Path**: DELIVERED - All features implemented and tested

### Final Deliverables

**What Was Built**:
- ✅ 5 Supabase crew tables with RLS
- ✅ Complete Zustand crew store
- ✅ 5 crew UI components
- ✅ 5 crew screens
- ✅ Messages tab replaced with Crew
- ✅ Mock data removed
- ✅ Error handling system
- ✅ Integration testing checklist
- ✅ TypeScript strict mode - zero errors
- ✅ Production-ready crew system

**See**: `PHASE_1_COMPLETE.md` for full details

---

### Task P1-T01: Database Schema - Crew Tables

**Status**: ✅ COMPLETED
**Priority**: 🔴 CRITICAL
**Estimated Time**: 2 hours
**Dependencies**: None

**Files to Create**:
- `DATABASE_MIGRATION_CREWS.sql`

**Files to Modify**:
- `SUPABASE_SETUP.md` (document new tables)

**Description**:
Create all crew-related database tables with proper RLS policies.

**Subtasks**:
- [ ] Create `party_crews` table
- [ ] Create `crew_members` table
- [ ] Create `crew_invites` table
- [ ] Create `crew_activity` table
- [ ] Create `crew_vouches` table
- [ ] Set up RLS policies for all tables
- [ ] Create indexes for performance
- [ ] Test policies with sample data

**SQL Implementation**:
```sql
-- party_crews table
CREATE TABLE party_crews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  avatar_url TEXT,
  crew_type TEXT CHECK (crew_type IN ('inner', 'extended', 'open')) DEFAULT 'extended',
  privacy_setting TEXT CHECK (privacy_setting IN ('private', 'closed', 'public')) DEFAULT 'private',
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  member_count INTEGER DEFAULT 1,
  reputation_score INTEGER DEFAULT 0,
  theme_color TEXT DEFAULT '#8B5CF6',
  active_status BOOLEAN DEFAULT true
);

-- crew_members table
CREATE TABLE crew_members (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  crew_id UUID REFERENCES party_crews(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT CHECK (role IN ('owner', 'admin', 'member')) DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  invitation_status TEXT CHECK (invitation_status IN ('pending', 'accepted', 'declined')) DEFAULT 'accepted',
  invited_by UUID REFERENCES auth.users(id),
  notification_preferences JSONB DEFAULT '{"all": true, "mentions": true, "parties": true}',
  is_active BOOLEAN DEFAULT true,
  UNIQUE(crew_id, user_id)
);

-- crew_invites table
CREATE TABLE crew_invites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  crew_id UUID REFERENCES party_crews(id) ON DELETE CASCADE,
  inviter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  invitee_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  status TEXT CHECK (status IN ('pending', 'accepted', 'declined')) DEFAULT 'pending',
  message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(crew_id, invitee_id, inviter_id)
);

-- crew_activity table
CREATE TABLE crew_activity (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  crew_id UUID REFERENCES party_crews(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL,
  actor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  visibility TEXT CHECK (visibility IN ('crew_only', 'public')) DEFAULT 'crew_only'
);

-- crew_vouches table
CREATE TABLE crew_vouches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  voucher_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  vouched_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  crew_id UUID REFERENCES party_crews(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(voucher_id, vouched_user_id)
);

-- Indexes
CREATE INDEX idx_crew_members_user ON crew_members(user_id);
CREATE INDEX idx_crew_members_crew ON crew_members(crew_id);
CREATE INDEX idx_crew_activity_crew ON crew_activity(crew_id, created_at DESC);
CREATE INDEX idx_crew_invites_invitee ON crew_invites(invitee_id, status);

-- RLS Policies
ALTER TABLE party_crews ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE crew_vouches ENABLE ROW LEVEL SECURITY;

-- party_crews policies
CREATE POLICY "Public crews are viewable by everyone"
  ON party_crews FOR SELECT
  USING (privacy_setting = 'public' OR active_status = true);

CREATE POLICY "Crew members can view their crews"
  ON party_crews FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM crew_members
      WHERE crew_id = party_crews.id AND is_active = true
    )
  );

CREATE POLICY "Users can create crews"
  ON party_crews FOR INSERT
  WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Crew owners can update their crews"
  ON party_crews FOR UPDATE
  USING (
    auth.uid() IN (
      SELECT user_id FROM crew_members
      WHERE crew_id = party_crews.id AND role = 'owner'
    )
  );

-- crew_members policies
CREATE POLICY "Crew members can view their crew's members"
  ON crew_members FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM crew_members cm
      WHERE cm.crew_id = crew_members.crew_id AND cm.is_active = true
    )
  );

CREATE POLICY "Crew admins can add members"
  ON crew_members FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM crew_members
      WHERE crew_id = crew_members.crew_id AND role IN ('owner', 'admin')
    )
  );

-- crew_invites policies
CREATE POLICY "Users can view their own invites"
  ON crew_invites FOR SELECT
  USING (auth.uid() = invitee_id OR auth.uid() = inviter_id);

CREATE POLICY "Crew members can invite others"
  ON crew_invites FOR INSERT
  WITH CHECK (
    auth.uid() IN (
      SELECT user_id FROM crew_members
      WHERE crew_id = crew_invites.crew_id AND is_active = true
    )
  );

-- crew_activity policies
CREATE POLICY "Crew members can view crew activity"
  ON crew_activity FOR SELECT
  USING (
    auth.uid() IN (
      SELECT user_id FROM crew_members
      WHERE crew_id = crew_activity.crew_id AND is_active = true
    )
  );

CREATE POLICY "Crew members can create activity"
  ON crew_activity FOR INSERT
  WITH CHECK (auth.uid() = actor_id);

-- crew_vouches policies
CREATE POLICY "Users can view vouches"
  ON crew_vouches FOR SELECT
  USING (true);

CREATE POLICY "Users can vouch for others"
  ON crew_vouches FOR INSERT
  WITH CHECK (auth.uid() = voucher_id);
```

**Acceptance Criteria**:
- [ ] All tables created in Supabase
- [ ] RLS policies tested and working
- [ ] Can create crew as authenticated user
- [ ] Can't view private crews without membership
- [ ] Indexes improve query performance
- [ ] No SQL errors in Supabase logs

**Validation Query**:
```sql
-- Test crew creation and membership
SELECT
  pc.name,
  pc.crew_type,
  COUNT(cm.id) as member_count
FROM party_crews pc
LEFT JOIN crew_members cm ON pc.id = cm.crew_id
GROUP BY pc.id;
```

---

### Task P1-T02: Crew Zustand Store

**Status**: ⏳ NOT_STARTED
**Priority**: 🔴 CRITICAL
**Estimated Time**: 2 hours
**Dependencies**: P1-T01 (Database tables must exist)

**Files to Create**:
- `src/store/crewStore.ts`
- `src/types/crew.ts`

**Description**:
Create Zustand store for crew state management with Supabase integration.

**TypeScript Types**:
```typescript
// src/types/crew.ts
export type CrewType = 'inner' | 'extended' | 'open';
export type CrewPrivacy = 'private' | 'closed' | 'public';
export type CrewRole = 'owner' | 'admin' | 'member';
export type InviteStatus = 'pending' | 'accepted' | 'declined';

export interface Crew {
  id: string;
  name: string;
  description: string | null;
  avatar_url: string | null;
  crew_type: CrewType;
  privacy_setting: CrewPrivacy;
  created_by: string;
  created_at: string;
  updated_at: string;
  member_count: number;
  reputation_score: number;
  theme_color: string;
  active_status: boolean;
}

export interface CrewMember {
  id: string;
  crew_id: string;
  user_id: string;
  role: CrewRole;
  joined_at: string;
  invitation_status: InviteStatus;
  invited_by: string | null;
  notification_preferences: {
    all: boolean;
    mentions: boolean;
    parties: boolean;
  };
  is_active: boolean;
  // Joined user data
  user?: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
}

export interface CrewInvite {
  id: string;
  crew_id: string;
  inviter_id: string;
  invitee_id: string;
  status: InviteStatus;
  message: string | null;
  created_at: string;
  expires_at: string | null;
  // Joined data
  crew?: Crew;
  inviter?: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
}

export interface CrewActivity {
  id: string;
  crew_id: string;
  activity_type: string;
  actor_id: string;
  metadata: Record<string, any>;
  created_at: string;
  visibility: 'crew_only' | 'public';
  // Joined data
  actor?: {
    id: string;
    username: string;
    avatar_url: string | null;
  };
}
```

**Store Implementation**:
```typescript
// src/store/crewStore.ts
import { create } from 'zustand';
import { supabase } from '@/lib/supabase';
import type {
  Crew,
  CrewMember,
  CrewInvite,
  CrewActivity,
  CrewType,
  CrewPrivacy
} from '@/types/crew';

interface CrewStore {
  // State
  crews: Crew[];
  myCrews: Crew[];
  currentCrew: Crew | null;
  crewMembers: Record<string, CrewMember[]>;
  crewActivity: Record<string, CrewActivity[]>;
  pendingInvites: CrewInvite[];
  loading: boolean;
  error: string | null;

  // Actions
  fetchMyCrews: () => Promise<void>;
  fetchCrew: (crewId: string) => Promise<void>;
  fetchCrewMembers: (crewId: string) => Promise<void>;
  fetchCrewActivity: (crewId: string) => Promise<void>;
  fetchPendingInvites: () => Promise<void>;

  createCrew: (data: {
    name: string;
    description?: string;
    crew_type: CrewType;
    privacy_setting: CrewPrivacy;
    theme_color?: string;
  }) => Promise<Crew | null>;

  updateCrew: (crewId: string, data: Partial<Crew>) => Promise<void>;
  deleteCrew: (crewId: string) => Promise<void>;

  inviteToCrew: (crewId: string, userId: string, message?: string) => Promise<void>;
  respondToInvite: (inviteId: string, accept: boolean) => Promise<void>;

  addCrewMember: (crewId: string, userId: string) => Promise<void>;
  removeCrewMember: (crewId: string, userId: string) => Promise<void>;
  updateMemberRole: (crewId: string, userId: string, role: 'admin' | 'member') => Promise<void>;

  leaveCrew: (crewId: string) => Promise<void>;

  setCurrentCrew: (crew: Crew | null) => void;
  clearError: () => void;
}

export const useCrewStore = create<CrewStore>((set, get) => ({
  // Initial state
  crews: [],
  myCrews: [],
  currentCrew: null,
  crewMembers: {},
  crewActivity: {},
  pendingInvites: [],
  loading: false,
  error: null,

  // Fetch user's crews
  fetchMyCrews: async () => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('crew_members')
        .select(`
          crew:party_crews(*)
        `)
        .eq('user_id', user.id)
        .eq('is_active', true)
        .order('joined_at', { ascending: false });

      if (error) throw error;

      const crews = data?.map(item => item.crew).filter(Boolean) || [];
      set({ myCrews: crews, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  // Fetch single crew
  fetchCrew: async (crewId: string) => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('party_crews')
        .select('*')
        .eq('id', crewId)
        .single();

      if (error) throw error;
      set({ currentCrew: data, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  // Fetch crew members
  fetchCrewMembers: async (crewId: string) => {
    try {
      const { data, error } = await supabase
        .from('crew_members')
        .select(`
          *,
          user:users(id, username, avatar_url)
        `)
        .eq('crew_id', crewId)
        .eq('is_active', true)
        .order('role', { ascending: true })
        .order('joined_at', { ascending: true });

      if (error) throw error;

      set(state => ({
        crewMembers: {
          ...state.crewMembers,
          [crewId]: data || []
        }
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  // Fetch crew activity
  fetchCrewActivity: async (crewId: string) => {
    try {
      const { data, error } = await supabase
        .from('crew_activity')
        .select(`
          *,
          actor:users(id, username, avatar_url)
        `)
        .eq('crew_id', crewId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      set(state => ({
        crewActivity: {
          ...state.crewActivity,
          [crewId]: data || []
        }
      }));
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  // Fetch pending invites
  fetchPendingInvites: async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('crew_invites')
        .select(`
          *,
          crew:party_crews(*),
          inviter:users(id, username, avatar_url)
        `)
        .eq('invitee_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      set({ pendingInvites: data || [] });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  // Create crew
  createCrew: async (data) => {
    set({ loading: true, error: null });
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Create crew
      const { data: crew, error: crewError } = await supabase
        .from('party_crews')
        .insert({
          ...data,
          created_by: user.id
        })
        .select()
        .single();

      if (crewError) throw crewError;

      // Add creator as owner
      const { error: memberError } = await supabase
        .from('crew_members')
        .insert({
          crew_id: crew.id,
          user_id: user.id,
          role: 'owner',
          invitation_status: 'accepted'
        });

      if (memberError) throw memberError;

      // Create activity
      await supabase.from('crew_activity').insert({
        crew_id: crew.id,
        activity_type: 'crew_created',
        actor_id: user.id,
        metadata: { crew_name: crew.name }
      });

      // Refresh crews
      await get().fetchMyCrews();

      set({ loading: false });
      return crew;
    } catch (error: any) {
      set({ error: error.message, loading: false });
      return null;
    }
  },

  // Update crew
  updateCrew: async (crewId, data) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('party_crews')
        .update({ ...data, updated_at: new Date().toISOString() })
        .eq('id', crewId);

      if (error) throw error;

      await get().fetchMyCrews();
      if (get().currentCrew?.id === crewId) {
        await get().fetchCrew(crewId);
      }

      set({ loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  // Delete crew
  deleteCrew: async (crewId) => {
    set({ loading: true, error: null });
    try {
      const { error } = await supabase
        .from('party_crews')
        .update({ active_status: false })
        .eq('id', crewId);

      if (error) throw error;

      await get().fetchMyCrews();
      set({ loading: false, currentCrew: null });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  // Invite to crew
  inviteToCrew: async (crewId, userId, message) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('crew_invites')
        .insert({
          crew_id: crewId,
          inviter_id: user.id,
          invitee_id: userId,
          message,
          expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        });

      if (error) throw error;

      // Create activity
      await supabase.from('crew_activity').insert({
        crew_id: crewId,
        activity_type: 'member_invited',
        actor_id: user.id,
        metadata: { invitee_id: userId }
      });
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  // Respond to invite
  respondToInvite: async (inviteId, accept) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Get invite details
      const { data: invite, error: fetchError } = await supabase
        .from('crew_invites')
        .select('*')
        .eq('id', inviteId)
        .single();

      if (fetchError) throw fetchError;

      // Update invite status
      const { error: updateError } = await supabase
        .from('crew_invites')
        .update({ status: accept ? 'accepted' : 'declined' })
        .eq('id', inviteId);

      if (updateError) throw updateError;

      // If accepted, add to crew
      if (accept) {
        await get().addCrewMember(invite.crew_id, user.id);
      }

      // Refresh invites
      await get().fetchPendingInvites();
      await get().fetchMyCrews();
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  // Add crew member
  addCrewMember: async (crewId, userId) => {
    try {
      const { error } = await supabase
        .from('crew_members')
        .insert({
          crew_id: crewId,
          user_id: userId,
          role: 'member',
          invitation_status: 'accepted'
        });

      if (error) throw error;

      // Update member count
      const { data: crew } = await supabase
        .from('party_crews')
        .select('member_count')
        .eq('id', crewId)
        .single();

      await supabase
        .from('party_crews')
        .update({ member_count: (crew?.member_count || 0) + 1 })
        .eq('id', crewId);

      // Create activity
      await supabase.from('crew_activity').insert({
        crew_id: crewId,
        activity_type: 'member_joined',
        actor_id: userId,
        metadata: {}
      });

      await get().fetchCrewMembers(crewId);
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  // Remove crew member
  removeCrewMember: async (crewId, userId) => {
    try {
      const { error } = await supabase
        .from('crew_members')
        .update({ is_active: false })
        .eq('crew_id', crewId)
        .eq('user_id', userId);

      if (error) throw error;

      // Update member count
      const { data: crew } = await supabase
        .from('party_crews')
        .select('member_count')
        .eq('id', crewId)
        .single();

      await supabase
        .from('party_crews')
        .update({ member_count: Math.max(0, (crew?.member_count || 1) - 1) })
        .eq('id', crewId);

      // Create activity
      const { data: { user } } = await supabase.auth.getUser();
      await supabase.from('crew_activity').insert({
        crew_id: crewId,
        activity_type: 'member_removed',
        actor_id: user?.id,
        metadata: { removed_user_id: userId }
      });

      await get().fetchCrewMembers(crewId);
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  // Update member role
  updateMemberRole: async (crewId, userId, role) => {
    try {
      const { error } = await supabase
        .from('crew_members')
        .update({ role })
        .eq('crew_id', crewId)
        .eq('user_id', userId);

      if (error) throw error;

      await get().fetchCrewMembers(crewId);
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  // Leave crew
  leaveCrew: async (crewId) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      await get().removeCrewMember(crewId, user.id);
      await get().fetchMyCrews();
    } catch (error: any) {
      set({ error: error.message });
    }
  },

  // Set current crew
  setCurrentCrew: (crew) => set({ currentCrew: crew }),

  // Clear error
  clearError: () => set({ error: null })
}));
```

**Acceptance Criteria**:
- [ ] Store created with all CRUD operations
- [ ] Can fetch user's crews from Supabase
- [ ] Can create new crew
- [ ] Can invite members to crew
- [ ] Can accept/decline invites
- [ ] Can manage crew members (add, remove, update role)
- [ ] Real-time updates work (optional in Phase 1)
- [ ] Error handling works properly
- [ ] TypeScript types are correct

---

### Task P1-T03: Remove Mock Party Data

**Status**: ⏳ NOT_STARTED
**Priority**: 🔴 CRITICAL
**Estimated Time**: 1 hour
**Dependencies**: None

**Files to Modify**:
- `src/store/partyStore.ts`
- `src/app/(tabs)/index.tsx`

**Description**:
Remove all hardcoded mock party data and ensure app fetches real data from Supabase.

**Subtasks**:
- [ ] Remove MOCK_PARTIES array from partyStore
- [ ] Ensure fetchParties uses Supabase query
- [ ] Add proper loading states
- [ ] Add empty state UI for no parties
- [ ] Test with empty database
- [ ] Test with real parties

**Implementation Steps**:

1. **Update partyStore.ts**:
```typescript
// Remove any mock data arrays
// Ensure fetchParties looks like this:
fetchParties: async () => {
  set({ loading: true, error: null });
  try {
    const { data, error } = await supabase
      .from('parties')
      .select(`
        *,
        host:users!parties_host_id_fkey(id, username, avatar_url),
        attendees:party_attendees(
          id,
          user:users(id, username, avatar_url),
          status,
          checked_in
        )
      `)
      .eq('status', 'active')
      .gte('date', new Date().toISOString())
      .order('date', { ascending: true })
      .limit(50);

    if (error) throw error;
    set({ parties: data || [], loading: false });
  } catch (error: any) {
    set({ error: error.message, loading: false, parties: [] });
  }
},
```

2. **Update Discovery Screen**:
```typescript
// src/app/(tabs)/index.tsx
// Add empty state
{parties.length === 0 && !loading && (
  <View style={styles.emptyState}>
    <Ionicons name="calendar-outline" size={64} color={colors.textSecondary} />
    <Text style={styles.emptyTitle}>No Parties Yet</Text>
    <Text style={styles.emptyDescription}>
      Be the first to create a party in your area!
    </Text>
    <Button
      title="Create Party"
      onPress={() => router.push('/party/create')}
      variant="primary"
    />
  </View>
)}
```

**Acceptance Criteria**:
- [ ] No mock data in codebase
- [ ] Parties fetch from Supabase successfully
- [ ] Empty state shows when no parties
- [ ] Loading state displays during fetch
- [ ] Error handling works
- [ ] App doesn't crash with empty data

---

### Task P1-T04: Basic Crew Components

**Status**: ⏳ NOT_STARTED
**Priority**: 🟡 HIGH
**Estimated Time**: 3 hours
**Dependencies**: P1-T02 (Store must exist)

**Files to Create**:
- `src/components/crew/CrewCard.tsx`
- `src/components/crew/CrewAvatar.tsx`
- `src/components/crew/CrewMemberItem.tsx`
- `src/components/crew/CrewInviteCard.tsx`

**Description**:
Create reusable UI components for crew display.

**Component 1: CrewAvatar**:
```typescript
// src/components/crew/CrewAvatar.tsx
import { View, Image, Text, StyleSheet } from 'react-native';
import { colors } from '@/constants/colors';

interface CrewAvatarProps {
  avatarUrl?: string | null;
  name: string;
  size?: number;
  themeColor?: string;
}

export function CrewAvatar({ avatarUrl, name, size = 48, themeColor }: CrewAvatarProps) {
  const initials = name
    .split(' ')
    .map(word => word[0])
    .join('')
    .toUpperCase()
    .substring(0, 2);

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      {avatarUrl ? (
        <Image source={{ uri: avatarUrl }} style={styles.image} />
      ) : (
        <View style={[styles.placeholder, { backgroundColor: themeColor || colors.primary }]}>
          <Text style={[styles.initials, { fontSize: size * 0.4 }]}>{initials}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 999,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: colors.white,
    fontWeight: '700',
  },
});
```

**Component 2: CrewCard**:
```typescript
// src/components/crew/CrewCard.tsx
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { BlurView } from 'expo-blur';
import { CrewAvatar } from './CrewAvatar';
import { colors, spacing } from '@/constants/colors';
import type { Crew } from '@/types/crew';

interface CrewCardProps {
  crew: Crew;
  onPress?: () => void;
}

export function CrewCard({ crew, onPress }: CrewCardProps) {
  return (
    <Pressable onPress={onPress} style={styles.container}>
      <BlurView intensity={20} tint="dark" style={styles.blur}>
        <View style={styles.content}>
          <CrewAvatar
            avatarUrl={crew.avatar_url}
            name={crew.name}
            size={56}
            themeColor={crew.theme_color}
          />

          <View style={styles.info}>
            <Text style={styles.name} numberOfLines={1}>
              {crew.name}
            </Text>
            {crew.description && (
              <Text style={styles.description} numberOfLines={2}>
                {crew.description}
              </Text>
            )}
            <View style={styles.meta}>
              <Text style={styles.metaText}>
                {crew.member_count} {crew.member_count === 1 ? 'member' : 'members'}
              </Text>
              <Text style={styles.metaText}>•</Text>
              <Text style={styles.metaText}>{crew.crew_type}</Text>
            </View>
          </View>
        </View>
      </BlurView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
    borderRadius: 16,
    overflow: 'hidden',
  },
  blur: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  content: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.md,
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.white,
    marginBottom: spacing.xs,
  },
  description: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
  },
  meta: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  metaText: {
    fontSize: 12,
    color: colors.textSecondary,
    textTransform: 'capitalize',
  },
});
```

**Acceptance Criteria**:
- [ ] All components created and typed
- [ ] Components render properly
- [ ] Proper styling with glassmorphism
- [ ] Avatar shows initials if no image
- [ ] Theme colors work
- [ ] Pressable states work
- [ ] Accessibility labels added

---

### Task P1-T05: Crew Tab Shell (Replace Messages)

**Status**: ⏳ NOT_STARTED
**Priority**: 🟡 HIGH
**Estimated Time**: 2 hours
**Dependencies**: P1-T04 (Components must exist)

**Files to Modify**:
- `src/app/(tabs)/crew.tsx` (rename from messages.tsx)
- `src/app/(tabs)/_layout.tsx`

**Files to Create**:
- `src/app/crew/[id].tsx` (crew detail screen)
- `src/app/crew/create.tsx` (crew creation screen)

**Description**:
Replace Messages tab with Crews tab and basic layout.

**Implementation**:

1. **Rename and update crew tab**:
```typescript
// src/app/(tabs)/crew.tsx
import { View, Text, StyleSheet, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useCrewStore } from '@/store/crewStore';
import { CrewCard } from '@/components/crew/CrewCard';
import { Button } from '@/components/ui/Button';
import { colors, spacing } from '@/constants/colors';

export default function CrewScreen() {
  const { myCrews, pendingInvites, loading, fetchMyCrews, fetchPendingInvites } = useCrewStore();

  useEffect(() => {
    fetchMyCrews();
    fetchPendingInvites();
  }, []);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Crews</Text>
        <Pressable
          onPress={() => router.push('/crew/create')}
          style={styles.createButton}
        >
          <Ionicons name="add" size={24} color={colors.white} />
        </Pressable>
      </View>

      {/* Pending Invites */}
      {pendingInvites.length > 0 && (
        <View style={styles.invitesSection}>
          <Text style={styles.sectionTitle}>
            Pending Invites ({pendingInvites.length})
          </Text>
          {/* TODO: Add invite cards */}
        </View>
      )}

      {/* My Crews */}
      <View style={styles.content}>
        {loading && myCrews.length === 0 ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading crews...</Text>
          </View>
        ) : myCrews.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color={colors.textSecondary} />
            <Text style={styles.emptyTitle}>No Crews Yet</Text>
            <Text style={styles.emptyDescription}>
              Create or join a crew to start partying together
            </Text>
            <Button
              title="Create Your First Crew"
              onPress={() => router.push('/crew/create')}
              variant="primary"
            />
          </View>
        ) : (
          <FlatList
            data={myCrews}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <CrewCard
                crew={item}
                onPress={() => router.push(`/crew/${item.id}`)}
              />
            )}
            contentContainerStyle={styles.list}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.white,
  },
  createButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  invitesSection: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.white,
    marginBottom: spacing.sm,
  },
  content: {
    flex: 1,
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.white,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  emptyDescription: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
});
```

2. **Update tab layout**:
```typescript
// src/app/(tabs)/_layout.tsx
// Update tab to use 'crew' instead of 'messages'
<Tabs.Screen
  name="crew"
  options={{
    title: 'Crews',
    tabBarIcon: ({ color, size }) => (
      <Ionicons name="people" size={size} color={color} />
    ),
  }}
/>
```

**Acceptance Criteria**:
- [ ] Messages tab renamed to Crew
- [ ] Tab icon updated to people icon
- [ ] Basic crew list displays
- [ ] Create button navigates to create screen
- [ ] Empty state shows when no crews
- [ ] Loading state works
- [ ] Can navigate to crew detail (placeholder)

---

### Task P1-T06: Basic Crew Creation Flow

**Status**: ⏳ NOT_STARTED
**Priority**: 🟡 HIGH
**Estimated Time**: 3 hours
**Dependencies**: P1-T02, P1-T04, P1-T05

**Files to Create**:
- `src/app/crew/create.tsx`

**Description**:
Create basic crew creation screen with name, type, and privacy settings.

**Implementation**:
```typescript
// src/app/crew/create.tsx
import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, ScrollView, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useCrewStore } from '@/store/crewStore';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { colors, spacing } from '@/constants/colors';
import type { CrewType, CrewPrivacy } from '@/types/crew';

const CREW_TYPES: { value: CrewType; label: string; description: string }[] = [
  { value: 'inner', label: 'Inner Circle', description: '2-8 close friends' },
  { value: 'extended', label: 'Extended Crew', description: '8-20 friends' },
  { value: 'open', label: 'Open Crew', description: 'Unlimited members' },
];

const PRIVACY_SETTINGS: { value: CrewPrivacy; label: string; description: string }[] = [
  { value: 'private', label: 'Private', description: 'Invite-only, hidden from search' },
  { value: 'closed', label: 'Closed', description: 'Visible, request to join' },
  { value: 'public', label: 'Public', description: 'Anyone can join' },
];

const THEME_COLORS = [
  '#FF6B6B', // Coral (primary)
  '#8B5CF6', // Violet (crew default)
  '#06B6D4', // Cyan
  '#FBBF24', // Gold
  '#10B981', // Green
  '#F59E0B', // Orange
  '#EC4899', // Pink
  '#6366F1', // Indigo
];

export default function CreateCrewScreen() {
  const { createCrew, loading } = useCrewStore();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [crewType, setCrewType] = useState<CrewType>('extended');
  const [privacy, setPrivacy] = useState<CrewPrivacy>('private');
  const [themeColor, setThemeColor] = useState(THEME_COLORS[1]);

  const handleCreate = async () => {
    if (!name.trim()) return;

    const crew = await createCrew({
      name: name.trim(),
      description: description.trim() || undefined,
      crew_type: crewType,
      privacy_setting: privacy,
      theme_color: themeColor,
    });

    if (crew) {
      router.back();
      // Optionally navigate to crew detail
      // router.push(`/crew/${crew.id}`);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Ionicons name="close" size={28} color={colors.white} />
        </Pressable>
        <Text style={styles.title}>Create Crew</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Name */}
        <View style={styles.section}>
          <Text style={styles.label}>Crew Name *</Text>
          <Input
            value={name}
            onChangeText={setName}
            placeholder="The Squad"
            maxLength={50}
          />
        </View>

        {/* Description */}
        <View style={styles.section}>
          <Text style={styles.label}>Description (optional)</Text>
          <Input
            value={description}
            onChangeText={setDescription}
            placeholder="Tell people about your crew"
            multiline
            numberOfLines={3}
            maxLength={200}
          />
        </View>

        {/* Crew Type */}
        <View style={styles.section}>
          <Text style={styles.label}>Crew Type</Text>
          {CREW_TYPES.map(type => (
            <Pressable
              key={type.value}
              onPress={() => setCrewType(type.value)}
              style={[
                styles.option,
                crewType === type.value && styles.optionSelected
              ]}
            >
              <View style={styles.optionContent}>
                <Text style={styles.optionLabel}>{type.label}</Text>
                <Text style={styles.optionDescription}>{type.description}</Text>
              </View>
              {crewType === type.value && (
                <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
              )}
            </Pressable>
          ))}
        </View>

        {/* Privacy */}
        <View style={styles.section}>
          <Text style={styles.label}>Privacy</Text>
          {PRIVACY_SETTINGS.map(setting => (
            <Pressable
              key={setting.value}
              onPress={() => setPrivacy(setting.value)}
              style={[
                styles.option,
                privacy === setting.value && styles.optionSelected
              ]}
            >
              <View style={styles.optionContent}>
                <Text style={styles.optionLabel}>{setting.label}</Text>
                <Text style={styles.optionDescription}>{setting.description}</Text>
              </View>
              {privacy === setting.value && (
                <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
              )}
            </Pressable>
          ))}
        </View>

        {/* Theme Color */}
        <View style={styles.section}>
          <Text style={styles.label}>Theme Color</Text>
          <View style={styles.colorGrid}>
            {THEME_COLORS.map(color => (
              <Pressable
                key={color}
                onPress={() => setThemeColor(color)}
                style={[
                  styles.colorOption,
                  { backgroundColor: color },
                  themeColor === color && styles.colorSelected
                ]}
              >
                {themeColor === color && (
                  <Ionicons name="checkmark" size={20} color={colors.white} />
                )}
              </Pressable>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Create Button */}
      <View style={styles.footer}>
        <Button
          title="Create Crew"
          onPress={handleCreate}
          disabled={!name.trim() || loading}
          loading={loading}
          variant="primary"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: colors.white,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.xl,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
    marginBottom: spacing.sm,
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: spacing.sm,
  },
  optionSelected: {
    backgroundColor: 'rgba(255, 107, 107, 0.1)',
    borderColor: colors.primary,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: colors.textSecondary,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  colorOption: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorSelected: {
    borderColor: colors.white,
  },
  footer: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
  },
});
```

**Acceptance Criteria**:
- [ ] Can create crew with name
- [ ] Can select crew type
- [ ] Can select privacy setting
- [ ] Can choose theme color
- [ ] Validation prevents empty names
- [ ] Loading state works
- [ ] Redirects to crew list after creation
- [ ] Crew appears in My Crews immediately

---

### Remaining Phase 1 Tasks Summary

**Task P1-T07**: Crew Detail Screen (basic view)
**Task P1-T08**: Crew Member Management UI
**Task P1-T09**: Crew Invite Flow
**Task P1-T10**: RLS Policy Testing
**Task P1-T11**: Error Handling & Edge Cases
**Task P1-T12**: Phase 1 Integration Testing
**Task P1-T13**: Update Navigation Structure
**Task P1-T14**: Add Loading States
**Task P1-T15**: Phase 1 Code Review & Cleanup

---

## 📋 PHASE 2: Party Creation Overhaul ✅ COMPLETE

**Goal**: Dual-mode party creation with vibe system
**Status**: ✅ COMPLETED (100% complete - 9/9 tasks)
**Completion Date**: 2025-11-22
**Critical Path**: DELIVERED - Dual-mode creation, camera integration, co-hosts, templates

### Final Deliverables

**What Was Built**:
- ✅ Enhanced parties database schema (creation_mode, vibe_tags, energy_level, 5 new tables)
- ✅ Complete TypeScript types (14 vibe tags, co-host permissions, templates, quick plans)
- ✅ Quick Create Mode (<15 second flow with camera integration)
- ✅ Full camera capture + crop + upload system (4 new screens, 3 components)
- ✅ Planned Party Mode (full wizard with all fields)
- ✅ Co-Host System (permissions, management UI)
- ✅ Party Templates (create, save, reuse configurations)
- ✅ Vibe tracking & energy meter (real-time updates)
- ✅ Crew Bulk Invite (select crew, invite all members)

### Tasks Overview (All Complete)

- ✅ **P2-T01**: Party Vibes Database Schema
- ✅ **P2-T02**: Update Party Types & Store
- ✅ **P2-T03**: Quick Create Mode UI
- ✅ **P2-T04**: Camera Integration for Quick Create
- ✅ **P2-T05**: Planned Party Mode UI
- ✅ **P2-T06**: Co-Host System
- ✅ **P2-T07**: Party Templates Feature
- ✅ **P2-T08**: Update Party Detail Screen
- ✅ **P2-T09**: Crew Bulk Invite Integration

---

## 📋 PHASE 3: Crew Features (Weeks 3-4)

**Goal**: Full crew functionality and engagement
**Status**: 🔄 IN_PROGRESS (22% complete - 2/9 tasks)
**Dependencies**: Phase 1 & 2 must be complete ✅

### Tasks Overview

- **P3-T01**: Crew Activity Feed Real-time ✅ COMPLETE
- **P3-T02**: Quick Plans Polling System ✅ COMPLETE
- **P3-T03**: Crew Discovery Algorithm ⏳ NEXT
- **P3-T04**: Crew Search & Filtering
- **P3-T05**: Crew Settings & Management
- **P3-T06**: Notification System
- **P3-T07**: Member Management Advanced
- **P3-T08**: Crew Reputation Scoring
- **P3-T09**: Crew Vouching Feature

### ✅ Completed Tasks

#### Task P3-T01: Crew Activity Feed Real-time
**Status**: ✅ COMPLETED
**Completed**: 2025-11-22
**Commit**: e6d2dec

**Summary**: Implemented real-time subscriptions for crew activity feed using Supabase Realtime channels. Activity updates appear instantly without refresh.

**Files Modified**:
- src/components/crew/ActivityFeed.tsx - Fixed schema reference (users→profiles)
- src/stores/crewStore.ts - Added subscribeToCrewActivity() function
- src/app/crew/invite/[id].tsx - Fixed schema reference (users→profiles)

---

#### Task P3-T02: Quick Plans Polling System
**Status**: ✅ COMPLETED
**Completed**: 2025-11-22
**Commit**: 5d7d97e

**Summary**: Implemented real-time subscriptions for Quick Plans polling system. Vote changes and new plans appear instantly across all crew member devices.

**Features**:
- Dual-channel subscription (plans + votes)
- Real-time vote updates (up/down/interested)
- Live plan creation notifications
- Smart refetch optimization

**Files Modified**:
- src/stores/partyStore.ts - Added subscribeToQuickPlans() with dual-channel subscription
- src/app/crew/[id]/quick-plans.tsx - Integrated real-time subscriptions, fixed type errors

---

## 📋 PHASE 4: Advanced Features (Weeks 4-6)

**Goal**: Innovative features that differentiate the app
**Status**: ⏳ NOT_STARTED (0% complete - 0/9 tasks)
**Dependencies**: Phase 1, 2, 3 must be complete

### Tasks Overview

- **P4-T01**: Live Party Pulse Database
- **P4-T02**: Real-time Energy Tracking UI
- **P4-T03**: Party Memories Database
- **P4-T04**: Collaborative Albums
- **P4-T05**: Auto Highlight Reel Generator
- **P4-T06**: Vibe Matching Algorithm
- **P4-T07**: Trust Score System
- **P4-T08**: Basic Verification Flow
- **P4-T09**: Safety Features (Emergency, Reporting)

---

## 📋 PHASE 5: Polish & Optimization (Weeks 6-8)

**Goal**: Liquid Energy design system and performance
**Status**: ⏳ NOT_STARTED (0% complete - 0/11 tasks)

### Tasks Overview

- **P5-T01**: Animated Gradient System
- **P5-T02**: Haptic Feedback Choreography
- **P5-T03**: Fluid Morphing Card Animations
- **P5-T04**: Depth & Parallax Effects
- **P5-T05**: Image Loading Optimization
- **P5-T06**: Real-time Subscription Management
- **P5-T07**: Offline Support & Queue
- **P5-T08**: Bundle Size Optimization
- **P5-T09**: Performance Profiling
- **P5-T10**: Accessibility Audit
- **P5-T11**: Push Notifications

---

## 📋 PHASE 6: Pre-Launch (Weeks 8-10)

**Goal**: Beta testing and refinement
**Status**: ⏳ NOT_STARTED (0% complete - 0/10 tasks)

---

## 📋 PHASE 7: Launch (Week 10+)

**Goal**: Public launch in 1-2 cities
**Status**: ⏳ NOT_STARTED (0% complete - 0/9 tasks)

---

## 🔄 Execution Workflow

### How I'll Execute This Roadmap

When you say **"execute the next task"** or **"continue execution"**, I will:

1. **Read this file** to find the next ⏳ NOT_STARTED task
2. **Update status** to 🔄 IN_PROGRESS
3. **Execute the task** following the implementation details
4. **Test the implementation** against acceptance criteria
5. **Update status** to ✅ COMPLETED (or ⚠️ NEEDS_REVIEW)
6. **Update progress percentages** for phase and overall
7. **Save this file** with updated progress
8. **Report completion** and ask if you want to continue

### When you say **"show current progress"**, I will:

1. Show overall progress percentage
2. List completed tasks (✅)
3. Show current task if any (🔄)
4. Show next 3 upcoming tasks
5. Identify any blockers (⏸️)
6. Estimate time to phase completion

### When you say **"execute Phase X"**, I will:

1. Validate dependencies are met
2. Execute all tasks in that phase sequentially
3. Run phase integration tests
4. Update all progress tracking
5. Provide phase completion report

---

## 📊 Progress Tracking Template

After each task completion, I'll update this format:

```markdown
### Task PX-TXX: Task Name

**Status**: ✅ COMPLETED
**Completed**: 2025-11-21 14:30
**Time Taken**: 1.5 hours
**Files Modified**:
- src/store/crewStore.ts (created)
- src/types/crew.ts (created)

**Notes**: Implementation successful. All acceptance criteria met.

**Next Steps**: Proceed to P1-T03
```

---

## ⚠️ Important Notes

### Dependencies
- Tasks must be completed in order within each phase
- Phases should be completed sequentially
- Critical path tasks block other tasks
- Database changes require migration before code changes

### Testing
- Each task includes acceptance criteria
- Phase completion requires integration testing
- No phase can be marked complete with failing tests

### Rollback
- Each major task should be a git commit
- Keep track of changes per task for easy rollback
- Test rollback procedures during Phase 1

### Communication
- I'll ask for clarification if requirements are unclear
- I'll report blockers immediately
- I'll suggest improvements when I see them
- I'll validate with you before major architectural decisions

---

## 🎯 Current State Summary

**What Works Now**:
- ✅ Authentication (login, signup, onboarding)
- ✅ Basic party discovery
- ✅ Party detail view
- ✅ Party creation (old multi-step)
- ✅ Passport stats
- ✅ Profile
- ✅ Supabase connection

**What's Being Built** (Phase 1):
- 🔄 Crew system (database, store, UI)
- 🔄 Messages → Crews tab replacement
- 🔄 Remove mock data

**What's Next**:
- ⏳ Party creation redesign (Phase 2)
- ⏳ Live features (Phase 4)
- ⏳ Design system overhaul (Phase 5)

---

**Ready to execute! Just say:**
- "Execute the next task"
- "Continue execution"
- "Show current progress"
- "Execute Phase 1"

And I'll get to work! 🚀
