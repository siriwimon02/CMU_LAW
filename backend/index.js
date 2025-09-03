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
app.use('/petition', authMiddle, petition);
app.use('/petitionAudit', authMiddle, petition_Audit);


//----------------------------------------user----------------------------------//
app.get('/auth/user', authMiddle, async(req, res) => {
  const userId = req.userId;
  console.log('user Id ' , userId)

  const user_info = await prisma.user.findUnique({
      where:{
        id : userId
      }
  });

  const user_db = await prisma.Department.findMany({
    where:{
      id: user_info.departmentId
    }
  });

  const user_role = await prisma.RoleOfUser.findMany({
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



//-----------------------------department-----------------------------------//
app.get('/api/department', authMiddle, async(req, res) =>{
  const userId = req.userId;
  console.log("user_id", userId);

  const department = await prisma.department.findMany();
  res.json(department)

  console.log(department);
});


//---------------------------destination-------------------------------------//
app.get('/api/destination', authMiddle, async(req,res) =>{
  const destination = await prisma.destination.findMany();
  res.json(destination);
});


app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});