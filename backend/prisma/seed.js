// prisma/seed.js
import { config } from 'dotenv';
config({ path: '../.env.dev' }); // ✅ โหลด .env.dev


import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient()

async function main() {
    // เพิ่มข้อมูล กก. role status destination แล้วก็ตอน dev ใช้สร้างในนี้ไปก่อน แล้วพอจะ deploy จริงๆ ใช้ prisma/seed.js
    const roles = ['admin', 'user', 'spv_auditor', 'auditor', 'endorser'];
    for (const roleName of roles) {
        await prisma.roleOfUser.upsert({
        where: { role_name: roleName },
        update: {},
        create: { role_name: roleName }
        });
    }

    const des_db = ['กองกฎหมาย', 'สำนักงานบริหารงานวิจัย ', 'ศูนย์บริหารพันธกิจสากล'];
    for( const des of des_db ) {
        await prisma.destination.upsert({
        where: {des_name : des},
        update: {},
        create: {des_name : des}
        });
    }

    const status_db = ['รอรับเข้ากอง', 'รับเข้ากองเรียบร้อยแล้ว', 'ส่งไปที่กองอื่น', 'กำลังตรวจสอบเอกสาร', 'แก้ไขเอกสาร','ตรวจสอบเอกสารเรียบร้อยแล้ว', 'รอการอนุมัติ', 'อนุมัติเรียบร้อย', 'ปฎิเสธคำร้อง'];
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


