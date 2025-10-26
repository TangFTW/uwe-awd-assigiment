
REATE DATABASE IF NOT EXISTS `hkpo_mobile`
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE `hkpo_mobile`;

-- Safety: drop the table if it already exists
DROP TABLE IF EXISTS `mobilepost`;


CREATE TABLE IF NOT EXISTS `mobilepost` (
  `id`            BIGINT NOT NULL,       

  `mobileCode`    VARCHAR(10)    NOT NULL,

  `locationTC`    VARCHAR(150)   NOT NULL,
  `locationSC`    VARCHAR(150)   NOT NULL,
  `addressTC`     VARCHAR(255)   NOT NULL,

  `nameSC`        VARCHAR(100)   NOT NULL,
  `districtSC`    VARCHAR(100)   NOT NULL,
  `addressSC`     VARCHAR(255)   NOT NULL,
  `closeHour`     TIME           NOT NULL,

  `nameTC`        VARCHAR(100)   NOT NULL,
  `districtTC`    VARCHAR(100)   NOT NULL,

  `latitude`      DECIMAL(10,6)  NOT NULL,
  `openHour`      TIME           NOT NULL,
  `dayOfWeekCode` TINYINT UNSIGNED NOT NULL,

  `nameEN`        VARCHAR(100)   NOT NULL,
  `districtEN`    VARCHAR(100)   NOT NULL,
  `locationEN`    VARCHAR(150)   NOT NULL,
  `addressEN`     VARCHAR(255)   NOT NULL,

  `seq`           INT            NOT NULL,
  `longitude`     DECIMAL(10,6)  NOT NULL,

  PRIMARY KEY (`id`)
) ENGINE=InnoDB
  DEFAULT CHARSET=utf8mb4
  COLLATE=utf8mb4_unicode_ci;


ALTER TABLE `mobilepost`
  ADD UNIQUE KEY `uk_mobile_day_seq` (`mobileCode`, `dayOfWeekCode`, `seq`),
  ADD KEY `idx_districtEN` (`districtEN`),
  ADD KEY `idx_day_time` (`dayOfWeekCode`, `openHour`, `closeHour`),
  ADD KEY `idx_mobileCode` (`mobileCode`);

-- Make id auto-increment
ALTER TABLE `mobilepost`
  MODIFY `id` BIGINT NOT NULL AUTO_INCREMENT;

COMMIT;
