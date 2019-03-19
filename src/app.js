const Express = require("express");
const BodyParser = require("body-parser");
const MongoClient = require("mongodb").MongoClient;
const ObjectId = require("mongodb").ObjectID;
const imdb = require('./imdb.js');
const DENZEL_IMDB_ID = 'nm0000243';
const graphqlHTTP = require('express-graphql');
const {
    GraphQLObjectType,
    GraphQLID,
    GraphQLString,
    GraphQLInt,
    GraphQLSchema,
    GraphQLList
} = require('graphql');

movieType = new GraphQLObjectType({
    name: 'Movie',
    fields: {
        link: { type: GraphQLString },
        metascore: { type: GraphQLInt },
        year: { type: GraphQLInt },
        synopsis: { type: GraphQLString },
        title: {type: GraphQLString},
        review: {type: GraphQLString},
        date: {type: GraphQLString}
    }
});

const queryType = new GraphQLObjectType({
    name: 'Query',
    fields: {
        hello: {
            type: GraphQLString,

            resolve: function () {
                return "Hello World";
            }
        },
        saveDateAndReview: {
        	type: movieType,
        	args: {
        		id: {type: GraphQLString},
        		date: {type:GraphQLString},
        		review: {type: GraphQLString}
        	},
        	resolve: async function(source, args){
        		await collection.updateOne({"id":args.id},{$set:{"date":args.date,"review":args.review}});
        		return collection.findOne({"id":args.id});
        	}
        },
        searchingMovieMetascoreAndLimit: {
        	type: new GraphQLList(movieType),
        	args: {
        		metascore: {type: GraphQLInt},
        		limit: {type: GraphQLInt}
        	},
        	resolve: async function(source, args){
        		const res = await collection.find({"metascore":{$gte:args.metascore}}).limit(args.limit).toArray();
        		return res;
        	}
        },
        searchingMovieID: {
            type: movieType,
            args:{
                id:{type: GraphQLString}
            },
            resolve: function (source, args) {
                return collection.findOne({"id":args.id});
            }
        },
        searchingMovieName: {
        	type: movieType,
        	args:{
        		id:{type: GraphQLString}
        	},
        	resolve: function(source, args){
        		return collection.findOne({"title":args.id});
        	}
        },

        populateMovies: {
        	type: GraphQLString,
        	resolve: async function() {
        		await sandbox(DENZEL_IMDB_ID);
        		return "done";
        	}
        	
        },
       randomMustWatch:{
       	type: movieType,
       	resolve:  async function(request, response) {
       		N = await collection.countDocuments({ "metascore": {$gte:70}});
       		R = await Math.floor(Math.random() * N);
			const random = await collection.find({ "metascore": {$gte:70}}).limit(1).skip(R).toArray();
			return random[0];
       	}
       }

        
    }


});

const schema = new GraphQLSchema({ query: queryType });

const CONNECTION_URL = "mongodb+srv://UserRW:5643789012@denzelmovies-n4jmw.mongodb.net/test?retryWrites=true";
const DATABASE_NAME = "DenzelMovies";


var app = Express();

app.use(BodyParser.json());
app.use(BodyParser.urlencoded({ extended: true }));

var database, collection;

app.listen(9292, () => {
	    MongoClient.connect(CONNECTION_URL, { useNewUrlParser: true }, (error, client) => {
        if(error) {
            throw error;
        }
        database = client.db(DATABASE_NAME);
        collection = database.collection("people");
        console.log("Connected to `" + DATABASE_NAME + "`!");
    });
});

app.use('/graphql', graphqlHTTP({
    schema: schema,
    graphiql: true,
}));

async function sandbox (actor) {
	try{
	collection.drop();
	console.log("fetching the movies...");
	const movies = await imdb(actor);
	console.log(`total : ${movies.length} movies `);
	for(var i =0; i< movies.length; i++)
	{
		collection.insertOne(movies[i]);
		console.log(`element ${i} inserted`);
	}
	return movies;
	process.exit(0);
	}
	catch (e){
		console.error(e);
		process.exit(0);
	}

}

app.get("/movies/populate", (request, response) => {
	sandbox(DENZEL_IMDB_ID);
	response.send("Population inserted");
});



app.get("/movies", (request, response) => {
    collection.findOne({"metascore":{$gte:70}}, (error, result) => {
    	if(error) {
            return response.status(500).send(error);
        }
        response.send(result);
    });
    
});

app.get("/movies/search", (request, response) => {
	requestQuery=request.query;
	var metascore=parseInt(requestQuery.metascore)
	var limit=parseInt(requestQuery.limit)
	collection.find({"metascore":{$gte:metascore}}).limit(limit).toArray((error, result) => {
		if(error) {
			return response.status(500).send(error);
		}
		response.send(result);
	});
});


app.get("/movies/:id", (request, response) => {
    collection.findOne({ "id": request.params.id }, (error, result) => {
        if(error) {
            return response.status(500).send(error);
        }
        response.send(result);
    });
});


app.post("/movies/:id", (request, response) => {
    requestBody=request.body;
    collection.updateOne({"id":request.params.id},{$set:{"date":requestBody.date,"review":requestBody.review}},(error, result) => {           
    if(error) {
        return response.status(500).send(error);
    }           
    response.send(request.params.id)          
    });
});










