const { execute, transaction } = require('../config/database');
const logger = require('../utils/logger');

class ProfissionalService {
  
  /**
   * Obter profissional disponível para atendimento
   * @param {string} tipo - 'enfermeira' ou 'medico'
   * @param {string} especialidade - especialidade médica (opcional)
   * @param {boolean} forcarAtribuicao - ignorar disponibilidade se true
   * @returns {Promise<Object|null>} profissional encontrado ou null
   */
  static async getAvailableProfissional(tipo, especialidade = null, forcarAtribuicao = false) {
    try {
      let query = `
        SELECT p.*, 
               COUNT(c.id) as consultas_ativas,
               AVG(TIMESTAMPDIFF(MINUTE, c.created_at, COALESCE(c.updated_at, NOW()))) as tempo_medio_atendimento
        FROM profissionais p
        LEFT JOIN consultas c ON p.id = c.medico_id 
          AND c.status IN ('atendimento_medico', 'atendimento_enfermagem', 'aguardando_medico', 'aguardando_enfermeira')
        WHERE p.tipo = ? 
          AND p.ativo = 1
          ${forcarAtribuicao ? '' : 'AND p.disponivel = 1'}
          ${especialidade ? 'AND p.especialidade = ?' : ''}
        GROUP BY p.id
        ORDER BY consultas_ativas ASC, tempo_medio_atendimento ASC, p.created_at ASC
        LIMIT 1
      `;
      
      const params = especialidade ? [tipo, especialidade] : [tipo];
      
      const profissionais = await execute(query, params);
      
      if (profissionais.length === 0) {
        logger.warn(`No available professional found`, {
          tipo,
          especialidade,
          forcarAtribuicao
        });
        return null;
      }
      
      const profissional = profissionais[0];
      logger.info(`Professional assigned successfully`, {
        profissionalId: profissional.id,
        nome: profissional.nome,
        tipo,
        especialidade,
        consultasAtivas: profissional.consultas_ativas || 0
      });
      
      return profissional;
      
    } catch (error) {
      logger.error('Error getting available professional:', error);
      throw error;
    }
  }
  
  /**
   * Atualizar disponibilidade de profissional
   * @param {number} profissionalId 
   * @param {boolean} disponivel 
   */
  static async updateDisponibilidade(profissionalId, disponivel) {
    try {
      await execute(
        'UPDATE profissionais SET disponivel = ?, updated_at = NOW() WHERE id = ?',
        [disponivel ? 1 : 0, profissionalId]
      );
      
      logger.info(`Professional availability updated`, {
        profissionalId,
        disponivel
      });
      
    } catch (error) {
      logger.error('Error updating professional availability:', error);
      throw error;
    }
  }
  
  /**
   * Obter profissionais disponíveis por tipo
   * @param {string} tipo 
   * @param {string} especialidade 
   * @returns {Promise<Array>} lista de profissionais
   */
  static async getAvailableProfissionais(tipo, especialidade = null) {
    try {
      let query = `
        SELECT p.*, 
               COUNT(c.id) as consultas_ativas
        FROM profissionais p
        LEFT JOIN consultas c ON (p.id = c.medico_id OR p.id = c.enfermeira_id)
          AND c.status IN ('atendimento_medico', 'atendimento_enfermagem', 'aguardando_medico', 'aguardando_enfermeira')
        WHERE p.tipo = ? 
          AND p.disponivel = 1
          ${especialidade ? 'AND p.especialidade = ?' : ''}
        GROUP BY p.id
        ORDER BY consultas_ativas ASC, p.nome ASC
      `;
      
      const params = especialidade ? [tipo, especialidade] : [tipo];
      return await execute(query, params);
      
    } catch (error) {
      logger.error('Error getting available professionals:', error);
      throw error;
    }
  }
  
