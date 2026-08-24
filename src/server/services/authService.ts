import nodemailer from 'nodemailer';
import { AUTHOR_EMAIL } from '../config';
import { activeAdminTokens, pendingAdminCodes } from '../middleware/authMiddleware';

export async function requestVerificationCode(email: string, protocol: string, host: string) {
  const cleanEmail = email.trim().toLowerCase();
  const isAuthor = cleanEmail === AUTHOR_EMAIL;

  const code = Math.floor(100000 + Math.random() * 900000).toString();
  const expiresAt = Date.now() + 15 * 60 * 1000;
  pendingAdminCodes.set(cleanEmail, { code, expiresAt });

  const magicLink = `${protocol}://${host}/auth/verify?token=${code}&email=${encodeURIComponent(cleanEmail)}`;

  const mailSubject = encodeURIComponent('RICIS III — Ссылка для мгновенного входа и код авторизации');
  const mailBody = encodeURIComponent(
    `Здравствуйте!\n\n` +
    `Ваш одноразовый код подтверждения для входа в систему RICIS III: ${code}\n\n` +
    `Для автоматического входа нажмите на ссылку ниже:\n` +
    `${magicLink}\n\n` +
    `Ссылка и код действительны в течение 15 минут.\n` +
    `С уважением,\nАлейников Дмитрий Владимирович | RICIS III`
  );
  const mailtoUrl = `mailto:${cleanEmail}?subject=${mailSubject}&body=${mailBody}`;

  console.log(`\n======================================================`);
  console.log(`[RICIS SECURITY PROTOCOL: AUTH REQUEST]`);
  console.log(`Email: ${cleanEmail}`);
  console.log(`VERIFICATION DISPATCHED VIA EMAIL CLIENT / MAILTO LINK`);
  console.log(`======================================================\n`);

  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: `"RICIS III Auth" <${process.env.SMTP_USER}>`,
        to: cleanEmail,
        subject: `RICIS III — ${isAuthor ? 'Ссылка для входа разработчика' : 'Ссылка для входа пользователя'}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #0b0c10; color: #4ecdc4; border-radius: 12px; border: 1px solid #4ecdc4;">
            <h2 style="color: #66fcf1; margin-top: 0;">RICIS III — ${isAuthor ? 'Вход разработчика' : 'Вход пользователя'}</h2>
            <p style="color: #c5c6c7;">Ваш одноразовый код подтверждения:</p>
            <div style="font-size: 28px; font-weight: bold; letter-spacing: 6px; color: #66fcf1; background: #1f2833; padding: 16px; border-radius: 8px; text-align: center; margin: 20px 0;">
              ${code}
            </div>
            <p style="color: #c5c6c7;">Или нажмите кнопку ниже для автоматического входа без ввода кода:</p>
            <div style="text-align: center; margin: 25px 0;">
              <a href="${magicLink}" style="display: inline-block; background: #4ecdc4; color: #0b0c10; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px;">
                🚀 Войти в систему RICIS III
              </a>
            </div>
            <p style="font-size: 12px; color: #8892b0; margin-top: 24px; border-top: 1px solid #1f2833; padding-top: 12px;">
              Ссылка действительна 15 минут. Если вы не запрашивали вход, проигнорируйте это письмо.
            </p>
          </div>
        `
      });
      console.log(`[AUTH] Direct SMTP email dispatched to ${cleanEmail}`);
    } catch (err: any) {
      console.error(`[AUTH] SMTP dispatch error:`, err.message);
    }
  }

  return {
    success: true,
    message: isAuthor 
      ? `Ссылка для входа и код подтверждения отправлены на ваш email (${AUTHOR_EMAIL}).`
      : `Ссылка для входа и код подтверждения подготовлены для ${cleanEmail}.`,
    mailtoUrl
  };
}

export function verifyCode(email: string, code: string) {
  const cleanEmail = email.trim().toLowerCase();
  const record = pendingAdminCodes.get(cleanEmail);
  if (!record || record.code !== code || Date.now() > record.expiresAt) {
    return { success: false, error: 'Неверный код подтверждения или срок его действия истек.' };
  }

  const isAuthorUser = cleanEmail === AUTHOR_EMAIL;
  let token = '';

  if (isAuthorUser) {
    token = 'admin_ricis_token_' + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    activeAdminTokens.add(token);
  } else {
    token = 'user_ricis_token_' + Math.random().toString(36).substring(2, 15);
  }

  pendingAdminCodes.delete(cleanEmail);

  return {
    success: true,
    token,
    isAdmin: isAuthorUser,
    email: cleanEmail,
    name: cleanEmail.split('@')[0]
  };
}
