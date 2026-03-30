const jwt = require("jsonwebtoken");

module.exports = (req, res, next) => {
  const authorization = req.headers && req.headers.authorization;
  const token = authorization ? authorization.split(" ")[1] : null;
  if (!token) return res.status(401).json({ error: "No token" });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};
