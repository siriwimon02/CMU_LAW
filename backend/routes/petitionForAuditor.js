// Required External Modules
import dotenv from 'dotenv';
dotenv.config({ path: '../.env.dev' });

import express from 'express';
import fs from 'node:fs';
import * as fsp from 'node:fs/promises';
import path from 'node:path';
import util from 'node:util';
import { spawn } from 'node:child_process';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import multer from 'multer';
import prisma from '../prismaClient.js'; // ถ้าใช้ดึง DB


// libreoffice-convert เป็น CJS → ต้อง require ผ่าน createRequire เมื่อใช้ ESM
import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const libre = require('libreoffice-convert');

import wordcut from 'wordcut';
import e from 'express';
wordcut.init(); // โหลดดิกเริ่มต้น


const router = express.Router();



//------------------------------------doc ที่รอตรวจสอบขั้นตอน + อัพเดตสถานะให้ตรวจสอบขั้นต้น--------------------------//
router.get('/wait_to_audit_byAudit', async (req, res) => {
    try {
        const findstatus1 = await prisma.status.findUnique({
            where : { status: "รับเรื่องแล้ว" }
        });

        const findstatus2 = await prisma.status.findUnique({
            where : { status: "อยู่ระหว่างตรวจสอบโดยเจ้าหน้าที่" }
        });

        const findstatus3 = await prisma.status.findUnique({
            where : { status : "แก้ไขเอกสารเรียบร้อยแล้ว"}
        })

        const findstatus4 = await prisma.status.findUnique({
            where : { status : "ส่งคืนแก้ไขเอกสารโดยหัวหน้างาน"}
        })

        const findstatus5 = await prisma.status.findUnique({
            where : { status : "ส่งคืนแก้ไขเอกสารโดยผู้อำนวยการ"}
        })

        const findstatus6 = await prisma.status.findUnique({
            where : { status : "เจ้าหน้าที่แก้ไขเอกสารแล้ว"}
        })


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


        const document_audit_1st = await prisma.documentPetition.findMany({
            where : {
                destinationId : find_des.id,
                statusId : {
                    in : [findstatus1.id, findstatus6.id]
                },
                auditIdBy : user.id
            }, include: { status: true }
        });
        console.log("doc audit_1st", document_audit_1st);



        if ( document_audit_1st.length > 0 ){
            await prisma.documentPetition.updateMany({
                where : {
                    destinationId : find_des.id,
                    statusId : {
                        in : [findstatus1.id, findstatus6.id]
                    }
                }, data : {
                    statusId : findstatus2.id
                }
            });

                    
            // เก็บ document status action log
            await Promise.all(
                document_audit_1st.map(doc =>
                    prisma.documentStatusHistory.create({
                        data: {
                        document: { connect: { id: doc.id } },
                        status:   { connect: { id: findstatus2.id } }, 
                        changedBy: { connect: { id: user.id } },
                        note_text: "เอกสารที่รอตรวจสอบ โดยพนักงานตรวจสอบ"
                        }
                    })
                )
            );
            //console.log("อัพเดตสถานะของผู้ตรวจสอบ", update_st)
        }

        const document_audit_2st = await prisma.documentPetition.findMany({
            where : {
                destinationId : find_des.id,
                statusId : { in : [findstatus2.id, findstatus3.id, findstatus4.id, findstatus5.id] },
                auditIdBy : user.id 
            }, include : {
                department : true,
                destination : true,
                user : true,
                headauditBy : true,
                status: true,
            }, orderBy: { createdAt : 'desc' }
        })
        console.log("22222222222",document_audit_2st);

        const document_json = [];
        for(const doc of document_audit_2st){

          //หารายละเอียดเพิ่มเติมตอนแก้ไข 
          if (doc.statusId === findstatus4.id || doc.statusId === findstatus5.id) {
            //หาประวัติเอกสารอันล่าสุด แล้วเช็คสถานะว้าใช้ ส่งกลับมาใหม่
            const latestHistory = await prisma.documentStatusHistory.findFirst({
                where: { documentId: doc.id },
                orderBy: { changedAt: 'desc' },     // ล่าสุดสุด
                include: { 
                  status: true
                },          // ดึงชื่อสถานะมาด้วย
            });
            
            if (latestHistory.statusId === findstatus4.id || latestHistory.statusId === findstatus5.id){
              const setdoc = {
                  id:doc.id,
                  doc_id : doc.id_doc,
                  department_name: doc.department.department_name,
                  destination_name: doc.destination.des_name,
                  owneremail : `${doc.user.firstname} ${doc.user.lastname} ( ${doc.user.email} )`,
                  headauditBy: String(doc.headauditIdBy ?? doc.headauditBy?.id ?? '') || 'ยังไม่ระบุ',
                  headauditByemail :   doc?.headauditBy
                    ? `${doc.headauditBy.firstname ?? ""} ${doc.headauditBy.lastname ?? ""}`.trim() +
                      (doc.headauditBy.email ? ` (${doc.headauditBy.email})` : "")
                    : "-",
                  title:doc.title,
                  authorize_to: doc.authorize_to,
                  position: doc.position,
                  affiliation: doc.affiliation,
                  authorize_text: doc.authorize_text,
                  status_name: doc.status.status,
                  createdAt: doc.createdAt,
                  note : latestHistory.note_text
              }
              document_json.push(setdoc);
            }
          }else {
            const setdoc = {
                id:doc.id,
                doc_id : doc.id_doc,
                department_name: doc.department.department_name,
                destination_name: doc.destination.des_name,
                owneremail : `${doc.user.firstname} ${doc.user.lastname} ( ${doc.user.email} )`,
                headauditBy: String(doc.headauditIdBy ?? doc.headauditBy?.id ?? '') || 'ยังไม่ระบุ',
                                  headauditByemail :   doc?.headauditBy
                    ? `${doc.headauditBy.firstname ?? ""} ${doc.headauditBy.lastname ?? ""}`.trim() +
                      (doc.headauditBy.email ? ` (${doc.headauditBy.email})` : "")
                    : "-",
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
        }
        console.log(document_json);
        res.json({ message : "find document waiting to the first audit", document_json})
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});















//--------------------------------------------อัพเดตยืนการตรวจเอกสารขั้นต้น----------------------------------//
router.put('/update_st_audit_by_audit/:docId', async (req, res) => {
    const {set_headauditId} = req.body;

    if (!set_headauditId || isNaN(set_headauditId)) {
        return res.status(400).json({ error: "HeadAuditor ID is required and must be a valid number" });
    }

    const headUser = await prisma.user.findUnique({ 
      where: { id: set_headauditId },
      include : { department : true }
    });

    if (!headUser) {
        return res.status(404).json({ message: "Head auditor not found" });
    }

    const find_des1 = await prisma.destination.findUnique({
      where: { des_name: headUser.department.department_name }
    });
    if (!find_des1) {
      return res.status(403).json({ message: "User is not in destination department" });
    }

    const documentId = parseInt(req.params.docId, 10); 
    if (isNaN(documentId)) {
        return res.status(400).json({ error: "docId is invalid integer" });
    }

    try { 
        const find_status1 = await prisma.status.findUnique({
        where: { status: "อยู่ระหว่างตรวจสอบโดยเจ้าหน้าที่" }
        });

        const findstatus3 = await prisma.status.findUnique({
            where : { status : "แก้ไขเอกสารเรียบร้อยแล้ว"}
        })

        const find_status2 = await prisma.status.findUnique({
            where: { status: "เจ้าหน้าที่ตรวจสอบแล้ว" }
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

        if (doc.destinationId !== find_des.id) {
            return res.status(404).json({ message: "Document not found in this destination department" });
        }

        if (doc.destinationId !== find_des1.id) {
          return res.status(404).json({ message: "Document not found auditor in this destination department" });
        }

        const allowedStatuses = [find_status1.id, findstatus3.id];

        if (!allowedStatuses.includes(doc.statusId)) {
          return res.status(403).json({
            message: "Document is not in the correct status for this action",
          });
        }

        if (doc.auditIdBy !== user.id) {
            return res.status(403).json({ message: "You do not have permission to access this document" });
        }

        //ต้องเป็นหัวหน้าคนเดิมที่ส่งไป
        if (doc.headauditIdBy != null && doc.headauditIdBy !== headUser.id) {
          return res.status(403).json({ message: 'Only the assigned head auditor can perform this action.' });
        }

        //อัพเดตสถานนะแก้ไข + เพิ่มรายชื่อหัวหน้าพนักงานที่ต้องตรวจสอบเอกสารนี้
        const updatedDoc = await prisma.documentPetition.update({
            where: { id: documentId },
            data: { 
                status: { connect: { id: find_status2.id } },
                headauditBy : { connect : { id : headUser.id } }
            }
        });

        // เก็บ document status action log
        await prisma.documentStatusHistory.create({
            data: {
            document: { connect: { id: updatedDoc.id } },
            status:   { connect: { id: updatedDoc.statusId } },
            changedBy: { connect: { id: user.id } },
            note_text:  "ตรวจสอบเอกสารเรียบร้อยแล้ว โดยเจ้าหน้าที่ตรวจสอบ"
            }
        });

        res.json({ message: "Document status updated to the first audit is already", updatedDoc});
    
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});

















//-----------------------------------------แก้ไขสถานะ กลับไปแก้ไขเอกสาร ส่งไปที่ผู้ใช้แก้ไข------------------------------//
router.put('/edit_ByAuditor/:docId', async (req, res) => {
    const {text_edit_suggesttion} = req.body;
    try {
        const documentId = parseInt(req.params.docId, 10); 
        if (isNaN(documentId)) {
          return res.status(400).json({ error: "docId is invalid integer" });
        }
 
        const find_status1 = await prisma.status.findUnique({
            where: { status: "อยู่ระหว่างตรวจสอบโดยเจ้าหน้าที่" }
        });

        const findstatus3 = await prisma.status.findUnique({
            where : { status : "แก้ไขเอกสารเรียบร้อยแล้ว"}
        })

        const find_status2 = await prisma.status.findUnique({
            where: { status: "ส่งคืนแก้ไขเอกสาร" }
        });

        const findstatus4 = await prisma.status.findUnique({
            where : { status : "ส่งคืนแก้ไขเอกสารโดยหัวหน้างาน"}
        })

        const findstatus5 = await prisma.status.findUnique({
            where : { status : "ส่งคืนแก้ไขเอกสารโดยผู้อำนวยการ"}
        })
        
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

        if (doc.destinationId !== find_des.id) {
            return res.status(404).json({ message: "Document not found in this destination department" });
        }

        const allowedStatuses = [
          find_status1.id,
          findstatus3.id,
          findstatus4.id,
          findstatus5.id,
          find_status2.id
        ];

        if (!allowedStatuses.includes(doc.statusId)) {
          return res.status(403).json({message: "Document is not in the correct status for this action",});
        }

        if (doc.auditIdBy !== user.id) {
            return res.status(403).json({ message: "You do not have permission to access this document" });
        }


        //หาประวัติเอกสารอันล่าสุด แล้วเช็คสถานะว้าใช้ ส่งกลับมาใหม่
        const latestHistory = await prisma.documentStatusHistory.findFirst({
          where: { 
            documentId: doc.id
          },
          orderBy: {
            changedAt: "desc"  // ใช้เวลาจาก statusHistory
          },
          include: {
            status: true
          }
        });
        console.log(latestHistory)

        //อัพเดต status 
        const updatedDoc = await prisma.documentPetition.update({
            where: { id: documentId },
            data: { statusId: find_status2.id }
        });    

        // เก็บ document status action log
        const his_st = await prisma.documentStatusHistory.create({
          data: {
            document: { connect: { id: doc.id } },
            status:   { connect: { id: find_status2.id} },
            changedBy: { connect: { id: user.id } },
            note_text:   `รายละเอียดเพิ่มเติมการแก้ไขเอกสาร : ${text_edit_suggesttion || "-"}`
          }
        });      
        
        const update_finish = await prisma.documentPetition.findUnique({
            where : { id : documentId }
        });


        // เช็คว่ามีประวัติส่งกลับมาแก้ไขล่าสุดมั้ย
        if (latestHistory.statusId === findstatus4.id || latestHistory === findstatus5.id) {
          // อัปเดตของเก่า → เปลี่ยน his_statusId ให้เป็นของรอบนี้แทน
          const history_edit = await prisma.documentPetitionHistory.updateMany({
            where: { his_statusId: latestHistory.id },
            data: {
              his_statusId: his_st.id,
              note_text: `รายละเอียดเอกสารที่ต้องแก้ไข : ${text_edit_suggesttion}`
            }
          });
          console.log("Updated old history to new status:", history_edit);
        } else {
          // ถ้าไม่เคยมี → ค่อยสร้างใหม่
          const history_edit = await prisma.documentPetitionHistory.create({
              data: {
                  document: { connect : { id : update_finish.id } },
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
        }

        //ส่ง data ไปยังเมลด้วย
        //------------------------mail----------------//
        res.json({message: "Document status updated to user to edit document", updatedDoc});
    
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});




















const data = multer();
//----------------การเพิ่มเอกสารได้ แก้ไขเอกสารได้ ของuser โดยพนักงาน คือพนง สามารถเข้าไปแก้ไขเอกสารได้ แก้ไขคำผิด-------------//
router.put('/update_document_ByAuditor/:docId', data.none() ,async (req, res) => {
    const documentId = parseInt(req.params.docId, 10);         
    if (isNaN(documentId)) {
        return res.status(400).json({ error: "docId is invalid integer" });
    }
    try {
        const { title, authorizeTo, position, affiliation, authorizeText} = req.body;

        const find_status1 = await prisma.status.findUnique({
            where: { status: "อยู่ระหว่างตรวจสอบโดยเจ้าหน้าที่" }
        });

        const findstatus3 = await prisma.status.findUnique({
            where : { status : "แก้ไขเอกสารเรียบร้อยแล้ว"}
        })

        const findstatus4 = await prisma.status.findUnique({
            where : { status : "ส่งคืนแก้ไขเอกสารโดยหัวหน้างาน"}
        })

        const findstatus5 = await prisma.status.findUnique({
            where : { status : "ส่งคืนแก้ไขเอกสารโดยผู้อำนวยการ"}
        })

        const find_status2 = await prisma.status.findUnique({
            where : { status : "เจ้าหน้าที่แก้ไขเอกสารแล้ว" }
        });

        let isUpdated = false;

        //หา กองที่ User อยู่
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

        //check doc สิทธิ์ในกาเข้าถึง User
        const doc = await prisma.documentPetition.findUnique({
            where: { id: documentId },
            include : { documentNeeds: { include: { requiredDocument: true } } }
        });

        if (doc.destinationId !== find_des.id) {
            return res.status(404).json({ message: "Document not found in this destination department" });
        }

        const allowedStatuses = [
          find_status1.id,
          findstatus3.id,
          findstatus4.id,
          findstatus5.id,
        ];

        if (!allowedStatuses.includes(doc.statusId)) {
          return res.status(403).json({message: "Document is not in the correct status for this action",});
        }

        if (doc.auditIdBy !== user.id) {
            return res.status(403).json({ message: "You do not have permission to access this document" });
        }

        //ถ้าเอกสารไม่มี การแก้ไขจะไม่อัพเดตข้อมูล
        if (
            doc.title !== title ||
            doc.authorize_to !== authorizeTo ||
            doc.position !== position ||
            doc.affiliation !== affiliation ||
            doc.authorize_text !== authorizeText
        ) {            
          
          //หาประวัติเอกสารอันล่าสุด แล้วเช็คสถานะว้าใช้ ส่งกลับมาใหม่
            const latestHistory = await prisma.documentStatusHistory.findFirst({
                where: { 
                    documentId: doc.id
                },
                orderBy: {
                    changedAt: "desc"  // ใช้เวลาจาก statusHistory
                },
                include: {
                    status: true
                }
            });
            console.log(latestHistory)

            const updatedDoc = await prisma.documentPetition.update({
                where: { id: documentId },
                data: {
                    title,
                    authorize_to: authorizeTo,
                    position,
                    affiliation,
                    authorize_text: authorizeText,
                    statusId : find_status2.id
                }
            });

            const his_st = await prisma.documentStatusHistory.create({
                data : {
                    document : { connect : { id : documentId } },
                    status : { connect : { id : find_status2.id } },
                    changedBy : { connect : { id : user.id } },
                    note_text : "เจ้าหน้าที่ ได้แก้ไขเอกสารนี้เพิ่มเติม"
                }
            });
            
            // เช็คว่ามีประวัติส่งกลับมาแก้ไขล่าสุดมั้ย
            if (latestHistory.statusId === findstatus4.id || latestHistory === findstatus5.id) {
              // อัปเดตของเก่า → เปลี่ยน his_statusId ให้เป็นของรอบนี้แทน
              const history_edit = await prisma.documentPetitionHistory.updateMany({
                where: { his_statusId: latestHistory.id },
                data: {
                  his_statusId: his_st.id,
                  editById : user.id
                }
              });
              console.log("Updated old history to new status:", history_edit);
            }else {
              //เก็บเอกสารเก่า
              //เอกสารที่พึ่งส่งกลับมายังไม่มีการเก็บประวัติใหม่ แก้ไขจาก user เสร็จ
              //เอกสารที่ ยุระหว่างตรวจสอบแล้วอยากแก้ไข
              const doc_edit = await prisma.documentPetitionHistory.create({
                  data: {
                      document: { connect : { id : doc.id } } ,
                      title : doc.title,
                      authorize_to: doc.authorize_to,
                      position : doc.position,
                      affiliation : doc.affiliation,
                      authorize_text : doc.authorize_text,
                      editedBy : { connect : { id : user.id } },
                      statusHistory : { connect : { id : his_st.id } },
                      note_text: "เจ้าหน้าที่ได้แก้ไขเอกสาร"
                  }
              });
              console.log("set doc history", doc_edit)
            }
            isUpdated = true;
            console.log("history status", his_st)
            console.log("updated document", updatedDoc)
        }
        res.status(201).json({message: "Document saved", success: true });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});






//-------------------------------------------------ดู รายชื่อหัวหน้า--------------------------------------//
router.get('/api/headauditor' ,async (req, res) => {
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
      where : { role_name : "head_auditor" }
    });

    const find_auditor = await prisma.user.findMany({
      where : {
        rId : find_role.id,
        departmentId : user.departmentId
      }
    });

    res.json({ message : "Get Head Auditor Already", find_auditor })
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});























//--------------------------------------ดูเอกสารที่ผ่านการตรวจสอบเรียบร้อยแล้ว--------------------------------------------//
router.get('/get_document_audited', async (req, res) => {

    try {
        const find_st1 = await prisma.status.findUnique({
            where : { status : "ผู้อำนวยการตรวจสอบแล้ว" }
        });

        const find_st2 = await prisma.status.findUnique({
            where : { status : "รอการพิจารณาอนุมัติจากอธิการบดี" }
        });

        const find_type = await prisma.attachmentType.findFirst({
          where : { type_name : "GenerateDocument" }
        });


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

        const document_audit_1st = await prisma.documentPetition.findMany({
            where : {
                statusId : find_st1.id,
                destinationId : find_des.id,
                auditIdBy : user.id
            }, include: { status: true }
        });
        console.log("doc audit_1st", document_audit_1st);

        if ( document_audit_1st.length > 0 ){
            const update_st = await prisma.documentPetition.updateMany({
                where : {
                    destinationId : find_des.id,
                    statusId : find_st1.id
                }, data : {
                    statusId : find_st2.id
                }
            });

            // เก็บ document status action log
            await Promise.all(
                document_audit_1st.map(doc =>
                    prisma.documentStatusHistory.create({
                        data: {
                        document: { connect: { id: doc.id } },
                        status:   { connect: { id: find_st2.id } }, 
                        changedBy: { connect: { id: user.id } },
                        note_text: "เอกสารคำร้อง รอการพิจารณาจากอธิการบดี"
                        }
                    })
                )
            );
            console.log("อัพเดตสถานะของผู้ตรวจสอบ", update_st)
        }

        const document_audit_2st = await prisma.documentPetition.findMany({
            where : {
                destinationId : find_des.id,
                statusId : find_st2.id,
            }, include : {
                department : true,
                destination : true,
                status: true,
                user: true,
                auditBy : true,
                headauditBy : true,
                attachments: { include : { attachmentType : true } },
                documentNeeds: { include: { requiredDocument : true }}
            }
        })
        console.log(document_audit_2st);

        const document_json = [];

        for (const doc of document_audit_2st) {
          // จัดกลุ่ม attachments ตามชนิด
          const attachmentsByType = doc.attachments.reduce((acc, att) => {
            const typeKey = att.attachmentType?.type_name ?? `type:${att.attachmentTypeId ?? 'unknown'}`;

            if (!acc[typeKey]) acc[typeKey] = [];
            acc[typeKey].push({
              id: att.id,
              file_name: att.file_name,
              file_path: att.file_path,
              uploaded_at: att.time_upload,
              // ใส่เพิ่มได้ตามต้องการ
            });

            return acc;
          }, {});

          const setdoc = {
            id: doc.id,
            doc_id: doc.id_doc,
            department_name: doc.department.department_name,
            destination_name: doc.destination.des_name,
            owneremail: doc.user.email,
            title: doc.title,
            authorize_to: doc.authorize_to,
            position: doc.position,
            affiliation: doc.affiliation,
            authorize_text: doc.authorize_text,
            status_name: doc.status.status,
            auditBy: doc.auditBy?.email ?? null,
            headauditBy: doc.headauditBy?.email ?? null,
            createdAt: doc.createdAt,
            documentNeed: doc.documentNeeds,
            // อันเดิมที่รวมทุก type ไว้ก็ยังเก็บได้เผื่อใช้
            document_attachments: doc.attachments,
            // อันใหม่: แยกตามประเภท
            attachmentsByType,  // <- ใช้งานฝั่ง frontend ได้ง่าย
          };

          document_json.push(setdoc);
        }

        // console.log(document_json);
        res.json({ message : "find document waiting to the first audit", document_json})

    } catch (err){
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});















const storageDynamic = multer.diskStorage({
  destination: (req, file, cb) => {
    if (file.fieldname === "attachments") {
      cb(null, "uploads/auditor_upload");
    } else if (file.fieldname === "endorsorfile") {
      cb(null, "uploads/signed_document");
    } else {
      cb(new Error("Invalid field name for upload"));
    }
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  }
});

const uploadBoth = multer({ storage: storageDynamic }).fields([
  { name: "attachments", maxCount: 5 },
  { name: "endorsorfile", maxCount: 5 }
]);


//----------------------------------ตอนเพิ่มเอกสารที่ อธิการบดี ได้ทำการอนุมัติเรียบร้อยแล้ว------------------------------//
router.put("/upload_endorser_document/:docId", uploadBoth, async (req, res) => {
    const { decision, date_of_signing} = req.body; // 'approve' หรือ 'reject'
    const documentId = parseInt(req.params.docId, 10);

    if (isNaN(documentId)) {
      return res.status(400).json({ error: "docId is invalid integer" });
    }

    try {
      const find_status1 = await prisma.status.findUnique({
        where: { status: "รอการพิจารณาอนุมัติจากอธิการบดี" },
      });

      const find_status2 = await prisma.status.findUnique({
        where: { status: "อธิการบดีอนุมัติแล้ว" },
      });

      const find_status3 = await prisma.status.findUnique({
        where: { status: "อธิการบดีปฏิเสธคำร้อง" },
      });

      // step: กำหนดสถานะใหม่หลังจาก upload
      const find_status4 = await prisma.status.findUnique({
        where: { status: "เจ้าหน้าที่อัปโหลดเอกสารเพิ่มเติมแล้ว" }
      });



      const user = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: { department: true },
      });
      const find_des = await prisma.destination.findUnique({
        where: { des_name: user.department.department_name },
      });
      if (!find_des) {
        return res
          .status(403)
          .json({ message: "User is not in this destination department" });
      }



      const doc = await prisma.documentPetition.findUnique({
        where: { id: documentId },
      });

      if (doc.destinationId !== find_des.id) {
        return res
          .status(404)
          .json({ message: "Document not found in this destination department" });
      }

      if (doc.statusId !== find_status1.id) {
        return res
          .status(403)
          .json({ message: "Document not in correct status for this action" });
      }

      if (doc.auditIdBy !== user.id) {
        return res.status(403).json({ message: "You do not have permission to access this document" });
      }


      // ---------------------- APPROVE ----------------------
      if (decision === "approve") {
        const {order_number} = req.body;
        const uploadPresidentCard = req.body.uploadPresidentCard === "true";
        const uploadUniversityHouse = req.body.uploadUniversityHouse === "true";

        console.log("body:", req.body);
        console.log("files:", req.files);

        if  ((req.files.attachments && req.files.attachments.length > 0) || 
            (req.files.endorsorfile && req.files.endorsorfile.length > 0)) {
          
          //ให้เจ้าหน้าที่ติกว่าอัปโหลดเอกสารอะไรบ้าง 
          // check requirement: บัตรอธิการ
          if (uploadPresidentCard) {
            const find_req = await prisma.requiredDocument.findUnique({
              where: { name: "บัตรประจำตัวอธิการบดี" }
            });

            const find_docNeed = await prisma.documentNeed.findFirst({
                where : { 
                    documentId : doc.id,
                    requiredDocumentId : find_req.id 
                }
            })

            if (find_docNeed) {
              await prisma.documentNeed.updateMany({
                where: {
                  documentId: doc.id,
                  requiredDocumentId: find_req.id
                },
                data: {
                  isProvided: true,
                  providedAt: new Date()
                }
              });

            }
          }

          // check requirement: ทะเบียนบ้านมหาวิทยาลัย
          if (uploadUniversityHouse) {
            const find_req = await prisma.requiredDocument.findUnique({
              where: { name: "ทะเบียนบ้านมหาวิทยาลัย" }
            });

            const find_docNeed = await prisma.documentNeed.findFirst({
                where : { 
                    documentId : doc.id,
                    requiredDocumentId : find_req.id 
                }
            })

            if (find_docNeed) {
              await prisma.documentNeed.updateMany({
                where: {
                  documentId: doc.id,
                  requiredDocumentId: find_req.id
                },
                data: {
                  isProvided: true,
                  providedAt: new Date()
                }
              });

            }
          }

          // บันทึกไฟล์แนบทั้งหมด
          if (req.files.attachments){
            for (const file of req.files.attachments) {
              const paths = file.path;            // path เต็ม เช่น "uploads/auditor_upload/xxx.pdf"
              const file_n = file.originalname;   // ชื่อไฟล์ต้นฉบับ
              console.log("save attachment:", paths, file_n);

              const find_attachment_type = await prisma.attachmentType.findUnique({
                where: { type_name: "AuditorUpload" }
              });

              const doc_attachment = await prisma.documentAttachment.create({
                data: {
                  file_path: paths,
                  file_name: file_n,
                  document: { connect: { id: documentId } },
                  user: { connect: { id: user.id } },
                  attachmentType: { connect: { id: find_attachment_type.id } }
                }
              });
              console.log("saved:", doc_attachment);

            }
          }

          // อัพเดตสถานะเอกสาร -> อัปโหลดเอกสารเพิ่มเติมแล้ว
          await prisma.documentPetition.update({
            where: { id: documentId },
            data: { statusId: find_status4.id }
          });

          // บันทึกประวัติการเปลี่ยนสถานะ
          await prisma.documentStatusHistory.create({
            data: {
              document: { connect: { id: documentId } },
              status: { connect: { id: find_status4.id } },
              changedBy: { connect: { id: user.id } },
              note_text: "เจ้าหน้าที่อัปโหลดเอกสารเพิ่มเติม"
            }
          });


          
          //อัปโหลดเอกสารคำร้องที่ อธิการได้ทำเซ็นแล้ว
          if (req.files.endorsorfile){
            for (const file of req.files.endorsorfile) {
              const paths = file.path;
              const file_n = file.originalname;

              const find_attachment_type =
                await prisma.attachmentType.findUnique({
                  where: { type_name: "SignedDocument" },
                });

              await prisma.documentAttachment.create({
                data: {
                  file_path: paths,
                  file_name: file_n,
                  document: { connect : { id : doc.id } },
                  user: { connect : { id : user.id } },
                  attachmentType: { connect : { id : find_attachment_type.id } },
                },
              });
            }
          }
        }

        const signingDate = new Date(date_of_signing);
        const update_doc = await prisma.documentPetition.update({
          where: { id: doc.id },
          data: { 
            statusId : find_status2.id,
            date_of_signing: signingDate,
            order_number : order_number
          },
        });

        const his_st = await prisma.documentStatusHistory.create({
          data: {
            document: { connect : { id : update_doc.id } },
            status : { connect : { id : update_doc.statusId } } ,
            changedBy: { connect : { id : user.id } },
            note_text: "อัปโหลดเอกสารคำร้อง ที่อธิการบดีได้ทำการอนุมัติ",
          },
        });
        console.log(his_st);


        return res.status(201).json({
          message: "Document approved and saved",
          success: true,
          document: update_doc,
        });
      }



      // ---------------------- REJECT ----------------------
      else if (decision === "reject") {
        const text_suggesttion = (req.body.text_suggesttion || "").toString().trim(); 
        const update_doc = await prisma.documentPetition.update({
          where: { id: doc.id },
          data: { 
            statusId: find_status3.id,
          },
        });


        await prisma.documentStatusHistory.create({
          data: {
            document: { connect : { id : doc.id } },
            status : { connect : { id : find_status3.id } } ,
            changedBy: { connect : { id : user.id } },
            note_text: `เอกสารคำร้องถูกปฏิเสธ รายละเอียด : ${text_suggesttion}`,
          },
        });

    
        return res.status(201).json({
          message: "Document rejected and saved",
          success: true,
          document: update_doc,
        });
      }

      // ---------------------- INVALID ----------------------
      else {
        return res.status(400).json({ message: "Invalid decision type" });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
  }
);














//----------------------------------------generate file pdf----------------------------------//

/* ===== static output dir ===== */
const OUTPUT_DIR = path.resolve('./generate');
if (!fs.existsSync(OUTPUT_DIR)) fs.mkdirSync(OUTPUT_DIR, { recursive: true });

/* ===== helpers ===== */
// อย่าลบ ZWSP (\u200B) และ SHY (\u00AD)
const INVISIBLE = /[\u200C\u200D\u2060\uFEFF]/g;
const UNICODE_SPACES = /[\u00A0\u1680\u180E\u2000-\u200A\u202F\u205F\u3000]/g;

const cleanText = (s = '') =>
  (s || '')
    .replace(/\r\n?/g, '\n')
    .replace(INVISIBLE, '')
    .replace(UNICODE_SPACES, ' ')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

// โหมดคงย่อหน้า: \n\n = ย่อหน้า, \n เดี่ยว = เว้นวรรค
const toParagraphsOnly = (s = '') =>
  cleanText(s).replace(/\n{2,}/g, '<<<P>>>').replace(/\n/g, ' ').replace(/<<<P>>>/g, '\n\n');

// ตัดคำไทยด้วย wordcut แล้วคั่นด้วย ZWSP (ช่วย Justify สวยขึ้นใน LO)
function wordcutThaiToZWSP(text = '') {
  if (!text) return '';
  return wordcut.cut(text).replace(/\|/g, '\u200B');
}

// อนุญาตให้ตัดบรรทัด “ข้างอัญประกาศ” เพื่อไม่ให้ยกทั้งก้อน
function allowBreakAroundQuotes(s = '') {
  return s
    .replace(/([“"])(?=[\u0E00-\u0E7F])/g, '$1\u200B')     // หลังอัญประกาศเปิด
    .replace(/([\u0E00-\u0E7F])([”"])/g, '$1\u200B$2');    // ก่อนอัญประกาศปิด
}

// รวมขั้นตอน: ทำความสะอาด → คงย่อหน้า → ตัดคำ → อนุญาต break รอบ quote
function processThaiForDocx(s = '') {
  return allowBreakAroundQuotes(wordcutThaiToZWSP(toParagraphsOnly(s)));
}

/* ===== fallback convert via soffice (robust) ===== */
async function sofficeConvertDocxBufferToPdf(buf, outPath) {
  const tmpDir = path.join(OUTPUT_DIR, `.tmp-${Date.now()}`);
  await fsp.mkdir(tmpDir, { recursive: true });

  const base = path.parse(outPath).name;
  const inPath = path.join(tmpDir, `${base}.docx`);
  await fsp.writeFile(inPath, buf);

  await new Promise((resolve, reject) => {
    const proc = spawn('soffice', [
      '--headless', '--convert-to', 'pdf:writer_pdf_Export',
      '--outdir', tmpDir, inPath
    ], { stdio: 'inherit' });

    const killTimer = setTimeout(() => proc.kill('SIGKILL'), 120000);
    proc.on('error', (err) => { clearTimeout(killTimer); reject(err); });
    proc.on('exit', (code) => { clearTimeout(killTimer); code === 0 ? resolve() : reject(new Error(`soffice exit ${code}`)); });
  });

  let pdfTmp = path.join(tmpDir, `${base}.pdf`);
  if (!fs.existsSync(pdfTmp)) {
    const files = await fsp.readdir(tmpDir);
    const found = files.find(f => f.toLowerCase().endsWith('.pdf'));
    if (!found) throw new Error('No PDF produced by soffice');
    pdfTmp = path.join(tmpDir, found);
  }

  const pdfBuf = await fsp.readFile(pdfTmp);
  await fsp.writeFile(outPath, pdfBuf);
  return pdfBuf;
}

/* ===== core builder ===== */
async function buildDocAndPdf(data, templatePath = path.resolve('./test_temp.docx'), id_doc) {
  if (!fs.existsSync(templatePath)) throw new Error(`Template not found: ${templatePath}`);

  const zip = new PizZip(fs.readFileSync(templatePath, 'binary'));
  const docx = new Docxtemplater(zip, {
    paragraphLoop: true,
    // ถ้าต้องการให้ \n = ขึ้นบรรทัดใหม่จริง ๆ ให้เปิดบรรทัดนี้ (แล้วไม่ต้องใช้ toParagraphsOnly)
    // linebreaks: true,
    nullGetter: () => '',
  });

  const payload = {
    paragraphone: processThaiForDocx(data.paragraphone),
    paragraphtwo: processThaiForDocx(data.paragraphtwo),
    title:         processThaiForDocx(data.title),
    authorizeTo:   processThaiForDocx(data.authorizeTo),
    position:      processThaiForDocx(data.position),
    affiliation:   processThaiForDocx(data.affiliation),
    authorizeText: processThaiForDocx(data.authorizeText),
    numbertwo:    processThaiForDocx(data.numbertwo),
    numberthree : processThaiForDocx(data.numberthree)
  };

  try { docx.render(payload); }
  catch (err) {
    if (err?.properties?.errors?.length) {
      const explanations = err.properties.errors.map(e => e.properties?.explanation).filter(Boolean);
      throw new Error(`Template render error: ${explanations.join(' | ')}`);
    }
    throw err;
  }

  const docxBuf = docx.getZip().generate({ type: 'nodebuffer' });
  const base = `doc-${Date.now()}`;
  const docxPath = path.join(OUTPUT_DIR, `${id_doc}.docx`);
  const pdfPath  = path.join(OUTPUT_DIR, `${id_doc}.pdf`);
  await fsp.writeFile(docxPath, docxBuf);

  const convertAsync = util.promisify(libre.convert);
  try {
    const pdfBuf = await convertAsync(docxBuf, '.pdf:writer_pdf_Export', undefined);
    await fsp.writeFile(pdfPath, pdfBuf);
  } catch (e) {
    await sofficeConvertDocxBufferToPdf(docxBuf, pdfPath);  // fallback
  }

  return { docxPath, pdfPath };
}




router.post('/generate_pdf/:docId', async (req, res) => {
  const documentId = parseInt(req.params.docId, 10);         
  if (isNaN(documentId)) {
    return res.status(400).json({ error: "docId is invalid integer" });
  }

  // โหลด template word 
  const content = fs.readFileSync(path.resolve("./test_temp.docx"), 'binary');
  const zip = new PizZip(content);

  try {
    const find_st1 = await prisma.status.findUnique({
      where : { status : "รอการพิจารณาอนุมัติจากอธิการบดี" }
    });

    const find_type = await prisma.attachmentType.findFirst({
      where : { type_name : "GenerateDocument" }
    });
    if (!find_type) {
      return res.status(404).json({ message: "AttachmentType 'GenerateDocument' not found" });
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
      where: { id: documentId }
    });
    if (doc.destinationId !== find_des.id) {
      return res.status(404).json({ message: "Document not found in this destination department" });
    }
    if (doc.statusId !== find_st1.id) {
      return res.status(403).json({ message: "Document is not in the correct status for this action" });
    }
    if (doc.auditIdBy !== user.id) {
      return res.status(403).json({ message: "You do not have permission to access this document" });
    }

    // ก่อนเริ่ม render / convert
    const existed = await prisma.documentAttachment.findFirst({
      where: {
        document: { id: documentId },           // แทน documentId
        attachmentType: { id: find_type.id },   // ประเภท GenerateDocument
        file_name: `${doc.id_doc}.pdf`,         // ไฟล์เป้าหมาย
      },
      select: { file_path: true, file_name: true },
    });

    if (existed) {
      // มีแล้ว = ไม่ให้ generate ซ้ำ (one-shot)
      return res.status(409).json({
        message: "Already generated",
        file: existed.file_path,               // เอาไปโชว์ปุ่มดาวน์โหลดได้เลย
      });
    }

    let data;
    let templatePath = req.body?.templatePath ? path.resolve(req.body.templatePath) : undefined;

    data = {
      paragraphone : "เพื่อให้การดำเนินการเกี่ยวกับภารกิจตามวัตถุประสงค์ของมหาวิทยาลัยตามมาตรา ๗ แห่งพระราชบัญญัติมหาวิทยาลัยเชียงใหม่ พ.ศ. ๒๕๕๑ เป็นไปด้วยความเรียบร้อย รวดเร็วและมีประสิทธิภาพ",
      paragraphtwo : "อำนาจตามความในมาตรา ๓๕ และมาตรา ๓๘ แห่งพระราชบัญญัติมหาวิทยาลัยเชียงใหม่ พ.ศ. ๒๕๕๑ ประกอบกับข้อ ๑๔ ของข้อบังคับมหาวิทยาลัยเชียงใหม่ ว่าด้วยการรักษาการแทน การมอบอำนาจให้ปฏิบัติการแทน  และการมอบอำนาจช่วงให้ปฏิบัติการแทนของผู้ดำรงตำแหน่งต่าง ๆ ในมหาวิทยาลัยเชียงใหม่  พ.ศ. ๒๕๕๔ และที่แก้ไขเพิ่มเติม จึงมอบอำนาจ ดังนี้",
      title: doc.title,
      authorizeTo: doc.authorize_to,
      position: doc.position,
      affiliation: doc.affiliation,
      authorizeText: doc.authorize_text,
      numbertwo : "ให้ผู้รับมอบอำนาจปฏิบัติหน้าที่ตามกรอบที่ได้รับมอบอำนาจโดยชอบด้วยกฎหมาย ข้อบังคับ ระเบียบ ประกาศและคำสั่งของมหาวิทยาลัยโดยเคร่งครัด ทั้งนี้ต้องคำนึงถึงผลของการกระทำ และความรับผิดของการกระทำนั้นทั้งทางแพ่ง ทางอาญา และทางปกครองด้วย",
      numberthree : "มหาวิทยาลัยเชียงใหม่จะรับผิดต่อการปฏิบัติงานใด ๆ ตามที่ผู้ได้รับมอบอำนาจได้กระทำไปภายในขอบเขตที่ได้รับมอบอำนาจดังกล่าวทุกประการ "
    }

    const { docxPath, pdfPath } = await buildDocAndPdf(data, templatePath, doc.id_doc);
 
    // save DB (.pdf)
    await prisma.documentAttachment.create({
      data : {
        file_path : `generate/${doc.id_doc}.pdf`,
        file_name : `${doc.id_doc}.pdf`,
        document : { connect : { id : doc.id } },
        user : { connect : { id : user.id } },
        attachmentType : { connect : { id : find_type.id } },
      }
    });

    // save DB (.docx)
    await prisma.documentAttachment.create({
      data : {
        file_path : `generate/${doc.id_doc}.docx`,
        file_name : `${doc.id_doc}.docx`,
        document : { connect : { id : doc.id } },
        user : { connect : { id : user.id } },
        attachmentType : { connect : { id : find_type.id } },
      }
    });


    res.json({ 
      message: "PDF and DOCX generated successfully", 
      files: {
        docx: docxPath,
        pdf: pdfPath
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});














const ALLOW_BASE_DIR = path.resolve('./generate');

//---------------------------download file pdf and word from generate already---------------------//
router.get('/download_docx_generate/:docId', async (req, res) => {
  const documentId = parseInt(req.params.docId, 10);         
  if (isNaN(documentId)) {
    return res.status(400).json({ error: "docId is invalid integer" });
  }

  try {
    const find_st1 = await prisma.status.findUnique({
      where : { status : "รอการพิจารณาอนุมัติจากอธิการบดี" }
    });

    const find_type = await prisma.attachmentType.findFirst({
      where : { type_name : "GenerateDocument" }
    });
    if (!find_type) {
      return res.status(404).json({ message: "AttachmentType 'GenerateDocument' not found" });
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
      where: { id: documentId }
    });
    if (doc.destinationId !== find_des.id) {
      return res.status(404).json({ message: "Document not found in this destination department" });
    }
    if (doc.statusId !== find_st1.id) {
      return res.status(403).json({ message: "Document is not in the correct status for this action" });
    }
    if (doc.auditIdBy !== user.id) {
      return res.status(403).json({ message: "You do not have permission to access this document" });
    }

    //หาไฟล์ .docx ของ doc นี้ (แก้ filter ให้ตรงสคีมา: ใช้ field id โดยตรง)
    const fileNameWanted = `${doc.id_doc}.docx`;
    const existed = await prisma.documentAttachment.findFirst({
      where: {
        document: { id: documentId },           // แทน documentId
        attachmentType: { id: find_type.id },   // ประเภท GenerateDocument
        file_name: fileNameWanted,         // ไฟล์เป้าหมาย
      },
      select: { file_path: true, file_name: true },
    });

    if (!existed) {
      return res.status(404).json({ message: `Generated .docx not found for this document` });
    }

    // 4) สร้าง path แบบปลอดภัยใต้ ALLOW_BASE_DIR
    const candidate = existed.file_path || existed.file_name;      // ใน DB อาจเก็บ path หรือแค่ชื่อไฟล์
    let fullPath = path.isAbsolute(candidate)
      ? candidate
      : path.resolve(ALLOW_BASE_DIR, candidate);

    fullPath = path.resolve(fullPath); // normalize

    // กัน path traversal: ต้องอยู่ใต้ ALLOW_BASE_DIR
    if (!fullPath.startsWith(ALLOW_BASE_DIR + path.sep) && fullPath !== ALLOW_BASE_DIR) {
      return res.status(403).json({ message: 'File path is not allowed' });
    }

    // 5) ถ้าไฟล์ตาม file_path ไม่เจอ ลองประกอบจาก ALLOW_BASE_DIR + file_name
    if (!fs.existsSync(fullPath)) {
      const alt = path.resolve(ALLOW_BASE_DIR, existed.file_name);
      if (!fs.existsSync(alt)) {
        return res.status(404).json({ message: 'File not found on disk' });
      }
      fullPath = alt;
    }

    // 6) ส่งไฟล์
    const downloadName = existed.file_name || fileNameWanted;
    res.download(fullPath, downloadName, (err) => {
      if (err) {
        console.error('[download docx error]', err);
        if (!res.headersSent) res.status(500).json({ message: 'Error sending file' });
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});








//---------------------------download file pdf and word from generate already---------------------//
router.get('/download_pdf_generate/:docId', async (req, res) => {
  const documentId = parseInt(req.params.docId, 10);         
  if (isNaN(documentId)) {
    return res.status(400).json({ error: "docId is invalid integer" });
  }

  try {
    const find_st1 = await prisma.status.findUnique({
      where : { status : "รอการพิจารณาอนุมัติจากอธิการบดี" }
    });

    const find_type = await prisma.attachmentType.findFirst({
      where : { type_name : "GenerateDocument" }
    });
    if (!find_type) {
      return res.status(404).json({ message: "AttachmentType 'GenerateDocument' not found" });
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
      where: { id: documentId }
    });
    if (doc.destinationId !== find_des.id) {
      return res.status(404).json({ message: "Document not found in this destination department" });
    }
    if (doc.statusId !== find_st1.id) {
      return res.status(403).json({ message: "Document is not in the correct status for this action" });
    }
    if (doc.auditIdBy !== user.id) {
      return res.status(403).json({ message: "You do not have permission to access this document" });
    }

    const fileNameWanted = `${doc.id_doc}.pdf`;
    const existed = await prisma.documentAttachment.findFirst({
      where: {
        document: { id: documentId },           // แทน documentId
        attachmentType: { id: find_type.id },   // ประเภท GenerateDocument
        file_name: fileNameWanted,         // ไฟล์เป้าหมาย
      },
      select: { file_path: true, file_name: true },
    });

    if (!existed) {
      return res.status(404).json({ message: `Generated .pdf not found for this document` });
    }


        // 4) สร้าง path แบบปลอดภัยใต้ ALLOW_BASE_DIR
    const candidate = existed.file_path || existed.file_name;      // ใน DB อาจเก็บ path หรือแค่ชื่อไฟล์
    let fullPath = path.isAbsolute(candidate)
      ? candidate
      : path.resolve(ALLOW_BASE_DIR, candidate);

    fullPath = path.resolve(fullPath); // normalize

    // กัน path traversal: ต้องอยู่ใต้ ALLOW_BASE_DIR
    if (!fullPath.startsWith(ALLOW_BASE_DIR + path.sep) && fullPath !== ALLOW_BASE_DIR) {
      return res.status(403).json({ message: 'File path is not allowed' });
    }

    // 5) ถ้าไฟล์ตาม file_path ไม่เจอ ลองประกอบจาก ALLOW_BASE_DIR + file_name
    if (!fs.existsSync(fullPath)) {
      const alt = path.resolve(ALLOW_BASE_DIR, existed.file_name);
      if (!fs.existsSync(alt)) {
        return res.status(404).json({ message: 'File not found on disk' });
      }
      fullPath = alt;
    }

    // 6) ส่งไฟล์
    const downloadName = existed.file_name || fileNameWanted;
    res.download(fullPath, downloadName, (err) => {
      if (err) {
        console.error('[download docx error]', err);
        if (!res.headersSent) res.status(500).json({ message: 'Error sending file' });
      }
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});






















































//-----------------------------------ประวัติเอกสาร-----------------------------------//
//-----------------------------ประวัติการตรวจสอบเอกสารขั้นต้นเสร็จเรียบร้อย----------------//
router.get('/history_audited', async (req, res) => {
  try {
    const find_st1 = await prisma.status.findUnique({
      where : { status : "เจ้าหน้าที่ตรวจสอบแล้ว" }
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
      ownername : `${h.document.user?.firstname || ""} ${h.document.user?.lastname || ""}`.trim(),


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
router.get('/history_send_back_edit_auditor', async (req, res) => {
  try {
    const find_st1 = await prisma.status.findUnique({
      where : { status : "ส่งคืนแก้ไขเอกสาร" }
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
        }
    });
    console.log(find_his_edit)

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
      
    console.log(set_json)
    res.json(set_json)
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});









router.get('/historyApprove', async (req, res) => {
  try {

    const find_st1 = await prisma.status.findUnique({
      where : { status : "อธิการบดีอนุมัติแล้ว" }
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
            user : true,
            department : true
            }}
        },orderBy: {
            changedAt: 'desc' // หรือ 'asc' ถ้าอยากเก่าสุดไปใหม่สุด
        }
    });

    if (!doc || doc.length === 0) {
      return res.json([]); // ไม่มีประวัติ → ส่ง array ว่าง
    }

    console.log(doc)
    res.json(doc);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});















router.get('/historyRejectDoc', async(req, res) => {
    try {

    const find_st1 = await prisma.status.findUnique({
      where : { status : "อธิการบดีปฏิเสธคำร้อง" }
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
            user : true,
            department : true
            }}
        },orderBy: {
            changedAt: 'desc' // หรือ 'asc' ถ้าอยากเก่าสุดไปใหม่สุด
        }
    });

    if (!doc || doc.length === 0) {
      return res.json([]); // ไม่มีประวัติ → ส่ง array ว่าง
    }

    res.json(doc);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});




export default router;