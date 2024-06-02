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
};

// User Preferences Handlers
const addUserPreferencesHandler = (request, h) => {
    const { users_id, preferences_id } = request.payload;
    const updated_at = new Date().toISOString();
    
    const id = nanoid(16);
    const newUserPreference = {
      id,
      users_id,
      preferences_id,
      updated_at,
    };
    userPreferences.push(newUserPreference);
  
    const isSuccess = userPreferences.filter((pref) => pref.id === id).length > 0;
    if (isSuccess) {
      return h
        .response({
          status: "success",
          message: "User preference berhasil ditambahkan",
          data: {
            userPreferenceId: id,
          },
        })
        .code(201);
    } else {
      return h
        .response({
          status: "fail",
          message: "User preference gagal ditambahkan",
        })
        .code(500);
    }
  };
  
  const getAllUserPreferencesHandler = (request, h) => {
    return h
      .response({
        status: "success",
        data: {
          userPreferences,
        },
      })
      .code(200);
  };
  
  const getUserPreferencesByIdHandler = (request, h) => {
    const { userPreferenceId } = request.params;
    const userPreference = userPreferences.find(pref => pref.id === userPreferenceId);
    if (userPreference) {
      return h
        .response({
          status: "success",
          data: {
            userPreference,
          },
        })
        .code(200);
    } else {
      return h
        .response({
          status: "fail",
          message: "User preference tidak ditemukan",
        })
        .code(404);
    }
  };
  
  const editUserPreferencesByIdHandler = (request, h) => {
    const { userPreferenceId } = request.params;
    const { users_id, preferences_id } = request.payload;
    const updated_at = new Date().toISOString();
  
    const index = userPreferences.findIndex(pref => pref.id === userPreferenceId);
    if (index !== -1) {
      userPreferences[index] = {
        ...userPreferences[index],
        users_id,
        preferences_id,
        updated_at,
      };
      return h
        .response({
          status: "success",
          message: "User preference berhasil diperbarui",
        })
        .code(200);
    } else {
      return h
        .response({
          status: "fail",
          message: "User preference tidak ditemukan",
        })
        .code(404);
    }
  };
  
  const deleteUserPreferencesByIdHandler = (request, h) => {
    const { userPreferenceId } = request.params;
    const index = userPreferences.findIndex(pref => pref.id === userPreferenceId);
    if (index !== -1) {
      userPreferences.splice(index, 1);
      return h
        .response({
          status: "success",
          message: "User preference berhasil dihapus",
        })
        .code(200);
    } else {
      return h
        .response({
          status: "fail",
          message: "User preference tidak ditemukan",
        })
        .code(404);
    }
  };

