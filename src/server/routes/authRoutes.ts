import { Router } from 'express';
import { AUTHOR_EMAIL } from '../config';
import { activeAdminTokens, pendingAdminCodes } from '../middleware/authMiddleware';
import { requestVerificationCode, verifyCode } from '../services/authService';

const router = Router();

// Request Admin/User Verification Code & Magic Link
router.post('/api/admin/request-code', async (req, res) => {
  const { email } = req.body;
  if (!email || !email.includes('@')) {
    return res.status(400).json({ error: 'Пожалуйста, введите корректный адрес электронной почты.' });
  }

  const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
  const host = req.get('host') || 'localhost:3000';

  const result = await requestVerificationCode(email, protocol, host);
  res.json(result);
});

// Verify Admin/User Code
router.post('/api/admin/verify-code', (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) {
    return res.status(400).json({ error: 'Email and code are required' });
  }

  const result = verifyCode(email, code);
  if (!result.success) {
    return res.status(400).json({ error: result.error });
  }

  res.json(result);
});

// Direct Magic Link verification page
router.get('/auth/verify', (req, res) => {
  const { token, email } = req.query;
  if (!token || !email) {
    return res.status(400).send('Отсутствует токен или email');
  }

  const emailStr = String(email).toLowerCase();
  const codeStr = String(token);

  const record = pendingAdminCodes.get(emailStr);
  if (!record || record.code !== codeStr || Date.now() > record.expiresAt) {
    return res.status(400).send(`
      <html>
      <head>
        <meta charset="utf-8">
        <title>Ошибка верификации</title>
        <style>
          body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #000; color: #ff6b6b; }
          .card { text-align: center; border: 1px solid #ff6b6b; padding: 2rem; border-radius: 8px; }
        </style>
      </head>
      <body>
        <div class="card">
          <h2>Ошибка входа</h2>
          <p>Неверная ссылка, код уже использован или срок действия истек.</p>
          <a href="/" style="color: #4ecdc4; text-decoration: none;">Вернуться на главную страницу</a>
        </div>
      </body>
      </html>
    `);
  }

  const isAuthorUser = emailStr === AUTHOR_EMAIL;
  let adminTokenStr = '';
  if (isAuthorUser) {
    adminTokenStr = 'admin_ricis_token_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    activeAdminTokens.add(adminTokenStr);
  } else {
    adminTokenStr = 'user_ricis_token_' + Math.random().toString(36).substring(2, 15);
  }

  pendingAdminCodes.delete(emailStr);

  res.send(`
    <html>
    <head>
      <meta charset="utf-8">
      <title>Вход выполнен успешно</title>
      <style>
        body { font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #0b0c10; color: #4ecdc4; }
        .card { text-align: center; border: 1px solid #4ecdc4; padding: 2rem; border-radius: 12px; background: #1f2833; box-shadow: 0 0 30px rgba(78,205,196,0.2); }
        .btn { background: #4ecdc4; color: black; border: none; padding: 10px 20px; border-radius: 6px; text-decoration: none; font-weight: bold; cursor: pointer; display: inline-block; margin-top: 15px; }
      </style>
    </head>
    <body>
      <div class="card">
        <h2>Вход выполнен успешно!</h2>
        <p>Вы вошли как <strong>${emailStr}</strong>.</p>
        <p>Сейчас вы будете перенаправлены на главную страницу.</p>
        
        <script>
          const authData = {
            type: 'OAUTH_AUTH_SUCCESS',
            token: '${adminTokenStr}',
            email: '${emailStr}',
            name: '${emailStr.split('@')[0]}',
            picture: 'https://lh3.googleusercontent.com/a/default-user',
            isAdmin: ${isAuthorUser}
          };

          if (window.opener) {
            window.opener.postMessage(authData, '*');
            window.close();
          } else {
            if (authData.isAdmin) {
              localStorage.setItem('ricis_admin_token', authData.token);
              localStorage.setItem('ricis_google_user', JSON.stringify({
                email: authData.email,
                name: authData.name,
                picture: authData.picture
              }));
            } else {
              localStorage.setItem('ricis_google_user', JSON.stringify({
                email: authData.email,
                name: authData.name,
                picture: authData.picture
              }));
              localStorage.setItem('ricis_username', authData.name);
            }
            window.location.href = '/';
          }
        </script>
        
        <a href="/" class="btn">Перейти на главную</a>
      </div>
    </body>
    </html>
  `);
});

