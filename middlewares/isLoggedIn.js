/**
 *
 * @param auth
 * @returns {Function}
 */

module.exports = function isLoggedIn(auth) {

     return function isLoggedIn(req, res, next) {

         console.log('original url =============== ' +  req.originalUrl || '/' );


         if(req.isAuthenticated() == auth){
             return next();
         }
         else{

             var ref_page;

             if( req.originalUrl === '/login' ){
                 ref_page = '/login';
             }else if( req.query.redirect ){
                 ref_page = req.originalUrl;
             }else{
                 ref_page = '/login?redirect=' + req.originalUrl;
             }

             res.redirect(ref_page);
         }

     };
};
