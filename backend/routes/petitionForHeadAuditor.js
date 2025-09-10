// Required External Modules
import dotenv from 'dotenv';
dotenv.config({ path: '../.env.dev' });

import express from 'express';
import prisma from '../prismaClient.js';
import { parse } from 'path';
import { userInfo } from 'os';

const router = express.Router();

router.get('/', async (req, res) => {
    try {
        console.log(req.user.id);
        const user = await prisma.user.findUnique({
            where:{ id : req.user.id }
        });
        console.log(user);

        const findstatus1 = await prisma.status.findUnique({
            where : { status: "ตรวจสอบขั้นต้นเสร็จสิ้น" }
        });

        const findstatus2 = await prisma.status.findUnique({
            where : { status: "อยู่ระหว่างการตรวจสอบและอนุมัติโดยหัวหน้า" }
        });

        const find_doc = await prisma.documentPetition.findUnique({
            where : { 
                destinationId : user.departmentId,
                statusId : findstatus2.id 
            }
        });
        console.log(find_doc);

        if ( find_doc.length > 0 ) { 
            await prisma.documentPetition.updateMany({
                destinationId : user.departmentId,
                statusId : { id : findstatus1.id }
            });
        }

        const doc = await prisma.documentPetition.findMany({
            where : {
                destinationId : user.departmentId,
                status : findstatus2.id
            }
        })

        console.log(doc);
        res.json(doc);


    }catch (err){
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});






export default router;