// respuestaServiceFactory.js
import { BomberoService } from './bombero.service.js';
import { RespuestaIncidenteService } from './respuesta-incidente.service.js';
import { RespuestaIncidenteTelegramService } from './RespuestaIncidenteTelegramService.js';

import { MySQLBomberoRepository } from '../repositories/bombero.repository.js';
import { MySQLUsuarioRepository } from '../repositories/usuario.repository.js';

const bomberoRepository = new MySQLBomberoRepository();
const usuarioRepository = new MySQLUsuarioRepository();

import { WhatsAppService } from './whatsapp.service.js';
import { TelegramService } from './telegram.service.js';

import { MySQLRespuestaIncidenteRepository } from '../repositories/respuesta-incidente.repository.js';

import { loadConfig } from '../../config/environment.js';
const config = loadConfig();
// repo
const respuestaRepository = new MySQLRespuestaIncidenteRepository();

// services base
const bomberoService = new BomberoService(
  bomberoRepository,
  usuarioRepository
);


// ⚠️ CREAR ESTOS (esto te faltaba)
const whatsappService = new WhatsAppService(config);
//para telegram sacamos los datos desde el .env
const telegramService = new TelegramService();

// estrategias
const estrategias = {
  whatsapp: () =>
    new RespuestaIncidenteService(
      respuestaRepository,
      bomberoService,
      whatsappService
    ),

  telegram: () =>
    new RespuestaIncidenteTelegramService(
      respuestaRepository,
      bomberoService,
      telegramService
    )
};

export function crearRespuestaService() {
  const serviceType = process.env.NOTIFICATION_CHANNEL?.toLowerCase();

  const estrategia = estrategias[serviceType];

  if (!estrategia) {
    throw new Error(
      `NOTIFICATION_CHANNEL inválido o no soportado: ${serviceType}`
    );
  }

  return estrategia();
}