require('dotenv').config();
const { link } = require('fs');
const { marked } = require('marked');
const axios = require('axios')

const client = require('../../middleware/contentful.js');

function cleanUpHtml(html) {
    return html
        .replace(/^\s*<p>|<\/p>\s*$/g, '')  // Strip <p> tags at the start and end
        .replace(/<p>\s*<\/p>/g, '')        // Remove empty <p></p> tags
        .replace(/<p>(\s*<br\s*\/?>\s*)<\/p>/g, '')  // Remove <p><br></p> sequences
        .trim();  // Remove any leading or trailing whitespace
}

exports.g_home = async function (req, res) {
    const standards = require('../data/content.json');
    return res.render('index', { standards });
}


exports.g_standard = async function (req, res) {
    const { slug } = req.params;

    // Split the standard into its parts, get the number before the first hyphen
    const standardParts = slug.split('-');
    const standardNumber = standardParts[0];

    const standardData = getContentForStandard(standardNumber);
    if (standardData === null) {
        return res.render('index');
    }

    try {

        const [standard] = await Promise.all([
            client.getEntries({
                content_type: 'standard',
                'fields.serviceStandard': standardNumber
            })
        ]);

        let data = standard.items.map(item => item.fields);

        const standards = require('../data/content.json');

        return res.render('standard_template.html', { standard: standardData, standards, data });

    } catch (error) {
        console.error('Error fetching data:', error.message)
        res.status(500).send('An error occurred while fetching the data.')
    }


}

exports.g_phase = async function (req, res) {
    const { phase } = req.params;
    const standards = require('../data/content.json');

    let matchedPhases = [];

    standards.forEach(standard => {
        standard.phases.forEach(p => {
            if (p.name.toLowerCase() === phase.toLowerCase() || p.name.toLowerCase() === 'all phases' || p.name.toLowerCase() === 'general considerations') {
                matchedPhases.push({
                    standard: standard.standard,
                    slug: standard.slug,
                    name: standard.name,
                    considerations: p.considerations.map(point => cleanUpHtml(marked(point))),
                    avoid: p.avoid.map(point => cleanUpHtml(marked(point)))
                });
            }
        });
    });

    if (matchedPhases.length > 0) {
        return res.render('phase_template.html', { phases: matchedPhases, phase });
    }

    return res.redirect('/');
}


function getContentForStandard(standard) {
    const data = require('../data/content.json');
    let content = data.find(s => s.standard == standard);

    if (content) {
        return {
            standard: content.standard,
            govLink: content.govLink,
            name: content.name,
            professions: content.professions,
            description: content.description.map(point => cleanUpHtml(marked(point))),
            why: content.why,
            links: content.links,
            dfeStandards: content.dfeStandards,
            phases: content.phases.map(phase => ({
                phaseName: phase.name,
                considerations: phase.considerations.map(point => cleanUpHtml(marked(point))),
                avoid: phase.avoid.map(point => cleanUpHtml(marked(point)))
            }))
        };
    } else {
        return null;
    }
}