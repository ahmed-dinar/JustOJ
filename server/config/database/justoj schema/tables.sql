
DROP TABLE IF EXISTS `problems`;
CREATE TABLE `problems` (
  `id` INT(11) NOT NULL,
  `cid` INT(11) DEFAULT NULL,
  `title` TEXT CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `slug` TEXT CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `category` VARCHAR(100) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `difficulty` VARCHAR(30) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `status` VARCHAR(20) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `statement` LONGTEXT CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `input` LONGTEXT CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `output` LONGTEXT CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `score` INT(11) NOT NULL,
  `cpu` INT(11) DEFAULT NULL,
  `memory` INT(11) DEFAULT NULL,
  `submissions` INT(11) DEFAULT '0',
  `solved` INT(11) DEFAULT '0',
  `author` VARCHAR(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `added` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;


DROP TABLE IF EXISTS `tags`;
CREATE TABLE `tags` (
  `id` INT(11) NOT NULL,
  `pid` INT(11) NOT NULL,
  `tag` VARCHAR(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci DEFAULT ''
) ENGINE=InnoDB;


DROP TABLE IF EXISTS `submissions`;
CREATE TABLE `submissions` (
  `id` INT(11) NOT NULL,
  `pid` INT(11) NOT NULL,
  `uid` INT(11) NOT NULL,
  `language` VARCHAR(10) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `status` VARCHAR(30) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `submittime` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `cpu` INT(11) NOT NULL,
  `memory` INT(11) NOT NULL
) ENGINE=InnoDB;


DROP TABLE IF EXISTS `source_code`;
CREATE TABLE `source_code` (
  `id` INT(11) NOT NULL,
  `sid` INT(11) NOT NULL,
  `code` LONGTEXT CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL
) ENGINE=InnoDB;


DROP TABLE IF EXISTS `runs`;
CREATE TABLE `runs` (
  `id` INT(11) NOT NULL,
  `sid` INT(11) NOT NULL,
  `name` varchar(64) NOT NULL,
  `status` VARCHAR(30) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `cpu` INT(11) NOT NULL,
  `memory` INT(11) NOT NULL,
  `errortype` VARCHAR(100) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL
) ENGINE=InnoDB;


DROP TABLE IF EXISTS `users`;
CREATE TABLE `users` (
  `id` INT(11) NOT NULL,
  `username` VARCHAR(30) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `password` VARCHAR(60) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `email` VARCHAR(255) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `publicemail` TINYINT(1) NOT NULL,
  `joined` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `name` VARCHAR(300) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `website` VARCHAR(512) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `country` VARCHAR(3) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `city` VARCHAR(30) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `institute` VARCHAR(50) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `github_token` VARCHAR(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `stack_token` VARCHAR(255) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `fb_id` VARCHAR(128) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `linkedin_id` VARCHAR(128) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `google_id` VARCHAR(128) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `cf_username` VARCHAR(25) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `uva_userid` VARCHAR(15) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `role` VARCHAR(15) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `verified` TINYINT(1) NOT NULL DEFAULT 0,
  `reset_token` VARCHAR(40) CHARACTER SET utf8 COLLATE utf8_bin NOT NULL,
  `token_expires` DATETIME NOT NULL
) ENGINE=InnoDB;


DROP TABLE IF EXISTS `contest`;
CREATE TABLE `contest` (
  `id` INT(11) NOT NULL,
  `title` TEXT CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `slug` TEXT CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `begin` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `end` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `status` TINYINT(1) NOT NULL,
  `privacy` TINYINT(1) NOT NULL,
  `description` TEXT CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL
) ENGINE=InnoDB;


DROP TABLE IF EXISTS `participants`;
CREATE TABLE `participants` (
  `id` INT(11) NOT NULL,
  `cid` INT(11) NOT NULL,
  `uid` INT(11) NOT NULL
) ENGINE=InnoDB;


DROP TABLE IF EXISTS `rank`;
CREATE TABLE `rank`
(
  `id` INT(11) NOT NULL,
  `cid` INT(11) NOT NULL,
  `uid` INT(11) NOT NULL,
  `pid` INT(11) NOT NULL,
  `status` TINYINT(1) NOT NULL,
  `penalty` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `tried` INT(11) NOT NULL
) ENGINE=InnoDB;


DROP TABLE IF EXISTS `contest_submissions`;
CREATE TABLE `contest_submissions` (
  `id` INT(11) NOT NULL,
  `cid` INT(11) NOT NULL,
  `pid` INT(11) NOT NULL,
  `uid` INT(11) NOT NULL,
  `language` VARCHAR(10) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `status` VARCHAR(30) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `submittime` TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `cpu` INT(11) NOT NULL,
  `memory` INT(11) NOT NULL
) ENGINE=InnoDB;


DROP TABLE IF EXISTS `contest_runs`;
CREATE TABLE `contest_runs` (
  `id` INT(11) NOT NULL,
  `sid` INT(11) NOT NULL,
  `name` varchar(64) NOT NULL,
  `status` VARCHAR(30) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `cpu` INT(11) NOT NULL,
  `memory` INT(11) NOT NULL,
  `errortype` VARCHAR(100) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL
) ENGINE=InnoDB;


DROP TABLE IF EXISTS `contest_source`;
CREATE TABLE `contest_source` (
  `id` INT(11) NOT NULL,
  `sid` INT(11) NOT NULL,
  `code` LONGTEXT CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL
) ENGINE=InnoDB;


DROP TABLE IF EXISTS `clar`;
CREATE TABLE `clar` (
  `id` INT(11) NOT NULL,
  `cid` INT(11) NOT NULL,
  `uid` INT(11) NOT NULL,
  `pid` INT(11) NOT NULL,
  `status` VARCHAR(15) CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `request` TEXT CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL,
  `response` TEXT CHARACTER SET utf8 COLLATE utf8_unicode_ci NOT NULL
) ENGINE=InnoDB;






















