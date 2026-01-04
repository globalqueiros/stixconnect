import { NextResponse } from "next/server";
import db from "../../../lib/database";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      prontuario,
      nome,
      data_nascimento,
      email,
      whatsapp,
      estadocivil,
      genero,
      endereco,
      bairro,
      complemento,
      cidade,
      estado,
      cep,
      plano,

      alergias,
      medicacoes,
      condicoes_especiais,
      habitos,
      saude_mental,
      vacinacao,
      observacoes
    } = body;

    const [pacienteResult]: any = await db.query(
      `INSERT INTO pacientes (
        numProntuario, nome, dataNascimento, email, wappNumber, estadocivil, genero,
        endereco, bairro, complemento, cidade, estado, cep, nomePlano
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        prontuario,
        nome,
        data_nascimento,
        email,
        whatsapp,
        estadocivil,
        genero,
        endereco,
        bairro,
        complemento,
        cidade,
        estado,
        cep,
        plano
      ]
    );

    const idPaciente = pacienteResult.insertId;

    await db.query(
      `INSERT INTO pacientes_clinico
      (paciente_id, alergias, medicacoes, condicoes_especiais, habitos, saude_mental, vacinacao, observacoes)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        idPaciente,
        alergias,
        medicacoes,
        condicoes_especiais,
        habitos,
        saude_mental,
        vacinacao,
        observacoes
      ]
    );

    return NextResponse.json(
      { message: "Paciente e histórico clínico salvos com sucesso!" },
      { status: 200 }
    );

  } catch (error) {
    console.error("Erro ao salvar:", error);
    return NextResponse.json(
      { error: "Erro ao salvar paciente" },
      { status: 500 }
    );
  }
}
