/**
 * Author:          Andy Jones - Department for Education
 * Description:     Routes for the application
 * GitHub Issue:   https://github.com/DFE-Digital/service-assurance-service/issues/4
 */

// DEPENDENCIES //

const express = require('express')
const router = express.Router()

const service = require('./controllers/serviceController.js');

router.get("/service-assurance/check-what-assurance-you-need-for-your-service", service.get_start)
router.get("/service/outcome/:outcome", service.get_outcome)
router.get("/service/doc", service.get_doc)

router.get("/service/outcome", service.get_outcome)
router.post("/service/phase", service.post_phase);
router.post("/service/location-in-phase", service.post_location);
router.post("/service/service-standard", service.post_service_standard);
router.post("/service/digicomms", service.post_digicomms);
router.post("/service/businesspartner", service.post_businesspartner);
router.post("/service/transactional", service.post_transactional);
router.post("/service/transactioncount", service.post_transactioncount);
router.post("/service/civilservice", service.post_civilservice);
router.post("/service/campaign", service.post_campaign);
router.post("/service/usingformbuilder", service.post_usingformbuilder);
router.post("/service/formbuilder", service.post_formbuilder);
router.post("/service/customcomponents", service.post_customcomponents);
router.post("/service/crits", service.post_crits);
router.post("/service/signin", service.post_signin);
router.post("/service/kpis", service.post_kpis);
router.post("/service/personaldata", service.post_personaldata);
router.post("/service/domain", service.post_domain);
router.post("/service/audit", service.post_audit);
router.post("/service/statement", service.post_statement);


// Exports
module.exports = router