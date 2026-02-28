import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/lib/security.js';

const prisma = new PrismaClient();

async function main() {
  const email = (process.env.ADMIN_DEFAULT_EMAIL || 'admin@bowlingroom.local').toLowerCase();
  const password = process.env.ADMIN_DEFAULT_PASSWORD || 'ChangeMe123!';

  const admin = await prisma.user.upsert({
    where: { email },
    update: {},
    create: {
      email,
      passwordHash: hashPassword(password),
      role: 'ADMIN',
      isActive: true
    }
  });

  const koblenz = await prisma.location.upsert({
    where: { slug: 'koblenz' },
    update: {},
    create: {
      slug: 'koblenz',
      name: 'Bowlingroom Koblenz',
      city: 'Koblenz',
      country: 'DE',
      status: 'PUBLISHED'
    }
  });

  const form = await prisma.form.upsert({
    where: { slug: 'kontakt' },
    update: {},
    create: {
      name: 'Kontaktformular',
      slug: 'kontakt',
      status: 'PUBLISHED',
      locationId: koblenz.id,
      trackingEventName: 'form_submit_kontakt'
    }
  });

  await prisma.formField.createMany({
    data: [
      { formId: form.id, type: 'TEXT', name: 'name', label: 'Name', required: true, sortOrder: 10 },
      { formId: form.id, type: 'EMAIL', name: 'email', label: 'E-Mail', required: true, sortOrder: 20 },
      { formId: form.id, type: 'TEXTAREA', name: 'message', label: 'Nachricht', required: true, sortOrder: 30 },
      { formId: form.id, type: 'CONSENT', name: 'consent', label: 'Datenschutz akzeptiert', required: true, sortOrder: 40 }
    ],
    skipDuplicates: true
  });

  console.log('Seed complete:', { admin: admin.email, location: koblenz.slug, form: form.slug });
}

main().finally(async () => prisma.$disconnect());
