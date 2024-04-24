const http = require('http');
const url = require('url');
const qs = require('querystring');
const { MongoClient } = require('mongodb');
 
const port = 3000;
const url_mongo = "mongodb+srv://mdumon:mydb123@cluster0.rvujnyd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
 
//create a MongoDB client
const client = new MongoClient(url_mongo, {
       useNewUrlParser: true,
       useUnifiedTopology: true,
});
 
//connect to MongoDB and start the server
client.connect(function (err) {
if (err) {
       console.error('Error connecting to MongoDB:', err);
       return;
}
 
console.log('Connected to MongoDB');
 
//use database and collection
const db = client.db('Stock');
const collection = db.collection('PublicCompanies');

//create server
http.createServer(function (req, res) {
       const reqUrl = url.parse(req.url, true);
       
       if (req.method === 'GET' && reqUrl.pathname === '/process') {
               body = "";
 
               req.on('data', function (chunk) {
                       body += chunk;
               });
 
               req.on('end', async function () {
               const formData = qs.parse(body);
               const searchTerm = formData.searchTerm;
               const searchType = formData.searchType;
 
               let query = {};
 
       if (searchType === 'symbol') {
               query = { "ticker": searchTerm };
       } else if (searchType === 'name') {
               query = {"name": { $regex: new RegExp(escape(searchTerm), 'i') } };
       }
           try {
               const companies = await collection.find(query).toArray();
           
               res.writeHead(200, {'Content-Type': 'text/html'});
               res.write("<head> <meta charset='utf-8'><title>Search Results </title></head>");
               res.write("<style> body {background-color: lightgreen; color: #354f52; text-align: center; font: Georgia; margin: auto;padding: auto;</style>");
               res.write("<h1 style='font-weight:bold; font-size: 50px; text-align:center; margin-top: 3%'> Search Results </h1>");
               res.write("<hr><br/>");
           
               if (companies.length > 0) {
                   res.write("<h3 style='font-size: 20px; text-align:center; color: #e63946'>Results: " + companies.length + "</h3>");
                   companies.forEach(function(stock) {
                       res.write("<div style='display:flex; justify-content:center; align-items:center; flex-direction:column;'>");
                       res.write("<p style='font-size: 16px; text-align: center;margin-top: 1%;'>Company: " + stock.company + ", Ticker: " + stock.ticker + ", Price: $" + stock.price + "</p>");
                       res.write("</div>");
                   });
               } else {
                   res.write("<h3 style='font-size: 20px; text-align:center; color: #e63946'>No results found</h3>");
               }
           
               res.end();
           } catch (error) {
               console.error('Error searching for companies:', error);
               res.writeHead(500, {'Content-Type': 'text/plain'});
               res.end('Error searching for companies');
           } finally {
               client.close();
           }
       });
       
       } else {
               //handle 404 Not Found
               res.writeHead(404, { 'Content-Type': 'text/plain' });
               res.end('Not Found');
       }
       }).listen(port, function () {
               console.log('Server is running on http://localhost:' + port);
       });
});
 
//function to escape special characters in the search term
function escape(text) {
       return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}
 
 