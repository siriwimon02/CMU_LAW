// Required External Modules
import dotenv from 'dotenv';
dotenv.config({ path: '../.env.dev' });

import express from 'express';
import prisma from '../prismaClient.js';
import { parse } from 'path';
import { userInfo } from 'os';

const router = express.Router();

// router.get('/', async (req, res) => {
//     try {
//         console.log(req.user.id);
//         const user = await prisma.user.findUnique({
//             where:{ id : req.user.id }
//         });
//         console.log(user);

//         const findstatus1 = await prisma.status.findUnique({
//             where : { status: "ตรวจสอบขั้นต้นเสร็จสิ้น" }
//         });

//         const findstatus2 = await prisma.status.findUnique({
//             where : { status: "อยู่ระหว่างการตรวจสอบและอนุมัติโดยหัวหน้า" }
//         });

//         const find_doc = await prisma.documentPetition.findMany({
//             where : { 
//                 destinationId : user.departmentId,
//                 statusId : findstatus1.id 
//             }
//         });
//         console.log(find_doc);

//         if ( find_doc.length > 0 ) { 
//             await prisma.documentPetition.updateMany({
//                 where : {
//                     destinationId : user.departmentId,
//                     statusId : findstatus1.id
//                 }, data : {
//                     statusId : findstatus2.id
//                 }

//             });
//         }

//         const document_audit = await prisma.documentPetition.findMany({
//             where : {
//                 destinationId : user.departmentId,
//                 statusId : findstatus2.id
//             }
//         })

//         const document_json = [];
//         for(const doc of document_audit){
//             const dep = await prisma.department.findUnique({
//                 where:{
//                     id: doc.departmentId
//                 }
//             });

//             const des = await prisma.destination.findUnique({
//                 where:{
//                     id:doc.destinationId
//                 }
//             });

//             const stt = await prisma.status.findUnique({
//                 where:{
//                     id:doc.statusId
//                 }
//             });

//             const user_email = await prisma.user.findUnique({
//                 where:{
//                     id: doc.userId
//                 }
//             });
        
//             const setdoc = {
//                 id:doc.id,
//                 doc_id:doc.doc_id,
//                 department_name: dep.department_name,
//                 destination_name: des.des_name,
//                 user_email: user_email.email,
//                 title:doc.title,
//                 authorize_to: doc.authorize_to,
//                 position: doc.position,
//                 affiliation: doc.affiliation,
//                 authorize_text: doc.authorize_text,
//                 status_name: stt.status,
//                 createdAt: doc.createdAt,
//                 date_of_signing: doc.date_of_signing
//             };
//             document_json.push(setdoc);
//             // console.log(setdoc);
//         }
//         console.log(document_json);
//         res.json(document_json);
//     }catch (err){
//         console.error(err);
//         res.status(500).json({ message: "Server error" });
//     }
// });


// router.get('/history_st_to_audit_already', async (req, res) => {
//     try{
//         console.log(req.user.id);
//         const user = await prisma.user.findUnique({
//             where:{
//                 id : req.user.id
//             }
//         });
//         console.log(user);

//         const find_status1 = await prisma.status.findUnique({
//             where : { status : "ตรวจสอบและอนุมัติโดยหัวหน้าเสร็จสิ้น" }
//         })

//         const document_audit_already = await prisma.documentPetition.findMany({
//             where : {
//                 destinationId : user.departmentId,
//                 statusId : find_status1.id
//             }
//         });


//         const document_json = [];
//         for(const doc of document_audit_already){
//             const dep = await prisma.department.findUnique({
//                 where:{
//                     id: doc.departmentId
//                 }
//             });

//             const des = await prisma.destination.findUnique({
//                 where:{
//                     id:doc.destinationId
//                 }
//             });

//             const stt = await prisma.status.findUnique({
//                 where:{
//                     id:doc.statusId
//                 }
//             });

//             const user_email = await prisma.user.findUnique({
//                 where:{
//                     id: doc.userId
//                 }
//             });
        
//             const setdoc = {
//                 id:doc.id,
//                 doc_id:doc.doc_id,
//                 department_name: dep.department_name,
//                 destination_name: des.des_name,
//                 user_email: user_email.email,
//                 title:doc.title,
//                 authorize_to: doc.authorize_to,
//                 position: doc.position,
//                 affiliation: doc.affiliation,
//                 authorize_text: doc.authorize_text,
//                 status_name: stt.status,
//                 createdAt: doc.createdAt,
//                 date_of_signing: doc.date_of_signing
//             };
//             document_json.push(setdoc);
//             // console.log(setdoc);
//         }
//         console.log(document_json);
//         res.json(document_json);

//     } catch (error) {
//         console.error(err);
//         res.status(500).json({ message: "Server error" });
//     }
// });


// router.get('/:docId', async (req, res) => {
//     try {
//         const documentId = parseInt(req.params.docId);
//         const doc = await prisma.documentPetition.findUnique({
//             where : { id : documentId }
//         })

//         if (!doc){
//             res.status(404).json({message: "not found document"})
//         }

//         const user = await prisma.user.findUnique({
//             where : { id : req.user.id }
//         });
//         console.log(user);

//         if (user.department !== doc.destinationId){
//             return res.status(403).json({ message: "Access denied to this document." });
//         }

//          const dep = await prisma.department.findUnique({
//             where:{
//                 id: doc.departmentId
//             }
//         });

//         const des = await prisma.destination.findUnique({
//             where:{
//                 id:doc.destinationId
//             }
//         });

//         const stt = await prisma.status.findUnique({
//             where:{
//                 id:doc.statusId
//             }
//         });

//         const user_email = await prisma.user.findUnique({
//             where:{
//                 id: doc.userId
//             }
//         });
       
