const { Resend } = require('resend');

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const ADMIN_NOTIFY_EMAIL = process.env.ADMIN_NOTIFY_EMAIL;
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('ko-KR');
};

const buildBody = ({ application, section }) => {
  return [
    `강습 신청 접수 알림`,
    ``,
    `신청자: ${application.name || ''}`,
    `전화번호: ${application.phone || ''}`,
    `종목: ${section?.sport || ''}`,
    `회차명: ${section?.title || ''}`,
    `신청기간: ${formatDate(section?.apply_start_at)} ~ ${formatDate(section?.apply_end_at)}`,
    `참가 인원: ${application.participants ?? ''}`,
    `요청 사항: ${application.request_note ?? ''}`,
    `메모: ${application.memo ?? ''}`,
    ``,
    `신청 시간: ${formatDate(application.created_at)}`
  ].join('\n');
};

const sendAdminNotification = async ({ application, section }) => {
  if (!resend || !ADMIN_NOTIFY_EMAIL) {
    console.warn('[mailer] skipped: missing RESEND_API_KEY or ADMIN_NOTIFY_EMAIL');
    return { ok: false, skipped: true, reason: 'missing resend or admin email' };
  }

  const subject = `강습 신청 접수 알림 - ${section?.sport || '강습'}`;
  const text = buildBody({ application, section });

  console.log('[mailer] sending to', ADMIN_NOTIFY_EMAIL, 'from', FROM_EMAIL);
  const { error } = await resend.emails.send({
    from: FROM_EMAIL,
    to: ADMIN_NOTIFY_EMAIL,
    subject,
    text
  });

  if (error) {
    console.error('[mailer] send error', error);
    return { ok: false, error };
  }
  console.log('[mailer] sent');
  return { ok: true };
};

module.exports = {
  sendAdminNotification
};
