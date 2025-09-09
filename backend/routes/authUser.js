// Required External Modules
import dotenv from 'dotenv';
dotenv.config({ path: '../.env.dev' });

import express from 'express';
import prisma from '../prismaClient.js';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';


const router = express.Router();

// console.log("JWT_SECRET:", process.env.JWT_SECRET);
// ออกแบบมาใช้ตอน dev

router.post('/register', async (req, res) => {
  const { email, firstname, lastname, departmentName, role_id } = req.body;

  try {
    // หาหรือสร้าง department
    let dept = await prisma.department.findUnique({
    where: { department_name: departmentName },
    });

    if (!dept) {
    dept = await prisma.department.create({
        data: { department_name: departmentName },
    });
    }

    // หาว่ามี user อยู่แล้วหรือยัง
    const user = await prisma.user.upsert({
      where: { email },
      update: {
        firstname,
        lastname,
        department: { connect: { id: dept.id } },
        role: { connect: { id: role_id } }, // ใช้ connect
      },
      create: {
        email,
        firstname,
        lastname,
        department: { connect: { id: dept.id } },
        role: { connect: { id: role_id } }, // ใช้ connect
      },
    });

    // สร้าง JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role_id: role_id},
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('token', token);
    res.json({ token });
  } catch (err) {
    console.error(err.message);
    res.sendStatus(503);
  }
});

router.post('/login', async (req, res) => {
  const { email } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(401).json({ error: "User not found" });
    }

    // สร้าง JWT
    const token = jwt.sign(
      { id: user.id, email: user.email, role_id: user.rId},
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('token', token);
    res.json({ token });
  } catch (err) {
    console.error(err.message);
    res.sendStatus(503);
  }
});

export default router;

