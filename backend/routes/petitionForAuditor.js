// Required External Modules
import dotenv from 'dotenv';
dotenv.config({ path: '../.env.dev' });

import express from 'express';
import prisma from '../prismaClient.js';
import multer from "multer";

const router = express.Router();

//ดาวโหลดเอกสาร
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




//------------------------------------doc ที่รอตรวจสอบขั้นตอน + อัพเดตสถานะให้ตรวจสอบขั้นต้น--------------------------//
router.get('/wait_to_audit_byAudit', async (req, res) => {
    try {
        const findstatus1 = await prisma.status.findUnique({
            where : { status: "รับเข้ากองเรียบร้อย" }
        });

        const findstatus2 = await prisma.status.findUnique({
            where : { status: "อยู่ระหว่างการตรวจสอบขั้นต้น" }
        });

        const findstatus3 = await prisma.status.findUnique({
            where : { status : "ผู้ใช้แก้ไขเอกสารเรียบร้อยแล้ว"}
        })

        const findstatus4 = await prisma.status.findUnique({
            where : { status : "ส่งกลับเพื่อแก้ไขจากการตรวจสอบโดยหัวหน้ากอง"}
        })

        const findstatus5 = await prisma.status.findUnique({
            where : { status : "ส่งกลับให้แก้ไขจากการตรวจสอบขั้นสุดท้าย"}
        })

        const user = await prisma.user.findUnique({
            where : { id : req.user.id }
        });

        const user_dep = await prisma.department.findUnique({
            where : { id : user.departmentId }
        })

        const find_des = await prisma.destination.findUnique({
            where : { des_name : user_dep.department_name }
        });


        if (!find_des) {
            res.status(401).json( {message : "user not live in destination department"} )
        }

        const document_audit_1st = await prisma.documentPetition.findMany({
            where : {
                destinationId : find_des.id,
                statusId : {
                    in : [findstatus1.id, findstatus3.id, findstatus4.id, findstatus5.id]
                }
            }, include: { status: true }
        });
        console.log("doc audit_1st", document_audit_1st);

        if ( document_audit_1st.length > 0 ){
            const update_st = await prisma.documentPetition.updateMany({
                where : {
                    destinationId : find_des.id,
                    statusId : {
                        in : [findstatus1.id, findstatus3.id, findstatus4.id, findstatus5.id]
                    }
                }, data : {
                    statusId : findstatus2.id
                }
            });

                    
            // เก็บ document status action log
            await Promise.all(
                document_audit_1st.map(doc =>
                    prisma.documentStatusHistory.create({
                        data: {
                        document: { connect: { id: doc.id } },
                        status:   { connect: { id: findstatus2.id } }, 
                        changedBy: { connect: { id: user.id } },
                        note_t: "เอกสารที่รอตรวจสอบ โดยพนักงานตรวจสอบ"
                        }
                    })
                )
            );
        }

        const document_audit_2st = await prisma.documentPetition.findMany({
            where : {
                destinationId : find_des.id,
                statusId : findstatus2.id 
            }
        })
        console.log(document_audit_2st);

        const document_json = [];
        for(const doc of document_audit_2st){
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

            const user_email = await prisma.user.findUnique({
                where:{
                    id: doc.userId
                }
            });

            const setdoc = {
                id:doc.id,
                doc_id:doc.doc_id,
                department_name: dep.department_name,
                destination_name: des.des_name,
                user_email: user_email.email,
                title:doc.title,
                authorize_to: doc.authorize_to,
                position: doc.position,
                affiliation: doc.affiliation,
                authorize_text: doc.authorize_text,
                status_name: stt.status,
                createdAt: doc.createdAt,
            };
            document_json.push(setdoc);
            // console.log(setdoc);
        }
        // console.log(document_json);
        res.json({ message : "find document waiting to the first audit", document_json})
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});





//-----------------------------------------------------------ดึง data มาทีละอัน---------------------------------------//
router.get('/document/:docId', async (req, res) => {
    try {
        const documentId = parseInt(req.params.docId, 10); 
        if (isNaN(documentId)) {
        return res.status(400).json({ error: "docId is invalid integer" });
        }

        const find_status1 = await prisma.status.findUnique({
        where: { status: "อยู่ระหว่างการตรวจสอบขั้นต้น" }
        });

        if (!find_status1) {
        return res.status(500).json({ message: "Status not found" });
        }

        const user = await prisma.user.findUnique({
            where : { id : req.user.id },
            include: { department: true }
        });
     
        const find_des = await prisma.destination.findUnique({
            where : { des_name : user.department.department_name }
        });

        if (!find_des) {
            return res.status(403).json({ message: "User is not in destination department" });
        }

        const doc = await prisma.documentPetition.findUnique({
            where : { id:documentId },
            include : {
                department: true,
                destination: true,
                status: true,
                user: true
            }
        });
        console.log(doc);


        if (!doc || doc.destinationId !== find_des.id) {
          return res.status(404).json({ message: "Document not found in this destination department" });
        }

        if (doc.statusId !== find_status1.id){
          return res.status(404).json({ message: "Document not found or not in correct status" });
        }

        const setdoc = {
            id: doc.id,
            doc_id: doc.doc_id,
            department_name: doc.department.department_name,
            destination_name: doc.destination.des_name,
            user_email: doc.user.email,
            title: doc.title,
            authorize_to: doc.authorize_to,
            position: doc.position,
            affiliation: doc.affiliation,
            authorize_text: doc.authorize_text,
            status_name: doc.status.status,
            createdAt: doc.createdAt,
            date_of_signing: doc.date_of_signing
        };
        res.json({ message: "find document waiting to the first audit", setdoc });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});








//----------------------------------------------------อัพเดตยืนการตรวจเอกสารขั้นต้น----------------------------------//
router.put('/update_st_audit_by_audit/:docId', async (req, res) => {
    const {text_suggesttion} = req.body;
    try {
        const documentId = parseInt(req.params.docId, 10); 
        if (isNaN(documentId)) {
        return res.status(400).json({ error: "docId is invalid integer" });
        }
 
        const find_status1 = await prisma.status.findUnique({
        where: { status: "อยู่ระหว่างการตรวจสอบขั้นต้น" }
        });

        const find_status2 = await prisma.status.findUnique({
            where: { status: "ตรวจสอบขั้นต้นเสร็จสิ้น" }
        });

        const user = await prisma.user.findUnique({
            where : { id : req.user.id },
            include: { department: true }
        });
     
        const find_des = await prisma.destination.findUnique({
            where : { des_name : user.department.department_name }
        });

        if (!find_des) {
            return res.status(403).json({ message: "User is not in this destination department" });
        }

        const doc = await prisma.documentPetition.findUnique({
            where: { id: documentId }
        });

        if (!doc || doc.destinationId !== find_des.id) {
          return res.status(404).json({ message: "Document not found in this destination department" });
        }

        if (doc.statusId !== find_status1.id){
          return res.status(404).json({ message: "Document not found or not in correct status" });
        }

        //อัพเดตสถานนะแก้ไข
        const updatedDoc = await prisma.documentPetition.update({
            where: { id: documentId },
            data: { statusId: find_status2.id }
        });

        // เก็บ document status action log
        await prisma.documentStatusHistory.create({
            data: {
            document: { connect: { id: updatedDoc.id } },
            status:   { connect: { id: updatedDoc.statusId } },
            changedBy: { connect: { id: user.id } },
            note_t:  `ตรวจสอบเอกสารเรียบร้อยแล้ว โดยพนักงานตรวจสอบ รายละเอียดเพิ่มเติม : ${text_suggesttion}`
            }
        });
        res.json({ message: "Document status updated to the first audit is already", updatedDoc});
    
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});









//-----------------------------------------แก้ไขสถานะ กลับไปแก้ไขเอกสาร ส่งไปที่ผู้ใช้แก้ไข------------------------------//
router.put('/edit_ByAuditor/:docId', async (req, res) => {
    const {text_edit_suggesttion} = req.body;
    try {
        const documentId = parseInt(req.params.docId, 10); 
        if (isNaN(documentId)) {
        return res.status(400).json({ error: "docId is invalid integer" });
        }
 
        const find_status1 = await prisma.status.findUnique({
        where: { status: "อยู่ระหว่างการตรวจสอบขั้นต้น" }
        });

        const find_status2 = await prisma.status.findUnique({
            where: { status: "ส่งกลับให้ผู้ใช้แก้ไขเอกสาร" }
        });

        const user = await prisma.user.findUnique({
            where : { id : req.user.id },
            include: { department: true }
        });
     
        const find_des = await prisma.destination.findUnique({
            where : { des_name : user.department.department_name }
        });

        if (!find_des) {
            return res.status(403).json({ message: "User is not in this destination department" });
        }
   
        const doc = await prisma.documentPetition.findUnique({
            where: { id: documentId }
        });


        if (!doc || doc.destinationId !== find_des.id) {
          return res.status(404).json({ message: "Document not found in this destination department" });
        }

        if (doc.statusId !== find_status1.id){
          return res.status(404).json({ message: "Document not found or not in correct status" });
        }


        const updatedDoc = await prisma.documentPetition.update({
            where: { id: documentId },
            data: { statusId: find_status2.id }
        });


                // เก็บ document status action log
        await prisma.documentStatusHistory.create({
            data: {
            document: { connect: { id: updatedDoc.id } },
            status:   { connect: { id: updatedDoc.statusId } },
            changedBy: { connect: { id: user.id } },
            note_t:   `ส่งแก้ไขเอกสาร โดยพนังงานตรวจสอบ รายละเอียดเพิ่มเติมการแก้ไขเอกสาร: ${text_edit_suggesttion || "-"}`
            }
        });


        //ส่ง data ไปยังเมลด้วย
        //------------------------mail----------------//
        res.json({message: "Document status updated to user to edit document", updatedDoc});
    
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});











//----------------การเพิ่มเอกสารได้ แก้ไขเอกสารได้ ของuser โดยพนักงาน คือพนง สามารถเข้าไปแก้ไขเอกสารได้ แก้ไขคำผิด-------------//
router.put('/update_document_ByAuditor/:docId', upload.array("attachments", 5), async (req, res) => {
    const {title, authorizeTo, position, affiliation, authorizeText} = req.body
    try {
        const documentId = parseInt(req.params.docId, 10); 
        if (isNaN(documentId)) {
            return res.status(400).json({ error: "docId is invalid integer" });
        }
 
        const find_status1 = await prisma.status.findUnique({
            where: { status: "อยู่ระหว่างการตรวจสอบขั้นต้น" }
        });

        const user = await prisma.user.findUnique({
            where : { id : req.user.id },
            include: { department: true }
        });
     
        const find_des = await prisma.destination.findUnique({
            where : { des_name : user.department.department_name }
        });

        if (!find_des) {
            return res.status(403).json({ message: "User is not in this destination department" });
        }

        const doc = await prisma.documentPetition.findUnique({
            where: { id: documentId }
        });

        
        if (!doc || doc.destinationId !== find_des.id) {
          return res.status(404).json({ message: "Document not found in this destination department" });
        }

        if (doc.statusId !== find_status1.id){
          return res.status(404).json({ message: "Document not found or not in correct status" });
        }

        const updatedDoc = await prisma.documentPetition.update({
            where: { id: documentId },
            data: {
                title,
                authorize_to: authorizeTo,
                position,
                affiliation,
                authorize_text: authorizeText,
            },
        });

        if (req.file || (req.files && req.files.length > 0)){
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
        document: updatedDoc
        });
        
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});










//------------------------------ดูประวัติ ที่ได้ทำการตรวจสอบเอกสารเรียบร้อยแล้ว-------------------------------------//
router.get('/history_theAuditByauditor', async (req, res) => {
    try {
        const find_st = await prisma.status.findUnique({
            where : { status : "ตรวจสอบขั้นต้นเสร็จสิ้น" }
        });

        const user = await prisma.user.findUnique({
            where : { id : req.user.id },
            include: { department: true }
        });
     
        const find_des = await prisma.destination.findUnique({
            where : { des_name : user.department.department_name }
        });

        if (!find_des) {
            return res.status(403).json({ message: "User is not in this destination department" });
        }

        console.log(find_des);

        const doc = await prisma.documentStatusHistory.findMany({
            where: {
                statusId: find_st.id,
                document: {
                    destinationId: find_des.id
                }
            },
            include: {
                document: {include: {status : true}},
                changedBy: true,
                status: true
            },
            orderBy: { changedAt: 'desc' } // เพิ่มเพื่อดูประวัติล่าสุดก่อน
        });
        
        const set_json = doc.map(h => ({
            docId: h.documentId,
            ChangeBy: h.changedBy.email || null,
            status: h.status.status || null,
            changeAt: h.changedAt,
            note: h.note_t,
            doc_title : h.document.title,
            doc_id_doc : h.document.id_doc,
            doc_StatusNow : h.document.status.status
        }));


        res.json({
            message: "History in Destination of status : ตรวจสอบขั้นต้นเสร็จสิ้น",
            data: set_json
        });
        
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});







//--------------------------------------------------ประวัติเอกสารที่ได้ส่งกลับไปแก้ไข-------------------------------------//
router.get('/history_thesendtoEditByauditor', async (req, res) => {
    try {
        const find_st = await prisma.status.findUnique({
            where : { status : "ส่งกลับให้ผู้ใช้แก้ไขเอกสาร" }
        });

        const user = await prisma.user.findUnique({
            where : { id : req.user.id },
            include: { department: true }
        });
     
        const find_des = await prisma.destination.findUnique({
            where : { des_name : user.department.department_name }
        });

        if (!find_des) {
            return res.status(403).json({ message: "User is not in this destination department" });
        }

        console.log(find_des);

        const doc = await prisma.documentStatusHistory.findMany({
            where: {
                statusId: find_st.id,
                document: {
                    destinationId: find_des.id
                }
            },
            include: {
                document: { include : {status : true} },
                changedBy: true,
                status: true
            },
            orderBy: { changedAt: 'desc' } // เพิ่มเพื่อดูประวัติล่าสุดก่อน
        });
        
        const set_json = doc.map(h => ({
            docId: h.documentId,
            ChangeBy: h.changedBy.email || null,
            status: h.status.status || null,
            changeAt: h.changedAt,
            note: h.note_t,
            doc_title : h.document.title,
            doc_id_doc : h.document.id_doc,
            doc_StatusNow : h.document.status.status
        }));

        res.json({
            message: "History in Destination of status : ตรวจสอบขั้นต้นเสร็จสิ้น",
            data: set_json
        });
        
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});



//-------------------------------------------------ส่งประวัติติดตามสถานะของเอกสาร-----------------------------------------//
router.get('/docStatus/:docId', async (req, res) => {
    const documentId = parseInt(req.params.docId, 10); 
    if (isNaN(documentId)) {
        return res.status(400).json({ error: "docId ต้องเป็นตัวเลข" });
    }

    try {
        const user = await prisma.user.findUnique({
            where : { id : req.user.id },
            include : {
              department : true
            }
        });

        const find_des = await prisma.destination.findUnique({
            where : { des_name : user.department.department_name }
        });

        if (!find_des) {
            return res.status(402).json({ message: "User is not in destination department" });
        }

        const doc = await prisma.documentPetition.findUnique({
            where : { id : documentId },
            include : { destination : true }
        })

        if ( !doc ){
          return res.status(404).json({ message : "not found document" });
        }

        if ( find_des.id !== doc.destinationId ){
          return res.status(401).json({ message: "Document not found in this destination department" });
        }

        const find_statusHistory = await prisma.documentStatusHistory.findMany({
            where: { documentId: documentId },
            include: {
                status: true,
                changedBy: {include : {department : true}},
                document: {
                    include: {destination : true}
                }
            },
            orderBy: { changedAt: 'asc' }
        });

        // เก็บผลลัพธ์ทั้งหมดไว้ใน array
        const set_json = [];
        for (const h of find_statusHistory) {
            if (h.status.status === 'ส่งต่อไปยังหน่วยงานอื่นที่เกี่ยวข้อง') {
                set_json.push({
                    docId: h.documentId,
                    ChangeBy: h.changedBy?.email || null,
                    status: h.status.status || null,
                    changeAt: h.changedAt,
                    note: h.note_t,
                    doc_title: h.document.title,
                    doc_id_doc: h.document.id_doc,
                    new_destination: h.document.destination.des_name,
                    old_destination: h.changedBy.department.department_name
                });
            } else {
                set_json.push({
                    docId: h.documentId,
                    ChangeBy: h.changedBy?.email || null,
                    status: h.status.status || null,
                    changeAt: h.changedAt,
                    note: h.note_t,
                    doc_title: h.document.title,
                    doc_id_doc: h.document.id_doc
                });
            }
        }
        
        // ส่งออกเป็น array ทั้งหมด
        console.log("history", set_json)
        res.json({ message: "find document history status", set_json });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }

});





export default router;