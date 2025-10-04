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

//for download
import fs from "fs";
import mime from "mime-types";

import path from "path";
import { fileURLToPath } from "url";


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

//--------------------------ประวัติการแก้ไขเอกสาร เก็บประวัติเก่าไว้-----------------------------//
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









//--------------------------------------ตอนคลิกดูรายละเอียดเอกสารแต่ละอัน กับ ดึง data ตอนแก้ไข---------------------------//
app.get('/document/:docId', authMiddle ,checkRole(["admin", "user", "spv_auditor", "head_auditor", "auditor"]), async (req, res) => {
  try {
    const currentUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { department: true }
    });

    const documentId = parseInt(req.params.docId, 10);
    if (isNaN(documentId)) {
      return res.status(400).json({ error: "docId is invalid integer" });
    }

    const doc = await prisma.documentPetition.findUnique({
      where: { id: documentId },
      include: {
        department: true,
        destination: true,
        user: true,
        status: true,
        auditBy: true,
        headauditBy: true,
        attachments: { include: { attachmentType: true } },
        documentNeeds: { include: { requiredDocument: true } }
      }
    });

    if (!doc) {
      return res.status(404).json({ message: "Document not found" });
    }

    if (req.user.role_name === "user" && doc.userId !== currentUser.id) {
      return res.status(403).json({ message: "You do not have permission to access this document" });
    }

    if (["spv_auditor", "head_auditor", "auditor"].includes(req.user.role_name)) {
      const find_des = await prisma.destination.findUnique({
        where: { des_name: currentUser.department.department_name }
      });

      if (!find_des || doc.destinationId !== find_des.id) {
        return res.status(403).json({ message: "Document not found in this destination department" });
      }

      if (req.user.role_name === "head_auditor" && doc.headauditIdBy !== currentUser.id) {
        return res.status(403).json({ message: "You do not have permission to access this document" });
      }

      if (req.user.role_name === "auditor" && doc.auditIdBy !== currentUser.id) {
        return res.status(403).json({ message: "You do not have permission to access this document" });
      }
    }

    const setdoc = {
      id: doc.id,
      doc_id: doc.id_doc,
      department_name: doc.department.department_name,
      destination_name: doc.destination.des_name,
      title: doc.title,
      authorize_to: doc.authorize_to,
      position: doc.position,
      affiliation: doc.affiliation,
      authorize_text: doc.authorize_text,
      status_name: doc.status.status,
      createdAt: doc.createdAt,
      auditBy: doc.auditBy?.email ?? null,
      headauditBy: doc.headauditBy?.email ?? null,
      documentNeed: doc.documentNeeds,
      document_attachments: doc.attachments
    };

    res.json({ message: "Document Petition", setdoc });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});







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
      //console.log(find_history_status);

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

      const find_st7 = await prisma.status.findUnique({
        where : { status : "ผู้ใช้แก้ไขเอกสารเรียบร้อยแล้ว" }
      });

      const history_all = []
      for ( const his of find_history_status ) {
        //console.log("history status", his.id)
        if ( his.statusId === find_st4.id || his.statusId === find_st7.id ){

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
          //console.log(find_his_edit);

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







app.get('/download/attachment', async (req, res) => {

  try {
    const file = await prisma.documentAttachment.findMany({
      include : { attachmentType : true }
    });

    console.log(file);

    if (!file) return res.status(404).json({ message: "File not found" });

    res.json(file);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }

});




const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

//ส่งไอดีของ attachment name มา
app.get("/download/:id", authMiddle, checkRole(["admin", "user", "spv_auditor", "head_auditor", "auditor"]), async (req, res) => {
  const documentId = parseInt(req.params.id, 10);

  if (isNaN(documentId)) {
    return res.status(400).json({ error: "docId is invalid integer" });
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: req.user.id },
    include: { department: true }
  });

  try {
    const file = await prisma.documentAttachment.findUnique({
      where: { id: parseInt(req.params.id, 10) },
      include : {
        document : { include : {
          department: true,
          destination: true,
          user: true,
          status: true,
          auditBy: true,
          headauditBy: true
        }}
      }
    });

    if (!file) {
      return res.status(404).json({ message: "File not found" });
    }

    if (req.user.role_name === "user" && file.document.userId !== currentUser.id) {
      return res.status(403).json({ message: "You do not have permission to access this document" });
    }

    if (["spv_auditor", "head_auditor", "auditor"].includes(req.user.role_name)) {
      const find_des = await prisma.destination.findUnique({
        where: { des_name: currentUser.department.department_name }
      });

      if (!find_des || file.document.destinationId !== find_des.id) {
        return res.status(403).json({ message: "Document not found in this destination department" });
      }

      if (req.user.role_name === "head_auditor" && file.document.headauditIdBy !== currentUser.id) {
        return res.status(403).json({ message: "You do not have permission to access this document" });
      }

      if (req.user.role_name === "auditor" && file.document.auditIdBy !== currentUser.id) {
        return res.status(403).json({ message: "You do not have permission to access this document" });
      }
    }
    
    const filePath = path.join(__dirname, file.file_path);
    res.download(filePath, file.file_name); 
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});







app.get('/history_upload_document', async (req, res) => {
  try {
    const doc_attachment = await prisma.documentAttachment.findMany({
      include: {
        attachmentType: true,
        document: {
          select: {
            id : true,
            id_doc: true,
            title: true,
          },
        },
      },
    });

    const grouped = doc_attachment.reduce((acc, item) => {
      const docId = item.document.id_doc; // ✅ ใช้ id_doc จาก document
      if (!acc[docId]) {
        acc[docId] = [];
      }
      acc[docId].push(item);
      return acc;
    }, {});

    // grouped จะเป็น object key = id_doc
    console.log(grouped);

    // แปลงเป็น array พร้อมแนบ title
    const groupedArray = Object.entries(grouped).map(([id_doc, attachments]) => ({
      id : attachments[0]?.document?.id,
      id_doc,
      title: attachments[0]?.document?.title || null, // ดึง title มาแนบด้วย
      attachments,
    }));

    res.json(groupedArray);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});



// โฟลเดอร์ฐานที่ยอมให้เสิร์ฟไฟล์
const ALLOW_BASE_DIRS = [
  path.resolve("./"),                     // รากโปรเจกต์ (ที่มีโฟลเดอร์ uploads/)
  path.resolve("/app"),                   // ถ้ารันใน Docker ที่โค้ดอยู่ /app
];

function isUnderAllowedBase(absPath) {
  const norm = path.resolve(absPath);
  return ALLOW_BASE_DIRS.some(base => norm === base || norm.startsWith(base + path.sep));
}

//------------------------download file -----------------------------------//
app.get('/attachments/:attachId/download', authMiddle, checkRole(["admin", "user", "spv_auditor", "head_auditor", "auditor"]), async (req, res) => {

  try {
    const currentUser = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { department: true }
    });

    const attachmentId = parseInt(req.params.attachId, 10);
    if (isNaN(attachmentId)) {
      return res.status(400).json({ error: "attachment Id is invalid integer" });
    }

    const attachment_file = await prisma.documentAttachment.findUnique({
      where : {
        id : attachmentId
      },include : {
        attachmentType : true,
        document : true
      }
    });
    console.log(attachment_file)

    if (!attachment_file) {
      return res.status(404).json({ message: "Attachment not found" });
    }

    if (req.user.role_name === "user" && attachment_file.document.userId !== currentUser.id){
      return res.status(403).json({ message: "You do not have permission to download document" });
    }

    if (["spv_auditor", "head_auditor", "auditor"].includes(req.user.role_name)) {
      const find_des = await prisma.destination.findUnique({
        where: { des_name: currentUser.department.department_name }
      });
      console.log(find_des)

      if (!find_des || attachment_file.document.destinationId !== find_des.id) {
        return res.status(403).json({ message: "Document not found in this destination department" });
      }

      if (req.user.role_name === "head_auditor" && attachment_file.document.headauditIdBy !== currentUser.id) {
        return res.status(403).json({ message: "You do not have permission to access this document" });
      }

      if (req.user.role_name === "auditor" && attachment_file.document.auditIdBy !== currentUser.id) {
        return res.status(403).json({ message: "You do not have permission to access this document" });
      }
    }


    const candidate = attachment_file.file_path || attachment_file.file_name;
    let abs = path.isAbsolute(candidate) ? candidate : path.resolve("./", candidate);
    abs = path.resolve(abs);


    if (!isUnderAllowedBase(abs)) {
      return res.status(403).json({ message: "forbidden path" });
    }
    if (!fs.existsSync(abs)) {
      return res.status(404).json({ message: "file not found on disk" });
    }

    
    // ตั้ง content-type + ชื่อไฟล์ก่อนส่ง
    const downloadName = attachment_file.file_name || path.basename(abs);
    const ct = mime.lookup(abs) || "application/octet-stream";
    res.setHeader("Content-Type", ct);

    return res.download(abs, downloadName, (err) => {
      if (err && !res.headersSent) res.status(500).json({ message: "send error" });
    });


  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }

})















