const router = require("express").Router();

router.get("/movies", (req, res) => {
  process.mongo
    .db("imdb")
    .collection("movies")
    .find()
    .toArray((err, docs) => {
      res.json(docs);
    });
});

module.exports = router;
