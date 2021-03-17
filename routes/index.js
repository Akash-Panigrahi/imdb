const app = require('express')();
const authRouter = require('./auth');
const movieRouter = require('./movie');

app.use('/auth/', authRouter);
app.use('/movie/', movieRouter);

module.exports = app;
