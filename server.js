
var express = require("express"),
    app = express(),
    request = require("request"),
    _ = require("underscore"),
    dust = require("dustjs-linkedin"),
    consolidate = require("consolidate");

var port = process.env.PORT || 8080;

var fs = require('fs');
var txData = [];

app.engine("dust", consolidate.dust);
app.set("template_engine", "dust");
app.set("views", __dirname + '/views');
app.set("view engine", "dust");
app.use(express.static(__dirname + '/assets'));

// Start the server
app.listen(port, function () {
    console.log("App running on port " + port + "!");
});


app.get("/tournaments", function (request, response) {

 
    var contents = fs.readFileSync('TournamentList.txt', 'ascii');
    
    var indexes = [0,1,2,3,4]

   _.each(contents.split("\n"), function (line) {
            // Split the text body into readable lines
            var splitLine;
            line = line.trim();
            splitLine = line.split(/[\t]+/);

                // Push each line into txData object
                txData.push({
                    organizer: splitLine[indexes[0]],
                    trail: splitLine[indexes[1]],
                    date: splitLine[indexes[2]],
                    lake: splitLine[indexes[3]],
                    ramp: splitLine[indexes[4]],
                    state: splitLine[indexes[5]],
                    txDetail: splitLine[indexes[6]],
                    results: splitLine[indexes[7]],
                });
        });

    response.render("tournaments",{txData: txData});
});

app.get("/kerr", function (request, response) {
    var url = "http://epec.saw.usace.army.mil/dsskerr.txt";
    var indexes = [0,1,2,3,4]
    let kerrPool = 300.0;
    getData(10, "Kerr", indexes, kerrPool, url, function(error, data) {
        if (error) {
            response.send(error);
            return;
        }
        else {
            response.render("lake", {data: data.reverse()})
        }
    });
});

app.get("/falls", function (request, response) {
    var url = "http://epec.saw.usace.army.mil/dssfalls.txt";
    var indexes = [0,1,"N/A","N/A",10]
    let fallsPool = 252.0;
    getData(11, "Falls", indexes, fallsPool, url, function(error, data) {
        if (error) {
            response.send(error);
            return;
        }
        else {
            response.render("lake", {data: data.reverse()})
        }
    });
});

app.get("/jordan", function (request, response) {
    var url = "http://epec.saw.usace.army.mil/dssjord.txt";
    var indexes = [0,1,8,9,10]
    let jordanPool = 216.5;
    getData(11, "Jordan", indexes, jordanPool, url, function(error, data) {
        if (error) {
            response.send(error);
            return;
        }
        else {
            response.render("lake", {data: data.reverse()})
        }
    });
});




// Functions to pull data
function getData(col, lakeName, indexes,  pool, newUrl, callback) {
    var data = [];

    var options = {
        url: newUrl
    }
    request(options, function (error, response, body) {
        if (error) {
            callback(error);
        }
        _.each(body.split("\r\n"), function (line) {
            // Split the text body into readable lines
            var splitLine;
            line = line.trim();
            splitLine = line.split(/[ ]+/);
            // Check to see if this is a data line
            // Column length and first two characters must match
            if (splitLine.length === col && !isNaN(parseInt(line.substring(0, 2)))) {
                // Loop through each cell and check for missing data
                for (var i = 0; i < splitLine.length; i++) {
                    if(splitLine[i].substring(0,1) === "?" || splitLine[i] == -99) {
                        splitLine[i] = "N/A";
                    }
                }
                // Formulate the date to remove Month
                let cleanDate = splitLine[indexes[0]].substring(0,2) + " " + splitLine[indexes[0]].substring(2,5);
                // Push each line into data object
                data.push({
                    lakeName: lakeName,
                    date: cleanDate,
                    time: splitLine[indexes[1]],
                    inflow: splitLine[indexes[2]],
                    outflow: splitLine[indexes[3]],
                    level: splitLine[indexes[4]]
                });
            }
        });
        // Check to see if current level is not available yet
        // If unavailable, use previous level
        let i = 1;
        data.currentLevel = data[data.length-i].level;
        data.currentDate = data[data.length-i].date;
        data.currentTime = data[data.length-i].time;
        data.currentLevelDelta = (parseFloat(data[data.length-i].level) - pool).toFixed(2);
        while (data.currentLevel === "N/A" && i <= data.length) {
            if (data[data.length-i].level === "N/A") {
                i++;
                data.currentLevel = data[data.length-i].level;
                data.currentDate = data[data.length-i].date;
                data.currentTime = data[data.length-i].time;
                data.currentLevelDelta = (parseFloat(data[data.length-i].level) - pool).toFixed(2);
            }          
        }
        callback(null, data);
    });
}

app.get("/", function (request, response) {
    response.render("index");
});
