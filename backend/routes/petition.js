// Required External Modules
import dotenv from 'dotenv';
dotenv.config({ path: '../.env.dev' });

import express from 'express';
import prisma from '../prismaClient.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const router = express.Router();


router.get('/', async (req, res) =>{
    console.log(req.userId);
});


router.post('/', async (req, res) =>{
    console.log(req.userId);

    const {
        department,
        destinationId,
        title,
        authorizeTo,
        position,
        affiliation,
        authorizeText
    } = req.body;


    const doc = await prisma.document.create({
        data: {
            id_doc: 1,
            department,
            destination: {
                connect: { id: destinationId }
            },
            title,
            authorizeTo,
            position,
            affiliation,
            authorizeText,
            user: {
                connect: { id: req.userId }
            },
            status: {
                connect: { id: 1 } // สมมติว่า status เริ่มต้นคือ 1 เช่น "รอดำเนินการ"
            }
        }
    });

    console.log(doc);
    res.send("document saved");

});




export default router;