# External Scripts Directory

This directory is for adding external scripts like Facebook Pixel, chatbots, or custom analytics.

## How to Use

1. **Drop your script files here:**
   - `facebook-pixel.js` - For Facebook Pixel tracking
   - `chatbot.js` - For chat widgets (Tawk.to, Crisp, etc.)
   - `custom-scripts.js` - For any custom scripts

2. **The app will automatically:**
   - Detect if these files exist
   - Load them asynchronously
   - Run without errors if files don't exist

3. **Example Scripts:**

### Facebook Pixel (facebook-pixel.js)
```javascript
!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', 'YOUR_PIXEL_ID');
fbq('track', 'PageView');
```

### Chatbot (chatbot.js)
```javascript
// Example for Tawk.to
var Tawk_API=Tawk_API||{}, Tawk_LoadStart=new Date();
(function(){
var s1=document.createElement("script"),s0=document.getElementsByTagName("script")[0];
s1.async=true;
s1.src='https://embed.tawk.to/YOUR_PROPERTY_ID/YOUR_WIDGET_ID';
s1.charset='UTF-8';
s1.setAttribute('crossorigin','*');
s0.parentNode.insertBefore(s1,s0);
})();
```

## Important Notes

- Scripts are loaded **asynchronously** to not block page rendering
- Files are detected automatically - no code changes needed
- If a script file doesn't exist, the app continues normally
- Check browser console for script loading status (✅ or ⚠️)
- Keep script files lightweight for better performance

## Security

- Only add scripts from trusted sources
- Review script content before adding
- Test scripts in development before deploying to production
