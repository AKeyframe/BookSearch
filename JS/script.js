const myKey = "AIzaSyB8eDxehjMJ-G-cGeKJb0HfPK4J0owl-yk";

// Init element variables
const $inpDivEle = $("#inputElements");
const $inpSearchEle = $("#mainInput");
const $btnSearchEle = $("#searchButton");
const $resultsDivEle = $("#results");

// Init data variables
// Search is used when no author is given && to split into tSearch and aSearch
let search = "";
let tSearch = ""; // Title search
let aSearch = ""; // Author / Authoress search

//String responsible for letting the api know what additional search modifiers
//Might need more than one depending on what I want to do. 
let criteria = ""; 

let searchResults = [];
let saveToLocal = []; //Array used for local storage


// Class decleration for easier acces of JSON data later.
//constructor funtion supplies the paramters
 //every time a new book is created. 
class book {
    constructor(title, author, cover,
                description, pageCount,
                published, isbn){
        this.title = title;
        this.author = author;
        this.cover = cover;
        this.description = description;
        this.pageCount = pageCount;
        this.published = published;
        this.isbn = isbn;
        this.inList = false;   
    }

    //Creates elements for each data point and appends them to a div
    //All data is given a class of bookInfo
    //The method returns the div with all the elements attached
    addDataToDiv(){
        let $bookDiv = $("<div class='bookDiv'>");
        let $bookInfoDiv = $("<div class='bookInfoDiv'>");
        let $bookCoverDiv = $("<div class='bookCoverDiv'>");
        let $bookCover = $(`<img class="bookImg" src="${this.cover}">`);
        let $bookTitle = $(`<h2 class="bookInfo">${this.title}</h2>`);
        let $bookAuthor = $(`<h4 class="bookInfo">By ${this.author}</h4>`);

        //Shortening the description if longer than 350 characters.
        let newDesc = "<strong>Description: </strong>"+this.description;
        if(typeof this.description !== "undefined"){
            if(this.description.length >= 300){
                newDesc = "<strong>Description: </strong>"+this.description.slice(0, 300)+" ... ";
            }
            else{newDesc = "<strong>Description: </strong>"+this.description;}
        } else{newDesc = "No Description";}


        let $bookDescription = $(`<p class="bookInfo">${newDesc}</p>`);
        let $bookPC = $(`<p class="bookInfo">${this.pageCount} pages</p>`);
        let $bookPDate = $(`<p class="bookInfo">Published: ${this.published}</p>`);
        let $bookISBN = $(`<p class ="bookInfo">${this.isbn}</p>`)
        
        $bookInfoDiv.append($bookTitle, $bookAuthor,
                $bookDescription, $bookPC,
                $bookPDate, $bookISBN);

        $bookCoverDiv.append($bookCover);

        $bookDiv.append($bookCoverDiv, $bookInfoDiv);

        return $bookDiv;
    }//addDataToDiv()


    //This method returns the book as a standard javaScript object
    //Method necessary for JSON.stringify()
    toObject(){
        return {title: this.title, author: this.author,
                cover: this.cover, description: this.description,
                pageCount: this.pageCount, publishedDate: this.published,
                isbn: this.isbn};
        
    }
}// class book



//If the local storage does not exist create it
if(typeof(localStorage.getItem("trl"))=== "undefined"){
    // If fresh, create the list
    if(saveToLocal === []){
        window.localStorage.setItem("trl", saveToLocal);
    }
}
else {
    saveToLocal = JSON.parse(window.localStorage.getItem("trl"));
}
console.log(saveToLocal);

////////////////////////////////////////////////////////////
//                     Listeners
////////////////////////////////////////////////////////////

//Main Search Listener 
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
   
}); // Main Search Listener


//When you click an add or remove button
$("#results").on("click", "button", function(event){
    addRemoveFromSearch(this);   
});


// Temp listener to clear the local storage
$("#inputElements").on("click", "button", function(event){
    window.localStorage.clear();
    saveToLocal=[];
    window.localStorage.setItem('trl', JSON.stringify(saveToLocal));

});


////////////////////////////////////////////////////////////
//                     Functions
////////////////////////////////////////////////////////////

function ajaxCall(){
    // If the author is given
    // This is indicated with a "by"
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
                    displayResults(searchResults);
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
                displayResults(searchResults);
            },

            (error) => {
                console.log('bad request: ', error);
            }
        ); // .then() 

    }// Else
    
} //ajaxCall()



function jsonToBook(data){
    let defaultCoverImage = "/Images/noImageThumbnail.jpg";

    if(typeof data === "undefined"){
        return;
    }

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

        searchResults.push(tempBook);
    }//For end
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

//Recieves an array containing the book objects created from the search
function displayResults(res){
    res.forEach(function(book, idx){
        let tempBookDiv = book.addDataToDiv();
        let tempButton = 
            $(`<button class="listButton" id="${idx}">Add to List</button>`);

        tempBookDiv.children(".bookCoverDiv").append(tempButton);
        $resultsDivEle.append(tempBookDiv);
    });


}// displayResults 

function resetResults(){
    search = "";
    tSearch = "";
    aSearch = "";
    criteria = "";
    searchResults = [];
    $resultsDivEle.empty();
}//resetResults()

function displayNoResults(){
    let tempEle = $("<h2 id=`resultsErrorNone`>No Results Found</h2>");
    $resultsDivEle.append(tempEle);
}//displayNoResults()



//---------------------------------------------------------
//                         Storage
//---------------------------------------------------------

function addRemoveFromSearch(btn){
    let idx = btn.id;
    if($(btn).html()==="Add to List"){
        $(btn).html("Remove");
        $(btn).css({backgroundColor: "red"});
        
        searchResults[idx].inList=true;
        saveToLocal.push(searchResults[idx].toObject());
        window.localStorage.setItem('trl', JSON.stringify(saveToLocal));
        console.log(saveToLocal);
    }
    else{
        $(btn).html("Add to List");
        $(btn).css({background: "transparent"});

        //Removes the book attached to the button on the serach page
        //from the local storage array
        saveToLocal = saveToLocal.filter(function(ele){
            return ele.isbn !== searchResults[idx].isbn;
        });
        window.localStorage.setItem('trl', JSON.stringify(saveToLocal));
        console.log(saveToLocal);
    }//else
}//addRemoveFromSearch





//Autocomplete
//inputDiv event listener on keypress 
    // get the title and author of each item
        // display each under the search bar

        //debounce