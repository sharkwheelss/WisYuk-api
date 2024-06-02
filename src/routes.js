const { config } = require("dotenv");
const {
  signUpHandler,
  loginHandler,
  viewProfilHandler,
  editProfilHandler,
  addUserPreferencesHandler,
  getAllUserPreferencesHandler,
  getUserPreferencesByIdHandler,
  editUserPreferencesByIdHandler,
  deleteUserPreferencesByIdHandler,
  addHomePageHandler,
  getAllHomePageHandler,
  getHomePageByIdHandler,
  editHomePageByIdHandler,
  deleteHomePageByIdHandler,
  addPaymentMethodHandler,
  getAllPaymentMethodHandler,
  getPaymentMethodByIdHandler,
  editPaymentMethodByIdHandler,
  deletePaymentMethodByIdHandler,
} = require("./handlers");
const multer = require("multer");
const upload = multer({ dest: "uploads/" });

const routes = [
  {
    method: "POST",
    path: "/signup",
    config: {
      payload: {
        output: "stream",
        parse: true,
        multipart: true,
        allow: "multipart/form-data",
        maxBytes: 1000000,
      },
      handler: signUpHandler,
    },
  },
  {
    method: "POST",
    path: "/login",
    handler: loginHandler,
  },
  {
    method: "GET",
    path: "/profile/{userId}",
    handler: viewProfilHandler,
  },
  {
    method: "PUT",
    path: "/profile/{userId}",
    config: {
      payload: {
        output: "stream",
        parse: true,
        multipart: true,
        allow: "multipart/form-data",
        maxBytes: 1000000,
      },
      handler: signUpHandler,
    },
  },

  // User Preferences Page
  {
    method: "POST",
    path: "/user_preferences",
    handler: addUserPreferencesHandler,
  },
  {
    method: "GET",
    path: "/user_preferences",
    handler: getAllUserPreferencesHandler,
  },
  {
    method: "GET",
    path: "/user_preferences/{userPreferenceId}",
    handler: getUserPreferencesByIdHandler,
  },
  {
    method: "PUT",
    path: "/user_preferences/{userPreferenceId}",
    handler: editUserPreferencesByIdHandler,
  },
  {
    method: "DELETE",
    path: "/user_preferences/{userPreferenceId}",
    handler: deleteUserPreferencesByIdHandler,
  },
  // Home Page
  {
    method: "POST",
    path: "/home_pages",
    handler: addHomePageHandler,
  },
  {
    method: "GET",
    path: "/home_pages",
    handler: getAllHomePageHandler,
  },
  {
    method: "GET",
    path: "/home_pages/{homePageId}",
    handler: getHomePageByIdHandler,
  },
  {
    method: "PUT",
    path: "/home_pages/{homePageId}",
    handler: editHomePageByIdHandler,
  },
  {
    method: "DELETE",
    path: "/home_pages/{homePageId}",
    handler: deleteHomePageByIdHandler,
  },
  // Payment Method Page
  {
    method: "POST",
    path: "/payment_methods",
    handler: addPaymentMethodHandler,
  },
  {
    method: "GET",
    path: "/payment_methods",
    handler: getAllPaymentMethodHandler,
  },
  {
    method: "GET",
    path: "/payment_methods/{paymentMethodId}",
    handler: getPaymentMethodByIdHandler,
  },
  {
    method: "PUT",
    path: "/payment_methods/{paymentMethodId}",
    handler: editPaymentMethodByIdHandler,
  },
  {
    method: "DELETE",
    path: "/payment_methods/{paymentMethodId}",
    handler: deletePaymentMethodByIdHandler,
  },
];

module.exports = routes;
