// Required External Modules
import dotenv from 'dotenv';
dotenv.config({ path: '../.env.dev' });

import express from 'express';
import prisma from '../prismaClient.js';
import { title } from 'process';


const router = express.Router();


//----------------------------------------------doc ที่รอรับเข้า + อัพเดตสถานะให้ตรวจสอบขั้นต้น-----------------------------------//
router.get('/wait_to_accept', async (req, res) => {

  try {
    const find_status1 = await prisma.status.findUnique({
      where : { status : "รอรับเรื่อง" }
    });

    const find_status2 = await prisma.status.findUnique({
      where : { status : "ส่งต่อไปยังหน่วยงานอื่นที่เกี่ยวข้อง" }
    });

    const user = await prisma.user.findUnique({
      where : { id : req.user.id }
    });

    const user_dep = await prisma.department.findUnique({
      where : { id : user.departmentId }
    })

    const find_des = await prisma.destination.findUnique({
      where : { des_name : user_dep.department_name }
    });
    console.log(user_dep, find_des);


    if (!find_des) {
      return res.status(401).json( {message : "user not live in destination department"} )
    }

    //หา document ที่มาจากกองอื่นเพื่ออัพเดตสถานะ
    const document_audit_1st = await prisma.documentPetition.findMany({
      where : {
        destinationId : find_des.id,
        statusId : find_status2.id 
      }
    });
    console.log(document_audit_1st);


    if (document_audit_1st.length > 0) {
      await prisma.documentPetition.updateMany({
        where: {
          destinationId: find_des.id,
          statusId: find_status2.id
        },
        data: { statusId: find_status1.id }
      });

      // เก็บ document status action log
      await Promise.all(
        document_audit_1st.map(doc =>
          prisma.documentStatusHistory.create({
            data: {
              document: { connect: { id: doc.id } },
              status: { connect: { id: find_status1.id } }, // ใช้ status ใหม่
              changedBy: { connect: { id: user.id } },
              note_text: "เอกสารที่รอรับเข้ากอง"
            }
          })
        )
      );
    }

    const document_audit_2st = await prisma.documentPetition.findMany({
      where : {
        destinationId : find_des.id,
        statusId : find_status1.id 
      }, include : {
        department : true,
        destination : true,
        user : true,
        status: true,
      }, orderBy: { createdAt: 'desc' }
    })
    console.log(document_audit_2st);

    const document_json = [];
    for(const doc of document_audit_2st){
        const setdoc = {
            id:doc.id,
            doc_id : doc.id_doc,
            department_name: doc.department.department_name,
            destination_name: doc.destination.des_name,
            owneremail : `${doc.user.firstname} ${doc.user.lastname} ( ${doc.user.email} )`,
            title:doc.title,
            authorize_to: doc.authorize_to,
            position: doc.position,
            affiliation: doc.affiliation,
            authorize_text: doc.authorize_text,
            status_name: doc.status.status,
            createdAt: doc.createdAt,
        }
        document_json.push(setdoc);
    }



    res.json({ message : "find document waiting to accpet in department already", document_json})
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});






//------------------------------------------update status รับเข้ากองเรียบร้อยแล้ว--------------------------------//
router.put('/update_st_ToAccpet/:docId', async (req, res) => {
  const {set_auditId} = req.body;

  if (!set_auditId || isNaN(set_auditId)) {
    return res.status(400).json({ message: "Auditor ID is required and must be a valid number" });
  }

  const auditor = await prisma.user.findUnique({ 
    where: { id: set_auditId },
    include : {
      department : true
  }});

  if (!auditor) {
      return res.status(404).json({ message: "Auditor not found" });
  }

  const find_des1 = await prisma.destination.findUnique({
    where: { des_name: auditor.department.department_name }
  });

  if (!find_des1) {
    return res.status(403).json({ message: "User is not in destination department" });
  }

  const documentId = parseInt(req.params.docId, 10); 
  if (isNaN(documentId)) {
    return res.status(400).json({ message: "docId is invalid integer" });
  }

  try {

    const find_status1 = await prisma.status.findUnique({
      where: { status: "รอรับเรื่อง" }
    });

    const find_status2 = await prisma.status.findUnique({
      where: { status: "รับเรื่องแล้ว" }
    });

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { department: true }
    });

    const find_des = await prisma.destination.findUnique({
      where: { des_name: user.department.department_name }
    });

    if (!find_des) {
      return res.status(403).json({ message: "User is not in destination department" });
    }

    const doc = await prisma.documentPetition.findUnique({
      where: { id: documentId }
    });

    if (doc.destinationId !== find_des.id) {
      return res.status(404).json({ message: "Document not found in this destination department" });
    }

    if (doc.statusId !== find_status1.id){
      return res.status(404).json({ message: "Document not found or not in correct status" });
    }

    if (doc.destinationId !== find_des1.id) {
      return res.status(404).json({ message: "Document not found auditor in this destination department" });
    }

    //อัพเดตสถานะ + เพิ่มรายชื่อพนักงานที่ต้องตรวจสอบเอกสารนี้
    const updatedDoc = await prisma.documentPetition.update({
      where: { id: documentId },
      data: { 
        status: { connect: { id: find_status2.id } },
        auditBy : { connect : { id : auditor.id } } 
      }
    });

    // เก็บ document status action log
    await prisma.documentStatusHistory.create({
        data: {
          document: { connect: { id: updatedDoc.id } },
          status:   { connect: { id: updatedDoc.statusId } },
          changedBy: { connect: { id: user.id } },
          note_text:   "เอกสารรับเข้ากองเรียบร้อยแล้ว"
        }
    });

    res.json({
      message: "Document status updated to 'accepted in department'",
      updatedDoc
    });
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


















//------------------------------------------------ส่งเอกสารไปกองอื่น ที่ไม่ใช้กองตัวเอง-------------------------------------//
router.put('/change_destination/:docId', async( req, res) => {
  //ส่งไอดีของกองใหม่่มา
  const {new_destinationId, text_suggest} = req.body;
  try {
    if (isNaN(new_destinationId)) {
      return res.status(400).json({ error: "new_destinationId must be integer" });
    }
    
    const find_new_des = await prisma.destination.findUnique({
      where : { id : new_destinationId }
    })
    if (!find_new_des) {
      return res.status(404).json({ error: "new destination not found" });
    }


    const documentId = parseInt(req.params.docId, 10); 
    if (isNaN(documentId)) {
      return res.status(400).json({ error: "docId is invalid integer" });
    }

    const find_status1 = await prisma.status.findUnique({
      where: { status: "รอรับเรื่อง" }
    });

    const find_status2 = await prisma.status.findUnique({
      where: { status: "ส่งต่อไปยังหน่วยงานอื่นที่เกี่ยวข้อง" }
    });

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { department: true }
    });

    const find_des = await prisma.destination.findUnique({
      where: { des_name: user.department.department_name }
    });

    if (!find_des) {
      return res.status(404).json({ message: "User is not in destination department" });
    }

    const doc = await prisma.documentPetition.findUnique({
      where: { id: documentId }
    });

    if (!doc || doc.destinationId !== find_des.id) {
      return res.status(403).json({ message: "Document not found in this destination department" });
    }

    if (doc.statusId !== find_status1.id){
      return res.status(403).json({ message: "Document is not in the correct status for transfer" });
    }

    if ( new_destinationId === doc.destinationId ) {
      return res.status(400).json({ message: "New destination is the same as the current destination" });
    }

    const updatedDoc = await prisma.documentPetition.update({
        where : { 
          id : documentId, 
        }, data : {
          statusId : find_status2.id,
          destinationId : new_destinationId
        }
    });

    // เก็บ document status action log
    const history_st = await prisma.documentStatusHistory.create({
        data: {
          document: { connect: { id: updatedDoc.id } },
          status:   { connect: { id: updatedDoc.statusId } },
          changedBy: { connect: { id: user.id } },
          note_text: `รายละเอียดเพิ่มเติม: ${text_suggest || "-"}`
        }
    });

    //เก็บประวัติการเปลี่ยน destination ของเอกสารนี้
    const his_destination_doc = await prisma.documentPetitionHistoryTranfers.create({
      data : {
        document : { connect : { id : doc.id } },
        transferFrom : { connect : { id : doc.destinationId } },
        transferTo : { connect : { id : new_destinationId } },
        transferBy : { connect : {id : user.id} },
        statusHistory : { connect : { id : history_st.id } },
        note_text : `รายละเอียดเพิ่มเติม : ${text_suggest}`
      }
    });
    console.log("keep history status",history_st);
    console.log("keep Old destination Id", his_destination_doc);

    res.json({ message: "Document has been forwarded to another department", updatedDoc });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});





//-----------------------------------ดูรายชื่อพนักงานที่ส่งไป-----------------------//
router.get('/api/auditor', async (req, res) => {
  try {
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

    const find_role = await prisma.roleOfUser.findUnique({
      where : { role_name : "auditor" }
    });

    const find_auditor = await prisma.user.findMany({
      where : {
        rId : find_role.id,
        departmentId : user.departmentId
      }
    });

    res.json({ message : "Get Auditor Already", find_auditor })
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});































//------------------------------------------------ตรวจสอบเอกสารขั้นสุดท้ายก่อนส่งไปให้ อธิการบดี-------------------------------------//
//doc ที่รอตรวจสอบ
router.get('/wait_to_audit_bySpvAudit', async (req, res) => {
  try {
    const find_status1 = await prisma.status.findUnique({
      where : { status : "หัวหน้างานตรวจสอบแล้ว" }
    });
    const find_status2 = await prisma.status.findUnique({
      where : { status : "อยู่ระหว่างตรวจสอบโดยผู้อำนวยการ" }
    });

    const user = await prisma.user.findUnique({
      where : { id : req.user.id }
    });

    const user_dep = await prisma.department.findUnique({
      where : { id : user.departmentId }
    })

    const find_des = await prisma.destination.findUnique({
      where : { des_name : user_dep.department_name }
    });


    if (!find_des) {
      return res.status(401).json( {message : "user not live in destination department"} )
    }

    //หา document ที่มาdoc ที่ผ่านการตรวจสอบจากหัวหน้ากองแล้ว
    const document_audit_1st = await prisma.documentPetition.findMany({
      where : {
        destinationId : find_des.id,
        statusId : find_status1.id
      }
    });
    console.log(document_audit_1st);

    
    if (document_audit_1st.length > 0){
      for (const doc of document_audit_1st) {
        //อัพเดตสถานะการตรวจสอบจากหัวหน้า เป็น อยุ่ระหว่างตรวจสอบอันสุดท้าย
        await prisma.documentPetition.update({
          where : { id : doc.id },
          data : {
            statusId : find_status2.id
          }
        });
        
        // เก็บ document status action log
        await prisma.documentStatusHistory.create({
          data : {
            document: { connect: { id: doc.id } },
            status: { connect: { id: find_status2.id } }, 
            changedBy: { connect: { id: user.id } },
            note_text: "รอตรวจสอบเอกสาร จาก ผอ.กอง"
          }
        });
      }
    }

    const document_audit_2st = await prisma.documentPetition.findMany({
      where : {
        destinationId : find_des.id,
        statusId : find_status2.id 
      }, include: {
        department: true,
        destination: true,
        status: true,
        user: true,
        auditBy : true,
        headauditBy : true,
      }, orderBy: { createdAt: 'desc' }
    })
    console.log(document_audit_2st);

    const document_json = [];
    for(const doc of document_audit_2st){
        const setdoc = {
            id: doc.id,
            doc_id: doc.id_doc,
            department_name: doc.department.department_name,
            destination_name: doc.destination.des_name,
            owneremail: `${doc.user.firstname} ${doc.user.lastname} ( ${doc.user.email} )`,
            title: doc.title,
            authorize_to: doc.authorize_to,
            position: doc.position,
            affiliation: doc.affiliation,
            authorize_text: doc.authorize_text,
            status_name: doc.status.status,
            auditBy: `${doc.auditBy.firstname} ${doc.auditBy.lastname} ( ${doc.auditBy.email} )`,        
            headauditBy: `${doc.headauditBy.firstname} ${doc.headauditBy.lastname} ( ${doc.headauditBy.email} )`, 
            createdAt: doc.createdAt,
        };
        document_json.push(setdoc);
        // console.log(setdoc);
    }
    // console.log(document_json);
    res.json({ message : "find document waiting to the last audit", document_json})
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});




//--------------------------------------------อัพเดตยืนการตรวจเอกสารรอบสุดท้าย-------------------------------//
router.put('/update_st_audit_by_Spvaudit/:docId', async (req, res) => {
    try {
        const documentId = parseInt(req.params.docId, 10); 
        if (isNaN(documentId)) {
            return res.status(400).json({ error: "docId is invalid integer" });
        }
 
        const find_status1 = await prisma.status.findUnique({
            where: { status: "อยู่ระหว่างตรวจสอบโดยผู้อำนวยการ" }
        });

        const find_status2 = await prisma.status.findUnique({
            where: { status: "ผู้อำนวยการตรวจสอบแล้ว" }
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
        console.log(doc);

        if (!doc || doc.destinationId !== find_des.id) {
          return res.status(404).json({ message: "Document not found in this destination department" });
        }

        if (doc.statusId !== find_status1.id){
          return res.status(404).json({ message: "Document not found or not in correct status" });
        }


        //อัพเดตสถานะ
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
              note_text:   "ตรวจสอบเอกสารเรียบร้อยแล้วในขั้นสุดท้าย โดย ผอ.กอง"
            }
        });
        console.log(his_st);

        res.json({ message: "Document status updated to the first audit is already", updatedDoc});

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});





//--------------------------------------------ส่งเอกสาร กลับไปแก้ไขที่ role audit----------------------------//
router.put('/edit_BySpvAuditor/:docId', async (req, res) => {
    const {text_edit_suggestion} = req.body;
    console.log(text_edit_suggestion);
    try {
        const documentId = parseInt(req.params.docId, 10); 
        if (isNaN(documentId)) {
            return res.status(400).json({ error: "docId is invalid integer" });
        }
 
        const find_status1 = await prisma.status.findUnique({
            where: { status: "อยู่ระหว่างตรวจสอบโดยผู้อำนวยการ" }
        });

        const find_status2 = await prisma.status.findUnique({
            where: { status: "ส่งคืนแก้ไขเอกสารโดยผู้อำนวยการ" }
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

        //อัพเดต status
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
              note_text: `รายละเอียดเพิ่มเติมการแก้ไขเอกสาร: ${text_edit_suggestion || "-"}`
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
                note_text: `รายละเอียดเอกสารที่ต้องแก้ไข : ${text_edit_suggestion}`
            }
        });
        console.log("History edit document", history_edit)

        //ส่ง data ไปยังเมลด้วย
        //------------------------mail----------------//
        res.json({message: "Document status updated to audit to edit document", updatedDoc});
        
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});























//-------------------------------------ประวัติเอกสาร---------------------------------------//
//-------------------------------------ส่งตรวจสอบเรียบร้อยแล้ว-------------------------------//
router.get('/history_accepted', async (req, res) => {
  try {
    const find_st1 = await prisma.status.findUnique({
      where : { status : "รับเรื่องแล้ว" }
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
      }, orderBy: { changedAt: 'desc' }
    });

    if (!doc || doc.length === 0) {
      return res.json([]); // ไม่มีประวัติ → ส่ง array ว่าง
    }

    const set_json = doc.map(h => ({
      historyId: h.id,
      docId: h.documentId,
      idformal: h.document.id_doc,

      // เจ้าของเอกสาร
      owneremail: h.document.user?.email || null,
      ownername: `${h.document.user?.firstname || ""} ${h.document.user?.lastname || ""}`.trim(),

      // สถานะ
      status: h.status?.status || null,
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







//--------------------------------------------ประวัติที่ส่งเอกสารได้ไปกองอื่น-------------------------------//
router.get('/history_change_des', async (req, res) => {

  try {
    const find_st1 = await prisma.status.findUnique({
      where : { status : "ส่งต่อไปยังหน่วยงานอื่นที่เกี่ยวข้อง" }
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

    const his_change_des = await prisma.documentStatusHistory.findMany({
      where : {
        statusId : find_st1.id,
        changeById : user.id
      }
    });

    if (his_change_des.length === 0) {
      return res.json([]); // ไม่มีประวัติ ก็ส่ง array ว่างกลับไป
    }
    console.log(his_change_des);


    const change_des = await prisma.documentPetitionHistoryTranfers.findMany({
      where: { 
        his_statusId : { in: his_change_des.map(h => h.id) }, 
        transferFromId : find_des.id 
      },
      include: {
        document: {
          include: {
            status: true,
            auditBy: true,
            headauditBy: true
          }
        },
        transferFrom: true,
        transferTo: true,
        transferBy: true,
        statusHistory: {
          include: { status: true }
        }
      }, orderBy: {
        statusHistory: { changedAt: 'desc' }, // ✅ ถูกต้อง
      },
    });
    console.log(change_des);

    const set_json = change_des.map(h => ({
      history_petition_id : h.id,
      history_status_id : h.statusHistory.id,
      docId: h.documentId,
      idformal: h.document.id_doc,

      // การโอนย้าย
      from: h.transferFrom?.des_name || null,
      to: h.transferTo?.des_name || null,

      // คนโอน
      transferByemail: h.transferBy?.email || null,
      transferByname: `${h.transferBy?.firstname || ""} ${h.transferBy?.lastname || ""}`.trim(),

      // สถานะ
      oldstatus: h.statusHistory?.status?.status || null,   // สถานะก่อนโอน
      nowstatus: h.document?.status?.status || null,       // สถานะปัจจุบันของเอกสาร
      statusHistoryId: h.statusHistory?.id || null,
      changeAt: h.statusHistory?.changedAt || null,
      note: h.note_text || null,

      // เอกสาร
      doc_title: h.document?.title || null,
      doc_statusNow: h.document?.status?.status || null,

      // audit
      auditByemail: h.document?.auditBy?.email || null,
      auditByname: h.document?.auditBy
        ? `${h.document.auditBy.firstname} ${h.document.auditBy.lastname}`.trim()
        : null,

      // head audit
      headauditByemail: h.document?.headauditBy?.email || null,
      headauditByname: h.document?.headauditBy
        ? `${h.document.headauditBy.firstname} ${h.document.headauditBy.lastname}`.trim()
        : null
    }));

    res.json(set_json);
  } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
  } 
});






//-----------------------------ประวัติการตรวจสอบเอกสารขั้นสุดท้ายเสร็จเรียบร้อย----------------//
router.get('/history_final_audited', async (req, res) => {
  try {
    const find_st1 = await prisma.status.findUnique({
      where : { status : "ผู้อำนวยการตรวจสอบแล้ว" }
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
      }, orderBy: { changedAt: 'desc' }
    });

    if (!doc || doc.length === 0) {
      return res.json([]); // ไม่มีประวัติ → ส่ง array ว่าง
    }

    const set_json = doc.map(h => ({
      historyId: h.id,
      docId: h.documentId,
      idformal: h.document.id_doc,

      // เจ้าของเอกสาร
      owneremail: h.document.user?.email || null,
      ownername: `${h.document.user?.firstname || ""} ${h.document.user?.lastname || ""}`.trim(),


      // สถานะ
      status: h.status?.status || null,
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
router.get('/history_send_back_edit_spvauditor', async (req, res) => {

  try {
    const find_st1 = await prisma.status.findUnique({
      where : { status : "ส่งคืนแก้ไขเอกสารโดยผู้อำนวยการ" }
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
        statusId : find_st1.id,
        changeById : user.id,
        document: {
          destinationId: find_des.id   
        } 
      },include : {
        status : true,
        changedBy : true,
        document : { include : {
          auditBy : true,
          headauditBy : true,
          status : true,
          user : true
        }}
      }, orderBy: { changedAt: 'desc' }
    });

    if (find_his_edit.length === 0) {
      return res.json([]); // ไม่มีประวัติ ก็ส่ง array ว่างกลับไป
    }

    console.log(find_his_edit);

    const set_json = find_his_edit.map(h => ({
      history_status_id: h.id,
      docId: h.document.id,
      idformal: h.document.id_doc,

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
    console.log(set_json);
    res.json(set_json)
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});





export default router;


