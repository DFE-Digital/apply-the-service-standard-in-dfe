const express = require('express')
const router = express.Router()


const standardController = require('./controllers/standardController.js');

router.get("/", standardController.g_home);
router.get("/service-standard/:slug", standardController.g_standard);
router.get("/phases/:phase", standardController.g_phase);


module.exports = router