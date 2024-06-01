const {loginHandler} = require('./handlers');

const routes = [
    {
        method: 'POST',
        path: '/login',
        handler: loginHandler
    },
];

module.exports = routes;