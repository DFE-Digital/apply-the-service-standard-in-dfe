const express = require('express')
const nunjucks = require('nunjucks')
const https = require('https')
const axios = require('axios')
var dateFilter = require('nunjucks-date-filter')
var markdown = require('nunjucks-markdown')
var marked = require('marked')
const bodyParser = require('body-parser')
const lunr = require('lunr')
const fs = require('fs')
const path = require('path')
const cheerio = require('cheerio')
const config = require('./app/config')
const puppeteer = require('puppeteer');
const glob = require('glob');
const session = require('express-session');
const routes = require('./app/routes');

const helmet = require('helmet');

const favicon = require('serve-favicon');

const PageIndex = require('./middleware/pageIndex')
const pageIndex = new PageIndex(config)

var NotifyClient = require('notifications-node-client').NotifyClient

require('dotenv').config()
const app = express()

const notify = new NotifyClient(process.env.notifyKey)

app.set('trust proxy', 1)

app.use(session({
  secret: process.env.sessionKey,
  resave: false,
  saveUninitialized: true,
  cookie: { secure: false }
}))


app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
app.use(favicon(path.join(__dirname, 'public/assets/images', 'favicon.ico')));

app.set('view engine', 'html')

app.locals.serviceName = 'Apply the Service Standard in DfE'



// Set up Nunjucks as the template engine
var nunjuckEnv = nunjucks.configure(
  [
    'app/views',
    'node_modules/govuk-frontend',
    'node_modules/dfe-frontend-alpha/packages/components',
  ],
  {
    autoescape: true,
    express: app,
  },
)

nunjuckEnv.addFilter('date', dateFilter)
markdown.register(nunjuckEnv, marked.parse)

// Set up static file serving for the app's assets
app.use('/assets', express.static('public/assets'))

// Render sitemap.xml in XML format
app.get('/sitemap.xml', (_, res) => {
  res.set({ 'Content-Type': 'application/xml' });
  res.render('sitemap.xml');
});

app.get('/book', (req, res) => {
  res.redirect(process.env.bookURL)
})

app.get('/search', (req, res) => {
  console.log(req.query['searchterm'])
  const query = req.query['searchterm'] || ''
  const resultsPerPage = 10
  let currentPage = parseInt(req.query.page, 10)
  const results = pageIndex.search(query)
  console.log('Results: ' + results)
  console.log('Query: ' + query)

  const maxPage = Math.ceil(results.length / resultsPerPage)
  if (!Number.isInteger(currentPage)) {
    currentPage = 1
  } else if (currentPage > maxPage || currentPage < 1) {
    currentPage = 1
  }

  const startingIndex = resultsPerPage * (currentPage - 1)
  const endingIndex = startingIndex + resultsPerPage

  res.render('search.html', {
    currentPage,
    maxPage,
    query,
    results: results.slice(startingIndex, endingIndex),
    resultsLen: results.length,
  })
})

if (config.env !== 'development') {
  setTimeout(() => {
    pageIndex.init()
  }, 2000)
}

app.post('/submit-feedback', (req, res) => {
  const feedback = req.body.feedback_form_input
  const fullUrl = req.headers.referer || 'Unknown'

  //Send to notify after validation with recaptcha first
  //TODO: Implement recaptcha

  notify
    .sendEmail(process.env.feedbackTemplateID, 'design.ops@education.gov.uk', {
      personalisation: {
        feedback: feedback,
        page: fullUrl,
        service: "Apply the Service Standard"
      },
    })
    .then((response) => { })
    .catch((err) => console.log(err))

  return res.sendStatus(200)
})

app.get('/service-assurance', (req, res) => {

  // Get the sbs structure json file
  var structure = require('./app/views/service-assurance/sbs-structure.json');

  // Pass it to the view to work with

  return res.render('service-assurance/index.html', { structure })
})

app.get('/service-assurance/:slug', (req, res) => {

  var slug = req.params.slug;

  // Get the sbs structure json file
  var structure = require('./app/views/service-assurance/sbs-structure.json');

  // Pass it to the view to work with


  const filteredStructure = filterBySlug(structure, slug)[0];


  return res.render('service-assurance/page', { structure, filteredStructure, slug })
})

const filterBySlug = (json, slug) => {
  const filteredItems = [];
  for (const item of json) {
    const filteredSubPages = item.subPages.filter(subPage => subPage.slug === slug);
    if (filteredSubPages.length > 0) {
      const newItem = { ...item };
      newItem.subPages = filteredSubPages;
      filteredItems.push(newItem);
    }
  }
  return filteredItems;
};

app.use('/', routes)


app.get(/\.html?$/i, function (req, res) {
  var path = req.path
  var parts = path.split('.')
  parts.pop()
  path = parts.join('.')
  res.redirect(path)
})

app.get(/^([^.]+)$/, function (req, res, next) {
  matchRoutes(req, res, next)
})

// Handle 404 errors
app.use(function (req, res, next) {
  res.status(404).render('error.html')
})

// Handle 500 errors
app.use(function (err, req, res, next) {
  console.error(err.stack)
  res.status(500).render('error.html')
})

// Try to match a request to a template, for example a request for /test
// would look for /app/views/test.html
// and /app/views/test/index.html

function renderPath(path, res, next) {
  // Try to render the path
  res.render(path, function (error, html) {
    if (!error) {
      // Success - send the response
      res.set({ 'Content-type': 'text/html; charset=utf-8' })
      res.end(html)
      return
    }
    if (!error.message.startsWith('template not found')) {
      // We got an error other than template not found - call next with the error
      next(error)
      return
    }
    if (!path.endsWith('/index')) {
      // Maybe it's a folder - try to render [path]/index.html
      renderPath(path + '/index', res, next)
      return
    }
    // We got template not found both times - call next to trigger the 404 page
    next()
  })
}

matchRoutes = function (req, res, next) {
  var path = req.path

  // Remove the first slash, render won't work with it
  path = path.substr(1)

  // If it's blank, render the root index
  if (path === '') {
    path = 'index'
  }

  renderPath(path, res, next)
}

// Start the server

// // Run application on configured port
// if (config.env === 'development') {
//   app.listen(config.port - 50, () => {
//   });
// } else {
//   app.listen(config.port);
// }

app.listen(config.port)
