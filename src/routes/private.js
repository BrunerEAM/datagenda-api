


const express = require("express");
const router = express.Router();
const authenticateToken = require("../middleware/authMiddleware");

router.get("/validate-token", authenticateToken, (req, res) => {
  res.json({
    message: "Token válido!",
    user: req.user,
  });
});

module.exports = router;
