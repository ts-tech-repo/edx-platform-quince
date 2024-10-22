const formData = new FormData();
let peers = [];
let isFound = false;
let courseId = "";

document.addEventListener('DOMContentLoaded', function() {
    const courseElement = document.querySelector('.pgn__card-wrapper-image-cap');
    if (courseElement && courseElement.hasAttribute('href')) {
        const courseName = courseElement.getAttribute('href');
        console.log(courseName);
    } else {
        console.log('Element not found');
    }
});


const handleRegex = (url) => {
  const regex = /course\/(.*?)\/home/; // Regex to match the pattern
  const match = url.match(regex);
  return match ? match[1] : null;
}

function handleCourseId() {
  window.parent.postMessage('getCourseDetails', '*');
}

// Listen for the response from the parent
window.addEventListener('message', function (event) {
  // Make sure the message is from your parent window
  if (event.data.type === 'courseDetails') {
    const courseUrls = event.data.data;
    console.log('Iframe received URLs:', courseUrls);
    // const courseId = handleRegex(courseUrls[0]);
    courseUrls.forEach((url) => {
      console.log('Processing URL:', url);
      if (!isFound && url.includes("Marker")) {
        isFound = true;
        courseId = handleRegex(url)
      }
    });
    if (!isFound) {
      courseId = handleRegex(courseUrls[0])

    }
    // After processing all URLs, add courseId to formData
    formData.append("course_id", courseId);
    console.log(formData, "FormData after adding course_id");
    // Now that we have the courseId, we can call getPeers
    getPeers();
  }
}, false);

handleCourseId();

async function getPeers() {
  if (courseId.length > 0) {
    const response = await fetch(
      "https://staging.quince02.talentsprint.com/extras/get_peer_profiles",
      {
        method: "POST",
        headers: {
          Cookie:
            "csrftoken=0lXIs9FEngTt9FLcwDMRnafS43b8pF5m; sessionid=1|z6acqh6452aw91jg8cb4ovnrl92lp216|p9BYiXpXFXgC|IjZmYzAwMDA5ZjgxOTgyMDJkNjU1OTA3NzIxNThlYzJiNzc5OTQyNTEyMTVmNGQ2MGJiZWUyOGU5ZmExYmNkZWYi:1sy4ht:W58e6kHyluGmzJ8Ci3gVW_idRKdPT8olC34U6EMklCo",
        },
        body: formData,
      }
    );
    const data = await response.json();
    peers = data || [];
    renderPeers();
  }
}
  const rootElement = document.getElementById("row");
  const modal = document.getElementById("myModal");
  function renderPeers() {
    peers?.map((peer) => {
      const colElement = document.createElement("div");
      colElement.style.cursor = "pointer";
      colElement.style.borderRadius = "rgba(0, 0, 0, 0.16) 0px 1px 4px;";
      colElement.style.position = "relative";
      colElement.style.zIndex = 10;

      colElement.onclick = function () {
        modal.style.display = "block";
        document.body.style.overflow = "hidden";
        renderModal(peer);
      };
      window.onclick = function (event) {
        if (event.target == modal) {
          modal.style.display = "none";
          document.body.style.overflow = "auto"; // Enable background scrolling
        }
      };
      colElement.classList.add("bg-white", "p-3", "colElement");

      colElement.innerHTML = `        
            <div class="profile-section d-flex align-items-center">
                <img class="profile-img" src=${peer.profile_image_urls.full} alt="" />
                <p class="ml-4 font-weight-bold" style="font-size: 24px;">${peer?.first_name} ${peer.last_name}</p>
            </div>
            <div class="ed-section mt-3">
                <p style="height:50px;color: rgba(0,0,0,0.5);font-size: 17px; overflow: hidden;display: -webkit-box;
  -webkit-line-clamp: 2; /* number of lines to show */
  -webkit-box-orient: vertical;">${peer.level_of_education}</p>
            </div>
            <img src="https://static.talentsprint.com/lms_maple/images/arrow.png" style="height: 35px; width: 35px" />
    `;

      rootElement.appendChild(colElement);

      // console.log(peer);
    });
  }

  function renderModal(peer) {
    const modalContent = document.getElementById("modal-content");
    const existingContent = modalContent.innerHTML;
    modalContent.innerHTML = `
   <span class="close text-right" style="font-size: 33px;
    position: absolute;
    right: 38px;
">X</span>
  <div class="d-flex flex-column flex-lg-row align-content-center" style="margin-bottom: 60px; padding: 75px;">
  <div class="peer-img d-fex flex-column align-items-center">
  <div class="gradient-border"> 
  <img class="content"  src="${peer?.profile_image_urls?.full
      }" style="width: 200px; height: 200px; border-radius: 50%;" alt="${peer?.first_name
      } ${peer?.last_name}" />
  </div>
      <div class="social-media d-flex justify-content-center mt-3">
      <a href=${peer?.social_links?.[2]?.url} target="_blank"> 
      <img src="https://static.talentsprint.com/lms_maple/images/linkedin.svg" alt="LinkedIn" class="social-media-icons" />   
      </a>

      <a href=${peer?.social_links?.[0]?.url} target="_blank"> 
      <img src="https://static.talentsprint.com/lms_maple/images/twitter.svg" alt="Twitter" class="social-media-icons" />   
      </a>

      <a href=${peer?.social_links?.[1]?.url} target="_blank"> 
      <img src="https://static.talentsprint.com/lms_maple/images/facebook.svg" alt="LinkedIn" class="social-media-icons" />   
      </a>
       
      </div>
    </div>
    <div class="info-section ml-5">
    <div class="peer-name">
    <p style="font-size: 35px;">${peer?.first_name || ""} ${peer?.last_name || ""
      }</p>       
    <p style= "font-size: 18px;color: rgba(0,0,0,0.5);">${peer?.level_of_education || ""
      }</p>
    </div>
    <div class="my-3" style="height: 1px; background-color: rgba(0,0,0,0.1)"> </div>
      <div class="peer-about" style="font-size: 22px; color: rgba(0,0,0,0.5); line-height: 2rem;">
        <p>${peer?.bio || ""}</p>
      </div>
    </div>
   </div>
    
  `;
    const span = document.getElementsByClassName("close")[0];
    if (span) {
      span.onclick = function () {
        modal.style.display = "none";
        document.body.style.overflow = "auto"; // Enable background scrolling
      };
    }
  }

