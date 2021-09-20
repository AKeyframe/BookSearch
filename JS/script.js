const myKey = "AIzaSyB8eDxehjMJ-G-cGeKJb0HfPK4J0owl-yk";

// Init element variables
const $inpDivEle = $("#inputElements");
const $inpSearchEle = $("#mainInput");
const $btnSearchEle = $("#searchButton");
const $resultsDivEle = $("#results");


//Init elements for html/lists.html
const $subNavEle = $("#subNav");
const $listOptionsEle = $("#listOptions");

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

let defaultList = []; //the default list
let userLists = [{ name: "Reading List", array: defaultList }]; //Array of objs storing the users created lists
let currentList; // Used for storing the current list being displayed


// Class decleration for easier acces of JSON data later.
//constructor funtion supplies the paramters
//every time a new book is created. 
class book {
    constructor(title, author, cover,
        description, pageCount,
        published, isbn) {
        this.title = title;
        this.author = author;
        this.cover = cover;
        this.description = description;
        this.pageCount = pageCount;
        this.published = published;
        this.isbn = isbn;
        this.inList = [];
    }

    //Creates elements for each data point and appends them to a div
    //All data is given a class of bookInfo
    //The method returns the div with all the elements attached
    addDataToDiv() {
        let $bookDiv = $("<div class='bookDiv'>");
        let $bookInfoDiv = $("<div class='bookInfoDiv'>");
        let $bookCoverDiv = $("<div class='bookCoverDiv'>");
        let $bookCover = $(`<img class="bookImg" src="${this.cover}">`);
        let $bookTitle = $(`<h2 class="bookInfo">${this.title}</h2>`);
        let $bookAuthor = $(`<h4 class="bookInfo">By ${this.author}</h4>`);

        //Shortening the description if longer than 350 characters.
        let newDesc = "<strong>Description: </strong>" + this.description;
        if (typeof this.description !== "undefined") {
            if (this.description.length >= 300) {
                newDesc = "<strong>Description: </strong>" + this.description.slice(0, 300) + " ... ";
            }
            else { newDesc = "<strong>Description: </strong>" + this.description; }
        } else { newDesc = "No Description"; }


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
    toObject() {
        return {
            title: this.title, author: this.author,
            cover: this.cover, description: this.description,
            pageCount: this.pageCount, publishedDate: this.published,
            isbn: this.isbn
        };

    }
}// class book

//Checks local storage for information
//If there isn't any create some defaults

console.log("Varibles initalized");
checkLocal();
console.log("After CheckLocal");


////////////////////////////////////////////////////////////
//                     Listeners
////////////////////////////////////////////////////////////

//Main Search Listener 
$inpDivEle.on("submit", function (event) {
    event.preventDefault();
    console.log("Listener Activated");
    resetResults();
    console.log("Results Reset");
    // If nothing was typed in : do nothing
    if ($inpSearchEle.val() === "") {
        return;
    }
    search = $inpSearchEle.val();
    $inpSearchEle.val("");
    console.log("Calling AJAX");
    ajaxCall();

}); // Main Search Listener


//When you click an add or remove button
$("#results").on("click", "button", function (btn) {
    btn.preventDefault();
    console.log(btn.target);
    //If not a remove button - display dropdown
    if (!btn.target.classList.contains("removeButton")) {
        let divEle = btn.target.id + "Div";

        document.getElementById(divEle).classList.toggle("show");
    }
    //------------------------Remove from List----------------------
    else {
        let remIdx;
        console.log(currentList);
        userLists.forEach(function (obj, i) {
            if (obj.name === currentList) {
                remIdx = i;
            }
        });
        console.log(userLists[remIdx].array);
        userLists[remIdx].array.splice(btn.target.id, 1);


        let tempList = userLists[remIdx];
        let tempObj = { name: tempList.name, array: tempList.array }
        window.localStorage.setItem(tempList.name, JSON.stringify(tempObj));

        let tempBookList = objectToBook(tempList.array);
        if (window.innerWidth < 780) {
            displayList(tempBookList);
        }
        else {
            largeDisplayList(tempBookList);
        }

    }

    // Close the dropdown menu if the user clicks outside of it
    window.onclick = function (event) {
        if (btn.target !== event.target) {
            let dropdowns = document.getElementsByClassName("dropdown-content");
            for (let i = 0; i < dropdowns.length; i++) {
                let openDropdown = dropdowns[i];
                if (openDropdown.classList.contains('show')) {
                    openDropdown.classList.remove('show');
                }
            }
        }
    }// Windo click event listener

    //--------------------------On Click Menu---------------------------------    
    $(`#${btn.target.id}OutDiv`).on("click", "a", function (event) {
        event.preventDefault();
        $(`#${btn.target.id}OutDiv`).off();
        let idx = btn.target.id; // position in searchResults
        let list = event.target.textContent; //name of the list adding to
        let listIdx; // where that list is in userLists
        userLists.forEach(function (obj, i) {
            if (obj.name === list) {
                listIdx = i;
            }

        });

        //idx the position in the search array
        //list the name of user created list
        addRemoveFromLists(idx, list, listIdx);

    });//Results link Event Listener        
});//Results button event listener


//Checks the window size and displays the Results or Lits as needed
window.addEventListener('resize', function (event) {

    //If you're not resizing a list page
    if (!document.URL.includes("HTML/lists.html") ) {
        //If the search results area isn't empty
        if (!$resultsDivEle.is(':empty')) {
            if (window.innerWidth >= 780) {
                largeDisplayResults(searchResults);
            }
            else {
                displayResults(searchResults);
            }
        }
    }
    //If you're resizing a list page
    else{
        //If you have clicked on create list or my lists
        if(!$listOptionsEle.is(':empty')){
            //if you're showing a list
            if(!$resultsDivEle.is(':empty')) {
                let listI;
            
                userLists.forEach(function(obj, i){
                    if(obj.name === currentList){
                        listI = i;
                    }
                });
                if (window.innerWidth >= 780) {
                    console.log(userLists[listI]);
                    let tempObj = objectToBook(userLists[listI].array);
                    largeDisplayList(tempObj);
                }
                else {
                    console.log(userLists[listI]);
                    let tempObj = objectToBook(userLists[listI].array)
                    displayList(tempObj);
                }
            }//If #Results is empty
        }// If listOptions is empty
    }//Else
});//Window Listener


// Temp listener to clear the local storage
// $("#inputElements").on("click", "button", function (event) {
//     window.localStorage.clear();
//     saveToLocal = [];
//     defaultList = [];
//     userLists = [{ name: "Reading List", array: defaultList }];
//     window.localStorage.setItem('Reading List', JSON.stringify(userLists[0]));

// });


//---------------------------------------------------------
//                   HTML/lists.html
//---------------------------------------------------------

//Event Listener for the nav bar on lists.html
$subNavEle.on("click", "a", function (event) {
    //If an error was displayed remove it on changing tabs
    if(document.getElementById("alreadyError")){
        document.getElementById("alreadyError").remove();
    }
    //---------------------Create List-------------------------  
    //If create list was clicked, make the form elements  
    if (event.target.id === "createList") {
        $listOptionsEle.empty();
        let listInputDiv = $(`<div id=listInput>
                            <form><p>List Name:
                                <input id="newListInput" type="text">
                                <input id="newListButton" type="submit"> </p>`);

        $listOptionsEle.append(listInputDiv);

        //New List Name Event Listener
        $listOptionsEle.on("submit", function (optEvent) {
            optEvent.preventDefault();
            $listOptionsEle.empty();
            $resultsDivEle.empty();
            $listOptionsEle.append(listInputDiv);
            let $inputVal = $('#newListInput').val();

            //check to see if the list already exists
            let bool = false;
            userLists.forEach(function (list) {
                if (list.name === $inputVal) {
                    bool = true;
                    $resultsDivEle.append($('<p id="alreadyError">This list already exits please create another</p>'));
                }
            });

            //If it exits stop
            if (bool === true) { return; }

            //Create the List obj and add to LS and userLists
            let tempArray = [];
            let tempObj = { name: $inputVal, array: tempArray };

            userLists.push(tempObj);
            window.localStorage.setItem(`${$inputVal}`, JSON.stringify(tempObj));

        });//New List Input Event listener
    }//If Create List 

    //----------------------------My List-----------------------------   
    //If you clicked the My Lists link
    if (event.target.id === "aMyLists") {
        $listOptionsEle.empty();
        //Display Every list
        userLists.forEach(function (list) {
            let $tempH3 = $(`<a href="#">${list.name}<a>`);
            $listOptionsEle.append($tempH3);
        });//for Each

        //Checking which list you clicked on and displaying it accordingly
        $listOptionsEle.on("click", "a", function (aEvent) {
            currentList= aEvent.target.textContent;
            userLists.forEach(function(obj, i){
                if (aEvent.target.textContent === obj.name) {
                    let tempList = objectToBook(userLists[i].array);
                    
                    if (window.innerWidth >= 780) {
                        largeDisplayList(tempList);
                    }
                    else {
                        displayList(tempList);
                    } 
                }
            });
        });
    }// If My Lists

});//$subNavEle event listener


////////////////////////////////////////////////////////////
//                     Functions
////////////////////////////////////////////////////////////
//Calling the API to get back data
function ajaxCall() {
    // If the author is given
    // This is indicated with a "by"
    done = false;
    if (search.toLowerCase().includes("by")) {
        let tempArr = search.toLowerCase().split(" ");
        let byIndex = tempArr.lastIndexOf("by");
        tSearch = tempArr.slice(0, byIndex).join(" ");
        aSearch = tempArr.slice(byIndex + 1, tempArr.length).join(" ");
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
                if (data.totalItems !== 0) {
                    jsonToBook(data.items);

                    if (window.innerWidth < 780) {
                        displayResults(searchResults);

                    }
                    else {
                        largeDisplayResults(searchResults);

                    }

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
                if (data.totalItems !== 0) {
                    console.log("Data Recieved");
                    jsonToBook(data.items);
                    console.log("Data Converted to Book");

                    if (window.innerWidth < 780) {
                        console.log("Small Display");
                        displayResults(searchResults);
                        console.log("Displayed Correctly");
                    }
                    else {
                        console.log("Small Display");
                        largeDisplayResults(searchResults);
                        console.log("Displayed Correctly");
                    }

                }
                else {
                    displayNoResults();
                }
            }); // .then() 

    }// Else

} //ajaxCall()


