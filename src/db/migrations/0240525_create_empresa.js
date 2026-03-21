exports.up = function (knex) {
  knex.schema.dropTableIfExists(knex, "empresa");
  return knex.schema.createTable("empresa", function (table) {
    table.increments("id").primary();

    // Dados Gerais
    table.string("nome_empresa").notNullable();
    table.string("nome_responsavel");
    table.string("cnpj");
    table.string("cpf");
    table.string("ramo_atividade");
    table.date("data_fundacao");
    table.string("telefone");
    table.string("whatsapp");
    table.string("email");
    table.string("site");
    table.string("logotipo");
    table.timestamp("data_cadastro").defaultTo(knex.fn.now());
    table.timestamp("data_expira").notNullable().defaultTo(knex.fn.now());
    table.string("status").defaultTo("ativo");

    // Endereço
    table.string("cep");
    table.string("rua");
    table.string("numero");
    table.string("complemento");
    table.string("bairro");
    table.string("cidade");
    table.string("estado");

    // Adicionais
    table.text("politica_cancelamento");
    table.text("termo_consentimento");

    // Dados Fiscais
    table.string("inscricao_estadual");
    table.string("inscricao_municipal");
    table.string("cnae_principal");
    table.string("cnae_secundario");
    table.string("codigo_servico");
    table.string("natureza_operacao");
    table.decimal("percentual_iss", 5, 2);
    table.string("regime_tributario");
    table.string("login_prefeitura");
    table.string("senha_prefeitura");
    table.string("certificado_digital");
    table.string("senha_certificado");
    table.string("token_nfse");
    table.text("observacoes_fiscais");

    // Datas
    table.timestamp("created_at").defaultTo(knex.fn.now());
    table.timestamp("updated_at").defaultTo(knex.fn.now());
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("empresa");
  
};
