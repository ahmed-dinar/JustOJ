SELECT `status`
FROM   `submissions`
WHERE  `pid`='2'
AND    `uid` = '3'
AND    (`status`='3' OR NOT EXISTS (SELECT `status` FROM `submissions` WHERE `pid`='2' AND `uid`= '3' AND `status`='3' LIMIT 1) )
LIMIT 1;


SELECT `status`
FROM   `contest_submissions`
WHERE  `pid`='1'
       AND    `uid` = '1'
       AND    `cid` = '1'
       AND    (`status`='0' OR NOT EXISTS (SELECT `status` FROM `submissions` WHERE `pid`='1' AND `uid`= '1' AND `status`='0' AND `cid`='1' LIMIT 1) )
LIMIT 1;

INSERT INTO `user_problem_status`(`uid`,`pid`,`status`)
VALUES('1', '1','9')
ON DUPLICATE KEY UPDATE
`pid` = VALUES(`pid`),
`status` = VALUES(`status`);


SELECT p.*,(SELECT GROUP_CONCAT(`tag`) FROM `problem_tags` pt WHERE p.id =  pt.pid) AS `tags`
FROM `problems` p
WHERE `id` = '17'
LIMIT 1;


SELECT `uid`, `language`, `cpu` FROM `submissions` WHERE (`pid`='17' AND `status`='3') GROUP BY `uid` ORDER BY `cpu`  LIMIT 5;


SELECT `submissions`.`language`, `submissions`.`submittime`, `submissions`.`cpu`, `submissions`.`memory`, MIN(`submissions`.`cpu`) AS `cpu`, `users`.`username` FROM `submissions`
  LEFT JOIN `users`
    ON `submissions`.uid = `users`.id
WHERE `pid`='1' AND `status`='0' GROUP BY `uid` ORDER BY `cpu` LIMIT 20 OFFSET 0;





SELECT MIN(counted) FROM
  (
    SELECT COUNT(*) AS counted
    FROM `submissions`
    WHERE `pid`='1' AND `status`='0'
    GROUP BY(`uid`)
  ) AS tata;


//penalty of first ac submision
SELECT IFNULL(MIN(`cs`.`submittime`),-1) AS `time`,IFNULL(TIMESTAMPDIFF(MINUTE, MIN(`cs`.`submittime`), NOW()), -1) AS `penalty`,(
  SELECT COUNT(*) AS `Count`
  FROM `contest_submissions` AS `cs2`
  WHERE `cs2`.`pid`=2 AND `cs2`.`cid`=1 and `cs2`.`uid`=1 AND NOT (`cs2`.`status` = '0') AND `cs2`.`submittime` < ifnull(MIN(`cs`.`submittime`),'2100-04-25 18:58:39')
) as `tried`
FROM `contest_submissions` AS `cs`
WHERE `cs`.`pid`=2 AND `cs`.`cid`=1 and `cs`.`uid`=1 AND `cs`.status = '0';


SELECT `cs`.`uid`,`cs`.`pid`,IFNULL(MIN(`cs`.`submittime`),-1) AS `time`,
  IFNULL(TIMESTAMPDIFF(MINUTE, MIN(`cs`.`submittime`), NOW()), -1) AS `penalty`
FROM `contest_submissions` AS `cs`
LEFT JOIN (
          SELECT `cs2`.`pid`,`cs2`.`uid`,COUNT(*) AS `Count`
          FROM `contest_submissions` AS `cs2`
          WHERE `cs2`.`cid`=1 AND NOT (`cs2`.`status` = '0') AND `cs2`.`submittime` < MIN(`cs`.`submittime`)
      ) AS `zeo` ON `cs`.`pid` = `zeo`.`pid` AND `cs`.`uid`=`zeo`.`uid`
WHERE `cs`.`pid`=1 AND `cs`.`cid`=1 and `cs`.`uid`=1 AND `cs`.status = '0';




SELECT *
FROM (
       SELECT `users`.`username`,GROUP_CONCAT(`cpro`.`pname` ORDER BY `cpro`.`pname`) AS `problem`
       FROM `contest_participants` AS `cp`
         LEFT JOIN `users` ON `cp`.`uid` = `users`.`id`
         LEFT JOIN `contest_problems` AS `cpro` ON `cp`.`cid` = `cpro`.`cid`
       WHERE `cp`.`cid` = 1
       GROUP BY `cp`.`uid`
     ) AS `rank`;




