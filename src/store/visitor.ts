import { create } from 'zustand';
import { getJsonCookie, setJsonCookie } from '@/utils/cookies';
import { supabase } from '@/integrations/supabase/client';

interface VisitorData {
    visitorId: string;
    sessions: SessionData[];
}

interface SessionData {
    sessionId: string;
    lastActivity: number;
    utmSource?: string;
    utmCampaign?: string;
}

interface VisitorState {
    visitorId: string | null;
    initialize: () => Promise<void>;
    logPageView: () => void;
}

const VISITOR_COOKIE = 'visitor_v2';
const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 minutes

export const useVisitorStore = create<VisitorState>((set, get) => ({
    visitorId: null,

    initialize: async () => {
        let cookieData = getJsonCookie<VisitorData>(VISITOR_COOKIE);
        const now = Date.now();
        let visitorId = cookieData?.visitorId;

        // 1. Ensure Visitor ID exists
        if (!visitorId) {
            visitorId = crypto.randomUUID();
            cookieData = { visitorId, sessions: [] };
        }

        // 2. Determine if we need a NEW Session
        // Check 1: Time passed since last activity (30 mins)
        // Check 2: New UTM parameters in URL
        const lastSession = cookieData.sessions[cookieData.sessions.length - 1];

        const searchParams = new URLSearchParams(window.location.search);
        const utmSource = searchParams.get('utm_source');
        const utmMedium = searchParams.get('utm_medium');
        const utmCampaign = searchParams.get('utm_campaign');

        let shouldStartNewSession = false;

        // Check Timeout
        if (!lastSession || (now - lastSession.lastActivity > SESSION_TIMEOUT)) {
            shouldStartNewSession = true;
        }

        // Check Campaign Change (if UTMs are present and different)
        if (utmSource && lastSession && utmSource !== lastSession.utmSource) {
            shouldStartNewSession = true;
        }

        if (shouldStartNewSession) {
            // Start New Session
            const newSessionId = crypto.randomUUID();

            // Fetch Geo Data (Non-blocking)
            fetchGeoData().then(geo => {
                const sessionPayload = {
                    session_id: newSessionId,
                    visitor_id: visitorId,
                    started_at: new Date().toISOString(),
                    last_activity: new Date().toISOString(),
                    utm_source: utmSource || 'direct',
                    utm_medium: utmMedium || (document.referrer ? 'referral' : 'none'),
                    utm_campaign: utmCampaign || null,
                    referrer: document.referrer || null,
                    page_views: 1,
                    device_type: /Mobi|Android/i.test(navigator.userAgent) ? 'mobile' : 'desktop',
                    user_agent: navigator.userAgent,
                    ...geo
                };

                // Sync to DB
                supabase.from('visitor_sessions').insert(sessionPayload).then(({ error }) => {
                    if (error) console.error("Session Sync Error", error);
                });
            });

            // Update Cookie
            const newSessionInfo: SessionData = {
                sessionId: newSessionId,
                lastActivity: now,
                utmSource: utmSource || undefined
            };

            // Keep only last 5 sessions in cookie to keep it small
            const updatedSessions = [...(cookieData.sessions || []), newSessionInfo].slice(-5);

            setJsonCookie(VISITOR_COOKIE, { ...cookieData, sessions: updatedSessions }, { expires: 365 });
        } else {
            // Continue Existing Session
            if (lastSession) {
                lastSession.lastActivity = now;
                // Update DB Activity (Pulse)
                supabase.from('visitor_sessions')
                    .update({ last_activity: new Date().toISOString() })
                    .eq('session_id', lastSession.sessionId)
                    .then(() => { });

                setJsonCookie(VISITOR_COOKIE, cookieData, { expires: 365 });
            }
        }
    },

    logPageView: () => {
        // Can be used to increment page_views in DB
    }
}));


async function fetchGeoData() {
    try {
        const res = await fetch('https://ipapi.co/json/');
        const data = await res.json();
        return {
            city: data.city,
            country: data.country_name,
            country_code: data.country_code,
            ip_address: data.ip
        };
    } catch (e) {
        console.warn("Geo fetch failed", e);
        return {};
    }
}
