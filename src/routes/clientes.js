const express = require("express");
const router = express.Router();
const knex = require("../db/connection");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const autenticacao = require("../middlewares/autenticacao");

// 📦 Configuração do multer para upload de fotos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const empresaId = req.empresaId;
    const dir = `./uploads/${empresaId}/clientes`;
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const nomeArquivo = `cliente_${Date.now()}${ext}`;
    cb(null, nomeArquivo);
  },
});

const upload = multer({ storage: storage });

// ✅ Listar clientes
router.get("/", autenticacao, async (req, res) => {
  try {
    const { filtro, pesquisa, data_inicio, data_fim, nome} = req.query;
    const { empresaId } = req;
    let query = knex("clientes").where({ empresa_id: empresaId });

    if (filtro === "ativos") query.andWhere("ativo", true);
    if (filtro === "inativos") query.andWhere("ativo", false);
    if (pesquisa) {
      query.andWhere((qb) => {
        qb.where("nome", "ilike", `%${pesquisa}%`)
          .orWhere("email", "ilike", `%${pesquisa}%`)
          .orWhere("cpf", "ilike", `%${pesquisa}%`)
          .orWhere("cnpj", "ilike", `%${pesquisa}%`);
      });
    }

    if (data_inicio && data_fim) {
      query.andWhereBetween("data_cadastro", [data_inicio, data_fim]);
    } else if (data_inicio) {
      query.andWhere("data_cadastro", ">=", data_inicio);
    } else if (data_fim) {
      query.andWhere("data_cadastro", "<=", data_fim);
    }

    if (nome) {
      query.andWhere("nome", "ilike", `%${nome}%`);
    }

    const clientes = await query.select();
    res.json(clientes);
  } catch (err) {
    console.error(err);
    res.status(500).json({ erro: "Erro ao buscar clientes." });
  }
});

// ✅ Buscar cliente específico
router.get("/:id", autenticacao, async (req, res) => {
  try {
    const { id } = req.params;
    const { empresaId } = req;

    const cliente = await knex("clientes")
      .where({ id, empresa_id: empresaId })
      .first();

    if (!cliente) {
      return res.status(404).json({ erro: "Cliente não encontrado." });
    }

    res.json(cliente);
  } catch (error) {
    console.error("Erro ao buscar cliente:", error);
    res.status(500).json({ erro: "Erro ao buscar cliente." });
  }
});

// ✅ Criar cliente
router.post("/", autenticacao, upload.single("foto"), async (req, res) => {
  try {
    const dados = req.body;
    const { empresaId, userId } = req;
    const foto = req.file ? `${empresaId}/clientes/${req.file.filename}` : null;

    if (!dados.nome) {
      return res.status(400).json({ erro: "Nome e e-mail são obrigatórios!" });
    }

    const [id] = await knex("clientes").insert({
      nome: dados.nome,
      email: dados.email,
      telefone: dados.telefone,
      cpf: dados.cpf || null,
      cnpj: dados.cnpj || null,
      nascimento: dados.nascimento || null,
      endereco: dados.endereco || null,
      bairro: dados.bairro || null,
      cidade: dados.cidade || null,
      estado: dados.estado || null,
      cep: dados.cep || null,
      rua: dados.rua || null,
      numero: dados.numero || null,
      complemento: dados.complemento || null,
      observacoes: dados.observacoes || null,
      ativo: dados.ativo === "false" ? false : true,
      foto,
      empresa_id: empresaId,
      usuario_criacao_id: userId,
      data_cadastro: knex.fn.now(),
      data_atualizacao: knex.fn.now(),
    }, ["id"]);

    res.status(201).json({ mensagem: "Cliente cadastrado com sucesso!", id });
  } catch (error) {
    console.error("Erro ao cadastrar cliente:", error);
    res.status(500).json({ erro: "Erro ao salvar cliente." });
  }
});



// ✅ Atualizar cliente
router.put("/:id", autenticacao, upload.single("foto"), async (req, res) => {
  try {
    const { id } = req.params;
    const { empresaId, userId } = req;
    const dados = req.body;
    

    const cliente = await knex("clientes")
      .where({ id, empresa_id: empresaId })
      .first();

    if (!cliente) {
      return res.status(404).json({ erro: "Cliente não encontrado." });
    }


    const novaFoto = req.file ? `${empresaId}/clientes/${req.file.filename}` : cliente.foto;
    
        if (req.file && cliente.foto && cliente.foto !== novaFoto) {
          const caminhoAntigo = path.join(__dirname, "..", "uploads", cliente.foto);
          if (fs.existsSync(caminhoAntigo)) {
            fs.unlinkSync(caminhoAntigo);
          }
        }

    const dadosAtualizados = {
      nome: dados.nome,
      email: dados.email,
      telefone: dados.telefone,
      cpf: dados.cpf || null,
      cnpj: dados.cnpj || null,
      nascimento: dados.nascimento || null,
      endereco: dados.endereco || null,
      bairro: dados.bairro || null,
      cidade: dados.cidade || null,
      estado: dados.estado || null,
      cep: dados.cep || null,
      rua: dados.rua || null,
      numero: dados.numero || null,
      complemento: dados.complemento || null,
      observacoes: dados.observacoes || null,
      ativo: dados.ativo === "false" ? false : true,
      foto: novaFoto,
      atualizado_por: userId,
      data_atualizacao: knex.fn.now(),
    };

    //if (foto) dadosAtualizados.foto = foto;

    await knex("clientes")
      .where({ id, empresa_id: empresaId })
      .update(dadosAtualizados);

       // Auditoria - Compara e grava histórico de alterações
          for (const campo in dadosAtualizados) {
            const novoValor = dadosAtualizados[campo];
            const antigoValor = cliente[campo];
      
            if (`${novoValor}` !== `${antigoValor}`) {
              await knex("clientes_historico").insert({
                cliente_id: id,
                empresa_id: empresaId,
                usuario_id: userId,
                campo_alterado: campo,
                valor_antigo: antigoValor,
                valor_novo: novoValor,
                data_alteracao: knex.fn.now(),
              });
            }
          }

    res.json({ mensagem: "Cliente atualizado com sucesso!" });
  } catch (error) {
    console.error("Erro ao atualizar cliente:", error);
    res.status(500).json({ erro: "Erro ao atualizar cliente." });
  }
});


// ✅ Excluir cliente
router.delete("/:id", autenticacao, async (req, res) => {
  try {
    const { id } = req.params;
    const { empresaId } = req;

    const cliente = await knex("clientes")
      .where({ id, empresa_id: empresaId })
      .first();

    if (!cliente) {
      return res.status(404).json({ erro: "Cliente não encontrado." });
    }

     // ⚠️ Remover imagem do disco se existir
            if (cliente.foto) {
              const caminhoFoto = path.join(__dirname, "..", "uploads", cliente.foto);
              if (fs.existsSync(caminhoFoto)) {
                fs.unlinkSync(caminhoFoto);
              }
            }

    await knex("clientes")
      .where({ id, empresa_id: empresaId })
      .del();

    res.json({ mensagem: "Cliente excluído com sucesso!" });
  } catch (error) {
    console.error("Erro ao excluir cliente:", error);
    res.status(500).json({ erro: "Erro ao excluir cliente." });
  }
});

module.exports = router;
