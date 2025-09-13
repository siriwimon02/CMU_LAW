// Required External Modules
import dotenv from 'dotenv';
dotenv.config({ path: '../.env.dev' });

import express from 'express';
import prisma from '../prismaClient.js';
import { parse } from 'path';
import { userInfo } from 'os';

const router = express.Router();

//---------------------------------------------------new code -----------------------------------------------------//

//doc ที่รอรับเข้า + อยู่ระหว่างการตรวจสอบและอนุมัติโดยหัวหน้า หาเอกสารที่ ตรวจเสร็จจากเอกสารขั้นต้นแล้ว
router.get('/wait_to_accept_byHeadaudit', async (req, res) => {
    
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


        // เก็บ document status action log
        await Promise.all(
            document_audit_1st.map(doc =>
                prisma.documentActionsLog.create({
                    data: {
                    document: { connect: { id: doc.id } },
                    status:   { connect: { id: find_status2.id } }, 
                    changeBy: { connect: { id: user.id } },
                    note_t:   `เปลี่ยนสถานะจาก ${doc.statusId} เป็น ${find_status2.id}`
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
    res.json({ message : "find document waiting to accpet in department already", document_json})
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


//ดึง data มาทีละอัน
router.get('/document/:docId', async (req, res) => {
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


//อัพเดตสถานะ ตรวจสอบของหัวหน้างาน 
router.put('/update_st_audit_by_Headaudit/:docId', async (req, res) => {
    const text_suggesttion = req.body;
    try {
        const documentId = parseInt(req.params.docId, 10); 
        if (isNaN(documentId)) {
        return res.status(400).json({ error: "docId is invalid integer" });
        }
 
        const find_status1 = await prisma.status.findUnique({
        where: { status: "อยู่ระหว่างการตรวจสอบและอนุมัติโดยหัวหน้า" }
        });

        const find_status2 = await prisma.status.findUnique({
            where: { status: "ตรวจสอบและอนุมัติโดยหัวหน้าเสร็จสิ้น" }
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

        if (!doc || doc.destinationId !== find_des.id || doc.statusId !== find_status1.id) {
            return res.status(404).json({ message: "Document not found or not in correct status" });
        }

        const updatedDoc = await prisma.documentPetition.update({
            where: { id: documentId },
            data: { statusId: find_status2.id }
        });


        // เก็บ document status action log
        await prisma.documentActionsLog.create({
            data: {
            document: { connect: { id: updatedDoc.id } },
            status:   { connect: { id: updatedDoc.statusId } },
            changeBy: { connect: { id: user.id } },
            note_t:   `อัพเดตสถานะจาก 'อยู่ระหว่างการตรวจสอบและอนุมัติโดยหัวหน้า' เป็น 'ตรวจสอบและอนุมัติโดยหัวหน้าเสร็จสิ้น' รายละเอียดเพิ่มเติม: ${text_suggesttion || "-"}`
            }
        });


        res.json({ message: "Document status updated to the first audit is already", updatedDoc});
    
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});


//แก้ไขสถานะ กลับไปแก้ไขเอกสาร ส่งไปที่ผู้ใช้แก้ไข
router.put('/edit_ByAuditor/:docId', async (req, res) => {
    const text_suggesttion = req.body;
    try {
        const documentId = parseInt(req.params.docId, 10); 
        if (isNaN(documentId)) {
        return res.status(400).json({ error: "docId is invalid integer" });
        }
 
        const find_status1 = await prisma.status.findUnique({
        where: { status: "อยู่ระหว่างการตรวจสอบและอนุมัติโดยหัวหน้า" }
        });

        const find_status2 = await prisma.status.findUnique({
            where: { status: "ส่งกลับให้แก้ไขจากการตรวจสอบโดยหัวหน้า" }
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

        if (!doc || doc.destinationId !== find_des.id || doc.statusId !== find_status1.id) {
            return res.status(404).json({ message: "Document not found or not in correct status" });
        } else {
            const updatedDoc = await prisma.documentPetition.update({
                where: { id: documentId },
                data: { statusId: find_status2.id }
            });


            // เก็บ document status action log
            await prisma.documentActionsLog.create({
                data: {
                document: { connect: { id: updatedDoc.id } },
                status:   { connect: { id: updatedDoc.statusId } },
                changeBy: { connect: { id: user.id } },
                note_t:   `อัพเดตสถานะจาก 'อยู่ระหว่างการตรวจสอบและอนุมัติโดยหัวหน้า' เป็น 'ส่งกลับให้แก้ไขจากการตรวจสอบโดยหัวหน้า' รายละเอียดเพิ่มเติม: ${text_suggesttion || "-"}`
                }
            });



            //ส่ง data ไปยังเมลด้วย
            //------------------------mail----------------//
            res.json({message: "Document status updated to user to edit document", updatedDoc});
        }
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});







export default router;