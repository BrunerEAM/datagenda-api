const express = require("express");
const router = express.Router();
const knex = require("../db/connection");
const bcrypt = require("bcrypt");
const autenticacao = require("../middlewares/autenticacao");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// 📦 Configuração do multer para upload de fotos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const empresaId = req.empresaId;
    const dir = `./uploads/${empresaId}`;
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const nomeArquivo = `usuario_${Date.now()}${ext}`;
    cb(null, nomeArquivo);
  },
});

const upload = multer({ storage: storage });

// ✅ Listar usuários da empresa
router.get("/", autenticacao, async (req, res) => {
  try {
    const { empresaId } = req;
    const usuarios = await knex("usuarios")
      .where({ empresa_id: empresaId })
      .select(
        "id",
        "nome",
        "email",
        "perfil",
        "status",
        "recebe_agendamento",
        "comissao_servicos",
        "comissao_produtos",
        "valor_por_atendimento",
        "cargo",
        "horario_trabalho",
        "foto",
        "data_criacao",
        "data_atualizacao"
      );
    res.json(usuarios);
  } catch (error) {
    console.error("Erro ao buscar usuários:", error);
    res.status(500).json({ erro: "Erro ao buscar usuários." });
  }
});

// ✅ Buscar usuário específico
router.get("/:id", autenticacao, async (req, res) => {
  try {
    const { empresaId } = req;
    const { id } = req.params;

    const usuario = await knex("usuarios")
      .where({ id, empresa_id: empresaId })
      .first();

    if (!usuario) {
      return res.status(404).json({ erro: "Usuário não encontrado." });
    }

    res.json(usuario);
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    res.status(500).json({ erro: "Erro ao buscar usuário." });
  }
});

// ✅ Cadastrar usuário
router.post("/", autenticacao, upload.single("foto"), async (req, res) => {
  try {
    const {
      nome,
      email,
      senha,
      perfil,
      status,
      recebe_agendamento,
      comissao_servicos,
      comissao_produtos,
      valor_por_atendimento,
      cargo,
      horario_trabalho,
    } = req.body;
    const { empresaId, userId } = req;

    if (!nome || !email || !senha) {
      return res.status(400).json({ erro: "Nome, e-mail e senha são obrigatórios." });
    }

    const existe = await knex("usuarios")
      .where({ email: email.toLowerCase(), empresa_id: empresaId })
      .first();

    if (existe) {
      return res.status(400).json({ erro: "E-mail já cadastrado para esta empresa." });
    }

    const hash = await bcrypt.hash(senha, 10);

    const foto = req.file ? `${empresaId}/${req.file.filename}` : null;

    const [id] = await knex("usuarios").insert({
      nome,
      email: email.toLowerCase(),
      senha: hash,
      perfil: perfil || "usuario",
      status: status || "ativo",
      recebe_agendamento: recebe_agendamento === "true" || recebe_agendamento === true,
      comissao_servicos: comissao_servicos || 0,
      comissao_produtos: comissao_produtos || 0,
      valor_por_atendimento: valor_por_atendimento || 0,
      cargo,
      horario_trabalho: horario_trabalho ? JSON.stringify(horario_trabalho) : null,
      foto,
      empresa_id: empresaId,
      criado_por: userId,
      data_criacao: knex.fn.now(),
      data_atualizacao: knex.fn.now(),
    }, ["id"]);

    res.json({ mensagem: "Usuário cadastrado com sucesso.", id });
  } catch (error) {
    console.error("Erro ao cadastrar usuário:", error);
    res.status(500).json({ erro: "Erro ao cadastrar usuário." });
  }
});

// ✅ Atualizar usuário
router.put("/:id", autenticacao, upload.single("foto"), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      nome,
      email,
      senha,
      perfil,
      status,
      recebe_agendamento,
      comissao_servicos,
      comissao_produtos,
      valor_por_atendimento,
      cargo,
      horario_trabalho,
    } = req.body;
    const { empresaId, userId } = req;

    const usuario = await knex("usuarios")
      .where({ id, empresa_id: empresaId })
      .first();

    if (!usuario) {
      return res.status(404).json({ erro: "Usuário não encontrado." });
    }

    const dadosAtualizados = {
      nome,
      email: email.toLowerCase(),
      perfil,
      status,
      recebe_agendamento: recebe_agendamento === "true" || recebe_agendamento === true,
      comissao_servicos: comissao_servicos || 0,
      comissao_produtos: comissao_produtos || 0,
      valor_por_atendimento: valor_por_atendimento || 0,
      cargo,
      horario_trabalho: horario_trabalho ? JSON.stringify(horario_trabalho) : null,
      atualizado_por: userId,
      data_atualizacao: knex.fn.now(),
    };

    if (senha) {
      const hash = await bcrypt.hash(senha, 10);
      dadosAtualizados.senha = hash;
    }

    if (req.file) {
      dadosAtualizados.foto = `${empresaId}/${req.file.filename}`;
    }

    await knex("usuarios")
      .where({ id, empresa_id: empresaId })
      .update(dadosAtualizados);

    res.json({ mensagem: "Usuário atualizado com sucesso." });
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    res.status(500).json({ erro: "Erro ao atualizar usuário." });
  }
});

// ✅ Excluir usuário
router.delete("/:id", autenticacao, async (req, res) => {
  try {
    const { id } = req.params;
    const { empresaId } = req;

    const usuario = await knex("usuarios")
      .where({ id, empresa_id: empresaId })
      .first();

    if (!usuario) {
      return res.status(404).json({ erro: "Usuário não encontrado." });
    }

    await knex("usuarios")
      .where({ id, empresa_id: empresaId })
      .del();

    res.json({ mensagem: "Usuário excluído com sucesso." });
  } catch (error) {
    console.error("Erro ao excluir usuário:", error);
    res.status(500).json({ erro: "Erro ao excluir usuário." });
  }
});

module.exports = router;
