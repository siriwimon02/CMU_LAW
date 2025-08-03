import dotenv from 'dotenv';
dotenv.config({ path: '../.env.dev' });

import jwt from "jsonwebtoken";


//check token ของ user login and sign in
function authMiddleware(req, res, next){
    const token = req.headers['authorization'];

    console.log(token);
    if (!token) {
        return res.status(401).json({message: "No token provided"});
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) =>{
        if (err) {
            return res.status(401).json.JWT_SECRET({ message: "Invalid token"});
        }

        req.userId = decoded.id
        next();
    });
}

export default authMiddleware;