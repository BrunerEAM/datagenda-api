require("dotenv").config();
const app = require("./app");

const PORT = process.env.PORT || 5000;


app.listen(PORT, () => {
  console.log("==================================");
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
  console.log(`🌎 Ambiente: ${process.env.NODE_ENV}`);
  console.log(`🏢 Empresa: ${process.env.NOME_EMPRESA}`);
  console.log(`🔢 Versão: ${process.env.VERSAO}`);
  console.log(`👨‍💻 Autor: ${process.env.AUTOR}`);
  
  
});