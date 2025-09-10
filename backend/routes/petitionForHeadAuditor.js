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
        const findstatus1 = await prisma.status.findUnique({
            where : { status: "ตรวจสอบขั้นต้นเสร็จสิ้น" }
        });

        const findstatus2 = await prisma.status.findUnique({
            where : { status: "อยู่ระหว่างการตรวจสอบและอนุมัติโดยหัวหน้า" }
        });

        const find_doc = await prisma.status.findUnique({
            where : { status : findstatus2.id }
        });

        if ( find_doc.length > 0 ) { 
            await prisma.documentPetition.updateMany({
                destinationId : userInfo.departmentId,
                statusId : { id : findstatus1.id }
            });
        }

    }catch (err){
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});






export default router;