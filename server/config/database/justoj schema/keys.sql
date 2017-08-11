ALTER TABLE `problems`
ADD PRIMARY KEY (`id`);

ALTER TABLE `tags`
ADD PRIMARY KEY (`id`);

ALTER TABLE `submissions`
ADD PRIMARY KEY (`id`);

ALTER TABLE `runs`
ADD PRIMARY KEY (`id`);

ALTER TABLE `contest_runs`
ADD PRIMARY KEY (`id`);

ALTER TABLE `source_code`
ADD PRIMARY KEY (`id`);

ALTER TABLE `contest_source`
ADD PRIMARY KEY (`id`);

ALTER TABLE `users`
ADD PRIMARY KEY (`id`);

ALTER TABLE `contest`
ADD PRIMARY KEY (`id`);

ALTER TABLE `participants`
ADD PRIMARY KEY (`id`);

ALTER TABLE `rank`
ADD PRIMARY KEY (`id`);

ALTER TABLE `contest_submissions`
ADD PRIMARY KEY (`id`);

ALTER TABLE `clar`
ADD PRIMARY KEY (`id`);


