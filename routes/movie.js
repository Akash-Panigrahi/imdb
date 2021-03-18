const router = require('express').Router();
const authorize = require('../helpers/authorize');
const Role = require('../helpers/role');
const MovieController = require('../controllers/MovieController');

router.get('/', MovieController.movieList);
router.delete('/:id', authorize(Role.Admin), MovieController.movieDelete);

module.exports = router;
