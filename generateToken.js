const jwt = require('jsonwebtoken');
require('dotenv').config(); // Para ler o .env

// Dados que você quer colocar dentro do token
const payload = {
  id: 1, // Você pode mudar pra qualquer ID ou info
};

// Gera o token
const token = jwt.sign(payload, process.env.JWT_SECRET, {
  expiresIn: '1h', // Tempo de expiração
});

console.log("Token gerado manualmente:");
console.log(token);
