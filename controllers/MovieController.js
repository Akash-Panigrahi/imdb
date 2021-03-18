const { ObjectID } = require('mongodb');
const { query, validationResult } = require('express-validator');

exports.movieList = [
    query('sort_by').optional().isIn(['99popularity', 'director', 'name']),
    query('order_by').optional().isIn(['asc', 'desc']),
    query('genres').optional().isString(),
    query('search').optional().isString().trim(),
    query('start').optional().isString().toInt(),
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { sortBy = '_id', orderBy = 'asc', genres, search, start = 0 } = req.query;

        const matchParams = {};
        if (genres) {
            matchParams.genre = { $all: genres.split(',') };
        }
        if (search) {
            const searchFilter = { $regex: search, $options: 'i' };
            matchParams.$or = [{ name: searchFilter }, { director: searchFilter }];
        }

        const pipeline = [];
        if (genres || search) {
            pipeline.push({ $match: matchParams });
        }

        const moviesFacet = [];
        if (sortBy) {
            moviesFacet.push({ $sort: { [sortBy]: orderBy === 'desc' ? -1 : 1 }});
        }
        if (start) {
            moviesFacet.push({ $skip: start })
        }
        moviesFacet.push({ $limit: 20 });

        pipeline.push({ $facet: {
            movies: moviesFacet,
            totalMovies: [{ $group: { _id: null, total: { $sum: 1 } } }]
        }});

        process.mongo
            .db('imdb')
            .collection('movies')
            .aggregate(pipeline)
            .toArray((err, docs) => {
                if (err) {
                    return res.status(500).send(err.message);
                }

                const { movies, totalMovies } = docs[0];
                res.json({ movies, totalMovies: totalMovies[0] ? totalMovies[0].total : 0 });
            });
    }];

exports.movieDelete = [
    (req, res) => {
        process.mongo
            .db('imdb')
            .collection('movies')
            .deleteOne({ _id: ObjectID(req.params.id) }, (err, result) => {
                if (err) {
                    return res.status(500).send(err.message);
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

exports.movieCreate = [(req, res) => {},];
exports.movieUpdate = [(req, res) => {},];
