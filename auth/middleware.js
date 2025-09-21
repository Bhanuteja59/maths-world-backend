const { verifyToken } = require("./jwt");
const { User } = require("../db/schema");

async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

    if (!token) return res.status(401).json({ success: false, message: "No token provided" });

    const decoded = verifyToken(token);
    if (!decoded || !decoded.id) return res.status(401).json({ success: false, message: "Invalid token" });

    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    req.user = user;
    next();
  } catch (err) {
    console.error("Auth middleware error:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
}

module.exports = authMiddleware;