//         const setdoc = {
//             id:doc.id,
//             doc_id:doc.doc_id,
//             department_name: dep.department_name,
//             destination_name: des.des_name,
//             user_email: user_email.email,
//             title:doc.title,
//             authorize_to: doc.authorize_to,
//             position: doc.position,
//             affiliation: doc.affiliation,
//             authorize_text: doc.authorize_text,
//             status_name: stt.status,
//             createdAt: doc.createdAt,
//             date_of_signing: doc.date_of_signing
//         };
        
//         res.json( {message : "get doccument", setdoc});

//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ message: "Server error" });
//     } 
// });

// router.put('/update_st_audit_by_headaudit/:docId', async (req, res) => {
//     try {
//         const documentId = parseInt(req.params.docId);
//         const user = await prisma.user.findUnique({
//             where : { id : req.user.id }
//         });
//         const document = await prisma.documentPetition.findUnique({
//             where : { id : documentId }
//         });

//         if (!document) {
//             return res.status(404).json({ message: "Document not found" });
//         }

//         //ต้องเป็นกองที่รับผิดชอบเอกสารนี้เท่านั้น
//         if (user.departmentId !== document.destinationId) {
//             return res.status(403).json({ message: "Forbidden: document does not belong to your department" });
//         }

//         const findstatus = await prisma.status.findUnique({
//             where :{ status: "อยู่ระหว่างการตรวจสอบและอนุมัติโดยหัวหน้า" }
//         });
//         console.log(findstatus);

//         if ( document.statusId !== findstatus.id){
//             return res.status(409).json({ message: "Conflict: document is not waiting for receive" });
//         }

//         const audit_already_st = await prisma.status.findUnique({
//             where : { status : "ตรวจสอบและอนุมัติโดยหัวหน้าเสร็จสิ้น" }
//         })

//         const updated = await prisma.documentPetition.update({
//             where : { id : documentId },
//             data : {
//                 statusId : audit_already_st.id
//             }
//         })
//         res.json({ message: "Document updated status successfully", updated });

//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ message: "Server error" });
//     }
// });


// //----------------------------------------------edit status--------------------------------------------//
// router.put('/update_edit_status/:docId', async (req, res) => {
//     try {
//         const { text_suggestion } = req.body;
//         const documentId = parseInt(req.params.docId);

//         const user = await prisma.user.findUnique({
//             where : { id : req.user.id }
//         });

//         const document = await prisma.documentPetition.findUnique({
//             where : { id : documentId }
//         });

//         if (!document) {
//             return res.status(404).json({ message: "Document not found" });
//         }

//         //ต้องเป็นกองที่รับผิดชอบเอกสารนี้เท่านั้น
//         if (user.departmentId !== document.destinationId) {
//             return res.status(403).json({ message: "Forbidden: document does not belong to your department" });
//         }

//         const findstatus = await prisma.status.findUnique({
//             where :{ status: "อยู่ระหว่างการตรวจสอบและอนุมัติโดยหัวหน้า" }
//         });
//         console.log(findstatus);

//         if ( document.statusId !== findstatus.id){
//             return res.status(409).json({ message: "Conflict: document is not waiting for receive" });
//         }

//         const audit_already_st = await prisma.status.findUnique({
//             where : { status : "ส่งกลับให้แก้ไขจากการตรวจสอบโดยหัวหน้า" }
//         })

//         const updated = await prisma.documentPetition.update({
//             where : { id : documentId },
//             data : {
//                 statusId : audit_already_st.id
//             }
//         })
//         res.json({ message: "Document updated status successfully", updated });

//         //update สำเร็จจ ให้ส่งแจ้งตื่น email ไปหา user ว่าแก้ไขเอกสาร ไฟล์นี้ เรื่องนี้ แผนกอะไร บลาๆ

//     } catch (err) {
//         console.error(err);
//         res.status(500).json({ message: "Server error" });
//     }
// });


//---------------------------------------------------new code -----------------------------------------------------//

//doc ที่รอรับเข้า + อยู่ระหว่างการตรวจสอบและอนุมัติโดยหัวหน้า หาเอกสารที่ ตรวจเสร็จจากเอกสารขั้นต้นแล้ว
router.get('/wait_to_accept', async (req, res) => {
    
  try {
    const find_status1 = await prisma.status.findUnique({
      where : { status : "ตรวจสอบขั้นต้นเสร็จสิ้น" }
    });

    const find_status2 = await prisma.status.findUnique({
      where : { status : "อยู่ระหว่างการตรวจสอบและอนุมัติโดยหัวหน้า" }
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
      res.status(401).json( {message : "user not live in destination department"} )
    }

    //หา document ที่มาจากกองอื่นเพื่ออัพเดตสถานะ
    const document_audit_1st = await prisma.documentPetition.findMany({
      where : {
        destinationId : find_des.id,
        statusId : find_status1.id 
      }
    });
    console.log(document_audit_1st);

    if (document_audit_1st.length > 0){
      await prisma.documentPetition.updateMany({
        where : {
          destinationId : find_des.id,
          statusId : find_status1.id 
        }, data : {
          statusId : find_status2.id
        }
      })
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
    res.json({ message : "find document waiting to accpet in department already", document_json})
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


//ดึง data มาทีละอัน
router.get('/:docId', async (req, res) => {
    try {
        const documentId = parseInt(req.params.docId, 10); 
        if (isNaN(documentId)) {
        return res.status(400).json({ error: "docId is invalid integer" });
        }

        const find_status1 = await prisma.status.findUnique({
        where: { status: "อยู่ระหว่างการตรวจสอบและอนุมัติโดยหัวหน้า" }
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

        if (!doc || doc.destinationId !== find_des.id || doc.statusId !== find_status1.id) {
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








export default router;