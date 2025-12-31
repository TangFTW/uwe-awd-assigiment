
CREATE DATABASE IF NOT EXISTS `hkpo_mobile`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `hkpo_mobile`;

-- drop if exists
DROP TABLE IF EXISTS `mobilepost`;


CREATE TABLE `mobilepost` (
  `id`              BIGINT NOT NULL AUTO_INCREMENT,


  `mobileCode`      VARCHAR(10)  NOT NULL COMMENT 'Unique code for the mobile vehicle',
  `dayOfWeekCode`   TINYINT UNSIGNED NOT NULL COMMENT '1=Monday, 7=Sunday',
  `seq`             INT NOT NULL COMMENT 'Sequence number for the day',

 
  `nameEN`          VARCHAR(100) NOT NULL,
  `districtEN`      VARCHAR(100) NOT NULL,
  `locationEN`      VARCHAR(150) NOT NULL,
  `addressEN`       VARCHAR(255) NOT NULL,

 
  `nameTC`          VARCHAR(100) NOT NULL,
  `districtTC`      VARCHAR(100) NOT NULL,
  `locationTC`      VARCHAR(150) NOT NULL,
  `addressTC`       VARCHAR(255) NOT NULL,

  
  `nameSC`          VARCHAR(100) NOT NULL,
  `districtSC`      VARCHAR(100) NOT NULL,
  `locationSC`      VARCHAR(150) NOT NULL,
  `addressSC`       VARCHAR(255) NOT NULL,

  
  `openHour`        TIME NOT NULL,
  `closeHour`       TIME NOT NULL,
  `latitude`        DECIMAL(10,6) NOT NULL,
  `longitude`       DECIMAL(10,6) NOT NULL,


  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_mobile_day_seq` (`mobileCode`, `dayOfWeekCode`, `seq`),
  KEY `idx_districtEN` (`districtEN`),
  KEY `idx_mobileCode` (`mobileCode`),
  KEY `idx_day_time` (`dayOfWeekCode`, `openHour`, `closeHour`)

) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
