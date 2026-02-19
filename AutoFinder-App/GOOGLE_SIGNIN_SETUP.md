# Google Sign-In Setup Guide

## Prerequisites
1. Google Cloud Console account
2. Expo project configured

## Steps to Setup Google Sign-In

### 1. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select an existing one
3. Enable **Google+ API**:
   - Navigate to "APIs & Services" > "Library"
   - Search for "Google+ API" and enable it
4. Create OAuth 2.0 Credentials:
   - Go to "APIs & Services" > "Credentials"
   - Click "Create Credentials" > "OAuth client ID"
   - Choose "Web application" as the application type
   - Add authorized redirect URIs:
     - `https://auth.expo.io/@your-username/autofinder`
     - `autofinder://oauth` (for deep linking)
   - Copy the **Client ID** (it looks like: `xxxxx.apps.googleusercontent.com`)

### 2. Configure Mobile App

1. Set the Google Client ID in your environment:
   - Create a `.env` file in the root directory:
     ```
     EXPO_PUBLIC_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
     ```
   - Or update `config.js` directly:
     ```javascript
     export const GOOGLE_CLIENT_ID = 'your-client-id.apps.googleusercontent.com';
     ```

### 3. Backend Setup

You need to create a `/google-login` endpoint in your backend that:
- Accepts POST request with body:
  ```json
  {
    "googleId": "user-google-id",
    "email": "user@example.com",
    "name": "User Name",
    "picture": "profile-picture-url"
  }
  ```
- Verifies the Google user
- Creates or updates user in database
- Returns:
  ```json
  {
    "success": true,
    "token": "jwt-token",
    "userId": "user-id",
    "name": "User Name",
    "email": "user@example.com",
    "phone": "phone-number",
    "dateAdded": "date",
    "profileImage": "image-url",
    "userType": "user-type"
  }
  ```

### 4. Install Dependencies

The required dependencies are already added to `package.json`:
- `expo-auth-session`
- `expo-web-browser`

Run:
```bash
npm install
# or
yarn install
```

### 5. Test the Integration

1. Start your Expo app:
   ```bash
   npm start
   ```
2. Navigate to Login Screen
3. Click "Continue with Google"
4. Complete Google authentication
5. Verify user is logged in

## Troubleshooting

### Issue: "Invalid client ID"
- Make sure you're using the **Web Client ID**, not iOS/Android specific IDs
- Verify the Client ID is correctly set in `config.js` or `.env`

### Issue: Redirect URI mismatch
- Check that your redirect URI matches exactly in Google Cloud Console
- For Expo: Use `https://auth.expo.io/@your-username/autofinder`

### Issue: Backend endpoint not found
- Ensure `/google-login` endpoint exists in your backend
- Check backend logs for errors

## Notes

- The Google Sign-In uses OAuth 2.0 flow
- User data is sent to your backend for verification and user creation
- The app stores user session in AsyncStorage after successful login
- Make sure your backend validates the Google ID token for security
