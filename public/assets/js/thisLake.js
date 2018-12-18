let lakePool = 0;
let bodyOfWaterName = '';

// Function to capitalize first letter of string
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Set variable to handle lake name we passed through cookie
// let lakeSelect = getCookie("lakeSelect");

// Clear old page data if it exists
$("#lakeTitle").empty();
$("#currentLevel").empty();
$("#currentDateTime").empty();
$("#lakeSection").empty();


// Pull the lake name from the end of the current URL
let currentURL = window.location.href;
let parsedURL = window.location.href.split("/");
let lakeName = parsedURL[parsedURL.length - 1];
parsedURL = parsedURL.slice(0, parsedURL.length - 2);
let newURL = parsedURL.join("/") + "/api/lakes/" + lakeName
const batch = [];
let elevCheck = false;
let flowCheck = false;

// Function to make elevation USGS call
function elevUSGS() {
    // API call for flow
    $.ajax({
            url: elevURL,
            method: "GET",
        })
        .then(function (data) {
            console.log('USGS Elev Data', data);
            // Set lake title on page
            $("#lakeTitle").append(bodyOfWaterName);
            $("#lakeSponsor").append(bodyOfWaterName);
            $("#lakeFeaturedTournament").append(bodyOfWaterName);
            // Parse the json data return to find the values we want
            let dataValues = data.value.timeSeries[0].values[0].value
            // Reverse the order of our data so most recent date is first
            dataValues.reverse();
            // Get current Date, Time and Elev
            var currentElev = dataValues[0].value;
            let splitTimeDate = dataValues[0].dateTime.split("T");
            let currentDate = splitTimeDate[0];
            let currentTime = splitTimeDate[1].substring(0, 5);
            let currentDelta = (currentElev - lakePool).toFixed(2);
            // Set date, time and elev on page
            $("#currentTime").append(currentTime);
            $("#currentDate").append(currentDate);
            $("#currentLevel").append(currentElev);
            $("#currentDelta").append(currentDelta);

            // Find first time value that is at the top of the hour
            switch (dataValues[0].dateTime.substring(14, 16)) {

                case "00":
                    var j = 0;
                    break;

                case "15":
                    var j = 1;
                    break;

                case "30":
                    var j = 2
                    break;

                case "45":
                    var j = 3
                    break;

                default:
                    alert("Lake name does not exists");
            }
            // Create our increment and loop through each value
            // For each value create our associated table html
            let i = 0;
            for (j; j < dataValues.length; j += 4) {
                let element = dataValues[j];
                let elev = element.value;
                let splitTimeDate = element.dateTime.split("T");
                let date = splitTimeDate[0].substring(2, 10).replace('-', ' ');
                let time = splitTimeDate[1].substring(0, 5);

                // Create the HTML Well (Section) and Add the table content for each reserved table
                var lakeSection = $("<tr>");
                lakeSection.addClass("well");
                lakeSection.attr("id", "lakeWell-" + i + 1);
                $("#lakeSection").append(lakeSection);

                // Append the data values to the table row
                $("#lakeWell-" + i + 1).append("<td>" + date + "</td>");
                $("#lakeWell-" + i + 1).append("<td>" + time + "</td>");
                $("#lakeWell-" + i + 1).append("<td>" + elev + "</td>");
                i++;

            }
            if (flowURL !== "none")
                flowUSGS();
        })
}

// Function to make flow USGS call
function flowUSGS() {
    // API call for flow
    $.ajax({
            url: flowURL,
            method: "GET",
        })
        .then(function (data) {
            // Parse through the json data to find the values we want
            let dataValues = data.value.timeSeries[0].values[0].value
            // Reverse the order of our data so most recent date is first
            dataValues.reverse();
            // Create our increment and loop through the data
            // For each loop append the flow html into the table that already exists
            let i = 0;
            dataValues.forEach(function (element) {
                $("#lakeWell-" + i + 1).append("<td>" + element.value + "</td>");
                i++;
            })
        });
}

// function displayData() {

//     batch.forEach(function (element) {
//         // Create the HTML Well (Section) and Add the table content for each reserved table
//         var lakeSection = $("<tr>");
//         lakeSection.addClass("well");
//         lakeSection.attr("id", "lakeWell-" + i + 1);
//         $("#lakeSection").append(lakeSection);

