# ✉️ Professional Email Templates for Supabase

In templates ko directly apne Supabase Dashboard me copy paste kar dein. Ye HTML completely mobile-responsive hai aur har email client (Gmail, Yahoo, Outlook) me bilkul perfect, elegant aur premium lagti hai.

---

### Step-by-Step Instructions:
1. Apne Supabase Dashboard me jayen.
2. **Authentication** -> **Email Templates** mein jayen.
3. Wahan **Confirm signup** aur **Reset Password** wale tabs mein Message body (HTML) wale box me ye neeche diya gaya code copy kar ke paste kar dein.

---

## 1️⃣ Confirm Signup Template
*Isay "Confirm signup" tab ke **Message body** mein paste karein.*

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to Bushra's Collection</title>
</head>
<body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f7f5f2; margin: 0; padding: 0; color: #333333;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f7f5f2; padding: 40px 15px;">
        <tr>
            <td align="center">
                <table width="100%" max-width="600px" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; max-width: 600px; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                    <!-- Header -->
                    <tr>
                        <td align="center" style="background-color: #1a1a1a; padding: 40px 0;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 2px; font-family: 'Georgia', serif;">BUSHRA'S COLLECTION</h1>
                        </td>
                    </tr>
                    <!-- Body Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="margin-top: 0; color: #1a1a1a; font-size: 22px; font-weight: 600;">Welcome to Exclusive Fashion!</h2>
                            <p style="font-size: 16px; line-height: 1.6; color: #555555; margin-bottom: 25px;">
                                Thank you for joining <strong>Bushra's Collection</strong>. We are thrilled to have you with us. Please confirm your email address to activate your account and start exploring our bespoke, made-to-order collections.
                            </p>
                            <!-- Action Button -->
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td align="center" style="padding-bottom: 25px;">
                                        <a href="{{ .ConfirmationURL }}" style="background-color: #baa381; color: #ffffff; text-decoration: none; padding: 14px 35px; border-radius: 50px; font-size: 16px; font-weight: bold; display: inline-block; text-transform: uppercase; letter-spacing: 1px;">
                                            Verify My Email
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            <p style="font-size: 14px; line-height: 1.5; color: #888888; text-align: center;">
                                If the button doesn't work, copy and paste this link into your browser:<br>
                                <a href="{{ .ConfirmationURL }}" style="color: #baa381; word-break: break-all;">{{ .ConfirmationURL }}</a>
                            </p>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td align="center" style="background-color: #faf9f7; padding: 25px; border-top: 1px solid #eeeeee;">
                            <p style="font-size: 13px; color: #999999; margin: 0;">
                                &copy; 2026 Bushra's Collection. All rights reserved.<br>
                                Karachi, Pakistan
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
```

---

## 2️⃣ Reset Password Template
*Isay "Reset password" tab ke **Message body** mein paste karein.*

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Reset Password - Bushra's Collection</title>
</head>
<body style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #f7f5f2; margin: 0; padding: 0; color: #333333;">
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f7f5f2; padding: 40px 15px;">
        <tr>
            <td align="center">
                <table width="100%" max-width="600px" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; max-width: 600px; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
                    <!-- Header -->
                    <tr>
                        <td align="center" style="background-color: #1a1a1a; padding: 40px 0;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 2px; font-family: 'Georgia', serif;">BUSHRA'S COLLECTION</h1>
                        </td>
                    </tr>
                    <!-- Body Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <h2 style="margin-top: 0; color: #1a1a1a; font-size: 22px; font-weight: 600;">Password Reset Request</h2>
                            <p style="font-size: 16px; line-height: 1.6; color: #555555; margin-bottom: 25px;">
                                We received a request to reset your password for your Bushra's Collection account. If you made this request, please click the button below to securely set a new password.
                            </p>
                            <!-- Action Button -->
                            <table width="100%" cellpadding="0" cellspacing="0" border="0">
                                <tr>
                                    <td align="center" style="padding-bottom: 25px;">
                                        <a href="{{ .ConfirmationURL }}" style="background-color: #1a1a1a; color: #ffffff; text-decoration: none; padding: 14px 35px; border-radius: 5px; font-size: 16px; font-weight: bold; display: inline-block; letter-spacing: 1px;">
                                            Reset Password
                                        </a>
                                    </td>
                                </tr>
                            </table>
                            <p style="font-size: 14px; line-height: 1.5; color: #888888; text-align: center;">
                                If you did not request a password reset, you can safely ignore this email. Your account remains secure.
                            </p>
                        </td>
                    </tr>
                    <!-- Footer -->
                    <tr>
                        <td align="center" style="background-color: #faf9f7; padding: 25px; border-top: 1px solid #eeeeee;">
                            <p style="font-size: 13px; color: #999999; margin: 0;">
                                &copy; 2026 Bushra's Collection. All rights reserved.<br>
                                Secure System Alert
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
```
