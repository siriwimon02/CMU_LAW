// Required External Modules
import dotenv from 'dotenv';
dotenv.config({ path: '../.env.dev' });

import express from 'express';
import prisma from '../prismaClient.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';


const router = express.Router();

// console.log("JWT_SECRET:", process.env.JWT_SECRET);


router.post('/register', async (req, res) =>{
    const {username, password} = req.body;
    const hashedPass = bcrypt.hashSync(password, 8);

    console.log('try to use database');
    try{
        const user = await prisma.user.create({
            data:{
                username,
                password:hashedPass,
                // ทุกคนที่เข้ามารอบแรกจะ จะset ให้เป็น user ปกติ แล้วค่อยให้ admin จัดการว่าต้องการใช้คนในยุ role อะไร
                role: {
                    connect: {id:1}
                }
            }
        })
        const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: '24h' });
        console.log("token", token);
        res.json({ token });
        console.log('New User');
        
    }catch (err) {
        console.log(err.message);
        res.sendStatus(503);
    }
});


router.post('/login', async (req, res) =>{
    const {username, password} = req.body;
    console.log(username, password);

    try{
        const user = await prisma.user.findUnique({
            where: {
                username: username
            }
        })
        //เช็คว้า user มีมั้ย
        if (!user) {
            return res.status(404).send({message: "User Not Found"});
        }
        console.log(user);
        //เช็ค password 
        const passwordIsValid = bcrypt.compareSync(password, user.password);
        if (!passwordIsValid){
            return res.status(401).send({ message: "Invalid password" }) 
        }
        const token = jwt.sign({ id: user.id}, process.env.JWT_SECRET, {expiresIn: '24h'})
        res.json({token})
    } catch (err) {
        console.log(err.message);
        res.sendStatus(503);
    }
});






export default router;
