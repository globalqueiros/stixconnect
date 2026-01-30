/**
 * Wrapper para deprecar API Routes antigas e redirecionar para backend
 * 
 * Este arquivo ajuda na migração gradual, permitindo que componentes
 * continuem funcionando enquanto migram para os novos serviços
 */

/**
 * Marca uma API Route como deprecated e sugere alternativa
 */
export function deprecationWarning(oldEndpoint: string, newService: string) {
  if (process.env.NODE_ENV === 'development') {
    console.warn(
      `⚠️ DEPRECATED: ${oldEndpoint} está deprecated.\n` +
      `Use ${newService} do módulo @/app/services/`
    );
  }
}

/**
 * Mapeamento de endpoints antigos para novos serviços
 */
export const ENDPOINT_MIGRATION_MAP: Record<string, { service: string; method: string }> = {
  '/api/usuario': { service: 'userService.getUsers()', method: 'GET' },
  '/api/pacientes': { service: 'patientService.getPatients()', method: 'GET' },
  '/api/consultas': { service: 'consultationService.getConsultations()', method: 'GET' },
  '/api/agenda': { service: 'consultationService.getConsultations()', method: 'GET' },
  '/api/zoom/create': { service: 'zoomService.createMeeting()', method: 'POST' },
  '/api/upload': { service: 'fileService.uploadFile()', method: 'POST' },
};

/**
 * Verifica se um endpoint está deprecated e retorna sugestão
 */
export function getMigrationSuggestion(endpoint: string): string | null {
  const migration = ENDPOINT_MIGRATION_MAP[endpoint];
  if (migration) {
    return `Migre para: ${migration.service}`;
  }
  return null;
}
