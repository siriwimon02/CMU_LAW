// Required External Modules
import dotenv from 'dotenv';
dotenv.config({ path: '../.env.dev' });

import express from 'express';
import prisma from '../prismaClient.js';
import { parse } from 'path';
import assert from 'assert';

const router = express.Router();

router.get('/waittoaudit', async (req, res) => {
    console.log(req.user.id);
    
    const user = await prisma.user.findUnique({
        where:{
            id : req.user.id
        }
    });
    console.log(user);
    
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
        where : { status : "ส่งกลับให้แก้ไขจากการตรวจสอบโดยหัวหน้า"}
    })

    const findstatus5 = await prisma.status.findUnique({
        where : { status : "ส่งกลับให้แก้ไขจากการตรวจสอบขั้นสุดท้าย"}
    })


    //หาเอกสารที่ส่งเข้ามาในกองนี้
    const find_doc = await prisma.documentPetition.findMany({
        where : {
            destinationId : user.departmentId,
            statusId: {
                in : [findstatus1.id, findstatus2.id, findstatus3.id, findstatus4.id, findstatus5.id]
            }
        }
    });
    console.log(find_doc);

    if (find_doc.length > 0) {
        await prisma.documentPetition.updateMany({
            where:{
                destinationId : user.departmentId,
                statusId: {
                    in : [findstatus1.id, findstatus2.id, findstatus3.id, findstatus4.id, findstatus5.id]
                }
            }, data :{
                statusId : findstatus2.id
            }
        });
    }

    const document_audit = await prisma.documentPetition.findMany({
        where : {
            destinationId : user.departmentId,
            statusId : findstatus2.id
        }
    });

    const document_json = [];
    for(const doc of document_audit){
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
            date_of_signing: doc.date_of_signing
        };
        document_json.push(setdoc);
        // console.log(setdoc);
    }
    console.log(document_json);
    res.json(document_json);
});


router.get('/:docId', async (req, res) => {
    try {
        const documentId = parseInt(req.params.docId);
        const user = await prisma.user.findUnique({
            where : { id : req.user.id }
        });

        if (!documentId){
            res.status(404).json({message: "not found document"})
        }

        const doc = await prisma.documentPetition.findUnique({
            where : { id : documentId }
        });

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
            date_of_signing: doc.date_of_signing
        };
        
        res.json( {message : "get doccument", setdoc});
    }catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});


router.get('/history_st_to_audit_already', async (req, res) => {
    try{
        console.log(req.user.id);
        const user = await prisma.user.findUnique({
            where:{
                id : req.user.id
            }
        });
        console.log(user);

        const find_status = await prisma.status.findUnique({
            where : { status : "ตรวจสอบเอกสารเรียบร้อยแล้ว" }
        })

        const document_audit_already = await prisma.documentPetition.findMany({
            where : {
                destinationId : user.departmentId,
                statusId : find_status.id
            }
        });


        const document_json = [];
        for(const doc of document_audit_already){
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
                date_of_signing: doc.date_of_signing
            };
            document_json.push(setdoc);
            // console.log(setdoc);
        }
        console.log(document_json);
        res.json(document_json);

    } catch (error) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});


router.put('/update_st_to_audit_already/:docId', async (req, res) => { 
    try {    
        const documentId = parseInt(req.params.docId);

        const user = await prisma.user.findUnique({
            where : { id : req.user.id }
        });

        const document = await prisma.documentPetition.findUnique({
            where : { id : documentId }
        });

        if (!document) {
            return res.status(404).json({ message: "Document not found" });
        }

        //ต้องเป็นกองที่รับผิดชอบเอกสารนี้เท่านั้น
        if (user.departmentId !== document.destinationId) {
            return res.status(403).json({ message: "Forbidden: document does not belong to your department" });
        }

        const findstatus = await prisma.status.findUnique({
            where :{ status: "อยู่ระหว่างการตรวจสอบขั้นต้น" }
        });
        console.log(findstatus);

        if ( document.statusId !== findstatus.id){
            return res.status(409).json({ message: "Conflict: document is not waiting for receive" });
        }

        const audit_already_st = await prisma.status.findUnique({
            where : { status : "ตรวจสอบขั้นต้นเสร็จสิ้น" }
        })


        const updated = await prisma.documentPetition.update({
            where : { id : documentId },
            data : {
                statusId : audit_already_st.id
            }
        })
        res.json({ message: "Document updated status successfully", updated });
    } catch (error) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});


//----------------------------------------------edit status--------------------------------------------//
router.put('/update_edit_status/:docId', async (req, res) => {
    try {
        const { text_suggestion } = req.body;
        const documentId = parseInt(req.params.docId);

        const user = await prisma.user.findUnique({
            where : { id : req.user.id }
        });

        const document = await prisma.documentPetition.findUnique({
            where : { id : documentId }
        });

        if (!document) {
            return res.status(404).json({ message: "Document not found" });
        }

        //ต้องเป็นกองที่รับผิดชอบเอกสารนี้เท่านั้น
        if (user.departmentId !== document.destinationId) {
            return res.status(403).json({ message: "Forbidden: document does not belong to your department" });
        }

        const findstatus = await prisma.status.findUnique({
            where :{ status: "อยู่ระหว่างการตรวจสอบขั้นต้น" }
        });
        console.log(findstatus);

        if ( document.statusId !== findstatus.id){
            return res.status(409).json({ message: "Conflict: document is not waiting for receive" });
        }

        const audit_already_st = await prisma.status.findUnique({
            where : { status : "ส่งกลับให้ผู้ใช้แก้ไขเอกสาร" }
        })

        const updated = await prisma.documentPetition.update({
            where : { id : documentId },
            data : {
                statusId : audit_already_st.id
            }
        })
        res.json({ message: "Document updated status successfully", updated });

        //update สำเร็จจ ให้ส่งแจ้งตื่น email ไปหา user ว่าแก้ไขเอกสาร ไฟล์นี้ เรื่องนี้ แผนกอะไร บลาๆ

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});


export default router;