//Converts the data gathered by the API into Books (created class) 
function jsonToBook(data) {
    //Sets an image if the API doesn't have one for that particular book
    let defaultCoverImage = "/Images/noImageThumbnail.jpg";

    if (typeof data === "undefined") {
        return;
    }

    //For every book stored in data, create a new book(class)
    for (let i = 0; i < data.length; i++) {
        //Get and format ISBN Number if any
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

        //check to see if their is a cover
        if (typeof tempBook.cover === "undefined") {
            tempBook.cover = defaultCoverImage;
        }

        searchResults.push(tempBook);
    }//For end
} //jsonToBook



//Checks to see what ISBN is associated with the book
//Returns eeither NO ISBN, ISBN 10, ISBN 13 or ISBN 10+13
function getISBNS(data) {
    let totalISBN = "";

    //If there is no ISBN
    if (data.length === 0) {
        return "No ISBN";
    }

    //If only 1 check the type and return
    else if (data.length === 1) {
        if (data[0].type === "ISBN_10") {
            return "ISBN10: " + data.identifier;
        }
        else { return "ISBN13: " + data.identifier; }
    }

    //Otherwise return both
    else {
        for (let i = 0; i < data.length; i++) {
            if (data[i].type === "ISBN_10") {
                totalISBN += "ISBN10: " + data[i].identifier + " | ";
            }
            else {
                totalISBN += "ISBN13: " + data[i].identifier + " | ";
            }
        }//for
    }//else
    return totalISBN;
}// getISBN()