// Home Page Handlers
const addHomePageHandler = (request, h) => {
    const { title, content } = request.payload;
    const updated_at = new Date().toISOString();
    
    const id = nanoid(16);
    const newHomePage = {
      id,
      title,
      content,
      updated_at,
    };
    homePages.push(newHomePage);
  
    const isSuccess = homePages.filter((page) => page.id === id).length > 0;
    if (isSuccess) {
      return h
        .response({
          status: "success",
          message: "Halaman berhasil ditambahkan",
          data: {
            homePageId: id,
          },
        })
        .code(201);
    } else {
      return h
        .response({
          status: "fail",
          message: "Halaman gagal ditambahkan",
        })
        .code(500);
    }
  };
  
  const getAllHomePageHandler = (request, h) => {
    return h
      .response({
        status: "success",
        data: {
          homePages,
        },
      })
      .code(200);
  };
  
  const getHomePageByIdHandler = (request, h) => {
    const { homePageId } = request.params;
    const homePage = homePages.find(page => page.id === homePageId);
    if (homePage) {
      return h
        .response({
          status: "success",
          data: {
            homePage,
          },
        })
        .code(200);
    } else {
      return h
        .response({
          status: "fail",
          message: "Halaman tidak ditemukan",
        })
        .code(404);
    }
  };
  
  const editHomePageByIdHandler = (request, h) => {
    const { homePageId } = request.params;
    const { title, content } = request.payload;
    const updated_at = new Date().toISOString();
  
    const index = homePages.findIndex(page => page.id === homePageId);
    if (index !== -1) {
      homePages[index] = {
        ...homePages[index],
        title,
        content,
        updated_at,
      };
      return h
        .response({
          status: "success",
          message: "Halaman berhasil diperbarui",
        })
        .code(200);
    } else {
      return h
        .response({
          status: "fail",
          message: "Halaman tidak ditemukan",
        })
        .code(404);
    }
  };
  
  const deleteHomePageByIdHandler = (request, h) => {
    const { homePageId } = request.params;
    const index = homePages.findIndex(page => page.id === homePageId);
    if (index !== -1) {
      homePages.splice(index, 1);
      return h
        .response({
          status: "success",
          message: "Halaman berhasil dihapus",
        })
        .code(200);
    } else {
      return h
        .response({
          status: "fail",
          message: "Halaman tidak ditemukan",
        })
        .code(404);
    }
  };
  
  // Payment Method Handlers
  const addPaymentMethodHandler = (request, h) => {
    const { name, type } = request.payload;
    const updated_at = new Date().toISOString();
    
    const id = nanoid(16);
    const newPaymentMethod = {
      id,
      name,
      type,
      updated_at,
    };
    paymentMethods.push(newPaymentMethod);
  
    const isSuccess = paymentMethods.filter((method) => method.id === id).length > 0;
    if (isSuccess) {
      return h
        .response({
          status: "success",
          message: "Metode pembayaran berhasil ditambahkan",
          data: {
            paymentMethodId: id,
          },
        })
        .code(201);
    } else {
      return h
        .response({
          status: "fail",
          message: "Metode pembayaran gagal ditambahkan",
        })
        .code(500);
    }
  };
  
  const getAllPaymentMethodHandler = (request, h) => {
    return h
      .response({
        status: "success",
        data: {
          paymentMethods,
        },
      })
      .code(200);
  };
  
  const getPaymentMethodByIdHandler = (request, h) => {
    const { paymentMethodId } = request.params;
    const paymentMethod = paymentMethods.find(method => method.id === paymentMethodId);
    if (paymentMethod) {
      return h
        .response({
          status: "success",
          data: {
            paymentMethod,
          },
        })
        .code(200);
    } else {
      return h
        .response({
          status: "fail",
          message: "Metode pembayaran tidak ditemukan",
        })
        .code(404);
    }
  };
  
  const editPaymentMethodByIdHandler = (request, h) => {
    const { paymentMethodId } = request.params;
    const { name, type } = request.payload;
    const updated_at = new Date().toISOString();
  
    const index = paymentMethods.findIndex(method => method.id === paymentMethodId);
    if (index !== -1) {
      paymentMethods[index] = {
        ...paymentMethods[index],
        name,
        type,
        updated_at,
      };
      return h
        .response({
          status: "success",
          message: "Metode pembayaran berhasil diperbarui",
        })
        .code(200);
    } else {
      return h
        .response({
          status: "fail",
          message: "Metode pembayaran tidak ditemukan",
        })
        .code(404);
    }
  };
  
  const deletePaymentMethodByIdHandler = (request, h) => {
    const { paymentMethodId } = request.params;
    const index = paymentMethods.findIndex(method => method.id === paymentMethodId);
    if (index !== -1) {
      paymentMethods.splice(index, 1);
      return h
        .response({
          status: "success",
          message: "Metode pembayaran berhasil dihapus",
        })
        .code(200);
    } else {
      return h
        .response({
          status: "fail",
          message: "Metode pembayaran tidak ditemukan",
        })
        .code(404);
    }
  };

module.exports = {
    signUpHandler,
    loginHandler,
    viewProfilHandler,
    editProfilHandler,
    addUserPreferencesHandler,

 // Export User Preferences Handlers
  getAllUserPreferencesHandler,
  getUserPreferencesByIdHandler,
  editUserPreferencesByIdHandler,
  deleteUserPreferencesByIdHandler,

  // Export Home Page Handlers
  addHomePageHandler,
  getAllHomePageHandler,
  getHomePageByIdHandler,
  editHomePageByIdHandler,
  deleteHomePageByIdHandler,
  
  // Export Payment Method Handlers
  addPaymentMethodHandler,
  getAllPaymentMethodHandler,
  getPaymentMethodByIdHandler,
  editPaymentMethodByIdHandler,
  deletePaymentMethodByIdHandler,

};