const pool = require('./db');
const bcrypt = require('bcrypt');
const { uploadFile } = require('./cloudStorage');
const fs = require('fs');
const path = require('path');
const { rejects } = require('assert');
const { request } = require('http');
const saltPass = 10;

// SIGN UP
const signUpHandler = async (request, h) => {
    const { name, email, password, promotion } = request.payload;
    // karena kolom image di cloud sql diisi dari url per item cloud storage
    const file = request.payload.image;

    if (!name || !email || !password || !promotion === undefined || !file) {
        return h.response({
            status: 'fail',
            message: 'all fields are required'
        }).code(400);
    }

    try {
        // cek dlu apakah sudah pernah daftar pakai email yg sama
        const [existingEmail] = await pool.query('SELECT * FROM users WHERE email=?', [email]);
        if (existingEmail.length > 0) {
            return h.response({
                status: 'fail',
                message: 'email already exists'
            }).code(409);
        }

        // Hash the password
        const hashedPass = await bcrypt.hash(password, saltPass);

        // save the file locally before uploading
        const filePath = path.join(__dirname, 'uploads', file.hapi.filename);
        const fileStream = fs.createWriteStream(filePath);

        file.pipe(fileStream);

        const imageUploadPromise = new Promise((resolve, reject) => {
            file.on('end', async () => {
                try {
                    const imageUrl = await uploadFile(filePath, `images/${file.hapi.filename}`);
                    resolve(imageUrl);
                } catch (err) {
                    reject(err);
                }
            });
        });

        const imageUrl = await imageUploadPromise;

        // isi current timestamp
        const timestamp = new Date();

        // Insert Query
        await pool.query('INSERT INTO users (name, email, password, bool_promotion, created_at, updated_at, image) VALUES (?,?,?,?,?,?,?);', [
            name,
            email,
            hashedPass,
            promotion,
            timestamp,
            timestamp,
            imageUrl
        ]);

        // Clean up the local file
        fs.unlinkSync(filePath);

        return h.response({
            status: 'success',
            message: 'sign up success'
        }).code(201);

    } catch (err) {
        console.error(err);
        return h.response({
            status: 'fail',
            message: 'internal server error'
        }).code(500);
    }
};

// LOGIN
const loginHandler = async (request, h) => {
    const { email, password } = request.payload;

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

// VIEW PROFIL
const viewProfilHandler = async (request, h) => {
    // id diambil dari route url
    const { userID } = request.params;

    try {
        // Query to get user email
        const [userRows] = await pool.query('SELECT email FROM users where id=?', [userID]);

        // cek apakah email ada
        if (userRows.length === 0) {
            return h.response({
                status: 'fail',
                message: 'email not found'
            }).code(404);
        }
        // email ditemukan
        const userEmail = userRows[0].email;

        // Query to get user preferences
        const [userPref] = await pool.query('SELECT p.name as preference_name FROM users u INNER JOIN users_preferences up on u.id = up.users_id INNER JOIN preferences p on p.id = up.preferences_id WHERE u.id = ?;', [userID]);
        if (userPref.length === 0) {
            return h.response({
                status: 'fail',
                message: 'email not found'
            }).code(404);
        }
        const preferences = userPref.map(row => row.preference_name);

        return h.response({
            status: 'success',
            data: {
                email: userEmail,
                preferences: preferences
            }
        }).code(200);

    } catch (err) {
        console.error(err);
        return h.response({
            status: 'fail',
            message: 'Internal server error'
        }).code(500);
    }
}

const editProfilHandler = async (request, h) => {
    const { userID } = request.params;
    const { name, password } = request.payload;
    const file = request.payload.image;

    // query for current data
    const [userRows] = await pool.query('SELECT name, password, updated_at FROM users WHERE id = ?', [userId]);
    if (userRows.length === 0) {
        return h.response({
            status: 'fail',
            message: 'email not found'
        }).code(404);
    }

    const userCurData = userRows[0];

    // Hash the new password
    let hashedPass = user.password;
    if (password) {
        hashedPass = await bcrypt.hash(password, 10);
    }

    // new image profil
    let imageUrl = user.image;
    if (file) {
        const imagePath = file.hapi.filename;
        imageUrl = await uploadFile(file.path, imagePath);
    }

    const updatedAt = new Date();

    // store old data into update_profile
    await pool.query('INSERT INTO update_profil (user_id, old_name, old_password, old_updated_at) VALUES (?, ?, ?, ?)',
        [userID, user.name, user.password, user.updated_at]);

    // update table users
    await pool.query('UPDATE users SET name = ?, password = ?, updated_at = ?, image = ? WHERE id = ?',
        [name, hashedPass, updatedAt, imageUrl, userID]);

    return h.response({
        status: 'success',
        message: 'Profile updated successfully',
    }).code(200);
}

module.exports = {
    signUpHandler,
    loginHandler,
    viewProfilHandler,
    editProfilHandler,
};