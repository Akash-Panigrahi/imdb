exports.genreList = (req, res) => {
    process.mongo
        .db('imdb')
        .collection('genres')
        .find({})
        .project({ _id: 0 })
        .sort({ name: 1 })
        .toArray((err, docs) => {
            if (err) {
                return res.status(500).send({ message: err.message });
            }

            res.json(docs);
        });
};