// --- GOOGLE OAUTH2 INTEGRATION ---
router.get('/api/auth/google/url', (req, res) => {
  const { redirect_uri } = req.query;
  const clientId = process.env.GOOGLE_CLIENT_ID;

  if (!clientId) {
    return res.json({ url: '/auth/google/demo-popup', isDemo: true });
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: String(redirect_uri || ''),
    response_type: 'code',
    scope: 'openid email profile',
    access_type: 'offline',
    prompt: 'select_account'
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  res.json({ url: authUrl, isDemo: false });
});

router.get('/auth/google/demo-popup', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Войти с помощью Google</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          background-color: #f0f2f5;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          margin: 0;
        }
        .card {
          background: white;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          width: 100%;
          max-width: 400px;
          padding: 40px;
          box-sizing: border-box;
          text-align: center;
        }
        .logo { margin-bottom: 24px; }
        .title { font-size: 24px; font-weight: 500; color: #202124; margin: 0 0 8px 0; }
        .subtitle { font-size: 16px; color: #5f6368; margin: 0 0 32px 0; }
        .input-group { margin-bottom: 24px; text-align: left; }
        label { display: block; font-size: 14px; color: #5f6368; margin-bottom: 8px; }
        input {
          width: 100%; padding: 12px 16px; border: 1px solid #dadce0; border-radius: 4px; font-size: 16px; box-sizing: border-box; outline: none; transition: border-color 0.2s;
        }
        input:focus { border-color: #1a73e8; }
        .btn {
          width: 100%; background-color: #1a73e8; color: white; border: none; border-radius: 4px; padding: 12px; font-size: 14px; font-weight: 500; cursor: pointer; transition: background-color 0.2s;
        }
        .btn:hover { background-color: #1557b0; }
        .alert-info {
          background-color: #e8f0fe; border: 1px solid #aecbfa; color: #1967d2; border-radius: 6px; padding: 12px; font-size: 12px; text-align: left; margin-bottom: 24px; line-height: 1.5;
        }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">
          <svg width="48" height="48" viewBox="0 0 24 24" style="display: inline-block;">
            <path fill="#EA4335" d="M12 5.04c1.62 0 3.08.56 4.22 1.64l3.15-3.15C17.45 1.74 14.93 1 12 1 7.37 1 3.42 3.66 1.49 7.56l3.82 2.96c.92-2.75 3.49-4.48 6.69-4.48z"/>
            <path fill="#4285F4" d="M23.49 12.27c0-.81-.07-1.59-.2-2.35H12v4.45h6.46c-.28 1.47-1.11 2.72-2.36 3.56l3.66 2.84c2.14-1.97 3.38-4.87 3.38-8.5z"/>
            <path fill="#FBBC05" d="M5.31 14.48c-.24-.72-.38-1.49-.38-2.28s.14-1.56.38-2.28L1.49 7.56C.54 9.47 0 11.61 0 13.84c0 2.23.54 4.37 1.49 6.28l3.82-2.96-.51-.68z"/>
            <path fill="#34A853" d="M12 23c3.24 0 5.97-1.07 7.96-2.91l-3.66-2.84c-1.1.74-2.52 1.18-4.3 1.18-3.2 0-5.77-1.73-6.69-4.48L1.49 16.9C3.42 20.8 7.37 23 12 23z"/>
          </svg>
        </div>
        <h2 class="title">Вход через Google</h2>
        <p class="subtitle">Используйте аккаунт Google</p>

        <div class="alert-info">
          ⚙️ <strong>Режим демонстрации (Песочница):</strong> GOOGLE_CLIENT_ID не настроен в вашей панели управления.<br><br>
          Введите адрес почты (например, <strong>dima.aley@gmail.com</strong> для прав администратора или любой другой для прав исследователя) для симуляции входа:
        </div>

        <form onsubmit="handleLogin(event)">
          <div class="input-group">
            <label for="email">Адрес электронной почты</label>
            <input type="email" id="email" required placeholder="name@gmail.com" value="dima.aley@gmail.com">
          </div>
          <button type="submit" class="btn">Далее (Войти)</button>
        </form>
      </div>

      <script>
        function handleLogin(e) {
          e.preventDefault();
          const email = document.getElementById('email').value.trim().toLowerCase();
          const isAdmin = email === '${AUTHOR_EMAIL}';
          const name = isAdmin ? 'Дмитрий Алейников' : 'Тестовый Исследователь';
          const token = isAdmin 
            ? 'admin_ricis_token_demo_' + Math.random().toString(36).substring(2, 10) 
            : 'user_ricis_token_demo_' + Math.random().toString(36).substring(2, 10);
          
          if (window.opener) {
            window.opener.postMessage({
              type: 'OAUTH_AUTH_SUCCESS',
              token: token,
              email: email,
              name: name,
              picture: 'https://lh3.googleusercontent.com/a/default-user',
              isAdmin: isAdmin
            }, '*');
            window.close();
          } else {
            alert('Окно авторизации открыто напрямую. postMessage не может быть отправлен.');
          }
        }
      </script>
    </body>
    </html>
  `);
});

router.get(['/auth/google/callback', '/auth/google/callback/'], async (req, res) => {
  const { code, error } = req.query;
  
  if (error) {
    return res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_FAILURE', error: '${error}' }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Ошибка авторизации Google OAuth: ${error}</p>
        </body>
      </html>
    `);
  }

  if (!code) {
    return res.status(400).send('No authorization code provided');
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID || '';
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';

    const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const host = req.get('host') || 'localhost:3000';
    const redirectUri = `${protocol}://${host}/auth/google/callback`;

    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: String(code),
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code'
      })
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      throw new Error(`Google token exchange failed: ${errText}`);
    }

    const tokens = await tokenResponse.json() as { access_token: string };
    const accessToken = tokens.access_token;

    const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!userInfoResponse.ok) {
      throw new Error('Failed to retrieve user profile from Google UserInfo API');
    }

    const userInfo = await userInfoResponse.json() as { email?: string; name?: string; given_name?: string; picture?: string };
    const email = (userInfo.email || '').toLowerCase();
    const name = userInfo.name || userInfo.given_name || 'Исследователь';
    const picture = userInfo.picture || '';

    let isAdmin = false;
    let token = '';

    if (email === AUTHOR_EMAIL) {
      isAdmin = true;
      token = 'admin_ricis_token_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      activeAdminTokens.add(token);
    } else {
      token = 'user_ricis_token_' + Math.random().toString(36).substring(2, 15);
    }

    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ 
                type: 'OAUTH_AUTH_SUCCESS', 
                token: '${token}',
                email: '${email}',
                name: '${name}',
                picture: '${picture}',
                isAdmin: ${isAdmin}
              }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Вход Google успешно верифицирован! Это окно автоматически закроется.</p>
        </body>
      </html>
    `);

  } catch (err: any) {
    console.error('Google OAuth Exchange Exception:', err);
    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_FAILURE', error: '${err.message || err}' }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Ошибка обмена кодов: ${err.message || err}</p>
        </body>
      </html>
    `);
  }
});

