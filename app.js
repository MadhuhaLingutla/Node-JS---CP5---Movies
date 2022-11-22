const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");

const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "./moviesData.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
  } catch (e) {
    console.log(`DB error: ${e.message}`);
    process.exit(1);
  }
  app.listen(3000, () => console.log("Server successfully started"));
};

initializeDBAndServer();

const movieNameDbToResponse = (dbObject) => ({
  movieName: dbObject.movie_name,
});

const dbObjectToResponseObject = (dbObject) => ({
  movieId: dbObject.movie_id,
  directorId: dbObject.director_id,
  movieName: dbObject.movie_name,
  leadActor: dbObject.lead_actor,
});

const directorListDbToResponse = (dbObject) => ({
  directorId: dbObject.director_id,
  directorName: dbObject.director_name,
});

//Get movies list API

app.get("/movies/", async (request, response) => {
  const getMoviesQuery = `
    SELECT movie_name FROM movie
    `;
  const MoviesDbList = await db.all(getMoviesQuery);

  const moviesList = MoviesDbList.map((each) => movieNameDbToResponse(each));
  response.send(moviesList);
});

//Add a movie API

app.post("/movies/", async (request, response) => {
  const movieDetails = request.body;
  const { directorId, movieName, leadActor } = movieDetails;
  const addMovieQuery = `
    INSERT INTO movie (director_id,movie_name,lead_actor) VALUES (${directorId},'${movieName}','${leadActor}')
    `;
  const dbResponse = await db.run(addMovieQuery);
  const movieId = dbResponse.lastID;
  response.send(`Movie Successfully Added`);
});

//Get a movie details API

app.get("/movies/:movieId", async (request, response) => {
  const { movieId } = request.params;
  const getMovieDetails = `
    SELECT * FROM movie WHERE movie_id = ${movieId}
    `;
  const dbResponse = await db.get(getMovieDetails);
  const movieDetails = dbObjectToResponseObject(dbResponse);
  response.send(movieDetails);
});

//Update a movie details API

app.put("/movies/:movieId", async (request, response) => {
  const { movieId } = request.params;
  const movieDetails = request.body;
  const { directorId, movieName, leadActor } = movieDetails;
  const updateMovieQuery = `
    UPDATE movie 
    SET director_id = ${directorId},
    movie_name='${movieName}',
    lead_actor='${leadActor}'
    WHERE movie_id = ${movieId}
    `;
  const dbResponse = await db.run(updateMovieQuery);
  response.send("Movie Details Updated");
});

//Delete movie API

app.delete("/movies/:movieId", async (request, response) => {
  const { movieId } = request.params;
  const deleteMovieQuery = `DELETE FROM movie WHERE movie_id = ${movieId}`;
  await db.run(deleteMovieQuery);
  response.send("Movie Removed");
});

//Get directors list API

app.get("/directors/", async (request, response) => {
  const getDirectorsListQuery = `
    SELECT * FROM director
    `;
  const directorsDbList = await db.all(getDirectorsListQuery);

  const directorsList = directorsDbList.map((each) =>
    directorListDbToResponse(each)
  );
  response.send(directorsList);
});

//Get all movies directed by a director API

app.get("/directors/:directorId/movies/", async (request, response) => {
  const { directorId } = request.params;
  const getMoviesQuery = `
    SELECT movie_name FROM movie WHERE director_id=${directorId}
    `;
  const moviesListDb = await db.all(getMoviesQuery);
  const moviesList = moviesListDb.map((each) => movieNameDbToResponse(each));
  response.send(moviesList);
});

module.exports = app;
