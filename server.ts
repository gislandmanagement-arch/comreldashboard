
import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import { createServer as createViteServer } from 'vite';
import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

// Environment variables
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_SHEET_ID = '13789XJ7b_IXJAH1MgsN1OigNqdpNumSrr1ZD0CMRW8c';

// Initialize OAuth2 client
const oauth2Client = new OAuth2Client(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  '' // Redirect URI will be set dynamically
);

app.use(cookieParser());
app.use(express.json());

// Helper to get redirect URI
const getRedirectUri = (req: express.Request) => {
  const protocol = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers.host;
  return `${protocol}://${host}/auth/callback`;
};

// 1. Get Google Auth URL
app.get('/api/auth/google/url', (req, res) => {
  const redirectUri = getRedirectUri(req);
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
    ],
    redirect_uri: redirectUri,
  });
  res.json({ url });
});

// 2. OAuth Callback
app.get('/auth/callback', async (req, res) => {
  const { code } = req.query;
  const redirectUri = getRedirectUri(req);

  try {
    const { tokens } = await oauth2Client.getToken({
      code: code as string,
      redirect_uri: redirectUri,
    });

    oauth2Client.setCredentials(tokens);

    // Get user info from Google
    const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
    const userInfo = await oauth2.userinfo.get();
    const email = userInfo.data.email;

    if (!email) {
      throw new Error('No email found in Google profile');
    }

    // 3. Check Whitelist in Google Sheets
    // We use a service account or API key to read the sheet.
    let auth: any;
    if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && process.env.GOOGLE_PRIVATE_KEY) {
      auth = new google.auth.JWT({
        email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        key: process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n'),
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      });
    } else {
      // Fallback to default auth (e.g. GOOGLE_APPLICATION_CREDENTIALS) or API Key
      auth = new google.auth.GoogleAuth({
        scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
      });
    }
    
    const sheets = google.sheets({ version: 'v4', auth });
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_SHEET_ID,
      range: 'Whitelist!A:E', // User, nama, Jabatan, AREA KERJA, role
    } as any);

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      throw new Error('Whitelist is empty or inaccessible');
    }

    // Find user in whitelist
    const headers = rows[0];
    const userIndex = headers.indexOf('User');
    const nameIndex = headers.indexOf('nama');
    const jabatanIndex = headers.indexOf('Jabatan');
    const areaIndex = headers.indexOf('AREA KERJA');
    const roleIndex = headers.indexOf('role');

    const userData = rows.slice(1).find(row => row[userIndex]?.toLowerCase() === email.toLowerCase());

    if (!userData) {
      return res.status(403).send(`
        <html>
          <body style="font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #f8fafc;">
            <div style="background: white; padding: 2rem; border-radius: 1rem; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); text-align: center;">
              <h1 style="color: #ef4444;">Access Denied</h1>
              <p>Email <strong>${email}</strong> is not authorized to access this dashboard.</p>
              <button onclick="window.close()" style="background: #0f172a; color: white; border: none; padding: 0.5rem 1rem; border-radius: 0.5rem; cursor: pointer;">Close</button>
            </div>
          </body>
        </html>
      `);
    }

    // Authorized! Set session cookie
    const userSession = {
      email,
      name: userData[nameIndex],
      role: userData[roleIndex],
      jabatan: userData[jabatanIndex],
      area: userData[areaIndex],
      picture: userInfo.data.picture
    };

    res.cookie('user_session', JSON.stringify(userSession), {
      httpOnly: true,
      secure: true,
      sameSite: 'none',
      maxAge: 24 * 60 * 60 * 1000, // 1 day
    });

    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_SUCCESS' }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Authentication successful. This window should close automatically.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Auth error:', error);
    res.status(500).send('Authentication failed');
  }
});

// 4. Get Current User
app.get('/api/me', (req, res) => {
  const session = req.cookies.user_session;
  if (!session) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  res.json(JSON.parse(session));
});

// 5. Logout
app.post('/api/logout', (req, res) => {
  res.clearCookie('user_session', {
    httpOnly: true,
    secure: true,
    sameSite: 'none',
  });
  res.json({ success: true });
});

// Vite middleware for development
if (process.env.NODE_ENV !== 'production') {
  const vite = await createViteServer({
    server: { middlewareMode: true },
    appType: 'spa',
  });
  app.use(vite.middlewares);
} else {
  app.use(express.static(path.join(__dirname, 'dist')));
  app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
