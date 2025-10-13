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

        if (!dept) {
            dept = await prisma.department.create({
                data: { department_name: depName },
            });
        }
    
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

        if ( !access_role.includes(role_id) ) {
            return res.status(404).json({ message: "Role id must belong in role of auditor and user" });
        }

        const new_audit = await prisma.user.create({
            data : {
                email : email,
                firstname : fname,
                lastname : lname,
                department : { connect : { id : dept.id } },
                role : { connect : { id : roleId } }
            }
        });

        res.json(new_audit)

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

export default router;
