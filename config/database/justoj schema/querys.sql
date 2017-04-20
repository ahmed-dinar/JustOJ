/*
contest details and user is resistered
*/
select `contest`.* ,  (`contest_participants`.`uid` IS NOT NULL) AS `resistered`
FROM `contest`
LEFT JOIN `contest_participants` ON `contest`.`id` = `contest_participants`.`cid` AND `contest_participants`.`uid` = '1'
where `contest`.`id` = '1'
limit 1



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




//select all problems of contest and also total team solved and tried of every problem
SELECT `cp`.`pid`,ifnull(`ac`.`solved`,0) as `solvedBy`,ifnull(`wa`.`tried`,0) as `triedby`
FROM `contest_problems` as `cp`
  LEFT JOIN(
             SELECT COUNT(DISTINCT `cs`.`uid`) as `solved`,`cs`.`pid`
             FROM `contest_submissions` as `cs`
             WHERE `cs`.`status` = 0 AND `cs`.`cid`=1
             GROUP BY `cs`.`pid`
           ) as `ac` on `cp`.`pid` = `ac`.`pid`
  LEFT JOIN(
             SELECT COUNT(DISTINCT `cs2`.`uid`) as `tried`,`cs2`.`pid`
             FROM `contest_submissions` as `cs2`
             WHERE `cs2`.`cid`=1
             GROUP BY `cs2`.`pid`
           ) as `wa` on `cp`.`pid` = `wa`.`pid`
WHERE `cp`.`cid` = 1
GROUP BY `cp`.`pid`


//count how many team solved a problem
SELECT SUM(`ac`) AS `accepted` FROM (
          SELECT COUNT(DISTINCT `status`) AS `ac` FROM `contest_submissions`
          WHERE `status` = 0 AND `cid`=1
            GROUP BY `uid`
) `solved`


SELECT DISTINCT (`cp`.`pid`),COUNT(`ac`.`pid`)
FROM `contest_problems` as `cp`
  LEFT JOIN(
             SELECT `cs`.`pid`
             FROM `contest_submissions` as `cs`
             WHERE `cs`.`status` = 0 AND `cs`.`cid`=1
             GROUP BY `cs`.`uid`
           ) as `ac` on `cp`.`pid` = `ac`.`pid`
WHERE `cp`.`cid` = 1
GROUP BY `cp`.`pid`



SELECT GROUP_CONCAT(`cs`.`pid`),`cs`.`uid`
FROM `contest_submissions` as `cs`
WHERE `cs`.`status` = 0 AND `cs`.`cid`=1
GROUP BY `cs`.`uid`


select `usr`.`username`, `usr`.`name`,
  SUM(CASE WHEN `rank`.`status`=0 THEN ifnull(`rank`.`tried`,1)-1 ELSE 0 END) * 20 + ifnull(SUM(CASE WHEN `rank`.`status`=0 THEN TIMESTAMPDIFF(MINUTE, '2016-04-26 02:00:00.000', `rank`.`penalty`) ELSE 0 END),0) AS `penalty`,
  COUNT(CASE WHEN `rank`.`status`=0 THEN `rank`.`status` ELSE NULL END) as `solved`, GROUP_CONCAT( '"' ,`rank`.`pid` , '":{' , '"status":' , `rank`.`status` , ',"tried":' , `rank`.`tried` , ',"penalty":' , TIMESTAMPDIFF(MINUTE, '2016-04-26 02:00:00.000', `rank`.`penalty`) ,'}'  ORDER BY `rank`.`pid` SEPARATOR ',') as `problems`
from `contest_rank` as `rank`
left join `users` as `usr` on `rank`.`uid` = `usr`.`id`
where `rank`.`cid` = '1'
group by `rank`.`uid`
order by `solved` desc,`penalty`



