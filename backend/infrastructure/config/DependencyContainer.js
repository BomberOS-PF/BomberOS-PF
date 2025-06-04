import { MySQLBomberosRepository } from '../repositories/MySQLBomberosRepository.js'
import { BomberosApplicationService } from '../../application/services/BomberosApplicationService.js'
import { RestApiBomberosAdapter } from '../adapters/RestApiBomberosAdapter.js'

/**
 * Contenedor de inyección de dependencias (ABMC Básico)
 * Configura la aplicación siguiendo arquitectura hexagonal
 * 
 * ARQUITECTURA HEXAGONAL IMPLEMENTADA:
 * ===================================
 * 
 * PUERTOS (PORTS):
 * - BomberosUseCases (puerto de entrada para ABMC)
 * - IBomberosRepository (puerto de salida para persistencia)
 * 
 * ADAPTADORES (ADAPTERS):
 * - BomberosApplicationService (implementa puerto de entrada)
 * - MySQLBomberosRepository (implementa puerto de salida)
 * - RestApiBomberosAdapter (adaptador de entrada HTTP)
 */
export class DependencyContainer {
  
  constructor() {
    this.dependencies = new Map()
    this.configureDependencies()
  }

  configureDependencies() {
    // ADAPTADOR DE SALIDA (Output Adapter)
    // Repository - Adaptador de persistencia MySQL
    const bomberosRepository = new MySQLBomberosRepository()
    this.dependencies.set('bomberosRepository', bomberosRepository)
    
    // SERVICIO DE APLICACIÓN
    // Implementa puerto de entrada (casos de uso ABMC)
    const bomberosUseCases = new BomberosApplicationService(bomberosRepository)
    this.dependencies.set('bomberosUseCases', bomberosUseCases)
    
    // ADAPTADOR DE ENTRADA (Input Adapter)
    // Traduce requests HTTP a llamadas de casos de uso
    const restApiBomberosAdapter = new RestApiBomberosAdapter(bomberosUseCases)
    this.dependencies.set('restApiBomberosAdapter', restApiBomberosAdapter)
  }

  // Método para obtener dependencias
  get(dependencyName) {
    const dependency = this.dependencies.get(dependencyName)
    if (!dependency) {
      throw new Error(`Dependency '${dependencyName}' not found`)
    }
    return dependency
  }

  // Método para verificar si una dependencia existe
  has(dependencyName) {
    return this.dependencies.has(dependencyName)
  }

  // Método para listar todas las dependencias configuradas
  listDependencies() {
    return Array.from(this.dependencies.keys())
  }

  // Método para obtener estadísticas de configuración
  getConfigurationSummary() {
    return {
      totalDependencies: this.dependencies.size,
      dependencies: this.listDependencies(),
      architecture: 'Hexagonal Architecture (Ports & Adapters) - ABMC Básico',
      inputPorts: ['BomberosUseCases'],
      outputPorts: ['IBomberosRepository'],
      inputAdapters: ['RestApiBomberosAdapter'],
      outputAdapters: ['MySQLBomberosRepository'],
      applicationServices: ['BomberosApplicationService']
    }
  }
} 