// Required External Modules
import dotenv from 'dotenv';
dotenv.config({ path: '../.env.dev' });

import express from 'express';
import prisma from '../prismaClient.js';
import { parse } from 'path';

const router = express.Router();

router.get('/', async (req, res) => {
    console.log(req.userId);
    
    const user = await prisma.user.findUnique({
        where:{
            id : req.userId
        }
    });
    console.log(user);
    
    const document_audit = await prisma.documentPetition.findMany({
        where:{
            destinationId : user.rId
        }
    })
    console.log(document_audit);
    
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
    console.log(document_json);
    res.json(document_json);
});


router.get('/:docId', async (req, res) => {
    console.log(req.userId);
    const documentId = parseInt(req.params.docId);
    console.log(documentId);

    const document_audit = await prisma.documentPetition.findUnique({
        where:{
            id:documentId
        }
    })
    console.log(document_audit);

    const dep = await prisma.department.findUnique({
        where:{
            id: document_audit.departmentId
        }
    });

    const des = await prisma.destination.findUnique({
        where:{
            id:document_audit.destinationId
        }
    });

    const stt = await prisma.status.findUnique({
        where:{
            id:document_audit.statusId
        }
    });
       
    const setdoc = {
        id:document_audit.id,
        doc_id:document_audit.doc_id,
        department_name: dep.department_name,
        destination_name: des.des_name,
        title:document_audit.title,
        authorize_to: document_audit.authorize_to,
        position: document_audit.position,
        affiliation: document_audit.affiliation,
        authorize_text: document_audit.authorize_text,
        status_name: stt.status,
        createdAt: document_audit.createdAt,
        date_of_signing: document_audit.date_of_signing
    };

    console.log(setdoc);
});




router.put('/updatestatus/:docId', async (req, res) => {
    console.log(req.userId);
    const documentId = parseInt(req.params.docId);
    console.log(documentId);

    const { statusId } = req.body; // สมมติส่ง { statusId: 3 } มา

    try {
        const status_upd = await prisma.documentPetition.update({
            where: {
                id: documentId
            },
            data: {
                statusId: statusId
            }
        });
        res.status(200).json("update status complete");
        // TODO: เพิ่มบันทึก status history
        // Action Log
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update status' });
    }
});


export default router;