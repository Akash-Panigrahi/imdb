exports.genreList = (req, res) => {
    process.mongo
        .db('imdb')
        .collection('genres')
        .find({})
        .project({ _id: 0 })
        .toArray((err, docs) => {
            if (err) {
                return res.status(500).send(err.message);
            }

            res.json(docs);
        });
};
