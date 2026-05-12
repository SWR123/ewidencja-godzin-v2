import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Starting seed...");

  // Create test users
  const testPassword = await bcrypt.hash("johndoe123", 10);
  const testUser = await prisma.user.upsert({
    where: { email: "john@doe.com" },
    update: { isActive: true },
    create: {
      email: "john@doe.com",
      password: testPassword,
      name: "Jan Testowy",
      isActive: true,
    },
  });
  console.log("Created test user:", testUser.email);

  const adminPassword = await bcrypt.hash("admin123", 10);
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@ewidencja.pl" },
    update: { isActive: true },
    create: {
      email: "admin@ewidencja.pl",
      password: adminPassword,
      name: "Administrator",
      isActive: true,
    },
  });
  console.log("Created admin user:", adminUser.email);

  // Create sample records
  const sampleRecords = [
    {
      kow: "Kow/123/2024",
      wo: "Wo/456/2024",
      ii_k: "II K 789/24",
      nazwisko: "Kowalski",
      imie: "Jan",
      kod: "87-300",
      miejscowosc: "Brodnica",
      ulica: "Królowej Jadwigi",
      nr_domu: "15",
      nr_lokalu: "3",
      data1: new Date("2024-01-01"),
      data2: new Date("2024-01-31"),
      uwagi:
        "Wykonywana praca: porządkowanie terenów sportowych, pomoc przy organizacji wydarzeń. Stosunek do pracy: bardzo dobry, punktualny, zaangażowany.",
      timeEntries: [
        { date: new Date("2024-01-05"), hours: 8 },
        { date: new Date("2024-01-08"), hours: 6 },
        { date: new Date("2024-01-12"), hours: 8 },
        { date: new Date("2024-01-15"), hours: 7 },
        { date: new Date("2024-01-19"), hours: 8 },
        { date: new Date("2024-01-22"), hours: 6 },
        { date: new Date("2024-01-26"), hours: 8 },
        { date: new Date("2024-01-29"), hours: 5 },
      ],
      suma: 56,
    },
    {
      kow: "Kow/234/2024",
      wo: "Wo/567/2024",
      ii_k: "II K 890/24",
      nazwisko: "Nowak",
      imie: "Maria",
      kod: "87-300",
      miejscowosc: "Brodnica",
      ulica: "Słowackiego",
      nr_domu: "22",
      data1: new Date("2024-02-01"),
      data2: new Date("2024-02-29"),
      uwagi:
        "Wykonywana praca: porządkowanie pomieszczeń, pomoc w obsłudze imprez. Stosunek do pracy: dobry, chętna do współpracy.",
      timeEntries: [
        { date: new Date("2024-02-02"), hours: 7 },
        { date: new Date("2024-02-06"), hours: 8 },
        { date: new Date("2024-02-09"), hours: 6 },
        { date: new Date("2024-02-13"), hours: 8 },
        { date: new Date("2024-02-16"), hours: 7 },
        { date: new Date("2024-02-20"), hours: 8 },
        { date: new Date("2024-02-23"), hours: 6 },
        { date: new Date("2024-02-27"), hours: 8 },
      ],
      suma: 58,
    },
    {
      kow: "Kow/345/2024",
      wo: "Wo/678/2024",
      ii_k: "II K 901/24",
      nazwisko: "Wiśniewski",
      imie: "Piotr",
      kod: "87-300",
      miejscowosc: "Brodnica",
      ulica: "Mickiewicza",
      nr_domu: "8",
      nr_lokalu: "12",
      data1: new Date("2024-03-01"),
      data2: new Date("2024-03-31"),
      uwagi:
        "Wykonywana praca: prace porządkowe, utrzymanie czystości. Stosunek do pracy: poprawny.",
      timeEntries: [
        { date: new Date("2024-03-04"), hours: 8 },
        { date: new Date("2024-03-07"), hours: 6 },
        { date: new Date("2024-03-11"), hours: 8 },
        { date: new Date("2024-03-14"), hours: 7 },
        { date: new Date("2024-03-18"), hours: 8 },
        { date: new Date("2024-03-21"), hours: 6 },
        { date: new Date("2024-03-25"), hours: 8 },
        { date: new Date("2024-03-28"), hours: 7 },
      ],
      suma: 58,
    },
  ];

  for (const recordData of sampleRecords) {
    const record = await prisma.record.create({
      data: recordData,
    });
    console.log(
      `Created record for: ${record.nazwisko} ${record.imie} (${record.suma}h)`
    );
  }

  console.log("Seed completed successfully!");
}

main()
  .catch((e) => {
    console.error("Seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
