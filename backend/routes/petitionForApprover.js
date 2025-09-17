// Required External Modules
import dotenv from 'dotenv';
dotenv.config({ path: '../.env.dev' });

import express from 'express';
import prisma from '../prismaClient.js';
import multer from "multer";

const router = express.Router();


//-----------------------------------------เอกสารที่ต้องอนุมัติ หรือรอการอนุมัติ-------------------------//
router.get('/wait_to_approve', async (req, res) => {
    try {

        const user = await prisma.user.findUnique({
            where : { id : req.user.id }
        })

        const find_st1 = await prisma.status.findUnique({
            where : { status : "ตรวจสอบก่อนเสนออธิการบดีเสร็จสิ้น" }
        });

        const find_st2 = await prisma.status.findUnique({
            where : { status : "รอการพิจารณาอนุมัติจากอธิการบดี" }
        });

        const find_doc = await prisma.documentPetition.findMany({
            where : { statusId : find_st1.id }
        });

        if (find_doc.length > 0) {
            //อัพเดตสถานะเป็นรอการพิจารณาอนุมัติจากอธิการบดี
            await prisma.documentPetition.updateMany({
                where : { statusId : find_st1.id },
                data : { statusId : find_st2.id }
            })

            //เก็บประวัติสถานะ
            for (const doc of find_doc) {
                await prisma.documentStatusHistory.create({
                    data : {
                        document: { connect: { id: doc.id } },
                        status:   { connect: { id: find_st2.id } },
                        changedBy: { connect: { id: user.id } },
                        note_t: "เอกสารอยู่ระหว่างการพิจารณาอนุมัติ จากอธิการบดี"
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
                status_name : d.status.status,
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






//----------------------------------------------ดูเอกสารเฉพาะเอกสารนี้-------------------------------------//
router.get('/document/:docId', async (req, res) => {
    const documentId = parseInt(req.params.docId, 10); 
    if (isNaN(documentId)) {
        return res.status(400).json({ error: "docId is invalid integer" });
    }

    try {
        const find_st = await prisma.status.findUnique({
            where : { status : "รอการพิจารณาอนุมัติจากอธิการบดี" }
        });

        const find_doc = await prisma.documentPetition.findUnique({
            where : { id : documentId },
            include: {
                user: true,
                department: true,
                destination: true,
            }
        });
        console.log(find_doc);

        if (!find_doc) {
            return res.status(404).json({ message: "not found document" });
        }

        if (find_doc.statusId !== find_st.id) {
            return res.status(401).json( { message : "Document not found or not in correct status" } )
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
            status_name : find_doc.status.status,
            createAt : find_doc.createdAt
        }

        res.json({ message : "This document to already to approve", set_doc})

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});








//-----------------------------------------อนุมัติเอกสาร โดยอธิการบดี-----------------------------------------//
router.put('/approve_document/:docId', async (req, res) => {

    const documentId = parseInt(req.params.docId, 10); 

    if (isNaN(documentId)) {
        return res.status(400).json({ error: "docId is invalid integer" });
    }

    try {

        const user = await prisma.user.findUnique({
            where : { id : req.user.id }
        })

        const find_st1 = await prisma.status.findUnique({
            where : { status : "รอการพิจารณาอนุมัติจากอธิการบดี" }
        });

        const find_st2 = await prisma.status.findUnique({
            where : { status : "อธิการบดีอนุมัติแล้ว" }
        })

        const find_doc = await prisma.documentPetition.findUnique({
            where : { id : documentId },
            include: {
                user: true,
                department: true,
                destination: true,
            }
        });

        if (!find_doc) {
            return res.status(404).json({ message: "not found document" });
        }

        console.log(find_doc);

        if (find_doc.statusId !== find_st1.id) {
            return res.status(401).json( { message : "Document not found or not in correct status" } )
        }

        //อัพเดตสถานะเป็นอนุมัติเรียบร้อยแล้ว
        const update_doc = await prisma.documentPetition.update({
            where : { 
                id : documentId,
                statusId : find_st1.id
            },
            data : {
                statusId : find_st2.id
            }
        });

        //เก็บประวัติสถานะ
        await prisma.documentStatusHistory.create({
            data : {
                document: { connect: { id: update_doc.id } },
                status:   { connect: { id: update_doc.statusId } },
                changedBy: { connect: { id: user.id } },
                note_t: "อธิการบดี ได้ทำการอนุมัติเอกสารคำร้องนี้เรียบร้อยแล้ว"
            }
        });

        res.json({ message: "Document approved", update_doc });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});









//---------------------------------------------ปฎิเสธคำร้อง----------------------------------------//
router.put('/reject_document/:docId', async (req, res) => {

    const documentId = parseInt(req.params.docId, 10); 
    const { text_suggesttion } = req.body;

    if (isNaN(documentId)) {
        return res.status(400).json({ error: "docId is invalid integer" });
    }

    try {

        const user = await prisma.user.findUnique({
            where : { id : req.user.id }
        })

        const find_st1 = await prisma.status.findUnique({
            where : { status : "รอการพิจารณาอนุมัติจากอธิการบดี" }
        });

        const find_st2 = await prisma.status.findUnique({
            where : { status : "อธิการบดีปฏิเสธคำร้อง" }
        })

        const find_doc = await prisma.documentPetition.findUnique({
            where : { id : documentId },
            include: {
                user: true,
                department: true,
                destination: true,
            }
        });

        if (!find_doc) {
            return res.status(404).json({ message: "not found document" });
        }

        if (find_doc.statusId !== find_st1.id) {
            return res.status(401).json( { message : "Document not found or not in correct status" } )
        }

        //อัพเดตสถานะเป็นอนุมัติเรียบร้อยแล้ว
        const update_doc = await prisma.documentPetition.update({
            where : { 
                id : documentId,
                statusId : find_st1.id 
            },
            data : {
                statusId : find_st2.id
            }
        });

        //เก็บประวัติสถานะ
        await prisma.documentStatusHistory.create({
            data : {
                document: { connect: { id: update_doc.id } },
                status:   { connect: { id: update_doc.statusId } },
                changedBy: { connect: { id: user.id } },
                note_t: `อธิการบดี ได้ทำปฎิเสธเอกสารคำร้องนี้ รายละเอียดเพิ่มเติม: ${text_suggesttion || "-"}`
            }
        });
        
        res.json({ message: "Rejected Document", update_doc });

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

        const doc = await prisma.documentPetition.findUnique({
            where : { id : documentId },
            include : { destination : true }
        })

        if ( !doc ){
          return res.status(404).json({ message : "not found document" });
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