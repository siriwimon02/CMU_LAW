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

        //default department
        await prisma.department.upsert({
          where : { department_name : des },
          update : {},
          create : {department_name : des}
        });
    }


    await prisma.user.upsert({
      where: { email: "admin@cmu.ac.th" }, // email เป็น @unique ใน schema
      update: {},
      create: {
        email: "admin@cmu.ac.th",
        firstname: "พี่ต้นกล้า",
        lastname: "กองกฏหมาย",
        department: {
          connectOrCreate: {
            where: { department_name: "กองกฎหมาย" }, // unique
            create: { department_name: "กองกฎหมาย" },
          },
        },
        role: {
          connectOrCreate: {
            where: { role_name: "admin" }, // unique
            create: { role_name: "admin" },
          },
        },
      },
    });



    const req_doc = ['บัตรประจำตัวอธิการบดี', 'ทะเบียนบ้านมหาวิทยาลัย'];
    for (const req_d of req_doc){
      await prisma.requiredDocument.upsert({
        where : { name : req_d },
        update : {},
        create : { name : req_d }
      });
    }

    const attactment_type = [ 'UserUpload','AuditorUpload', 'SignedDocument', 'GenerateDocument' ]
    for( const type_d of attactment_type ){
      await prisma.attachmentType.upsert({
        where : { type_name : type_d },
        update : {},
        create : { type_name : type_d }
      });
    }


    const status_db = [
      'รอรับเรื่อง', 
      'รับเรื่องแล้ว',
      'ส่งต่อไปยังหน่วยงานอื่นที่เกี่ยวข้อง',

      'ส่งคืนแก้ไขเอกสาร',
      'แก้ไขเอกสารเรียบร้อยแล้ว',

      'อยู่ระหว่างตรวจสอบโดยเจ้าหน้าที่',
      'เจ้าหน้าที่แก้ไขเอกสารแล้ว',
      'เจ้าหน้าที่อัปโหลดเอกสารเพิ่มเติมแล้ว',
      'เจ้าหน้าที่ตรวจสอบแล้ว',

      'อยู่ระหว่างตรวจสอบโดยหัวหน้างาน',
      'หัวหน้างานตรวจสอบแล้ว',
      'ส่งคืนแก้ไขเอกสารโดยหัวหน้างาน',

      'อยู่ระหว่างตรวจสอบโดยผู้อำนวยการ',
      'ผู้อำนวยการตรวจสอบแล้ว',
      'ส่งคืนแก้ไขเอกสารโดยผู้อำนวยการ',

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