//---------------------------------------------------------
//                         Results
//---------------------------------------------------------

//Recieves an array containing the book objects created from the search
//This is for moblie or tablet devices
function displayResults(res) {
    //clear everything 
    $('.bookDivsDiv').remove();
    $resultsDivEle.empty();

    //for each result create a container div element 
    res.forEach(function (book, idx) {
        //Creats elements for every piece of information
        //Puts the Cover in it's own div and information in another
        //puts both inside the container div
        let tempBookDiv = book.addDataToDiv();

        //click menu button add
        let $dropDiv = $(`<div id="${idx}OutDiv" class="dropdown">`);
        let tempButton = $(`<button id="${idx}" class="listButton">Add to List</button>`);
        let $dropContDiv = $(`<div id="${idx}Div" class="dropdown-content">`);
        userLists.forEach(function (list, userIdx) {
            let a = $(`<a id="${userIdx}A" class="dropLinks" href="#">${list.name}</a>`);
            $dropContDiv.append(a);
        });
        $dropDiv.append(tempButton, $dropContDiv);

        //Add the button to the Cover div created in addDataToDiv()
        tempBookDiv.children(".bookCoverDiv").append($dropDiv);
        //Adds the book to the page under #results
        $resultsDivEle.append(tempBookDiv);
    });

}// displayResults 

