import { create } from 'zustand';
import { create } from 'zustand';
import { getJsonCookie, setJsonCookie } from '@/utils/cookies';
import { supabase } from '@/integrations/supabase/client';

interface VisitorData {
    id: string;
    visitCount: number;
    firstVisit: number;
    lastVisit: number;
}

interface VisitorState {
    isReturning: boolean;
    visitCount: number;
    lastVisit: Date | null;
    initialize: () => void;
}

const VISITOR_COOKIE = 'visitor_tracking';

export const useVisitorStore = create<VisitorState>((set) => ({
    isReturning: false,
    visitCount: 0,
    lastVisit: null,

    initialize: () => {
        const now = Date.now();
        let data = getJsonCookie<VisitorData>(VISITOR_COOKIE);

        if (data) {
            // Returning visitor
            data = {
                ...data,
                visitCount: data.visitCount + 1,
                lastVisit: now
            };
            set({
                isReturning: true,
                visitCount: data.visitCount,
                lastVisit: new Date(data.lastVisit)
            });
        } else {
            // New visitor
            data = {
                id: crypto.randomUUID(),
                visitCount: 1,
                firstVisit: now,
                lastVisit: now
            };
            set({
                isReturning: false,
                visitCount: 1,
                lastVisit: new Date(now)
            });
        }

        // Save cookie (expires in 90 days)
        setJsonCookie(VISITOR_COOKIE, data, { expires: 90 });

        // Sync with Supabase (fire and forget)
        syncWithSupabase(data);
    }
}));

const syncWithSupabase = async (data: VisitorData) => {
    try {
        const { error } = await supabase
            .from('visitor_sessions')
            .upsert({
                visitor_id: data.id,
                visit_count: data.visitCount,
                first_visit: new Date(data.firstVisit).toISOString(),
                last_visit: new Date(data.lastVisit).toISOString(),
                user_agent: navigator.userAgent,
                device_type: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
                referrer: document.referrer || null
            }, {
                onConflict: 'visitor_id'
            });

        if (error) console.error('Error syncing visitor data:', error);
    } catch (err) {
        console.error('Failed to sync visitor data:', err);
    }
};