//         // Append the data values to the table row
//         $("#lakeWell-" + i + 1).append("<td>" + element.date + "</td>");
//         $("#lakeWell-" + i + 1).append("<td>" + element.time + "</td>");
//         $("#lakeWell-" + i + 1).append("<td>" + element.elev + "</td>");
//         $("#lakeWell-" + i + 1).append("<td>" + element.flow + "</td>");
//     })
// }


// Function to make ACE flow data call
function flowACE(dataTables) {
    $.ajax({
            url: "/api/" + lakeName,
            method: "GET"
        })
        .then(function (data) {

            // Check if date matches 
            // Find first element in USGS data in which the time value that is at the top of the hour
            switch (dataTables[0].dateTime.substring(14, 16)) {

                case "00":
                    var usgsIndex = 0;
                    break;

                case "15":
                    var usgsIndex = 1;
                    break;

                case "30":
                    var usgsIndex = 2
                    break;

                case "45":
                    var usgsIndex = 3
                    break;

                default:
                    alert("Lake name does not exists HeHeHeHe");
            }

            let aceIndex = 0;
            let lakewellIndex = 0;
            let aceTime = '0000'; // Time on current ACE line
            let usgsTime = '0'; // Time on current USGS line

            // Code readability, will be set to comparison of times in loop
            let timesAreNotEqual = false;
            let aceTimeGreater = false;
            let daysAreEqual = false;
            let dataIsLinedUpByTime = false;

            // Check to see if the first ACE flow data line is same time as USGS first line time and the same day 
            // (don't care about month right now)
            // Can fix the month problem later 
            //(only an issue when site down as time goes by midnight last day of month)

            for (usgsIndex; usgsIndex < dataTables.length; usgsIndex += 4) {
                data[aceIndex].time = data[aceIndex].time.substr(0, 2).concat("00");
                if (data[aceIndex].time === '2400') { // ACE represents midnight as 2400 of passing day, Jordan Lake on "0031"
                    aceTime = '0000' // USGS represents midnight as 0000 of next day (Dates are different)
                } else aceTime = data[aceIndex].time.replace("31", '00');

                usgsTime = dataTables[usgsIndex].dateTime.substring(11, 16).replace(':', ''); // Pulls the USGS time from the line and removes the : (ACE does not have a colon)

                // Set Booleans for conditionals below, days have OR due to difference in representation of midnight
                timesAreNotEqual = usgsTime !== aceTime;
                aceTimeGreater = parseInt(dataTables[usgsIndex].dateTime.substring(11, 16).replace(':', ''), 10) < parseInt(aceTime, 10);
                if (!daysAreEqual)
                    daysAreEqual = (data[aceIndex].date.substring(0, 2) == dataTables[usgsIndex].dateTime.substring(8, 10)) || aceTime == '0000';

                // PLEASE LEAVE THIS SWITCH COMMENTED OUT, I'll need it to fix when the month changes.
                //switch (data[aceIndex].date.substring(2, 6)) {

                // If case is org, then run the sort function and create a newBatch, then display using the newBath
                // Change our sort boolean to keep track of asc/desc
                //    case "'DEC":
                //        if (dataTables[usgsIndex].dateTime.substring(5, 7) == 12)
                //            monthsAreEqual = true
                //        break;

                // }

                let element = data[aceIndex]; // define element for template updates below.

                if (daysAreEqual && !timesAreNotEqual) {
                    if (!timesAreNotEqual) {
                        //if (aceTimeGreater) { // is ACE Time newer than USGS (ACE has newer data?)
                        //    usgsIndex = usgsIndex - 4; // Stay on current USGS line by decrementing loop counter
                        //} else { // ACE Time is less than USGS Time (ACE site down)

                        //    console.log('lakewellIndex1', lakewellIndex);
                        //    $("#lakeWell-" + (lakewellIndex) + 1).append("<td>" + "N/A1" + "</td>"); //Append N/A as the Flow Value to the row for the missing data
                        //    lakewellIndex++; //Move to next Lakewell Template line
                        // }
                        //} else { // Times are equal, post data to Lakewell template
                        $("#lakeWell-" + lakewellIndex + 1).append("<td>" + element.outflow + "</td>");
                        lakewellIndex++;

                        if (!timesAreNotEqual) {
                            dataIsLinedUpByTime = true;
                        }
                    }
                } else {
                    $("#lakeWell-" + lakewellIndex + 1).append("<td>" + "N/A" + "</td>"); //Append N/A as the Flow Value to the row for the missing data
                    lakewellIndex++;
                    aceIndex--;
                }

                aceIndex++; // Increment loop counter ACE data and LakeWell template
            }

            console.log(data);



        });
}

