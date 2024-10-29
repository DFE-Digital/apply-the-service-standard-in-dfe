require('dotenv').config()

const contentful = require('contentful');

const client = contentful.createClient({
    space: process.env.spaceID,
    accessToken: process.env.contentfulLiveAPI
});

module.exports = client;