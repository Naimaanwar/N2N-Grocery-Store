-- MySQL dump 10.13  Distrib 26.7.0, for Win64 (x86_64)
--
-- Host: localhost    Database: grocery_store
-- ------------------------------------------------------
-- Server version	26.7.0

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!50503 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
--
-- GTID state at the beginning of the backup 
--

--
-- Table structure for table `orders`
--

DROP TABLE IF EXISTS `orders`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `orders` (
  `id` int NOT NULL AUTO_INCREMENT,
  `order_number` varchar(20) NOT NULL,
  `name` varchar(100) NOT NULL,
  `phone` varchar(30) NOT NULL,
  `address` varchar(255) NOT NULL,
  `city` varchar(100) NOT NULL,
  `payment_method` varchar(50) NOT NULL,
  `items` json NOT NULL,
  `total` decimal(10,2) NOT NULL,
  `status` varchar(50) NOT NULL DEFAULT 'Pending',
  `locked` tinyint(1) NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `last_updated` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `order_number` (`order_number`)
) ENGINE=InnoDB AUTO_INCREMENT=562 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `orders`
--

LOCK TABLES `orders` WRITE;
/*!40000 ALTER TABLE `orders` DISABLE KEYS */;
INSERT INTO `orders` VALUES (1,'GS-956437','Naima Anwar','03418363149','149 gb tts','tts','cod','[{\"id\": \"milk\", \"name\": \"Fresh Milk\", \"quantity\": 2}]',540.00,'Processing',0,'2026-09-10 16:49:16','2026-09-10 16:54:10'),(52,'GS-994862','Naima Anwar','03418363149','149 gb tts','tts','cod','[{\"id\": \"mango\", \"quantity\": 1}]',400.00,'Shipped',0,'2026-09-02 10:12:35','2026-09-04 16:07:56'),(53,'GS-663659','Naima Anwar','03418363149','149 gb tts','tts','cod','[{\"id\": \"guava\", \"quantity\": 1}]',320.00,'Out for Delivery',0,'2026-09-02 10:12:36','2026-09-02 10:12:36'),(54,'GS-230973','Naima Anwar','03418363149','149 gb','tts','cod','[{\"id\": \"guava\", \"quantity\": 1}]',320.00,'Processing',0,'2026-09-02 10:12:37','2026-09-04 03:55:43'),(55,'GS-304628','Naima Anwar','03418363149','149 gb tts','tts','cod','[{\"id\": \"banana\", \"quantity\": 1}]',280.00,'Shipped',0,'2026-09-02 10:12:38','2026-09-20 15:51:39'),(56,'GS-964059','Naima Anwar','03418363149','149 gb tts','tts','cod','[{\"id\": \"mango\", \"quantity\": 1}, {\"id\": \"guava\", \"quantity\": 1}]',620.00,'Pending',0,'2026-09-02 10:12:39','2026-09-02 10:12:39'),(57,'GS-386000','Naima Anwar','03418363149','149 gb tts','tts','cod','[{\"id\": \"mango\", \"quantity\": 1}]',400.00,'Pending',0,'2026-09-02 10:12:40','2026-09-02 10:12:40'),(58,'GS-050202','Naima Anwar','03418363149','149 gb tts','tts','cod','[{\"id\": \"mango\", \"quantity\": 1}]',400.00,'Pending',0,'2026-09-02 10:14:11','2026-09-02 10:14:11'),(59,'GS-562002','Naima Anwar','03418363149','149 gb tts','tts','cod','[{\"id\": \"banana\", \"name\": \"Fresh Banana\", \"quantity\": 1}]',280.00,'Pending',0,'2026-09-02 11:46:02','2026-09-02 11:46:02'),(60,'GS-003975','Naima Anwar','03418363149','149 gb tts','tts','cod','[{\"id\": \"guava\", \"name\": \"Fresh Guava\", \"quantity\": 1}, {\"id\": \"milk\", \"name\": \"Fresh Milk\", \"quantity\": 1}]',540.00,'Pending',0,'2026-09-02 11:53:24','2026-09-03 17:59:15'),(61,'GS-242588','Naima Anwar','03418363149','149 gb tts','tts','cod','[{\"id\": \"milk\", \"name\": \"Fresh Milk\", \"quantity\": 2}]',540.00,'Pending',0,'2026-09-02 16:24:03','2026-09-02 16:24:03'),(62,'GS-384994','Naima Anwar','03418363149','149 gb tts','tts','cod','[{\"id\": \"apple\", \"name\": \"Fresh Apples\", \"quantity\": 1}]',350.00,'Pending',0,'2026-09-04 08:26:25','2026-09-04 08:26:25'),(63,'GS-960381','Naima Anwar','03418363149','149 gb tts','tts','cod','[{\"id\": \"mango\", \"name\": \"Fresh Mango\", \"quantity\": 2}]',700.00,'Pending',0,'2026-09-09 16:22:41','2026-09-09 16:22:41'),(64,'GS-874368','Naima Anwar','03418363149','149 gb tts','tts','cod','[{\"id\": \"banana\", \"name\": \"Fresh Banana\", \"quantity\": 1}]',280.00,'Pending',0,'2026-09-10 14:51:15','2026-09-10 14:51:15'),(65,'GS-088603','Naima Anwar','03418363149','149 gb tts','tts','cod','[{\"id\": \"banana\", \"name\": \"Fresh Banana\", \"quantity\": 1}, {\"id\": \"mango\", \"name\": \"Fresh Mango\", \"quantity\": 1}, {\"id\": \"guava\", \"name\": \"Fresh Guava\", \"quantity\": 2}]',1020.00,'Pending',0,'2026-09-10 14:54:49','2026-09-10 14:54:49'),(66,'GS-303723','Naima Anwar','03418363149','149 gb tts','tts','cod','[{\"id\": \"mango\", \"name\": \"Fresh Mango\", \"quantity\": 1}]',400.00,'Pending',0,'2026-09-10 14:58:24','2026-09-10 14:58:24'),(67,'GS-210143','Naima Anwar','03418363149','149 gb tts','tts','cod','[{\"id\": \"mango\", \"name\": \"Fresh Mango\", \"quantity\": 1}]',400.00,'Pending',0,'2026-09-10 16:36:50','2026-09-10 16:36:50'),(68,'GS-661244','Naima Anwar','03418363149','149 gb tts','tts','cod','[{\"id\": \"guava\", \"name\": \"Fresh Guava\", \"quantity\": 2}]',540.00,'Pending',0,'2026-09-10 18:07:41','2026-09-10 18:07:41'),(69,'GS-868139','Naima Anwar','03418363149','149 gb tts','tts','cod','[{\"id\": \"guava\", \"name\": \"Fresh Guava\", \"quantity\": 2}, {\"id\": \"banana\", \"name\": \"Fresh Banana\", \"quantity\": 1}]',720.00,'Pending',0,'2026-09-10 18:11:08','2026-09-10 18:11:08'),(103,'GS-023533','Naima Anwar','03418363149','149 gb tts','tts','cod','[{\"id\": \"apple\", \"name\": \"Fresh Apples\", \"quantity\": 6}]',1600.00,'Pending',0,'2026-09-11 15:20:23','2026-09-11 15:20:23'),(104,'GS-370760','Naima Anwar','03418363149','149 gb tts','tts','cod','[{\"id\": \"saag\", \"name\": \"saag\", \"quantity\": 5}]',600.00,'Shipped',0,'2026-09-11 15:26:10','2026-09-13 15:18:21'),(105,'GS-811260','Naima Anwar','03418363149','149 gb tts','tts','cod','[{\"id\": \"lays\", \"name\": \"lays\", \"quantity\": 5}]',400.00,'Delivered',0,'2026-09-11 16:23:31','2026-09-12 16:29:37'),(154,'GS-852965','Naima Anwar','03472113258','149 gb tts','tts','cod','[{\"id\": \"mango\", \"name\": \"Fresh Mango\", \"quantity\": 1}]',400.00,'Shipped',0,'2026-09-12 16:50:53','2026-09-12 16:52:41'),(155,'N2N-000001','Naima Anwar','03418363149','149 gb tts','tts','cod','[{\"id\": \"mango\", \"name\": \"Fresh Mango\", \"quantity\": 1}]',400.00,'Pending',0,'2026-09-12 17:04:22','2026-09-12 17:04:22'),(156,'N2N-000002','Naima Anwar','03472113258','149 gb tts','tts','cod','[{\"id\": \"mango\", \"name\": \"Fresh Mango\", \"quantity\": 1}]',400.00,'Pending',0,'2026-09-12 17:06:58','2026-09-12 17:06:58'),(157,'N2N-000003','Naima Anwar','03418363149','149 gb tts','tts','cod','[{\"id\": \"banana\", \"name\": \"Fresh Banana\", \"quantity\": 3}]',640.00,'Shipped',0,'2026-09-12 17:09:21','2026-09-13 07:54:49'),(205,'N2N-000004','Naima Anwar','03418363149','149 gb tts','tts','cod','[{\"id\": \"banana\", \"name\": \"Fresh Banana\", \"quantity\": 5}, {\"id\": \"mango\", \"name\": \"Fresh Mango\", \"quantity\": 1}]',1300.00,'Pending',0,'2026-09-13 09:55:33','2026-09-13 09:55:33'),(206,'N2N-000005','Naima Anwar','03418363149','149 gb tts','tts','cod','[{\"id\": \"mango\", \"name\": \"Fresh Mango\", \"quantity\": 1}]',400.00,'Pending',0,'2026-09-13 10:02:23','2026-09-13 10:02:23'),(207,'N2N-000006','Naima Anwar','03418363149','149 gb tts','tts','cod','[{\"id\": \"mango\", \"name\": \"Fresh Mango\", \"quantity\": 2}]',700.00,'Pending',0,'2026-09-13 10:11:12','2026-09-13 10:11:12'),(208,'N2N-000007','Naima Anwar','03418363149','149 gb tts','tts','cod','[{\"id\": \"mango\", \"name\": \"Fresh Mango\", \"quantity\": 1}]',400.00,'Pending',0,'2026-09-13 10:16:42','2026-09-13 10:16:42'),(209,'N2N-000008','Naima Anwar','03418363149','149 gb tts','tts','cod','[{\"id\": \"strawberry\", \"name\": \"Fresh Strawberry\", \"quantity\": 2}]',1000.00,'Pending',0,'2026-09-13 10:20:41','2026-09-13 10:20:41'),(256,'N2N-000009','Naima Anwar','03418363149','149 gb tts','tts','cod','[{\"id\": \"mango\", \"name\": \"Fresh Mango\", \"quantity\": 1}]',400.00,'Pending',0,'2026-09-13 11:04:08','2026-09-13 11:04:08'),(257,'N2N-000010','Naima Anwar','03418363149','149 gb tts','tts','cod','[{\"id\": \"banana\", \"name\": \"Fresh Banana\", \"quantity\": 4}]',820.00,'Pending',0,'2026-09-13 11:13:09','2026-09-13 11:13:09'),(258,'N2N-000011','Naima Anwar','03418363149','149 gb tts','tts','cod','[{\"id\": \"guava\", \"name\": \"Fresh Guava\", \"quantity\": 2}]',540.00,'Pending',0,'2026-09-13 11:16:52','2026-09-13 11:16:52'),(259,'N2N-000012','Naima Anwar','03418363149','149 gb tts','tts','cod','[{\"id\": \"strawberry\", \"name\": \"Fresh Strawberry\", \"quantity\": 3}]',1450.00,'Pending',0,'2026-09-13 11:21:16','2026-09-13 11:21:16'),(260,'N2N-000013','Naima Anwar','03418363149','149 gb tts','tts','cod','[{\"id\": \"strawberry\", \"name\": \"Fresh Strawberry\", \"quantity\": 3}, {\"id\": \"banana\", \"name\": \"Fresh Banana\", \"quantity\": 5}]',2350.00,'Pending',0,'2026-09-13 11:26:04','2026-09-13 11:26:04'),(261,'N2N-000014','Naima Anwar','03070407149','149 gb tts','tts','cod','[{\"id\": \"mango\", \"name\": \"Fresh Mango\", \"quantity\": 3}]',1000.00,'Pending',0,'2026-09-13 12:47:59','2026-09-13 12:47:59'),(262,'N2N-000015','Naima Anwar','03070407149','149 gb tts','tts','cod','[{\"id\": \"mango\", \"name\": \"Fresh Mango\", \"quantity\": 3}]',1000.00,'Pending',0,'2026-09-13 12:48:57','2026-09-13 12:48:57'),(263,'N2N-000016','Naima Anwar','03418363149','149 gb tts','tts','cod','[{\"id\": \"mango\", \"name\": \"Fresh Mango\", \"quantity\": 2}]',700.00,'Pending',0,'2026-09-13 12:52:37','2026-09-13 12:52:37'),(264,'N2N-000017','Naima Anwar','03070407149','149 gb tts','tts','cod','[{\"id\": \"mango\", \"name\": \"Fresh Mango\", \"quantity\": 4}]',1300.00,'Pending',0,'2026-09-13 12:53:23','2026-09-13 12:53:23'),(265,'N2N-000018','Naima Anwar','03418363149','149 gb tts','tts','cod','[{\"id\": \"mango\", \"name\": \"Fresh Mango\", \"quantity\": 4}, {\"id\": \"banana\", \"name\": \"Fresh Banana\", \"quantity\": 2}]',1660.00,'Pending',0,'2026-09-13 13:13:14','2026-09-13 13:13:14'),(266,'N2N-000019','Naima Anwar','03418363149','149 gb tts','tts','cod','[{\"id\": \"mango\", \"name\": \"Fresh Mango\", \"quantity\": 2}]',700.00,'Pending',0,'2026-09-13 14:56:24','2026-09-13 14:56:24'),(267,'N2N-000020','Naima Anwar','03418363149','149 gb tts','tts','cod','[{\"id\": \"banana\", \"name\": \"Fresh Banana\", \"quantity\": 4}]',820.00,'Pending',0,'2026-09-13 14:59:08','2026-09-13 14:59:08'),(268,'N2N-000021','Naima Anwar','03418363149','149 gb tts','tts','cod','[{\"id\": \"banana\", \"name\": \"Fresh Banana\", \"quantity\": 3}]',640.00,'Pending',0,'2026-09-13 15:12:39','2026-09-13 15:12:39'),(269,'N2N-000022','Naima Anwar','03418363149','149 gb tts','tts','cod','[{\"id\": \"mango\", \"name\": \"Fresh Mango\", \"quantity\": 1}]',400.00,'Pending',0,'2026-09-13 15:16:48','2026-09-13 15:16:48'),(270,'N2N-000023','Naima Anwar','03418363149','149 gb tts','tts','cod','[{\"id\": \"banana\", \"name\": \"Fresh Banana\", \"quantity\": 1}]',280.00,'Pending',0,'2026-09-13 15:28:52','2026-09-13 15:28:52'),(271,'N2N-000024','Naima Anwar','03418363149','149 gb tts','tts','cod','[{\"id\": \"guava\", \"name\": \"Fresh Guava\", \"quantity\": 1}]',320.00,'Pending',0,'2026-09-13 15:35:15','2026-09-13 15:35:15'),(272,'N2N-000025','Naima Anwar','03418363149','149 gb tts','tts','cod','[{\"id\": \"guava\", \"name\": \"Fresh Guava\", \"quantity\": 1}, {\"id\": \"banana\", \"name\": \"Fresh Banana\", \"quantity\": 1}]',500.00,'Pending',0,'2026-09-13 15:41:58','2026-09-13 15:41:58'),(307,'N2N-000026','Naima Anwar','03418363149','149 gb tts','tts','cod','[{\"id\": \"mango\", \"name\": \"Fresh Mango\", \"quantity\": 1}]',400.00,'Pending',0,'2026-09-15 11:46:16','2026-09-15 11:46:16'),(308,'N2N-000027','Naima Anwar','03418363149','149 gb tts','tts','cod','[{\"id\": \"banana\", \"name\": \"Fresh Banana\", \"quantity\": 1}]',280.00,'Processing',0,'2026-09-15 11:49:18','2026-09-16 04:42:42'),(358,'N2N-000028','Naima Anwar','03418363149','149 gb tts','tts','cod','[{\"id\": \"mango\", \"name\": \"Fresh Mango\", \"quantity\": 2}]',700.00,'Pending',0,'2026-09-16 04:23:02','2026-09-16 04:23:02'),(359,'N2N-000029','Naima Anwar','03418363149','149 gb tts','tts','cod','[{\"id\": \"mango\", \"name\": \"Fresh Mango\", \"quantity\": 1}]',400.00,'Pending',0,'2026-09-16 04:40:51','2026-09-16 04:40:51'),(360,'N2N-000030','Naima Anwar','03418363149','149 gb tts','tts','cod','[{\"id\": \"bread\", \"name\": \"Brown Bread\", \"quantity\": 1}]',280.00,'Pending',0,'2026-09-16 09:08:50','2026-09-16 09:08:50'),(361,'N2N-000031','Naima Anwar','03418363149','149 gb tts','tts','cod','[{\"id\": \"banana\", \"name\": \"Fresh Banana\", \"quantity\": 1}]',280.00,'Out for Delivery',0,'2026-09-16 09:13:20','2026-09-16 09:15:56'),(362,'N2N-000032','Naima Anwar','03418363149','149 gb tts','tts','cod','[{\"id\": \"mango\", \"name\": \"Mango\", \"quantity\": 1}]',400.00,'Pending',0,'2026-09-16 11:51:58','2026-09-16 11:51:58'),(363,'N2N-000033','Naima Anwar','03418363149','149 gb tts','tts','cod','[{\"id\": \"mango\", \"name\": \"Mango\", \"quantity\": 1}, {\"id\": \"banana\", \"name\": \"Banana\", \"quantity\": 1}]',580.00,'Pending',0,'2026-09-16 11:53:22','2026-09-16 11:53:22'),(409,'N2N-000034','Naima Anwar','03418363149','149 gb tts','tts','cod','[{\"id\": \"guava\", \"name\": \"Guava\", \"quantity\": 1}]',320.00,'Pending',0,'2026-09-18 17:10:23','2026-09-18 17:10:23'),(460,'N2N-000035','Naima Anwar','03418363149','149 gb tts','tts','cod','[{\"id\": \"mango\", \"name\": \"Mango\", \"quantity\": 1}]',400.00,'Processing',0,'2026-09-18 17:31:14','2026-09-19 08:00:23'),(511,'N2N-000036','Naima Anwar','03418363149','149 gb tts','tts','cod','[{\"id\": \"banana\", \"name\": \"Banana\", \"quantity\": 1}, {\"id\": \"guava\", \"name\": \"Guava\", \"quantity\": 1}]',500.00,'Pending',0,'2026-09-20 16:08:15','2026-09-20 16:08:15');
/*!40000 ALTER TABLE `orders` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `products`
--

DROP TABLE IF EXISTS `products`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `products` (
  `id` int NOT NULL AUTO_INCREMENT,
  `name` varchar(100) NOT NULL,
  `price` decimal(10,2) NOT NULL,
  `category` varchar(50) NOT NULL,
  `image` text,
  `stock` int NOT NULL DEFAULT '0',
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `product_code` varchar(50) DEFAULT NULL,
  `unit` varchar(30) DEFAULT '',
  PRIMARY KEY (`id`),
  UNIQUE KEY `product_code` (`product_code`)
) ENGINE=InnoDB AUTO_INCREMENT=111 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `products`
--

LOCK TABLES `products` WRITE;
/*!40000 ALTER TABLE `products` DISABLE KEYS */;
INSERT INTO `products` VALUES (1,'Apple',250.00,'Fruits','apple.png',94,'2026-09-11 05:51:20','apple','/ kg'),(2,'Banana',180.00,'Fruits','banana.png',68,'2026-09-11 05:51:20','banana','/ dozen'),(3,'Mango',300.00,'Fruits','mango.png',65,'2026-09-11 05:51:20','mango','/ kg'),(4,'Guava',220.00,'Fruits','guava.png',94,'2026-09-11 05:51:20','guava','/ kg'),(5,'Strawberry',450.00,'Fruits','strawberry.png',92,'2026-09-11 05:51:20','strawberry','/ box'),(6,'Milk',250.00,'Dairy','milk.png',85,'2026-09-11 05:51:20','milk','/ litre'),(7,'Brown Bread',180.00,'Bakery','bread.png',99,'2026-09-11 05:51:20','bread','');
/*!40000 ALTER TABLE `products` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Dumping routines for database 'grocery_store'
--
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-09-21 17:28:51



