const bcrypt = require('bcryptjs');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function verifyAdmin() {
  try {
    const admin = await prisma.user.findUnique({
      where: { email: 'admin@ewidencja.pl' }
    });
    
    if (!admin) {
      console.log('BŁĄD: Admin nie istnieje w bazie!');
      return;
    }
    
    console.log('Admin znaleziony:');
    console.log('- Email:', admin.email);
    console.log('- Name:', admin.name);
    console.log('- isActive:', admin.isActive);
    console.log('- Has password:', !!admin.password);
    
    if (admin.password) {
      const isValid = await bcrypt.compare('admin123', admin.password);
      console.log('- Hasło admin123 jest poprawne:', isValid);
    }
  } catch (error) {
    console.error('Błąd:', error);
  } finally {
    await prisma.$disconnect();
  }
}

verifyAdmin();
