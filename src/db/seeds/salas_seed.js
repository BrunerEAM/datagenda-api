// arquivo: seeds/20250612_salas_seed.js

exports.seed = async function (knex) {
  // Limpa as salas antes (opcional em ambiente de teste)
  await knex("salas").del();

  // Define empresa para o seed (ajuste o ID real da sua empresa de teste)
  const empresaId = 1;

  const salas = [
    { nome: "Sala 1", descricao: "Sala principal de atendimento", status: "ativo", empresa_id: empresaId },
    { nome: "Sala 2", descricao: "Consultório médico", status: "ativo", empresa_id: empresaId },
    { nome: "Sala 3", descricao: "Sala de estética", status: "ativo", empresa_id: empresaId },
    { nome: "Sala 4", descricao: "Sala de depilação", status: "ativo", empresa_id: empresaId },
    { nome: "Sala 5", descricao: "Fisioterapia adulto", status: "ativo", empresa_id: empresaId },
    { nome: "Sala 6", descricao: "Fisioterapia infantil", status: "ativo", empresa_id: empresaId },
    { nome: "Sala 7", descricao: "Sala de triagem", status: "ativo", empresa_id: empresaId },
    { nome: "Sala 8", descricao: "Consultório psicológico", status: "ativo", empresa_id: empresaId },
    { nome: "Sala 9", descricao: "Consultório odontológico", status: "ativo", empresa_id: empresaId },
    { nome: "Sala 10", descricao: "Sala de pequenos procedimentos", status: "ativo", empresa_id: empresaId },
  ];

  await knex("salas").insert(salas);
};
