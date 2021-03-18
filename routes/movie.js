const router = require('express').Router();
const authorize = require('../helpers/authorize');
const Role = require('../helpers/role');
const MovieController = require('../controllers/MovieController');

router.get('/', MovieController.movieList);

router.use(authorize(Role.Admin));
router.post('/', MovieController.movieCreate);
router.put('/:id', MovieController.movieUpdate);
router.delete('/:id', MovieController.movieDelete);

module.exports = router;
