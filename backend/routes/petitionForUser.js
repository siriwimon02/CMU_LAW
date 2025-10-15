// Required External Modules
import dotenv from 'dotenv';
dotenv.config({ path: '../.env.dev' });

import express from 'express';
import prisma from '../prismaClient.js';
import multer from "multer";
import e from 'express';
import { connect } from 'http2';
import path from 'path';

const router = express.Router();


//การโหลดไฟล์แนบ
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/user_upload/");
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage });


//---------------------------------------ฟอร์มเอกสารใหม่ เข้ามาใหม่--------------------------------------------//
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
        where : { status : "รอรับเรื่อง" }
    })

    const { title, authorize_to, position, affiliation, authorize_text } = req.body;
    const needPresidentCard = req.body.needPresidentCard === "true";
    const needUniversityHouse = req.body.needUniversityHouse === "true";
    const destinationId = parseInt(req.body.destinationId, 10);

    console.log("body:", req.body);
    console.log("files:", req.files);

    // สร้าง document หลัก
    const doc = await prisma.documentPetition.create({
      data : {
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

    //สร้างลำดับเอกสารอย่างเป็นทางการ DOCP-วันที่สร้างเอกสาร-กองที่ส่งไป+ลำดับเอกสารdocIdเอาประมาณ 5หลักก่อน
    const today = new Date();
    const datePart = today.toISOString().split('T')[0].replace(/-/g, ""); 
    // YYYYMMDD เช่น 20250918
    const paddedId = String(doc.id).padStart(5, "0"); 
    const desId = String(doc.destinationId).padStart(2,"0");
    // ให้ id เป็น 5 หลัก เช่น 00001
    const officialId = `DOCP-${datePart}-${desId}-${paddedId}`;

    const update_docId = await prisma.documentPetition.update({
        where : { id : doc.id },
        data : { id_doc : officialId }
    });


    // เก็บ document status action log
    const keep_status = await prisma.documentStatusHistory.create({
    data: {
        document: { connect: { id: doc.id } },
        status:   { connect: { id: doc.statusId } },
        changedBy: { connect: { id: req.user.id } },    // แค่ id ของ user
        note_text: "เพิ่มคำร้องเข้าไปใหม่"
    }
    });
    console.log(keep_status);


    if (needPresidentCard === true){ // ต้องการ สำเนาบัตรประจำตัวอธิการบดี
        const find_req = await prisma.requiredDocument.findUnique ({
            where : { name : "บัตรประจำตัวอธิการบดี" }
        });

        const update_doc_need = await prisma.documentNeed.create({
            data : {
                document : { connect : { id : doc.id } },
                requiredDocument : { connect : { id : find_req.id } }, 
            }
        });

        console.log("document นี้ต้องการ สำเนาบัตรประจำตัวอธิการบดี",update_doc_need)
    }

    if (needUniversityHouse === true){ //ต้องการ สำเนาทะเบียนบ้านมหาวิทยาลัยเชียงใหม่  
        const find_req = await prisma.requiredDocument.findUnique ({
            where : { name : "ทะเบียนบ้านมหาวิทยาลัย" }
        });

        const update_doc_need = await prisma.documentNeed.create({
            data : {
                document : { connect : { id : doc.id } },
                requiredDocument : { connect : { id : find_req.id } }, 
            }
        });


        console.log("document นี้ต้องการ ทะเบียนบ้านมหาวิทยาลัย",update_doc_need)
    }


    // บันทึกไฟล์แนบ (ใช้ for...of เพราะรองรับ await)
    if (req.file || (req.files && req.files.length > 0)) {
        for (const file of req.files) {
            const paths = file.path;            // path เต็ม เช่น "uploads/xxxx-test.pdf"
            const file_n = file.originalname;   // ชื่อไฟล์ต้นฉบับ

            console.log("save attachment:", paths, file_n);
            
            const find_attachment_type = await prisma.attachmentType.findUnique({
                where : { type_name : "UserUpload" }
            });

            //บันทึกข้อมูลเอกสารเพิ่มเติมลง data 
            const doc_attachment = await prisma.documentAttachment.create({
                data: {
                    file_path: paths,
                    file_name: file_n,
                    document: { connect: { id: update_docId.id } },
                    user : { connect : { id : user.id } },
                    attachmentType : { connect : { id : find_attachment_type.id } }
                }
            });
            console.log("saved:", doc_attachment);

        }
    }

    const savedDoc = await prisma.documentPetition.findUnique({
        where: { id: doc.id },
        include: {
            status: true,
            destination: true,
            attachments: true,
            documentNeeds: { include: { requiredDocument: true } }
        }
    });

    res.status(201).json({
    message: "Document saved",
    success: true,
    document: savedDoc
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});






//---------------------------------------------------ดึงdata ทั้งหมดที่ User กรอก--------------------------------------//
router.get('/', async (req, res) => {
    console.log(req.user.id);

    const find_status2 = await prisma.status.findUnique({
        where: { status: "ส่งคืนแก้ไขเอกสาร" }
    });

    const petition_doc = await prisma.documentPetition.findMany({
        where: {
            userId: req.user.id
        },
        include: {
            department: true,
            destination: true,
            user: true,
            status: true,
            auditBy: true,
            headauditBy: true
        },
        orderBy: {
            createdAt: 'asc'   // หรือ 'asc' ถ้าจะเรียงจากเก่า → ใหม่
        }
    });

    const docs = [];
    for(const doc of petition_doc){  
        if (doc.statusId === find_status2.id){
            //หาประวัติเอกสารอันล่าสุด แล้วเช็คสถานะว้าใช้ ส่งกลับมาใหม่
            const latestHistory = await prisma.documentStatusHistory.findFirst({
                where: { documentId: doc.id },
                orderBy: { changedAt: 'desc' },     // ล่าสุดสุด
                include: { status: true },          // ดึงชื่อสถานะมาด้วย
            });
            if (latestHistory.statusId === find_status2.id){
                const setdoc = {
                    id:doc.id,
                    doc_id : doc.id_doc,
                    department_name: doc.department.department_name,
                    destination_name: doc.destination.des_name,
                    owneremail : doc.user.email,
                    title:doc.title,
                    authorize_to: doc.authorize_to,
                    position: doc.position,
                    affiliation: doc.affiliation,
                    authorize_text: doc.authorize_text,
                    status_name: doc.status.status,
                    createdAt: doc.createdAt,
                    note : latestHistory.note_text
                }
                docs.push(setdoc);                
            }
        }else {
            const setdoc = {
                id:doc.id,
                doc_id:doc.id_doc,
                department_name: doc.department.department_name,
                destination_name: doc.destination.des_name,
                title:doc.title,
                authorize_to: doc.authorize_to,
                position: doc.position,
                affiliation: doc.affiliation,
                authorize_text: doc.authorize_text,
                status_name: doc.status.status,
                auditBy: doc.auditBy?.email ?? null,        // ถ้าไม่มี auditBy → ได้ null
                headauditBy: doc.headauditBy?.email ?? null, // ถ้าไม่มี headauditBy → ได้ null
                createdAt: doc.createdAt,
            }
            docs.push(setdoc);
        }
    }
    //console.log(docs);
    res.json({ message: "Document Petition", data: docs });
});






//--------------------------------------หน้าบ้านต้องส่ง docId มาด้วย เช่น PUT /documents/5-------------------------//
router.put('/edit/:docId', upload.array("attachments", 5), async (req, res) => {
    const documentId = parseInt(req.params.docId, 10);
    if (isNaN(documentId)) {
        return res.status(400).json({ error: "docId ต้องเป็นตัวเลข" });
    }

    try {
        const { title, authorizeTo, position, affiliation, authorizeText } = req.body;
        const needPresidentCard = req.body.needPresidentCard === "true";
        const needUniversityHouse = req.body.needUniversityHouse === "true";

        const find_st1 = await prisma.status.findUnique({ where : { status : "ส่งคืนแก้ไขเอกสาร" } });
        const find_st2 = await prisma.status.findUnique({ where : { status : "แก้ไขเอกสารเรียบร้อยแล้ว" } });

        let existingDoc = await prisma.documentPetition.findFirst({
            where: { id: documentId },
            include : { documentNeeds: { include: { requiredDocument: true } }}
        });

        if (!existingDoc) return res.status(404).json({ message : "not found document" });
        if (existingDoc.statusId !== find_st1.id) return res.status(403).json({ message : "Document is not in the correct status" });
        if (existingDoc.userId !== req.user.id) return res.status(403).json({ message: "You do not have permission" });

        let isUpdated = false;
        let isUploaded = false;

        // ถ้ามีการแก้ไข field
        if (
            existingDoc.title !== title ||
            existingDoc.authorize_to !== authorizeTo ||
            existingDoc.position !== position ||
            existingDoc.affiliation !== affiliation ||
            existingDoc.authorize_text !== authorizeText
        ) {

            //หาประวัติเอกสารอันล่าสุด แล้วเช็คสถานะว้าใช้ ส่งกลับมาใหม่
            const latestHistory = await prisma.documentStatusHistory.findFirst({
                where: { documentId: existingDoc.id}
                ,orderBy: {changedAt: "desc"}  // ใช้เวลาจาก statusHistory
                ,include: {status: true}
            });
            console.log("ประวัติเอกสารล่าสุด",latestHistory)


            //อัปเดตเอกสาร
            await prisma.documentPetition.update({
                where: { id: documentId },
                data: {
                    title,
                    authorize_to: authorizeTo,
                    position,
                    affiliation,
                    authorize_text: authorizeText,
                    statusId : find_st2.id
                }
            });

            //เพิ่มประวัติเอกสารร
            const his_st = await prisma.documentStatusHistory.create({
                data: {
                    document: { connect: { id: documentId } },
                    status:   { connect: { id: find_st2.id } },
                    changedBy: { connect: { id: req.user.id } },
                    note_text: "ผู้ใช้แก้ไขเอกสารเรียบร้อยแล้ว"
                }
            });
            console.log(his_st)
            
            // เช็คว่ามีประวัติส่งกลับมาแก้ไขล่าสุดมั้ย
            console.log(latestHistory.statusId === find_st1.id)
            if (latestHistory.statusId === find_st1.id) {
                // อัปเดตของเก่า → เปลี่ยน his_statusId ให้เป็นของรอบนี้แทน
                const history_edit = await prisma.documentPetitionHistory.updateMany({
                    where: { his_statusId : latestHistory.id },
                    data: {
                        his_statusId: his_st.id,
                        editById : req.user.id
                    }
                });
                console.log("Updated old history to new status:", history_edit);
            }
            isUpdated = true;
        }

        if (needPresidentCard === true){ // ต้องการ สำเนาบัตรประจำตัวอธิการบดี
            const find_req = await prisma.requiredDocument.findUnique ({
                where : { name : "บัตรประจำตัวอธิการบดี" }
            });

            const find_docNeed = await prisma.documentNeed.findFirst({
                where : { 
                    documentId : existingDoc.id,
                    requiredDocumentId : find_req.id 
                }
            })

            if (!find_docNeed){
                const update_doc_need = await prisma.documentNeed.create({
                    data : {
                        document : { connect : { id : existingDoc.id } },
                        requiredDocument : { connect : { id : find_req.id } }, 
                    }
                });

                console.log("document นี้ต้องการ สำเนาบัตรประจำตัวอธิการบดี",update_doc_need)
            }else {
                console.log("เอกสารนี้เคยต้องการบัตรประจำตัวอธิการบดีแล้ว");
            }
        }

        if (needUniversityHouse === true){ //ต้องการ สำเนาทะเบียนบ้านมหาวิทยาลัยเชียงใหม่  
            const find_req = await prisma.requiredDocument.findUnique ({
                where : { name : "ทะเบียนบ้านมหาวิทยาลัย" }
            });

            const find_docNeed = await prisma.documentNeed.findFirst({
                where : { 
                    documentId : existingDoc.id,
                    requiredDocumentId : find_req.id 
                }
            })

            if (!find_docNeed) {
                const update_doc_need = await prisma.documentNeed.create({
                    data : {
                        document : { connect : { id : existingDoc.id } },
                        requiredDocument : { connect : { id : find_req.id } }, 
                    }
                });

                console.log("document นี้ต้องการ ทะเบียนบ้านมหาวิทยาลัย",update_doc_need)
            }else {
                console.log("เอกสารนี้เคยต้องการทะเบียนบ้านมหาวิทยาลัยแล้ว");
            }

        }

        // แนบไฟล์
        if (req.files && req.files.length > 0) {
            for (const file of req.files) {
                await prisma.documentAttachment.create({
                    data: {
                        file_path: file.path,
                        file_name: file.originalname,
                        document : { connect : { id : documentId } },
                        user : { connect : { id : req.user.id } },
                        attachmentType : { connect : { type_name : "UserUpload" } }
                    }
                });
            }
            isUploaded = true;
        }

        if (!isUpdated && !isUploaded) {
            return res.status(400).json({message: "Did not updated or upload anything else" });
        }

        const find_document_update = await prisma.documentPetition.findUnique({
            where : { id : documentId },
            include : {
                attachments: { include : { attachmentType : true } },
                documentNeeds: { include: { requiredDocument : true } }
            }
        });

        res.json({ message: "update document already", find_document_update });
    } catch (error) {
        console.error("Update failed:", error);
        res.status(500).json({ error: "Failed to update document" });
    }
});


export default router;