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

let defaultList= []; //the default list
let userLists = [{name: "Reading List", array: defaultList}]; //Array of objs storing the users created lists
let currentList; // Used for storing the current list being displayed


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
        this.inList = [];   
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


checkLocal();

////////////////////////////////////////////////////////////
//                     Listeners
////////////////////////////////////////////////////////////

//Main Search Listener 
$inpDivEle.on("submit", function(event){
    event.preventDefault();
    resetResults();
    // If nothing was typed in : do nothing
    if($inpSearchEle.val()===""){
        return;
    }
    search = $inpSearchEle.val();
    $inpSearchEle.val("");
    ajaxCall();
   
}); // Main Search Listener


//When you click an add or remove button
$("#results").on("click", "button", function(btn){
        console.log(btn.target);
        //If not a remove button - display dropdown
        if(!btn.target.classList.contains("removeButton")){
            let divEle = btn.target.id+"Div";
       
            document.getElementById(divEle).classList.toggle("show");
        }
//------------------------Remove from List----------------------
        else {
            let remIdx;
            userLists.forEach(function(obj, i){
                if(obj.name === currentList){
                    remIdx=i;
                }
            });
            
            userLists[remIdx].array.splice(btn.target.id, 1);
            

            let tempList = userLists[remIdx];
            let tempObj = {name: tempList.name, array: tempList.array}
            window.localStorage.setItem(tempList.name, JSON.stringify(tempObj));
            
            if(window.innerWidth < 780){

            }
            else {
                let tempBookList = objectToBook(userLists[0].array);
                largeDisplayList(tempBookList);
            }

        }

    // Close the dropdown menu if the user clicks outside of it
    window.onclick = function(event) {
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
    $(`#${btn.target.id}OutDiv`).on("click", "a", function(event){
        event.preventDefault();
        $(`#${btn.target.id}OutDiv`).off();
            let idx = btn.target.id; // position in searchResults
            let list = event.target.textContent; //name of the list adding to
            let listIdx; // where that list is in userLists
            userLists.forEach(function(obj, i){
                if(obj.name === list){
                    listIdx = i;
                }

            });

            //idx the position in the search array
            //list the name of user created list
            addRemoveFromLists(idx, list, listIdx);
           
    });//Results link Event Listener        
});//Results button event listener



window.addEventListener('resize', function(event){
    if(!$resultsDivEle.is(':empty')){
        if(window.innerWidth >= 780){
            largeDisplayResults(searchResults);
        }
        else{
            displayResults(searchResults);
        }
    }
});


// Temp listener to clear the local storage
$("#inputElements").on("click", "button", function(event){
    window.localStorage.clear();
    saveToLocal=[];
    defaultList=[];
    userLists=[{name: "Reading List", array: defaultList}];
    window.localStorage.setItem('Reading List', JSON.stringify(userLists[0]));

});


//---------------------------------------------------------
//                   HTML/lists.html
//---------------------------------------------------------


$subNavEle.on("click", "a", function(event){
    

//---------------------Create List-------------------------    
    if(event.target.id === "createList"){
        $listOptionsEle.empty();
        let listInputDiv = $(`<div id=listInput>
                            <form><p>List Name:
                                <input id="newListInput" type="text">
                                <input id="newListButton" type="submit"> </p>`);
        
        $listOptionsEle.append(listInputDiv);

//New List Name Event Listener
        $listOptionsEle.on("submit", function(optEvent){
            optEvent.preventDefault();
            $resultsDivEle.empty();
            let $inputVal = $('#newListInput').val();
            
            //check to see if the list already exists
            let bool = false;
            userLists.forEach(function(list){
                if(list.name === $inputVal){
                    bool=true;
                    $resultsDivEle.append($('<p>This list already exits please create another</p>'));
                }
            });
            
            //If it exits stop
            if(bool === true){return;}

            //Create the List obj and add to LS and userLists
            let tempArray =[];
            let tempObj = {name: $inputVal, array: tempArray};
           
            userLists.push(tempObj);
            window.localStorage.setItem(`${$inputVal}`, JSON.stringify(tempObj));
    
        });//New List Input Event listener
    }//If Create List 

//----------------------------My List-----------------------------   
    if(event.target.id === "aMyLists"){
        $listOptionsEle.empty();
        //Display Every list
        userLists.forEach(function(list){
            let $tempH3 = $(`<a href="#">${list.name}<a>`);
            $listOptionsEle.append($tempH3);
        });

        $listOptionsEle.on("click", "a", function(aEvent){
            if(aEvent.target.textContent === "Reading List"){
                let tempList = objectToBook(userLists[0].array);
                console.log(tempList);
                largeDisplayList(tempList);
                currentList="Reading List";
            }
        });




    }// If My Lists

});//$subNavEle event listener


////////////////////////////////////////////////////////////
//                     Functions
////////////////////////////////////////////////////////////

function ajaxCall(){
    // If the author is given
    // This is indicated with a "by"
    done=false;
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
                    
                    if(window.innerWidth < 780){    
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
                if(data.totalItems !== 0){    
                    jsonToBook(data.items);
                    
                    if(window.innerWidth < 780){    
                        displayResults(searchResults);
                    }
                    else {
                        largeDisplayResults(searchResults);
                    }

                }
                else {
                    displayNoResults();
                }
            }); // .then() 

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
        $('.bookDivsDiv').remove();
        $resultsDivEle.empty();
        res.forEach(function(book, idx){
            let tempBookDiv = book.addDataToDiv();
            let tempButton = 
                $(`<button class="listButton" id="${idx}">Add to List</button>`);

            tempBookDiv.children(".bookCoverDiv").append(tempButton);
            $resultsDivEle.append(tempBookDiv);
        });
    
}// displayResults 

