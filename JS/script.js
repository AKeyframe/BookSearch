const myKey = "AIzaSyB8eDxehjMJ-G-cGeKJb0HfPK4J0owl-yk";

// Class decleration for easier acces of JSON data later.
class book {
    //constructor funtion supplies the paramters
    //every time a new book is created. 
    constructor(title, author){
        this.title = title;
        this.author = author;
    }

    addToPage(){

    }
}

// Init element variables
const $inpDivEle = $("#inputElements");
const $inpSearchEle = $("#mainInput");
const $btnSearchEle = $("#searchButton");

const $resultsEle = $("#results");

// Init data variables
// Search is used when no author is given && to split into tSearch and aSearch
let search = "";

let tSearch = "Unsouled"; // Title search
let aSearch = "Wight"; // Author / Authoress search

//String responsible for letting the api know how we want it filtered
//Might need more than one depending on what I want to do. 
let criteria = ""; 

let searchResults = [];



////////////////////////////////////////////////////////////
//                     Listeners
////////////////////////////////////////////////////////////

//On Search button click get the value of 
$inpDivEle.on("click","button", function(event){
    resetResults();
    // If nothing was typed in : do nothing
    if($inpSearchEle.val()===""){
        console.log("nothing");
        return;
    }
    search = $inpSearchEle.val();
    $inpSearchEle.val("");
   
    // If the author is given
    if(search.toLowerCase().includes("by")){
        let tempArr = search.split(" ");
        let byIndex = tempArr.lastIndexOf("by");
        tSearch = tempArr.slice(0,byIndex);
        aSearch = tempArr.slice(byIndex+1, tempArr.length).join(" ");
        criteria = "inauthor:";


        console.log(`Title: ${tSearch}  Author: ${aSearch}`);

        //AJAX Call
        $.ajax({
            url: `https://www.googleapis.com/books/v1/volumes?q=${tSearch}+${criteria}${aSearch}&key=${myKey}`
        }).then(
            (data) => {
                console.log(data);
                jsonToBook(data.items);
            },

            (error) => {
                console.log('bad request: ', error);
            }
        ); // .then() 
    } // If author is given

    else { // If unsure what is asking
        const promise = $.ajax({
            url: `https://www.googleapis.com/books/v1/volumes?q=${search}&key=${myKey}`
        });
        
        promise.then(
            (data) => {
                console.log(data);
                jsonToBook(data.items);
            },

            (error) => {
                console.log('bad request: ', error);
            }
        ); // .then() 

    }// Else
}); // Event Listener Bracket



////////////////////////////////////////////////////////////
//                     Functions
////////////////////////////////////////////////////////////=

function jsonToBook(data){
    console.log("called correctly");
    console.log(data);
   
    for(let i=0; i<data.length; i++){
        const tempBook = new book(
            data[i].volumeInfo.title,
            data[i].volumeInfo.authors);

        console.log("----------------");
        console.log(tempBook.title);
        console.log(tempBook.author);

        searchResults.push(tempBook);
    }//For end
    displayResults(searchResults);
} //jsonToBook

function displayResults(results){
    for(let i=0; i<results.length; i++){
        console.log(results[i]);
        let $tempEle = $(`<li>Title: ${results[i].title} <br> Author: ${results[i].author[0]}<br><br></li>`);
        $resultsEle.append($tempEle);

    }//For
}// displayResults 

function resetResults(){
    searchResults = [];
    $resultsEle.html("");
}


//Autocomplete
//inputDiv event listener on keypress 
    // get the title and author of each item
        // display each under the search bar