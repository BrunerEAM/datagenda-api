// ✅ Migration: create_servicos.js

exports.up = function (knex) {
  return knex.schema.createTable("servicos", function (table) {
    table.increments("id").primary();
    table.string("nome").notNullable();
    table.text("descricao");
    table.decimal("preco_venda", 10, 2).notNullable();
    table.decimal("custo", 10, 2).defaultTo(0);
    table.decimal("percentual_lucro", 5, 2).defaultTo(0);
    table.decimal("valor_liquido", 10, 2).defaultTo(0);

    table.integer("grupo_id").unsigned().references("id").inTable("grupos").onDelete("SET NULL");
    table.string("cor_agenda").defaultTo("#2196f3");
    table.boolean("exige_sala").defaultTo(false);
    table.integer("sala_id").unsigned().references("id").inTable("salas").onDelete("SET NULL");

    table.enu("status", ["ativo", "inativo"]).defaultTo("ativo");
    table.integer("previsao_retorno").defaultTo(0);
    table.boolean("agendamento_online").defaultTo(false);
    table.boolean("controla_pacote").defaultTo(false);
    table.integer("quantidade_sessoes");

    table.string("foto");

    // Auditoria e multiempresa
    table.integer("empresa_id").unsigned().notNullable().references("id").inTable("empresa").onDelete("CASCADE");
    table.integer("usuario_criacao_id").unsigned().references("id").inTable("usuarios").onDelete("SET NULL");
    table.integer("usuario_atualizacao_id").unsigned().references("id").inTable("usuarios").onDelete("SET NULL");
    table.timestamp("data_cadastro").defaultTo(knex.fn.now());
    table.timestamp("data_atualizacao").defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTableIfExists("servicos");
};
