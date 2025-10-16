// Required External Modules
import dotenv from 'dotenv';
dotenv.config({ path: '../.env.dev' });

import express from 'express';
import prisma from '../prismaClient.js';


const router = express.Router();

const find_rUser = await prisma.roleOfUser.findUnique({
    where : { role_name : 'user' }
});

const find_rSpv = await prisma.roleOfUser.findUnique({
    where : { role_name : 'spv_auditor' }
});

const find_rAudit = await prisma.roleOfUser.findUnique({
    where : { role_name : 'auditor' }
});

const find_rHeadA = await prisma.roleOfUser.findUnique({
    where : { role_name : 'head_auditor' }
});

const find_rAdmin = await prisma.roleOfUser.findUnique({
    where : { role_name : 'admin' }
});


router.get('/api/roleAuditor', async (req, res) => {

    const roleAuditor = [
        find_rSpv, find_rAudit, find_rHeadA
    ]

    res.json(roleAuditor);
});



router.post('/add_role_staff', async (req, res) => {

    try {

        const { fname, lname, depName, role_id } = req.body;
        
        const email = String(req.body.email).trim().toLowerCase();

        const roleId = Number(role_id); // แปลงให้ชัวร์ว่าเป็นตัวเลข
        if (Number.isNaN(roleId)) {
            return res.status(400).json({ message: 'Invalid role_id' });
        }

        const find_des = await prisma.destination.findUnique({
            where : { des_name : depName }
        });

        if (!find_des) {
            return res.status(403).json({ message: "Staff must belong to the destination department." });
        }

        // หาหรือสร้าง department
        let dept = await prisma.department.findUnique({
            where: { department_name: depName },
        });
        console.log(dept)
    
        //role ต้องมี
        const find_rId = await prisma.roleOfUser.findUnique({
            where : {id : roleId}
        })

        if (!find_rId) {
            return res.status(404).json({ message: "Role not found" });
        }

        const find_email = await prisma.user.findUnique({
            where : { email : email }
        })

        if (find_email) {
        return res.status(409).json({ message: "This email already has a role." });
        }

        const access_role = [
            find_rAudit.id,
            find_rHeadA.id,
            find_rSpv.id
        ]

        if ( !access_role.includes(roleId) ) {
            return res.status(404).json({ message: "Role id must belong in role of auditor and user" });
        }

        if (!dept) {
            dept = await prisma.department.create({
                data: { department_name: depName },
            });
        }

        const newUser = await prisma.user.create({
            data : {
                email : email,
                firstname : fname,
                lastname : lname,
                department : { connect : { id : dept.id } },
                role : { connect : { id : roleId } }
            }
        });

        return res.status(201).json(newUser);

    } catch (err) {
        console.error(err.message);
        res.sendStatus(503);
    }
});


router.put('/updateRole/:userId', async (req, res) => {

    try { 
        const userid = parseInt(req.params.userId);
        const {role_id} = req.body;

        const roleId = Number(role_id); // แปลงให้ชัวร์ว่าเป็นตัวเลข
        if (Number.isNaN(roleId)) {
            return res.status(400).json({ message: 'Invalid role_id' });
        }

        if (isNaN(userid)) {
            return res.status(400).json({ error: "userId is invalid integer" });
        }

        const user = await prisma.user.findUnique({
            where : { id : userid }
        })

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (user.rId === roleId) {
            return res.status(409).json({ message: 'User already has this role' });
        }

        const update_user = await prisma.user.update({
            where : { id : user.id },
            data : {
                rId : roleId
            }
        })
        res.json({ message: 'Role updated successfully', user: update_user });

    } catch (err) {
        console.error(err.message);
        res.sendStatus(503);
    }
});




router.delete('/delete_user/:userId', async (req, res) => {
    try {
        const userid = parseInt(req.params.userId);

        if (isNaN(userid)) {
            return res.status(400).json({ error: "userId is invalid integer" });
        }

        const user = await prisma.user.findUnique({
            where : { id : userid }
        })

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const delete_user = await prisma.user.delete({
            where: { id: user.id }
        });

        res.json({ message: 'User deleted successfully', user : delete_user });
    } catch (err) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Failed to delete user' });
    }
});






