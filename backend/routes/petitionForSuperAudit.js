// Required External Modules
import dotenv from 'dotenv';
dotenv.config({ path: '../.env.dev' });

import express from 'express';
import prisma from '../prismaClient.js';
import { parse } from 'path';

const router = express.Router();

router.get('/waittoaccept', async (req, res) => {
    console.log(req.user.id);
    
    const user = await prisma.user.findUnique({
        where:{
            id : req.user.id
        }
    });
    // console.log(user);

    const findstatus1 = await prisma.status.findUnique({
      where:{
        status: "รอรับเข้ากอง"
      }
    });

    const findstatus2 = await prisma.status.findUnique({
      where:{
        status: "ส่งไปที่กองอื่น"
      }
    });

    //update status of doc have status is "ส่งเอกสารไปกองอื่น"
    const doc_changestatus = await prisma.documentPetition.findMany({
        where:{
            destinationId : user.departmentId,
            statusId : findstatus2.id
        }
    })
    console.log("เอกสารที่ส่งมาจากกองอื่นเข้ากองเรา")
    console.log(doc_changestatus);

    if (doc_changestatus.length > 0) {
      await prisma.documentPetition.updateMany({
        where: {
          destinationId: user.departmentId,
          statusId: findstatus2.id
        },
        data: {
          statusId: findstatus1.id
        }
      });
    }
    
    //หาเอกสารที่ส่งเข้ามาในกองนี้
    const document_audit = await prisma.documentPetition.findMany({
        where:{
            destinationId : user.departmentId,
            statusId : findstatus1.id
        }
    })
    console.log("doc for super Audit");
    console.log(document_audit);

    // res.json(document_audit);

    const document_json = [];
    for(const doc of document_audit){
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
    res.json(document_json);
});



router.get('/history_document_accept_already', async (req, res) => {
    console.log(req.user.id);
    
    const user = await prisma.user.findUnique({
        where:{
            id : req.user.id
        }
    });
    // console.log(user);

    const findstatus = await prisma.status.findUnique({
      where:{
        status: "รับเข้ากองเรียบร้อยแล้ว"
      }
    });
    // console.log(findstatus);
    
    //หาเอกสารที่ส่งเข้ามาในกองนี้
    const document_audit = await prisma.documentPetition.findMany({
        where:{
            destinationId : user.departmentId,
            statusId : findstatus.id
        }
    })
    // console.log("doc for super Audit");
    // console.log(document_audit);

    const document_json = [];
    for(const doc of document_audit){
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
    console.log(document_json);
    res.json(document_json);
});




router.put('/accepttoaccess/:doc_id', async (req, res) => {
  try {
    const documentId = parseInt(req.params.doc_id);

    const user = await prisma.user.findUnique({
      where: { id: req.user.id }
    });

    const document = await prisma.documentPetition.findUnique({
      where: { id: documentId }
    });

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    //ต้องเป็นกองที่รับผิดชอบเอกสารนี้เท่านั้น
    if (user.departmentId !== document.destinationId) {
      return res.status(403).json({ message: "Forbidden: document does not belong to your department" });
    }

    const findstatus = await prisma.status.findUnique({
      where:{
        status: "รอรับเข้ากอง"
      }
    });
    console.log(findstatus);

    //ต้องเป็นสถานะ "รอรับเข้ากอง" เท่านั้น (statusId = 1)
    if ( document.statusId !== findstatus.id ) {
      return res.status(409).json({ message: "Conflict: document is not waiting for receive" });
    }

    const accept_to_dp = await prisma.status.findUnique({
      where:{
        status: "รับเข้ากองเรียบร้อยแล้ว"
      }
    });
    const updated = await prisma.documentPetition.update({
      where: { id: documentId },
      data: {
        statusId: accept_to_dp.id // เปลี่ยนสถานะเป็น "รับเข้ากองแล้ว"
      }
    });
    res.json({ message: "Document accepted successfully", updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});



router.put('/change_des_doc/:docId', async (req, res) =>{
  try{
    const documentId = parseInt(req.params.docId); // ดึงค่า docId จาก URL
    const { newDestinationId } = req.body; // ดึงค่าที่ส่งมาจาก frontend

    const user = await prisma.user.findUnique({
      where : { id : req.user.id }
    });

    const document = await prisma.documentPetition.findUnique({
      where : { id : documentId }
    });

    if (!document) {
      return res.status(404).json({ message: "Document not found" });
    }

    //ต้องเป็นกองที่รับผิดชอบเอกสารนี้เท่านั้น
    if (user.departmentId !== document.destinationId) {
      return res.status(403).json({ message: "Forbidden: document does not belong to your department" });
    }

    const findstatus = await prisma.status.findUnique({
      where:{ status: "รอรับเข้ากอง" }
    });
    // console.log(findstatus);

    //ต้องเป็นสถานะ "รอรับเข้ากอง" เท่านั้น (statusId = 1)
    if ( document.statusId !== findstatus.id ) {
      return res.status(409).json({ message: "Conflict: document is not waiting for receive" });
    }

    const updated_st = await prisma.status.findUnique({
      where : { status : "ส่งไปที่กองอื่น" } 
    })

    const change_des_doc = await prisma.documentPetition.update({
      where : { id:documentId },
      data : {
        destinationId: newDestinationId,
        statusId: updated_st.id
      }
    });

    res.json({message: "Document change destination Already finished", change_des_doc})
  } catch (err){
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});






export default router;

