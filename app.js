const express = require('express')
const { getDb, connectToDb } = require('./db')
const { ObjectId } = require('mongodb')
const port = process.env.PORT || 4000

// init app & middleware
const app = express()
app.use(express.json())

// db connection
let db

connectToDb((err) => {
  if(!err){
    app.listen(port, () => {
      console.log('app listening on port', port)
    })
    db = getDb()
  }
})

// routes
app.get('/discover/movie', (req, res) => {
  // current page
  const page = req.query.page -1 || 0
  const booksPerPage = 20
  
  let books = []

  db.collection('discover')
    .find()
    //.sort({author: 1})
    .skip(page * booksPerPage)
    .limit(booksPerPage)
    .forEach(book => books.push(book))
    .then(() => {
      db.collection('discover').countDocuments().then(totalBooks => {
        const totalPages = Math.ceil(totalBooks / booksPerPage)
        res.status(200).json({ page: page+1, results: books, total_pages: totalPages, total_results: totalBooks })
      })
      // res.status(200).json({ page: page, results: books })
    })
    .catch(() => {
      res.status(500).json({error: 'Could not fetch the documents'})
    })
})

app.get('/movie/:id', (req, res) => {

  if (req.params.id) {

    const cheerio = require("cheerio");
    const axios = require("axios");
    
    const id = req.params.id;
    const url = `https://www.adultdvdempire.com/${id}`;
    
    console.log(url);
    
    const movie_data = [];
    
    async function getMovie() {
        try {
            const response = await axios.get(url);
            const $ = cheerio.load(response.data);

            const id = url ? url.split('/')[3] : '';
            
            // Extracting the title
            const title = $("h1").text().trim();
    
            // Extracting the backdrop path
            const backdropPathStyle = $("#previewContainer").attr("style");
            const backdrop_path = backdropPathStyle ? backdropPathStyle.match(/background-image:\s*url\(([^)]+)\)/)[1] : '';
    
            // Extracting genres
            const genres = [];
            $('.movie-page__content-tags__categories a').each((index, element) => {
                const href = $(element).attr('href');
                const name = $(element).text().trim();
                const id = href ? href.split('/')[1] : '';
                genres.push({ id, name });
            });
    
            // Extracting overview
            const overview = $(".synopsis-content").text().trim();
    
            // Extracting poster path
            const poster_path = $(".boxcover-container a").attr("data-href");
    
            // Extracting release date
            const releaseDateElement = $("div.col-sm-4 ul.list-unstyled li").filter(function() {
                return $(this).text().trim().startsWith("Released:");
            });
    
            const release_date = releaseDateElement.contents().filter(function() {
                return this.nodeType === 3; // Node type 3 is a text node
            }).text().trim();
    
            // Extracting runtime
            const runtimeElement = $("div.col-sm-4 ul.list-unstyled li").filter(function() {
                return $(this).text().trim().startsWith("Length:");
            });
    
            const runtime = runtimeElement.contents().filter(function() {
                return this.nodeType === 3; // Node type 3 is a text node
            }).text().trim();
    
            // Extracting vote average
            const vote_average = $(".rating-stars-avg").text().trim();
    
            // Extracting vote count
            const vote_count = $('e-user-actions[:variant="\'like\'"]').attr(':count') || 0;
    
            // Extracting backdrops
            const backdrops = [];
            $('div.col-xs-6 img.img-full-responsive').each((index, element) => {
                const file_path = $(element).attr('data-bgsrc');
                if (file_path) {
                    backdrops.push({ file_path });
                }
            });
    
            // Pushing data to movie_data array
            movie_data.push({
                id,
                title,
                backdrop_path,
                genres,
                overview,
                poster_path,
                release_date,
                runtime,
                vote_average,
                vote_count,
                images: { backdrops }
            });
    
            // Outputting the scraped data
            res.status(200).json(movie_data[0]);
    
        } catch (error) {
            console.error(error);
        }
    }
    
    getMovie();

  } else {
    res.status(500).json({error: 'Could not fetch the document'})
  }

})


app.get('/movie/:id/credits', (req, res) => {

  if (req.params.id) {

    const cheerio = require("cheerio");
    const axios = require("axios");
    
    const id = req.params.id;
    const url = `https://www.adultdvdempire.com/${id}`;
    
    const credits_data = [];
    
    async function getCredits() {
        try {
            const response = await axios.get(url);
            const $ = cheerio.load(response.data);
    
            const id = url ? url.split('/')[3] : '';
    
            const cast = [];
            $('.movie-page__content-tags__performers a').each((index, element) => {
                const href = $(element).attr('href');
                const name = $(element).text().trim();
                const character = $(element).text().trim();
                const performerId = href ? href.split('/')[1] : '';
                const poster_path = performerId ? `https://imgs1cdn.adultempire.com/actors/${performerId}h.jpg` : '';
                
                cast.push({ id: performerId, name, poster_path, character });
            });
    
            const crew = [];
            $('.movie-page__heading__movie-info a').each((index, element) => {
                const href = $(element).attr('href');
                const name = $(element).text().trim();
                const crewId = href ? href.split('/')[1] : '';
                const poster_path = crewId ? `https://imgs1cdn.adultempire.com/studio/${crewId}.jpg` : '';
    
                if (crewId) {
                    crew.push({ id: crewId, name, poster_path, "department": "Directing" });
                }            
            });
    
            credits_data.push({
                id,
                cast,
                crew
            });
    
            // Outputting the first object in the credits_data array without the surrounding brackets
            res.status(200).json(credits_data[0]);
    
        } catch (error) {
            console.error(error);
        }
    }
    
    getCredits();
          
  } else {
    res.status(500).json({error: 'Could not fetch the document'})
  }

})

// Search Movie ID
app.get('/search/:id', (req, res) => {

  if (req.params.id) {

    db.collection('discover')
      .findOne({id: req.params.id})
      .then(doc => {
        res.status(200).json(doc)
      })
      .catch(err => {
        res.status(500).json({error: 'Could not fetch the document'})
      })
      
  } else {
    res.status(500).json({error: 'Could not fetch the document'})
  }

})