select `contest_problems`.`pid`, `contest_problems`.`pname`, `problems`.`title`,ifnull(`solved`.`totalsolved`,0) AS `accepted`
from `contest_problems`
  left join `problems` on `contest_problems`.`pid` = `problems`.`id`
  left join (
    SELECT `cs`.`pid`,COUNT(DISTINCT `cs`.`uid`) AS `totalsolved`
    FROM `contest_submissions` as `cs`
    WHERE `cs`.`cid`=1 AND 	`cs`.`status`='0'
  ) as `solved` ON `contest_problems`.`pid` = `solved`.`pid`
where `contest_problems`.`cid` = '1'




SELECT IFNULL(MIN(`cs`.`submittime`),-1) AS `time`,IFNULL(TIMESTAMPDIFF(MINUTE, MIN(`cs`.`submittime`), NOW()), -1) AS `penalty`,(
  SELECT COUNT(*) AS `Count`
  FROM `contest_submissions` AS `cs2`
  WHERE `cs2`.`pid`=2 AND `cs2`.`cid`=1 and `cs2`.`uid`=1 AND NOT (`cs2`.`status` = '0') AND `cs2`.`submittime` < ifnull(MIN(`cs`.`submittime`),'2100-04-25 18:58:39')
) as `tried`
FROM `contest_submissions` AS `cs`
WHERE `cs`.`pid`=2 AND `cs`.`cid`=1 and `cs`.`uid`=1 AND `cs`.status = '0';


select `cp`.`pid`,`tried2`.`penalty`
from `contest_problems` as `cp`
  left join(
    SELECT `cs`.`pid`,IFNULL(TIMESTAMPDIFF(MINUTE, MIN(`cs`.`submittime`), NOW()), -1) AS `penalty`
    FROM `contest_submissions` AS `cs`
    WHERE `cs`.`cid`=1 and `cs`.`uid`=1 AND `cs`.status = '0'
  ) as `tried2` on `cp`.`pid` = `tried2`.`pid`
where `cp`.`cid`=1


      (
SELECT COUNT(*) AS `Count`
FROM `contest_submissions` AS `cs2`
WHERE `cs2`.`pid`=2 AND `cs2`.`cid`=1 and `cs2`.`uid`=1 AND NOT (`cs2`.`status` = '0') AND `cs2`.`submittime` < ifnull(MIN(`cs`.`submittime`),'2100-04-25 18:58:39')
) as `tried`



SELECT IFNULL(TIMESTAMPDIFF(MINUTE, MIN(`cs`.`submittime`), NOW()), -1) AS `penalty`
FROM `contest_submissions` AS `cs`
WHERE `cs`.`pid`=2 AND `cs`.`cid`=1 and `cs`.`uid`=1 AND `cs`.status = '0';




//final rank query WOW
SELECT `rank`.`uid`,`usr`.`username`,
  COALESCE(SUM(`rank`.`tried`) * 20,0)  + COALESCE(SUM(TIMESTAMPDIFF(MINUTE, '2016-04-26 00:38:48', `rank`.`penalty`)),0) AS `penalty`,
  COUNT(CASE WHEN `rank`.`status`=0 THEN `rank`.`status` ELSE NULL END) as `solved`,
  GROUP_CONCAT( '{ pid:' , `rank`.`pid` , ',tried:' ,`rank`.`tried` , ',penalty:' ,TIMESTAMPDIFF(MINUTE, '2016-04-26 00:38:48', `rank`.`penalty`) , '}' ORDER BY `rank`.`pid` SEPARATOR ',') as `problems`
FROM `contest_rank` as `rank`
LEFT JOIN `users` as `usr` ON `rank`.`uid` = `usr`.`id`
WHERE `rank`.`cid` = 1
GROUP BY `rank`.`uid`
ORDER BY `solved` DESC,`penalty`;



SELECT `usr`.`username`,`cp`.`uid`, IFNULL(TIMESTAMPDIFF(MINUTE, '2016-04-12 03:00:00', ), 0)
FROM `contest_participants` as `cp`
LEFT JOIN `users` as `usr` ON `cp`.`uid` = `usr`.`id`
WHERE `cp`.`cid` = 1
GROUP BY `cp`.`uid`









