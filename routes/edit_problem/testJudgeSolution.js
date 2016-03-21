var fse         = require('fs-extra');
var fs          = require('fs');
var path        = require("path");

var _           = require('lodash');
var Busboy      = require('busboy');
var uuid        = require('node-uuid');
var rimraf      = require('rimraf');
var mkdirp      = require('mkdirp');
var async       = require('async');

var MyUtil      = require('../../helpers/myutil');
var Judge       = require('../../helpers/compiler/sandbox/judge');
var Problems    = require('../../models/problems');


module.exports = function(req, res, next) {

    var uniquename =  uuid.v4();
    var saveTo = path.normalize(req.app.locals.defines.RUN_DIR + '/' + uniquename);

    async.waterfall([
        function(callback) {
            makeTempDir(saveTo,callback);
        },
        function(callback) {
            parseFile(saveTo,req,callback);
        },
        function(opts,callback) {

            opts['codeDir'] = saveTo;
            opts['runDir'] = uniquename;
            opts['pid'] = req.params.pid;

            Judge.run(opts,function(err,runs){

                if( err ){ return callback(err); }

                callback(null,runs,opts['language']);

            });

        },
        function(runs,language,callback){

            if( runs.compiler || runs.final.result !== 'Accepted' ){
                return callback(null,runs);
            }


            callback(null,runs);

           /* var inserts = {
                attributes:{
                    timelimit: runs.final.cpu,
                    memorylimit: runs.final.memory
                },
                where:{
                    pid: req.params.pid,
                    language: language
                }
            };
            Problems.update('problems_limit',inserts,function(err,row){

                if( err ){ return callback(err); }

                callback(null,runs);

            });*/

        }
    ], function (error, runs) {

        cleanSubmit(saveTo);

        if( error ) {
            if(error.emptyField){
                res.json({error: error.emptyField});
            }else {

                console.log('Test Judge Solution Error:');
                console.log(error);

                res.json({system: 'System Error'});
            }
        }
        else{
            res.json(runs);
        }

        res.end();


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
        console.log('[' + fieldname + '] = ' + val );
    });

    busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
        extn = path.extname(filename);
        if( fieldname === 'jsinput' && filename.length && (extn === '.c' || extn === '.java' || extn === '.cpp')  ){
            fstream = fse.createOutputStream(saveTo + '/code' + extn);
            file.pipe(fstream);
        }else {
            error = 'Invalid Or Empty limits or source code';
            file.resume();
        }
    });


    busboy.on('finish', function() {

        if( error ){
            return cb({emptyField: error});
        }


        fstream.on('close', function () {

            fs.access( saveTo + '/code' + extn , fs.F_OK, function(noerr) {


                if (noerr) {
                    return cb(noerr);
                }

                if( limits['tl'].length &&  MyUtil.isNumeric(limits['tl'])
                    && limits['ml'].length  &&  MyUtil.isNumeric(limits['ml'])
                    && limits['language'].length ){

                    var opts = {
                        language: _.lowerCase(limits['language']),
                        timeLimit: limits['tl'],
                        memoryLimit: limits['ml']
                    };
                    cb(null,opts);

                    return;
                }

                cb({emptyField: 'Invalid Or Empty Limits Or source code'});

            });

        });


    });

    req.pipe(busboy);

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
