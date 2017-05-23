'use strict';


var myUtils = {

  sourceLimit: (1024*1024),
  RUN_DIR: '/var/SECURITY/JAIL/home/runs',
  TC_DIR: process.cwd() + '/files/tc/p',
  SUBMISSION_DIR: process.cwd() + '/files/submissions',
  UPLOAD_DIR: process.cwd() + '/files/uploads',

  tables: function(){

    var table_names = {
      problem: 'problems',
      tag: 'problem_tags',
      submission: 'submissions',
      resistration: 'temp_user',
      user: 'users',
      problemStatus: 'user_problem_status'
    };

    return table_names;
  },

  paginationLimit: function(){
    var limit = 5;
    return limit;
  },


  isNumeric: function isNumeric(num){
    return !isNaN(num);
  },

  runStatus: function(minified){
        //                0             1                 2                        3                     4                  5         6            7               8              9
    var status = ['Accepted','Runtime Error','Time Limit Exceeded','Memory Limit Exceeded','Output Limit Exceeded','In Queue','Running','Compilation Error','System Error', 'Wrong Answer'];
    var statusMinified = ['Accepted','Runtime Error','TLE','MLE','OLE','In Queue','Running','Compilation Error','System Error', 'Wrong Answer'];
        //  var status: ['In Queue','Running','Compiler Error','Accepted','Wrong Answer','Time Limit Exceeded','Runtime Error','Memory Limit Exceeded','Output Limit Exceeded','System Error'],

    if( typeof minified !== 'undefined' && minified === true ) return statusMinified;

    return status;
  },


  tagList: function(){

    var tags = [];

    tags.push('beginner');
    tags.push('addhoc');
    tags.push('dp');
    tags.push('ds');
    tags.push('dac');
    tags.push('fom');
    tags.push('geometry');
    tags.push('graph');
    tags.push('number');
    tags.push('string');
    tags.push('searching');
    tags.push('game');
    tags.push('matrix');
    tags.push('probabilities');
    tags.push('bitmasks');
    tags.push('trees');
    tags.push('comb');
    tags.push('dfsbfs');
    tags.push('bf');
    tags.push('greedy');

    return tags;
  },

  tagNames: function(){

    var tags = {
      beginner: 'Begginer',
      addhoc: 'Add-hoc',
      dp: 'DP',
      ds: 'Data Structures',
      dac: 'Divide and Conquer',
      fom: 'Flow/Matching',
      geometry: 'Geometry',
      graph: 'Graphs',
      number: 'Number Theory',
      string: 'String',
      searching: 'Searching',
      game: 'Game Theory',
      matrix: 'Matrices',
      probabilities: 'Probabilities',
      bitmasks: 'Bitmasks',
      trees: 'Trees',
      comb: 'Combinatorics',
      dfsbfs: 'DFS/BFS',
      bf: 'Brute Force',
      greedy: 'Greedy'
    };


    return tags;
  },

  langNames: function(){
    var names = {
      'c': 'C',
      'cpp': 'C++',
      'java': 'JAVA'
    };
    return names;
  },
  langTemplates: function (lang_index) {
    var tp = [
      '#include <stdio.h>\r\n\r\nint main() {\r\n\t// your code goes here\r\n\treturn 0;\r\n}', //c
      '#include <iostream>\r\nusing namespace std;\r\n\r\nint main() {\r\n\t// your code goes here\r\n\treturn 0;\r\n}', //c++
      'import java.util.*;\r\nimport java.io.*;\r\n\r\nclass Main\r\n{\r\n\tpublic static void main (String[] args) {\r\n\t\t// your code goes here\r\n\t}\r\n}' //java
    ];
    if(lang_index >= tp.length) return 'error';

    return tp[lang_index];
  }
};

module.exports = myUtils;