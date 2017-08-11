ALTER TABLE `problems`
MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `tags`
MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `submissions`
MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `runs`
MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `contest_runs`
MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `source_code`
MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `contest_source`
MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `users`
MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `contest`
MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `participants`
MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `rank`
MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `contest_submissions`
MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;

ALTER TABLE `clar`
MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;


ALTER TABLE `tags`
ADD CONSTRAINT `fk_tags`
FOREIGN KEY(`pid`)
REFERENCES `problems`(`id`)
ON DELETE CASCADE;

ALTER TABLE `runs`
ADD CONSTRAINT `fk_runs`
FOREIGN KEY(`sid`)
REFERENCES `submissions`(`id`)
ON DELETE CASCADE;


ALTER TABLE `source_code`
ADD CONSTRAINT `fk_source_code`
FOREIGN KEY(`sid`)
REFERENCES `submissions`(`id`)
ON DELETE CASCADE;


ALTER TABLE `clar`
ADD CONSTRAINT `fk_clar`
FOREIGN KEY(`cid`)
REFERENCES `contest`(`id`)
ON DELETE CASCADE;


ALTER TABLE `participants`
ADD CONSTRAINT `fk_participants`
FOREIGN KEY(`cid`)
REFERENCES `contest`(`id`)
ON DELETE CASCADE;


ALTER TABLE `rank`
ADD CONSTRAINT `fk_rank`
FOREIGN KEY(`cid`)
REFERENCES `contest`(`id`)
ON DELETE CASCADE;

ALTER TABLE `contest_submissions`
ADD CONSTRAINT `fk_contest_submissions`
FOREIGN KEY(`cid`)
REFERENCES `contest`(`id`)
ON DELETE CASCADE;

ALTER TABLE `problems`
ADD CONSTRAINT `fk_problems`
FOREIGN KEY(`cid`)
REFERENCES `contest`(`id`)
ON DELETE CASCADE;

ALTER TABLE `contest_runs`
ADD CONSTRAINT `fk_contest_runs`
FOREIGN KEY(`sid`)
REFERENCES `contest_submissions`(`id`)
ON DELETE CASCADE;

ALTER TABLE `contest_source`
ADD CONSTRAINT `fk_contest_source`
FOREIGN KEY(`sid`)
REFERENCES `contest_submissions`(`id`)
ON DELETE CASCADE;



