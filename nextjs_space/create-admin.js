const bcrypt = require('bcryptjs');
const { PrismaClient } = require('./prisma/node_modules/.prisma/client');

const prisma = new PrismaClient();

async function createAdmin() {
  try {
    // Sprawdź czy admin już istnieje
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@ewidencja.pl' }
    });

    if (existingAdmin) {
      console.log('Użytkownik admin już istnieje. Aktualizuję...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await prisma.user.update({
        where: { email: 'admin@ewidencja.pl' },
        data: {
          password: hashedPassword,
          isActive: true,
          name: 'Supervisor'
        }
      });
      console.log('Zaktualizowano użytkownika admin@ewidencja.pl');
    } else {
      console.log('Tworzenie użytkownika admin...');
      const hashedPassword = await bcrypt.hash('admin123', 10);
      const admin = await prisma.user.create({
        data: {
          email: 'admin@ewidencja.pl',
          name: 'Supervisor',
          password: hashedPassword,
          isActive: true,
        }
      });
      console.log('Utworzono użytkownika admin:', admin.email);
    }
  } catch (error) {
    console.error('Błąd:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createAdmin();
