const myKey = "AIzaSyB8eDxehjMJ-G-cGeKJb0HfPK4J0owl-yk";

// Class decleration for easier acces of JSON data later.
//constructor funtion supplies the paramters
 //every time a new book is created. 
class book {
    constructor(title, author, cover, description){
        this.title = title;
        this.author = author;
        this.cover = cover;
        this.description = description;  
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

//String responsible for letting the api know what additional search modifiers
//Might need more than one depending on what I want to do. 
let criteria = ""; 

let searchResults = [];



////////////////////////////////////////////////////////////
//                     Listeners
////////////////////////////////////////////////////////////

//On Search button click get the value of 
$inpDivEle.on("click", "button", function(event){
    resetResults();
    // If nothing was typed in : do nothing
    if($inpSearchEle.val()===""){
        console.log("empty");
        return;
    }
    search = $inpSearchEle.val();
    $inpSearchEle.val("");
    ajaxCall();
   
}); // Event Listener Bracket



////////////////////////////////////////////////////////////
//                     Functions
////////////////////////////////////////////////////////////

function ajaxCall(){
    // If the author is given
    if(search.toLowerCase().includes("by")){
        let tempArr = search.toLowerCase().split(" ");
        let byIndex = tempArr.lastIndexOf("by");
        tSearch = tempArr.slice(0,byIndex).join(" ");
        aSearch = tempArr.slice(byIndex+1, tempArr.length).join(" ");
        criteria = "inauthor:";


        console.log(`By Author Search`);
        console.log(`Title:  ${tSearch}  Author:  ${aSearch}`);

        //AJAX Call
        const promise = $.ajax({
             url: `https://www.googleapis.com/books/v1/volumes?q=${tSearch}+${criteria}${aSearch}&key=${myKey}`
        });

        promise.then(
            (data) => {
                console.log(data);
                if(data.totalItems !== 0){    
                    jsonToBook(data);
                }
                else {
                    displayNoResults();
                }
            },

            (error) => {
                console.log('bad request: ', error);
            }
        ); // .then() 
    } // If author is given

    else { // If unsure what is asking
        console.log("Full Search")
        const promise = $.ajax({
            url: `https://www.googleapis.com/books/v1/volumes?q=${search}&key=${myKey}`
        });
        
        promise.then(
            (data) => {
                console.log(data);
                jsonToBook(data);
            },

            (error) => {
                console.log('bad request: ', error);
            }
        ); // .then() 

    }// Else
    
} //ajaxCall()



function jsonToBook(data){
    let defaultCoverImage = "/Images/noImageThumbnail.jpg";
    for(let i=0; i<data.items.length; i++){
        
        const tempBook = new book(
            data.items[i].volumeInfo.title,
            data.items[i].volumeInfo.authors,
            data.items[i].volumeInfo.imageLinks?.thumbnail,
            data.items[i].volumeInfo.description);
        
        if(typeof tempBook.cover === "undefined"){
            console.log("---------------------------");
            tempBook.cover = defaultCoverImage;
        }
        console.log(tempBook.cover);
        searchResults.push(tempBook);
    }//For end
    displayResults(searchResults);
} //jsonToBook



//---------------------------------------------------------
//                         Results
//---------------------------------------------------------

function displayResults(results){
    for(let i=0; i<results.length; i++){
        let $tempEle = $(`<img src="${results[i].cover}"><br><li>Title: ${results[i].title} <br> Author: ${results[i].author[0]}<br><br>Description: ${results[i].description}</li>`);
        $resultsEle.append($tempEle);

        //

    }//For
}// displayResults 

function resetResults(){
    search = "";
    tSearch = "";
    aSearch = "";
    criteria = "";
    searchResults = [];
    $resultsEle.html("");
}

function displayNoResults(){
    let tempEle = $("<h2 id=`resultsErrorNone`>No Results Found</h2>");
    $resultsEle.append(tempEle);
}

//Autocomplete
//inputDiv event listener on keypress 
    // get the title and author of each item
        // display each under the search bar

        //debounce