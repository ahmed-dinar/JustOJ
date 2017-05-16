
//g++ -O2 -fomit-frame-pointer -o input input.cpp
//gcc -O2 -fomit-frame-pointer -o input input.cpp

/*
 Codemarshal flags:
 gcc -Wall -O2 -static source.c -lm
 g++ -Wall -O2 -static -std=c++11 source.cpp
*/


var exec = require('child_process').exec;
var fs = require('fs-extra');


/**
 *
 * @param OS
 * @param config
 * @constructor
 */
function Compiler(OS,config) {
    var _this = this;
    _this.OS = OS;
    _this.language = config.language.toLowerCase();
    _this.timeLimit = config.timeLimit;
    _this.memoryLimit = config.memoryLimit;
}


/**
 *
 * @param codePath
 * @param codeName
 * @param fn
 * @returns {*}
 */
Compiler.prototype.compile = function compile(codePath,codeName,fn){
    var command = null;

    switch(this.language) {
        case 'c':
            command = 'cd ' + codePath + ' & gcc -O2 -fomit-frame-pointer -o ' + codeName + ' input.c';
            break;
        case 'cpp':
            command = 'cd ' + codePath + ' & g++ -O2 -fomit-frame-pointer -o ' + codeName + ' input.cpp';
            break;
        case 'java':
            //command = 'cd ' + codePath + ' & gcc -lm -o output.exe input.c';
            break;
        default:
            return fn('err language');
    }

    if(command){
        var config = {
            env: process.env,
            timeout:    this.timeLimit,
            maxBuffer:  this.memoryLimit
        };
        exec(command, config, function(err, stdout, stderr) {
            if (err) {
                console.log('Error while compiling in compiler: ');
                console.log(err);
                return fn(String(stderr),null);
            }else {
                fn(null, String(stdout));
            }
        });
    }
};


/**
 *
 * @param programmPath
 * @param input
 * @param fn
 */
Compiler.prototype.run = function run(programmPath,codeName,input,fn){


    console.log( 'TLE after ' + this.timeLimit + ' MilliSecond');


    var runCommand = 'cd ' + programmPath + ' & .\\' + codeName + '.exe < "' + input + '"';

    console.log('Run Command in compile: ' + runCommand);

    var config = {
        env: process.env,
        timeout: 0,
        maxBuffer: parseInt(this.memoryLimit)*1024
    };


    exec(runCommand, config, function(err, stdout, stderr) {

        if (err) {
            console.error('Hei error!');
            console.error(err.killed);
            if(err.toString().indexOf('Error: stdout maxBuffer exceeded.') != -1){
                return fn('Memory limit exceeded',null);
            }
            else if( err.killed ){
                return fn('Time Limit Exceeded',null);
            }
            else{
                return fn('Runtime error',null);
            }
        }else {
            return fn(null, stdout);
        }
    });




    setTimeout(function(){

        exec('taskkill /im '+codeName+'.exe /f',function( error , stdout , stderr ){
            console.log('hi killed ha ha ha!  :D ');
           // fs.removeSync(programmPath);
        });

    }, this.timeLimit);

};


module.exports = Compiler;