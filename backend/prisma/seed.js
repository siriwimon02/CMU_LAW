// prisma/seed.js
import { config } from 'dotenv';
config({ path: '../.env.dev' }); // ✅ โหลด .env.dev


import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient()

async function main() {
    //เพิ่มข้อมูล กก. role status destination แล้วก็ตอน dev ใช้สร้างในนี้ไปก่อน แล้วพอจะ deploy จริงๆ ใช้ prisma/seed.js
    const roles = ['admin', 'user', 'spv_auditor', 'auditor', 'endorser'];
    for (const roleName of roles) {
        await prisma.role.upsert({
        where: { name: roleName },
        update: {},
        create: { name: roleName }
        });
    }

    const des_db = ['Legal_Division', 'Office_of_Research_Administration', 'International_Affairs_Management _Center'];
    for( const des of des_db ) {
        await prisma.destination.upsert({
        where: {desName : des},
        update: {},
        create: {desName : des}
        });
    }

    const status_db = ['Review', 'Edit', 'Awaiting_Approval', 'Sent_to_Another_Department', 'Approval_Completed'];
    for( const status_d of status_db ){
        await prisma.status.upsert({
        where: {status : status_d},
        update: {},
        create: {status : status_d}
        });
    }
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })