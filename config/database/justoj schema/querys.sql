SELECT `status`
FROM   `submissions`
WHERE  `pid`='2'
AND    `uid` = '3'
AND    (`status`='3' OR NOT EXISTS (SELECT `status` FROM `submissions` WHERE `pid`='2' AND `uid`= '3' AND `status`='3' LIMIT 1) )
LIMIT 1;


INSERT INTO `user_problem_status`(`uid`,`pid`,`status`)
VALUES('1', '1','9')
ON DUPLICATE KEY UPDATE
`pid` = VALUES(`pid`),
`status` = VALUES(`status`);


SELECT p.*,(SELECT GROUP_CONCAT(`tag`) FROM `problem_tags` pt WHERE p.id =  pt.pid) AS `tags`
FROM `problems` p
WHERE `id` = '17'
LIMIT 1


SELECT `uid`, `language`, `cpu` FROM `submissions` WHERE (`pid`='17' AND `status`='3') GROUP BY `uid` ORDER BY `cpu`  LIMIT 5


SELECT `submissions`.`language`, `submissions`.`submittime`, `submissions`.`cpu`, `submissions`.`memory`, MIN(`submissions`.`cpu`) AS `cpu`, `users`.`username` FROM `submissions`
  LEFT JOIN `users`
    ON `submissions`.uid = `users`.id
WHERE `pid`='1' AND `status`='0' GROUP BY `uid` ORDER BY `cpu` LIMIT 20 OFFSET 0