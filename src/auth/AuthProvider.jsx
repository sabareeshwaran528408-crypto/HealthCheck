import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { AuthContext } from './authContext';
import { supabase } from './supabaseClient';
import {
  getUserDisplayName,
  getUserFirstName,
  getUserInitials,
  formatMemberSince,
} from '../utils/user';

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (active) {
        setSession(nextSession);
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) {
        console.error('Could not restore the authentication session:', error.name);
        setSession(null);
      } else {
        setSession(data.session);
      }
      setLoading(false);
    }).catch((error) => {
      if (!active) return;
      console.error('Could not restore the authentication session:', error.name);
      setSession(null);
      setLoading(false);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  }, []);

  const signUp = useCallback(async (email, password) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
  }, []);

  const signOut = useCallback(async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  }, []);

  const user = session?.user ?? null;

  const profile = useMemo(() => {
    if (!user) return null;
    return {
      displayName: getUserDisplayName(user),
      firstName: getUserFirstName(user),
      initials: getUserInitials(user),
      email: user.email || '',
      avatarUrl: user.user_metadata?.avatar_url || user.user_metadata?.picture || null,
      createdAt: user.created_at || null,
      memberSince: formatMemberSince(user.created_at),
    };
  }, [user]);

  const value = useMemo(() => ({
    session,
    user,
    profile,
    loading,
    signIn,
    signUp,
    signOut,
  }), [session, user, profile, loading, signIn, signUp, signOut]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
