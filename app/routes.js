const express = require('express')
const router = express.Router()


const standardController = require('./controllers/standardController.js');

router.get("/", standardController.g_home);
router.get("/service-standard/:slug", standardController.g_standard);



module.exports = router