// Function to make elev ACE call
function elevAce() {
    // API call for flow
    $.ajax({
            url: elevURL,
            method: "GET",
        })
        .then(function (data) {
            console.log(lakeName)
            // Set lake title on page
            $("#lakeTitle").append(bodyOfWaterName);
            $("#lakeSponsor").append(bodyOfWaterName);
            $("#lakeFeaturedTournament").append(bodyOfWaterName);
            // Parse the json data return to find the values we want
            let dataValues = data.value.timeSeries[0].values[0].value
            // Reverse the order of our data so most recent date is first
            dataValues.reverse();
            // Get current Date, Time and Elev
            let currentElev = parseFloat(dataValues[0].value).toFixed(2);
            let splitTimeDate = dataValues[0].dateTime.split("T");
            let currentDate = splitTimeDate[0];
            let currentTime = splitTimeDate[1].substring(0, 5);
            let currentDelta = (currentElev - lakePool).toFixed(2);

            // Set date, time and elev on page
            $("#currentTime").append(currentTime);
            $("#currentDate").append(currentDate);
            $("#currentLevel").append(currentElev);
            $("#currentDelta").append(currentDelta);


            // Find first element in USGS data in which the time value that is at the top of the hour
            switch (dataValues[0].dateTime.substring(14, 16)) {

                case "00":
                    var j = 0;
                    break;

                case "15":
                    var j = 1;
                    break;

                case "30":
                    var j = 2
                    break;

                case "45":
                    var j = 3
                    break;

                default:
                    alert("Lake name does not exists");
            }

            // Create our increment and loop through each value
            // For each value create our associated table html
            let i = 0;
            for (j; j < dataValues.length; j += 4) {
                let element = dataValues[j];
                let elev = element.value;

                let date = element.dateTime.substring(2, 10).replace('-', ' ');
                let time = element.dateTime.substring(11, 16);

                // Create the HTML Well (Section) and Add the table content for each reserved table
                var lakeSection = $("<tr>");
                lakeSection.addClass("well");
                lakeSection.attr("id", "lakeWell-" + i + 1);
                $("#lakeSection").append(lakeSection);

                // Append the data values to the table row

                $("#lakeWell-" + i + 1).append("<td>" + date + "</td>");
                $("#lakeWell-" + i + 1).append("<td>" + time + "</td>");
                $("#lakeWell-" + i + 1).append("<td>" + elev + "</td>");
                i++;
            }
            flowACE(dataValues);
        })
}


// function getData() {
//     if (elevUSGSCheck === "true") {
//         elevUSGS();
//     }

//     if (flowUSGSCheck === "true") {
//         flowUSGS();
//     }

//     if (flowACECheck === "true") {
//         kerrElevFlow();
//     }


// if USGS elev is needed
// run elevUSGS()
// if USGS flow is needed
// run flowUSGS()
// if ACE flow is needed
// run ACE flow
// once all complete
// run display data

// User clicked on Tournaments Button on Lake page
// display tournaments filtered by lake
$("#lakeTournaments").on("click", function (e) {
    console.log("Made it to function lakesTournament")
})


// Switch to set our api urls based on lake name
// Run corresponding api calls

