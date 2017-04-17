ALTER TABLE `problems`
ADD PRIMARY KEY (`id`);

ALTER TABLE `problem_tags`
ADD PRIMARY KEY (`id`);

ALTER TABLE `user_problem_status`
ADD PRIMARY KEY (`id`);

ALTER TABLE `submissions`
ADD PRIMARY KEY (`id`);

ALTER TABLE `submission_case`
ADD PRIMARY KEY (`id`);

ALTER TABLE `c_submission_case`
ADD PRIMARY KEY (`id`);

ALTER TABLE `submission_code`
ADD PRIMARY KEY (`id`);

ALTER TABLE `c_submission_code`
ADD PRIMARY KEY (`id`);

ALTER TABLE `temp_user`
ADD PRIMARY KEY (`id`);

ALTER TABLE `users`
ADD PRIMARY KEY (`id`);

ALTER TABLE `contest`
ADD PRIMARY KEY (`id`);

ALTER TABLE `contest_participants`
ADD PRIMARY KEY (`id`);

ALTER TABLE `contest_problems`
ADD PRIMARY KEY (`cid`,`pname`);

ALTER TABLE `contest_rank`
ADD PRIMARY KEY (`id`);

ALTER TABLE `contest_submissions`
ADD PRIMARY KEY (`id`);

ALTER TABLE `contest_clarifications`
ADD PRIMARY KEY (`id`);




