type PrevoPayload = {
  email: string;
  name?: string;
  phone?: string;
  tags?: string[];
  utm?: Record<string, string>;
};

async function sleep(ms: number) {
  await new Promise((resolve) => setTimeout(resolve, ms));
}

export async function pushToPrevo(payload: PrevoPayload) {
  const apiUrl = process.env.PREVO_API_URL;
  const apiKey = process.env.PREVO_API_KEY;
  if (!apiUrl || !apiKey) return;

  let lastError: unknown = null;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(`Prevo error ${res.status}`);
      return;
    } catch (error) {
      lastError = error;
      if (attempt < 3) await sleep(250 * attempt);
    }
  }
  throw lastError;
}
