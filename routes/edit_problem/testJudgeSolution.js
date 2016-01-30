var fse         = require('fs-extra');
var path        = require("path");

var _           = require('lodash');
var Busboy      = require('busboy');
var uuid        = require('node-uuid');

var Judge       = require('../../helpers/compiler/judge');


module.exports = function(req, res, next) {

    var busboy = new Busboy({headers: req.headers});
    var uniquename =  uuid.v4();
    var limits = {};
    var error = null;
    var success = null;
    var saveTo = path.normalize(process.cwd() + '/files/runs/' + uniquename);

    busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated) {
        limits[fieldname] = val;
        console.log('Field [' + fieldname + ']: value: ' + val);
    });


    busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
        var extn = path.extname(filename);
        if( fieldname === 'jsinput' && filename.length && (extn === '.c' || extn === '.java' || extn === '.cpp')  ){
            file.pipe(fse.createOutputStream(saveTo + '\\input' + extn));
        }else {
            error = 'Invalid Or Empty File';
            file.resume();
        }
    });


    busboy.on('finish', function() {

        if( limits['tl'].length &&  isNumeric(limits['tl'])
            && limits['ml'].length  &&  isNumeric(limits['ml'])
            && limits['language'].length && !error ){

            Judge.init({
                runPath: saveTo,
                runName: uniquename,
                language: limits['language'],
                timeLimit: limits['tl'],
                memoryLimit: limits['ml']
            });
            Judge.run(req.params.pid,function(Output){

                console.log('ajax returns: ');
                console.log(Output);

                res.json({
                    status: 'success',
                    success: Output
                });
            });
        }

        if( error ){
            res.json({
                status: 'error',
                error: error
            });
        }
    });

    req.pipe(busboy);

};

//string input
function isNumeric(num){
    return !isNaN(num);
}