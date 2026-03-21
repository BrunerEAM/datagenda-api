// ✅ Arquivo: empresa.js (backend corrigido)


const express = require("express");
const router = express.Router();
const knex = require("../db/connection");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const autenticacao = require("../middlewares/autenticacao");

// Configuração inicial do multer (upload temporário)
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadPath = "uploads/temp/";
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext);
  },
});
const upload = multer({ storage });

// 🔍 Buscar dados da empresa
router.get("/", autenticacao, async (req, res) => {
  try {
    const { empresaId } = req;
    const empresa = await knex("empresa").where({ id: empresaId }).first();

    if (!empresa) {
      return res.status(404).json({ erro: "Empresa não encontrada." });
    }

    res.json(empresa);
  } catch (error) {
    console.log(error);
    res.status(500).json({ erro: "Erro ao buscar dados da empresa." });
  }
});



// ✅ Cadastrar ou atualizar dados da empresa
router.post(  "/",  autenticacao,  upload.fields([
    { name: "logotipo", maxCount: 1 },
    { name: "certificado_digital", maxCount: 1 },
  ]),
  async (req, res) => {
    try {
      const { empresaId } = req;
      const dados = req.body;
      const arquivos = req.files;

      let empresa = await knex("empresa").where({ id: empresaId }).first();
      let mensagem = "";

      if (empresa) {
        await knex("empresa").where({ id: empresaId }).update({
          ...dados,
          updated_at: knex.fn.now(),
        });
        mensagem = "Empresa atualizada com sucesso!";
        console.log("Dados recebido:", req.body);
      } else {
        const [id] = await knex("empresa").insert({
          ...dados,
          id: empresaId, // Garante vínculo
          percentual_iss: dados.percentual_iss || 0,
          created_at: knex.fn.now(),
        }, ["id"]);
        mensagem = "Empresa cadastrada com sucesso!";
      }

      const pastaEmpresa = `uploads/${empresaId}`;
      if (!fs.existsSync(pastaEmpresa)) {
        fs.mkdirSync(pastaEmpresa, { recursive: true });
      }

      if (arquivos?.logotipo) {
        const arquivo = arquivos.logotipo[0];
        const caminhoDestino = `${pastaEmpresa}/${arquivo.filename}`;
        fs.renameSync(arquivo.path, caminhoDestino);
        await knex("empresa").where({ id: empresaId }).update({
          logotipo: caminhoDestino,
        });
      }

      if (arquivos?.certificado_digital) {
        const arquivo = arquivos.certificado_digital[0];
        const caminhoDestino = `${pastaEmpresa}/${arquivo.filename}`;
        fs.renameSync(arquivo.path, caminhoDestino);
        await knex("empresa").where({ id: empresaId }).update({
          certificado_digital: caminhoDestino,
        });
      }




      res.json({ mensagem });
    } catch (error) {
      console.error(error);
      res.status(500).json({ erro: "Erro ao salvar os dados da empresa." });
    }
  }
);


module.exports = router;