const expressJwt = require('express-jwt');

function authJwt() {
    const secret = process.env.SECRET;
    const api = process.env.API_URL;
    return expressJwt({
        secret,
        algorithms: ['HS256'],
    }).unless(
      {
        path: [
          `${api}/users/login`,
          `${api}/users/register`,
          `${api}/users/update/*`
          `${api}/tradestore/*`
        ]
      }
    );
}

module.exports = authJwt;
