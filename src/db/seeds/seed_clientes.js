// seeds/seed_clientes.js

exports.seed = async function (knex) {
  // Limpa os dados existentes (em ambiente de desenvolvimento/teste)
  await knex("clientes").del();

  // Insere registros fictícios
  await knex("clientes").insert([
    {
      nome: "Empresa XYZ Ltda",
      email: "contato@xyz.com.br",
      cnpj: "12345678000199",
      telefone: "4133333333",
      cidade: "Curitiba",
      estado: "PR",
      bairro: "Centro",
      rua: "Rua das Flores",
      numero: "350",
      ativo: true,
    }
  ]);
};


//*ATENÇÃO!* montar doc sobre seed!