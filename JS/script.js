const myKey = "AIzaSyB8eDxehjMJ-G-cGeKJb0HfPK4J0owl-yk";

// Class decleration for easier acces of JSON data later.
//constructor funtion supplies the paramters
 //every time a new book is created. 
class book {
    constructor(title, author, cover, description, pageCount, published, isbn){
        this.title = title;
        this.author = author;
        this.cover = cover;
        this.description = description;
        this.pageCount = pageCount;
        this.published = published;
        this.isbn = isbn;
          
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
$inpDivEle.on("submit", function(event){
    event.preventDefault();
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
                    jsonToBook(data.items);
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
                jsonToBook(data.items);
            },

            (error) => {
                console.log('bad request: ', error);
            }
        ); // .then() 

    }// Else
    
} //ajaxCall()



function jsonToBook(data){
    let defaultCoverImage = "/Images/noImageThumbnail.jpg";
    

    for(let i=0; i<data.length; i++){
        let isbns = getISBNS(data[i].volumeInfo.industryIdentifiers);
        const tempBook = new book(
            data[i].volumeInfo.title,
            data[i].volumeInfo.authors,
            data[i].volumeInfo.imageLinks?.thumbnail,
            data[i].volumeInfo.description,
            data[i].volumeInfo.pageCount,
            data[i].volumeInfo.publishedDate,
            isbns);

            // the ? next to imageLinks is called optional chaining
        
        if(typeof tempBook.cover === "undefined"){
            tempBook.cover = defaultCoverImage;
        }
        console.log("BOOK OBJECT   "+tempBook.pageCount);
        searchResults.push(tempBook);
    }//For end
    displayResults(searchResults);
} //jsonToBook


//Checks to see what ISBN is associated with the book
//Returns eeither NO ISBN, ISBN 10, ISBN 13 or ISBN 10+13
function getISBNS(data){
    let totalISBN="";

    //If there is no ISBN
    if(data.length === 0){
        return "No ISBN";
    }

    //If only 1 check the type and return
    else if(data.length === 1){
        if(data[0].type === "ISBN_10"){
            return "ISBN10: "+data.identifier;
        }
        else{ return "ISBN13: "+data.identifier;}
    }

    //Otherwise return both
    else{
        for(let i=0; i<data.length; i++){
            if(data[i].type === "ISBN_10"){
                totalISBN+="ISBN10: "+data[i].identifier+" | ";
            }
            else{
                totalISBN+="ISBN13: "+data[i].identifier+" | ";
            }
        }//for
    }//else
    return totalISBN;
}// getISBN()



//---------------------------------------------------------
//                         Results
//---------------------------------------------------------

function displayResults(results){
    for(let i=0; i<results.length; i++){
        let $tempEle = $(`<img src="${results[i].cover}"><br><li>Title: ${results[i].title} <br> Author: ${results[i].author[0]}<br>Description: ${results[i].description}<br># Of Pages: ${results[i].pageCount}<br>Publish Date: ${results[i].published}<br>${results[i].isbn}</li>`);
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