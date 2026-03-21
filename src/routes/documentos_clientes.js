const express = require("express");
const router = express.Router();
const knex = require("../db/connection"); // ajuste conforme o nome do seu arquivo de conexão
const autenticacao = require("../middlewares/autenticacao");
const PdfPrinter = require("pdfmake");
const path = require("path");

// Config fonts (use Roboto do pdfmake ou copie para pasta /fonts)
const fonts = {
  Roboto: {
    normal: path.join(__dirname, "../fonts/Roboto-Regular.ttf"),
    bold: path.join(__dirname, "../fonts/Roboto-Medium.ttf"),
    italics: path.join(__dirname, "../fonts/Roboto-Italic.ttf"),
    bolditalics: path.join(__dirname, "../fonts/Roboto-MediumItalic.ttf"),
  },
};

// Helper para normalizar estrutura_json
function parseEstrutura(raw) {
  try {
    const parsed = typeof raw === "string" ? JSON.parse(raw) : raw || [];
    if (Array.isArray(parsed)) return parsed;
    if (parsed && Array.isArray(parsed.task_data)) return parsed.task_data;
    return [];
  } catch {
    return [];
  }
}

// ===================================================================
// 1) GERAR LINK PARA CLIENTE
// ===================================================================
router.post("/:id/gerar-link", autenticacao, async (req, res) => {
  try {
    const { empresaId } = req;
    const { id } = req.params; // documento_id
    const { cliente_id } = req.body;

    const documento = await knex("documentos")
      .where({ id, empresa_id: empresaId })
      .first();

    if (!documento) {
      return res.status(404).json({ erro: "Documento não encontrado." });
    }

    const [novo] = await knex("documentos_clientes")
      .insert({
        documento_id: id,
        cliente_id,
      })
      .returning(["id", "link_uuid"]);

    const link = `${process.env.APP_URL}/public/documentos/${novo.link_uuid}`;
    res.json({ mensagem: "Link gerado com sucesso!", link, id: novo.id });
  } catch (err) {
    console.error("Erro ao gerar link:", err);
    res.status(500).json({ erro: "Erro ao gerar link do documento." });
  }
});

// ===================================================================
// 2) ROTA PÚBLICA PARA CLIENTE ABRIR
// ===================================================================
router.get("/public/:uuid", async (req, res) => {
  try {
    const { uuid } = req.params;

    const docCliente = await knex("documentos_clientes as dc")
      .join("documentos as d", "dc.documento_id", "d.id")
      .select(
        "dc.id as doc_cliente_id",
        "dc.status",
        "dc.respostas",
        "d.nome",
        "d.estrutura_json"
      )
      .where("dc.link_uuid", uuid)
      .first();

    if (!docCliente) {
      return res.status(404).json({ erro: "Documento não encontrado." });
    }

    const estrutura = parseEstrutura(docCliente.estrutura_json);

    res.json({
      id: docCliente.doc_cliente_id,
      nome: docCliente.nome,
      status: docCliente.status,
      estrutura_json: estrutura,
      respostas: docCliente.respostas || {},
    });
  } catch (err) {
    console.error("Erro ao buscar documento público:", err);
    res.status(500).json({ erro: "Erro ao buscar documento." });
  }
});

// ===================================================================
// 3) CLIENTE RESPONDE E ASSINA
// ===================================================================
router.post("/public/:uuid/responder", async (req, res) => {
  try {
    const { uuid } = req.params;
    const { respostas, assinatura } = req.body;

    const atualizado = await knex("documentos_clientes")
      .where("link_uuid", uuid)
      .update({
        respostas: respostas || {},
        assinatura: assinatura || null,
        status: "assinado",
        updated_at: knex.fn.now(),
      })
      .returning("id");

    if (!atualizado.length) {
      return res.status(404).json({ erro: "Documento não encontrado." });
    }

    res.json({ mensagem: "Documento assinado com sucesso!" });
  } catch (err) {
    console.error("Erro ao responder documento:", err);
    res.status(500).json({ erro: "Erro ao responder documento." });
  }
});

// ===================================================================
// 4) GERAR PDF FINAL (DOCUMENTO CLIENTE)
// ===================================================================
router.get("/:id/pdf", autenticacao, async (req, res) => {
  try {
    const { empresaId } = req;
    const { id } = req.params;

    const docCliente = await knex("documentos_clientes as dc")
      .join("documentos as d", "dc.documento_id", "d.id")
      .select(
        "dc.id",
        "dc.respostas",
        "dc.assinatura",
        "d.nome",
        "d.estrutura_json",
        "dc.status"
      )
      .where("dc.id", id)
      .first();

    if (!docCliente) {
      return res.status(404).json({ erro: "Documento não encontrado." });
    }

    const estrutura = parseEstrutura(docCliente.estrutura_json);

    const content = [];
    content.push({ text: docCliente.nome, style: "header" });
    content.push("\n");

    estrutura.forEach((campo) => {
      const key = campo.name || campo.field_name || campo.key || campo.id;
      const label = campo.label || key || "Campo";
      const resposta = (key && docCliente.respostas?.[key]) ?? "";
      content.push({
        columns: [
          { width: "30%", text: `${label}:`, bold: true },
          { width: "*", text: String(resposta) },
        ],
        margin: [0, 2, 0, 2],
      });
    });

    if (docCliente.assinatura) {
      content.push("\n");
      content.push({ text: "Assinatura:", bold: true });
      content.push({ image: docCliente.assinatura, width: 200 }); // assinatura em base64
    }

    const printer = new PdfPrinter(fonts);
    const docDefinition = {
      content,
      styles: {
        header: { fontSize: 16, bold: true, margin: [0, 0, 0, 10] },
      },
    };

    const pdfDoc = printer.createPdfKitDocument(docDefinition);
    res.setHeader("Content-Type", "application/pdf");
    pdfDoc.pipe(res);
    pdfDoc.end();
  } catch (err) {
    console.error("Erro ao gerar PDF final:", err);
    res.status(500).json({ erro: "Erro ao gerar PDF final." });
  }
});

// ===================================================================
// 5) LISTAR DOCUMENTOS DE UM CLIENTE
// ===================================================================
router.get("/", autenticacao, async (req, res) => {
  try {
    const { cliente_id } = req.query;
    const { empresaId } = req;

    if (!cliente_id) {
      return res.status(400).json({ erro: "Informe o cliente_id" });
    }

    const docs = await knex("documentos_clientes as dc")
      .join("documentos as d", "dc.documento_id", "d.id")
      .select(
        "dc.id",
        "d.nome as documento_nome",
        "dc.status",
        "dc.created_at",
        "dc.updated_at",
        "dc.link_uuid"
      )
      .where("dc.cliente_id", cliente_id)
      .andWhere("d.empresa_id", empresaId)
      .orderBy("dc.created_at", "desc");

    const data = docs.map((doc) => ({
      ...doc,
      link: `${process.env.APP_URL}/public/documentos/${doc.link_uuid}`,
    }));

    res.json({ data });
  } catch (err) {
    console.error("Erro ao listar documentos do cliente:", err);
    res.status(500).json({ erro: "Erro ao listar documentos do cliente." });
  }
});

module.exports = router;