//final rank of all user and their stats
SELECT `cp`.`uid`,`csu`.`username`,`csu`.`name`,`r`.`penalty`,`r`.`problems`,`r`.`solved`
FROM `contest_participants` as `cp`
  LEFT JOIN `users` AS `csu` ON `cp`.`uid` = `csu`.`id`
  LEFT JOIN(

          select `rank`.`uid` as `ruid`,
          SUM(CASE WHEN `rank`.`status`=0 THEN ifnull(`rank`.`tried`,1)-1 ELSE 0 END) * 20 + ifnull(SUM(CASE WHEN `rank`.`status`=0 THEN TIMESTAMPDIFF(MINUTE, '2016-04-26 02:00:00.000', `rank`.`penalty`) ELSE 0 END),0) AS `penalty`,
          COUNT(CASE WHEN `rank`.`status`=0 THEN `rank`.`status` ELSE NULL END) as `solved`,
          GROUP_CONCAT( '"' ,`rank`.`pid` , '":{' , '"status":' , `rank`.`status` , ',"tried":' , `rank`.`tried` , ',"penalty":' , TIMESTAMPDIFF(MINUTE, '2016-04-26 02:00:00.000', `rank`.`penalty`) ,'}'  ORDER BY `rank`.`pid` SEPARATOR ',') as `problems`

          from `contest_rank` as `rank`
          where `rank`.`cid` = 1
          group by `rank`.`uid`

    )AS `r` ON `cp`.`uid` = `r`.`ruid`
WHERE `cp`.`cid`=1
GROUP BY `cp`.`uid`
ORDER BY `r`.`solved` DESC,`r`.`penalty`




/* all testcase for a submission [getTestCase()] */
     SELECT `sid`, GROUP_CONCAT('[\'',`status`, '\',\'' ,`cpu`, '\',\'' ,`memory`, '\',\'' ,`errortype` , '\']' SEPARATOR ',') as `runs`
     FROM `submission_case`
     WHERE `sid` = 3
     GROUP BY `sid`









//problem list and ac user count final!!!!!!!!
select `cp`.`pid`, `cp`.`pname`, `prob`.`title`,COUNT(DISTINCT `solved`.`uac`)
from `contest_problems` as `cp`
  left join `problems` as `prob` on `cp`.`pid` = `prob`.`id`
  left join (
              SELECT `cr`.`pid` as `ppid`,`cr`.`uid` as `uac`
              FROM `contest_rank` as `cr`
              WHERE `cr`.`cid` = 1 AND `cr`.`status`=0
            ) as `solved` ON `cp`.`pid` = `solved`.`ppid`
where `cp`.`cid` = '1'
group by `cp`.`pid`


select `cp`.`pid`, `cp`.`pname`, `prob`.`title`,COUNT(DISTINCT `solved`.`uac`),ifnull(`isac`.`isuac`,-1) as `yousolved`,ifnull(`iswa`.`isuwa`,-1) as `youtried`
from `contest_problems` as `cp`
  left join `problems` as `prob` on `cp`.`pid` = `prob`.`id`
  left join (
              SELECT `cr`.`pid` as `ppid`,`cr`.`uid` as `uac`
              FROM `contest_rank` as `cr`
              WHERE `cr`.`cid` = 1 AND `cr`.`status`=0
            ) as `solved` ON `cp`.`pid` = `solved`.`ppid`
  left JOIN(
             SELECT `cr2`.`pid` as `isuac`
             FROM `contest_rank` as `cr2`
             WHERE `cr2`.`cid` = 1 AND `cr2`.`status`=0 AND `cr2`.`uid`=4
           ) as `isac` on `cp`.`pid`=`isac`.`isuac`
  left JOIN(
             SELECT `cr3`.`pid` as `isuwa`
             FROM `contest_rank` as `cr3`
             WHERE `cr3`.`cid` = 1 AND NOT `cr3`.`status`=0 AND `cr3`.`uid`=4
             LIMIT 1
           ) as `iswa` on `cp`.`pid`=`iswa`.`isuwa`
where `cp`.`cid` = '1'
group by `cp`.`pid`




select `cp`.`pid`, `cp`.`pname`, `prob`.`title`,
  COUNT(DISTINCT `solved`.`uac`) AS `accepted`,
  ifnull(`isac`.`isuac`,-1) as AS `uac`,
ifnull(`iswa`.`isuwa`,-1) AS `uwa`
from `contest_problems` as `cp`
left join `problems` as `prob` on `cp`.`pid` = `prob`.`id`
left join (
SELECT `cr`.`pid` as `ppid`,`cr`.`uid` as `uac`
FROM `contest_rank` as `cr`
WHERE `cr`.`cid` = '1' AND `cr`.`status`=0
) as `solved` ON `cp`.`pid` = `solved`.`ppid`
left JOIN(
SELECT `cr3`.`pid` as `isuwa`
FROM `contest_rank` as `cr3`
WHERE `cr3`.`cid` = '1' AND NOT `cr3`.`status`=0 AND `cr3`.`uid`=4
LIMIT 1
) as `iswa` on `cp`.`pid`=`iswa`.`isuwa`
left JOIN(
SELECT `cr2`.`pid` as `isuac`
FROM `contest_rank` as `cr2`
WHERE `cr2`.`cid` = '1' AND `cr2`.`status`=0 AND `cr2`.`uid`=4
LIMIT 1
) as `isac` on `cp`.`pid`=`isac`.`isuac`
where `cp`.`cid` = '1'
group by `cp`.`pid`











