const base = process.env.SMOKE_BASE_URL || 'http://localhost:4321';

async function check(path: string) {
  const res = await fetch(`${base}${path}`);
  console.log(path, res.status);
  return res;
}

async function main() {
  await check('/api/health');
  await check('/api/events?location=koblenz');
  const submit = await fetch(`${base}/api/forms/kontakt/submit`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({
      payload: { name: 'Smoke', email: 'smoke@example.com', message: 'Hello' },
      consent: { privacy: true },
      honeypot: ''
    })
  });
  console.log('/api/forms/kontakt/submit', submit.status);
}

main();
