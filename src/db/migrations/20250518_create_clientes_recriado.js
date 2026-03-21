exports.up = function (knex) {
  return knex.schema.createTable("clientes", (table) => {
    table.increments("id").primary();
    table.integer("empresa_id").notNullable().references("id").inTable("empresa").onDelete("CASCADE");
    table.string("nome").notNullable();
    table.string("email").notNullable();
    table.string("telefone");
    table.string("cpf");
    table.string("cnpj");
    table.date("nascimento");
    table.string("cep");
    table.string("cidade");
    table.string("bairro");
    table.string("rua");
    table.string("numero");
    table.string("complemento");
    table.string("estado");
    table.string("endereco");
    table.text("observacoes");
    table.boolean("ativo").defaultTo(true);
    table.string("foto");
    table.timestamp("data_cadastro").defaultTo(knex.fn.now());
    table.timestamp("data_atualizacao").defaultTo(knex.fn.now());

    // Auditoria
    table.integer("usuario_criacao_id").references("id").inTable("usuarios").onDelete("SET NULL");
    table.integer("atualizado_por").references("id").inTable("usuarios").onDelete("SET NULL");
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("clientes");
};
