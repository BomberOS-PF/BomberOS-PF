import { getConnection } from '../platform/database/connection.js';

export class MySQLCaracteristicasLugarRepository {
  constructor() {
    this.tableName = 'caractDelLugar';
  }

  async obtenerTodas() {
    const connection = getConnection();
    const [rows] = await connection.execute(`SELECT idCaractLugar, descripcion FROM ${this.tableName}`);
    return rows;
  }
} 