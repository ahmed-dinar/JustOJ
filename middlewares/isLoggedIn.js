/**
 *
 * @param auth
 * @returns {Function}
 */

module.exports = function isLoggedIn(auth) {



     return function isLoggedIn(req, res, next) {

         if(req.isAuthenticated() == auth){
             return next();
         }
         else{
             res.redirect('/');
         }

     };
};
