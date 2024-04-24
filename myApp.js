// Process the form and present the results online
const http = require('http');
const fs = require('fs');
const { MongoClient } = require('mongodb');
const port = process.env.PORT || 3000;

// Load the html file to display form
http.createServer(function (req, res) {
    if (req.url === "/") {
        fs.readFile('front.html', function(err, html) {
            if (err) {
                console.error("Error reading file:", err);
                res.writeHead(500, {'Content-Type': 'text/plain'});
                res.end("Error loading HTML file.");
            } else {
                res.writeHead(200, {'Content-Type': 'text/html'});
                res.end(html);
            } 
        });
    } else if (req.url.startsWith("/process") && req.method === "GET") {
        const url = "mongodb+srv://mdumon:<password>@cluster0.rvujnyd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
        const client = new MongoClient(url, { useNewUrlParser: true, useUnifiedTopology: true });

        const queryData = new URLSearchParams(req.url.split('?')[1]);
        // assign information from form to variables
        const inputType = queryData.get('searchType');
        const searchTerm = queryData.get('searchTerm');

         // connect to database
        client.connect().then(() => {
            const database = client.db('Stock');
            const collection = database.collection('PublicCompanies');
            const query = inputType === "name" ? { "name": searchTerm } : {"ticker": searchTerm };
            return collection.find(query).toArray();
        }).then(docs => {
          // Display results in this style depending on if there
          // is a match in database or not
            res.writeHead(200, {'Content-Type': 'text/html'});
            res.write("<style>");
            res.write("body {text-align: left; font-family: Arial, sans-serif;}")
            res.write("h1 { color: #9181d4; }");
            res.write("div { margin-bottom: 10px; text-align: center;  max-width: 400px; margin 40px auto;}");
            res.write("p { color: #c28fdb; }");
            res.write("</style>");
            res.write("<h1>Search Results</h1>");
            if (docs.length === 0) {
                res.write("<p>No results found.</p>");
            } else {
                docs.forEach(function(doc) {
                    let companyName = 'N/A';
                    let ticker = 'N/A';
                    let price = 'N/A';
                    if (doc.name) {
                        companyName = doc.name;
                    }
                    if (doc.ticker) {
                        ticker = doc.ticker;
                    }
                    if (doc.price) {
                        price = doc.price;
                    }
                    res.write("<div style='background-color: #f0f0f0; padding: 10px;'>");
                    res.write(`<p>Company: ${companyName}, Ticker: ${ticker}, Price: ${price}</p>`);
                    res.write("</div>");
                });
            }
            res.end();
        // Error statements if connection fails
        }).catch(err => {
            console.error("Database query error:", err);
            res.writeHead(500, {'Content-Type': 'text/plain'});
            res.end("Database query error.");
        }).finally(() => {
            client.close();
        }); 
    } else {
        res.writeHead(404, {'Content-Type': 'text/plain'});
        res.end("Not Found");
    }
}).listen(port, () => {
    console.log(`Server running on port ${port}`);
});
