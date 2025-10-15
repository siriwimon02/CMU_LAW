// Required External Modules
import dotenv from 'dotenv';
dotenv.config({ path: '../.env.dev' });

import express from 'express';
import prisma from '../prismaClient.js';
import { create } from 'domain';


const router = express.Router();


//------------------------doc ที่รอรับเข้า + อยู่ระหว่างการตรวจสอบและอนุมัติโดยหัวหน้า หาเอกสารที่ ตรวจเสร็จจากเอกสารขั้นต้นแล้ว--------------//
router.get('/wait_to_accept_byHeadaudit', async (req, res) => {

  try {
    const find_status1 = await prisma.status.findUnique({
      where : { status : "เจ้าหน้าที่ตรวจสอบแล้ว" }
    });

    const find_status2 = await prisma.status.findUnique({
      where : { status : "อยู่ระหว่างตรวจสอบโดยหัวหน้างาน" }
    });

    const user = await prisma.user.findUnique({
        where : { id : req.user.id },
        include: { department: true }
    });
    const find_des = await prisma.destination.findUnique({
        where : { des_name : user.department.department_name }
    });
    console.log(find_des)
    if (!find_des) {
        return res.status(403).json({ message: "User is not in destination department" });
    }


    //หา document ที่มาจากกองอื่นเพื่ออัพเดตสถานะ
    const document_audit_1st = await prisma.documentPetition.findMany({
      where : {
        destinationId : find_des.id,
        statusId : find_status1.id,
        headauditIdBy : user.id
      }, include: { status: true }
    });
    console.log("doc audit_1st", document_audit_1st);


    if (document_audit_1st.length > 0){
        const update_st = await prisma.documentPetition.updateMany({
            where : {
                destinationId : find_des.id,
                statusId : find_status1.id,
                headauditIdBy: user.id
            },
            data : { statusId : find_status2.id }
        });

        // เก็บ document status action log
        await Promise.all(
            document_audit_1st.map(doc =>
                prisma.documentStatusHistory.create({
                    data: {
                    document: { connect: { id: doc.id } },
                    status:   { connect: { id: find_status2.id } }, 
                    changedBy: { connect: { id: user.id } },
                    note_text:   "รอตรวจสอบเอกสาร จากหัวหน้ากอง"
                    }
                })
            )
        );

        console.log("อัพเดตสถานะของผู้ตรวจสอบ", update_st)
    }

    const document_audit_2st = await prisma.documentPetition.findMany({
      where : {
        destinationId : find_des.id,
        statusId : find_status2.id,
        headauditIdBy : user.id
      }, include : {
        department : true,
        destination : true,
        user : true,
        auditBy : true,
        status: true,
      }
    })
    console.log(document_audit_2st);

    const document_json = [];
    for(const doc of document_audit_2st){
        const setdoc = {
            id:doc.id,
            doc_id : doc.id_doc,
            department_name: doc.department.department_name,
            destination_name: doc.destination.des_name,
            owneremail: `${doc.user.firstname} ${doc.user.lastname} ( ${doc.user.email} )`,
            title:doc.title,
            authorize_to: doc.authorize_to,
            position: doc.position,
            affiliation: doc.affiliation,
            authorize_text: doc.authorize_text,
            status_name: doc.status.status,
            auditBy: `${doc.auditBy.firstname} ${doc.auditBy.lastname} ( ${doc.auditBy.email} )`,   
            createdAt: doc.createdAt,
        }
        document_json.push(setdoc);
    }
    console.log(document_json);
    res.json({ message : "find document waiting to audit by headAudit", document_json})

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});












//-------------------------------------------อัพเดตสถานะ ตรวจสอบของหัวหน้างาน------------------------------//
router.put('/update_st_audit_by_Headaudit/:docId', async (req, res) => {
    const documentId = parseInt(req.params.docId, 10); 

    if (isNaN(documentId)) {
        return res.status(400).json({ error: "docId is invalid integer" });
    }

    try {
        const find_status1 = await prisma.status.findUnique({
            where: { status: "อยู่ระหว่างตรวจสอบโดยหัวหน้างาน" }
        });

        const find_status2 = await prisma.status.findUnique({
            where: { status: "หัวหน้างานตรวจสอบแล้ว" }
        });

        const user = await prisma.user.findUnique({
            where : { id : req.user.id },
            include: { department: true }
        });
        const find_des = await prisma.destination.findUnique({
            where : { des_name : user.department.department_name }
        });
        if (!find_des) {
            return res.status(403).json({ message: "User is not in this destination department" });
        }

        const doc = await prisma.documentPetition.findUnique({
            where: { id: documentId }
        });

    
        if (!doc || doc.destinationId !== find_des.id) {
          return res.status(404).json({ message: "Document not found in this destination department" });
        }

        if (doc.statusId !== find_status1.id){
          return res.status(404).json({ message: "Document not found or not in correct status" });
        }

        if (doc.headauditIdBy !== user.id) {
            return res.status(403).json({ message: "You do not have permission to access this document" });
        }

        const updatedDoc = await prisma.documentPetition.update({
            where: { id: documentId },
            data: { statusId: find_status2.id }
        });

        // เก็บ document status action log
        await prisma.documentStatusHistory.create({
            data: {
            document: { connect: { id: updatedDoc.id } },
            status:   { connect: { id: updatedDoc.statusId } },
            changedBy: { connect: { id: user.id } },
            note_text:   `ตรวจสอบเอกสารเรียบร้อยแล้ว โดยหัวหน้ากอง`
            }
        });

        res.json({ message: "Document status updated to the audit is already by HeadAudit", updatedDoc});
    
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});











//แก้ไขสถานะ กลับไปแก้ไขเอกสาร ส่งไปที่ผู้ใช้แก้ไข
router.put('/edit_ByheadAuditor/:docId', async (req, res) => {
    const {text_edit_suggesttion} = req.body;
    try {
        const documentId = parseInt(req.params.docId, 10); 
        if (isNaN(documentId)) {
        return res.status(400).json({ error: "docId is invalid integer" });
        }
 
        const find_status1 = await prisma.status.findUnique({
        where: { status: "อยู่ระหว่างตรวจสอบโดยหัวหน้างาน" }
        });

        const find_status2 = await prisma.status.findUnique({
            where: { status: "ส่งคืนแก้ไขเอกสารโดยหัวหน้างาน" }
        });

        const user = await prisma.user.findUnique({
            where : { id : req.user.id },
            include: { department: true }
        });
        const find_des = await prisma.destination.findUnique({
            where : { des_name : user.department.department_name }
        });
        if (!find_des) {
            return res.status(403).json({ message: "User is not in this destination department" });
        }

        const doc = await prisma.documentPetition.findUnique({
            where: { id: documentId }
        });

        console.log(doc.statusId, find_status1.id)
        

        if (!doc || doc.destinationId !== find_des.id) {
          return res.status(404).json({ message: "Document not found in this destination department" });
        }

        if (doc.statusId !== find_status1.id){
          return res.status(404).json({ message: "Document not found or not in correct status" });
        }

        if (doc.headauditIdBy !== user.id) {
            return res.status(403).json({ message: "You do not have permission to access this document" });
        }

        const updatedDoc = await prisma.documentPetition.update({
            where: { id: documentId },
            data: { statusId: find_status2.id }
        });

        // เก็บ document status action log
        const his_st = await prisma.documentStatusHistory.create({
            data: {
                document: { connect: { id: updatedDoc.id } },
                status:   { connect: { id: updatedDoc.statusId } },
                changedBy: { connect: { id: user.id } },
                note_text:   `รายละเอียดเพิ่มเติมการแก้ไขเอกสาร: ${text_edit_suggesttion || "-"}`
            }
        });

        const update_finish = await prisma.documentPetition.findUnique({
            where : { id : documentId }
        });

        const history_edit = await prisma.documentPetitionHistory.create({
            data: {
                document: {connect: {id : update_finish.id}},
                title : update_finish.title,
                authorize_to: update_finish.authorize_to,
                position : update_finish.position,
                affiliation : update_finish.affiliation,
                authorize_text : update_finish.authorize_text,
                editedBy : { connect : { id : user.id } },
                statusHistory : { connect : { id : his_st.id } },
                note_text: `รายละเอียดเอกสารที่ต้องแก้ไข : ${text_edit_suggesttion}`
            }
        });
        console.log("History edit document", history_edit)

        //ส่ง data ไปยังเมลด้วย
        //------------------------mail----------------//
        res.json({message: "Document status updated to user to edit document", update_finish});
    
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});





































//-----------------------------------ประวัติเอกสาร-----------------------------------//
//-----------------------------ประวัติการตรวจสอบเอกสารขั้นต้นเสร็จเรียบร้อย----------------//
router.get('/history_seconde_audited', async (req, res) => {
  try {
    const find_st1 = await prisma.status.findUnique({
      where : { status : "หัวหน้างานตรวจสอบแล้ว" }
    });

    const user = await prisma.user.findUnique({
      where : { id : req.user.id },
      include: { department: true }
    });
    const find_des = await prisma.destination.findUnique({
        where : { des_name : user.department.department_name }
    });
    if (!find_des) {
        return res.status(403).json({ message: "User is not in this destination department" });
    }

    const doc = await prisma.documentStatusHistory.findMany({
      where : { 
        changeById : user.id,
        statusId : find_st1.id,
        document: {
          destinationId: find_des.id  
        }
        }, include : {
            status : true,
            changedBy : true,
            document : { include : {
              auditBy : true,
              headauditBy : true,
              status : true,
              user : true
            }}
        },orderBy: {
            changedAt: 'desc' // หรือ 'asc' ถ้าอยากเก่าสุดไปใหม่สุด
        }
    });

    if (!doc || doc.length === 0) {
      return res.json([]); // ไม่มีประวัติ → ส่ง array ว่าง
    }

    const set_json = doc.map(h => ({
      historyId: h.id,
      docId: h.documentId,
      idformal: h.document.id_doc,
      createAt : h.document.createdAt,
      

      // เจ้าของเอกสาร
      owneremail: h.document.user?.email || null,
      ownername: `${h.document.user?.firstname || ""} ${h.document.user?.lastname || ""}`.trim(),


      // สถานะ
      oldstatus: h.status?.status || null,
      nowstatus: h.document.status?.status || null,
      changeAt: h.changedAt,
      note: h.note_text || null,

      // เอกสาร
      doc_title: h.document.title,
      doc_statusNow: h.document.status.status,

      // audit
      auditByemail: h.document.auditBy ? h.document.auditBy.email : null,
      auditByname: h.document.auditBy
        ? `${h.document.auditBy.firstname} ${h.document.auditBy.lastname}`
        : null,

      // head audit
      headauditByemail: h.document.headauditBy ? h.document.headauditBy.email : null,
      headauditByname: h.document.headauditBy
        ? `${h.document.headauditBy.firstname} ${h.document.headauditBy.lastname}`
        : null
    }));
    res.json(set_json);

  } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
  }
});




//-------------------------------------ประวัติที่ส่งกลับไปแก้ไข--------------------------------------//
router.get('/history_send_back_edit_headauditor', async (req, res) => {
  try {
    const find_st1 = await prisma.status.findUnique({
      where : { status : "ส่งคืนแก้ไขเอกสารโดยหัวหน้างาน" }
    });

    const user = await prisma.user.findUnique({
      where : { id : req.user.id },
      include: { department: true }
    });
    const find_des = await prisma.destination.findUnique({
        where : { des_name : user.department.department_name }
    });
    if (!find_des) {
        return res.status(403).json({ message: "User is not in this destination department" });
    }

    // หาประวัติที่ user เป็นคนเปลี่ยนสถานะ
    const find_his_edit = await prisma.documentStatusHistory.findMany({
      where : { 
        changeById : user.id,
        statusId : find_st1.id,
        document: {
          destinationId: find_des.id  
        }
        }, include : {
            status : true,
            changedBy : true,
            document : { include : {
              auditBy : true,
              headauditBy : true,
              status : true,
              user : true
            }}
        },orderBy: {
            changedAt: 'desc' // หรือ 'asc' ถ้าอยากเก่าสุดไปใหม่สุด
        }
    });

    console.log(find_his_edit);

    if (find_his_edit.length === 0) {
      return res.json([]); // ไม่มีประวัติ ก็ส่ง array ว่างกลับไป
    }


    const set_json = find_his_edit.map(h => ({
      history_status_id: h.id,
      docId: h.document.id,
      idformal: h.document.id_doc,
      createAt : h.document.createdAt,

      // สถานะ
      oldstatus: h.status?.status || null,
      nowstatus: h.document.status?.status || null,
      note_text: h.note_text || null,
      editedAt: h.changedAt,

      title : h.document.title,
      
      editedByname: `${h.changedBy.firstname} ${h.changedBy.lastname}`.trim(),
      editedByemail: h.changedBy.email,
      
      ownername: `${h.document.user.firstname} ${h.document.user.lastname}`.trim(),
      owneremail: h.document.user.email,
      
      // audit
      auditByemail: h.document.auditBy ? h.document.auditBy.email : null,
      auditByname: h.document.auditBy
        ? `${h.document.auditBy.firstname} ${h.document.auditBy.lastname}`
        : null,

      // head audit
      headauditByemail: h.document.headauditBy ? h.document.headauditBy.email : null,
      headauditByname: h.document.headauditBy
        ? `${h.document.headauditBy.firstname} ${h.document.headauditBy.lastname}`
        : null
      
    }));
    res.json(set_json)
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});



export default router;