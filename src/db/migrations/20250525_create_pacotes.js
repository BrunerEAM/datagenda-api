exports.up = function (knex) {
  return knex.schema
    .createTable("pacotes", function (table) {
      table.increments("id").primary();
      table.integer("empresa_id").notNullable().index(); // suporte multiempresa
      table.string("nome").notNullable();
      table.string("status").defaultTo("ativo");
      table.decimal("valor_total", 10, 2).defaultTo(0);
      table.integer("validade_dias").defaultTo(0);
      table.text("observacoes_internas");
      table.text("observacoes_externas");
      table.decimal("comissao_percentual", 5, 2).defaultTo(0);
      table.boolean("permite_alterar_valor").defaultTo(false);
      table.boolean("venda_online").defaultTo(false);
      table.integer("sessoes_totais").defaultTo(0);
      table.timestamp("data_cadastro").defaultTo(knex.fn.now());
    })

    .createTable("pacote_itens", function (table) {
      table.increments("id").primary();
      table.integer("empresa_id").notNullable().index();
      table.integer("pacote_id").unsigned().references("id").inTable("pacotes").onDelete("CASCADE");
      table.string("pacote_nome").nullable();
      table.string("tipo").notNullable(); // 'produto', 'servico', 'pacote'
      table.integer("item_id").notNullable(); // id do item correspondente (produto, serviço ou pacote)
      table.string("nome_item").notNullable(); // redundante, salva o nome atual do item
      table.decimal("valor_unitario", 10, 2).notNullable();
      table.decimal("valor_total", 10, 2).notNullable();
      table.integer("quantidade").notNullable().defaultTo(1);
      table.integer("sessoes").notNullable().defaultTo(0); // para serviços e pacotes
    });
};

exports.down = function (knex) {
  return knex.schema
    .dropTableIfExists("pacote_itens")
    .dropTableIfExists("pacotes");
};
