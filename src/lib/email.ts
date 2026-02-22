import { Resend } from "resend";

function getResendClient() {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY가 설정되지 않았습니다.");
  return new Resend(apiKey);
}

const APP_NAME = "Creative Salon";
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev";

interface InviteEmailParams {
  to: string;
  inviterName: string;
  groupName: string;
  inviteToken: string;
}

export async function sendInviteEmail({
  to,
  inviterName,
  groupName,
  inviteToken,
}: InviteEmailParams) {
  const baseUrl = process.env.NEXTAUTH_URL || process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : "http://localhost:3000";

  const inviteUrl = `${baseUrl}/invite/${inviteToken}`;

  const resend = getResendClient();
  const { data, error } = await resend.emails.send({
    from: `${APP_NAME} <${FROM_EMAIL}>`,
    to,
    subject: `${inviterName}님이 "${groupName}" 모임에 초대했습니다`,
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
        <h2 style="color: #d97706; margin-bottom: 8px;">${APP_NAME}</h2>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;" />

        <p style="color: #374151; font-size: 16px; line-height: 1.6;">
          <strong>${inviterName}</strong>님이 <strong>"${groupName}"</strong> 독서 모임에 초대했습니다.
        </p>

        <a href="${inviteUrl}"
           style="display: inline-block; background-color: #d97706; color: white; text-decoration: none; padding: 12px 32px; border-radius: 8px; font-weight: 600; margin: 24px 0;">
          초대 수락하기
        </a>

        <p style="color: #9ca3af; font-size: 13px; margin-top: 32px;">
          이 초대는 7일 후 만료됩니다.<br/>
          버튼이 작동하지 않으면 아래 링크를 복사해주세요:<br/>
          <a href="${inviteUrl}" style="color: #d97706;">${inviteUrl}</a>
        </p>
      </div>
    `,
  });

  if (error) {
    console.error("이메일 발송 실패:", error);
    throw new Error(`이메일 발송 실패: ${error.message}`);
  }

  return data;
}
