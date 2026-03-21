exports.up = function (knex) {
  return knex.schema.createTable("usuarios", function (table) {
    table.increments("id").primary();

    // Dados básicos
    table.string("nome").notNullable();
    table.string("email").notNullable();
    table.string("senha").notNullable();

    // Controle e permissões
    table.string("perfil").defaultTo("admin"); // admin, usuario, profissional, financeiro...
    table.string("status").defaultTo("ativo"); // ativo, inativo

    // Multiempresa
    table.integer("empresa_id").unsigned().notNullable();

    // Dados profissionais
    table.boolean("recebe_agendamento").defaultTo(false);
    table.decimal("comissao_servicos", 5, 2).defaultTo(0);
    table.decimal("comissao_produtos", 5, 2).defaultTo(0);
    table.decimal("valor_por_atendimento", 10, 2).defaultTo(0);
    table.string("cargo");
    table.json("horario_trabalho");

    // Auditoria
    table.integer("criado_por").unsigned();
    table.integer("atualizado_por").unsigned();
    table.timestamp("data_criacao").defaultTo(knex.fn.now());
    table.timestamp("data_atualizacao").defaultTo(knex.fn.now());

    // Relacionamentos futuros (opcional)
    // table.foreign("empresa_id").references("id").inTable("empresa");

    table.unique(["email", "empresa_id"]); // Impede e-mails repetidos na mesma empresa
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("usuarios");
};
