const bcrypt = require('bcryptjs');
const User = require('../models/User');
exports.showRegister = (req, res) => {
  if (req.session.user) return res.redirect('/tweets');
  res.render('auth/register', { title: 'Create account', error: null, values: {} });
};
exports.register = async (req, res, next) => {
  try {
    const name = (req.body.name || '').trim();
    const email = (req.body.email || '').trim().toLowerCase();
    const password = req.body.password || '';
    const confirmPassword = req.body.confirmPassword || '';

    if (!name || !email || !password || !confirmPassword) {
      return res.status(400).render('auth/register', {
        title: 'Create account',
        error: 'All fields are required.',
        values: { name, email }
      });
    }
    if (password.length < 8) {
      return res.status(400).render('auth/register', {
        title: 'Create account',
        error: 'Password must contain at least 8 characters.',
        values: { name, email }
      });
    }
    if (password !== confirmPassword) {
      return res.status(400).render('auth/register', {
        title: 'Create account',
        error: 'Passwords do not match.',
        values: { name, email }
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).render('auth/register', {
        title: 'Create account',
        error: 'An account with this email already exists.',
        values: { name, email }
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({ name, email, password: hashedPassword });

    req.session.regenerate((sessionError) => {
      if (sessionError) return next(sessionError);
      req.session.user = { id: user._id.toString(), name: user.name, email: user.email };
      req.session.save((saveError) => {
        if (saveError) return next(saveError);
        res.redirect('/tweets');
      });
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).render('auth/register', {
        title: 'Create account',
        error: 'This email is already registered.',
        values: { name: req.body.name || '', email: req.body.email || '' }
      });
    }
    next(error);
  }
};

exports.showLogin = (req, res) => {
  if (req.session.user) return res.redirect('/tweets');
  res.render('auth/login', { title: 'Log in', error: null, email: '' });
};

exports.login = async (req, res, next) => {
  try {
    const email = (req.body.email || '').trim().toLowerCase();
    const password = req.body.password || '';

    if (!email || !password) {
      return res.status(400).render('auth/login', {
        title: 'Log in',
        error: 'Email and password are required.',
        email
      });
    }

    const user = await User.findOne({ email });
    const passwordMatches = user ? await bcrypt.compare(password, user.password) : false;

    if (!user || !passwordMatches) {
      return res.status(401).render('auth/login', {
        title: 'Log in',
        error: 'Invalid email or password.',
        email
      });
    }

    req.session.regenerate((sessionError) => {
      if (sessionError) return next(sessionError);
      req.session.user = { id: user._id.toString(), name: user.name, email: user.email };
      req.session.save((saveError) => {
        if (saveError) return next(saveError);
        res.redirect('/tweets');
      });
    });
  } catch (error) {
    next(error);
  }
};

exports.logout = (req, res, next) => {
  req.session.destroy((error) => {
    if (error) return next(error);
    res.clearCookie('connect.sid');
    res.redirect('/login?message=You have logged out.');
  });
};
