mkdirp(saveTo, function (err) {

    if(err){
        console.log(err);
        res.end(saveTo + ' :( Permission denied');
        return;
    }

    console.log(saveTo + ' created!!');

    var busboy = new Busboy({headers: req.headers});
    var limits = {};
    var extn = null;
    var error = null;


    busboy.on('field', function(fieldname, val, fieldnameTruncated, valTruncated) {
        limits[fieldname] = val;
        console.log('Field [' + fieldname + ']: value: ' + val);
    });


    var fstream;
    busboy.on('file', function(fieldname, file, filename, encoding, mimetype) {
        extn = path.extname(filename);
        if( fieldname === 'jsinput' && filename.length && (extn === '.c' || extn === '.java' || extn === '.cpp')  ){
            console.log('Createing submit file...');
            fstream = fse.createOutputStream(saveTo + '/code' + extn);
            file.pipe(fstream);
        }else {
            error = 'Invalid Or Empty File';
            file.resume();
        }
    });


    busboy.on('finish', function() {

        if( error === null
            && limits['tl'].length &&  isNumeric(limits['tl'])
            && limits['ml'].length  &&  isNumeric(limits['ml'])
            && limits['language'].length ){


            fstream.on('close', function () {

                fs.access( saveTo + '/code' + extn , fs.F_OK, function(noerr) {
                    if (noerr) {
                        console.log('realyy!!!');
                        console.log(noerr);
                    } else {

                        console.log('Access ache re ' + saveTo + '/code' + extn);

                        var compiler = new Compiler({
                            language: limits['language'],
                            timeLimit: limits['tl'],
                            memoryLimit: limits['ml']
                        });

                        compiler.compile(saveTo, function (stderr, stdout) {

                            if( stderr ){
                                console.log('Error kere!');
                                console.log(stderr);
                                return;
                            }

                            console.log('stdout:: ');
                            console.log(stdout);

                        });

                    }
                });

            });



            res.end(test + ' and OK for compile and run!');

            // cleanSubmit(saveTo);
            return;
        }


        res.end(test + ' and Error!');

    });



    req.pipe(busboy);


});