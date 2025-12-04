
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    try {
        const user = await prisma.user.findUnique({
            where: { email: 'alice@irms.com' },
        });

        if (!user) {
            console.log('User not found!');
            return;
        }
        console.log('User found:', user.email);

        const isValid = await bcrypt.compare('password123', user.passwordHash);
        console.log('Password "password123" is valid:', isValid);

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
