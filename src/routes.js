const {signUpHandler, loginHandler, viewProfilHandler} = require('./handlers');
const multer = require('multer');
const upload = multer({dest: 'uploads/'});

const routes = [
    {
        method: 'POST',
        path: '/signup',
        config:{
            payload: {
                output: 'stream',
                parse: true,
                multipart: true,
                allow: 'multipart/form-data',
                maxBytes: 1000000
            },
            handler: signUpHandler
        }
    },
    {
        method: 'POST',
        path: '/login',
        handler: loginHandler
    },
    {
        method: 'GET',
        path: '/profile/{userId}',
        handler: viewProfilHandler
    },
];

module.exports = routes;