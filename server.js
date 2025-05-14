// Needed for dotenv
require("dotenv").config();

// Needed for Express
var express = require('express')
var app = express()

// add this snippet after "var express = require('express')"
var axios = require('axios');

// child process for python
const { spawn } = require('child_process');

// Needed for EJS
app.set('view engine', 'ejs');

// Needed for public directory
app.use(express.static(__dirname + '/public'));

// Needed for parsing form data
app.use(express.json());       
app.use(express.urlencoded({extended: true}));

// Needed for Prisma to connect to database
const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient();

// Main landing page
app.get('/', async function(req, res) {

    // Try-Catch for any errors
    try {
        // Get all blog posts
        const blogs = await prisma.post.findMany({
                orderBy: [
                  {
                    id: 'desc'
                  }
                ]
        });

        // Render the homepage with all the blog posts
        await res.render('pages/home', { blogs: blogs });
      } catch (error) {
        res.render('pages/home');
        console.log(error);
      } 
});

// About page
app.get('/about', function(req, res) {
    res.render('pages/about');
});

// New post page
app.get('/new', function(req, res) {
    res.render('pages/new');
});

// Create a new post
app.post('/new', async function(req, res) {
    
    // Try-Catch for any errors
    try {
        // Get the title and content from submitted form
        const { title, content } = req.body;

        // Reload page if empty title or content
        if (!title || !content) {
            console.log("Unable to create new post, no title or content");
            res.render('pages/new');
        } else {
            // Create post and store in database
            const blog = await prisma.post.create({
                data: { title, content },
            });

            // Redirect back to the homepage
            res.redirect('/');
        }
      } catch (error) {
        console.log(error);
        res.render('pages/new');
      }

});

// Delete a post by id
app.post("/delete/:id", async (req, res) => {
    const { id } = req.params;
    
    try {
        await prisma.post.delete({
            where: { id: parseInt(id) },
        });
      
        // Redirect back to the homepage
        res.redirect('/');
    } catch (error) {
        console.log(error);
        res.redirect('/');
    }
  });

// Adds a new route - demo
app.get('/demo', function(req, res) {
  res.render('pages/demo');
});

// add this snippet before 
app.get('/weather', async (req, res) => {
    try {
      const response = await axios.get('https://api-open.data.gov.sg/v2/real-time/api/twenty-four-hr-forecast');
      res.render('pages/weather', { weather: response.data });
    } catch (error) {
      console.error(error);
      res.send('Error fetching weather data');
    }
});

app.get('/python', async (req, res) => {
    const firstNum = 4;
    const secondNum = 7;

    let dataToSend;
    // spawn new child process to call the python script 
    // and pass the variable values to the python script
    const python = spawn('python', ['scripts/python.py', firstNum , secondNum]);
    // collect data from script
    python.stdout.on('data', function (data) {
        console.log('Pipe data from python script ...');
        dataToSend = data.toString();
    });
    // in close event we are sure that stream from child process is closed
    python.on('close', (code) => {
        console.log(`child process close all stdio with code ${code}`);
        // send data to browser
        res.send(dataToSend)
    });
  
    /* try {
      
      res.render('pages/python', { weather: response.data });
    } catch (error) {
      console.error(error);
      res.send('Error fetching python script data');
    }*/
});


// Tells the app which port to run on
app.listen(8080);