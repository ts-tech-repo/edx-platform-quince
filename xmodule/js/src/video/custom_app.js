// appending search icon
var searchIconContainer = document.createElement("div");
searchIconContainer.className = "transcript-search";

var searchIconSVG = document.createElementNS("http://www.w3.org/2000/svg", "svg");
searchIconSVG.setAttribute("xmlns", "http://www.w3.org/2000/svg");
searchIconSVG.setAttribute("viewBox", "0 0 512 512");
searchIconSVG.setAttribute("style", "");
var searchIconPath = document.createElementNS("http://www.w3.org/2000/svg", "path");
searchIconPath.setAttribute("d", "M416 208c0 45.9-14.9 88.3-40 122.7L502.6 457.4c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L330.7 376c-34.4 25.2-76.8 40-122.7 40C93.1 416 0 322.9 0 208S93.1 0 208 0S416 93.1 416 208zM208 352a144 144 0 1 0 0-288 144 144 0 1 0 0 288z");
searchIconPath.setAttribute("fill", "white");
searchIconSVG.appendChild(searchIconPath);
searchIconContainer.appendChild(searchIconSVG);

// Prepend both divs to the secondary-controls element
var secondaryControls = document.querySelector(".secondary-controls");
if (secondaryControls) {
    secondaryControls.prepend(searchIconContainer);
}


// event to add and show search field 
var transcript_search = document.querySelector(".transcript-search");
transcript_search.addEventListener('click', function() {
    const subtitles = document.querySelector('.subtitles');
    const searchTranscript = document.getElementById('searchTranscript');
    if (subtitles.style.display === 'block') {
        subtitles.style.display = 'none';
    } else {
        subtitles.style.display = 'block';
        if (!searchTranscript) {
            const searchTranscriptDiv = document.createElement('div');
            searchTranscriptDiv.id = 'searchTranscript';
            searchTranscriptDiv.className = 'searchTranscript';
            searchTranscriptDiv.style.display = 'block';
            const form = document.createElement('form');
            form.id = 'searchForm';
            form.className = 'searchForm';
            form.style.textAlign = 'center';
            const input = document.createElement('input');
            input.id = 'searchQuery';
            input.className = 'searchQuery';
            input.type = 'text';
            input.placeholder = 'Search Transcript';
            form.appendChild(input);
            searchTranscriptDiv.appendChild(form);
            const searchResultBody = document.createElement('div');
            searchResultBody.className = 'searchResult-body';
            searchResultBody.id = 'searchResult-body';
            searchTranscriptDiv.appendChild(searchResultBody);
            subtitles.prepend(searchTranscriptDiv);
            // search function call
            document.querySelector("#searchQuery").addEventListener("keyup", (event) => {
                search_transcript();
            });
        }
    }
});

// search transcript
function search_transcript() {
    $('#searchResult-body').empty();
    var query = document.getElementById("searchQuery").value;
    log_query = query;

    var transcript_items = document.querySelectorAll("#transcript-captions-9e24f52e08b8452f9b29540b2a0788ae li span[role='link']");
    var result = '';
    var count = 0;
    
    transcript_items.forEach(item => {
        var text = item.textContent;
        var data_start = item.getAttribute("data-start");
        var data_index = item.getAttribute("data-index");
        var text_lower = text.toLowerCase();
        var query_lower = query.toLowerCase();
        
        if (text_lower.includes(query_lower)) {
            result += `<li class="searchResult-line"><span data-start=${data_start} data-index=${data_index} class="searchResult-text">${text}</span></li>`;
            count++;
        }
    });

    var transcript = document.querySelector(".subtitles-menu");
    transcript.style.display = "none";
    
    if (result === "") {
        result = '<div class="searchResult-line"><span class="searchResult-noResults">No Results Found.</span></div>';
    } else {
        result = `<div class="searchResult-Count"><span class="searchResult-count">There are ${count} query results.</span></div>` + result;
    }
    $('#searchResult-body').append(result);
    var searchResultText = document.getElementsByClassName("searchResult-line");
    var myfunction = function(e) {
        var data_begin = this.getAttribute("data-start");
        e.preventDefault();
        var myPlayer = videojs("video");
        myPlayer.play();
        myPlayer.currentTime(data_begin);
        clicked_query = log_query;
        console.log("clicked_query");
    };
    for (var j = 0; j < searchResultText.length; j++) {
        searchResultText[j].addEventListener('click', myfunction, false);
    }
    var x = document.getElementById("searchResult-body");
    if (query.length === 0) {
        $('#searchResult-body').empty();
        x.style.display = "none";
        transcript.style.display = "block";
    } else {
        x.style.display = "block";
    }
}