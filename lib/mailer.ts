export async function sendEmail({
  to,
  subject,
  html
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const res = await fetch(process.env.APPS_SCRIPT_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      secret: process.env.APPS_SCRIPT_SECRET,
      to,
      subject,
      html
    })
  });

  const data = await res.json();
  if (!data.ok) throw new Error(data.error ?? 'Email sending failed');
}