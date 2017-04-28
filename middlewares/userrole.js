var ConnectRoles = require('connect-roles');

//connect-roles
var roles = new ConnectRoles({
    failureHandler: function (req, res, action) {

        var accept = req.headers.accept || '';

        console.log( 'ACTION: ' + action);

        if(req.isAuthenticated()){
            res.status(403);
            res.send('Access Denied');
            return;
        }

        switch (req.user.role){
            case 'user':
                res.redirect('/login');
                break;
            default:
                res.status(403);
                res.send('Access Denied');
        }

    }
});



//normal users can access user page, but
//they might not be the only ones so we don't return
//false if the user isn't a moderator
roles.use('access users page', function (req) {
    if (req.user.role === 'user') {
        return true;
    }
});



//admin users can access all pages
roles.use(function (req) {
    if (req.user.role === 'admin') {
        return true;
    }
});


module.exports = roles;