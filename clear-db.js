const { PrismaClient } = require('./prisma/node_modules/.prisma/client');

const prisma = new PrismaClient();

async function clearDatabase() {
  try {
    console.log('Czyszczenie bazy danych...');
    
    // Usuń wszystkie rekordy (timeEntries są w JSON, więc usuwamy rekordy)
    const deletedRecords = await prisma.record.deleteMany({});
    console.log(`Usunięto ${deletedRecords.count} rekordów`);
    
    // Usuń logi aktywności
    const deletedLogs = await prisma.activityLog.deleteMany({});
    console.log(`Usunięto ${deletedLogs.count} logów`);
    
    // Usuń ustawienia
    const deletedSettings = await prisma.settings.deleteMany({});
    console.log(`Usunięto ${deletedSettings.count} ustawień`);
    
    // Usuń wszystkich użytkowników poza adminem
    const deletedUsers = await prisma.user.deleteMany({
      where: {
        email: {
          not: 'admin@ewidencja.pl'
        }
      }
    });
    console.log(`Usunięto ${deletedUsers.count} użytkowników`);
    
    // Sprawdź czy admin istnieje
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@ewidencja.pl' }
    });
    
    if (!admin) {
      console.log('Admin nie istnieje! Tworzenie...');
      const bcrypt = require('bcryptjs');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await prisma.user.create({
        data: {
          email: 'admin@ewidencja.pl',
          name: 'Supervisor',
          password: hashedPassword,
          isActive: true,
        }
      });
      console.log('Utworzono admina');
    } else {
      console.log('Admin zachowany:', admin.email);
    }
    
    console.log('Baza danych wyczyszczona - pozostawiono tylko admina');
  } catch (error) {
    console.error('Błąd:', error);
  } finally {
    await prisma.$disconnect();
  }
}

clearDatabase();
