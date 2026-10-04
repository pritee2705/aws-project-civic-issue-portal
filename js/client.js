
// =====================================================
// CLIENT DASHBOARD - client.js
// =====================================================

// Your API Gateway endpoint
const REPORTS_API_URL =
    "https://3n5lss6p32.execute-api.ap-south-1.amazonaws.com/my-reports";


// =====================================================
// GLOBAL REPORTS ARRAY
// =====================================================

let reports = [];


// =====================================================
// GET LOGGED-IN USER
// =====================================================

const storedUser = JSON.parse(
    localStorage.getItem("user") || "null"
);

const storedName = storedUser?.name || "Citizen";


// =====================================================
// DISPLAY USER NAME
// =====================================================

const userNameElements = document.querySelectorAll(
    "#userName, #welcomeName"
);

userNameElements.forEach(element => {
    element.textContent = storedName;
});


// =====================================================
// FORMAT DATE
// =====================================================

function formatDate(dateString) {

    if (!dateString) {
        return "Unknown";
    }

    const date = new Date(dateString);

    if (isNaN(date.getTime())) {
        return "Unknown";
    }

    return date.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric"
    });
}


// =====================================================
// STATUS CSS CLASS
// =====================================================

function getStatusClass(status) {

    if (status === "Pending") {
        return "pending";
    }

    if (status === "In Progress") {
        return "progress";
    }

    if (status === "Solved") {
        return "solved";
    }

    return "pending";
}


// =====================================================
// FETCH REPORTS FROM BACKEND
// =====================================================

async function fetchMyReports() {

    const token = localStorage.getItem("token");

    // User is not logged in
    if (!token) {

        console.warn("No authentication token found.");

        window.location.href = "login.html";

        return;
    }

    try {

        console.log("Fetching user reports...");

        const response = await fetch(
            REPORTS_API_URL,
            {
                method: "GET",

                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Content-Type": "application/json"
                }
            }
        );


        // Try to read JSON response
        const result = await response.json();

        console.log("Reports API response:", result);


        // Handle expired/invalid token
        if (response.status === 401) {

            localStorage.removeItem("token");
            localStorage.removeItem("user");

            alert("Your session has expired. Please login again.");

            window.location.href = "login.html";

            return;
        }


        // Handle other API errors
        if (!response.ok) {

            throw new Error(
                result.error ||
                result.message ||
                "Failed to fetch reports"
            );
        }


        // Store reports
        reports = Array.isArray(result.reports)
            ? result.reports
            : [];


        console.log(
            "Total reports fetched:",
            reports.length
        );


        // Update dashboard
        loadDashboard();


        // Update My Reports section
        loadMyReports();


    } catch (error) {

        console.error(
            "Fetch reports error:",
            error
        );


        // Dashboard counters
        const totalElement =
            document.getElementById("totalReports");

        const pendingElement =
            document.getElementById("pendingReports");

        const progressElement =
            document.getElementById("progressReports");

        const resolvedElement =
            document.getElementById("resolvedReports");


        if (totalElement) {
            totalElement.textContent = "0";
        }

        if (pendingElement) {
            pendingElement.textContent = "0";
        }

        if (progressElement) {
            progressElement.textContent = "0";
        }

        if (resolvedElement) {
            resolvedElement.textContent = "0";
        }


        // Reports container
        const container =
            document.getElementById("reportsContainer");

        if (container) {

            container.innerHTML = `
                <div class="error-message">
                    <p>Unable to load your reports.</p>
                    <button onclick="fetchMyReports()">
                        Retry
                    </button>
                </div>
            `;
        }


        // Recent reports table
        const recentReports =
            document.getElementById("recentReports");

        if (recentReports) {

            recentReports.innerHTML = `
                <tr>
                    <td colspan="5">
                        Unable to load reports.
                    </td>
                </tr>
            `;
        }
    }
}


// =====================================================
// LOAD DASHBOARD STATISTICS
// =====================================================