function largeDisplayResults(res){
    $('.bookDivsDiv').remove();
    $resultsDivEle.empty();
    let i=1;
    let $bookDivsDiv = $("<div class='bookDivsDiv'>");
    res.forEach(function(book, idx){
        let tempBookDiv = book.addDataToDiv();

        //click menu button add
        let $dropDiv = $(`<div id="${idx}OutDiv" class="dropdown">`);
        let tempButton = $(`<button id="${idx}" class="listButton">Add to List</button>`);
        let $dropContDiv= $(`<div id="${idx}Div" class="dropdown-content">`);
        userLists.forEach(function(list, userIdx){
            let a = $(`<a id="${userIdx}A" class="dropLinks" href="#">${list.name}</a>`);
            $dropContDiv.append(a);
        });
        $dropDiv.append(tempButton,$dropContDiv);
                                    

           

        tempBookDiv.children(".bookCoverDiv").append($dropDiv);
        $bookDivsDiv.append(tempBookDiv);
        if(i===2){
            i=1;
            $resultsDivEle.append($bookDivsDiv);
            $bookDivsDiv = $("<div class='bookDivsDiv'>");
        }
        else if(idx === res.length-1){
            let $blankDiv = $('<div class="blankDiv">');
            $bookDivsDiv.append($blankDiv);
            $resultsDivEle.append($bookDivsDiv);
        }
        else{
            i++;
        }
    });
}

function displayList(res){

}

function largeDisplayList(res){
    $('.bookDivsDiv').remove();
    $resultsDivEle.empty();
    let i=1;
    let $bookDivsDiv = $("<div class='bookDivsDiv'>");
    res.forEach(function(book, idx){
        let tempBookDiv = book.addDataToDiv();
        let tempButton = 
             $(`<button class="removeButton" id="${idx}">Remove</button>`);


        tempBookDiv.children(".bookCoverDiv").append(tempButton);
        $bookDivsDiv.append(tempBookDiv);
        if(i===2){
            i=1;
            $resultsDivEle.append($bookDivsDiv);
            $bookDivsDiv = $("<div class='bookDivsDiv'>");
        }
        else if(idx === res.length-1){
            let $blankDiv = $('<div class="blankDiv">');
            $bookDivsDiv.append($blankDiv);
            $resultsDivEle.append($bookDivsDiv);
        }
        else{
            i++;
        }
    });
}

function resetResults(){
    search = "";
    tSearch = "";
    aSearch = "";
    criteria = "";
    searchResults = [];
    $resultsDivEle.empty();
}//resetResults()

function displayNoResults(){
    let tempEle = $("<h2 id='resultsErrorNone'>No Results Found</h2>");
    $resultsDivEle.append(tempEle);
}//displayNoResults()


 
//---------------------------------------------------------
//                         Storage
//---------------------------------------------------------

function checkLocal(){
//If the local storage does not exist create it
    //To Read List
    if(typeof(localStorage.getItem("Reading List"))=== "undefined"){
        // If fresh, create the list
        userLists[0]={name: "Reading List", array: defaultList};
        window.localStorage.setItem("Reading List", JSON.stringify(userLists[0]));
        
    }
    else {
        userLists[0] = JSON.parse(window.localStorage.getItem("Reading List"));
    }

    // User Lists
    for(let i =1; i< localStorage.length; i++){
            userLists.push(JSON.parse(window.localStorage.getItem(
                localStorage.key(i))));
        }
    console.log("User List");
    console.log(userLists);
    console.log("Local Storage");
    console.log(localStorage);
} // checkLocal()

function addRemoveFromLists(idx, listName, listIdx){
    //idx - the idx inside searchResults
    //listName - the name of the list clicked
    //listIdx - the idx of the list clicked in userLists
    let list = userLists[listIdx];
    let tempObj = {name: listName, array: list.array}

    list.array.push(searchResults[idx].toObject());
    console.log(list.array);
    if(listName === "Reading List"){ listName="Reading List";}
    console.log(listName);
    window.localStorage.setItem(listName, JSON.stringify(tempObj));


    
   

    // if($(btn).html()==="Add to List"){
    //     $(btn).html("Remove");
    //     $(btn).css({backgroundColor: "red"});
        
    //     searchResults[idx].inList=true;
    //     defaultList.push(searchResults[idx].toObject());
    //     window.localStorage.setItem('Reading List', JSON.stringify(defaultList));
    //     console.log(defaultList);
    // }
    // else{
    //     $(btn).html("Add to List");
    //     $(btn).css({background: "transparent"});

    //     //Removes the book attached to the button on the serach page
    //     //from the local storage array
    //     defaultList = defaultList.filter(function(ele){
    //         return ele.isbn !== searchResults[idx].isbn;
    //     });
    //     window.localStorage.setItem('Reading List', JSON.stringify(defaultList));
    //     console.log(defaultList);
    //}else

  

}//addRemoveFromLists

function objectToBook(list){
    let tempArray = [];
    list.forEach(function(obj){
        let tempBook = new book (obj.title, obj.author, obj.cover,
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