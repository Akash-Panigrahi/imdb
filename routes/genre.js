const router = require('express').Router();
const GenreController = require('../controllers/GenreController');

router.get('/', GenreController.genreList);

module.exports = router;
