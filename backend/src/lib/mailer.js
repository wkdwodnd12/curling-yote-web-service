const { Resend } = require('resend');

const RESEND_API_KEY = process.env.RESEND_API_KEY;
const ADMIN_NOTIFY_EMAIL = process.env.ADMIN_NOTIFY_EMAIL || '';
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
const REPLY_TO_EMAIL = process.env.RESEND_REPLY_TO_EMAIL || '';

const resend = RESEND_API_KEY ? new Resend(RESEND_API_KEY) : null;

const formatDate = (value) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleString('ko-KR');
};

const buildBody = ({ application, section, applicantEmail }) => {
  return [
    `강습 신청 접수 알림`,
    ``,
    `신청자: ${application.name || ''}`,
    `신청자 이메일: ${applicantEmail || ''}`,
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

const sendAdminNotification = async ({ application, section, applicantEmail = '' }) => {
  const recipients = ADMIN_NOTIFY_EMAIL.split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  if (!resend || recipients.length === 0) {
    console.warn('[mailer] skipped: missing RESEND_API_KEY or ADMIN_NOTIFY_EMAIL');
    return { ok: false, skipped: true, reason: 'missing resend or admin email' };
  }

  const subject = `강습 신청 접수 알림 - ${section?.sport || '강습'}`;
  const text = buildBody({ application, section, applicantEmail });

  const payload = {
    from: FROM_EMAIL,
    to: recipients,
    subject,
    text
  };
  if (REPLY_TO_EMAIL) payload.replyTo = REPLY_TO_EMAIL;

  console.log('[mailer] sending to', recipients.join(','), 'from', FROM_EMAIL);
  const { error } = await resend.emails.send(payload);

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
