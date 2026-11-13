const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const tweetController = require('../controllers/tweetController');

// Every tweet route is protected: anonymous visitors are redirected to login.
router.use(requireAuth);

router.get('/', tweetController.index);
router.get('/new', tweetController.newForm);
router.post('/', tweetController.create);
router.get('/:id/edit', tweetController.editForm);
router.put('/:id', tweetController.update);
router.delete('/:id', tweetController.destroy);
router.get('/:id', tweetController.show);

module.exports = router;
