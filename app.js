const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config();

const indexRouter = require('./routes/index');
const errorHandler = require('./helpers/errorHandler');

const MONGODB_URL = process.env.MONGODB_URL;
const PORT = process.env.PORT || 3000;

async function server() {
    try {
        const client = await MongoClient.connect(MONGODB_URL, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        if (process.env.NODE_ENV === 'development') {
            console.log('Connected to %s', MONGODB_URL);
            console.log('App is running on %s ... \n', PORT);
            console.log('Press CTRL + C to stop the process. \n');
        }

        process.mongo = client;
    } catch (err) {
        console.error('App starting error:', err.message);
        process.exit(1);
    }

    const app = express();

    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    app.use(cookieParser());

    var allowedOrigins = ['http://localhost:3001', 'https://imdb-app.surge.sh'];
    app.use(
        cors({
            origin(origin, callback) {
                if (!origin) return callback(null, true);
                if (allowedOrigins.indexOf(origin) === -1) {
                    var msg =
                        'The CORS policy for this site does not ' +
                        'allow access from the specified Origin.';
                    return callback(new Error(msg), false);
                }
                return callback(null, true);
            },
        })
    );

    app.use('/', indexRouter);

    app.use(errorHandler);

    // app.all("*", function (req, res) {
    //   return apiResponse.notFoundResponse(res, "Page not found");
    // });

    // app.use((err, req, res) => {
    //   if (err.name == "UnauthorizedError") {
    //     return apiResponse.unauthorizedResponse(res, err.message);
    //   }
    // });

    app.listen(PORT);
}

process.on('SIGINT', function () {
    // this is only called on ctrl+c, not restart
    process.kill(process.pid, 'SIGINT');
});

server();
