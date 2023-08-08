module.exports = function (router) {
    router.get('/column/:id?', require('./index'));
    router.get('/news', require('./news/index'))
};
