exports.up = function (knex) {
  return knex.schema.createTable("feriados", function (table) {
    table.increments("id").primary();
    table.integer("empresa_id").unsigned().notNullable()
      .references("id").inTable("empresa").onDelete("CASCADE");

    table.date("data").notNullable();
    table.string("descricao").notNullable();
    

    table.enu("abrangencia", ["nacional", "estadual", "municipal", "empresa"])
      .defaultTo("nacional")
      .notNullable();

    table.string("uf"); // Para abrangência estadual
    table.string("municipio"); // Para abrangência municipal

    table.enu("status", ["ativo", "inativo"]).defaultTo("ativo").notNullable();

    table.timestamp("data_cadastro").defaultTo(knex.fn.now());
    table.timestamp("data_atualizacao").defaultTo(knex.fn.now());

    table.integer("usuario_criacao_id").unsigned();
    table.integer("atualizado_por").unsigned();
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("feriados");
};
