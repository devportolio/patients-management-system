import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Deterministic sample data so the seed is repeatable and the README can document logins.
const FIRST_NAMES = [
  'Ada', 'Alan', 'Grace', 'Linus', 'Margaret', 'Dennis', 'Barbara', 'Edsger',
  'Katherine', 'Tim', 'Radia', 'Donald', 'Frances', 'Ken', 'Hedy', 'John',
  'Anita', 'Guido', 'Shafi', 'Leslie', 'Vint', 'Adele', 'Brian', 'Sophie',
];
const LAST_NAMES = [
  'Lovelace', 'Turing', 'Hopper', 'Torvalds', 'Hamilton', 'Ritchie', 'Liskov',
  'Dijkstra', 'Johnson', 'Berners-Lee', 'Perlman', 'Knuth', 'Allen', 'Thompson',
  'Lamarr', 'Carmack', 'Borg', 'van Rossum', 'Goldwasser', 'Lamport',
];

function pseudoRandom(seed: number): number {
  // Deterministic LCG — avoids Math.random so seeds are reproducible.
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function buildPatient(index: number) {
  const firstName = FIRST_NAMES[index % FIRST_NAMES.length]!;
  const lastName = LAST_NAMES[(index * 7) % LAST_NAMES.length]!;
  const year = 1945 + Math.floor(pseudoRandom(index + 1) * 60);
  const month = 1 + Math.floor(pseudoRandom(index + 2) * 12);
  const day = 1 + Math.floor(pseudoRandom(index + 3) * 27);
  const dob = new Date(Date.UTC(year, month - 1, day));
  const phoneSuffix = String(1000 + Math.floor(pseudoRandom(index + 4) * 8999));
  return {
    firstName,
    lastName,
    email: `${firstName}.${lastName}.${index}`.toLowerCase().replace(/[^a-z0-9.]/g, '') +
      '@example.com',
    phoneNumber: `+1 (555) 0${String(index).padStart(2, '0')}-${phoneSuffix}`,
    dob,
  };
}

async function main() {
  console.log('🌱 Seeding database...');

  const passwordHash = await bcrypt.hash('Password123!', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@demo.com' },
    update: {},
    create: { email: 'admin@demo.com', passwordHash, role: Role.admin },
  });

  const user = await prisma.user.upsert({
    where: { email: 'user@demo.com' },
    update: {},
    create: { email: 'user@demo.com', passwordHash, role: Role.user },
  });

  console.log(`👤 Users ready: ${admin.email} (admin), ${user.email} (user)`);

  const existing = await prisma.patient.count();
  if (existing === 0) {
    const patients = Array.from({ length: 50 }, (_, i) => buildPatient(i));
    await prisma.patient.createMany({ data: patients, skipDuplicates: true });
    console.log(`🧑‍⚕️ Created ${patients.length} sample patients`);
  } else {
    console.log(`🧑‍⚕️ Patients already present (${existing}); skipping`);
  }

  console.log('✅ Seed complete. Login with Password123! for either demo account.');
}

main()
  .catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
