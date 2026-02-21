import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcrypt'

const prisma = new PrismaClient()

async function main() {
    const email = 'boni@netpulse.io'
    const password = 'password123'
    const hashedPassword = await bcrypt.hash(password, 10)

    // Create Organization
    const org = await prisma.organization.upsert({
        where: { slug: 'acme' },
        update: {},
        create: {
            name: 'Acme Corp',
            slug: 'acme',
        },
    })

    // Create User
    const user = await prisma.user.upsert({
        where: { email },
        update: {
            passwordHash: hashedPassword,
            organizationId: org.id,
            role: 'owner',
        },
        create: {
            email,
            passwordHash: hashedPassword,
            role: 'owner',
            organizationId: org.id,
        },
    })

    console.log(`Seed successful. User: ${user.email}, Password: ${password}`)
}

main()
    .catch((e) => {
        console.error(e)
        process.exit(1)
    })
    .finally(async () => {
        await prisma.$disconnect()
    })
