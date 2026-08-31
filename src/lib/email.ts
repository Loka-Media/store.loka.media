/**
 * Resend Email Service for Loka Media
 */

export interface SendEmailOptions {
  to: string;
  name?: string;
  type: 'pending_approval' | 'approved' | 'rejected';
}

export const sendResendEmail = async ({ to, name, type }: SendEmailOptions) => {
  const apiKey = process.env.RESEND_API_KEY || '';
  const fromEmail = process.env.EMAIL_FROM || 'Loka Media <noreply@loka.media>';

  if (!apiKey) {
    console.warn('[Resend Email] RESEND_API_KEY is not defined');
    return { success: false, error: 'RESEND_API_KEY missing' };
  }

  const recipientName = name || 'Creator';

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
          <a href="https://store.loka.media/auth/login" style="display: inline-block; background-color: #FF6D1F; color: #ffffff; padding: 14px 28px; text-decoration: none; font-weight: bold; font-size: 14px; border-radius: 10px;">
            Go to Creator Login →
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
  }

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        subject,
        html,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('[Resend Error]', data);
      return { success: false, error: data };
    }

    console.log(`[Resend Email Sent] Type: ${type}, To: ${to}`, data);
    return { success: true, data };
  } catch (error: any) {
    console.error('[Resend Exception]', error);
    return { success: false, error: error?.message || 'Failed to send email' };
  }
};
