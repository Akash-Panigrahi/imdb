const { ObjectID } = require('mongodb');
const { body, query, validationResult } = require('express-validator');

exports.movieList = [
    query('sort_by').optional().isIn(['99popularity', 'director', 'name']),
    query('order_by').optional().isIn(['asc', 'desc']),
    query('genres').optional().isString(),
    query('search').optional().isString().trim(),
    query('start').optional().isString().toInt(),
    query('length').optional().isString().toInt(),
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const {
                sortBy = '_id',
                orderBy = 'asc',
                genres,
                search,
                start = 0,
                length = 20,
            } = req.query;

            const matchParams = {};
            if (genres) {
                matchParams.genres = { $all: genres.split(',') };
            }
            if (search) {
                const searchFilter = { $regex: search, $options: 'i' };
                matchParams.$or = [
                    { name: searchFilter },
                    { director: searchFilter },
                ];
            }

            const pipeline = [];
            if (genres || search) {
                pipeline.push({ $match: matchParams });
            }

            const moviesFacet = [];
            if (sortBy) {
                moviesFacet.push({
                    $sort: { [sortBy]: orderBy === 'desc' ? -1 : 1 },
                });
            }
            if (start) {
                moviesFacet.push({ $skip: start });
            }
            moviesFacet.push({ $limit: length });

            pipeline.push({
                $facet: {
                    movies: moviesFacet,
                    totalMovies: [
                        { $group: { _id: null, total: { $sum: 1 } } },
                    ],
                },
            });

            const movieListResult = await process.mongo
                .db('imdb')
                .collection('movies')
                .aggregate(pipeline)
                .toArray();
            const { movies, totalMovies } = movieListResult[0];
            res.json({
                movies,
                totalMovies: totalMovies[0] ? totalMovies[0].total : 0,
            });
        } catch (err) {
            return res.status(500).send({ message: err.message });
        }
    },
];

exports.movieDelete = [
    (req, res) => {
        process.mongo
            .db('imdb')
            .collection('movies')
            .deleteOne({ _id: ObjectID(req.params.id) }, (err, result) => {
                if (err) {
                    return res.status(500).send({ message: err.message });
                }

                if (result.deletedCount) {
                    res.json({
                        message: 'Successfully deleted movie.',
                    });
                } else {
                    res.status(404).json({
                        message: 'Movie not found',
                    });
                }
            });
    },
];

exports.movieCreate = [
    body('name', 'Movie name must be specified.')
        .isLength({ min: 1 })
        .trim()
        .escape(),
    body('director', 'Director must be specified.')
        .isLength({ min: 1 })
        .trim()
        .escape(),
    body('genres', 'Genres must be specified.').isArray({ min: 1 }),
    body('popularity', 'Popularity must be specified.').isInt({
        min: 1,
        max: 99,
    }),
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { name, director, genres, popularity } = req.body;

            // check if movie is already present
            const movieExistsResult = await process.mongo
                .db('imdb')
                .collection('movies')
                .findOne({ name });
            if (movieExistsResult) {
                return res
                    .status(409)
                    .send({ message: 'Movie is already present ' });
            }

            // filter out genres not available in db
            let availableGenres = await process.mongo
                .db('imdb')
                .collection('genres')
                .find()
                .toArray();
            availableGenres = availableGenres.map((_) => _.name);
            const newGenres = genres.filter(
                (_) => !availableGenres.includes(_)
            );

            if (newGenres.length) {
                await process.mongo
                    .db('imdb')
                    .collection('genres')
                    .insertMany(newGenres.map((name) => ({ name })));
            }

            const doc = {
                name,
                director,
                genres,
                '99popularity': popularity,
                imdb_score: popularity / 10,
            };

            const movieInsertResult = await process.mongo
                .db('imdb')
                .collection('movies')
                .insertOne(doc);
            if (movieInsertResult.insertedCount) {
                res.status(201).json({
                    message: 'Successfully inserted movie.',
                });
            }
        } catch (err) {
            return res.status(500).send({ message: err.message });
        }
    },
];

exports.movieUpdate = [
    body('director').optional().isLength({ min: 1 }).trim().escape(),
    body('genres').optional().isArray({ min: 1 }),
    body('popularity').optional().isInt({ min: 1, max: 99 }),
    async (req, res) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const { director, genres, popularity } = req.body;
            const movieId = req.params.id;
            const doc = {};
            if (director) doc.director = director;
            if (genres) doc.genres = genres;
            if (popularity) {
                doc['99popularity'] = popularity;
                doc.imdb_score = popularity / 10;
            }

            if (genres) {
                // filter out genres not available in db
                let availableGenres = await process.mongo
                    .db('imdb')
                    .collection('genres')
                    .find()
                    .toArray();
                availableGenres = availableGenres.map((_) => _.name);
                const newGenres = genres.filter(
                    (_) => !availableGenres.includes(_)
                );

                if (newGenres.length) {
                    await process.mongo
                        .db('imdb')
                        .collection('genres')
                        .insertMany(newGenres.map((name) => ({ name })));
                }
            }

            const updateResult = await process.mongo
                .db('imdb')
                .collection('movies')
                .findOneAndUpdate({ _id: ObjectID(movieId) }, { $set: doc });

            if (updateResult.ok) {
                res.json({
                    message: 'Successfully updated movie.',
                });
            }
        } catch (err) {
            return res.status(500).send({ message: err.message });
        }
    },
];
