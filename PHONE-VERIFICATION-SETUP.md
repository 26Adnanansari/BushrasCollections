# 📱 Phone Verification Setup Guide

This guide explains how to enable SMS-based phone verification using Supabase Phone Auth.

---

## 🎯 Overview

**Current Status:** Phone field is collected but **not verified yet**  
**Goal:** Enable SMS verification using Supabase Phone Auth  
**Cost:** 10,000 free SMS/month included in Supabase  

---

## ✅ Why Supabase Phone Auth?

- ✓ Already integrated in your tech stack
- ✓ 10,000 free SMS per month
- ✓ No extra API keys needed
- ✓ Seamless integration with existing authentication
- ✓ Supports international phone numbers
- ✓ Built-in rate limiting and security

---

## 🚀 Setup Instructions

### Step 1: Enable Phone Auth in Supabase Dashboard

1. **Go to Supabase Dashboard**
   - Navigate to: `Authentication` → `Providers`

2. **Enable Phone Provider**
   - Toggle on: `Phone`
   - Default country code: `+1` (or your region)
   - Save changes

3. **Configure SMS Provider** (Choose One)

   **Option A: Twilio (Recommended - Most Reliable)**
   - Create account at: https://www.twilio.com
   - Get: Account SID, Auth Token, Phone Number
   - Add to Supabase: Authentication → Settings → SMS Provider
   - Provider: Twilio
   - Paste credentials
   - Test with your phone number

   **Option B: MessageBird**
   - Similar setup to Twilio
   - Get API key from MessageBird dashboard
   - Configure in Supabase

   **Option C: Vonage**
   - Get API credentials from Vonage
   - Configure in Supabase

---

### Step 2: Test Phone Verification

1. **Test in Supabase Dashboard**
   - Go to: Authentication → Users
   - Click "Invite user"
   - Select "Phone" option
   - Enter test phone number
   - Should receive SMS with OTP code

2. **Verify SMS Delivery**
   - Check your phone for SMS
   - Code should arrive within 30 seconds
   - If not received, check:
     - SMS provider credits
     - Phone number format (+country_code)
     - Spam folder (for some carriers)

---

### Step 3: Enable in Application Code

Once SMS delivery is confirmed working:

1. **Update Profile Page** (`src/pages/Profile.tsx`)
   ```typescript
   // Enable the "Verify Phone" button
   // Currently shows "Coming soon" - change to:
   <Button
     onClick={handleVerifyPhone}
     disabled={!phone || verifying}
   >
     Verify Phone Number
   </Button>
   ```

2. **Add Verification Function**
   ```typescript
   const handleVerifyPhone = async () => {
     try {
       const { error } = await supabase.auth.signInWithOtp({
         phone: phone,
       });
       
       if (error) throw error;
       
       toast({
         title: "Verification code sent",
         description: "Check your phone for the verification code",
       });
       
       // Show OTP input dialog
       setShowOtpDialog(true);
     } catch (error: any) {
       toast({
         title: "Error",
         description: error.message,
         variant: "destructive",
       });
     }
   };
   ```

3. **Add OTP Verification**
   ```typescript
   const handleVerifyOtp = async (otp: string) => {
     try {
       const { error } = await supabase.auth.verifyOtp({
         phone: phone,
         token: otp,
         type: 'sms',
       });
       
       if (error) throw error;
       
       // Update profile to mark phone as verified
       await supabase
         .from('profiles')
         .update({ phone_verified: true })
         .eq('id', user!.id);
       
       toast({
         title: "Success",
         description: "Phone number verified successfully",
       });
     } catch (error: any) {
       toast({
         title: "Error",
         description: "Invalid verification code",
         variant: "destructive",
       });
     }
   };
   ```

---

## 🧪 Testing Checklist

Before enabling in production:

- [ ] SMS provider configured in Supabase
- [ ] Test SMS received on your phone
- [ ] OTP code works correctly
- [ ] Verified badge shows after verification
- [ ] Database updates `phone_verified` column
- [ ] Rate limiting works (prevent spam)
- [ ] International numbers tested (if applicable)
- [ ] Error handling works for invalid codes

---

## 💰 Cost Estimates

**Supabase Free Tier:**
- 10,000 SMS/month included
- Perfect for startups and small apps

**Twilio Pricing (After Free Tier):**
- ~$0.0075 per SMS (varies by country)
- Example: 1,000 SMS = ~$7.50

**When to upgrade:**
- If you have >10,000 users/month verifying
- Consider upgrading to paid Supabase plan
- Or add Twilio credits directly

---

## 🔒 Security Best Practices

1. **Rate Limiting**
   - Limit verification attempts per phone
   - Default: 5 attempts per hour (Supabase handles this)

2. **OTP Expiry**
   - Codes expire after 5 minutes
   - User must request new code after expiry

3. **Phone Number Validation**
   - Already implemented in signup form
   - Format: +[country][number] (E.164 format)

4. **Prevent Abuse**
   - Monitor SMS usage in Supabase dashboard
   - Set up alerts for unusual activity
   - Consider CAPTCHA for high-volume apps

---

## 🐛 Troubleshooting

**SMS not received:**
- Check phone number format (+1234567890)
- Verify SMS provider credentials
- Check Supabase logs: Authentication → Logs
- Ensure SMS provider has credits

**"Invalid phone number" error:**
- Must include country code (+1, +44, etc.)
- Use E.164 format
- No spaces or special characters

**"Too many requests" error:**
- Rate limit hit (default: 5/hour)
- Wait 1 hour or contact support to increase

**Verification code doesn't work:**
- Code expires after 5 minutes
- Request new code
- Check for typos (case-sensitive)

---

## 📊 Monitoring

**Track Phone Verification in Supabase:**

```sql
-- Check verification status
SELECT 
  email,
  phone,
  phone_verified,
  created_at
FROM profiles
WHERE phone IS NOT NULL;

-- Count verified vs unverified
SELECT 
  phone_verified,
  COUNT(*) as count
FROM profiles
GROUP BY phone_verified;
```

---

## 🎓 Next Steps After Setup

1. ✅ **Test thoroughly** with multiple phone numbers
2. ✅ **Monitor SMS usage** in first week
3. ✅ **Add user feedback** for verification flow
4. ✅ **Consider 2FA** for admin users (optional)
5. ✅ **Update privacy policy** to mention SMS usage

---

## 📚 Additional Resources

- [Supabase Phone Auth Docs](https://supabase.com/docs/guides/auth/phone-login)
- [Twilio SMS Setup](https://www.twilio.com/docs/sms)
- [E.164 Phone Format](https://www.twilio.com/docs/glossary/what-e164)

---

**Setup Time:** ~15 minutes  
**Monthly Cost:** Free (up to 10k SMS)  
**Complexity:** Low (Supabase handles everything)  

**Ready to enable? Follow steps above when you're ready to test! 🚀**
