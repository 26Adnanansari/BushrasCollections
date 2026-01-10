import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from "@/integrations/supabase/client";
import { AuthUser } from '@/lib/auth';

interface AuthState {
  user: AuthUser | null;
  session: Session | null;
  loading: boolean;
  initialized: boolean;
  onlineUsersCount: number;
  setUser: (user: AuthUser | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      loading: true,
      initialized: false,
      onlineUsersCount: 0,

      setUser: (user) => set({ user }),
      setSession: (session) => set({ session }),
      setLoading: (loading) => set({ loading }),
      setInitialized: (initialized) => set({ initialized }),

      initialize: async () => {
        // Always initialize to ensure fresh auth state
        set({ loading: true, initialized: false });

        try {
          // Helper function to fetch user with roles
          const fetchUserWithRoles = async (userId: string) => {
            try {
              const [profileResult, rolesResult] = await Promise.all([
                supabase
                  .from('profiles')
                  .select('*')
                  .eq('id', userId)
                  .maybeSingle(),
                supabase
                  .from('user_roles')
                  .select('role')
                  .eq('user_id', userId)
              ]);

              const roles = rolesResult.data?.map(r => r.role) || [];

              return {
                profile: profileResult.data,
                roles
              };
            } catch (error) {
              return { profile: null, roles: [] };
            }
          };

          // Set up auth state listener
          supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'TOKEN_REFRESHED') return;

            // Only set loading if we don't have a user yet to prevent unmounting/remounting
            const currentUser = get().user;
            if (!currentUser) {
              set({ session, loading: true });
            } else {
              set({ session });
            }

            if (session?.user) {
              // Fetch profile and roles - must use setTimeout to avoid deadlock
              setTimeout(async () => {
                const { profile, roles } = await fetchUserWithRoles(session.user.id);

                set({
                  user: {
                    ...session.user,
                    profile,
                    roles
                  } as AuthUser,
                  loading: false // NOW set loading false after roles are loaded
                });
              }, 0);
            } else {
              set({ user: null, loading: false });
            }
          });

          // Check for existing session
          const { data: { session } } = await supabase.auth.getSession();

          if (session?.user) {
            set({ session, loading: true });
            const { profile, roles } = await fetchUserWithRoles(session.user.id);

            set({
              user: {
                ...session.user,
                profile,
                roles
              } as AuthUser,
              loading: false,
              initialized: true
            });
          } else {
            set({ session, loading: false, initialized: true });
          }

          // Initialize Presence Tracking
          const presenceChannel = supabase.channel('online-users', {
            config: {
              presence: {
                key: 'user',
              },
            },
          });

          presenceChannel
            .on('presence' as any, { event: 'sync' }, () => {
              const newState = presenceChannel.presenceState();
              const count = Object.keys(newState).length;
              set({ onlineUsersCount: count });
            })
            .subscribe(async (status) => {
              if (status === 'SUBSCRIBED') {
                await presenceChannel.track({
                  online_at: new Date().toISOString(),
                });
              }
            });

        } catch (error) {
          set({ loading: false, initialized: true });
        }
      }
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        // Don't persist session, loading, or initialized - always start fresh
        user: state.user
      }),
    }
  )
);