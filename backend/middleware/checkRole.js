import dotenv from 'dotenv';
dotenv.config({ path: '../.env.dev' });

import jwt from "jsonwebtoken";

function checkRole(roles = []){
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        if (roles.length && !roles.includes(req.user.role_id)) {
            return res.status(403).json({ message: "Forbidden: insufficient role" });
        }

        console.log("accept to access in this roles",req.user.role_id);
        next();

    };
}

export default checkRole;