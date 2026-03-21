const knex = require("../db/connection");

const verificarStatusEmpresa = async (req, res, next) => {
  try {
    const empresa = await knex("empresa")
      .where({ id: req.empresaId })
      .first();

    if (!empresa) {
      return res.status(403).json({ erro: "Empresa não encontrada." });
    }

    const hoje = new Date();
    const dataExpira = new Date(empresa.data_expira);

    if (empresa.status !== "ativo") {
      return res.status(403).json({ erro: "Sua licença está inativa." });
    }

    if (hoje > dataExpira) {
      return res
        .status(403)
        .json({ erro: "Sua licença expirou. Entre em contato com o Suporte." });
    }

    next();
  } catch (error) {
    console.error("Erro ao verificar status da empresa:", error);
    return res.status(500).json({ erro: "Erro interno no servidor." });
  }
};

module.exports = verificarStatusEmpresa;
