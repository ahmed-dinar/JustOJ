var path = require('path');
var rimraf = require('rimraf');


module.exports = function(req, res, next) {

    if( !req.body.pid || !req.body.casename ){
        return next(new Error('No Request body found'));
    }

    var TCDir = path.normalize(process.cwd() + '/files/tc/p/' + req.body.pid + '/' + req.body.casename);

    console.log('tc to remove ' + TCDir);
    rimraf(TCDir, function (err) {
        if( err ){
            console.log(err);
            req.flash('tcRemErr','Something wrong');
        }else{
            req.flash('tcRemSuccess', 'Test Case Removed');
        }
        res.redirect('/problems/edit/' + req.body.pid + '/2');
    });

};
