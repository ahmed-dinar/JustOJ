-- phpMyAdmin SQL Dump
-- version 4.5.2
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: Feb 13, 2016 at 11:43 AM
-- Server version: 10.1.9-MariaDB
-- PHP Version: 5.6.15

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `justoj`
--

-- --------------------------------------------------------

--
-- Table structure for table `problems`
--

CREATE TABLE `problems` (
  `pid` int(11) NOT NULL,
  `name` tinytext CHARACTER SET utf8 COLLATE utf8_unicode_ci,
  `status` tinytext CHARACTER SET utf8 COLLATE utf8_unicode_ci,
  `pgroup` tinytext CHARACTER SET utf8 COLLATE utf8_unicode_ci,
  `statement` longtext CHARACTER SET utf8 COLLATE utf8_unicode_ci,
  `image` longblob,
  `input` longtext CHARACTER SET utf8 COLLATE utf8_unicode_ci,
  `output` longtext CHARACTER SET utf8 COLLATE utf8_unicode_ci,
  `timelimit` decimal(3,2) DEFAULT NULL,
  `memorylimit` int(11) DEFAULT NULL,
  `score` int(11) DEFAULT NULL,
  `languages` tinytext CHARACTER SET utf8 COLLATE utf8_unicode_ci,
  `submissions` int(11) DEFAULT '0',
  `solved` int(11) DEFAULT '0',
  `author` varchar(50) NOT NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8;

--
-- Dumping data for table `problems`
--

INSERT INTO `problems` (`pid`, `name`, `status`, `pgroup`, `statement`, `image`, `input`, `output`, `timelimit`, `memorylimit`, `score`, `languages`, `submissions`, `solved`, `author`) VALUES
  (51, 'sdfsfsf', 'incomplete', NULL, '&lt;div&gt;This is an exmaple problem description&period; Please put your problem description here with enough detail&period; &lt;&sol;div&gt;&lt;br&gt;&lt;div&gt;&lt;b&gt;INPUT&lt;&sol;b&gt;&lt;&sol;div&gt;&lt;div&gt;This is a smaple input detail&period; Please put your input detail here&period; For example&comma; Input starts with an integer &lt;b&gt;T&lt;&sol;b&gt;&comma; denoting the number of test cases&period;Each case contains two integers &lt;b&gt;N&lt;&sol;b&gt; denoting the number of elements of array A&period; The next line will contain n integers separated by spaces&comma; denoting the elements of the array A&period;&lt;&sol;div&gt;&lt;p&gt;&lt;&sol;p&gt;&lt;div&gt;&lt;b&gt;OUTPUT&lt;&sol;b&gt;&lt;&sol;div&gt;&lt;p&gt;&lt;&sol;p&gt;&lt;div&gt;This is a smaple output detail&period; Please put your output detail here&period; For example&comma; For each case of input&comma; output the index of the number for which the array is not sorted &period;If several solution exists then print the smallest one &period; Here indexes are 1 based&period; &lt;&sol;div&gt;&lt;br&gt;&lt;p&gt;&lt;&sol;p&gt;&lt;div&gt;&lt;b&gt;Constraints&lt;&sol;b&gt;&lt;&sol;div&gt;&lt;p&gt;&lt;&sol;p&gt;&lt;div&gt;This is an exmaple Constraints&period;If you already explain constraints then remove this section&period;&lt;&sol;div&gt;&lt;div&gt; 0 &amp;lt&semi; T &amp;lt&semi; 101&lt;div&gt;1 &amp;lt&semi; N&amp;lt&semi;10&Hat;4&lt;&sol;div&gt;&lt;div&gt;1 &amp;lt&semi; A&lsqb;i&rsqb; &amp;lt&semi;10&Hat;2 &lpar; -1 &amp;lt&semi; i &amp;lt&semi; N &rpar;&lt;&sol;div&gt;&lt;br&gt;&lt;p&gt;&lt;&sol;p&gt;&lt;div&gt;&lt;b&gt;Explanation&lt;&sol;b&gt;&lt;&sol;div&gt;&lt;p&gt;&lt;&sol;p&gt;&lt;div&gt;This is an exmaple Explanation&period;If any explanation not needed&comma;remove this section&period;&lt;&sol;div&gt;&lt;&sol;div&gt;', NULL, '2\r&NewLine;3\r&NewLine;1 2 1\r&NewLine;6\r&NewLine;2 5 8 8 7 10\r&NewLine;                        ', 'Case 1&colon; 3\r&NewLine;Case 2&colon; 5\r&NewLine;                        ', NULL, NULL, NULL, NULL, 0, 0, 'author name');

-- --------------------------------------------------------

--
-- Table structure for table `submissions`
--

CREATE TABLE `submissions` (
  `sid` int(11) NOT NULL,
  `pid` int(11) DEFAULT NULL,
  `uid` int(11) DEFAULT NULL,
  `language` tinytext CHARACTER SET utf8 COLLATE utf8_unicode_ci,
  `status` tinytext CHARACTER SET utf8 COLLATE utf8_unicode_ci,
  `access` tinytext CHARACTER SET utf8 COLLATE utf8_unicode_ci,
  `submittime` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `runtime` decimal(4,2) DEFAULT NULL,
  `runmemory` decimal(4,2) DEFAULT '0.00'
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `submission_code`
--

CREATE TABLE `submission_code` (
  `sid` int(11) NOT NULL,
  `filename` tinytext CHARACTER SET utf8 COLLATE utf8_unicode_ci,
  `code` longtext CHARACTER SET utf8 COLLATE utf8_unicode_ci,
  `errors` text CHARACTER SET utf8 COLLATE utf8_unicode_ci,
  `output` longtext CHARACTER SET utf8 COLLATE utf8_unicode_ci
) ENGINE=InnoDB DEFAULT CHARSET=utf8;

-- --------------------------------------------------------

--
-- Table structure for table `table_name`
--

CREATE TABLE `table_name` (
  `id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `address` varchar(255) NOT NULL,
  `tele` varchar(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `table_name`
--

INSERT INTO `table_name` (`id`, `name`, `address`, `tele`) VALUES
  (1, 'Nazir', 'Kolkata', '033');

-- --------------------------------------------------------

--
-- Table structure for table `temp_user`
--

CREATE TABLE `temp_user` (
  `id` int(11) NOT NULL,
  `username` varchar(30) NOT NULL,
  `password` char(60) NOT NULL,
  `email` varchar(255) NOT NULL,
  `created` datetime NOT NULL,
  `expire` datetime NOT NULL,
  `token` varchar(36) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `test_cases`
--

CREATE TABLE `test_cases` (
  `id` int(11) NOT NULL,
  `name` varchar(64) NOT NULL,
  `pid` int(11) NOT NULL,
  `created` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `test_cases`
--

INSERT INTO `test_cases` (`id`, `name`, `pid`, `created`) VALUES
  (3, '53ec2ed5-b2f8-4a8b-91a6-da4c83538bbb', 51, '0000-00-00 00:00:00');

-- --------------------------------------------------------

--
-- Table structure for table `users`
--

CREATE TABLE `users` (
  `id` int(11) NOT NULL,
  `username` varchar(30) NOT NULL,
  `password` char(60) NOT NULL,
  `email` varchar(255) NOT NULL,
  `joined` datetime NOT NULL,
  `firstname` varchar(50) DEFAULT NULL,
  `lastname` varchar(50) DEFAULT NULL,
  `institute` varchar(50) DEFAULT NULL,
  `rank` int(11) DEFAULT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `users`
--

INSERT INTO `users` (`id`, `username`, `password`, `email`, `joined`, `firstname`, `lastname`, `institute`, `rank`) VALUES
  (1, 'dinar', '$2a$10$auavEZv3X6lk9bzXC2m6b.xH.RmDdblyN5qykjqQHTAU55qvY7rFe', 'madinar.cse@gmail.com', '2016-01-17 17:21:16', NULL, NULL, NULL, NULL),
  (2, 'BerthoGamer', '$2a$10$R3hcpqoV.TR3Ek7DcYEg/ekU.k/YrK3258nBJ1E9aJY9O5q6lMFii', 'ahmedd.dinar@gmail.com', '2016-01-24 12:53:40', NULL, NULL, NULL, NULL);

-- --------------------------------------------------------

--
-- Table structure for table `user_solved_list`
--

CREATE TABLE `user_solved_list` (
  `id` int(11) NOT NULL,
  `uid` int(11) NOT NULL,
  `pid` int(11) NOT NULL,
  `sid` int(11) NOT NULL,
  `status` varchar(10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `user_solved_list`
--

INSERT INTO `user_solved_list` (`id`, `uid`, `pid`, `sid`, `status`) VALUES
  (1, 1, 51, 0, 'AC'),
  (2, 1, 51, 0, 'AC');

--
-- Indexes for dumped tables
--

--
-- Indexes for table `problems`
--
ALTER TABLE `problems`
ADD PRIMARY KEY (`pid`);

--
-- Indexes for table `submissions`
--
ALTER TABLE `submissions`
ADD PRIMARY KEY (`sid`);

--
-- Indexes for table `submission_code`
--
ALTER TABLE `submission_code`
ADD PRIMARY KEY (`sid`);

--
-- Indexes for table `table_name`
--
ALTER TABLE `table_name`
ADD PRIMARY KEY (`id`);

--
-- Indexes for table `temp_user`
--
ALTER TABLE `temp_user`
ADD PRIMARY KEY (`id`);

--
-- Indexes for table `test_cases`
--
ALTER TABLE `test_cases`
ADD PRIMARY KEY (`id`);

--
-- Indexes for table `users`
--
ALTER TABLE `users`
ADD PRIMARY KEY (`id`);

--
-- Indexes for table `user_solved_list`
--
ALTER TABLE `user_solved_list`
ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT for dumped tables
--

--
-- AUTO_INCREMENT for table `problems`
--
ALTER TABLE `problems`
MODIFY `pid` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=52;
--
-- AUTO_INCREMENT for table `submissions`
--
ALTER TABLE `submissions`
MODIFY `sid` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `submission_code`
--
ALTER TABLE `submission_code`
MODIFY `sid` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `table_name`
--
ALTER TABLE `table_name`
MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=2;
--
-- AUTO_INCREMENT for table `temp_user`
--
ALTER TABLE `temp_user`
MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
--
-- AUTO_INCREMENT for table `test_cases`
--
ALTER TABLE `test_cases`
MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;
--
-- AUTO_INCREMENT for table `users`
--
ALTER TABLE `users`
MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;
--
-- AUTO_INCREMENT for table `user_solved_list`
--
ALTER TABLE `user_solved_list`
MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=3;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;