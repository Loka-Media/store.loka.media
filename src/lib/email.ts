import nodemailer from 'nodemailer';

/**
 * Nodemailer Email Service for Loka Media
 */

// Helper to get transporter instance
export const getMailTransporter = () => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT || '465', 10);
  const secure = process.env.SMTP_SECURE !== undefined ? process.env.SMTP_SECURE === 'true' : port === 465;
  const user = process.env.SMTP_USER || '';
  const pass = process.env.SMTP_PASS || '';

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user,
      pass,
    },
  });
};

const getSenderAddress = () => {
  const fromConfig = process.env.EMAIL_FROM || 'Loka Media';
  const userEmail = process.env.SMTP_USER || 'noreply@loka.media';

  if (fromConfig.includes('<') && fromConfig.includes('>')) {
    return fromConfig;
  }
  return `"${fromConfig}" <${userEmail}>`;
};

export interface SendEmailOptions {
  to: string;
  name?: string;
  type: 'pending_approval' | 'approved' | 'rejected' | 'password_reset' | 'email_verification';
  appUrl?: string;
  otp?: string;
}

export interface SendOtpEmailOptions {
  to: string;
  name?: string;
  otp: string;
  type: 'password_reset' | 'email_verification';
}

export const sendNodemailerEmail = async ({ to, name, type, appUrl, otp }: SendEmailOptions) => {
  const recipientName = name || 'Creator';
  const rawBaseUrl = appUrl || process.env.FRONTEND_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://store-loka-ui-v2-glksz.ondigitalocean.app';
  const baseUrl = rawBaseUrl.replace(/\/$/, '');
  const creatorLoginUrl = `${baseUrl}/auth/login?redirect=/dashboard/creator`;

  let subject = '';
  let html = '';

  if (type === 'pending_approval') {
    subject = 'Application Received - Waiting for Approval';
    html = `
      <div style="font-family: Arial, sans-serif; background-color: #0d0d0d; color: #ffffff; padding: 32px; border-radius: 16px; max-width: 600px; margin: 0 auto; border: 1px solid #222;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #FF6D1F; font-size: 24px; font-weight: 800; margin: 0;">LOKA MEDIA</h1>
          <p style="color: #888888; font-size: 12px; margin-top: 4px;">Monetization Made Easy</p>
        </div>
        <h2 style="color: #ffffff; font-size: 18px; margin-bottom: 12px;">Hi ${recipientName},</h2>
        <p style="font-size: 14px; color: #cccccc; line-height: 1.6;">
          Thank you for registering on <strong>Loka Media</strong>! We have received your creator account application.
        </p>
        <div style="background-color: #161616; border-left: 4px solid #FF6D1F; padding: 18px; margin: 24px 0; border-radius: 8px;">
          <p style="margin: 0; font-weight: bold; color: #FF6D1F; font-size: 15px;">
            ⏳ Application Status: Pending Review
          </p>
          <p style="margin: 8px 0 0 0; color: #bbbbbb; font-size: 14px; line-height: 1.5;">
            Please wait for an approval. Our admin team is reviewing your application and it will be done shortly!
          </p>
        </div>
        <p style="font-size: 13px; color: #999999; line-height: 1.5;">
          You will receive an automated confirmation email as soon as your account is approved.
        </p>
        <hr style="border: none; border-top: 1px solid #222222; margin: 28px 0 20px 0;" />
        <p style="font-size: 11px; color: #666666; text-align: center; margin: 0;">
          © ${new Date().getFullYear()} Loka Media. All rights reserved.
        </p>
      </div>
    `;
  } else if (type === 'approved') {
    subject = 'Congratulations! Your Loka Media Creator Account is Approved 🎉';
    html = `
      <div style="font-family: Arial, sans-serif; background-color: #0d0d0d; color: #ffffff; padding: 32px; border-radius: 16px; max-width: 600px; margin: 0 auto; border: 1px solid #222;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #FF6D1F; font-size: 24px; font-weight: 800; margin: 0;">LOKA MEDIA</h1>
          <p style="color: #888888; font-size: 12px; margin-top: 4px;">Monetization Made Easy</p>
        </div>
        <h2 style="color: #22c55e; font-size: 20px; margin-bottom: 12px;">Congratulations ${recipientName}! 🎉</h2>
        <p style="font-size: 14px; color: #cccccc; line-height: 1.6;">
          Great news! Your creator application on <strong>Loka Media</strong> has been officially approved by our admin team.
        </p>
        <div style="background-color: #161616; border-left: 4px solid #22c55e; padding: 18px; margin: 24px 0; border-radius: 8px;">
          <p style="margin: 0; font-weight: bold; color: #22c55e; font-size: 15px;">
            ✅ Access Granted to Creator Hub
          </p>
          <p style="margin: 8px 0 0 0; color: #bbbbbb; font-size: 14px; line-height: 1.5;">
            You can now log in, design custom products, set your custom profit markups, and publish live to the marketplace!
          </p>
        </div>
        <div style="text-align: center; margin: 28px 0;">
          <a href="${creatorLoginUrl}" style="display: inline-block; background-color: #FF6D1F; color: #ffffff; padding: 14px 28px; text-decoration: none; font-weight: bold; font-size: 14px; border-radius: 10px;">
            Go to Creator Hub →
          </a>
        </div>
        <hr style="border: none; border-top: 1px solid #222222; margin: 28px 0 20px 0;" />
        <p style="font-size: 11px; color: #666666; text-align: center; margin: 0;">
          © ${new Date().getFullYear()} Loka Media. All rights reserved.
        </p>
      </div>
    `;
  } else if (type === 'rejected') {
    subject = 'Update on Your Loka Media Creator Application';
    html = `
      <div style="font-family: Arial, sans-serif; background-color: #0d0d0d; color: #ffffff; padding: 32px; border-radius: 16px; max-width: 600px; margin: 0 auto; border: 1px solid #222;">
        <div style="text-align: center; margin-bottom: 24px;">
          <h1 style="color: #FF6D1F; font-size: 24px; font-weight: 800; margin: 0;">LOKA MEDIA</h1>
          <p style="color: #888888; font-size: 12px; margin-top: 4px;">Monetization Made Easy</p>
        </div>
        <h2 style="color: #ef4444; font-size: 18px; margin-bottom: 12px;">Application Status Update</h2>
        <p style="font-size: 14px; color: #cccccc; line-height: 1.6;">
          Hi ${recipientName},
        </p>
        <p style="font-size: 14px; color: #cccccc; line-height: 1.6;">
          Thank you for your interest in joining <strong>Loka Media</strong> as a creator.
        </p>
        <div style="background-color: #161616; border-left: 4px solid #ef4444; padding: 18px; margin: 24px 0; border-radius: 8px;">
          <p style="margin: 0; font-weight: bold; color: #ef4444; font-size: 15px;">
            Application Status: Not Approved
          </p>
          <p style="margin: 8px 0 0 0; color: #bbbbbb; font-size: 14px; line-height: 1.5;">
            Regrettably, your creator application was not approved at this time. You may still continue using Loka Media as a customer.
          </p>
        </div>
        <p style="font-size: 13px; color: #999999; line-height: 1.5;">
          If you have any questions or would like to provide additional details for reconsideration, please contact our support team.
        </p>
        <hr style="border: none; border-top: 1px solid #222222; margin: 28px 0 20px 0;" />
        <p style="font-size: 11px; color: #666666; text-align: center; margin: 0;">
          © ${new Date().getFullYear()} Loka Media. All rights reserved.
        </p>
      </div>
    `;
  } else if (type === 'password_reset' || type === 'email_verification') {
    return sendOtpEmail({
      to,
      name,
      otp: otp || '',
      type,
    });
  }

  try {
    const transporter = getMailTransporter();
    const info = await transporter.sendMail({
      from: getSenderAddress(),
      to,
      subject,
      html,
    });

    console.log(`[Nodemailer Email Sent] Type: ${type}, To: ${to}, MessageId: ${info.messageId}`);
    return { success: true, data: info };
  } catch (error: any) {
    console.error('[Nodemailer Exception]', error);
    return { success: false, error: error?.message || 'Failed to send email' };
  }
};

