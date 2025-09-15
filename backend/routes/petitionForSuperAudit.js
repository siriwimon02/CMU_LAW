// Required External Modules
import dotenv from 'dotenv';
dotenv.config({ path: '../.env.dev' });

import express from 'express';
import prisma from '../prismaClient.js';
import { parse } from 'path';
import e from 'express';

const router = express.Router();

//---------------------------------------------------new code -----------------------------------------------------//

//doc ที่รอรับเข้า + อัพเดตสถานะให้ตรวจสอบขั้นต้น
router.get('/wait_to_accept', async (req, res) => {
  
  try {
    const find_status1 = await prisma.status.findUnique({
      where : { status : "รอรับเข้ากอง" }
    });

    const find_status2 = await prisma.status.findUnique({
      where : { status : "ส่งต่อไปยังกองอื่น" }
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

    const find_d = await prisma.destination.findMany();
    console.log(find_d, "checkkkkkkkk");


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
              note_t: "เปลี่ยนสถานะจาก 'ส่งต่อไปยังกองอื่น' เป็น 'รอรับเข้ากอง'"
            }
          })
        )
      );
    }

    const document_audit_2st = await prisma.documentPetition.findMany({
      where : {
        destinationId : find_des.id,
        statusId : find_status1.id 
      }
    })
    console.log(document_audit_2st);

    const document_json = [];
    for(const doc of document_audit_2st){
        const dep = await prisma.department.findUnique({
            where:{
                id: doc.departmentId
            }
        });

        const des = await prisma.destination.findUnique({
            where:{
                id:doc.destinationId
            }
        });

        const stt = await prisma.status.findUnique({
            where:{
                id:doc.statusId
            }
        });

        const user_email = await prisma.user.findUnique({
            where:{
                id: doc.userId
            }
        });

        const setdoc = {
            id:doc.id,
            doc_id:doc.doc_id,
            department_name: dep.department_name,
            destination_name: des.des_name,
            user_email: user_email.email,
            title:doc.title,
            authorize_to: doc.authorize_to,
            position: doc.position,
            affiliation: doc.affiliation,
            authorize_text: doc.authorize_text,
            status_name: stt.status,
            createdAt: doc.createdAt,
            date_of_signing: doc.date_of_signing
        };
        document_json.push(setdoc);
        // console.log(setdoc);
    }
    // console.log(document_json);
    res.json({ message : "find document waiting to accpet in department already", document_json})
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


//---------------------------------------------------------ดึง data แต่ละ ID--------------------------------------//
router.get('/document/:docId', async (req, res) => {
  try {
    const documentId = parseInt(req.params.docId, 10); 
    if (isNaN(documentId)) {
      return res.status(400).json({ error: "docId is invalid integer" });
    }

    const find_status1 = await prisma.status.findUnique({
      where: { status: "รอรับเข้ากอง" }
    });

    if (!find_status1) {
      return res.status(500).json({ message: "Status not found" });
    }

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
      where: { id: documentId },
      include: {
        department: true,
        destination: true,
        status: true,
        user: true
      }
    });

    if (!doc || doc.destinationId !== find_des.id) {
      return res.status(404).json({ message: "Document not found in this destination department" });
    }

    if (doc.statusId !== find_status1.id){
      return res.status(404).json({ message: "Document not found or not in correct status" });
    }

    const setdoc = {
      id: doc.id,
      doc_id: doc.doc_id,
      department_name: doc.department.department_name,
      destination_name: doc.destination.des_name,
      user_email: doc.user.email,
      title: doc.title,
      authorize_to: doc.authorize_to,
      position: doc.position,
      affiliation: doc.affiliation,
      authorize_text: doc.authorize_text,
      status_name: doc.status.status,
      createdAt: doc.createdAt,
      date_of_signing: doc.date_of_signing
    };

    res.json({ message: "Document waiting to be accepted in department", setdoc });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});



