/* globals _ */
/* RequireJS */
(function(require, $) {
    'use strict';

    // In the case when the Video constructor will be called before RequireJS finishes loading all of the Video
    // dependencies, we will have a mock function that will collect all the elements that must be initialized as
    // Video elements.
    //
    // Once RequireJS will load all of the necessary dependencies, main code will invoke the mock function with
    // the second parameter set to truthy value. This will trigger the actual Video constructor on all elements
    // that are stored in a temporary list.
    window.Video = (function() {
        // Temporary storage place for elements that must be initialized as Video elements.
        var tempCallStack = [];

        return function(element, processTempCallStack) {
            // If mock function was called with second parameter set to truthy value, we invoke the real `window.Video`
            // on all the stored elements so far.
            if (processTempCallStack) {
                $.each(tempCallStack, function(index, el) {
                    // By now, `window.Video` is the real constructor.
                    window.Video(el);
                });

                return null;
            }

            // If normal call to `window.Video` constructor, store the element for later initializing.
            tempCallStack.push(element);

            // Real Video constructor returns the `state` object. The mock function will return an empty object.
            return {};
        };
    }());

    // Main module.
    require(
        /* End RequireJS */
    /* Webpack
    define(
    /* End Webpack */
        [
            'video/00_video_storage.js',
            'video/01_initialize.js',
            'video/025_focus_grabber.js',
            'video/035_video_accessible_menu.js',
            'video/04_video_control.js',
            'video/04_video_full_screen.js',
            'video/05_video_quality_control.js',
            'video/06_video_progress_slider.js',
            'video/07_video_volume_control.js',
            'video/08_video_speed_control.js',
            'video/08_video_auto_advance_control.js',
            'video/09_video_caption.js',
            'video/custom_app.js',
            'video/09_play_placeholder.js',
            'video/09_play_pause_control.js',
            'video/09_play_skip_control.js',
            'video/09_skip_control.js',
            'video/09_bumper.js',
            'video/09_save_state_plugin.js',
            'video/09_events_plugin.js',
            'video/09_events_bumper_plugin.js',
            'video/09_poster.js',
            'video/09_completion.js',
            'video/10_commands.js',
            'video/095_video_context_menu.js',
            'video/036_video_social_sharing.js'
        ],
        function(
            VideoStorage, initialize, FocusGrabber, VideoAccessibleMenu, VideoControl, VideoFullScreen,
            VideoQualityControl, VideoProgressSlider, VideoVolumeControl, VideoSpeedControl, VideoAutoAdvanceControl,
            VideoCaption, VideoPlayPlaceholder, VideoPlayPauseControl, VideoPlaySkipControl, VideoSkipControl,
            VideoBumper, VideoSaveStatePlugin, VideoEventsPlugin, VideoEventsBumperPlugin, VideoPoster,
            VideoCompletionHandler, VideoCommands, VideoContextMenu, VideoSocialSharing
        ) {
            /* RequireJS */
            var youtubeXhr = null,
                oldVideo = window.Video;
            /* End RequireJS */
            /* Webpack
            var youtubeXhr = null;
            /* End Webpack */

            window.Video = function(element) {
                var el = $(element).find('.video'),
                    id = el.attr('id').replace(/video_/, ''),
                    storage = VideoStorage('VideoState', id),
                    bumperMetadata = el.data('bumper-metadata'),
                    autoAdvanceEnabled = el.data('autoadvance-enabled') === 'True',
                    mainVideoModules = [
                        FocusGrabber, VideoControl, VideoPlayPlaceholder,
                        VideoPlayPauseControl, VideoProgressSlider, VideoSpeedControl,
                        VideoVolumeControl, VideoQualityControl, VideoFullScreen, VideoCaption, VideoCommands,
                        VideoContextMenu, VideoSaveStatePlugin, VideoEventsPlugin, VideoCompletionHandler
                    ].concat(autoAdvanceEnabled ? [VideoAutoAdvanceControl] : []),
                    bumperVideoModules = [VideoControl, VideoPlaySkipControl, VideoSkipControl,
                        VideoVolumeControl, VideoCaption, VideoCommands, VideoSaveStatePlugin,
                        VideoEventsBumperPlugin, VideoCompletionHandler],
                    state = {
                        el: el,
                        id: id,
                        metadata: el.data('metadata'),
                        storage: storage,
                        options: {},
                        youtubeXhr: youtubeXhr,
                        modules: mainVideoModules
                    };

                var getBumperState = function(metadata) {
                    var bumperState = $.extend(true, {
                        el: el,
                        id: id,
                        storage: storage,
                        options: {},
                        youtubeXhr: youtubeXhr
                    }, {metadata: metadata});

                    bumperState.modules = bumperVideoModules;
                    bumperState.options = {
                        SaveStatePlugin: {events: ['language_menu:change']}
                    };
                    return bumperState;
                };

                var player = function(innerState) {
                    return function() {
                        _.extend(innerState.metadata, {autoplay: true, focusFirstControl: true});
                        initialize(innerState, element);
                    };
                };
                var onSequenceChange;

                VideoAccessibleMenu(el, {
                    storage: storage,
                    saveStateUrl: state.metadata.saveStateUrl
                });

                VideoSocialSharing(el);

                if (bumperMetadata) {
                    VideoPoster(el, {
                        poster: el.data('poster'),
                        onClick: _.once(function() {
                            var mainVideoPlayer = player(state);
                            var bumper, bumperState;
                            if (storage.getItem('isBumperShown')) {
                                mainVideoPlayer();
                            } else {
                                bumperState = getBumperState(bumperMetadata);
                                bumper = new VideoBumper(player(bumperState), bumperState);
                                state.bumperState = bumperState;
                                bumper.getPromise().done(function() {
                                    delete state.bumperState;
                                    mainVideoPlayer();
                                });
                            }
                        })
                    });
                } else {
                    initialize(state, element);
                }

                if (!youtubeXhr) {
                    youtubeXhr = state.youtubeXhr;
                }

                el.data('video-player-state', state);
                onSequenceChange = function() {
                    if (state && state.videoPlayer) {
                        state.videoPlayer.destroy();
                    }
                    $('.sequence').off('sequence:change', onSequenceChange);
                };
                $('.sequence').on('sequence:change', onSequenceChange);

                // Because the 'state' object is only available inside this closure, we will also make it available to
                // the caller by returning it. This is necessary so that we can test Video with Jasmine.
                return state;
            };

            window.Video.clearYoutubeXhr = function() {
                youtubeXhr = null;
            };

            window.Video.loadYouTubeIFrameAPI = initialize.prototype.loadYouTubeIFrameAPI;

            /* RequireJS */
            // Invoke the mock Video constructor so that the elements stored within it can be processed by the real
            // `window.Video` constructor.
            oldVideo(null, true);
            /* End RequireJS */
        }
        
    );
/* RequireJS */
}(window.RequireJS.require, window.jQuery));
/* End RequireJS */
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
