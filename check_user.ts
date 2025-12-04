import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'admin@irms.com';
    const password = 'password123';

    console.log(`Checking user: ${email}`);

    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        console.log('User not found!');
        return;
    }

    console.log('User found:', user.id, user.email, user.role);
    console.log('Stored hash:', user.passwordHash);

    const isValid = await bcrypt.compare(password, user.passwordHash);
    console.log(`Password '${password}' is valid: ${isValid}`);

    if (!isValid) {
        const newHash = await bcrypt.hash(password, 10);
        console.log('New hash for comparison:', newHash);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