//-----------------------------------------for admin management---------------------------------------//
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




//-----------------------------------------document all------------------------------------------------//
app.get('/api/documentAll', async (req, res) => {
  const documentAll = await prisma.documentPetition.findMany({
    include : {
      department : true,
      destination : true,
      user : true,
      auditBy : true,
      headauditBy : true,
      status : true,
    }
  });

  const document_json = [];
    for(const doc of documentAll){
        const setdoc = {
            id: doc.id,
            doc_id: doc.id_doc,
            department_name: doc.department.department_name,
            destination_name: doc.destination.des_name,
            owneremail: `${doc?.user?.firstname ?? ""} ${doc?.user?.lastname ?? ""}`.trim() +
              (doc?.user?.email ? ` (${doc.user.email})` : ""),
            title: doc.title,
            authorize_to: doc.authorize_to,
            position: doc.position,
            affiliation: doc.affiliation,
            authorize_text: doc.authorize_text,
            status_name: doc.status.status,
            auditBy: `${doc?.auditBy?.firstname ?? ""} ${doc?.auditBy?.lastname ?? ""}`.trim() +
                    (doc?.auditBy?.email ? ` (${doc.auditBy.email})` : ""),
            headauditBy: `${doc?.headauditBy?.firstname ?? ""} ${doc?.headauditBy?.lastname ?? ""}`.trim() +
                        (doc?.headauditBy?.email ? ` (${doc.headauditBy.email})` : ""),
            createdAt: doc.createdAt,
        };
        document_json.push(setdoc);
  }

  res.json(document_json)
  
});



//-----------------------------------api action log ----------------------------------------------//
app.get('/api/action_log/:docId', async (req, res) => {

  // const date_time = "";
  // const actionBy = "";
  // const role_name = "";
  // const action = "";
  // const text = "";

  const documentId = parseInt(req.params.docId, 10); 
  if (isNaN(documentId)) {
    return res.status(400).json({ error: "docId is invalid integer" });
  }
  
  const find_st = await prisma.documentStatusHistory.findMany({
    where : { documentId : documentId },
    include : { 
      petitionEdits : true,
      petitionTranfers :true
    }
  });
  res.json(find_st)



});



app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});