//------------------------------------------update status รับเข้ากองเรียบร้อยแล้ว--------------------------------//
router.put('/update_st_audit_by_spv/:docId', async (req, res) => {
  try {
    const documentId = parseInt(req.params.docId, 10); 
    if (isNaN(documentId)) {
      return res.status(400).json({ error: "docId is invalid integer" });
    }

    const find_status1 = await prisma.status.findUnique({
      where: { status: "รอรับเข้ากอง" }
    });

    const find_status2 = await prisma.status.findUnique({
      where: { status: "รับเข้ากองเรียบร้อย" }
    });

    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    const user_dep = await prisma.department.findUnique({
      where: { id: user.departmentId }
    });

    const find_des = await prisma.destination.findUnique({
      where: { des_name: user_dep.department_name }
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

    //อัพเดตสถานะ
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
          note_t:   "อัพเดตสถานะจาก 'รอรับเข้ากอง' เป็น 'รับเข้ากองเรียบร้อยแล้ว'"
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




//------------------------------------------------ตรวจสอบเอกสารขั้นสุดท้ายก่อนส่งไปให้ อธิการบดี-------------------------------------//
//doc ที่รอตรวจสอบ
router.get('/wait_to_audit_bySpvAudit', async (req, res) => {
  try {
    const find_status1 = await prisma.status.findUnique({
      where : { status : "ตรวจสอบและอนุมัติโดยหัวหน้าเสร็จสิ้น" }
    });
    const find_status2 = await prisma.status.findUnique({
      where : { status : "อยู่ระหว่างการตรวจสอบขั้นสุดท้าย" }
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

    //อัพเดตสถานะการตรวจสอบจากหัวหน้า เป็น อยุ่ระหว่างตรวจสอบอันสุดท้าย
    if (document_audit_1st.length > 0){
      await prisma.documentPetition.updateMany({
        where : {
          destinationId : find_des.id,
          statusId : find_status1.id 
        }, data : {
          statusId : find_status2.id
        }
      });

      // เก็บ document status action log
      await Promise.all(
        document_audit_1st.map(doc =>
          prisma.documentStatusHistory.create({
            data: {
              document: { connect: { id: doc.id } },
              status: { connect: { id: find_status2.id } }, 
              changedBy: { connect: { id: user.id } },
              note_t: "เปลี่ยนสถานะจาก 'ตรวจสอบและอนุมัติโดยหัวหน้าเสร็จสิ้น' เป็น 'อยู่ระหว่างการตรวจสอบขั้นสุดท้าย'"
            }
          })
        )
      );
    }

    const document_audit_2st = await prisma.documentPetition.findMany({
      where : {
        destinationId : find_des.id,
        statusId : find_status2.id 
      }
    })
    console.log(document_audit_2st);

    const document_json = [];
    for(const doc of document_audit_2st){
        const dep = await prisma.department.findUnique({
            where:{
                id: doc.departmentId
            }
        });

        const des = await prisma.destination.findUnique({
            where:{
                id:doc.destinationId
            }
        });

        const stt = await prisma.status.findUnique({
            where:{
                id:doc.statusId
            }
        });

        const user_email = await prisma.user.findUnique({
            where:{
                id: doc.userId
            }
        });

        const setdoc = {
            id:doc.id,
            doc_id:doc.doc_id,
            department_name: dep.department_name,
            destination_name: des.des_name,
            user_email: user_email.email,
            title:doc.title,
            authorize_to: doc.authorize_to,
            position: doc.position,
            affiliation: doc.affiliation,
            authorize_text: doc.authorize_text,
            status_name: stt.status,
            createdAt: doc.createdAt,
            date_of_signing: doc.date_of_signing
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


router.get('/document_forlastAudit/:docId', async (req, res) => {
    try {
        const documentId = parseInt(req.params.docId, 10); 
        if (isNaN(documentId)) {
          return res.status(400).json({ error: "docId is invalid integer" });
        }

        const find_status1 = await prisma.status.findUnique({
          where: { status: "อยู่ระหว่างการตรวจสอบขั้นสุดท้าย" }
        });

        if (!find_status1) {
          return res.status(500).json({ message: "Status not found" });
        }

        const user = await prisma.user.findUnique({
            where : { id : req.user.id },
            include: { department: true }
        });
     
        const find_des = await prisma.destination.findUnique({
            where : { des_name : user.department.department_name }
        });

        if (!find_des) {
            return res.status(403).json({ message: "User is not in destination department" });
        }

        const doc = await prisma.documentPetition.findUnique({
            where : { id:documentId },
            include : {
                department: true,
                destination: true,
                status: true,
                user: true
            }
        });
        console.log(doc);

        if (!doc || doc.destinationId !== find_des.id) {
          return res.status(404).json({ message: "Document not found in this destination department" });
        }

        if (doc.statusId !== find_status1.id){
          return res.status(404).json({ message: "Document not found or not in correct status" });
        }

        const setdoc = {
            id: doc.id,
            doc_id: doc.doc_id,
            department_name: doc.department.department_name,
            destination_name: doc.destination.des_name,
            user_email: doc.user.email,
            title: doc.title,
            authorize_to: doc.authorize_to,
            position: doc.position,
            affiliation: doc.affiliation,
            authorize_text: doc.authorize_text,
            status_name: doc.status.status,
            createdAt: doc.createdAt,
            date_of_signing: doc.date_of_signing
        };
        res.json({ message: "Document waiting to be accepted in department", setdoc });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});





//อัพเดตยืนการตรวจเอกสารรอบสุดท้าย
router.put('/update_st_audit_by_Spvaudit/:docId', async (req, res) => {
    try {
        const documentId = parseInt(req.params.docId, 10); 
        if (isNaN(documentId)) {
            return res.status(400).json({ error: "docId is invalid integer" });
        }
 
        const find_status1 = await prisma.status.findUnique({
            where: { status: "อยู่ระหว่างการตรวจสอบขั้นสุดท้าย" }
        });

        const find_status2 = await prisma.status.findUnique({
            where: { status: "ตรวจสอบขั้นสุดท้ายเสร็จสิ้น" }
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

        //อัพเดตสถานะ
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
              note_t:   "อัพเดตสถานะจาก 'อยู่ระหว่างการตรวจสอบขั้นสุดท้าย' เป็น 'ตรวจสอบขั้นสุดท้ายเสร็จสิ้น'"
            }
        });

        res.json({ message: "Document status updated to the first audit is already", updatedDoc});
        
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

    const documentId = parseInt(req.params.docId, 10); 
    if (isNaN(documentId)) {
      return res.status(400).json({ error: "docId is invalid integer" });
    }

    if (isNaN(new_destinationId)) {
      return res.status(400).json({ error: "new_destinationId must be integer" });
    }

    const find_status1 = await prisma.status.findUnique({
      where: { status: "รอรับเข้ากอง" }
    });

    const find_status2 = await prisma.status.findUnique({
      where: { status: "ส่งต่อไปยังกองอื่น" }
    });

    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    const user_dep = await prisma.department.findUnique({
      where: { id: user.departmentId }
    });

    const find_des = await prisma.destination.findUnique({
      where: { des_name: user_dep.department_name }
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

    const new_des = await prisma.destination.findUnique({
      where : { id : new_destinationId }
    });

    // เก็บ document status action log
    await prisma.documentStatusHistory.create({
        data: {
          document: { connect: { id: updatedDoc.id } },
          status:   { connect: { id: updatedDoc.statusId } },
          changedBy: { connect: { id: user.id } },
          note_t: `ส่งไปยังกอง ${new_des.des_name} รายละเอียดเพิ่มเติม: ${text_suggest || "-"}`
        }
    });

    res.json({ message: "Document has been forwarded to another department", updatedDoc });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }

});



//-------------------------ส่งเอกสาร กลับไปแก้ไขที่ role audit----------------------------//
router.put('/edit_BySpvAuditor/:docId', async (req, res) => {
    const {test_edit_suggesttion} = req.body;
    try {
        const documentId = parseInt(req.params.docId, 10); 
        if (isNaN(documentId)) {
            return res.status(400).json({ error: "docId is invalid integer" });
        }
 
        const find_status1 = await prisma.status.findUnique({
            where: { status: "อยู่ระหว่างการตรวจสอบขั้นสุดท้าย" }
        });

        const find_status2 = await prisma.status.findUnique({
            where: { status: "ส่งกลับให้แก้ไขจากการตรวจสอบขั้นสุดท้าย" }
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
        await prisma.documentStatusHistory.create({
            data: {
              document: { connect: { id: updatedDoc.id } },
              status:   { connect: { id: updatedDoc.statusId } },
              changedBy: { connect: { id: user.id } },
              note_t: `รายละเอียดเพิ่มเติมการแก้ไขเอกสาร: ${test_edit_suggesttion || "-"}`
            }
        });

        //ส่ง data ไปยังเมลด้วย
        //------------------------mail----------------//
        res.json({message: "Document status updated to audit to edit document", updatedDoc});
        
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});



router.get('/history_accept', async (req, res) => {
    try {
        const find_st = await prisma.status.findUnique({
            where : { status : "รับเข้ากองเรียบร้อย" }
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
            where: {
                statusId: find_st.id,
                document: {
                    destinationId: find_des.id
                }
            },
            include: {
                document: true,
                changedBy: true,
                status: true
            },
            orderBy: { changedAt: 'desc' } // เพิ่มเพื่อดูประวัติล่าสุดก่อน
        });

        
        const set_json = doc.map(h => ({
            docId: h.documentId,
            ChangeBy: h.changedBy.email || null,
            status: h.status.status || null,
            changeAt: h.changedAt,
            note: h.note_t,
            doc_title : h.document.title,
            doc_id_doc : h.document.id_doc
        }));


        res.json({
            message: "History in Destination of status : รับเข้ากองเรียบร้อย",
            data: set_json
        });
        
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});


router.get('/history_change_des', async (req, res) => {
    try {
        const find_st = await prisma.status.findUnique({
            where : { status : "ส่งต่อไปยังกองอื่น" }
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
            where: {
                statusId: find_st.id,
                changedBy: {
                  departmentId: user.departmentId 
                }
            },
            include: {
                document: {include : { destination : true }},
                changedBy: true,
                status: true
            },
            orderBy: { changedAt: 'desc' } // เพิ่มเพื่อดูประวัติล่าสุดก่อน
        });

        const f_doc = await prisma.documentStatusHistory.findMany({
          where: {
            statusId: find_st.id
          }
        });
        console.log(f_doc);

        
        const set_json = doc.map(h => ({
            docId: h.documentId,
            ChangeBy: h.changedBy.email || null,
            status: h.status.status || null,
            changeAt: h.changedAt,
            note: h.note_t,
            doc_title : h.document.title,
            doc_id_doc : h.document.id_doc,
            new_des : h.document.destination.des_name
        }));


        res.json({
            message: "History in Destination of status : ส่งต่อไปยังกองอื่น",
            data: set_json
        });
        
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});



router.get('/history_thelastAudit', async (req, res) => {
    try {
        const find_st = await prisma.status.findUnique({
            where : { status : "ตรวจสอบขั้นต้นเสร็จสิ้น" }
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
            where: {
                statusId: find_st.id,
                document: {
                    destinationId: find_des.id
                }
            },
            include: {
                document: true,
                changedBy: true,
                status: true
            },
            orderBy: { changedAt: 'desc' } // เพิ่มเพื่อดูประวัติล่าสุดก่อน
        });

        
        const set_json = doc.map(h => ({
            docId: h.documentId,
            ChangeBy: h.changedBy.email || null,
            status: h.status.status || null,
            changeAt: h.changedAt,
            note: h.note_t,
            doc_title : h.document.title,
            doc_id_doc : h.document.id_doc
        }));


        res.json({
            message: "History in Destination of status : ตรวจสอบขั้นต้นเสร็จสิ้น",
            data: set_json
        });
        
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});





export default router;

