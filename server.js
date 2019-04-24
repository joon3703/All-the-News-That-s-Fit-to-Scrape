var express = require("express");
var mongoose = require("mongoose");
var exphbs = require("express-handlebars");
var logger = require("morgan");

// Axios is a promised-based http library, similar to jQuery's Ajax method
// It works on the client and on the server
var axios = require("axios");
var cheerio = require("cheerio");

// Mongoose
var Note = require("./models/Note");
var Article = require("./models/Article");
var databaseurl = 'mongodb://localhost/scrap';

mongoose.Promise = Promise;
var db = mongoose.connection;

if (process.env.MONGODB_URI) {
    mongoose.connect(process.env.MONGODB_URI);
} else {
    mongoose.connect(databaseurl);
};

// Initialize Express
var app = express();
var PORT = process.env.PORT || 8080;

// app set-ups
app.use(logger("dev"));
app.use(express.static("public"));
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Start the Server
app.listen(PORT, function() {
    console.log(
      "==> 🌎  Listening on port %s. Visit http://localhost:%s/ in your browser.",
      PORT,
      PORT
    );
});

// Handlebars
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

////// ROUTES //////
// default routes
app.get ("/", function(req, res) {
    res.render("index");
});

// Route for getting all Articles from the db
app.get("/articles", function(req, res) {
    // Grab every document in the Articles collection
    Article.find({})
      .then(function(err, data) {
        // If we were able to successfully find Articles, send them back to the client
        res.json(data);
      })
      .catch(function(err) {
        // If an error occurred, send it to the client
        res.json(err);
      });
  });

// Get route for scrapping the NYT website
app.get("/scrape", function(req, res) {
    axios.get("https://www.nytimes.com/section/world").then(function(response) {
        var $ = cheerio.load(response.data);
        var handlebarObject = {
            data:[]
        };
        $("article").each(function(i, element) {
            var result = {};
            result.title = $(this)
            .children("a")
            .text();
            result.link = $(this)
            .children("a")
            .attr("href");
            db.Article.create(result)
            .then(function(dbArticle) {
                console.log(dbArticle);
            })
            .catch(function(err) {
                console.log(err);
            });
        });
        res.send("Scrape Complete");
    });
});

