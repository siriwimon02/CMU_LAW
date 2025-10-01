// Required External Modules
import dotenv from 'dotenv';
dotenv.config({ path: '.env.dev' });

import cors from 'cors';
import express, { application } from 'express';
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


// [
//   { id: 1, role_name: 'admin' },
//   { id: 2, role_name: 'user' },
//   { id: 3, role_name: 'spv_auditor' },
//   { id: 4, role_name: 'head_auditor' },
//   { id: 5, role_name: 'auditor' },
//   { id: 6, role_name: 'endorser' },
//   { id: 7, role_name: 'se_endorser' }
// ]

app.use('/auth', authUser);
app.use('/petition', authMiddle, checkRole(["user"]), petition); //user
app.use('/petitionAudit', authMiddle, checkRole(["auditor"]), petition_Audit); //สำหรับคนตรวจสอบ
app.use('/petitionSuperAudit', authMiddle, checkRole(["spv_auditor"]), petition_SuperAudit); //สำหรับผอ กอง
app.use('/petitionHeadAudit', authMiddle, checkRole(["head_auditor"]), petition_HeadAudit);




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
app.get('/api/user', authMiddle, checkRole(["admin"]), async (req, res) => {
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

//-------------------------------- add user -------------------------------//
app.post('/api/user', authMiddle, checkRole(['admin']), async (req, res) => {
  try {
    const { firstname, email, role_id } = req.body;

    if (!firstname || !email || !role_id) {
      return res.status(400).json({ error: 'กรอกข้อมูลให้ครบถ้วน' });
    }

    const newUser = await prisma.user.create({
      data: {
        firstname,
        email,
        lastname: null,
        departmentId: null,
        rId: parseInt(role_id)
      }
    });

    res.json(newUser);
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: 'สร้างผู้ใช้ไม่สำเร็จ' });
  }
});


