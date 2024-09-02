require('dotenv').config();
const { link } = require('fs');
const { marked } = require('marked');
const axios = require('axios')

function cleanUpHtml(html) {
    return html
        .replace(/^\s*<p>|<\/p>\s*$/g, '')  // Strip <p> tags at the start and end
        .replace(/<p>\s*<\/p>/g, '')        // Remove empty <p></p> tags
        .replace(/<p>(\s*<br\s*\/?>\s*)<\/p>/g, '')  // Remove <p><br></p> sequences
        .trim();  // Remove any leading or trailing whitespace
}


exports.g_standard = async function (req, res) {
    const {slug} = req.params;

    // Split the standard into its parts, get the number before the first hyphen
    const standardParts = slug.split('-');
    const standardNumber = standardParts[0];



    const standardData = getContentForStandard(standardNumber);
    if (standardData === null) {
        return res.render('index');
    }

    try {

        // Fetching posts
        const data = await axios({
            method: 'get',
            url: `${process.env.cmsurl}api/standards?populate=%2A`,
            headers: {
                Authorization: `Bearer ${process.env.apikey}`,
            }
        })

        console.log(data)

        const standards = data.data

        return res.render('standard_template.html', { standard: standardData, standards });

    } catch (error) {
        console.error('Error fetching data:', error.message)
        res.status(500).send('An error occurred while fetching the data.')
    }

 
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
            description: content.description,
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