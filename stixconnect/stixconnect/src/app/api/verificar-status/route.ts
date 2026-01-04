import db from '../../lib/db'; // Certifique-se de que o caminho está correto
import { RowDataPacket } from 'mysql2'; // Importar RowDataPacket

// Tipo para os resultados da consulta
interface Beneficio {
  beneficio_id: number; // Ajuste conforme os dados da tabela
}

export async function GET(req: Request) {
  // Pegando o id do usuário dos parâmetros da URL (por exemplo: /api/verificar-status?id=123)
  const url = new URL(req.url);
  const id = url.searchParams.get('id');

  if (!id) {
    return new Response(
      JSON.stringify({ error: 'ID do usuário não fornecido' }),
      { status: 400 }
    );
  }

  try {
    // Executando a consulta e tipando o retorno como RowDataPacket[]
    const [rows] = await db.execute<RowDataPacket[]>(
      'SELECT * FROM representante_beneficios WHERE representante_id = ?',
      [id]
    );

    if (rows.length > 0) {
      // Fazendo o cast para o tipo Beneficio, já que RowDataPacket[] não tem tipagem específica
      const beneficio = rows[0] as Beneficio;
      return new Response(
        JSON.stringify({ beneficio_id: beneficio.beneficio_id }), // Retorna o benefício desejado
        { status: 200 }
      );
    } else {
      return new Response(
        JSON.stringify({ error: 'Usuário não encontrado' }),
        { status: 404 }
      );
    }
  } catch (error) {
    return new Response(
      JSON.stringify({ error: 'Erro ao consultar o banco de dados' }),
      { status: 500 }
    );
  }
}
