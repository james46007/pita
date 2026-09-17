/**
 * prisma/seed.ts
 * Mock data for local development in English.
 * Run: pnpm exec prisma db seed
 */

import { PrismaClient, CourtType, AccountType, SlotStatus, BookingStatus, ComplexRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const HASH_ROUNDS = 10;

async function hash(plain: string) {
  return bcrypt.hash(plain, HASH_ROUNDS);
}

async function main() {
  console.log("🌱  Starting database seed...\n");

  // ─────────────────────────────────────────
  // 1. SUPERADMIN
  // ─────────────────────────────────────────
  const superAdmin = await prisma.user.upsert({
    where: { email: "super@pita.app" },
    update: {},
    create: {
      name: "Super Admin",
      email: "super@pita.app",
      passwordHash: await hash("SuperAdmin123!"),
      isSuperAdmin: true,
    },
  });
  console.log("✅  SuperAdmin:", superAdmin.email);

  // ─────────────────────────────────────────
  // 2. SPORTS COMPLEX 1 — Padel & Soccer North
  // ─────────────────────────────────────────
  const complex1 = await prisma.complex.upsert({
    where: { slug: "padel-norte" },
    update: {},
    create: {
      name: "Padel & Fútbol Norte",
      phone: "+573001234567",
      address: "Cra 15 #72-45, Bogotá",
      slug: "padel-norte",
      isActive: true,
    },
  });
  console.log("✅  Complex 1:", complex1.name);

  // Complex 1 Admin
  const adminC1 = await prisma.user.upsert({
    where: { email: "admin@padelnorte.com" },
    update: {},
    create: {
      name: "Carlos Rodríguez",
      email: "admin@padelnorte.com",
      passwordHash: await hash("Admin123!"),
      isSuperAdmin: false,
    },
  });

  // Complex 1 Staff
  const staffC1 = await prisma.user.upsert({
    where: { email: "staff@padelnorte.com" },
    update: {},
    create: {
      name: "Laura Gómez",
      email: "staff@padelnorte.com",
      passwordHash: await hash("Staff123!"),
      isSuperAdmin: false,
    },
  });

  // Link admin and staff to Complex 1
  await prisma.userComplex.upsert({
    where: { userId_complexId: { userId: adminC1.id, complexId: complex1.id } },
    update: {},
    create: { userId: adminC1.id, complexId: complex1.id, role: ComplexRole.ADMIN },
  });

  await prisma.userComplex.upsert({
    where: { userId_complexId: { userId: staffC1.id, complexId: complex1.id } },
    update: {},
    create: { userId: staffC1.id, complexId: complex1.id, role: ComplexRole.STAFF },
  });
  console.log("✅  Complex 1 Users:", adminC1.email, "|", staffC1.email);

  // Bank account for Complex 1
  const account1 = await prisma.bankAccount.create({
    data: {
      complexId: complex1.id,
      bankName: "Bancolombia",
      accountNumber: "12345678901",
      accountType: AccountType.SAVINGS,
      holderName: "Padel Norte SAS",
      holderId: "900123456-7",
      isActive: true,
    },
  });
  console.log("✅  Bank account:", account1.bankName, account1.accountNumber);

  // Courts for Complex 1
  const courtP1 = await prisma.court.create({
    data: {
      complexId: complex1.id,
      name: "Cancha Padel 1",
      type: CourtType.PADEL,
      pricePerHour: 80000,
      slotDurationMin: 90,
      isActive: true,
    },
  });

  const courtP2 = await prisma.court.create({
    data: {
      complexId: complex1.id,
      name: "Cancha Padel 2",
      type: CourtType.PADEL,
      pricePerHour: 80000,
      slotDurationMin: 90,
      isActive: true,
    },
  });

  const courtF1 = await prisma.court.create({
    data: {
      complexId: complex1.id,
      name: "Cancha Sintética 1",
      type: CourtType.TURF,
      pricePerHour: 150000,
      slotDurationMin: 60,
      isActive: true,
    },
  });
  console.log("✅  Complex 1 Courts: Padel 1, Padel 2, Sintética 1");

  // Operating schedules for Complex 1 (Mon-Fri 07:00-22:00, Sat-Sun 08:00-20:00)
  const operatingDays = [
    { day: 1, openTime: "07:00", closeTime: "22:00" }, // Monday
    { day: 2, openTime: "07:00", closeTime: "22:00" }, // Tuesday
    { day: 3, openTime: "07:00", closeTime: "22:00" }, // Wednesday
    { day: 4, openTime: "07:00", closeTime: "22:00" }, // Thursday
    { day: 5, openTime: "07:00", closeTime: "22:00" }, // Friday
    { day: 6, openTime: "08:00", closeTime: "20:00" }, // Saturday
    { day: 0, openTime: "08:00", closeTime: "20:00" }, // Sunday
  ];

  for (const court of [courtP1, courtP2, courtF1]) {
    for (const { day, openTime, closeTime } of operatingDays) {
      await prisma.availableSchedule.upsert({
        where: { courtId_dayOfWeek: { courtId: court.id, dayOfWeek: day } },
        update: {},
        create: {
          courtId: court.id,
          dayOfWeek: day,
          openTime,
          closeTime,
          isActive: true,
        },
      });
    }
  }
  console.log("✅  Complex 1 Schedules (7 days × 3 courts)");

  // ─────────────────────────────────────────
  // 3. SPORTS COMPLEX 2 — SportCenter South
  // ─────────────────────────────────────────
  const complex2 = await prisma.complex.upsert({
    where: { slug: "sportcenter-sur" },
    update: {},
    create: {
      name: "SportCenter Sur",
      phone: "+573109876543",
      address: "Av 68 #13-20 Sur, Bogotá",
      slug: "sportcenter-sur",
      isActive: true,
    },
  });
  console.log("✅  Complex 2:", complex2.name);

  const adminC2 = await prisma.user.upsert({
    where: { email: "admin@sportcentersur.com" },
    update: {},
    create: {
      name: "Andrés Martínez",
      email: "admin@sportcentersur.com",
      passwordHash: await hash("Admin123!"),
      isSuperAdmin: false,
    },
  });

  await prisma.userComplex.upsert({
    where: { userId_complexId: { userId: adminC2.id, complexId: complex2.id } },
    update: {},
    create: { userId: adminC2.id, complexId: complex2.id, role: ComplexRole.ADMIN },
  });

  await prisma.bankAccount.create({
    data: {
      complexId: complex2.id,
      bankName: "Davivienda",
      accountNumber: "98765432109",
      accountType: AccountType.CHECKING,
      holderName: "SportCenter Sur SAS",
      holderId: "901987654-1",
      isActive: true,
    },
  });

  const courtS1 = await prisma.court.create({
    data: {
      complexId: complex2.id,
      name: "Cancha Sintética A",
      type: CourtType.TURF,
      pricePerHour: 120000,
      slotDurationMin: 60,
      isActive: true,
    },
  });

  const courtS2 = await prisma.court.create({
    data: {
      complexId: complex2.id,
      name: "Cancha Sintética B",
      type: CourtType.TURF,
      pricePerHour: 120000,
      slotDurationMin: 60,
      isActive: true,
    },
  });
  console.log("✅  Complex 2 Courts: Sintética A, Sintética B");

  // Operating schedules for Complex 2 (Mon-Sat)
  const operatingDaysC2 = [
    { day: 1, openTime: "09:00", closeTime: "21:00" },
    { day: 2, openTime: "09:00", closeTime: "21:00" },
    { day: 3, openTime: "09:00", closeTime: "21:00" },
    { day: 4, openTime: "09:00", closeTime: "21:00" },
    { day: 5, openTime: "09:00", closeTime: "21:00" },
    { day: 6, openTime: "09:00", closeTime: "18:00" },
  ];

  for (const court of [courtS1, courtS2]) {
    for (const { day, openTime, closeTime } of operatingDaysC2) {
      await prisma.availableSchedule.upsert({
        where: { courtId_dayOfWeek: { courtId: court.id, dayOfWeek: day } },
        update: {},
        create: {
          courtId: court.id,
          dayOfWeek: day,
          openTime,
          closeTime,
          isActive: true,
        },
      });
    }
  }
  console.log("✅  Complex 2 Schedules (6 days × 2 courts)");

  // ─────────────────────────────────────────
  // 4. EXAMPLE CUSTOMERS
  // ─────────────────────────────────────────
  const customer1 = await prisma.customer.upsert({
    where: { email: "juan.perez@example.com" },
    update: {},
    create: {
      name: "Juan Pérez",
      email: "juan.perez@example.com",
      phone: "+573001112233",
      passwordHash: await hash("Cliente123!"),
      emailVerified: true,
    },
  });

  const customer2 = await prisma.customer.upsert({
    where: { email: "maria.lopez@example.com" },
    update: {},
    create: {
      name: "María López",
      email: "maria.lopez@example.com",
      phone: "+573004445566",
      passwordHash: await hash("Cliente123!"),
      emailVerified: true,
    },
  });

  const customer3 = await prisma.customer.upsert({
    where: { email: "pedro.garcia@example.com" },
    update: {},
    create: {
      name: "Pedro García",
      email: "pedro.garcia@example.com",
      phone: "+573007778899",
      passwordHash: await hash("Cliente123!"),
      emailVerified: false,
    },
  });
  console.log("✅  Customers: Juan, María, Pedro");

  // ─────────────────────────────────────────
  // 5. EXAMPLE SLOTS AND BOOKINGS
  // ─────────────────────────────────────────
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);

  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(dayAfter.getDate() + 1);

  // ── Slot 1: BOOKED + CONFIRMED (complex1, courtP1)
  const slot1 = await prisma.slot.create({
    data: {
      courtId: courtP1.id,
      date: tomorrow,
      startTime: "10:00",
      endTime: "11:30",
      status: SlotStatus.BOOKED,
    },
  });

  await prisma.booking.create({
    data: {
      slotId: slot1.id,
      courtId: courtP1.id,
      complexId: complex1.id,
      customerId: customer1.id,
      customerName: customer1.name,
      customerPhone: customer1.phone ?? "+57300000000",
      customerEmail: customer1.email,
      status: BookingStatus.CONFIRMED,
      totalAmount: 80000,
      notes: "Confirmed test booking",
    },
  });

  // ── Slot 2: BOOKED + PAYMENT_PENDING (complex1, courtP1)
  const slot2 = await prisma.slot.create({
    data: {
      courtId: courtP1.id,
      date: tomorrow,
      startTime: "12:00",
      endTime: "13:30",
      status: SlotStatus.BOOKED,
    },
  });

  await prisma.booking.create({
    data: {
      slotId: slot2.id,
      courtId: courtP1.id,
      complexId: complex1.id,
      customerId: customer2.id,
      customerName: customer2.name,
      customerPhone: customer2.phone ?? "+57300000000",
      customerEmail: customer2.email,
      status: BookingStatus.PAYMENT_PENDING,
      totalAmount: 80000,
    },
  });

  // ── Slot 3: BOOKED + RECEIPT_UPLOADED (complex1, courtF1)
  const slot3 = await prisma.slot.create({
    data: {
      courtId: courtF1.id,
      date: tomorrow,
      startTime: "08:00",
      endTime: "09:00",
      status: SlotStatus.BOOKED,
    },
  });

  await prisma.booking.create({
    data: {
      slotId: slot3.id,
      courtId: courtF1.id,
      complexId: complex1.id,
      customerId: customer3.id,
      customerName: customer3.name,
      customerPhone: customer3.phone ?? "+57300000000",
      customerEmail: customer3.email,
      status: BookingStatus.RECEIPT_UPLOADED,
      totalAmount: 150000,
      receiptUrl: "https://example.com/receipt-demo.jpg",
      notes: "Receipt uploaded, pending review",
    },
  });

  // ── Slot 4: BLOCKED (maintenance, complex1, courtP2)
  await prisma.slot.create({
    data: {
      courtId: courtP2.id,
      date: tomorrow,
      startTime: "14:00",
      endTime: "15:30",
      status: SlotStatus.BLOCKED,
    },
  });

  // ── Slot 5: BOOKED in complex2, courtS1
  const slot5 = await prisma.slot.create({
    data: {
      courtId: courtS1.id,
      date: dayAfter,
      startTime: "10:00",
      endTime: "11:00",
      status: SlotStatus.BOOKED,
    },
  });

  await prisma.booking.create({
    data: {
      slotId: slot5.id,
      courtId: courtS1.id,
      complexId: complex2.id,
      customerId: customer1.id,
      customerName: customer1.name,
      customerPhone: customer1.phone ?? "+57300000000",
      customerEmail: customer1.email,
      status: BookingStatus.CONFIRMED,
      totalAmount: 120000,
    },
  });

  console.log("✅  Example slots and reservations created");

  // ─────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────
  console.log(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
🎉  Seed completed successfully.

📋  Access Credentials:

  SuperAdmin
    Email:    super@pita.app
    Password: SuperAdmin123!

  Admin — Padel Norte  (slug: padel-norte)
    Email:    admin@padelnorte.com
    Password: Admin123!

  Staff — Padel Norte
    Email:    staff@padelnorte.com
    Password: Staff123!

  Admin — SportCenter Sur  (slug: sportcenter-sur)
    Email:    admin@sportcentersur.com
    Password: Admin123!

  Customers (all with password: Cliente123!)
    juan.perez@example.com
    maria.lopez@example.com
    pedro.garcia@example.com

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`);
}

main()
  .catch((e) => {
    console.error("❌  Error in seed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
