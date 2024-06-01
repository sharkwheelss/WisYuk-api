const pool = require('./db');
const bcrypt = require('bcrypt');

const signUpHandler = async (request, h) => {

};

const loginHandler = async (request, h) => {
    const { email, password } = request.payload;

    // 
    // Cek kalau user sama password yg dikirim kosong
    if (!email || !password) {
        return h.response({
            status: 'fail',
            message: 'email and password are required'
        }).code(400);
    }

    try {
        const [rows] = await pool.query('SELECT * FROM users WHERE email=?;', [email]);

        // Misal kalau tidak ada data yang cocok a.k.a belum sign up
        if (rows.length === 0) {
            return h.response({
                status: 'fail',
                message: 'user tidak ditemukan'
            }).code(401);
        }

        // data ditemukan
        const user = rows[0];

        // decrypt password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return h.response({
                status: 'fail',
                message: 'password salah'
            }).code(401);
        }

        return h.response({
            status: 'success',
            message: 'login successful',
            user
        }).code(200);

    } catch (err) {
        console.error(err);
        return h.response({
            status: 'fail',
            message: 'internal server error'
        }).code(500);
    }
};

module.exports = {
    signUpHandler,
    loginHandler,
};