const express = require("express");
const router = express.Router();

const authRoutes = require("./auth");
const usuariosRoutes = require("./usuarios");
const clientesRoutes = require("./clientes");
const produtos = require("./produtos");
const servicos = require("./servicos");
const salas = require("./salas");
const equipamentos = require("./equipamentos");
const gruposRoutes = require("./grupos");
const pacotes = require("./pacotes");
const MinhaEmpresa = require("./empresa");
const empresaCadastro = require("./empresaCadastro");
const alterarSenha = require("./alterarSenha");
const unidades = require("./unidades");
const feriados = require("./feriados");
const formasPagamento = require("./formasPagamento");
const estoque = require("./estoque");
const recuperarSenha = require("./recuperarSenha");
const ferramentas = require("./ferramentas");

// Públicas
router.use("/empresa/cadastro", empresaCadastro);
router.use("/auth", authRoutes);

// Protegidas
router.use("/usuarios", usuariosRoutes);
router.use("/clientes", clientesRoutes);
router.use("/produtos", produtos);
router.use("/servicos", servicos);
router.use("/salas", salas);
router.use("/equipamentos", equipamentos);
router.use("/grupos", gruposRoutes);
router.use("/pacotes", pacotes);
router.use("/empresa", MinhaEmpresa);
router.use("/alterarSenha", alterarSenha);
router.use("/unidades", unidades);
router.use("/feriados", feriados);
router.use("/formasPagamento", formasPagamento);
router.use("/estoque", estoque);
router.use("/", recuperarSenha);
router.use("/ferramentas", ferramentas);


module.exports = router;