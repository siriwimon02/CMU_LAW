// Required External Modules
import dotenv from 'dotenv';
dotenv.config({ path: '.env.dev' });

import cors from 'cors';
import express from 'express';
import prisma from './prismaClient.js';
import authUser from './routes/authUser.js';
import authMiddle from './middleware/authMiddle.js';
import petition from './routes/petitionForUser.js';
import petition_Audit from './routes/petitionForAuditor.js';
import petition_SuperAudit from './routes/petitionForSuperAudit.js';
import petition_HeadAudit from './routes/petitionForHeadAuditor.js';
import checkRole from './middleware/checkRole.js';


// App Variables
const app = express();
const PORT = process.env.PORT || 3001; // Use environment variable PORT or default to 4000


app.use(cors({
  origin: 'http://localhost:5173',  // อนุญาต frontend ที่อยู่ที่นี่
  methods: ['GET', 'POST', 'PUT', 'DELETE'],  // กำหนด method ที่อนุญาต
  credentials: true,  // ถ้าต้องการส่ง cookies หรือ authorization headers
}));

//middleware
app.use(express.json());


app.get('/', (req, res) => {
  res.send('Hello, Express!'); // Simple response for the root route
});


app.use('/auth', authUser);
app.use('/petition', authMiddle, checkRole([2]), petition); //user
app.use('/petitionAudit', authMiddle, checkRole([5]), petition_Audit); //สำหรับคนตรวจสอบ
app.use('/petitionSuperAudit', authMiddle, checkRole([3]), petition_SuperAudit); //สำหรับผอ กอง
app.use('/petitionHeadAudit', authMiddle, checkRole([4]), petition_HeadAudit)



app.get('/checkrole', authMiddle, checkRole([2, 3]), (req, res) => {
  res.json({ message: "Accept to access path", user: req.user.role_id });
});


//----------------------------------------user----------------------------------//
//ดึง data user
app.get('/auth/user', authMiddle, async(req, res) => {
  const userId = req.user.id;
  console.log('user Id ' , userId)

  const user_info = await prisma.user.findUnique({
      where:{
        id : userId
      }
  });

  const user_db = await prisma.department.findMany({
    where:{
      id: user_info.departmentId
    }
  });
  console.log(user_db);

  const user_role = await prisma.roleOfUser.findMany({
    where:{
      id: user_info.rId
    }
  });
  console.log(user_info, user_db, user_role);
  const json_send_info = {
    department_name: user_db[0].department_name,
    email: user_info.email,
    firstname: user_info.firstname,
    lastname: user_info.lastname,
    role_n: user_role[0].role_name
  }
  console.log(json_send_info);
  res.json(json_send_info);
});



//-----------------------------------user all -------------------------------//
app.get('/api/user', authMiddle, checkRole([1]), async (req, res) => {
  const userAll = await prisma.user.findMany({
      include: {
        role: {
          select: {
            role_name: true
          }
        }
      }
    });
  res.json(userAll);
  console.log(userAll);
});



//-----------------------------department-----------------------------------//
app.get('/api/department' , async(req, res) =>{
  const department = await prisma.department.findMany();
  res.json(department)

  console.log(department);
});



//---------------------------role of user -----------------------------------//
app.get('/api/roleofuser', async(req, res) =>{
  const role = await prisma.roleOfUser.findMany();
  res.json(role);

  console.log(role);
});


//----------------------------destination----------------------------------//
app.get('/api/destination', async(req, res) => {
  const des = await prisma.destination.findMany();
  res.json(des);
});



//-------------------------- Get Document Attactment-----------------------------------//
app.get('/api/doc_attactment', authMiddle, checkRole([3, 4, 5]), async(req, res) => {
  const user = await prisma.user.findUnique({
    where : { id : req.user.id },
    include: { department: true }
  });

  const find_des = await prisma.destination.findUnique({
      where : { des_name : user.department.department_name }
  });

  console.log(user, find_des);

  if (!find_des) {
      return res.status(403).json({ message: "User is not in destination department" });
  }



});


app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});




