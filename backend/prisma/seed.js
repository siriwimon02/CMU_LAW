// prisma/seed.js
import { config } from 'dotenv';
config({ path: '../.env.dev' }); // ✅ โหลด .env.dev


import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient()

async function main() {
    // เพิ่มข้อมูล กก. role status destination แล้วก็ตอน dev ใช้สร้างในนี้ไปก่อน แล้วพอจะ deploy จริงๆ ใช้ prisma/seed.js
    const roles = ['admin', 'user', 'spv_auditor', 'head_auditor','auditor'];
    for (const roleName of roles) {
        await prisma.roleOfUser.upsert({
          where: { role_name: roleName },
          update: {},
          create: { role_name: roleName }
        });
    }

    const des_db = ['กองกฎหมาย', 'สำนักงานบริหารงานวิจัย', 'ศูนย์บริหารพันธกิจสากล'];
    for( const des of des_db ) {
        await prisma.destination.upsert({
          where: {des_name : des},
          update: {},
          create: {des_name : des}
        });
    }

    const req_doc = ['บัตรประจำตัวอธิการบดี', 'ทะเบียนบ้านมหาวิทยาลัย'];
    for (const req_d of req_doc){
      await prisma.requiredDocument.upsert({
        where : { name : req_d },
        update : {},
        create : { name : req_d }
      });
    }

    const attactment_type = [ 'UserUpload','AuditorUpload', 'SignedDocument' ]
    for( const type_d of attactment_type ){
      await prisma.attachmentType.upsert({
        where : { type_name : type_d },
        update : {},
        create : { type_name : type_d }
      });
    }


    const status_db = [
      'รอรับเข้ากอง', 
      'รับเข้ากองเรียบร้อย',
      'ส่งต่อไปยังหน่วยงานอื่นที่เกี่ยวข้อง',

      'ส่งกลับให้ผู้ใช้แก้ไขเอกสาร',
      'ผู้ใช้แก้ไขเอกสารเรียบร้อยแล้ว',

      'อยู่ระหว่างการตรวจสอบขั้นต้น',
      'เจ้าหน้าที่แก้ไขเอกสารแล้ว',
      'เจ้าหน้าที่อัปโหลดเอกสารเพิ่มเติมแล้ว',
      'ตรวจสอบขั้นต้นเสร็จสิ้น',

      'อยู่ระหว่างการตรวจสอบโดยหัวหน้ากอง',
      'ตรวจสอบโดยหัวหน้ากองเสร็จสิ้น',
      'ส่งกลับเพื่อแก้ไขจากการตรวจสอบโดยหัวหน้ากอง',

      'อยู่ระหว่างการตรวจสอบขั้นสุดท้าย',
      'ตรวจสอบขั้นสุดท้ายเสร็จสิ้น',
      'ส่งกลับให้แก้ไขจากการตรวจสอบขั้นสุดท้าย',

      'รอการพิจารณาอนุมัติจากอธิการบดี',
      'อธิการบดีอนุมัติแล้ว',
      'อธิการบดีปฏิเสธคำร้อง'
    ];

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


