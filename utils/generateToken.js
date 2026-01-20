import jwt from 'jsonwebtoken';

const generateToken = (res, userId, tenantId) => {
    const token = jwt.sign({ userId, tenantId }, process.env.JWT_SECRET, {
        expiresIn: '30d',
    });

    res.cookie('jwt', token, {
        httpOnly: true,
        secure: true, // Always secure for cross-site (Render is HTTPS)
        sameSite: 'None', // Allow cross-site cookie
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
    });
};

export default generateToken;
