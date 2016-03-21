
var exec  = require('child_process').exec;


/**
 *
 * @param codeDir    -> name of the program folder created by uuid. example: 89e99d8b-4552-41f1-8a12-76668334328d
 * @param inputPath  -> example:
 * @param fn
 */
exports.run = function run(opts,testCase,fn){


    var command =  './helpers/compiler/sandbox/safeexec66 ';
    command += opts.runDir + '/code ';
    command += testCase + '/i.txt ';
    command += '/home/run/' + opts.runDir + '/' + opts.fileDir + '/output.txt ';
    command += '/home/run/' + opts.runDir + '/' + opts.fileDir + '/error.txt ';
    command += '/SECURITY/JAIL/home/run/' + opts.runDir + '/' + opts.fileDir + '/result.txt ';
    command += String(parseInt(parseFloat(opts.timeLimit) * 1000)) + ' ';
    command += String(opts.memoryLimit);


    exec(command,{
            env: process.env
        },
        function(err, stdout, stderr) {
            fn(err,stdout,stderr);
    });

};


/**
 *
 * @param codePath -> example: /SECURITY/JAIL/home/run/89e99d8b-4552-41f1-8a12-76668334328d
 * @param fn
 * @returns {*}
 */
exports.compile = function compile(opts,fn){

    var command = null;
    switch(opts.language) {
        case 'c':
            command = 'gcc -w -O2 -fomit-frame-pointer -lm -o code code.c';
            break;
        case 'cpp':
            command =  'g++ -w -O2 -fomit-frame-pointer -lm -o code code.cpp';
            break;
        case 'java':
            return fn('Java will be supported soon!','');
            break;
        default:
            return fn('invalid language','');
    }


    exec(command, {
        env: process.env,
        timeout: 0,
        maxBuffer: 1000*1024,
        cwd: opts.codeDir
    }, function(err, stdout, stderr) {
        if (err) {
            return fn(err,stderr);
        }
        fn(null,null, stdout);
    });

};
