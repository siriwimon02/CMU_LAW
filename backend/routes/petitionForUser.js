// Required External Modules
import dotenv from 'dotenv';
dotenv.config({ path: '../.env.dev' });

import express from 'express';
import prisma from '../prismaClient.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const router = express.Router();


router.get('/', async (req, res) => {
    console.log(req.userId);

    const petition_doc = await prisma.documentPetition.findMany({
        where:{
            userId : req.userId
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


router.post('/', async (req, res) =>{
    console.log(req.userId);
    const userid = req.userId;
    const {
        destinationId,
        title,
        authorize_to,
        position,
        affiliation,
        authorize_text
    } = req.body;

    const user = await prisma.user.findUnique({
        where:{
            id: userid
        }
    })

    console.log(user)
    const doc = await prisma.documentPetition.create({
        data: {
            id_doc: 1,
            departmentId: user.departmentId,
            destinationId:destinationId,
            title,
            authorize_to,
            position,
            affiliation,
            authorize_text,
            userId: req.userId,
            statusId: 1
        }
    });
    console.log(doc)
    console.log('document save')
    res.status(200).json({
        message: "document saved",
        success: true
    });

});


//หน้าบ้านจะต้องส่ง ไอดี form มาด้วย
router.put('/:docId', async (req, res) =>{
    const documentId = parseInt(req.params.id);
    console.log(documentId);
    const {
        department,
        destinationId,
        title,
        authorizeTo,
        position,
        affiliation,
        authorizeText
    } = req.body;

    try {
        const updatedDoc = await prisma.document.update({
            where: {
                id: documentId
            },
            data: {
                department,
                destinationId,
                title,
                authorizeTo,
                position,
                affiliation,
                authorizeText
            }
        });

        res.json(updatedDoc);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update document' });
    }

});



router.delete('/:docId', async (req, res) => {
  const documentId = parseInt(req.params.id);

  try {
    const deletedDoc = await prisma.document.delete({
      where: { id: documentId }
    });

    res.json({ message: 'Document deleted successfully', data: deletedDoc });
  } catch (error) {
    console.error(error);

    if (error.code === 'P2025') {
      res.status(404).json({ message: 'Document not found' });
    } else {
      res.status(500).json({ message: 'Server error' });
    }
  }
});


export default router;