// --- YANDEX OAUTH2 INTEGRATION ---
router.get('/api/auth/yandex/url', (req, res) => {
  const { redirect_uri } = req.query;
  const clientId = process.env.YANDEX_CLIENT_ID;

  if (!clientId) {
    return res.json({ url: '/auth/yandex/demo-popup', isDemo: true });
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: String(redirect_uri || ''),
    response_type: 'code',
    state: 'yandex_state',
  });

  const authUrl = `https://oauth.yandex.ru/authorize?${params.toString()}`;
  res.json({ url: authUrl, isDemo: false });
});

router.get('/auth/yandex/demo-popup', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Войти с помощью Яндекс ID</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
          background-color: #f0f2f5;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          margin: 0;
        }
        .card {
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.12);
          width: 100%;
          max-width: 400px;
          padding: 40px;
          box-sizing: border-box;
          text-align: center;
        }
        .logo { margin-bottom: 24px; }
        .title { font-size: 24px; font-weight: 500; color: #202124; margin: 0 0 8px 0; }
        .subtitle { font-size: 16px; color: #5f6368; margin: 0 0 32px 0; }
        .input-group { margin-bottom: 24px; text-align: left; }
        label { display: block; font-size: 14px; color: #5f6368; margin-bottom: 8px; }
        input {
          width: 100%; padding: 12px 16px; border: 1px solid #dadce0; border-radius: 4px; font-size: 16px; box-sizing: border-box; outline: none; transition: border-color 0.2s;
        }
        input:focus { border-color: #fc3f1d; }
        .btn {
          width: 100%; background-color: #fc3f1d; color: white; border: none; border-radius: 4px; padding: 12px; font-size: 14px; font-weight: 500; cursor: pointer; transition: background-color 0.2s;
        }
        .btn:hover { background-color: #e23516; }
        .alert-info {
          background-color: #fff1ee; border: 1px solid #ffccd1; color: #fc3f1d; border-radius: 6px; padding: 12px; font-size: 12px; text-align: left; margin-bottom: 24px; line-height: 1.5;
        }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="logo">
          <svg width="48" height="48" viewBox="0 0 48 48" style="display: inline-block;">
            <circle cx="24" cy="24" r="24" fill="#fc3f1d"/>
            <path d="M18.5 12H24L31 29H26.5L25 25.5H19.5L18.5 29H14L18.5 12ZM20 22.5H23.5L21.75 18L20 22.5Z" fill="white"/>
          </svg>
        </div>
        <h2 class="title">Вход через Яндекс ID</h2>
        <p class="subtitle">Используйте аккаунт Яндекс</p>

        <div class="alert-info">
          ⚙️ <strong>Режим демонстрации (Песочница):</strong> YANDEX_CLIENT_ID не настроен.<br><br>
          Введите ваш email (например, <strong>${AUTHOR_EMAIL}</strong> для прав администратора или любой другой для прав исследователя):
        </div>

        <form onsubmit="handleLogin(event)">
          <div class="input-group">
            <label for="email">Логин или email в Яндексе</label>
            <input type="email" id="email" required placeholder="name@yandex.ru" value="">
          </div>
          <button type="submit" class="btn">Войти</button>
        </form>
      </div>

      <script>
        function handleLogin(e) {
          e.preventDefault();
          const email = document.getElementById('email').value.trim().toLowerCase();
          const isAdmin = email === '${AUTHOR_EMAIL}';
          const name = isAdmin ? 'Автор' : 'Яндекс-Исследователь';
          const token = isAdmin 
            ? 'admin_ricis_token_demo_' + Math.random().toString(36).substring(2, 10) 
            : 'user_ricis_token_demo_' + Math.random().toString(36).substring(2, 10);
          
          if (window.opener) {
            window.opener.postMessage({
              type: 'OAUTH_AUTH_SUCCESS',
              token: token,
              email: email,
              name: name,
              picture: 'https://avatars.mds.yandex.net/get-yapic/0/0-0/islands-middle',
              isAdmin: isAdmin
            }, '*');
            window.close();
          } else {
            alert('Окно авторизации открыто напрямую.');
          }
        }
      </script>
    </body>
    </html>
  `);
});

router.get(['/auth/yandex/callback', '/auth/yandex/callback/'], async (req, res) => {
  const { code, error } = req.query;
  
  if (error) {
    return res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_FAILURE', error: '${error}' }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Ошибка авторизации Яндекс OAuth: ${error}</p>
        </body>
      </html>
    `);
  }

  if (!code) {
    return res.status(400).send('No authorization code provided');
  }

  try {
    const clientId = process.env.YANDEX_CLIENT_ID || '';
    const clientSecret = process.env.YANDEX_CLIENT_SECRET || '';

    const protocol = req.secure || req.headers['x-forwarded-proto'] === 'https' ? 'https' : 'http';
    const host = req.get('host') || 'localhost:3000';
    const redirectUri = `${protocol}://${host}/auth/yandex/callback`;

    const tokenResponse = await fetch('https://oauth.yandex.ru/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code: String(code),
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri
      })
    });

    if (!tokenResponse.ok) {
      const errText = await tokenResponse.text();
      throw new Error(`Yandex token exchange failed: ${errText}`);
    }

    const tokens = await tokenResponse.json() as { access_token: string };
    const accessToken = tokens.access_token;

    const profileResponse = await fetch('https://login.yandex.ru/info?format=json', {
      headers: { Authorization: `OAuth ${accessToken}` }
    });

    if (!profileResponse.ok) {
      throw new Error('Failed to retrieve profile from Yandex Login API');
    }

    const userInfo = await profileResponse.json() as { 
      default_email?: string; 
      emails?: string[]; 
      display_name?: string; 
      real_name?: string; 
      default_avatar_id?: string;
    };

    const email = (userInfo.default_email || (userInfo.emails && userInfo.emails[0]) || '').toLowerCase();
    const name = userInfo.display_name || userInfo.real_name || 'Яндекс-Исследователь';
    const picture = userInfo.default_avatar_id 
      ? `https://avatars.yandex.net/get-yapic/${userInfo.default_avatar_id}/islands-middle`
      : 'https://avatars.mds.yandex.net/get-yapic/0/0-0/islands-middle';

    let isAdmin = false;
    let token = '';

    if (email === AUTHOR_EMAIL) {
      isAdmin = true;
      token = 'admin_ricis_token_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
      activeAdminTokens.add(token);
    } else {
      token = 'user_ricis_token_' + Math.random().toString(36).substring(2, 15);
    }

    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ 
                type: 'OAUTH_AUTH_SUCCESS', 
                token: '${token}',
                email: '${email}',
                name: '${name}',
                picture: '${picture}',
                isAdmin: ${isAdmin}
              }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Вход Яндекс успешно верифицирован! Это окно автоматически закроется.</p>
        </body>
      </html>
    `);

  } catch (err: any) {
    console.error('Yandex OAuth Exchange Exception:', err);
    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'OAUTH_AUTH_FAILURE', error: '${err.message || err}' }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Ошибка обмена кодов Яндекс: ${err.message || err}</p>
        </body>
      </html>
    `);
  }
});

export default router;