//Recieves an array containing the book objects created from the search
//This is for moblie or tablet devices
//For uncomented areas see displayResutlts(res)
function largeDisplayResults(res) {
    $('.bookDivsDiv').remove();
    $resultsDivEle.empty();
    //variable for putting two book container divs together
    //under one larger Div
    let i = 1;
    let $bookDivsDiv = $("<div class='bookDivsDiv'>");
    res.forEach(function (book, idx) {
        
        let tempBookDiv = book.addDataToDiv();

        //click menu button add
        let $dropDiv = $(`<div id="${idx}OutDiv" class="dropdown">`);
        let tempButton = $(`<button id="${idx}" class="listButton">Add to List</button>`);
        let $dropContDiv = $(`<div id="${idx}Div" class="dropdown-content">`);
        userLists.forEach(function (list, userIdx) {
            let a = $(`<a id="${userIdx}A" class="dropLinks" href="#">${list.name}</a>`);
            $dropContDiv.append(a);
        });
        $dropDiv.append(tempButton, $dropContDiv);




        tempBookDiv.children(".bookCoverDiv").append($dropDiv);
        $bookDivsDiv.append(tempBookDiv);
        //If there are two books in the larger div 
        //add it to the screen under #results and create a new larger div
        if (i === 2) {
            i = 1;
            $resultsDivEle.append($bookDivsDiv);
            $bookDivsDiv = $("<div class='bookDivsDiv'>");
        }
        //If there is only 1 book left add a blank placeholder to the larger div
        else if (idx === res.length - 1) {
            let $blankDiv = $('<div class="blankDiv">');
            $bookDivsDiv.append($blankDiv);
            $resultsDivEle.append($bookDivsDiv);
        }
        //if the larger div doesn't have two books do nothing
        else {
            i++;
        }
    });
}

//For displaying the lists created by the user
//For mobile and tablet screens
function displayList(res) {
    $('.bookDivsDiv').remove();
    $resultsDivEle.empty();
    res.forEach(function (book, idx) {
        let tempBookDiv = book.addDataToDiv();
        let tempButton =
            $(`<button class="removeButton" id="${idx}">Remove</button>`);

       

        tempBookDiv.children(".bookCoverDiv").append(tempButton);
        $resultsDivEle.append(tempBookDiv);
    });
}

//For displaying the lists created by the user
function largeDisplayList(res) {
    $('.bookDivsDiv').remove();
    $resultsDivEle.empty();
    let i = 1;
    let $bookDivsDiv = $("<div class='bookDivsDiv'>");
    res.forEach(function (book, idx) {
        let tempBookDiv = book.addDataToDiv();
        let tempButton =
            $(`<button class="removeButton" id="${idx}">Remove</button>`);


        tempBookDiv.children(".bookCoverDiv").append(tempButton);
        $bookDivsDiv.append(tempBookDiv);
        if (i === 2) {
            i = 1;
            $resultsDivEle.append($bookDivsDiv);
            $bookDivsDiv = $("<div class='bookDivsDiv'>");
        }
        else if (idx === res.length - 1) {
            let $blankDiv = $('<div class="blankDiv">');
            $bookDivsDiv.append($blankDiv);
            $resultsDivEle.append($bookDivsDiv);
        }
        else {
            i++;
        }
    });
}

//resets all the search global variables
function resetResults() {
    search = "";
    tSearch = "";
    aSearch = "";
    criteria = "";
    searchResults = [];
    $resultsDivEle.empty();
}//resetResults()

//For when no results match the search
function displayNoResults() {
    let tempEle = $("<h2 id='resultsErrorNone'>No Results Found</h2>");
    $resultsDivEle.append(tempEle);
}//displayNoResults()



//---------------------------------------------------------
//                         Storage
//---------------------------------------------------------
//Checks local storage upon load
function checkLocal() {
    //If the local storage does not exist create it
    //To Read List
    let temp = localStorage.getItem("Reading List");
    if (!temp) {
        // If fresh, create the list
        userLists[0] = { name: "Reading List", array: defaultList };
        window.localStorage.setItem("Reading List", JSON.stringify(userLists[0]));

    }
    else {
        userLists[0] = JSON.parse(window.localStorage.getItem("Reading List"));
    }

    // User Lists
    for (let i = 1; i < localStorage.length; i++) {
        userLists.push(JSON.parse(window.localStorage.getItem(
            localStorage.key(i))));
    }
    console.log("User List");
    console.log(userLists);
    console.log("Local Storage");
    console.log(localStorage);
} // checkLocal()

//Adds the book corrisponding to the button to whatever list was selected
function addRemoveFromLists(idx, listName, listIdx) {
    //idx - the idx inside searchResults
    //listName - the name of the list clicked
    //listIdx - the idx of the list clicked in userLists
    let list = userLists[listIdx];
    let tempObj = { name: listName, array: list.array }

    list.array.push(searchResults[idx].toObject());
    console.log(list.array);
    if (listName === "Reading List") { listName = "Reading List"; }
    console.log(listName);
    window.localStorage.setItem(listName, JSON.stringify(tempObj));
}//addRemoveFromLists


//Creates books based on the obj's provided
//Used when converting back from local storage
function objectToBook(list) {
    let tempArray = [];
    list.forEach(function (obj) {
        let tempBook = new book(obj.title, obj.author, obj.cover,
            obj.description, obj.pageCount, obj.publishedDate, obj.isbn);

        tempArray.push(tempBook);
    });
    return tempArray;
}



//Autocomplete
//inputDiv event listener on keypress 
    // get the title and author of each item
        // display each under the search bar

        //debounce