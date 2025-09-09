-- MySQL dump 10.13  Distrib 8.0.41, for Win64 (x86_64)
--
-- Host: turntable.proxy.rlwy.net    Database: railway
-- ------------------------------------------------------
-- Server version	9.4.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `accidenteDamnificado`
--

DROP TABLE IF EXISTS `accidenteDamnificado`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `accidenteDamnificado` (
  `idAccidenteTransito` int NOT NULL,
  `idDamnificado` int NOT NULL,
  PRIMARY KEY (`idAccidenteTransito`,`idDamnificado`),
  KEY `idDamnificado` (`idDamnificado`),
  CONSTRAINT `accidenteDamnificado_ibfk_1` FOREIGN KEY (`idAccidenteTransito`) REFERENCES `accidenteTransito` (`idAccidenteTransito`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `accidenteDamnificado_ibfk_2` FOREIGN KEY (`idDamnificado`) REFERENCES `damnificado` (`idDamnificado`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `accidenteDamnificado`
--

LOCK TABLES `accidenteDamnificado` WRITE;
/*!40000 ALTER TABLE `accidenteDamnificado` DISABLE KEYS */;
/*!40000 ALTER TABLE `accidenteDamnificado` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `accidenteTransito`
--

DROP TABLE IF EXISTS `accidenteTransito`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `accidenteTransito` (
  `idAccidenteTransito` int NOT NULL AUTO_INCREMENT,
  `idIncidente` int NOT NULL,
  `descripcion` text,
  `idCausaAccidente` int DEFAULT NULL,
  PRIMARY KEY (`idAccidenteTransito`),
  UNIQUE KEY `idIncidente` (`idIncidente`),
  KEY `idCausaAccidente` (`idCausaAccidente`),
  CONSTRAINT `accidenteTransito_ibfk_1` FOREIGN KEY (`idIncidente`) REFERENCES `incidente` (`idIncidente`),
  CONSTRAINT `accidenteTransito_ibfk_2` FOREIGN KEY (`idCausaAccidente`) REFERENCES `causaAccidente` (`idCausaAccidente`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `accidenteTransito`
--

LOCK TABLES `accidenteTransito` WRITE;
/*!40000 ALTER TABLE `accidenteTransito` DISABLE KEYS */;
/*!40000 ALTER TABLE `accidenteTransito` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `accidenteVehiculo`
--

DROP TABLE IF EXISTS `accidenteVehiculo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `accidenteVehiculo` (
  `idAccidenteTransito` int NOT NULL,
  `idVehiculo` int NOT NULL,
  PRIMARY KEY (`idAccidenteTransito`,`idVehiculo`),
  KEY `idVehiculo` (`idVehiculo`),
  CONSTRAINT `accidenteVehiculo_ibfk_1` FOREIGN KEY (`idAccidenteTransito`) REFERENCES `accidenteTransito` (`idAccidenteTransito`) ON DELETE CASCADE,
  CONSTRAINT `accidenteVehiculo_ibfk_2` FOREIGN KEY (`idVehiculo`) REFERENCES `vehiculo` (`idVehiculo`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `accidenteVehiculo`
--

LOCK TABLES `accidenteVehiculo` WRITE;
/*!40000 ALTER TABLE `accidenteVehiculo` DISABLE KEYS */;
/*!40000 ALTER TABLE `accidenteVehiculo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `accionMaterial`
--

DROP TABLE IF EXISTS `accionMaterial`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `accionMaterial` (
  `idAccionMaterial` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  PRIMARY KEY (`idAccionMaterial`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `accionMaterial`
--

LOCK TABLES `accionMaterial` WRITE;
/*!40000 ALTER TABLE `accionMaterial` DISABLE KEYS */;
INSERT INTO `accionMaterial` VALUES (1,'Quema controlada'),(2,'Venteo'),(3,'Dilución de vapores'),(4,'Neutralización'),(5,'Trasvase');
/*!40000 ALTER TABLE `accionMaterial` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `accionPersona`
--

DROP TABLE IF EXISTS `accionPersona`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `accionPersona` (
  `idAccionPersona` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  PRIMARY KEY (`idAccionPersona`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `accionPersona`
--

LOCK TABLES `accionPersona` WRITE;
/*!40000 ALTER TABLE `accionPersona` DISABLE KEYS */;
INSERT INTO `accionPersona` VALUES (1,'Evacuación'),(2,'Descontaminación'),(3,'Confinamiento');
/*!40000 ALTER TABLE `accionPersona` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `accionesSobreMaterial`
--

DROP TABLE IF EXISTS `accionesSobreMaterial`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `accionesSobreMaterial` (
  `idAccionMaterial` int NOT NULL AUTO_INCREMENT,
  `idMatPel` int DEFAULT NULL,
  `descripcion` varchar(255) DEFAULT NULL,
  `accionRealizada` tinyint(1) NOT NULL DEFAULT '0',
  PRIMARY KEY (`idAccionMaterial`),
  KEY `idMatPel` (`idMatPel`),
  CONSTRAINT `accionesSobreMaterial_ibfk_1` FOREIGN KEY (`idMatPel`) REFERENCES `materialPeligroso` (`idMatPel`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `accionesSobreMaterial`
--

LOCK TABLES `accionesSobreMaterial` WRITE;
/*!40000 ALTER TABLE `accionesSobreMaterial` DISABLE KEYS */;
/*!40000 ALTER TABLE `accionesSobreMaterial` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `areaAfectada`
--

DROP TABLE IF EXISTS `areaAfectada`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `areaAfectada` (
  `idAreaAfectada` int NOT NULL AUTO_INCREMENT,
  `descripcion` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`idAreaAfectada`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `areaAfectada`
--

LOCK TABLES `areaAfectada` WRITE;
/*!40000 ALTER TABLE `areaAfectada` DISABLE KEYS */;
INSERT INTO `areaAfectada` VALUES (1,'Hectáreas'),(2,'Kilómetros');
/*!40000 ALTER TABLE `areaAfectada` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bombero`
--

DROP TABLE IF EXISTS `bombero`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bombero` (
  `dni` int NOT NULL,
  `nombre` varchar(20) NOT NULL,
  `apellido` varchar(20) NOT NULL,
  `legajo` varchar(20) DEFAULT NULL,
  `antiguedad` int DEFAULT NULL,
  `idRango` int DEFAULT NULL,
  `correo` varchar(100) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `esDelPlan` tinyint(1) DEFAULT '0',
  `fichaMedica` tinyint(1) DEFAULT '0',
  `fichaMedicaArchivo` varchar(255) DEFAULT NULL,
  `fechaFichaMedica` date DEFAULT NULL,
  `aptoPsicologico` tinyint(1) DEFAULT '0',
  `domicilio` varchar(150) DEFAULT NULL,
  `grupoSanguineo` varchar(5) DEFAULT NULL,
  `idUsuario` int DEFAULT NULL,
  PRIMARY KEY (`dni`),
  UNIQUE KEY `idUsuario` (`idUsuario`),
  KEY `idRango` (`idRango`),
  CONSTRAINT `bombero_ibfk_1` FOREIGN KEY (`idRango`) REFERENCES `rango` (`idRango`),
  CONSTRAINT `bombero_ibfk_2` FOREIGN KEY (`idUsuario`) REFERENCES `usuario` (`idUsuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bombero`
--

LOCK TABLES `bombero` WRITE;
/*!40000 ALTER TABLE `bombero` DISABLE KEYS */;
INSERT INTO `bombero` VALUES (1219987,'Sdaf','Dfas','LEG-A',0,13,'pasasd@pasf.com','454546512',0,NULL,NULL,'2025-07-28',1,'5542265','AB-',50),(1457781,'Gimena','Prueba','LEG-1',0,4,'prueasb@ogura.com','112448874',0,NULL,NULL,'2025-07-28',1,'asd5454','B-',48),(2143122,'Sad','Sdsad',NULL,0,1,'pruebas@pruebas.com','12334344',0,NULL,NULL,'2025-07-14',1,'sfdagdgdsfgdfg','B+',28),(4784123,'Lucho','Lucho','LEG-4',0,1,'pruebas@pruebas43215.com','1154782322',1,NULL,NULL,'2025-07-28',0,'asdsadd','O+',47),(12345687,'Lucas','Diaz','LEG-5',0,2,'pruebdsd@pruebas.com','457812354',1,NULL,NULL,'2025-07-14',1,'inventee','A+',26),(12478503,'Pedro','Perez','LEG-1123',0,8,'154542@sadsf.com','45584122',0,NULL,NULL,'2025-07-28',1,'fgfghfh','B+',52),(23134544,'Addas','Dfgs','LEG-23134544',5,12,'pru23566ebas@pruebas.com','14785113',1,NULL,NULL,'2025-07-28',1,'asdds','B+',45),(31231541,'Octavio','Garcia Larrecharte','LEG-39620671',1,3,'okigarcia06@gmail.com','3515053482',0,NULL,NULL,'2025-07-22',1,'dasda 23','A+',36),(35505555,'Diego','Diego','LEG-668',10,9,'pruebas@pruebaddfas.com','1547882235',0,NULL,NULL,'2025-07-24',1,'1547822','B+',40),(38845848,'Gabriel','Juncos','LEG-38845848',5,1,'pruebas@pruebas.com','3512279022',0,NULL,NULL,'2025-07-11',1,'Av. Colon','A+',17),(39474555,'Diego','Diego','LEG-354565',7,10,'dieg23oprueba@prueb.com','123456789',0,NULL,NULL,'2025-07-24',0,'sadsadfsdfa','A+',43),(78945654,'Nicolas','Gomez','LEG-7123',2,1,'nicolas.gomez@gmail.com','98798564',0,NULL,NULL,'2025-07-12',1,'Calle 2','A+',18);
/*!40000 ALTER TABLE `bombero` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `bomberosGrupo`
--

DROP TABLE IF EXISTS `bomberosGrupo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bomberosGrupo` (
  `idGrupo` int NOT NULL,
  `dni` int NOT NULL,
  PRIMARY KEY (`idGrupo`,`dni`),
  KEY `dni` (`dni`),
  CONSTRAINT `bomberosGrupo_ibfk_1` FOREIGN KEY (`idGrupo`) REFERENCES `grupoGuardia` (`idGrupo`) ON DELETE CASCADE,
  CONSTRAINT `bomberosGrupo_ibfk_2` FOREIGN KEY (`dni`) REFERENCES `bombero` (`dni`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bomberosGrupo`
--

LOCK TABLES `bomberosGrupo` WRITE;
/*!40000 ALTER TABLE `bomberosGrupo` DISABLE KEYS */;
/*!40000 ALTER TABLE `bomberosGrupo` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `caractDelLugar`
--

DROP TABLE IF EXISTS `caractDelLugar`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `caractDelLugar` (
  `idCaractLugar` int NOT NULL AUTO_INCREMENT,
  `descripcion` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`idCaractLugar`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `caractDelLugar`
--

LOCK TABLES `caractDelLugar` WRITE;
/*!40000 ALTER TABLE `caractDelLugar` DISABLE KEYS */;
INSERT INTO `caractDelLugar` VALUES (1,'Basural'),(2,'Bosque cultivado'),(3,'Bosque nativo'),(4,'Interfase'),(5,'Montaña'),(6,'Pastizal'),(7,'Otro');
/*!40000 ALTER TABLE `caractDelLugar` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `categoria`
--

DROP TABLE IF EXISTS `categoria`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categoria` (
  `idCategoria` int NOT NULL AUTO_INCREMENT,
  `descripcion` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`idCategoria`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `categoria`
--

LOCK TABLES `categoria` WRITE;
/*!40000 ALTER TABLE `categoria` DISABLE KEYS */;
INSERT INTO `categoria` VALUES (1,'Escape'),(2,'Fuga'),(3,'Derrame'),(4,'Explosion');
/*!40000 ALTER TABLE `categoria` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `causaAccidente`
--

DROP TABLE IF EXISTS `causaAccidente`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `causaAccidente` (
  `idCausaAccidente` int NOT NULL AUTO_INCREMENT,
  `descripcion` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`idCausaAccidente`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `causaAccidente`
--

LOCK TABLES `causaAccidente` WRITE;
/*!40000 ALTER TABLE `causaAccidente` DISABLE KEYS */;
INSERT INTO `causaAccidente` VALUES (1,'Desperfecto Mecánico'),(2,'Imprudencia'),(3,'Clima'),(4,'Otro');
/*!40000 ALTER TABLE `causaAccidente` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `causaProbable`
--

DROP TABLE IF EXISTS `causaProbable`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `causaProbable` (
  `idCausaProbable` int NOT NULL AUTO_INCREMENT,
  `descripcion` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`idCausaProbable`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `causaProbable`
--

LOCK TABLES `causaProbable` WRITE;
/*!40000 ALTER TABLE `causaProbable` DISABLE KEYS */;
INSERT INTO `causaProbable` VALUES (1,'Negligencia'),(2,'Natural'),(3,'Imprudencia'),(4,'Se desconoce');
/*!40000 ALTER TABLE `causaProbable` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `climatico`
--

DROP TABLE IF EXISTS `climatico`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `climatico` (
  `idClimatico` int NOT NULL AUTO_INCREMENT,
  `idIncidente` int NOT NULL,
  `detalle` text NOT NULL,
  `cantidadPersonasAfectadas` int DEFAULT NULL,
  `superficie` text NOT NULL,
  PRIMARY KEY (`idClimatico`)
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `climatico`
--

LOCK TABLES `climatico` WRITE;
/*!40000 ALTER TABLE `climatico` DISABLE KEYS */;
/*!40000 ALTER TABLE `climatico` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `confirmacionAsistencia`
--

DROP TABLE IF EXISTS `confirmacionAsistencia`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `confirmacionAsistencia` (
  `idConfirmacion` int NOT NULL AUTO_INCREMENT,
  `idParticipacion` int DEFAULT NULL,
  `asistio` tinyint(1) DEFAULT NULL,
  `fecha` datetime DEFAULT NULL,
  PRIMARY KEY (`idConfirmacion`),
  KEY `idParticipacion` (`idParticipacion`),
  CONSTRAINT `confirmacionAsistencia_ibfk_1` FOREIGN KEY (`idParticipacion`) REFERENCES `formParticipacion` (`idParticipacion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `confirmacionAsistencia`
--

LOCK TABLES `confirmacionAsistencia` WRITE;
/*!40000 ALTER TABLE `confirmacionAsistencia` DISABLE KEYS */;
/*!40000 ALTER TABLE `confirmacionAsistencia` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `damnificado`
--

DROP TABLE IF EXISTS `damnificado`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `damnificado` (
  `idDamnificado` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(50) DEFAULT NULL,
  `apellido` varchar(50) DEFAULT NULL,
  `idIncidente` int NOT NULL,
  `dni` varchar(20) DEFAULT NULL,
  `domicilio` varchar(100) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  `fallecio` tinyint(1) DEFAULT '0',
  PRIMARY KEY (`idDamnificado`),
  KEY `idIncidente` (`idIncidente`),
  CONSTRAINT `damnificado_ibfk_1` FOREIGN KEY (`idIncidente`) REFERENCES `incidente` (`idIncidente`)
) ENGINE=InnoDB AUTO_INCREMENT=73 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `damnificado`
--

LOCK TABLES `damnificado` WRITE;
/*!40000 ALTER TABLE `damnificado` DISABLE KEYS */;
/*!40000 ALTER TABLE `damnificado` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `denunciante`
--

DROP TABLE IF EXISTS `denunciante`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `denunciante` (
  `idDenunciante` int NOT NULL AUTO_INCREMENT,
  `dni` varchar(20) NOT NULL,
  `nombre` varchar(50) DEFAULT NULL,
  `apellido` varchar(50) DEFAULT NULL,
  `telefono` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`idDenunciante`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `denunciante`
--

LOCK TABLES `denunciante` WRITE;
/*!40000 ALTER TABLE `denunciante` DISABLE KEYS */;
/*!40000 ALTER TABLE `denunciante` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `forestal`
--

DROP TABLE IF EXISTS `forestal`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `forestal` (
  `idForestal` int NOT NULL AUTO_INCREMENT,
  `idIncidente` int NOT NULL,
  `caracteristicasLugar` int DEFAULT NULL,
  `areaAfectada` int DEFAULT NULL,
  `detalle` text COMMENT 'Detalle de lo sucedido',
  `idCausaProbable` int DEFAULT NULL COMMENT 'ID de la causa probable',
  `cantidad` int DEFAULT NULL COMMENT 'Cantidad afectada',
  PRIMARY KEY (`idForestal`),
  UNIQUE KEY `idIncidente` (`idIncidente`),
  KEY `caracteristicasLugar` (`caracteristicasLugar`),
  KEY `areaAfectada` (`areaAfectada`),
  KEY `fk_forestal_causaProbable` (`idCausaProbable`),
  CONSTRAINT `fk_forestal_causaProbable` FOREIGN KEY (`idCausaProbable`) REFERENCES `causaProbable` (`idCausaProbable`),
  CONSTRAINT `forestal_ibfk_1` FOREIGN KEY (`idIncidente`) REFERENCES `incidente` (`idIncidente`),
  CONSTRAINT `forestal_ibfk_2` FOREIGN KEY (`caracteristicasLugar`) REFERENCES `caractDelLugar` (`idCaractLugar`),
  CONSTRAINT `forestal_ibfk_3` FOREIGN KEY (`areaAfectada`) REFERENCES `areaAfectada` (`idAreaAfectada`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `forestal`
--

LOCK TABLES `forestal` WRITE;
/*!40000 ALTER TABLE `forestal` DISABLE KEYS */;
/*!40000 ALTER TABLE `forestal` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `formParticipacion`
--

DROP TABLE IF EXISTS `formParticipacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `formParticipacion` (
  `idParticipacion` int NOT NULL AUTO_INCREMENT,
  `idIncidente` int DEFAULT NULL,
  `idBombero` int DEFAULT NULL,
  `rolEnIncidente` varchar(50) DEFAULT NULL,
  `horasParticipacion` int DEFAULT NULL,
  PRIMARY KEY (`idParticipacion`),
  KEY `idIncidente` (`idIncidente`),
  KEY `idBombero` (`idBombero`),
  CONSTRAINT `formParticipacion_ibfk_1` FOREIGN KEY (`idIncidente`) REFERENCES `incidente` (`idIncidente`),
  CONSTRAINT `formParticipacion_ibfk_2` FOREIGN KEY (`idBombero`) REFERENCES `bombero` (`dni`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `formParticipacion`
--

LOCK TABLES `formParticipacion` WRITE;
/*!40000 ALTER TABLE `formParticipacion` DISABLE KEYS */;
/*!40000 ALTER TABLE `formParticipacion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `grupoGuardia`
--

DROP TABLE IF EXISTS `grupoGuardia`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `grupoGuardia` (
  `idGrupo` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  `descripcion` varchar(30) DEFAULT NULL,
  PRIMARY KEY (`idGrupo`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `grupoGuardia`
--

LOCK TABLES `grupoGuardia` WRITE;
/*!40000 ALTER TABLE `grupoGuardia` DISABLE KEYS */;
/*!40000 ALTER TABLE `grupoGuardia` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `guardiaAsignacion`
--

DROP TABLE IF EXISTS `guardiaAsignacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `guardiaAsignacion` (
  `idAsignacion` bigint NOT NULL AUTO_INCREMENT,
  `idGrupo` int NOT NULL,
  `fecha` date NOT NULL,
  `dni` int NOT NULL,
  `hora_desde` time NOT NULL,
  `hora_hasta` time NOT NULL,
  `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`idAsignacion`),
  KEY `idx_ga_grupo_fecha` (`idGrupo`,`fecha`),
  KEY `idx_ga_dni_fecha` (`dni`,`fecha`),
  CONSTRAINT `fk_ga_bombero` FOREIGN KEY (`dni`) REFERENCES `bombero` (`dni`) ON DELETE RESTRICT,
  CONSTRAINT `fk_ga_grupo` FOREIGN KEY (`idGrupo`) REFERENCES `grupoGuardia` (`idGrupo`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=104 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `guardiaAsignacion`
--

LOCK TABLES `guardiaAsignacion` WRITE;
/*!40000 ALTER TABLE `guardiaAsignacion` DISABLE KEYS */;
/*!40000 ALTER TABLE `guardiaAsignacion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `incendioEstructural`
--

DROP TABLE IF EXISTS `incendioEstructural`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `incendioEstructural` (
  `idIncendioEstructural` int NOT NULL AUTO_INCREMENT,
  `idIncidente` int NOT NULL,
  `tipoTecho` int DEFAULT NULL,
  `tipoAbertura` int DEFAULT NULL,
  `descripcion` text,
  `superficie` int DEFAULT NULL,
  `cantAmbientes` int DEFAULT NULL,
  `cantPisos` int DEFAULT NULL,
  PRIMARY KEY (`idIncendioEstructural`),
  UNIQUE KEY `idIncidente` (`idIncidente`),
  KEY `tipoTecho` (`tipoTecho`),
  KEY `tipoAbertura` (`tipoAbertura`),
  CONSTRAINT `incendioEstructural_ibfk_1` FOREIGN KEY (`idIncidente`) REFERENCES `incidente` (`idIncidente`),
  CONSTRAINT `incendioEstructural_ibfk_2` FOREIGN KEY (`tipoTecho`) REFERENCES `tipoTecho` (`idTipoTecho`),
  CONSTRAINT `incendioEstructural_ibfk_3` FOREIGN KEY (`tipoAbertura`) REFERENCES `tipoAbertura` (`idTipoAbertura`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `incendioEstructural`
--

LOCK TABLES `incendioEstructural` WRITE;
/*!40000 ALTER TABLE `incendioEstructural` DISABLE KEYS */;
/*!40000 ALTER TABLE `incendioEstructural` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `incidente`
--

DROP TABLE IF EXISTS `incidente`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `incidente` (
  `idIncidente` int NOT NULL AUTO_INCREMENT,
  `idTipoIncidente` int NOT NULL,
  `fecha` datetime DEFAULT NULL,
  `idLocalizacion` int DEFAULT NULL,
  `descripcion` text,
  `idDenunciante` int DEFAULT NULL,
  PRIMARY KEY (`idIncidente`),
  KEY `idTipoIncidente` (`idTipoIncidente`),
  KEY `incidente_ibfk_denunciante` (`idDenunciante`),
  CONSTRAINT `incidente_ibfk_1` FOREIGN KEY (`idTipoIncidente`) REFERENCES `tipoIncidente` (`idTipoIncidente`),
  CONSTRAINT `incidente_ibfk_denunciante` FOREIGN KEY (`idDenunciante`) REFERENCES `denunciante` (`idDenunciante`)
) ENGINE=InnoDB AUTO_INCREMENT=469 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `incidente`
--

LOCK TABLES `incidente` WRITE;
/*!40000 ALTER TABLE `incidente` DISABLE KEYS */;
/*!40000 ALTER TABLE `incidente` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `localizacion`
--

DROP TABLE IF EXISTS `localizacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `localizacion` (
  `idLocalizacion` int NOT NULL AUTO_INCREMENT,
  `direccion` varchar(100) DEFAULT NULL,
  `latitud` decimal(10,7) DEFAULT NULL,
  `longitud` decimal(10,7) DEFAULT NULL,
  `descripcion` text,
  PRIMARY KEY (`idLocalizacion`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `localizacion`
--

LOCK TABLES `localizacion` WRITE;
/*!40000 ALTER TABLE `localizacion` DISABLE KEYS */;
INSERT INTO `localizacion` VALUES (1,'Despeñaderos',-34.6037000,-58.3816000,'Zonas de despeñaderos y acantilados'),(2,'Zona Rural',-34.6037000,-58.3816000,'Áreas rurales y campos'),(3,'Zona Urbana',-34.6037000,-58.3816000,'Áreas urbanas y ciudades'),(4,'Zona Industrial',-34.6037000,-58.3816000,'Parques industriales y fábricas'),(5,'Zona Costera',-34.6037000,-58.3816000,'Áreas costeras y playas'),(6,'Otros',-34.6037000,-58.3816000,'Otras localizaciones no especificadas');
/*!40000 ALTER TABLE `localizacion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `matPelAccion`
--

DROP TABLE IF EXISTS `matPelAccion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `matPelAccion` (
  `idMatPel` int NOT NULL,
  `idAccionMaterial` int NOT NULL,
  PRIMARY KEY (`idMatPel`,`idAccionMaterial`),
  KEY `idAccionMaterial` (`idAccionMaterial`),
  CONSTRAINT `matPelAccion_ibfk_1` FOREIGN KEY (`idMatPel`) REFERENCES `materialPeligroso` (`idMatPel`),
  CONSTRAINT `matPelAccion_ibfk_2` FOREIGN KEY (`idAccionMaterial`) REFERENCES `accionMaterial` (`idAccionMaterial`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `matPelAccion`
--

LOCK TABLES `matPelAccion` WRITE;
/*!40000 ALTER TABLE `matPelAccion` DISABLE KEYS */;
/*!40000 ALTER TABLE `matPelAccion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `matPelAccionMaterial`
--

DROP TABLE IF EXISTS `matPelAccionMaterial`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `matPelAccionMaterial` (
  `idMatPel` int NOT NULL,
  `idAccionMaterial` int NOT NULL,
  PRIMARY KEY (`idMatPel`,`idAccionMaterial`),
  KEY `idAccionMaterial` (`idAccionMaterial`),
  CONSTRAINT `fk_matPel_accionMaterial` FOREIGN KEY (`idAccionMaterial`) REFERENCES `accionMaterial` (`idAccionMaterial`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `matPelAccionMaterial_ibfk_1` FOREIGN KEY (`idMatPel`) REFERENCES `materialPeligroso` (`idMatPel`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `matPelAccionMaterial`
--

LOCK TABLES `matPelAccionMaterial` WRITE;
/*!40000 ALTER TABLE `matPelAccionMaterial` DISABLE KEYS */;
/*!40000 ALTER TABLE `matPelAccionMaterial` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `matPelAccionPersona`
--

DROP TABLE IF EXISTS `matPelAccionPersona`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `matPelAccionPersona` (
  `idMatPel` int NOT NULL,
  `idAccionPersona` int NOT NULL,
  PRIMARY KEY (`idMatPel`,`idAccionPersona`),
  KEY `idAccionPersona` (`idAccionPersona`),
  CONSTRAINT `matPelAccionPersona_ibfk_1` FOREIGN KEY (`idMatPel`) REFERENCES `materialPeligroso` (`idMatPel`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `matPelAccionPersona`
--

LOCK TABLES `matPelAccionPersona` WRITE;
/*!40000 ALTER TABLE `matPelAccionPersona` DISABLE KEYS */;
/*!40000 ALTER TABLE `matPelAccionPersona` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `matPelAccionesSobreMaterial`
--

DROP TABLE IF EXISTS `matPelAccionesSobreMaterial`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `matPelAccionesSobreMaterial` (
  `idMatPel` int NOT NULL,
  `idAccionMaterial` int NOT NULL,
  PRIMARY KEY (`idMatPel`,`idAccionMaterial`),
  KEY `idAccionMaterial` (`idAccionMaterial`),
  CONSTRAINT `matPelAccionesSobreMaterial_ibfk_1` FOREIGN KEY (`idMatPel`) REFERENCES `materialPeligroso` (`idMatPel`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `matPelAccionesSobreMaterial_ibfk_2` FOREIGN KEY (`idAccionMaterial`) REFERENCES `accionesSobreMaterial` (`idAccionMaterial`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `matPelAccionesSobreMaterial`
--

LOCK TABLES `matPelAccionesSobreMaterial` WRITE;
/*!40000 ALTER TABLE `matPelAccionesSobreMaterial` DISABLE KEYS */;
/*!40000 ALTER TABLE `matPelAccionesSobreMaterial` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `matPelDamnificado`
--

DROP TABLE IF EXISTS `matPelDamnificado`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `matPelDamnificado` (
  `idMatPel` int NOT NULL,
  `idDamnificado` int NOT NULL,
  PRIMARY KEY (`idMatPel`,`idDamnificado`),
  KEY `idDamnificado` (`idDamnificado`),
  CONSTRAINT `matPelDamnificado_ibfk_1` FOREIGN KEY (`idMatPel`) REFERENCES `materialPeligroso` (`idMatPel`) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT `matPelDamnificado_ibfk_2` FOREIGN KEY (`idDamnificado`) REFERENCES `damnificado` (`idDamnificado`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `matPelDamnificado`
--

LOCK TABLES `matPelDamnificado` WRITE;
/*!40000 ALTER TABLE `matPelDamnificado` DISABLE KEYS */;
/*!40000 ALTER TABLE `matPelDamnificado` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `matPelTipoMatPel`
--

DROP TABLE IF EXISTS `matPelTipoMatPel`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `matPelTipoMatPel` (
  `idMatPel` int NOT NULL,
  `idTipoMatInvolucrado` int NOT NULL,
  PRIMARY KEY (`idMatPel`,`idTipoMatInvolucrado`),
  KEY `idTipoMatInvolucrado` (`idTipoMatInvolucrado`),
  CONSTRAINT `matPelTipoMatPel_ibfk_1` FOREIGN KEY (`idMatPel`) REFERENCES `materialPeligroso` (`idMatPel`) ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `matPelTipoMatPel`
--

LOCK TABLES `matPelTipoMatPel` WRITE;
/*!40000 ALTER TABLE `matPelTipoMatPel` DISABLE KEYS */;
/*!40000 ALTER TABLE `matPelTipoMatPel` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `materialPeligroso`
--

DROP TABLE IF EXISTS `materialPeligroso`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `materialPeligroso` (
  `idMatPel` int NOT NULL AUTO_INCREMENT,
  `idIncidente` int NOT NULL,
  `categoria` int DEFAULT NULL,
  `cantidadMatInvolucrado` int NOT NULL,
  `otraAccionMaterial` text,
  `otraAccionPersona` text,
  `detalleOtrasAccionesPersona` text,
  `cantidadSuperficieEvacuada` int DEFAULT NULL,
  `detalle` text,
  PRIMARY KEY (`idMatPel`),
  UNIQUE KEY `idIncidente` (`idIncidente`),
  KEY `categoria` (`categoria`),
  CONSTRAINT `materialPeligroso_ibfk_1` FOREIGN KEY (`idIncidente`) REFERENCES `incidente` (`idIncidente`),
  CONSTRAINT `materialPeligroso_ibfk_3` FOREIGN KEY (`categoria`) REFERENCES `categoria` (`idCategoria`)
) ENGINE=InnoDB AUTO_INCREMENT=42 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `materialPeligroso`
--

LOCK TABLES `materialPeligroso` WRITE;
/*!40000 ALTER TABLE `materialPeligroso` DISABLE KEYS */;
/*!40000 ALTER TABLE `materialPeligroso` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `notificacion`
--

DROP TABLE IF EXISTS `notificacion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `notificacion` (
  `idNotificacion` int NOT NULL AUTO_INCREMENT,
  `mensaje` text,
  `fecha` datetime DEFAULT NULL,
  `idUsuario` int DEFAULT NULL,
  PRIMARY KEY (`idNotificacion`),
  KEY `idUsuario` (`idUsuario`),
  CONSTRAINT `notificacion_ibfk_1` FOREIGN KEY (`idUsuario`) REFERENCES `usuario` (`idUsuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `notificacion`
--

LOCK TABLES `notificacion` WRITE;
/*!40000 ALTER TABLE `notificacion` DISABLE KEYS */;
/*!40000 ALTER TABLE `notificacion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rango`
--

DROP TABLE IF EXISTS `rango`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rango` (
  `idRango` int NOT NULL AUTO_INCREMENT,
  `descripcion` varchar(100) NOT NULL,
  PRIMARY KEY (`idRango`)
) ENGINE=InnoDB AUTO_INCREMENT=17 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rango`
--

LOCK TABLES `rango` WRITE;
/*!40000 ALTER TABLE `rango` DISABLE KEYS */;
INSERT INTO `rango` VALUES (1,'Aspirante Menor'),(2,'Aspirante Mayor'),(3,'Bombero'),(4,'Cabo'),(5,'Cabo Primero'),(6,'Sargento'),(7,'Sargento Primero'),(8,'Suboficial Principal'),(9,'Suboficial Mayor'),(10,'Oficial Ayudante'),(11,'Oficial Inspector'),(12,'Oficial Principal'),(13,'Subcomandante'),(14,'Comandante'),(15,'Comandante Mayor'),(16,'Comandante General');
/*!40000 ALTER TABLE `rango` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rescate`
--

DROP TABLE IF EXISTS `rescate`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rescate` (
  `idRescate` int NOT NULL AUTO_INCREMENT,
  `idIncidente` int NOT NULL,
  `descripcion` text,
  `lugar` text NOT NULL,
  PRIMARY KEY (`idRescate`),
  UNIQUE KEY `idIncidente` (`idIncidente`),
  CONSTRAINT `rescate_ibfk_1` FOREIGN KEY (`idIncidente`) REFERENCES `incidente` (`idIncidente`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rescate`
--

LOCK TABLES `rescate` WRITE;
/*!40000 ALTER TABLE `rescate` DISABLE KEYS */;
/*!40000 ALTER TABLE `rescate` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `rol`
--

DROP TABLE IF EXISTS `rol`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rol` (
  `idRol` int NOT NULL AUTO_INCREMENT,
  `nombreRol` varchar(50) NOT NULL,
  `descripcion` text,
  PRIMARY KEY (`idRol`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `rol`
--

LOCK TABLES `rol` WRITE;
/*!40000 ALTER TABLE `rol` DISABLE KEYS */;
INSERT INTO `rol` VALUES (1,'Administrador','Acceso total al sistema Bomberoos'),(2,'Instructor',''),(7,'Bombero','sdfasfa');
/*!40000 ALTER TABLE `rol` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sesion`
--

DROP TABLE IF EXISTS `sesion`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sesion` (
  `idSesion` int NOT NULL AUTO_INCREMENT,
  `idUsuario` int DEFAULT NULL,
  `fechaHoraInicio` datetime DEFAULT NULL,
  `fechaHoraFin` datetime DEFAULT NULL,
  PRIMARY KEY (`idSesion`),
  KEY `idUsuario` (`idUsuario`),
  CONSTRAINT `sesion_ibfk_1` FOREIGN KEY (`idUsuario`) REFERENCES `usuario` (`idUsuario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sesion`
--

LOCK TABLES `sesion` WRITE;
/*!40000 ALTER TABLE `sesion` DISABLE KEYS */;
/*!40000 ALTER TABLE `sesion` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tipoAbertura`
--

DROP TABLE IF EXISTS `tipoAbertura`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tipoAbertura` (
  `idTipoAbertura` int NOT NULL AUTO_INCREMENT,
  `descripcion` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`idTipoAbertura`)
) ENGINE=InnoDB AUTO_INCREMENT=100 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tipoAbertura`
--

LOCK TABLES `tipoAbertura` WRITE;
/*!40000 ALTER TABLE `tipoAbertura` DISABLE KEYS */;
INSERT INTO `tipoAbertura` VALUES (1,'Acero/Hierro'),(2,'Aluminio'),(3,'Madera'),(4,'Plástico'),(99,'Otro');
/*!40000 ALTER TABLE `tipoAbertura` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tipoIncidente`
--

DROP TABLE IF EXISTS `tipoIncidente`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tipoIncidente` (
  `idTipoIncidente` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  PRIMARY KEY (`idTipoIncidente`),
  UNIQUE KEY `nombre` (`nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tipoIncidente`
--

LOCK TABLES `tipoIncidente` WRITE;
/*!40000 ALTER TABLE `tipoIncidente` DISABLE KEYS */;
/*!40000 ALTER TABLE `tipoIncidente` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tipoMatInvolucrado`
--

DROP TABLE IF EXISTS `tipoMatInvolucrado`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tipoMatInvolucrado` (
  `idTipoMatInvolucrado` int NOT NULL AUTO_INCREMENT,
  `nombre` varchar(100) NOT NULL,
  PRIMARY KEY (`idTipoMatInvolucrado`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tipoMatInvolucrado`
--

LOCK TABLES `tipoMatInvolucrado` WRITE;
/*!40000 ALTER TABLE `tipoMatInvolucrado` DISABLE KEYS */;
INSERT INTO `tipoMatInvolucrado` VALUES (1,'Gas inflamable'),(2,'Sustancia corrosiva'),(3,'Explosivo'),(4,'Radiación');
/*!40000 ALTER TABLE `tipoMatInvolucrado` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tipoTecho`
--

DROP TABLE IF EXISTS `tipoTecho`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tipoTecho` (
  `idTipoTecho` int NOT NULL AUTO_INCREMENT,
  `descripcion` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`idTipoTecho`)
) ENGINE=InnoDB AUTO_INCREMENT=100 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tipoTecho`
--

LOCK TABLES `tipoTecho` WRITE;
/*!40000 ALTER TABLE `tipoTecho` DISABLE KEYS */;
INSERT INTO `tipoTecho` VALUES (1,'Chapa aislada'),(2,'Chapa metálica'),(3,'Madera/paja'),(4,'Teja'),(5,'Yeso'),(99,'Otro');
/*!40000 ALTER TABLE `tipoTecho` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tokensTemporales`
--

DROP TABLE IF EXISTS `tokensTemporales`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tokensTemporales` (
  `id` int NOT NULL AUTO_INCREMENT,
  `email` varchar(255) NOT NULL,
  `token` varchar(64) NOT NULL,
  `tipo` enum('recuperacion','confirmacion') NOT NULL,
  `expiracion` datetime NOT NULL,
  `creadoEn` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`)
) ENGINE=InnoDB AUTO_INCREMENT=36 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tokensTemporales`
--

LOCK TABLES `tokensTemporales` WRITE;
/*!40000 ALTER TABLE `tokensTemporales` DISABLE KEYS */;
/*!40000 ALTER TABLE `tokensTemporales` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `usuario`
--

DROP TABLE IF EXISTS `usuario`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuario` (
  `idUsuario` int NOT NULL AUTO_INCREMENT,
  `usuario` varchar(50) NOT NULL,
  `password` varchar(255) NOT NULL,
  `email` varchar(100) DEFAULT NULL,
  `idRol` int DEFAULT NULL,
  PRIMARY KEY (`idUsuario`),
  UNIQUE KEY `usuario` (`usuario`),
  KEY `idRol` (`idRol`),
  CONSTRAINT `usuario_ibfk_1` FOREIGN KEY (`idRol`) REFERENCES `rol` (`idRol`)
) ENGINE=InnoDB AUTO_INCREMENT=60 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `usuario`
--

LOCK TABLES `usuario` WRITE;
/*!40000 ALTER TABLE `usuario` DISABLE KEYS */;
INSERT INTO `usuario` VALUES (1,'admin','$2b$12$TYpS7Sx.1OVL2aiNTXbPAOJp9Z5TcqNKt6aalaFP17HMLi5LstAQi','pruebas@pruebas.com',1),(2,'admin123','$2b$12$zmbYZJbM1QZczcYaIAsx9eLWyMbO0Xpp1S5j5eJiK0hUzWVoF1q16','pruebas@pruebas.com',1),(16,'lucas','$2b$12$KO2xttA2EUWoJWMNSBX5J.nMoIXMz59KOPfG1IqoBGX9gQBQbya82','pruebassss@pruebas.com',1),(17,'gabriel.juncos','$2b$12$.ThfuMf85py7.12tDODPE.sTTNFIV1VzYiZsnIlnWmfaWyRLg6Q7G','gabrieljuncos@hotmail.com',2),(18,'nicolas.gomez','$2b$12$25IyA8eqbHZGMJ1k/IejoukYs.OJ./7DjFgL284hR6QPhomYH97dm','nicolass.gomez@gmail.com',2),(20,'admin145','$2b$12$8kCAEXIT9BflGVwW1Qk5w.RADDj8CmCoEkiyCq0ARZUnwpvsb9h6u','pancracio@pruebas.com',1),(21,'GFDG','$2b$12$b7ZRpweLAaxSqH5JxSp3feITB82YImJtC2P.YpPkSnCcQc3wf98om','ana.garciaaa@bomberos.com',2),(22,'jejox','$2b$12$wCKLgFEuagkOTBPf4Nk8hOPN9mCrO9YVALzMpXpjqPZhwLnNKArIq','pruesdfbas@pruebsdfas.com',2),(26,'lucas.diaz','$2b$12$.HvhvyqbmrTc24cdnrZaQ.s/hINCqR2RvW3xgaYuOWvxWpoNvFtX.','roman@roman.com',1),(28,'prueba','$2b$12$EcppWj6eDVr.bQq/dCwVsuvuRB6dnR/D2UIl7GcC7UmxYJcSyB4/S','fsadf@asd.com',1),(31,'ghdghd.dfsdfgfg','$2b$12$gVHhkHQSaA5DfXCPR5VFieyoSA3lVH5IuRoIw3TmkKlOmJ8IbqH.m','pruebsas@pruebas.com',2),(33,'sfdgfsdgsfdg.dgsdfgsdfgg','$2b$12$PaWP2uyHYbaCeZHB4UcNF.PjZxz410wdv2SGcOdGFoDi3iE.gB1ES','gabrieljuncs@hotmail.com',7),(34,'diego','$2b$10$OU1LXhTERdS19H/MJyQL1OBA7bzDYI2pWlcW7IXSaQYhwn3e3SiyW','diegociriaci@gmail.com',1),(35,'pruebas.locas','$2b$12$Rf1pDv01NMuNRVpzlkhT2OM8HvfxMNPB4bqJABGSJAcvyGV//3XzS','pruebdqas@pruebas.com',1),(36,'octavio123','$2b$12$O41Kmf5OrQsjRdPcr3pFFOlTnVhsrcngLR6y17Xn.HMhng4LoWFZu','okigarcia06@gmail.com',1),(40,'diego.diego','$2b$12$FgPXuToPXXJYyjKhXiwBnegqNTda401s4VpHvjOazAi2P3z/vziUm','pruebas@pruebaddfas.com',2),(43,'diego.diego245','$2b$12$EA1cpaZs7KIS7rlasOt/IuNQ5dQBdsjlp0iOzRFi83g.kMHS98yVq','dieg23oprueba@prueb.com',2),(44,'diegoprueba','$2b$12$HnDzz5oBwgfLvUt.NL7YfeB89ybB4/CbsVNKGkAcBAcz5lBZ/vZoC','pruebas@prueba2345s.com',1),(45,'addas.dfgs','$2b$12$yImXmlZD3JGlM55mSmUHn.y3TWrstMxPHT40tcOO9v283TbiI4Vje','pru23566ebas@pruebas.com',2),(47,'lucho.lucho','$2b$12$mXYe9NJkbXGlqy3kZn8Lg.tcxm2e76xfnuNFfHkQTgYvOd/gBUaAe','pruebas@pruebas43215.com',2),(48,'gimena.prueba','$2b$12$SkM1vD.r9yRZuqj43IiJcOJ8ON76/r9O0p8ZvSSLe3EKLjrIJWnM2','prueasb@ogura.com',2),(50,'sdaf.dfas','$2b$12$m2sCrpJWi.9xgx4gmrwizuA4/I8aYiliuuFglLZs/2DYehQbBBssG','pasasd@pasf.com',2),(52,'pedro.perez','$2b$12$KfOald.vBIc0SzT3VnRrxOOBS3ZNcr//Ys.GRQ/G60YxmasPvYsuq','154542@sadsf.com',2);
/*!40000 ALTER TABLE `usuario` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `vehiculo`
--

DROP TABLE IF EXISTS `vehiculo`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vehiculo` (
  `idVehiculo` int NOT NULL AUTO_INCREMENT,
  `patente` varchar(15) DEFAULT NULL,
  `modelo` varchar(50) DEFAULT NULL,
  `marca` varchar(50) DEFAULT NULL,
  `anio` int DEFAULT NULL,
  `aseguradora` varchar(100) DEFAULT NULL,
  `poliza` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`idVehiculo`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `vehiculo`
--

LOCK TABLES `vehiculo` WRITE;
/*!40000 ALTER TABLE `vehiculo` DISABLE KEYS */;
/*!40000 ALTER TABLE `vehiculo` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2025-08-30 19:34:05
