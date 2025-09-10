// Required External Modules
import dotenv from 'dotenv';
dotenv.config({ path: '../.env.dev' });

import express from 'express';
import prisma from '../prismaClient.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const router = express.Router();

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


//ฟอร์มเอกสารใหม่ เข้ามาใหม่
router.post('/', async (req, res) =>{
    console.log(req.user.id);
    const userid = req.user.id;

    const {
        destinationId,
        title,
        authorize_to,
        position,
        affiliation,
        authorize_text
    } = req.body;

    try {
        const user = await prisma.user.findUnique({
            where:{ id: userid }
        })

        console.log(user);
        // console.log(user.departmentId);
        const doc = await prisma.documentPetition.create({
            data: {
                id_doc: 1,
                department: { connect: { id: user.departmentId } },
                destination: { connect: { id: destinationId } },
                title,
                authorize_to,
                position,
                affiliation,
                authorize_text,
                user : { connect: {id : userid}},
                status: { connect: {id : 1} }
            }
        });
        console.log(doc)
        console.log('document save')

        res.status(200).json({
            message: "document saved",
            success: true
        });    
    } catch (err){
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});


// หน้าบ้านต้องส่ง docId มาด้วย เช่น PUT /documents/5
router.put('/edit/:docId', async (req, res) => {
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
                statusId : find_st.id
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
        res.json({message: "update document already", updatedDoc});


    } catch (error) {
        console.error("Update failed:", error);
        res.status(500).json({ error: "Failed to update document" });
    }
});


export default router;