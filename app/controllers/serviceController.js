const fs = require('fs');
const PizZip = require('pizzip');
const Docxtemplater = require('docxtemplater');

exports.get_start = function (req, res) {
    req.session.outcomes = [];
    res.render('service-assurance/check-what-assurance-you-need-for-your-service');

};


exports.get_outcome = function (req, res) {
    if (req.params.outcome) {
        const { outcome } = req.params;
        res.render('service/outcome', { outcome });
    }
    else {
        const outcomesArray = req.session.outcomes || [];
        res.render('service/outcome-dynamic', { outcomesArray });
    }
};


exports.get_doc = function (req, res) {

    const content = fs.readFileSync('app/assets/templates/outcome.docx', 'binary');
    const zip = new PizZip(content);
    const doc = new Docxtemplater(zip);

    const date = new Date(); // This will give you the current date and time
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const formattedDate = date.toLocaleDateString('en-GB', options);

    const outcomesArray = req.session.outcomes

    // loop the array and get the outcomes in the same way the view does and generate into the nextSteps paramter

    let message = ""; // Initialise an empty string to hold the message

    if (outcomesArray.assessmenttype === "xgov-sa") {
        message = "You need a cross-gov panel service assessment";
    } else if (outcomesArray.assessmenttype === "dfe-sa") {
        message = "You need a DfE panel service assessment";
    } else if (outcomesArray.assessmenttype === "dfe-pr") {
        message = "You need a DfE panel peer review";
    }



    const data = {
        outcome: message,
        now: formattedDate,
        crits_no: outcomesArray.crits === "No" || false
    }

    doc.setData(data);

    try {
        doc.render();
    } catch (error) {
        console.error(error);
        return res.status(500).send('An error occurred while generating the document.');
    }

    const buffer = doc.getZip().generate({ type: 'nodebuffer' });

    const filename = 'assurance_outcome.docx';

    res.setHeader('Content-Disposition', 'attachment; filename=' + filename);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');

    res.send(buffer);

};



// POSTS //



exports.post_phase = async function (req, res) {

    const { phase } = req.body;

    if (phase == 'Discovery') {
        return res.redirect('/service/service-standard');
    }
    if (phase == 'Dontknow') {
        return res.redirect('/service/outcome/3');
    }

    if (!req.session.outcomes) {
        req.session.outcomes = {};
    }

    req.session.outcomes.phase = phase;

    return res.redirect('/service/locationinphase');
}



exports.post_service_standard = async function (req, res) {
    const { servicestandard } = req.body;
    let outcome = servicestandard == 'Yes' ? '1' : '2'
    return res.redirect('/service/outcome/' + outcome);
}


exports.post_location = async function (req, res) {
    const { locationinphase } = req.body;

    if (!req.session.outcomes) {
        req.session.outcomes = {};
    }

    req.session.outcomes.locationinphase = locationinphase;

    return res.redirect('/service/digicomms');
}

exports.post_digicomms = async function (req, res) {
    const { digicomms } = req.body;

    if (!req.session.outcomes) {
        req.session.outcomes = {};
    }

    req.session.outcomes.digicomms = digicomms;


    return res.redirect('/service/businesspartner');
}

exports.post_businesspartner = async function (req, res) {
    const { businesspartner } = req.body;

    if (!req.session.outcomes) {
        req.session.outcomes = {};
    }

    req.session.outcomes.businesspartner = businesspartner;


    return res.redirect('/service/transactional');
}

exports.post_transactional = async function (req, res) {
    const { transactional } = req.body;

    if (!req.session.outcomes) {
        req.session.outcomes = {};
    }

    req.session.outcomes.transactional = transactional;

    if (transactional == 'Yes') {
        req.session.outcomes.assessmenttype = 'dfe-sa';
        return res.redirect('/service/transactioncount');
    }
    else {
        req.session.outcomes.assessmenttype = 'dfe-pr';
        return res.redirect('/service/campaign');
    }
}

exports.post_transactioncount = async function (req, res) {
    const { transactioncount } = req.body;

    if (!req.session.outcomes) {
        req.session.outcomes = {};
    }

    req.session.outcomes.transactioncount = transactioncount;

    if (transactioncount == 'Yes') {
        req.session.outcomes.assessmenttype = 'xgov-sa';
        return res.redirect('/service/customcomponents');
    }
    else {
        req.session.outcomes.assessmenttype = 'dfe-sa';
        return res.redirect('/service/civilservice');
    }

}

