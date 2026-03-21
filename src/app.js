const express = require("express");
const cors = require("cors");
const path = require("path");

const routes = require("./routes");


const app = express();

// Middlewares globais
app.use(cors());
app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));


// Rotas
app.use("/api", routes);


// 404
app.use((req, res, next) => {
  res.status(404).json({ erro: "Rota não encontrada" });
});

// Tratamento de erro global
app.use((err, req, res, next) => {
  console.error("🔥 Erro interno:", err);
  res.status(500).json({
    erro: "Erro interno no servidor",
    ambiente: process.env.NODE_ENV
  });
});

module.exports = app;