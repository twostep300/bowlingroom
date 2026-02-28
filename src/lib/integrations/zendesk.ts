export async function pushToZendesk(params: {
  subject: string;
  text: string;
  recipientEmail?: string | null;
  webhookUrl?: string | null;
}) {
  if (params.webhookUrl) {
    const res = await fetch(params.webhookUrl, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ subject: params.subject, text: params.text })
    });
    if (!res.ok) throw new Error(`Zendesk webhook failed: ${res.status}`);
    return;
  }

  if (params.recipientEmail) {
    // Placeholder for SMTP/sendmail integration.
    // In production wire this to your mail transport provider.
    return;
  }
}
