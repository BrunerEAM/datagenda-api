// middleware/autenticacao.js
const jwt = require("jsonwebtoken");

const autenticacao = (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    if (!token) {
        return res.status(401).json({ erro: "Token não fornecido." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Use 'id' do token, conforme ele é gerado no auth.js
        req.userId = decoded.id;
        req.empresaId = decoded.empresa_id;
        // Se 'empresaId' não estiver no token gerado no auth.js,
        // você pode removê-lo daqui se não for usado.
        // req.empresaId = decoded.empresaId;
        next();
    } catch (error) {
        return res.status(401).json({ erro: "Token inválido ou expirado." });
    }
};

module.exports = autenticacao;