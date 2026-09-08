import fs from 'fs';
import path from 'path';
import nodemailer from 'nodemailer';

const sender = process.env.GMAIL_OTP_SENDER || 'subayhvhan@gmail.com';
const appPassword = process.env.GMAIL_APP_PASSWORD || 'iuvbtfuhjnggmjeu';
const appName = process.env.GMAIL_APP_NAME || 'RoastMyResume';

let cachedFuturaBase64: string | null = null;
function getFuturaDisplayBase64(): string {
  if (!cachedFuturaBase64) {
    try {
      const fontPath = path.join(
        process.cwd(),
        'public/assets/fonts/futura_display/Futura Display.ttf'
      );
      if (fs.existsSync(fontPath)) {
        cachedFuturaBase64 = fs.readFileSync(fontPath).toString('base64');
      }
    } catch (e) {
      console.warn('Could not read Futura Display font file:', e);
    }
  }
  return cachedFuturaBase64 || '';
}

/**
 * Creates and returns a Nodemailer transporter using Gmail SMTP.
 */
export function getGmailTransporter() {
  if (!sender || !appPassword) {
    throw new Error('GMAIL_OTP_SENDER and GMAIL_APP_PASSWORD must be configured');
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: sender,
      pass: appPassword,
    },
  });
}

/**
 * Sends a redesigned, modern OTP verification email styled with Futura Display
 * and matching RoastMyResume's 6-box dark-mode aesthetic.
 */
export async function sendOtpEmail(to: string, otp: string) {
  const transporter = getGmailTransporter();
  const futuraBase64 = getFuturaDisplayBase64();

  const logoPath = path.join(process.cwd(), 'public/assets/logos/rmr_logo.png');
  const hasLogo = fs.existsSync(logoPath);

  const digits = otp.split('').slice(0, 6);
  const digitCells = digits
    .map(
      (d) => `
        <td style="padding: 0 4px;" align="center" valign="middle">
          <div style="width: 44px; height: 58px; line-height: 58px; text-align: center; border: 2px solid #ffffff; border-radius: 14px; background-color: #17171a; color: #ffffff; font-size: 32px; font-weight: 800; font-family: 'Futura Display', 'Futura', Impact, 'Arial Black', sans-serif;">
            ${d}
          </div>
        </td>
      `
    )
    .join('');

  const fontFaceStyle = futuraBase64
    ? `
      @font-face {
        font-family: 'Futura Display';
        src: url('data:font/truetype;charset=utf-8;base64,${futuraBase64}') format('truetype');
        font-weight: 800;
        font-style: normal;
      }
    `
    : '';

  const mailOptions = {
    from: `"${appName}" <${sender}>`,
    to,
    subject: `${otp} is your ${appName} verification code`,
    text: `Your RoastMyResume verification code is: ${otp}\n\nNote: The OTP expires in 10 minutes.\nEnter this code in your browser to complete your registration.`,
    attachments: hasLogo
      ? [
          {
            filename: 'rmr_logo.png',
            path: logoPath,
            cid: 'rmr_logo',
          },
        ]
      : [],
    html: `
      <!DOCTYPE html>
      <html lang="en">
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${appName} Verification</title>
          <style>
            ${fontFaceStyle}
            .futura-font {
              font-family: 'Futura Display', 'Futura', Impact, 'Arial Black', sans-serif !important;
            }
            @media only screen and (max-width: 480px) {
              .email-container {
                width: 100% !important;
                padding: 24px 16px !important;
              }
              .code-box {
                width: 38px !important;
                height: 52px !important;
                line-height: 52px !important;
                font-size: 26px !important;
              }
            }
          </style>
        </head>
        <body style="margin: 0; padding: 32px 12px; background-color: #0b0c0e; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
          <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 480px; margin: 0 auto;">
            <tr>
              <td>
                <!-- Main Modal Card -->
                <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" class="email-container" style="background-color: #17171a; border-radius: 28px; border: 2px solid #ffffff; overflow: hidden; box-shadow: 0 20px 40px rgba(0,0,0,0.7);">
                  <tr>
                    <td style="padding: 40px 28px; text-align: center;">

                      ${
                        hasLogo
                          ? `
                            <div style="margin-bottom: 14px;">
                              <img src="cid:rmr_logo" width="56" height="70" alt="${appName}" style="display: block; margin: 0 auto; border: 0;" />
                            </div>
                          `
                          : ''
                      }

                      <!-- RoastMyResume Title in Futura Display -->
                      <h1 class="futura-font" style="color: #ffffff; font-family: 'Futura Display', 'Futura', Impact, 'Arial Black', sans-serif; font-size: 38px; font-weight: 800; letter-spacing: 2px; margin: 0 0 6px 0; text-transform: uppercase;">
                        ${appName}
                      </h1>

                      <p style="color: #9da0a6; font-size: 14px; font-weight: 500; letter-spacing: 0.5px; margin: 0 0 28px 0;">
                        Takes 20 seconds. No credit card, no fluff.
                      </p>

                      <!-- Inner Card for Code -->
                      <div style="background-color: #0f1012; border: 1.5px solid rgba(255, 255, 255, 0.25); border-radius: 20px; padding: 26px 16px; margin: 0 auto 24px auto;">
                        <p class="futura-font" style="color: #ffffff; font-family: 'Futura Display', 'Futura', Impact, 'Arial Black', sans-serif; font-size: 14px; font-weight: 800; text-transform: uppercase; letter-spacing: 2.5px; margin: 0 0 18px 0;">
                          Verify OTP
                        </p>

                        <!-- 6-digit boxes matching the web app design -->
                        <table align="center" border="0" cellpadding="0" cellspacing="0" style="margin: 0 auto;">
                          <tr>
                            ${digitCells}
                          </tr>
                        </table>

                        <p style="color: #c7c9cc; font-size: 13px; font-weight: 600; margin: 18px 0 0 0;">
                          Note: the OTP expires in 10 Minutes
                        </p>
                      </div>

                      <p style="color: #8c8e94; font-size: 13px; line-height: 1.6; margin: 0 0 16px 0;">
                        Enter this code in your browser to verify your email and finish setting up your account.
                      </p>

                      <p style="color: #5d5f66; font-size: 11px; line-height: 1.5; margin: 24px 0 0 0;">
                        If you didn't request this verification code, you can safely disregard this email.
                        <br /><br />
                        &copy; 2026 ${appName}. All rights reserved.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `,
  };

  return transporter.sendMail(mailOptions);
}
