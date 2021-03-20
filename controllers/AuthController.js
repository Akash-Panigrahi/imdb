const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');

exports.login = [
    body('email', 'Email must be specified')
        .isLength({ min: 1 })
        .trim()
        .withMessage()
        .isEmail()
        .withMessage('Email must be a valid email address')
        .normalizeEmail(),
    body('password', 'Password must be specified.')
        .isLength({ min: 1 })
        .trim()
        .escape(),
    async (req, res) => {
        try {
            const errors = validationResult(req);

            if (!errors.isEmpty()) {
                return res.status(400).json({ errors: errors.array() });
            }

            const user = await process.mongo
                .db('imdb')
                .collection('users')
                .findOne({ email: req.body.email });

            if (!user) {
                return res.status(401).json({
                    message: 'Invalid credentials.',
                });
            }

            let userData = {
                email: user.email,
                role: user.role,
            };
            const jwtPayload = userData;
            const jwtData = {
                expiresIn: process.env.JWT_TIMEOUT_DURATION,
            };
            const secret = process.env.JWT_SECRET;
            userData.token = jwt.sign(jwtPayload, secret, jwtData, {
                algorithms: ['HS256'],
            });

            return res.json({
                message: 'Login Success.',
                data: userData,
            });
        } catch (err) {
            return res.status(500).send({ message: err.message });
        }
    },
];
