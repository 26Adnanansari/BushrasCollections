import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const FacebookPixel = () => {
    useEffect(() => {
        const initPixel = async () => {
            try {
                const { data } = await supabase.from('site_settings').select('value').eq('key', 'facebook_pixel').single();
                
                if (data && data.value && data.value.pixel_id) {
                    const pixelId = data.value.pixel_id;
                    
                    // Don't inject multiple times
                    if (document.getElementById('fb-pixel')) return;

                    const script = document.createElement('script');
                    script.id = 'fb-pixel';
                    script.innerHTML = `
                        !function(f,b,e,v,n,t,s)
                        {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
                        n.callMethod.apply(n,arguments):n.queue.push(arguments)};
                        if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
                        n.queue=[];t=b.createElement(e);t.async=!0;
                        t.src=v;s=b.getElementsByTagName(e)[0];
                        s.parentNode.insertBefore(t,s)}(window, document,'script',
                        'https://connect.facebook.net/en_US/fbevents.js');
                        fbq('init', '${pixelId}');
                        fbq('track', 'PageView');
                    `;
                    document.head.appendChild(script);
                }
            } catch (error) {
                console.error("FB Pixel check failed", error);
            }
        };

        // Delay it slightly so it doesn't block the main thread loading
        setTimeout(initPixel, 1500);
    }, []);

    return null;
};