exports.post_campaign = async function (req, res) {
    const { campaign } = req.body;

    if (!req.session.outcomes) {
        req.session.outcomes = {};
    }

    req.session.outcomes.campaign = campaign;
    req.session.outcomes.assessmenttype = 'dfe-pr';


    return res.redirect('/service/usingformbuilder');
}

exports.post_civilservice = async function (req, res) {
    const { civilservants } = req.body;

    if (!req.session.outcomes) {
        req.session.outcomes = {};
    }

    req.session.outcomes.civilservants = civilservants;


    if (civilservants == 'Yes') {
        req.session.outcomes.assessmenttype = 'xgov-sa';
        return res.redirect('/service/customcomponents');
    }
    else {
        req.session.outcomes.assessmenttype = 'dfe-pr';
        return res.redirect('/service/usingformbuilder');
    }
}

exports.post_usingformbuilder = async function (req, res) {
    const { usingformbuilder } = req.body;

    if (!req.session.outcomes) {
        req.session.outcomes = {};
    }

    req.session.outcomes.usingformbuilder = usingformbuilder;


        

    if (usingformbuilder == 'Yes') {
       
        return res.redirect('/service/formbuilder');
    }
    else {
        return res.redirect('/service/customcomponents');
    }



}

exports.post_formbuilder = async function (req, res) {
    const { formbuilder } = req.body;

    if (!req.session.outcomes) {
        req.session.outcomes = {};
    }

    req.session.outcomes.formbuilder = formbuilder;

   

    if (formbuilder == 'Yes') {
        req.session.outcomes.assessmenttype = 'dfe-sa';
    }
    else {
        req.session.outcomes.assessmenttype = 'dfe-pr';
    }


    return res.redirect('/service/customcomponents');
}


exports.post_customcomponents = async function (req, res) {
    const { customcomponents } = req.body;

    if (!req.session.outcomes) {
        req.session.outcomes = {};
    }

    req.session.outcomes.customcomponents = customcomponents;


    return res.redirect('/service/crits');
}

exports.post_crits = async function (req, res) {
    const { crits } = req.body;

    if (!req.session.outcomes) {
        req.session.outcomes = {};
    }

    req.session.outcomes.crits = crits;

    return res.redirect('/service/signin');
}

exports.post_signin = async function (req, res) {
    const { signin } = req.body;

    if (!req.session.outcomes) {
        req.session.outcomes = {};
    }

    req.session.outcomes.signin = signin;

    return res.redirect('/service/personaldata');
}

exports.post_personaldata = async function (req, res) {
    const { personaldata } = req.body;

    if (!req.session.outcomes) {
        req.session.outcomes = {};
    }

    req.session.outcomes.personaldata = personaldata;

    return res.redirect('/service/kpis');
}

exports.post_kpis = async function (req, res) {
    const { kpis } = req.body;

    if (!req.session.outcomes) {
        req.session.outcomes = {};
    }

    req.session.outcomes.kpis = kpis;

    return res.redirect('/service/domain');
}

exports.post_domain = async function (req, res) {
    const { domain } = req.body;

    if (!req.session.outcomes) {
        req.session.outcomes = {};
    }

    req.session.outcomes.domain = domain;


    if(req.session.outcomes.transactional === 'Yes' && req.session.outcomes.transactioncount === 'Yes'){
        req.session.outcomes.assessmenttype = 'xgov-sa';
    }

    if(req.session.outcomes.transactional === 'Yes' && req.session.outcomes.transactioncount === 'No'){
        req.session.outcomes.assessmenttype = 'dfe-sa';
    }

    if(req.session.outcomes.transactional === 'No' && req.session.outcomes.formbuilder === 'No'){
        req.session.outcomes.assessmenttype = 'dfe-pr';
    }

    if(req.session.outcomes.transactional === 'No' && req.session.outcomes.formbuilder === 'Yes'){
        req.session.outcomes.assessmenttype = 'dfe-sa';
    }


    console.log(req.session)

    if (req.session.outcomes.phase === "Beta") {

        return res.redirect('/service/audit');
    }
    else {
        return res.redirect('/service/outcome');
    }
}

exports.post_audit = async function (req, res) {
    const { audit } = req.body;

    if (!req.session.outcomes) {
        req.session.outcomes = {};
    }

    req.session.outcomes.audit = audit;

    return res.redirect('/service/statement');
}

exports.post_statement = async function (req, res) {
    const { statement } = req.body;

    if (!req.session.outcomes) {
        req.session.outcomes = {};
    }

    req.session.outcomes.statement = statement;

    return res.redirect('/service/outcome');
}