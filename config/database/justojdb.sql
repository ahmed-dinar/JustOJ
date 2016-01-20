CREATE TABLE IF NOT EXISTS `problems` (
  `pid` int(11) NOT NULL AUTO_INCREMENT,
  `name` tinytext CHARACTER SET utf8 COLLATE utf8_unicode_ci,
  `status` tinytext CHARACTER SET utf8 COLLATE utf8_unicode_ci,
  `pgroup` tinytext CHARACTER SET utf8 COLLATE utf8_unicode_ci,
  `statement` longtext CHARACTER SET utf8 COLLATE utf8_unicode_ci,
  `image` longblob,
  `input` longtext CHARACTER SET utf8 COLLATE utf8_unicode_ci,
  `output` longtext CHARACTER SET utf8 COLLATE utf8_unicode_ci,
  `timelimit` float DEFAULT NULL,
  `memorylimit` int(11) DEFAULT NULL,
  `score` int(11) DEFAULT NULL,
  `languages` tinytext CHARACTER SET utf8 COLLATE utf8_unicode_ci,
  `submissions` int(11) DEFAULT '0',
  `solved` int(11) DEFAULT '0',
  PRIMARY KEY (`pid`)
) ENGINE=MyISAM  DEFAULT CHARSET=utf8 AUTO_INCREMENT=15 ;