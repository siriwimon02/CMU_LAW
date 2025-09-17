import dotenv from 'dotenv';
dotenv.config({ path: '../.env.dev' });



function checkRole(roles = []){
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        if (roles.length && !roles.includes(req.user.role_name)) {
            console.log( "check role", roles);
            return res.status(403).json({ message: "Forbidden: insufficient role" });
        }
        
        console.log("accept to access in this roles", req.user.role_name);
        console.log(`[OK] user=${req.user.email} role=${req.user.role_name}`);
        next();
    };
}

export default checkRole;
