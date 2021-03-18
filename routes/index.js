const app = require('express')();
const authRouter = require('./auth');
const movieRouter = require('./movie');
const genreRouter = require('./genre');

app.use('/auth/', authRouter);
app.use('/movie/', movieRouter);
app.use('/genre/', genreRouter);

module.exports = app;
