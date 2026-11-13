
function requireAuth(req, res, next) {
  if (!req.session.user) {
    return res.redirect('/login?message=Please log in to continue.');
  }
  next();
}

module.exports = { requireAuth };
