module.exports = ({ env }) => ({
  auth: {
    secret: env('ADMIN_JWT_SECRET', 'ad65aa81772d3655b3fd76f5f930c2e6'),
  },
});
