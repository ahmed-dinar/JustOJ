
//g++ -lm -o {:basename}.exe {:mainfile}
// .\{:basename}.exe < input.txt
//gcc -lm -o {:basename}.exe {:mainfile}

var exec  = require('child_process').exec;

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
 * @param fn
 * @returns {*}
 */
Compiler.prototype.compile = function compile(codePath,fn){
    var command = null;

    switch(this.language) {
        case 'c':
            command = 'cd ' + codePath + ' & gcc -lm -o output.exe input.c';
            break;
        case 'cpp':
            command = 'cd ' + codePath + ' & g++ -lm -o output.exe input.cpp';
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
                console.log(err);
                return fn(String(stderr),null);
            }
            fn(null,String(stdout));
        });
    }
};


/**
 *
 * @param programmPath
 * @param input
 * @param fn
 */
Compiler.prototype.run = function run(programmPath,input,fn){
    var runCommand = 'cd ' + programmPath + ' & .\\output.exe < "' + input + '"';

   // console.log('Run Command in compile: ' + runCommand);

    var config = {
        env: process.env,
        timeout: this.timeLimit,
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
};


module.exports = Compiler;