
// =====================================================
// API
// =====================================================

const API_URL =
    "https://1fqyt1qqb5.execute-api.ap-south-1.amazonaws.com/report";


// =====================================================
// MAP
// =====================================================

const map =
    L.map("map").setView(
        [18.5204, 73.8567],
        12
    );


L.tileLayer(
    "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
    {
        attribution:
            "&copy; OpenStreetMap contributors"
    }
).addTo(map);


let marker = null;


// =====================================================
// MAP CLICK
// =====================================================

map.on("click", function (event) {

    const lat =
        event.latlng.lat.toFixed(6);

    const lng =
        event.latlng.lng.toFixed(6);


    if (marker) {

        marker.setLatLng(
            event.latlng
        );

    } else {

        marker =
            L.marker(
                event.latlng
            ).addTo(map);

    }


    document.getElementById(
        "latitude"
    ).value = lat;


    document.getElementById(
        "longitude"
    ).value = lng;

});


// =====================================================
// IMAGE PREVIEW
// =====================================================

const imageInput =
    document.getElementById(
        "imageInput"
    );

const imagePreview =
    document.getElementById(
        "imagePreview"
    );


imageInput.addEventListener(
    "change",
    function () {

        const file =
            this.files[0];


        if (!file) {
            return;
        }


        // Check image type

        if (!file.type.startsWith("image/")) {

            alert(
                "Please select an image."
            );

            this.value = "";

            return;
        }


        // Check image size

        if (
            file.size >
            6 * 1024 * 1024
        ) {

            alert(
                "Image must be less than 6 MB."
            );

            this.value = "";

            return;
        }


        // Preview image

        const reader =
            new FileReader();


        reader.onload =
            function (event) {

                imagePreview.src =
                    event.target.result;

                imagePreview.style.display =
                    "block";

                document.getElementById(
                    "uploadText"
                ).style.display =
                    "none";

            };


        reader.readAsDataURL(file);

    }
);


// =====================================================
// SUBMIT ISSUE
// =====================================================

document.getElementById(
    "issueForm"
).addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        const file =
            imageInput.files[0];


        const latitude =
            document.getElementById(
                "latitude"
            ).value;


        const longitude =
            document.getElementById(
                "longitude"
            ).value;


        const locationName =
            document.getElementById(
                "locationName"
            ).value.trim();


        const message =
            document.getElementById(
                "submitMessage"
            );


        // -------------------------------------------------
        // Check image
        // -------------------------------------------------

        if (!file) {

            message.textContent =
                "Please select an image.";

            return;
        }


        // -------------------------------------------------
        // Check location
        // -------------------------------------------------

        if (!latitude || !longitude) {

            message.textContent =
                "Please select a location on the map.";

            return;
        }


        // -------------------------------------------------
        // Check login session
        // -------------------------------------------------

        const token =
            localStorage.getItem("token");


        const storedUser =
            localStorage.getItem("user");


        if (!token || !storedUser) {

            message.textContent =
                "Your session has expired. Please login again.";

            setTimeout(function () {

                window.location.href =
                    "login.html";

            }, 1000);

            return;
        }


        // -------------------------------------------------
        // Get user information
        // -------------------------------------------------

        let user;

        try {

            user =
                JSON.parse(storedUser);

        } catch (error) {

            console.error(
                "Invalid user data:",
                error
            );

            localStorage.clear();

            window.location.href =
                "login.html";

            return;
        }


        if (!user || !user.userId) {

            message.textContent =
                "User information is missing. Please login again.";

            localStorage.clear();

            setTimeout(function () {

                window.location.href =
                    "login.html";

            }, 1000);

            return;
        }


        // -------------------------------------------------
        // Show submitting message
        // -------------------------------------------------

        message.textContent =
            "Submitting issue...";


        // -------------------------------------------------
        // Convert image to Base64
        // -------------------------------------------------

        const reader =
            new FileReader();


        reader.onload =
            async function () {

                try {

                    const base64Image =
                        reader.result.split(",")[1];


                    // -------------------------------------------------
                    // Request body
                    // -------------------------------------------------

                    const requestBody = {

                        image:
                            base64Image,

                        fileName:
                            file.name,

                        contentType:
                            file.type,

                        latitude:
                            latitude,

                        longitude:
                            longitude,

                        locationName:
                            locationName ||
                            "Unknown",

                        userId:
                            user.userId
                    };


                    console.log(
                        "Report request:",
                        {
                            fileName: file.name,
                            contentType: file.type,
                            latitude: latitude,
                            longitude: longitude,
                            locationName: locationName,
                            userId: user.userId
                        }
                    );


                    // -------------------------------------------------
                    // API request
                    // -------------------------------------------------

                    const response =
                        await fetch(
                            API_URL,
                            {
                                method: "POST",

                                headers: {

                                    "Content-Type":
                                        "application/json",

                                    "Authorization":
                                        `Bearer ${token}`
                                },

                                body:
                                    JSON.stringify(
                                        requestBody
                                    )
                            }
                        );


                    // -------------------------------------------------
                    // Read response safely
                    // -------------------------------------------------

                    const responseText =
                        await response.text();


                    let result = {};

                    try {

                        result =
                            responseText
                                ? JSON.parse(responseText)
                                : {};

                    } catch (parseError) {

                        console.error(
                            "Invalid JSON response:",
                            responseText
                        );

                        throw new Error(
                            "Server returned an invalid response."
                        );
                    }


                    console.log(
                        "Report API response:",
                        result
                    );


                    // -------------------------------------------------
                    // API error
                    // -------------------------------------------------

                    if (!response.ok) {

                        throw new Error(
                            result.error ||
                            result.message ||
                            `Request failed with status ${response.status}`
                        );
                    }


                    // -------------------------------------------------
                    // Success
                    // -------------------------------------------------

                    message.innerHTML = `
                        ✅ Issue reported successfully!
                        <br>
                        Issue ID:
                        <strong>
                            ${result.issueId || "Generated"}
                        </strong>
                    `;


                    // Reset form

                    document.getElementById(
                        "issueForm"
                    ).reset();


                    // Reset image preview

                    imagePreview.style.display =
                        "none";


                    imagePreview.src =
                        "";


                    document.getElementById(
                        "uploadText"
                    ).style.display =
                        "block";


                    // Reset marker

                    if (marker) {

                        map.removeLayer(
                            marker
                        );

                        marker = null;
                    }

                }

                catch (error) {

                    console.error(
                        "Report submission error:",
                        error
                    );


                    message.textContent =
                        error.message ||
                        "Failed to submit issue.";

                }

            };


        reader.onerror =
            function () {

                message.textContent =
                    "Failed to read the image.";

            };


        reader.readAsDataURL(file);

    }
);


// =====================================================
// LOGOUT
// =====================================================

function logout() {

    localStorage.removeItem("token");

    localStorage.removeItem("user");

    window.location.href =
        "login.html";
}

