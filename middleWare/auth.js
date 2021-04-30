const jwt = require('jsonwebtoken');


module.exports = {
    isAuth: (req, res, next) => {
        const token  = req.header('token');
        if(!token){
            return res.status(401).json({message:"Please login first", error:[], data:{}})
        }
        try {
            const decoded = jwt.verify(token,process.env.JWT_SECRET);
            req.user = decoded.user;
            next();
        } catch (err) {
            console.log(err,"error")
            res.status(403).json({message:"Invalid token", error:[], data:{}})
        }
    }
}