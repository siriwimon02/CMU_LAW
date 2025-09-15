// Required External Modules
import dotenv from 'dotenv';
dotenv.config({ path: '../.env.dev' });

import express from 'express';
import prisma from '../prismaClient.js';
import multer from "multer";

const router = express.Router();


//การโหลดไฟล์แนบ
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/");
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });


//ฟอร์มเอกสารใหม่ เข้ามาใหม่
// ฟอร์มเอกสารใหม่ เข้ามาใหม่
router.post('/', upload.array("attachments", 5), async (req, res) => {
  try {
    const userid = req.user.id;
    if (!userid) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const user = await prisma.user.findUnique({
      where: { id: userid }
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const find_status = await prisma.status.findUnique({
        where : { status : "รอรับเข้ากอง" }
    })

    const {
      title,
      authorize_to,
      position,
      affiliation,
      authorize_text
    } = req.body;
    const destinationId = parseInt(req.body.destinationId, 10);

    console.log("body:", req.body);
    console.log("files:", req.files);

    // สร้าง document หลัก
    const doc = await prisma.documentPetition.create({
      data: {
        id_doc: 12345,
        department: { connect: { id: user.departmentId } },
        destination: { connect: { id: destinationId } },
        title,
        authorize_to,
        position,
        affiliation,
        authorize_text,
        user: { connect: { id: userid }},
        status: { connect: { id: find_status.id }} 
      }
    });

    // เก็บ document status action log
    await prisma.documentStatusHistory.create({
    data: {
        document: { connect: { id: doc.id } },
        status:   { connect: { id: doc.statusId } },
        changedBy: { connect: { id: req.user.id } },    // แค่ id ของ user
        note_t: "เพิ่มคำร้องเข้าไปใหม่"
    }
    });

    // บันทึกไฟล์แนบ (ใช้ for...of เพราะรองรับ await)
    if (req.file || (req.files && req.files.length > 0)) {
        for (const file of req.files) {
        const paths = file.path;            // path เต็ม เช่น "uploads/xxxx-test.pdf"
        const file_n = file.originalname;   // ชื่อไฟล์ต้นฉบับ

        console.log("save attachment:", paths, file_n);

        const doc_attachment = await prisma.documentAttachment.create({
            data: {
            file_path: paths,
            file_name: file_n,
            docId: doc.id,
            userId: user.id
            }
        });

        console.log("saved:", doc_attachment);
        }
    }
    res.status(201).json({
      message: "Document saved",
      success: true,
      document: doc
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


//ดึงdata ทั้งหมดที่ User กรอก
router.get('/', async (req, res) => {
    console.log(req.user.id);
    const petition_doc = await prisma.documentPetition.findMany({
        where:{
            userId : req.user.id
        }
    });
    const document_json = [];
    for(const doc of petition_doc){
        const dep = await prisma.department.findUnique({
            where:{
                id: doc.departmentId
            }
        });

        const des = await prisma.destination.findUnique({
            where:{
                id:doc.destinationId
            }
        });

        const stt = await prisma.status.findUnique({
            where:{
                id:doc.statusId
            }
        });
       
        const setdoc = {
            id:doc.id,
            doc_id:doc.doc_id,
            department_name: dep.department_name,
            destination_name: des.des_name,
            title:doc.title,
            authorize_to: doc.authorize_to,
            position: doc.position,
            affiliation: doc.affiliation,
            authorize_text: doc.authorize_text,
            status_name: stt.status,
            createdAt: doc.createdAt,
            date_of_signing: doc.date_of_signing
        };
        document_json.push(setdoc);
        console.log(setdoc);
    }
    res.json(document_json);
});


//ตอนคลิกดูรายละเอียดเอกสารแต่ละอัน กับ ดึง data ตอนแก้ไข
router.get('/:docId', async (req, res) => {
    // console.log(req.user.id);
    const user = await prisma.user.findUnique({
        where : {id : req.user.id}
    })
    console.log(user);
    const documentId = parseInt(req.params.docId, 10); 
    try {
        const doc = await prisma.documentPetition.findUnique({
            where : { id : documentId}
        })

        const dep = await prisma.department.findUnique({
            where:{
                id: doc.departmentId
            }
        });

        const des = await prisma.destination.findUnique({
            where:{
                id:doc.destinationId
            }
        });

        const stt = await prisma.status.findUnique({
            where:{
                id:doc.statusId
            }
        });
       
        const setdoc = {
            id:doc.id,
            doc_id:doc.doc_id,
            department_name: dep.department_name,
            destination_name: des.des_name,
            title:doc.title,
            authorize_to: doc.authorize_to,
            position: doc.position,
            affiliation: doc.affiliation,
            authorize_text: doc.authorize_text,
            status_name: stt.status,
            createdAt: doc.createdAt,
            date_of_signing: doc.date_of_signing
        };
        res.json(setdoc);
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});



// หน้าบ้านต้องส่ง docId มาด้วย เช่น PUT /documents/5
router.put('/edit/:docId', upload.array("attachments", 5),async (req, res) => {
    const documentId = parseInt(req.params.docId, 10); 
    if (isNaN(documentId)) {
        return res.status(400).json({ error: "docId ต้องเป็นตัวเลข" });
    }

    const { title, authorizeTo, position, affiliation, authorizeText } = req.body;
    try {

        const find_st = await prisma.status.findUnique({
            where : { status : "ส่งกลับให้ผู้ใช้แก้ไขเอกสาร" }
        })
        console.log(find_st);

        const status_already_edit = await prisma.status.findUnique({
            where : { status : "ผู้ใช้แก้ไขเอกสารเรียบร้อยแล้ว" }
        });
        console.log(status_already_edit);

        const existingDoc = await prisma.documentPetition.findUnique({
            where: { 
                id: documentId,
                statusId : find_st.id,
                userId : req.user.id
            }
        });

        console.log(existingDoc);
        if (!existingDoc) {
            return res.status(404).json({ error: "not found document" });
        }

        const updatedDoc = await prisma.documentPetition.update({
            where: { id: documentId },
            data: {
                title,
                authorize_to: authorizeTo,
                position,
                affiliation,
                authorize_text: authorizeText,
                statusId : status_already_edit.id
            },
        });


        // เก็บ document status action log
        await prisma.documentStatusHistory.create({
            data: {
            document: { connect: { id: updatedDoc.id } },
            status:   { connect: { id: updatedDoc.statusId } },
            changedBy: { connect: { id: req.user.id } }, 
            note_t:  "ผู้ใช้แก้ไขเอกสารเรียบร้อยแล้ว"
            }
        });


        if (req.file || (req.files && req.files.length > 0)) {
            for (const file of req.files) {
                const paths = file.path;            // path เต็ม เช่น "uploads/xxxx-test.pdf"
                const file_n = file.originalname;   // ชื่อไฟล์ต้นฉบับ

                console.log("save attachment:", paths, file_n);

                const doc_attachment = await prisma.documentAttachment.create({
                    data: {
                    file_path: paths,
                    file_name: file_n,
                    userId: req.user.id
                    }
                });
                console.log("saved:", doc_attachment);
            }
        }

        res.json({message: "update document already", updatedDoc});


    } catch (error) {
        console.error("Update failed:", error);
        res.status(500).json({ error: "Failed to update document" });
    }
});


router.get('/docStatus/:docId', async (req, res) => {
    const documentId = parseInt(req.params.docId, 10); 
    if (isNaN(documentId)) {
        return res.status(400).json({ error: "docId ต้องเป็นตัวเลข" });
    }

    try {
        const user = await prisma.user.findUnique({
            where : { id : req.user.id }
        });

        const doc = await prisma.documentPetition.findUnique({
            where : { id : documentId }
        })

        if ( !doc ){
            return res.status(404).json({ error: "not found document" });
        }

        if ( doc.userId !== user.id ) {
            return res.status(404).json({ error: "user not create this document" });
        }


        const find_status1 = await prisma.status.findUnique({
            where : {status : "ตรวจสอบขั้นต้นเสร็จสิ้น"}
        });

        const find_status2 = await prisma.status.findUnique({
            where : {status : "อยู่ระหว่างการตรวจสอบและอนุมัติโดยหัวหน้า"}
        });

        const find_status3 = await prisma.status.findUnique({
            where : {status : "ตรวจสอบและอนุมัติโดยหัวหน้าเสร็จสิ้น"}
        });

        const find_status4 = await prisma.status.findUnique({
            where : {status : "ส่งกลับให้แก้ไขจากการตรวจสอบโดยหัวหน้า"}
        });

        const find_status5 = await prisma.status.findUnique({
            where : {status : "อยู่ระหว่างการตรวจสอบขั้นสุดท้าย"}
        });

        const find_status6 = await prisma.status.findUnique({
            where : {status : "ส่งกลับให้แก้ไขจากการตรวจสอบขั้นสุดท้าย"}
        });

        const find_status7 = await prisma.status.findUnique({
            where : {status : "ตรวจสอบโดยอธิการบดีเสร็จสิ้น"}
        });


        const find_statusHistory = await prisma.documentStatusHistory.findMany({
            where: { documentId: documentId },
            include : {
                status : true,
                changedBy : true,
                document : true
            },
            orderBy: { changedAt: 'asc' }
        });


        const set_json = find_statusHistory.map(h => ({
            docId: h.documentId,
            ChangeBy: h.changedBy.email || null,
            status: h.status.status || null,
            changeAt: h.changedAt,
            note: h.note_t,
            doc_title : h.document.title,
            doc_id_doc : h.document.id_doc
        }));


        res.json({ message : "find document history status", set_json})

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }

});


export default router;