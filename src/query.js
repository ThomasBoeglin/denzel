const { GraphQLObjectType,
    GraphQLString
} = require('graphql');


//Define the Query
const queryType = new GraphQLObjectType({
    name: 'Query',
    fields: {
        hello: {
            type: GraphQLString,

            resolve: function () {
                return "Hello World";
            }
        }


        
    }


});

exports.queryType = queryType;