router.get('/api/documentAll', async (req, res) => {

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











router.get('/api/user', async (req, res) => {
    const userAll = await prisma.user.findMany({
        include: {
            role: { select: { role_name: true } },
            department : true
        }
    });
    res.json(userAll);
    console.log(userAll);
})








router.get('/api/action_log/:docId', async (req, res) => {
    // const date_time = "";
    // const actionBy = "";
    // const role_name = "";
    // const action = "";
    // const text = "";

    const documentId = parseInt(req.params.docId, 10); 
    if (isNaN(documentId)) {
        return res.status(400).json({ error: "docId is invalid integer" });
    }

    const findstatus1 = await prisma.status.findUnique({
        where : { status : "แก้ไขเอกสารเรียบร้อยแล้ว" }
    });

    const findstatus2 = await prisma.status.findUnique({
        where : { status : "เจ้าหน้าที่แก้ไขเอกสารแล้ว" }
    });

    const findstatus3 = await prisma.status.findUnique({
        where : { status : "ส่งต่อไปยังหน่วยงานอื่นที่เกี่ยวข้อง" }
    });

    const doc = await prisma.documentPetition.findUnique({
        where : { id : documentId }
    })

    if (!doc) {
        return res.status(404).json({ error : "Document not found" })
    }

    const find_st = await prisma.documentStatusHistory.findMany({
        where : { documentId : documentId },
        include : { 
        petitionEdits : true,
        petitionTranfers : {
            include : {
                transferTo : true,
                transferFrom : true,
                transferBy : true
            }
        },
        changedBy : { include : {role : true} },
        status : true
        } 
    });

    console.log(find_st)

    const find_att = await prisma.documentAttachment.findMany({
        where : { docId : documentId },
        include : {
        attachmentType : true,
        user : { include : {role : true} }
        }
    });

    const action = []
    for (const st of find_st) {
        console.log(st.statusId === findstatus1.id || st.statusId === findstatus2.id)
        //console.log(st.petitionEdits.note_text)
        if (st.statusId === findstatus1.id || st.statusId === findstatus2.id) {
            const set_json = {
                date_time : st.changedAt,
                actionBy :`${st.changedBy.firstname} ${st.changedBy.lastname} ( ${st.changedBy.email} )`,
                role_name : st.changedBy.role.role_name,
                action : st.status.status,
                text : st.petitionEdits[0].note_text,
                id_editPetiton : st.petitionEdits[0].id
            }
            action.push(set_json)  
        } else if (st.statusId === findstatus3.id){
            const transfer = st.petitionTranfers[0]

            const set_json = {
                date_time : st.changedAt,
                actionBy :`${transfer.transferBy.firstname} ${transfer.transferBy.lastname} ( ${transfer.transferBy.email} )`,
                role_name : st.changedBy.role.role_name,
                action : st.status.status,
                transferFrom : transfer.transferFrom.des_name,
                transderTo : transfer.transferTo.des_name,
                text : `${transfer.note_text} ส่งจากหน่วยงาน : ${transfer.transferFrom.des_name} ไปหน่วยงาน : ${transfer.transferTo.des_name} `,
            }
            action.push(set_json) 

        } else {
            const set_json = {
                date_time : st.changedAt,
                actionBy :`${st.changedBy.firstname} ${st.changedBy.lastname} ( ${st.changedBy.email} )`,
                role_name : st.changedBy.role.role_name,
                action : st.status.status,
                text : st.note_text,
            }
            action.push(set_json)  
        }
    }

    for (const att of find_att) {
        const set_json = {
            date_time : att.time_upload,
            actionBy :  `${att.user.firstname} ${att.user.lastname} ( ${att.user.email} )`,
            role_name : att.user.role.role_name,
            action : `อัปโหลดเอกสาร ${att.attachmentType.type_name}`,
            text : `file_path : ${att.file_path}`
        }
        action.push(set_json)  
    }

    // ถ้าอยาก ใหม่ → เก่า
    const thTimelineDesc = [...action].sort(
        (a, b) => new Date(a.date_time) - new Date(b.date_time)
    );

    console.log(thTimelineDesc)

    res.json({id_doc : doc.id_doc, thTimelineDesc})

    // res.json(find_st);

})

















router.delete('/delete_doc/:docId', async (req, res) => {
  try {
    const documentId = Number.parseInt(req.params.docId, 10);
    if (Number.isNaN(documentId)) {
      return res.status(400).json({ error: 'docId is invalid integer' });
    }

    const doc = await prisma.documentPetition.findUnique({
      where: { id: documentId },
      select: { id: true },
    });
    if (!doc) {
      return res.status(404).json({ message: 'Document not found' });
    }

    await prisma.$transaction([
      // 1) ลบทุกตารางที่เป็น "ลูกของ StatusHistory" ก่อน
      prisma.documentPetitionHistoryTranfers.deleteMany({ where: { documentId: doc.id } }),
      prisma.documentPetitionHistory.deleteMany({ where: { documentId: doc.id } }),

      // 2) จากนั้นค่อยลบ StatusHistory ของเอกสารนี้
      prisma.documentStatusHistory.deleteMany({ where: { documentId: doc.id } }),

      // 3) ลบลูกตัวอื่น ๆ ที่อ้าง document โดยตรง
      prisma.documentNeed.deleteMany({ where: { documentId: doc.id } }),
      prisma.documentAttachment.deleteMany({ where: { docId: doc.id } }),

      // 4) สุดท้ายค่อยลบแม่
      prisma.documentPetition.delete({ where: { id: doc.id } }),
    ]);

    return res.status(200).json({ message: "delete document petition finished" });
  } catch (err) {
    console.error('delete /delete/:docId error:', err);
    return res.sendStatus(503);
  }
});


export default router;
