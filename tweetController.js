const mongoose = require('mongoose');
const Tweet = require('../models/Tweet');
exports.index = async (req, res, next) => {
  try {
    const tweets = await Tweet.find()
      .populate('author', 'name')
      .sort({ createdAt: -1 });
    res.render('tweets/index', { title: 'All tweets', tweets });
  } catch (error) {
    next(error);
  }
};

exports.newForm = (req, res) => {
  res.render('tweets/new', {
    title: 'Create a tweet',
    error: null,
    values: { title: '', tweet: '' }
  });
};

exports.create = async (req, res, next) => {
  try {
    const title = (req.body.title || '').trim();
    const tweet = (req.body.tweet || '').trim();

    if (!title || !tweet) {
      return res.status(400).render('tweets/new', {
        title: 'Create a tweet',
        error: 'Both title and tweet fields are required.',
        values: { title, tweet }
      });
    }
    const newTweet = new Tweet({
      title,
      tweet,
      author: req.session.user.id
    });

    await newTweet.save();
    res.redirect('/tweets?message=Tweet created successfully.');
  } catch (error) {
    if (error.name === 'ValidationError') {
      return res.status(400).render('tweets/new', {
        title: 'Create a tweet',
        error: Object.values(error.errors).map(item => item.message).join(' '),
        values: { title: req.body.title || '', tweet: req.body.tweet || '' }
      });
    }
    next(error);
  }
};

exports.show = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).render('error', { title: 'Invalid tweet', message: 'The tweet ID is invalid.' });
    }
    const tweet = await Tweet.findById(req.params.id).populate('author', 'name');
    if (!tweet) {
      return res.status(404).render('error', { title: 'Not found', message: 'Tweet not found.' });
    }
    res.render('tweets/show', { title: tweet.title, tweet });
  } catch (error) {
    next(error);
  }
};

exports.editForm = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).render('error', { title: 'Invalid tweet', message: 'The tweet ID is invalid.' });
    }
    const tweet = await Tweet.findById(req.params.id);
    if (!tweet) {
      return res.status(404).render('error', { title: 'Not found', message: 'Tweet not found.' });
    }
    if (tweet.author.toString() !== req.session.user.id) {
      return res.status(403).render('error', { title: 'Forbidden', message: 'You can only edit your own tweets.' });
    }
    res.render('tweets/edit', {
      title: 'Edit tweet',
      error: null,
      tweet,
      values: { title: tweet.title, tweet: tweet.tweet }
    });
  } catch (error) {
    next(error);
  }
};

exports.update = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).render('error', { title: 'Invalid tweet', message: 'The tweet ID is invalid.' });
    }
    const existing = await Tweet.findById(req.params.id);
    if (!existing) {
      return res.status(404).render('error', { title: 'Not found', message: 'Tweet not found.' });
    }
    if (existing.author.toString() !== req.session.user.id) {
      return res.status(403).render('error', { title: 'Forbidden', message: 'You can only edit your own tweets.' });
    }

    const values = {
      title: (req.body.title || '').trim(),
      tweet: (req.body.tweet || '').trim()
    };

    existing.title = values.title;
    existing.tweet = values.tweet;
    await existing.save();

    res.redirect(`/tweets/${existing._id}?message=Tweet updated successfully.`);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const tweet = await Tweet.findById(req.params.id);
      return res.status(400).render('tweets/edit', {
        title: 'Edit tweet',
        error: Object.values(error.errors).map(item => item.message).join(' '),
        tweet,
        values: { title: req.body.title || '', tweet: req.body.tweet || '' }
      });
    }
    next(error);
  }
};

exports.destroy = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(400).render('error', { title: 'Invalid tweet', message: 'The tweet ID is invalid.' });
    }
    const tweet = await Tweet.findById(req.params.id);
    if (!tweet) {
      return res.status(404).render('error', { title: 'Not found', message: 'Tweet not found.' });
    }
    if (tweet.author.toString() !== req.session.user.id) {
      return res.status(403).render('error', { title: 'Forbidden', message: 'You can only delete your own tweets.' });
    }
    await Tweet.findByIdAndDelete(req.params.id);
    res.redirect('/tweets?message=Tweet deleted successfully.');
  } catch (error) {
    next(error);
  }
};
