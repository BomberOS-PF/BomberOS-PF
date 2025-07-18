import { getConnection } from '../../platform/database/connection.js';

export class MySQLAreaAfectadaRepository {
  constructor() {
    this.tableName = 'areaAfectada';
  }

  async obtenerTodas() {
    const connection = getConnection();
    const [rows] = await connection.execute(`SELECT idAreaAfectada, descripcion FROM ${this.tableName}`);
    return rows;
  }
} 