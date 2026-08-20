import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateRecords() {
  try {
    // Update all existing records to January 2026
    const result = await prisma.record.updateMany({
      where: {
        OR: [
          { recordMonth: null },
          { recordYear: null }
        ]
      },
      data: {
        recordMonth: 1,
        recordYear: 2026
      }
    });
    
    console.log(`Zaktualizowano ${result.count} rekordów do stycznia 2026`);
    
    // Create initial settings
    await prisma.settings.upsert({
      where: { id: 'global' },
      update: {},
      create: {
        id: 'global',
        activeMonth: 1,
        activeYear: 2026
      }
    });
    
    console.log('Ustawienia zainicjalizowane: styczeń 2026');
  } catch (error) {
    console.error('Błąd migracji:', error);
  } finally {
    await prisma.$disconnect();
  }
}

migrateRecords();
