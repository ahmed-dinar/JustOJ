var fse         = require('fs-extra');
var fs          = require('fs');
var path        = require("path");

var _           = require('lodash');
var Busboy      = require('busboy');
var uuid        = require('node-uuid');
var rimraf      = require('rimraf');
var mkdirp      = require('mkdirp');
var async       = require('async');

var Judge       = require('../../helpers/compiler/sandbox/judge');


module.exports = function(req, res, next) {



    var uniquename =  uuid.v4();
    var saveTo = path.normalize(req.app.locals.defines.RUN_DIR + '/' + uniquename);

    async.waterfall([
        function(callback) {
            makeTempDir(saveTo,callback);
        },
        function(callback) {
            createAdditionalFiles(saveTo,callback);
        },
        function(callback) {
            parseFile(saveTo,req,callback);
        },
        function(opts,callback) {

            opts['codeDir'] = saveTo;
            opts['runDir'] = uniquename;
            opts['pid'] = req.params.pid;

            Judge.run(opts,function(err,result){

                if( err ){ return callback(err,result); }

                callback(null,result);

            });

        }

    ], function (error, result) {

        cleanSubmit(saveTo);

        if( error ) {

            if(result){
                res.end(result);
                return;
            }

            res.end(JSON.stringify(error));
        }
        else{

            var html = '<p style="font-family: monospace;">TC&nbspSTATUS&nbsp&nbsp&nbsp CPU&nbsp&nbspMEMORY</p>';
            var caseCount = 1;
            _.forEach(result,function(value) {
                html += '<p style="font-family: monospace;">';
                html += caseCount++;
                html += '&nbsp&nbsp' + value.result;
                html += '&nbsp&nbsp'  + value.cpu ;
                html += 'S&nbsp&nbsp' + value.memory + 'KB</p>';
            });
            res.end(html);
        }

    });

};


var parseFile = function(saveTo,req,cb){

    var busboy = new Busboy({headers: req.headers});
    var limits = {};
    var extn = null;
    var error = null;
    var fstream = null;

    busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated) {
        limits[fieldname] = val;
    });

    busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
        extn = path.extname(filename);
        if( fieldname === 'jsinput' && filename.length && (extn === '.c' || extn === '.java' || extn === '.cpp')  ){
            fstream = fse.createOutputStream(saveTo + '/code' + extn);
            file.pipe(fstream);
        }else {
            error = 'Invalid Or Empty File';
            file.resume();
        }
    });


    busboy.on('finish', function() {

        if( error ){
            return cb(error);
        }

        if( limits['tl'].length &&  isNumeric(limits['tl'])
            && limits['ml'].length  &&  isNumeric(limits['ml'])
            && limits['language'].length ){

            fstream.on('close', function () {

                fs.access( saveTo + '/code' + extn , fs.F_OK, function(noerr) {


                    if (noerr) {
                        return cb(noerr);
                    }

                    var opts = {
                        language: _.lowerCase(limits['language']),
                        timeLimit: limits['tl'],
                        memoryLimit: limits['ml']
                    };
                    cb(null,opts);
                });

            });
            return;
        }

        cb('limits empty?');
    });

    req.pipe(busboy);

};


var createAdditionalFiles = function(saveTo,cb){

    var files = ['output.txt','error.txt','result.txt'];
    async.eachSeries(files, function(file, callback) {

        fs.open(saveTo + '/' + file ,'w',function(err, fd){
            if( err ){
                return callback(err);
            }

            callback();
        });

    }, function(err){
        if( err ){
            return cb(err);
        }
        cb();
    });

};

var makeTempDir = function(saveTo,cb){
    mkdirp(saveTo, function (err) {
        if (err) {
            console.log('OMG ' + saveTo + ' creation failed! permission denied!!');
            return cb(err);
        }
        cb();
    });
};




//string input
function isNumeric(num){
    return !isNaN(num);
}

//clean up submitted code and run files
function cleanSubmit(codeDir){
    rimraf(codeDir, function (err) {
        if( err ){
            console.log(err);
            return;
        }

        console.log('success clean submit!');
    });
}
