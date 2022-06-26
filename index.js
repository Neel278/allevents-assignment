// package imports
const express = require('express');
const cors = require('cors');
const router = express.Router();
// file imports
const indexRoutes = require('./routes');

// app initialization
const app = express();

// PORT defination
const PORT = process.env.PORT || 5000;

// middlewares
app.use(express.urlencoded({ extended: false }));
app.use(express.json());
app.use(cors({ origin: "*" }))
app.use(router);
// routes
router.use('/', indexRoutes);

// running server
app.listen(PORT, () => {
    console.log(`>> Server running on http://localhost:${PORT}`);
})
