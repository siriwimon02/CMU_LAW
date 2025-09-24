// Required External Modules
import dotenv from 'dotenv';
dotenv.config({ path: '../.env.dev' });

import express from 'express';
import prisma from '../prismaClient.js';
import multer from "multer";


const router = express.Router();

//------------------------------------doc ที่รอตรวจสอบขั้นตอน + อัพเดตสถานะให้ตรวจสอบขั้นต้น--------------------------//
router.get('/wait_to_audit_byAudit', async (req, res) => {
    try {
        const findstatus1 = await prisma.status.findUnique({
            where : { status: "รับเข้ากองเรียบร้อย" }
        });

        const findstatus2 = await prisma.status.findUnique({
            where : { status: "อยู่ระหว่างการตรวจสอบขั้นต้น" }
        });

        // const findstatus3 = await prisma.status.findUnique({
        //     where : { status : "ผู้ใช้แก้ไขเอกสารเรียบร้อยแล้ว"}
        // })

        // const findstatus4 = await prisma.status.findUnique({
        //     where : { status : "ส่งกลับเพื่อแก้ไขจากการตรวจสอบโดยหัวหน้ากอง"}
        // })

        // const findstatus5 = await prisma.status.findUnique({
        //     where : { status : "ส่งกลับให้แก้ไขจากการตรวจสอบขั้นสุดท้าย"}
        // })

        const findstatus6 = await prisma.status.findUnique({
            where : { status : "เจ้าหน้าที่แก้ไขเอกสารแล้ว"}
        })

        const findstatus7 = await prisma.status.findUnique({
            where : { status : "เจ้าหน้าที่อัปโหลดเอกสารเพิ่มเติมแล้ว"}
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
                    in : [findstatus1.id, findstatus6.id, findstatus7.id]
                },
                auditIdBy : user.id
            }, include: { status: true }
        });
        console.log("doc audit_1st", document_audit_1st);



        if ( document_audit_1st.length > 0 ){
            const update_st = await prisma.documentPetition.updateMany({
                where : {
                    destinationId : find_des.id,
                    statusId : {
                        in : [findstatus1.id, findstatus6.id, findstatus7.id]
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
            console.log("อัพเดตสถานะของผู้ตรวจสอบ", update_st)
        }

        const document_audit_2st = await prisma.documentPetition.findMany({
            where : {
                destinationId : find_des.id,
                statusId : findstatus2.id,
                auditIdBy : user.id 
            }, include : {
                department : true,
                destination : true,
                user : true,
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
                owneremail : doc.user.email,
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
        // console.log(document_json);
        res.json({ message : "find document waiting to the first audit", document_json})
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});







//-----------------------------------------------------------ดึง data มาทีละอัน---------------------------------------//
router.get('/document/:docId', async (req, res) => {
    try {
        const documentId = parseInt(req.params.docId, 10); 
        if (isNaN(documentId)) {
            return res.status(400).json({ error: "docId is invalid integer" });
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
                user: true,
                auditBy : true,
                headauditBy : true,
                attachments: { include : { attachmentType : true } },
                documentNeeds: { include: { requiredDocument : true } } 
            }
        });
        console.log(doc);

        if (!doc || doc.destinationId !== find_des.id) {
            return res.status(404).json({ message: "Document not found in this destination department" });
        }

        if (doc.auditIdBy !== user.id) {
            return res.status(403).json({ message: "You do not have permission to access this document" });
        }

        const setdoc = {
        id: doc.id,
        doc_id: doc.id_doc,
        department_name: doc.department.department_name,
        destination_name: doc.destination.des_name,

        // owner
        owneremail: doc.user?.email || null,
        ownername: `${doc.user?.firstname || ""} ${doc.user?.lastname || ""}`.trim(),

        // เนื้อหาเอกสาร
        title: doc.title,
        authorize_to: doc.authorize_to,
        position: doc.position,
        affiliation: doc.affiliation,
        authorize_text: doc.authorize_text,

        // สถานะปัจจุบัน
        status_name: doc.status.status,

        // audit
        auditByemail: doc.auditBy?.email ?? null,
        auditByname: doc.auditBy
            ? `${doc.auditBy.firstname} ${doc.auditBy.lastname}`.trim()
            : null,

        // head audit
        headauditByemail: doc.headauditBy?.email ?? null,
        headauditByname: doc.headauditBy
            ? `${doc.headauditBy.firstname} ${doc.headauditBy.lastname}`.trim()
            : null,

        createdAt: doc.createdAt,
        documentNeed: doc.documentNeeds,
        document_attachments: doc.attachments
        };

        res.json({ message: "find document waiting to the first audit", setdoc });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});







//----------------------------------------------------อัพเดตยืนการตรวจเอกสารขั้นต้น----------------------------------//
router.put('/update_st_audit_by_audit/:docId', async (req, res) => {
    const {set_headauditId} = req.body;

    if (!set_headauditId || isNaN(set_headauditId)) {
        return res.status(400).json({ error: "HeadAuditor ID is required and must be a valid number" });
    }

    const headUser = await prisma.user.findUnique({ where: { id: set_headauditId } });

    if (!headUser) {
        return res.status(404).json({ message: "Head auditor not found" });
    }

    const documentId = parseInt(req.params.docId, 10); 
    if (isNaN(documentId)) {
        return res.status(400).json({ error: "docId is invalid integer" });
    }

    try { 
        const find_status1 = await prisma.status.findUnique({
        where: { status: "อยู่ระหว่างการตรวจสอบขั้นต้น" }
        });

        const findstatus3 = await prisma.status.findUnique({
            where : { status : "ผู้ใช้แก้ไขเอกสารเรียบร้อยแล้ว"}
        })

        const findstatus4 = await prisma.status.findUnique({
            where : { status : "ส่งกลับเพื่อแก้ไขจากการตรวจสอบโดยหัวหน้ากอง"}
        })

        const findstatus5 = await prisma.status.findUnique({
            where : { status : "ส่งกลับให้แก้ไขจากการตรวจสอบขั้นสุดท้าย"}
        })

        const find_status2 = await prisma.status.findUnique({
            where: { status: "ตรวจสอบขั้นต้นเสร็จสิ้น" }
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

        if (doc.statusId !== find_status1.id || doc.statusId !== findstatus3.id || doc.statusId !== findstatus4.id || doc.statusId !== findstatus5.id) {
            return res.status(403).json({ message: "Document is not in the correct status for this action" });
        }

        if (doc.auditIdBy !== user.id) {
            return res.status(403).json({ message: "You do not have permission to access this document" });
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
            note_text:  "ตรวจสอบเอกสารเรียบร้อยแล้ว โดยพนักงานตรวจสอบ"
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
            where: { status: "อยู่ระหว่างการตรวจสอบขั้นต้น" }
        });

        const findstatus3 = await prisma.status.findUnique({
            where : { status : "ผู้ใช้แก้ไขเอกสารเรียบร้อยแล้ว"}
        })

        const findstatus4 = await prisma.status.findUnique({
            where : { status : "ส่งกลับเพื่อแก้ไขจากการตรวจสอบโดยหัวหน้ากอง"}
        })

        const findstatus5 = await prisma.status.findUnique({
            where : { status : "ส่งกลับให้แก้ไขจากการตรวจสอบขั้นสุดท้าย"}
        })

        
        const find_status2 = await prisma.status.findUnique({
            where: { status: "ส่งกลับให้ผู้ใช้แก้ไขเอกสาร" }
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

        if (doc.statusId !== find_status1.id || doc.statusId !== findstatus3.id || doc.statusId !== findstatus4.id || doc.statusId !== findstatus5.id) {
            return res.status(403).json({ message: "Document is not in the correct status for this action" });
        }

        if (doc.auditIdBy !== user.id) {
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
            note_text:   `ส่งแก้ไขเอกสาร โดยพนังงานตรวจสอบ รายละเอียดเพิ่มเติมการแก้ไขเอกสาร : ${text_edit_suggesttion || "-"}`
            }
        });

        const update_finish = await prisma.documentPetition.findUnique({
            where : { id : documentId }
        });

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

        //ส่ง data ไปยังเมลด้วย
        //------------------------mail----------------//
        res.json({message: "Document status updated to user to edit document", updatedDoc});
    
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Server error" });
    }
});









//----------------การเพิ่มเอกสารได้ แก้ไขเอกสารได้ ของuser โดยพนักงาน คือพนง สามารถเข้าไปแก้ไขเอกสารได้ แก้ไขคำผิด-------------//
router.put('/update_document_ByAuditor/:docId', async (req, res) => {
    const documentId = parseInt(req.params.docId, 10);         
    if (isNaN(documentId)) {
        return res.status(400).json({ error: "docId is invalid integer" });
    }
    try {
        const { title, authorizeTo, position, affiliation, authorizeText} = req.body;

        const find_status1 = await prisma.status.findUnique({
            where: { status: "อยู่ระหว่างการตรวจสอบขั้นต้น" }
        });

        const findstatus3 = await prisma.status.findUnique({
            where : { status : "ผู้ใช้แก้ไขเอกสารเรียบร้อยแล้ว"}
        })

        const findstatus4 = await prisma.status.findUnique({
            where : { status : "ส่งกลับเพื่อแก้ไขจากการตรวจสอบโดยหัวหน้ากอง"}
        })

        const findstatus5 = await prisma.status.findUnique({
            where : { status : "ส่งกลับให้แก้ไขจากการตรวจสอบขั้นสุดท้าย"}
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

        if (!doc || doc.destinationId !== find_des.id) {
            return res.status(404).json({ message: "Document not found in this destination department" });
        }

        if (doc.statusId !== find_status1.id || doc.statusId !== findstatus3.id || doc.statusId !== findstatus4.id || doc.statusId !== findstatus5.id) {
            return res.status(403).json({ message: "Document is not in the correct status for this action" });
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

            //เก็บเอกสารเก่า
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

            isUpdated = true;
            console.log("updated document", updatedDoc)
            console.log("set doc history", doc_edit)
            console.log("history status", his_st)
        }

        if (!isUpdated) {
            return res.status(400).json({message: "Did not updated or upload anything else" });
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
            where : { status : "ตรวจสอบขั้นสุดท้ายเสร็จสิ้น" }
        });

        const find_st2 = await prisma.status.findUnique({
            where : { status : "รอการพิจารณาอนุมัติจากอธิการบดี" }
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
                        note_text: "เอกสารที่รอตรวจสอบ โดยพนักงานตรวจสอบ"
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
                documentNeeds: { include: { requiredDocument : true } } 
            }
        })
        console.log(document_audit_2st);

        const document_json = [];
        for(const doc of document_audit_2st){
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
                auditBy: doc.auditBy?.email ?? null,        
                headauditBy: doc.headauditBy?.email ?? null, 
                createdAt: doc.createdAt,
                documentNeed: doc.documentNeeds,
                document_attachments: doc.attachments
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









// endorser storage
const storageEndorser = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/signed_document");
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + "-" + file.originalname);
  },
});
const uploadEndorser = multer({ storage: storageEndorser });

//----------------------------------ตอนเพิ่มเอกสารที่ อธิการบดี ได้ทำการอนุมัติเรียบร้อยแล้ว------------------------------//
router.put("/upload_endorser_document/:docId", uploadEndorser.array("attachments", 5), async (req, res) => {
    const { decision, date_of_signing } = req.body; // 'approve' หรือ 'reject'
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

      if (!doc || doc.destinationId !== find_des.id) {
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
        return res
          .status(403)
          .json({ message: "You do not have permission to access this document" });
      }

      // ---------------------- APPROVE ----------------------
      if (decision === "approve") {
        if (req.files && req.files.length > 0) {
          for (const file of req.files) {
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

        
        const signingDate = new Date(date_of_signing);
        const update_doc = await prisma.documentPetition.update({
          where: { id: doc.id },
          data: { 
            statusId : find_status2.id,
            date_of_signing: signingDate
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
        const update_doc = await prisma.documentPetition.update({
          where: { id: doc.id },
          data: { statusId: find_status3.id },
        });

        const his_st = await prisma.documentStatusHistory.create({
          data: {
            document: { connect : { id : update_doc.id } },
            status : { connect : { id : update_doc.statusId } } ,
            changedBy: { connect : { id : user.id } },
            note_text: "เอกสารคำร้องถูกปฏิเสธ",
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












// storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/auditor_upload");
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "-" + file.originalname;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// PUT: upload requirement docs
router.put('/upload_document_requirment/:docId', upload.array("attachments", 5), async (req, res) => {
  const documentId = parseInt(req.params.docId, 10);
  if (isNaN(documentId)) {
    return res.status(400).json({ error: "docId is invalid integer" });
  }

  const uploadPresidentCard = req.body.uploadPresidentCard === "true";
  const uploadUniversityHouse = req.body.uploadUniversityHouse === "true";

  console.log("body:", req.body);
  console.log("files:", req.files);

  try {
    // step: หาสถานะที่ต้องอยู่ก่อนถึงจะ upload ได้
    const find_status1 = await prisma.status.findUnique({
      where: { status: "รอการพิจารณาอนุมัติจากอธิการบดี" },
    });

    // step: กำหนดสถานะใหม่หลังจาก upload
    const find_status3 = await prisma.status.findUnique({
      where: { status: "อัปโหลดเอกสารเพิ่มเติมแล้ว" }
    });

    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { department: true },
    });
    const find_des = await prisma.destination.findUnique({
      where: { des_name: user.department.department_name },
    });
    if (!find_des) {
      return res.status(403).json({ message: "User is not in this destination department" });
    }

    const doc = await prisma.documentPetition.findUnique({
      where: { id: documentId },
    });

    if (!doc || doc.destinationId !== find_des.id) {
      return res.status(404).json({ message: "Document not found in this destination department" });
    }

    if (doc.statusId !== find_status1.id) {
      return res.status(403).json({ message: "Document not in correct status for this action" });
    }

    if (doc.auditIdBy !== user.id) {
      return res.status(403).json({ message: "You do not have permission to access this document" });
    }

    // เช็คว่ามีไฟล์ upload มามั้ย
    if (req.files && req.files.length > 0) {
      // check requirement: บัตรอธิการ
      if (uploadPresidentCard) {
        const find_req = await prisma.requiredDocument.findUnique({
          where: { name: "บัตรประจำตัวอธิการบดี" }
        });

        if (find_req) {
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

        if (find_req) {
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
      for (const file of req.files) {
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

      // อัพเดตสถานะเอกสาร -> อัปโหลดเอกสารเพิ่มเติมแล้ว
      const updatedDoc = await prisma.documentPetition.update({
        where: { id: documentId },
        data: { statusId: find_status3.id }
      });

      // บันทึกประวัติการเปลี่ยนสถานะ
      const his_st = await prisma.documentStatusHistory.create({
        data: {
          document: { connect: { id: documentId } },
          status: { connect: { id: find_status3.id } },
          changedBy: { connect: { id: user.id } },
          note_text: "เจ้าหน้าที่อัปโหลดเอกสารเพิ่มเติม"
        }
      });

      return res.json({
        message: "Upload success",
        document: updatedDoc,
        history: his_st
      });
    } else {
      return res.status(400).json({ message: "No files uploaded" });
    }

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
router.get('/history_send_back_edit_auditor', async (req, res) => {
  try {
    const find_st1 = await prisma.status.findUnique({
      where : { status : "ส่งกลับให้ผู้ใช้แก้ไขเอกสาร" }
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
    const his_edit = await prisma.documentStatusHistory.findMany({
      where : {
        statusId : find_st1.id,
        changeById : user.id,
        document: {
          destinationId: find_des.id   
        } 
      }
    });

    if (his_edit.length === 0) {
      return res.json([]); // ไม่มีประวัติ ก็ส่ง array ว่างกลับไป
    }

    const find_his_edit = await prisma.documentPetitionHistory.findMany({
      where: { 
        his_statusId : { in: his_edit.map(h => h.id) }
      },include : {
        editedBy : true,
        statusHistory : {
          include : {
            status : true
          }
        },
        document : { include : {
          auditBy : true,
          headauditBy : true,
          status : true,
          user : true
        }}
      }
    })


    const set_json = find_his_edit.map(h => ({
      doc_petition_his_id: h.id,
      history_status_id: h.statusHistory.id,
      docId: h.documentId,
      idformal: h.document.id_doc,

      // สถานะ
      oldstatus: h.statusHistory.status?.status || null,
      nowstatus: h.document.status?.status || null,
      note_text: h.note_text || h.statusHistory.note_text || null,
      editedAt: h.editAt,

      // // snapshot ของเอกสารเก่า (ตอนส่งกลับ)
      // snapshot: {
      //   title: h.title,
      //   authorize_to: h.authorize_to,
      //   position: h.position,
      //   affiliation: h.affiliation,
      //   authorize_text: h.authorize_text
      // },

      // ผู้ที่เกี่ยวข้อง

      
      editedByname: `${h.editedBy.firstname} ${h.editedBy.lastname}`.trim(),
      editedByemail: h.editedBy.email,
      
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
      

      // // ข้อมูลเอกสารปัจจุบัน
      // current_document: {
      //   doc_statusNow: h.document.status?.status || null,
      //   doc_current_title: h.document.title
      // }
    }));

    res.json(set_json)
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});



router.get('/snapdoc/:hisstatusId', async (req, res) => {
    try {
      const his_stId = parseInt(req.params.hisstatusId, 10); 
      if (isNaN(his_stId)) {
        return res.status(400).json({ error: "docId is invalid integer" });
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

      const his_edit = await prisma.documentPetitionHistory.findMany({
        where : { 
          his_statusId : his_stId,
          editById : user.id,
          document : {
            destinationId : find_des.id
          } 
        }
      });

      res.json(his_edit)

    } catch (err) {
      console.error(err);
      res.status(500).json({ message: "Server error" });
    }
});


export default router;