export const sendOtpEmail = async ({ to, name, otp, type }: SendOtpEmailOptions) => {
  const recipientName = name || 'there';
  const isPasswordReset = type === 'password_reset';
  const subject = isPasswordReset
    ? 'Your Password Reset OTP - Loka Media'
    : 'Verify Your Email Address - Loka Media';

  const title = isPasswordReset ? 'Password Reset Verification' : 'Email Verification Code';
  const description = isPasswordReset
    ? 'We received a request to reset your password for your Loka Media account. Use the 6-digit OTP code below to securely set a new password.'
    : 'Welcome to Loka Media! Please use the 6-digit OTP code below to verify your email address and activate your account.';

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0a0a0a; color: #ffffff; padding: 36px 20px; max-width: 580px; margin: 0 auto; border-radius: 16px; border: 1px solid #222;">
      <div style="text-align: center; margin-bottom: 28px;">
        <h1 style="color: #FF6D1F; font-size: 26px; font-weight: 900; letter-spacing: -0.5px; margin: 0;">LOKA MEDIA</h1>
        <p style="color: #888888; font-size: 12px; margin-top: 4px; letter-spacing: 0.5px;">Monetization Made Easy</p>
      </div>

      <div style="background-color: #141414; border: 1px solid #262626; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px;">
        <h2 style="color: #ffffff; font-size: 20px; font-weight: 700; margin: 0 0 10px 0;">${title}</h2>
        <p style="color: #cccccc; font-size: 14px; line-height: 1.5; margin: 0 0 20px 0;">
          Hi ${recipientName},<br />
          ${description}
        </p>

        <div style="background-color: #0a0a0a; border: 2px dashed #FF6D1F; border-radius: 12px; padding: 18px; margin: 20px auto; display: inline-block;">
          <span style="font-family: monospace, 'Courier New', Courier; font-size: 34px; font-weight: 800; letter-spacing: 10px; color: #FF6D1F; padding-left: 10px;">${otp}</span>
        </div>

        <p style="color: #888888; font-size: 12px; margin: 12px 0 0 0;">
          ⏳ This code is valid for <strong>10 minutes</strong>. Never share this code with anyone.
        </p>
      </div>

      <p style="color: #777777; font-size: 12px; line-height: 1.5; margin: 0 0 16px 0; text-align: center;">
        If you did not request this OTP, you can safely ignore this email.
      </p>

      <hr style="border: none; border-top: 1px solid #1f1f1f; margin: 24px 0 16px 0;" />
      <p style="font-size: 11px; color: #555555; text-align: center; margin: 0;">
        © ${new Date().getFullYear()} Loka Media. All rights reserved.
      </p>
    </div>
  `;

  try {
    const transporter = getMailTransporter();
    const info = await transporter.sendMail({
      from: getSenderAddress(),
      to,
      subject,
      html,
    });

    console.log(`[Nodemailer OTP Email Sent] Type: ${type}, To: ${to}, MessageId: ${info.messageId}`);
    return { success: true, data: info };
  } catch (error: any) {
    console.error('[Nodemailer OTP Exception]', error);
    return { success: false, error: error?.message || 'Failed to send OTP email' };
  }
};

// Alias sendResendEmail for backward compatibility with existing imports
export const sendResendEmail = sendNodemailerEmail;
export const sendEmail = sendNodemailerEmail;

export interface OrderCancellationEmailOptions {
  to: string;
  customerName?: string;
  orderNumber: string;
  products?: Array<{
    name: string;
    quantity?: number;
    price?: string | number;
    image?: string | null;
    variant?: string | null;
  }>;
  totalAmount?: string | number;
  isRefunded?: boolean;
  cancelReason?: string;
}

export const sendOrderCancellationEmail = async ({
  to,
  customerName,
  orderNumber,
  products = [],
  totalAmount,
  isRefunded = false,
  cancelReason,
}: OrderCancellationEmailOptions) => {
  const name = customerName || 'Valued Customer';
  const subject = `Order #${orderNumber} Cancelled - Loka Media`;

  const productsHtml = products.length > 0
    ? `
      <div style="background-color: #141414; border: 1px solid #262626; border-radius: 12px; padding: 18px; margin: 20px 0;">
        <p style="margin: 0 0 14px 0; font-size: 13px; font-weight: 700; color: #a3a3a3; text-transform: uppercase; letter-spacing: 0.5px;">Cancelled Items</p>
        <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse;">
          ${products.map((p, idx) => `
            <tr>
              ${p.image ? `
                <td width="64" valign="middle" style="padding: 10px 12px 10px 0; width: 64px; ${idx < products.length - 1 ? 'border-bottom: 1px solid #222222;' : ''}">
                  <img src="${p.image}" alt="${p.name}" width="56" height="56" style="display: block; width: 56px; height: 56px; object-fit: cover; border-radius: 8px; border: 1px solid #333333; background-color: #1f1f1f;" />
                </td>
              ` : `
                <td width="64" valign="middle" style="padding: 10px 12px 10px 0; width: 64px; ${idx < products.length - 1 ? 'border-bottom: 1px solid #222222;' : ''}">
                  <div style="width: 56px; height: 56px; border-radius: 8px; border: 1px solid #333333; background-color: #1f1f1f; text-align: center; line-height: 56px; font-size: 22px;">📦</div>
                </td>
              `}
              <td valign="middle" style="padding: 10px 8px 10px 0; ${idx < products.length - 1 ? 'border-bottom: 1px solid #222222;' : ''}">
                <p style="margin: 0; font-size: 14px; font-weight: 600; color: #ffffff; line-height: 1.4;">${p.name}</p>
                <p style="margin: 4px 0 0 0; font-size: 12px; color: #888888;">
                  ${[p.variant, `Qty: ${p.quantity || 1}`].filter(Boolean).join(' • ')}
                </p>
              </td>
              <td width="75" align="right" valign="middle" style="padding: 10px 0; width: 75px; text-align: right; ${idx < products.length - 1 ? 'border-bottom: 1px solid #222222;' : ''}">
                <p style="margin: 0; font-size: 14px; font-weight: 700; color: #ffffff; text-align: right;">
                  ${p.price ? `$${typeof p.price === 'number' ? p.price.toFixed(2) : p.price}` : ''}
                </p>
              </td>
            </tr>
          `).join('')}
        </table>
        ${totalAmount ? `
          <table width="100%" cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; margin-top: 14px; padding-top: 14px; border-top: 1px solid #2c2c2c;">
            <tr>
              <td valign="middle" style="font-size: 14px; font-weight: 700; color: #ffffff; padding-top: 12px;">Total Order Amount</td>
              <td align="right" valign="middle" style="font-size: 16px; font-weight: 800; color: #FF6D1F; padding-top: 12px; text-align: right;">
                $${typeof totalAmount === 'number' ? totalAmount.toFixed(2) : totalAmount}
              </td>
            </tr>
          </table>
        ` : ''}
      </div>
    `
    : '';

  const refundMessage = isRefunded
    ? `
      <div style="background-color: #0f1f15; border-left: 4px solid #22c55e; padding: 16px; margin: 20px 0; border-radius: 8px;">
        <p style="margin: 0; font-weight: 700; color: #22c55e; font-size: 14px;">
          💳 Refund Processed
        </p>
        <p style="margin: 6px 0 0 0; color: #cccccc; font-size: 13px; line-height: 1.5;">
          A full refund of <strong>$${typeof totalAmount === 'number' ? totalAmount.toFixed(2) : (totalAmount || '0.00')}</strong> has been processed to your original payment method. Depending on your bank, it should reflect on your card or account within 5-10 business days.
        </p>
      </div>
    `
    : `
      <div style="background-color: #1a1614; border-left: 4px solid #FF6D1F; padding: 16px; margin: 20px 0; border-radius: 8px;">
        <p style="margin: 0; font-weight: 700; color: #FF6D1F; font-size: 14px;">
          ℹ️ Order Status: Cancelled
        </p>
        <p style="margin: 6px 0 0 0; color: #cccccc; font-size: 13px; line-height: 1.5;">
          Your order has been cancelled and production will not proceed. Any pending authorization on your card will be released.
        </p>
      </div>
    `;

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #0a0a0a; color: #ffffff; padding: 36px 20px; max-width: 600px; margin: 0 auto; border-radius: 20px; border: 1px solid #222;">
      <div style="text-align: center; margin-bottom: 28px;">
        <h1 style="color: #FF6D1F; font-size: 26px; font-weight: 900; letter-spacing: -0.5px; margin: 0;">LOKA MEDIA</h1>
        <p style="color: #777777; font-size: 12px; margin-top: 4px; letter-spacing: 0.5px;">Monetization Made Easy</p>
      </div>

      <div style="background: linear-gradient(135deg, rgba(239,68,68,0.1), rgba(255,109,31,0.05)); border: 1px solid rgba(239,68,68,0.25); border-radius: 14px; padding: 20px; text-align: center; margin-bottom: 24px;">
        <span style="display: inline-block; font-size: 24px; margin-bottom: 6px;">❌</span>
        <h2 style="color: #ef4444; font-size: 20px; font-weight: 700; margin: 0 0 6px 0;">Order Cancelled</h2>
        <p style="color: #e5e5e5; font-size: 13px; margin: 0; font-family: monospace;">Order ID: ${orderNumber}</p>
      </div>

      <p style="font-size: 15px; color: #e5e5e5; line-height: 1.6; margin: 0 0 12px 0;">
        Hi ${name},
      </p>
      <p style="font-size: 14px; color: #a3a3a3; line-height: 1.6; margin: 0 0 16px 0;">
        We are writing to notify you that your order <strong>${orderNumber}</strong> has been cancelled${cancelReason ? `: <em>${cancelReason}</em>` : '.'}
      </p>

      ${refundMessage}

      ${productsHtml}

      <div style="margin-top: 24px; padding: 16px; background-color: #121212; border-radius: 10px; border: 1px solid #1f1f1f;">
        <p style="margin: 0; font-size: 13px; color: #888888; line-height: 1.5;">
          Have questions or need assistance? Reply directly to this email or reach us at <a href="mailto:support@loka.media" style="color: #FF6D1F; text-decoration: none; font-weight: 600;">support@loka.media</a>.
        </p>
      </div>

      <hr style="border: none; border-top: 1px solid #1f1f1f; margin: 28px 0 20px 0;" />
      <p style="font-size: 11px; color: #555555; text-align: center; margin: 0;">
        © ${new Date().getFullYear()} Loka Media. All rights reserved.
      </p>
    </div>
  `;

  try {
    const transporter = getMailTransporter();
    const info = await transporter.sendMail({
      from: getSenderAddress(),
      to,
      subject,
      html,
    });

    console.log(`[Nodemailer Cancellation Email Sent] Order: ${orderNumber}, To: ${to}, MessageId: ${info.messageId}`);
    return { success: true, data: info };
  } catch (error: any) {
    console.error('[Nodemailer Cancellation Exception]', error);
    return { success: false, error: error?.message || 'Failed to send cancellation email' };
  }
};