SELECT `c`.*,
  GROUP_CONCAT( '"' , `list`.`pid` , '":{' , ',pid:' , `list`.`pid` , ',name:' ,`list`.`pname` , ',title:' , `list`.`title` , '}' ) as `problemList`
FROM `contest` AS `c`
  LEFT JOIN(
             SELECT `cp`.`cid`,`cp`.`pid`,`cp`.`pname`,`p`.`title`
             FROM `contest_problems` as `cp`
               LEFT JOIN `problems` as `p` ON `cp`.`pid`=`p`.`id`
             GROUP BY `cp`.`pid`
           ) AS `list` ON `c`.`id` = `list`.`cid`
WHERE `c`.`id` = 1
LIMIT 1




/*******************************/
select `running`.*,`future`.*,`ended`.*,(
                                    select `cnts`.`id`,`cnts`.`title`,`cnts`.`begin`,`cnts`.`end`,`cnts`.`status`,`cnts`.`privacy`, count(`usr`.`id`) as `users`
                                         from `contest` as `cnts`
                                           left join `contest_participants` as `usr` on `usr`.`cid` = `cnts`.`id`
                                         where `cnts`.`status` = 2 AND `cnts`.`begin`<=NOW() AND `cnts`.`end` > NOW()
                                         group by `cnts`.`id`
                                         order by `cnts`.`begin` desc ) as `running`,


(select `cnts`.`id`,`cnts`.`title`,`cnts`.`begin`,`cnts`.`end`,`cnts`.`status`,`cnts`.`privacy`, count(`usr`.`id`) as `users`
                                    from `contest` as `cnts` left join `contest_participants` as `usr` on `usr`.`cid` = `cnts`.`id`
                                    where `cnts`.`status` = 2 AND `cnts`.`begin` > NOW()
                                    group by `cnts`.`id`
                                    order by `cnts`.`begin` asc) as `future`,



(select `cnts`.`id`,`cnts`.`title`,`cnts`.`begin`,`cnts`.`end`,`cnts`.`status`,`cnts`.`privacy`, count(`usr`.`id`) as `users`
                                    from `contest` as `cnts` left join `contest_participants` as `usr` on `usr`.`cid` = `cnts`.`id`
                                    where `cnts`.`status` = 2 AND `cnts`.`end` <= NOW()
                                    group by `cnts`.`id`
                                    order by `cnts`.`begin` desc) as `ended`





select `cp`.`uid`, `csu`.`username`, `csu`.`name`, `r`.`penalty`, `r`.`problems`, `r`.`solved`
from `contest_participants` as `cp`
left join `users` as `csu` on `cp`.`uid` = `csu`.`id`
left join(
    select
        `rank`.`uid` as `ruid`,
        /* penalty */
        SUM(CASE
                WHEN `rank`.`status`=0
                THEN ifnull(`rank`.`tried`,1)-1
                ELSE 0
            END
         )
         * 20
         + ifnull(SUM(
             CASE
             WHEN `rank`.`status`=0
             THEN TIMESTAMPDIFF(MINUTE, '2017-04-18 02:23:00.000', `rank`.`penalty`)
             ELSE 0
             END
             ),0
          ) AS `penalty`,
          /* solved */
          COUNT(
              CASE
              WHEN `rank`.`status`=0
              THEN `rank`.`status`
              ELSE NULL
              END
           ) as `solved`,
           /*problems*/
           GROUP_CONCAT( '"' ,`rank`.`pid` , '":{' , '"status":' , `rank`.`status` , ',"tried":' , `rank`.`tried` , ',"penalty":' , TIMESTAMPDIFF(MINUTE, '2017-04-18 02:23:00.000', `rank`.`penalty`) ,'}'  ORDER BY `rank`.`pid` SEPARATOR ',') as `problems`
               from `contest_rank` as `rank`
               where `rank`.`cid` = '1'
               group by `rank`.`uid`)AS `r` ON `cp`.`uid` = `r`.`ruid`
           where `cp`.`cid` = '1'
           group by `cp`.`uid`
           order by r.solved DESC,r.penalty
           limit 5










