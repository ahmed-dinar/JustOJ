


INSERT INTO `submissions`(`pid`,`uid`,`language`,`status`,`access`,`submittime`,`cpu`,`memory`) VALUES
  ('2','1','cpp','3','user','2016-01-19 03:14:07','1100','10'),
  ('2','1','cpp','4','user','2016-01-19 03:14:07','1100','10'),
  ('2','1','cpp','6','user','2016-01-19 03:14:07','1100','10'),
  ('2','1','cpp','3','user','2016-01-19 03:14:07','1100','10'),
  ('2','1','cpp','4','user','2016-01-19 03:14:07','1100','10'),
  ('2','2','cpp','4','user','2016-01-19 03:14:07','1100','10'),
  ('2','2','cpp','7','user','2016-01-19 03:14:07','1100','10'),
  ('2','2','cpp','6','user','2016-01-19 03:14:07','1100','10'),
  ('2','2','cpp','3','user','2016-01-19 03:14:07','1100','10'),
  ('3','2','cpp','3','user','2016-01-19 03:14:07','1100','10'),
  ('3','2','cpp','3','user','2016-01-19 03:14:07','1100','10'),
  ('3','3','cpp','4','user','2016-01-19 03:14:07','1100','10'),
  ('3','3','cpp','8','user','2016-01-19 03:14:07','1100','10'),
  ('4','2','cpp','3','user','2016-01-19 03:14:07','1100','10');

INSERT INTO `user_problem_status`(`uid`,`pid`,`status`) VALUES ('1','1','3');

CREATE TABLE `autotest`
(
  `id` INT(11) NOT NULL AUTO_INCREMENT,
  `cid` INT(11) NOT NULL,
  `pname` INT(11) NOT NULL AUTO_INCREMENT,
  `pid` INT(11) NOT NULL,
  PRIMARY KEY (`cid`,`pname`,`id`)
) ENGINE=MyISAM;

INSERT INTO `autotest` (`cid`,`pid`) VALUES
  (1,2),(1,3),(1,4),(2,5),(2,6),(1,7),(3,80),(3,9),(2,10),(1,11),(4,12);


