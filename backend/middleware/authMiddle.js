import dotenv from 'dotenv';
dotenv.config({ path: '../.env.dev' });

import jwt from "jsonwebtoken";


//check token ของ user login and sign in
function authMiddleware(req, res, next) {
    let token = req.headers['authorization'];
    console.log("middleware received token:", token);

    if (!token) {
        return res.status(401).json({ message: "No token provided" });
    }

    // ถ้า token เริ่มต้นด้วย "Bearer " → ตัดออก
    if (token.startsWith("Bearer ")) {
        token = token.slice(7, token.length);
    }

    try {
        jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
            if (err) {
                return res.status(401).json({ message: "Invalid token" });
            }

            req.user = decoded;
            console.log(decoded.id, decoded.role_name, decoded.email);
            next();
        });
    } catch (err) {
        return res.status(401).json({ message: "Unauthorized: invalid token" });
    }
}

export default authMiddleware;
