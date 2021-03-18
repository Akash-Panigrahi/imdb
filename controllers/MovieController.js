const { ObjectID } = require('mongodb');
const { query, validationResult } = require('express-validator');

exports.movieList = [
    query('sort_by').optional().isIn(['99popularity', 'director', 'name']),
    query('order_by').optional().isIn(['asc', 'desc']),
    query('genre').optional().isString(),
    query('search').optional().isString().trim(),
    (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { sortBy = '_id', orderBy = 'asc', genre, search } = req.query;
        const sortDirection = orderBy === 'desc' ? -1 : 1;
        const findParams = {};
        if (genre) {
            findParams.genre = { $all: genre.split(',') };
        }
        if (search) {
            const searchFilter = { $regex: search, $options: 'i' };
            findParams.$or = [{ name: searchFilter }, { director: searchFilter }];
        }

        process.mongo
            .db('imdb')
            .collection('movies')
            .find(findParams)
            .sort({ [sortBy]: sortDirection })
            .toArray((err, docs) => {
                if (err) {
                    return res.status(500).send(err.message);
                }

                res.json(docs);
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