function loadDashboard() {

    const total =
        reports.length;


    const pending =
        reports.filter(
            report => report.status === "Pending"
        ).length;


    const progress =
        reports.filter(
            report => report.status === "In Progress"
        ).length;


    const solved =
        reports.filter(
            report => report.status === "Solved"
        ).length;


    // Total
    const totalElement =
        document.getElementById("totalReports");

    if (totalElement) {
        totalElement.textContent = total;
    }


    // Pending
    const pendingElement =
        document.getElementById("pendingReports");

    if (pendingElement) {
        pendingElement.textContent = pending;
    }


    // In Progress
    const progressElement =
        document.getElementById("progressReports");

    if (progressElement) {
        progressElement.textContent = progress;
    }


    // Resolved
    const resolvedElement =
        document.getElementById("resolvedReports");

    if (resolvedElement) {
        resolvedElement.textContent = solved;
    }


    // Recent reports table
    const container =
        document.getElementById("recentReports");


    if (!container) {
        return;
    }


    // Clear old/demo rows
    container.innerHTML = "";


    // No reports
    if (reports.length === 0) {

        container.innerHTML = `
            <tr>
                <td colspan="5">
                    No reports submitted yet.
                </td>
            </tr>
        `;

        return;
    }


    // Show latest 5 reports
    const recentReports =
        reports.slice(0, 5);


    recentReports.forEach(report => {

        const row =
            document.createElement("tr");


        const category =
            report.category ||
            "Pending Classification";


        const location =
            report.locationName ||
            "Location unavailable";


        const date =
            formatDate(report.createdAt);


        const status =
            report.status ||
            "Pending";


        row.innerHTML = `
            <td>${report.issueId || "N/A"}</td>

            <td>${category}</td>

            <td>${location}</td>

            <td>${date}</td>

            <td>
                <span class="status ${getStatusClass(status)}">
                    ${status}
                </span>
            </td>
        `;


        container.appendChild(row);
    });
}


// =====================================================
// LOAD MY REPORTS
// =====================================================

function loadMyReports() {

    const container =
        document.getElementById("reportsContainer");


    if (!container) {
        return;
    }


    // Initially render all reports
    renderReports(reports);


    // Search
    const searchInput =
        document.getElementById("searchInput");


    // Status filter
    const statusFilter =
        document.getElementById("statusFilter");


    // If search/filter elements don't exist,
    // don't continue
    if (!searchInput || !statusFilter) {
        return;
    }


    function filterReports() {

        const search =
            searchInput.value
                .trim()
                .toLowerCase();


        const selectedStatus =
            statusFilter.value;


        const filtered =
            reports.filter(report => {

                const issueId =
                    String(
                        report.issueId || ""
                    ).toLowerCase();


                const category =
                    String(
                        report.category || ""
                    ).toLowerCase();


                const location =
                    String(
                        report.locationName || ""
                    ).toLowerCase();


                const matchesSearch =
                    issueId.includes(search) ||
                    category.includes(search) ||
                    location.includes(search);


                const matchesStatus =
                    selectedStatus === "ALL" ||
                    report.status === selectedStatus;


                return (
                    matchesSearch &&
                    matchesStatus
                );
            });


        renderReports(filtered);
    }


    // Prevent duplicate event listeners
    searchInput.oninput = filterReports;

    statusFilter.onchange = filterReports;
}


// =====================================================
// RENDER REPORT CARDS
// =====================================================

function renderReports(reportList) {

    const container =
        document.getElementById("reportsContainer");


    if (!container) {
        return;
    }


    container.innerHTML = "";


    // No reports
    if (!reportList || reportList.length === 0) {

        container.innerHTML = `
            <div class="no-reports">
                <p>No reports found.</p>
            </div>
        `;

        return;
    }


    reportList.forEach(report => {

        const card =
            document.createElement("div");


        card.className =
            "report-card";


        const category =
            report.category ||
            "Pending Classification";


        const location =
            report.locationName ||
            "Location unavailable";


        const status =
            report.status ||
            "Pending";


        const date =
            formatDate(
                report.createdAt
            );


        card.innerHTML = `

            <span class="status ${getStatusClass(status)}">
                ${status}
            </span>

            <h3>
                ${category}
            </h3>

            <p>
                📍 ${location}
            </p>

            <p>
                🗓️ ${date}
            </p>

            <p>
                ID: ${report.issueId || "N/A"}
            </p>

        `;


        container.appendChild(card);
    });
}


// =====================================================
// LOGOUT
// =====================================================

function logout() {

    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // Remove old storage key if it exists
    localStorage.removeItem("userName");

    window.location.href = "login.html";
}


// =====================================================
// INITIAL LOAD
// =====================================================

// Do NOT call loadDashboard() directly.
// Reports must first be fetched from DynamoDB.

fetchMyReports();

