const crypto = require('crypto');
const Admin = require('../model/Admin');

const sessions = new Map();

function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}

function parseCookies(cookieHeader) {
    const cookies = {};
    if (!cookieHeader) return cookies;
    cookieHeader.split(';').forEach(cookie => {
        const [name, ...rest] = cookie.split('=');
        cookies[name.trim()] = decodeURIComponent(rest.join('='));
    });
    return cookies;
}

const requireAdmin = (req, res, next) => {
    const cookies = parseCookies(req.headers.cookie);
    const token = cookies['admin_session'];
    if (!token || !sessions.has(token)) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    req.admin = sessions.get(token);
    next();
};

const getAdminPanel = async (req, res) => {
    const cookies = parseCookies(req.headers.cookie);
    const token = cookies['admin_session'];
    const isAuthenticated = token && sessions.has(token);
    res.render('admin-panel', { isAuthenticated });
};

const adminLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                message: 'Email and password are required'
            });
        }

        const admin = await Admin.findOne({ where: { email } });

        if (!admin || admin.password !== password) {
            return res.status(401).json({
                success: false,
                message: 'Invalid email or password'
            });
        }

        const wantsJson = req.headers.accept && req.headers.accept.includes('application/json');

        const token = generateToken();
        sessions.set(token, { id: admin.id, email: admin.email });

        res.cookie('admin_session', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            path: '/',
            maxAge: 24 * 60 * 60 * 1000
        });

        if (wantsJson) {
            return res.status(200).json({
                success: true,
                message: 'Login successful'
            });
        }

        return res.redirect('/admin');
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: 'Login error',
            error: error.message
        });
    }
};

const adminLogout = (req, res) => {
    const cookies = parseCookies(req.headers.cookie);
    const token = cookies['admin_session'];
    if (token) sessions.delete(token);
    res.clearCookie('admin_session');
    return res.status(200).json({
        success: true,
        message: 'Logged out successfully'
    });
};

module.exports = {
    requireAdmin,
    getAdminPanel,
    adminLogin,
    adminLogout
};
