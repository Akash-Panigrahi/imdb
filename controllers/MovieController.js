const { ObjectID } = require('mongodb');

exports.moviesList = (req, res) => {
    process.mongo
        .db('imdb')
        .collection('movies')
        .find()
        .toArray((err, docs) => {
            if (err) {
                return res.status(500).send(err.message);
            }

            res.json(docs);
        });
};

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