console.log('lakeName', lakeName);
switch (lakeName) {
    case "kerr":
        lakePool = 300;
        bodyOfWaterName = "Kerr Lake"
        elevURL = "https://waterservices.usgs.gov/nwis/iv/?format=json&sites=02079490&period=PT96H&parameterCd=62614&siteType=LK&siteStatus=all";
        elevAce();
        break;

    case "falls":
        bodyOfWaterName = "Falls Lake"
        lakePool = 252;
        elevURL = "https://waterservices.usgs.gov/nwis/iv/?format=json&sites=02087182&period=PT96H&parameterCd=00065&siteType=LK&siteStatus=all";
        flowURL = "https://waterservices.usgs.gov/nwis/iv/?format=json&sites=02087183&period=PT96H&parameterCd=00060&siteType=ST&siteStatus=all";
        elevUSGS();
        break;

    case "jordan":
        bodyOfWaterName = "Jordan Lake"
        lakePool = 216.5;
        elevURL = "https://waterservices.usgs.gov/nwis/iv/?format=json&sites=02098197&period=PT96H&parameterCd=62614&siteType=LK&siteStatus=all";
        elevAce();
        break;

    case "murray":
        lakePool = 360.0;
        bodyOfWaterName = "Lake Murray"
        elevURL = "https://waterservices.usgs.gov/nwis/iv/?format=json&sites=02168500&period=PT96H&parameterCd=00062&siteType=ST&siteStatus=all";
        flowURL = "https://waterservices.usgs.gov/nwis/iv/?format=json&sites=02168504&period=PT96H&parameterCd=00060&siteType=ST&siteStatus=all";
        elevUSGS();
        break;


    case "hartwell":
        bodyOfWaterName = "Lake Hartwell"
        lakePool = 660.0;
        elevURL = "https://waterservices.usgs.gov/nwis/iv/?format=json&sites=02187010&period=PT96H&parameterCd=00062&siteType=LK&siteStatus=all";
        flowURL = "none"
        elevUSGS();
        break;

    case "clarkshill":
        lakePool = 330.0;
        bodyOfWaterName = "Clarks Hill"
        elevURL = "https://waterservices.usgs.gov/nwis/iv/?format=json&sites=02193900&period=PT96H&parameterCd=00062&siteType=LK&siteStatus=all";
        flowURL = "none"
        elevUSGS();
        break;

    case "santee1":
        lakePool = 79.0;
        bodyOfWaterName = "Santee (Marion)"
        elevURL = "https://waterservices.usgs.gov/nwis/iv/?format=json&sites=02171000&period=PT96H&parameterCd=00062&siteType=ST&siteStatus=all";
        flowURL = "none"
        elevUSGS();
        break;

    case "santee2":
        bodyOfWaterName = "Santee (Moultrie)"
        lakePool = 79.0;
        elevURL = "https://waterservices.usgs.gov/nwis/iv/?format=json&sites=02172000&period=PT96H&parameterCd=00062&siteType=LK&siteStatus=all";
        flowURL = "none"
        elevUSGS();
        break;

    case "roanoke":
        lakePool = 0.0;
        bodyOfWaterName = "Roanoke River"
        elevURL = "https://waterservices.usgs.gov/nwis/iv/?format=json&sites=0208114150&period=PT96H&parameterCd=00065&siteType=ST&siteStatus=all";
        flowURL = "none"
        elevUSGS();
        break;

    case "james":
        lakePool = 0.0;
        bodyOfWaterName = "James River"
        elevURL = "https://waterservices.usgs.gov/nwis/iv/?format=json&sites=02042770&period=PT96H&parameterCd=62620&siteType=ST&siteStatus=all";
        flowURL = "none"
        elevUSGS();
        break;

    case "potomac":
        lakePool = 0.0;
        bodyOfWaterName = "Potomac River (Alexandria)"
        elevURL = "https://waterservices.usgs.gov/nwis/iv/?format=json&sites=0165258890&period=PT96H&parameterCd=62620&siteType=ST&siteStatus=all";
        flowURL = "none"
        elevUSGS();
        break;

    case "lanier":
        lakePool = 1071.0;
        bodyOfWaterName = "Lake Lanier"
        elevURL = "https://waterservices.usgs.gov/nwis/iv/?format=json&sites=02334400&period=PT96H&parameterCd=00062&siteType=LK&siteStatus=all";
        flowURL = "none"
        elevUSGS();
        break;

    case "westpoint":
        lakePool = 635.0;
        bodyOfWaterName = "West Point"
        elevURL = "https://waterservices.usgs.gov/nwis/iv/?format=json&sites=02339400&period=PT96H&parameterCd=00062&siteType=LK&siteStatus=all";
        flowURL = "none"
        elevUSGS();
        break;

    case "fork":
        lakePool = 403.0;
        bodyOfWaterName = "Lake Fork"
        elevURL = "https://waterservices.usgs.gov/nwis/iv/?format=json&sites=08018800&period=PT96H&parameterCd=62614&siteType=LK&siteStatus=all";
        flowURL = "none"
        elevUSGS();
        break;

    case "toledobend":
        lakePool = 172.0;
        bodyOfWaterName = "Toledo Bend"
        elevURL = "https://waterservices.usgs.gov/nwis/iv/?format=json&sites=08025350&period=PT96H&parameterCd=62614&siteType=LK&siteStatus=all";
        flowURL = "none"
        elevUSGS();
        break;

    case "rayburn":
        lakePool = 164.4;
        bodyOfWaterName = "Sam Rayburn"
        elevURL = "https://waterservices.usgs.gov/nwis/iv/?format=json&sites=08039300&period=PT96H&parameterCd=62614&siteType=LK&siteStatus=all";
        flowURL = "none"
        elevUSGS();
        break;

    default:
        alert("Lake name does not exists");
}