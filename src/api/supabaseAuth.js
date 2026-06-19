/**
 * Supabase Auth service — drop-in replacement for base44.auth
 * Covers: me, updateMe, logout, redirectToLogin, isAuthenticated
 */
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

async function getProfile(userId) {
  try {
    const { data } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    return data || {};
  } catch (error) {
    // Profile doesn't exist or REST API error - return empty object
    console.warn('Could not fetch profile:', error?.message);
    return {};
  }
}

export const auth = {
  /** Returns the current user with auth metadata and profile data */
  async me() {
    try {
      if (!isSupabaseConfigured) {
        throw new Error('[Supabase] Not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.local');
      }

      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) throw Object.assign(new Error('Not authenticated'), { status: 401 });

      // Get profile from database (with fallback on network errors)
      const profile = await getProfile(user.id).catch(() => ({}));

      // Merge auth metadata with database profile
      return {
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? '',
        onboarding_complete: user.user_metadata?.onboarding_complete ?? profile?.onboarding_complete ?? false,
        avatar: user.user_metadata?.avatar ?? profile?.avatar ?? null,
        phone: user.user_metadata?.phone ?? profile?.phone ?? null,
        scout_rank: user.user_metadata?.scout_rank ?? profile?.scout_rank ?? null,
        scout_id: user.user_metadata?.scout_id ?? profile?.scout_id ?? null,
        date_of_birth: user.user_metadata?.date_of_birth ?? profile?.date_of_birth ?? null,
        has_wood_badge: user.user_metadata?.has_wood_badge ?? false,
        wood_badge_beads: user.user_metadata?.wood_badge_beads ?? null,
        unit_id: user.user_metadata?.unit_id ?? profile?.unit_id ?? null,
        unit_name: user.user_metadata?.unit_name ?? profile?.unit_name ?? null,
        clan_id: user.user_metadata?.clan_id ?? profile?.clan_id ?? null,
        clan_name: user.user_metadata?.clan_name ?? profile?.clan_name ?? null,
        role: profile?.role ?? 'user',
        ...profile,
      };
    } catch (error) {
      console.error('Auth me() error:', error?.message);
      throw error;
    }
  },

  /** Update the users table for the current user */
  async updateMe(data) {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) throw new Error('Not authenticated');

    // Sync full_name to Supabase auth metadata if provided
    if (data.full_name) {
      await supabase.auth.updateUser({ data: { full_name: data.full_name } });
    }

    // Update the users table
    const { error: updateError } = await supabase
      .from('users')
      .update({ ...data, updated_date: new Date().toISOString() })
      .eq('id', user.id);

    if (updateError) {
      console.error('Update error:', updateError);
      throw updateError;
    }

    return { id: user.id, email: user.email, ...data };
  },

  /** Sign out and optionally redirect */
  async logout(redirectUrl) {
    await supabase.auth.signOut();
    window.location.href = redirectUrl ?? '/';
  },

  /** Redirect to the login page */
  redirectToLogin(nextUrl) {
    window.location.href = `/login${nextUrl ? `?next=${encodeURIComponent(nextUrl)}` : ''}`;
  },

  /** Returns true if there is an active session */
  async isAuthenticated() {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  },

  /** Expose the supabase client for direct auth ops (signup, signin, resetPassword) */
  supabase,
};
