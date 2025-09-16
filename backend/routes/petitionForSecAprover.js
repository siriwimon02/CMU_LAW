// Required External Modules
import dotenv from 'dotenv';
dotenv.config({ path: '../.env.dev' });

import express from 'express';
import prisma from '../prismaClient.js';
import multer from "multer";

const router = express.Router();

router.get("/wait_aduit_BySecAprrover", async (req, res) => {
    try {

        const user = await prisma.user.findUnique({
            where : { id : req.user.Id }
        });

        const find_st1 = await prisma.status.findUnique({
            where : { status : "ตรวจสอบขั้นสุดท้ายเสร็จสิ้น" }
        });

        const find_st2 = await prisma.status.findUnique({
            where : { status : "อยู่ระหว่างการตรวจสอบก่อนเสนออธิการบดี" }
        });

        const find_doc = await prisma.documentPetition.findMany({
            where : { statusId : find_st1.id }
        });

        if (find_doc.length === 0) {
            return res.status(404).json({ message: "not found document already audit" });
        }

        if (find_doc.length > 0) {
            await prisma.documentPetition.updateMany({
                where : { statusId : find_st1.id },
                data : {
                    statusId : find_st2.id
                }
            })

            for (const doc of find_doc){
                await prisma.documentStatusHistory.create({
                    data : {
                        document: { connect: { id: doc.id } },
                        status:   { connect: { id: find_st2.id } },
                        changedBy: { connect: { id: user.id } },
                        note_t: "เอกสารอยู่ระหว่างการตรวจสอบก่อนเสนอให้อธิการบดีอนุมัติ"
                    }
                })
            }
        }

        const doc_updateST_already = await prisma.documentPetition.findMany({
            where : { statusId : find_st2.id },
                include: {
                    user: true,
                    department: true,
                    destination: true,
                    status: true
                }
        });

        const document_json = [];
        for (const d of doc_updateST_already){
            const set_doc = {
                id : d.id,
                doc_id : d.doc_id,
                department_name : d.department.department_name,
                destination_name : d.destination.des_name,
                user_email : d.user.email,
                title : d.title,
                authorize_to : d.authorize_to,
                position : d.position,
                affiliation : d.affiliation,
                authorize_text : d.authorize_text,
                status_name : d.statusId.status,
                createAt : d.createdAt
            }
            document_json.push(set_doc);
        }
        res.json({ message : "find document to audit before approve", document_json})
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});


router.get('/document/:docId', async (req, res) => {
    const documentId = parseInt(req.params.docId, 10); 
    if (isNaN(documentId)) {
      return res.status(400).json({ error: "docId is invalid integer" });
    }

    try {
        const find_st1 = await prisma.status.findUnique({
            where : { status : "อยู่ระหว่างการตรวจสอบก่อนเสนออธิการบดี" }
        });

        const find_doc = await prisma.documentPetition.findUnique({
            where : { 
                id : documentId,
                statusId : find_st1.id 
            },
            include: {
                user: true,
                department: true,
                destination: true,
                status: true
            }
        });

        if (find_doc.length === 0) {
            return res.status(404).json({ message: "not found document already audit" });
        }
   
        const set_doc = {
            id : find_doc.id,
            doc_id : find_doc.doc_id,
            department_name : find_doc.department.department_name,
            destination_name : find_doc.destination.des_name,
            user_email : find_doc.user.email,
            title : find_doc.title,
            authorize_to : find_doc.authorize_to,
            position : find_doc.position,
            affiliation : find_doc.affiliation,
            authorize_text : find_doc.authorize_text,
            status_name : find_doc.statusId.status,
            createAt : find_doc.createdAt
        }

        res.json({ message : "find document to audit before approve", set_doc})

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});


router.put('/audit_before_approve/:docId', async (req, res) => {
    const documentId = parseInt(req.params.docId, 10); 

    if (isNaN(documentId)) {
        return res.status(400).json({ error: "docId is invalid integer" });
    }

    try {
        const user = await prisma.user.findUnique({
            where : { id : req.user.Id }
        });

        const find_st1 = await prisma.status.findUnique({
            where : { status : "อยู่ระหว่างการตรวจสอบก่อนเสนออธิการบดี" }
        });

        const find_st2 = await prisma.status.findUnique({
            where : { status : "ตรวจสอบก่อนเสนออธิการบดีเสร็จสิ้น" }
        });

        const find_doc = await prisma.documentPetition.findUnique({
            where : { id : documentId }
        })

        if ( !find_doc ) {
            return res.status(404).json({ message: "not found document" });
        }

        if (find_doc.statusId !== find_st1.id) {
            return res.status(401).json( { message : "Document not found or not in correct statu" } )
        }

        const update_stDoc = await prisma.documentPetition.update({
            where : { 
                id : documentId,
                statusId : find_st1.id
            },
            data : {
                statusId : find_st2.id
            }
        });

        //เก็บประวัติการเปลี่ยนแปลงสถานะของเอกสาร
        await prisma.documentStatusHistory.create({
            data : {
                document: { connect: { id: documentId } },
                status:   { connect: { id: find_st2.id } },
                changedBy: { connect: { id: user.id } },
                note_t: "ตรวจสอบเอกสารเรียบร้อยแล้ว รอการพิจารณาอนุมัติจากอธิการบดี"
            }
        })

        res.json({ message: "Document audited before approval", update_stDoc });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});


router.put('/editDoc_before_approve/:docId', async (req, res) => {
    const documentId = parseInt(req.params.docId, 10); 
    const {test_edit_suggesttion} = req.body;
    if (isNaN(documentId)) {
        return res.status(400).json({ error: "docId is invalid integer" });
    }
    try {
        const find_st1 = await prisma.status.findUnique({
            where : { status : "อยู่ระหว่างการตรวจสอบก่อนเสนออธิการบดี" }
        });

        const find_st2 = await prisma.status.findUnique({
            where : { status : "ส่งกลับให้แก้ไขจากการตรวจสอบขั้นสุดท้าย" }
        });

        const find_doc = await prisma.documentPetition.findUnique({
            where : { id : documentId }
        })

        if ( !find_doc ) {
            return res.status(404).json({ message: "not found document" });
        }

        if (find_doc.statusId !== find_st1.id) {
            return res.status(401).json( { message : "Document not found or not in correct statu" } )
        }

        const update_stDoc = await prisma.documentPetition.update({
            where : { 
                id : documentId,
                statusId : find_st1.id
            },
            data : {
                statusId : find_st2.id
            }
        });

        //เก็บประวัติการเปลี่ยนแปลงสถานะของเอกสาร
        await prisma.documentStatusHistory.create({
            data : {
                document: { connect: { id: documentId } },
                status:   { connect: { id: find_st2.id } },
                changedBy: { connect: { id: user.id } },
                note_t: `ส่งเอกสารกลับไปแก้ไข ก่อนกลับมาพิจารณาเพื่อเสนออธิการบดี รายละเอียดเพิ่มเติม: ${test_edit_suggesttion || "-"}`
            }
        })

        res.json({ message: "Send Document to edit before approval", update_stDoc });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});




export default router