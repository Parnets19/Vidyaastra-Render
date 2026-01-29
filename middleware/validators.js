const { check } = require('express-validator');

exports.registerValidator = [
  check('name', 'Name is required').not().isEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password must be 6 or more characters').isLength({ min: 6 }),
  check('subject', 'Subject is required').not().isEmpty(),
  check('phone', 'Phone number is required').not().isEmpty()
];

exports.loginValidator = [
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password is required').exists()
];