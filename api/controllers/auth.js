function auth(req, res, next) {
    /*
     I can get the auth token here within request, and validate if this request fulfil the requirement

     for example, I can get a json web token which store the permission, by veryify

     jwt.verify(token, 'secret', function(err, decoded) {});

     if verified, then I can trust the payload inside, it may be permission object, such as
     {
     account:['find','update'],
     client:['create']
     }

     and determine whether this request is valid.

     I am not going to implement the detail auth here as there can be many different ways, and I am only adding this function
     signature to show my concern. To enable the app moving, for this demonstration simply pass all request.

     */
    next();
}

module.exports = {auth};