//------------------------------ edit role user -----------------------------//
app.get('/api/updateRole', authMiddle, checkRole(["admin"]), async (req, res) => {
  try {
    const { user_id, role_id } = req.body;
    if (!user_id || !role_id) {
      return res.status(400).json({ error: 'user_id and role_id are required' });
    }

    const updatedUser = await prisma.user.update({
      where: { id: parseInt(user_id) },
      data: { rId: parseInt(role_id) },
      include: { role: true }
    });

    res.json({ message: 'Role updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Error updating role:', error);
    res.status(500).json({ error: 'Failed to update role' });
  }
});



//-------------------------------- delete user -------------------------------//
app.delete('/api/user/:id', authMiddle, checkRole(["admin"]), async (req, res) => {
  try {
    const userId = parseInt(req.params.id);
    await prisma.user.delete({
      where: { id: userId }
    });
    
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
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
app.get('/api/doc_attactment', async(req, res) => {
  const find_attachment = await prisma.documentAttachment.findMany();
  res.json(find_attachment);
});

//-------------------------- Get Document Attactment-----------------------------------//
app.get('/api/history/status', async(req, res) => {
  const find_his_story = await prisma.documentStatusHistory.findMany();
  res.json(find_his_story);
});

app.get('/api/history/document', async (req, res) => {
  try {
    const find_his_story = await prisma.documentPetition.findMany({
      include: {
        status: true,           // ดึง relation status
        department: true,       // ถ้าอยากได้ department ด้วย
        destination: true,      // หรือ relation อื่น ๆ
        user: true
      }
    });

    res.json(find_his_story);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});





//----------------------------------ดึง path file ดาวโหลด Only-----------------------------//










//---------------------------------history status-----------------------------------------//
app.get('/history_status/:docId', authMiddle, checkRole(["admin", "user", "spv_auditor", "head_auditor", "auditor"]) , async (req, res) =>{

    const documentId = parseInt(req.params.docId, 10);

    if (isNaN(documentId)) {
      return res.status(400).json({ error: "docId is invalid integer" });
    }

    try {

      const find_history_status = await prisma.documentStatusHistory.findMany({
        where : { documentId : documentId }
      });

      const find_st1 = await prisma.status.findUnique({
        where : { status : "ส่งกลับให้แก้ไขจากการตรวจสอบขั้นสุดท้าย" }
      });

      const find_st2 = await prisma.status.findUnique({
        where : { status : "ส่งกลับเพื่อแก้ไขจากการตรวจสอบโดยหัวหน้ากอง" }
      });

      const find_st3 = await prisma.status.findUnique({
        where : { status : "ส่งกลับให้ผู้ใช้แก้ไขเอกสาร" }
      });

      const find_st4 = await prisma.status.findUnique({
        where : { status : "เจ้าหน้าที่แก้ไขเอกสารแล้ว" }
      });

      const find_st5 = await prisma.status.findUnique({
        where : { status : "เจ้าหน้าที่อัปโหลดเอกสารเพิ่มเติมแล้ว" }
      });

      const find_st6 = await prisma.status.findUnique({
        where : { status : "ส่งต่อไปยังหน่วยงานอื่นที่เกี่ยวข้อง" }
      });

      const history_all = []
      for ( const his of find_history_status ) {
        if ( his.statusId === find_st1.id || his.statusId === find_st2.id 
          || his.statusId === find_st3.id || his.statusId === find_st5.id 
          || his.statusId === find_st4.id 
        ){
          const find_his_edit = await prisma.documentPetitionHistory.findMany({
            where: { his_statusId: his.id },
            include: {
              editedBy: { select: { email: true, firstname: true, lastname: true } },
              statusHistory: {
                include: {
                  status: { select: { status: true } }
                }
              },
              document: true
            }
          });

          const result = find_his_edit.map(item => ({
            historyId: item.id,
            documentId: item.documentId,
            docFormalId: item.document.id_doc,
            historyTitle: item.title,                   // title ตอนแก้
            currentTitle: item.document.title,          // title ปัจจุบัน
            status: item.statusHistory.status.status,   // ชื่อสถานะ
            //statusNote: item.statusHistory.note_text,   // Note ของ statusHistory
            note: item.note_text, 
            editedByemail : item.editedBy.email,                      // Note ของการแก้ไข
            editedByname : item.editedBy.firstname,
            editedBylname : item.editedBy.lastname,
            editAt: item.editAt,

            //ประวัติเอกสารเก่า
            oldTitle : item.title,
            oldAuthorize_to : item.authorize_to,
            oldPosition : item.position,
            oldAffiliation : item.affiliation,
            oldAuthorize_text : item.authorize_text
          }));

          history_all.push(result[0]);
        }

        else if ( his.statusId === find_st6.id ) {
          const find_his_change_des = await prisma.documentPetitionHistoryTranfers.findFirst({
            where: { his_statusId: his.id },
            include: {
              transferFrom: { select: { des_name: true } },
              transferTo: { select: { des_name: true } },
              transferBy: { select: { email: true, firstname: true, lastname: true } },
              statusHistory: {
                include: {
                  status: { select: { status: true } }  // <<-- ดึงชื่อสถานะด้วย
              }},
              document : true
            }
          });
          const set_json = {
            docId : find_his_change_des.document.id,
            idformal : find_his_change_des.document.id_doc,
            status : find_his_change_des.statusHistory.status.status,
            transferFrom : find_his_change_des.transferFrom.des_name,
            transferTo : find_his_change_des.transferTo.des_name,
            transferByemail : find_his_change_des.transferBy.email,
            transferByname : find_his_change_des.transferBy.firstname,
            transferBylname : find_his_change_des.transferBy.lastname,
            transferAt : find_his_change_des.statusHistory.changedAt,
            note : find_his_change_des.note_text
          }

          history_all.push(set_json);
        }
        
        else {
          const find_his = await prisma.documentStatusHistory.findUnique({
            where : { id : his.id },
            include : {
              status : {select : { status : true }},
              changedBy : { select : { email : true, firstname : true, lastname : true } }, 
              document : true
            }
          });

          const set_json = {
            docId : find_his.document.id,
            idformal : find_his.document.id_doc,
            status : find_his.status.status,
            changeBy_email : find_his.changedBy.email,
            changeBy_name : find_his.changedBy.firstname,
            changeBy_lname : find_his.changedBy.lastname,
            changeAt : find_his.changedAt,
            date_of_signing : find_his.date_of_signing,
            note : find_his.note_text
          }
          history_all.push(set_json)
        }
      }
      console.log(history_all);
      res.json(history_all);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
});





app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});