  /**
   * Verificar se profissional tem conflito de horário
   * @param {number} profissionalId 
   * @param {Date} dataHora 
   * @param {number} duracaoMinutos 
   * @returns {Promise<boolean>} true se há conflito
   */
  static async verificarConflitoHorario(profissionalId, dataHora, duracaoMinutos = 30) {
    try {
      const query = `
        SELECT COUNT(*) as conflitos
        FROM consultas c
        WHERE c.medico_id = ?
          AND c.status NOT IN ('finalizada', 'cancelada')
          AND (
            (c.data_hora_inicio <= ? AND c.data_hora_fim > ?) 
            OR (c.data_hora_inicio < ? AND c.data_hora_fim >= ?)
          )
      `;
      
      const dataFim = new Date(dataHora.getTime() + duracaoMinutos * 60000);
      
      const result = await execute(query, [
        profissionalId,
        dataHora,
        dataHora,
        dataFim,
        dataFim
      ]);
      
      return result[0].conflitos > 0;
      
    } catch (error) {
      logger.error('Error checking schedule conflict:', error);
      throw error;
    }
  }
  
  /**
   * Obter estatísticas de profissionais
   * @param {string} tipo 
   * @returns {Promise<Object>} estatísticas
   */
  static async getEstatisticasProfissionais(tipo = null) {
    try {
      let query = `
        SELECT 
          p.tipo,
          p.especialidade,
          COUNT(*) as total_profissionais,
          COUNT(CASE WHEN p.disponivel = 1 THEN 1 END) as disponiveis,
          COUNT(CASE WHEN p.ativo = 1 THEN 1 END) as ativos,
          AVG(CASE WHEN c.status = 'atendimento_medico' THEN 1 ELSE 0 END) as taxa_ocupacao
        FROM profissionais p
        LEFT JOIN consultas c ON p.id = c.medico_id 
          AND c.status IN ('atendimento_medico', 'atendimento_enfermagem')
        ${tipo ? 'WHERE p.tipo = ?' : ''}
        GROUP BY p.tipo, p.especialidade
        ORDER BY p.tipo, p.especialidade
      `;
      
      const params = tipo ? [tipo] : [];
      return await execute(query, params);
      
    } catch (error) {
      logger.error('Error getting professional statistics:', error);
      throw error;
    }
  }
  
  /**
   * Atribuir profissional automaticamente a uma consulta
   * @param {number} consultaId 
   * @param {string} tipoProfissional 
   * @param {string} especialidade 
   * @param {boolean} forcarAtribuicao 
   * @returns {Promise<Object>} profissional atribuído
   */
  static async atribuirAutomaticamente(consultaId, tipoProfissional, especialidade = null, forcarAtribuicao = false) {
    return await transaction(async (connection) => {
      // Obter profissional disponível
      const profissional = await this.getAvailableProfissional(tipoProfissional, especialidade, forcarAtribuicao);
      
      if (!profissional) {
        throw new Error(`Nenhum profissional disponível do tipo: ${tipoProfissional}`);
      }
      
      // Obter consulta atual
      const [consultas] = await connection.execute(
        'SELECT status FROM consultas WHERE id = ?',
        [consultaId]
      );
      
      if (consultas.length === 0) {
        throw new Error('Consulta não encontrada');
      }
      
      const consulta = consultas[0];
      
      // Determinar novo status e campo a atualizar
      let novoStatus, campoAtualizacao;
      if (tipoProfissional === 'enfermeira') {
        novoStatus = 'aguardando_enfermeira';
        campoAtualizacao = 'enfermeira_id';
      } else {
        novoStatus = 'aguardando_medico';
        campoAtualizacao = 'medico_id';
      }
      
      // Atualizar consulta
      await connection.execute(
        `UPDATE consultas SET ${campoAtualizacao} = ?, status = ?, updated_at = NOW() WHERE id = ?`,
        [profissional.id, novoStatus, consultaId]
      );
      
      // Registrar no histórico
      await connection.execute(
        `INSERT INTO consulta_status_history (
          consulta_id, status_anterior, status_novo, profissional_id, observacao
        ) VALUES (?, ?, ?, ?, ?)`,
        [consultaId, consulta.status, novoStatus, profissional.id, `Atribuição automática: ${profissional.nome}`]
      );
      
      return {
        consultaId,
        profissional,
        statusAnterior: consulta.status,
        novoStatus
      };
    });
  }
}

module.exports = ProfissionalService;