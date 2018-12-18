// Function to capitalize first letter of string
function capitalizeFirstLetter(string) {
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// Clear the page of any historical data
$("#allLakes").empty();

// Pull the state initials from the end of the current URL
let currentURL = window.location.href;
let stateInitial = currentURL.slice(-2);
currentURL = currentURL.substring(0, currentURL.length -10);
let newURL = currentURL + "/api/states/" + stateInitial;
console.log(newURL);

$.ajax({
    url: newURL,
    method: "GET",
    data: { stateInitial : stateInitial }
})
    .then(function (stateData) {
            // Loop through the data and display the results on the page
            for (var i = 0; i < stateData.length; i++) {

                // Create and append the card for each lake
                let lake = $("<div>");
                lake.addClass("row lakeCard");
                lake.attr("id", stateData[i].name)
                $("#allLakes").append(lake);

                // Add the text data to the card
                $(`#${stateData[i].name}`).append(`<p class="col"> ${capitalizeFirstLetter(stateData[i].name)} Lake</p>`);
                $(`#${stateData[i].name}`).append(`<p class="col"> ${stateData[i].current.level} ft.</p>`);
                var dataTag = $(`<a class="lakeButton" href="/lakes/${stateData[i].name}"></a>`);
                dataTag.attr("data-lake", stateData[i].name);
                dataTag.append(`<i class="fas fa-arrow-circle-right fa-2x"></i>`);
                $(`#${stateData[i].name}`).append(dataTag);
            }
    })





// // Capture click on state in dropdown
// $("button").click(function () {
//     //pull data value and current url
//     var currentURL = window.location.origin;
//     var state = $(this).attr("data-id");

//     $.ajax({
//         url: currentURL + "/api/states/" + state,
//         method: "GET",
//         data: { state: state }
//     })
//         .then(function (stateData) {
//             console.log(stateData);
//             // Loop through the data and display the results on the page
//             for (var i = 0; i < stateData.length; i++) {

//                 // Create and append the card for each lake
//                 let lake = $("<div>");
//                 lake.addClass("row lakeCard");
//                 lake.attr("id", stateData[i].name)
//                 $("#allLakes").append(lake);

//                 // Add the text data to the card
//                 $(`#${stateData[i].name}`).append(`<p class="col"> ${capitalizeFirstLetter(stateData[i].name)} Lake</p>`);
//                 $(`#${stateData[i].name}`).append(`<p class="col"> ${stateData[i].current.level} ft.</p>`);
//                 var dataTag = $(`<a class="lakeButton" href="/lakes">`);
//                 dataTag.attr("data-lake", stateData[i].name);
//                 dataTag.append(`<i class="fas fa-arrow-circle-right fa-2x"></i>`);
//                 $(`#${stateData[i].name}`).append(dataTag);
//             }

//         });
// })