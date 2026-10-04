/* =====================================================
CIVIC ADMIN DASHBOARD
admin.js
===================================================== */

/* =====================================================
API CONFIGURATION
===================================================== */

const ADMIN_ISSUES_API_URL =
"https://6xouys1ewh.execute-api.ap-south-1.amazonaws.com/issues";

/* =====================================================
GLOBAL DATA
===================================================== */

let adminReports = [];

let statusChart = null;

let categoryChart = null;

let issueMap = null;

/* =====================================================
GET ADMIN TOKEN
===================================================== */

function getAdminToken() {


return localStorage.getItem("token");


}

/* =====================================================
FORMAT DATE
===================================================== */

function formatAdminDate(dateString) {


if (!dateString) {

    return "Unknown";

}


const date =
    new Date(dateString);


if (isNaN(date.getTime())) {

    return "Unknown";

}


return date.toLocaleDateString(
    "en-IN",
    {
        day: "2-digit",
        month: "short",
        year: "numeric"
    }
);


}

/* =====================================================
STATUS CLASS
===================================================== */

function getAdminStatusClass(status) {


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

/* =====================================================
SET STAT
===================================================== */

function setAdminStat(elementId, value) {


const element =
    document.getElementById(elementId);


if (element) {

    element.textContent = value;

}


}

/* =====================================================
FETCH ALL ISSUES
===================================================== */

async function fetchAdminIssues() {


const token =
    getAdminToken();


if (!token) {

    window.location.href =
        "admin-login.html";

    return;

}


try {

    const response =
        await fetch(
            ADMIN_ISSUES_API_URL,
            {
                method: "GET",

                headers: {

                    "Authorization":
                        `Bearer ${token}`,

                    "Content-Type":
                        "application/json"

                }

            }
        );


    const result =
        await response.json();


    /* ---------------------------------------------
       UNAUTHORIZED
    --------------------------------------------- */

    if (response.status === 401) {

        localStorage.removeItem("token");

        localStorage.removeItem("user");

        localStorage.removeItem("userName");

        alert(
            "Your admin session has expired. Please login again."
        );

        window.location.href =
            "admin-login.html";

        return;

    }


    /* ---------------------------------------------
       FORBIDDEN
    --------------------------------------------- */

    if (response.status === 403) {

        alert(
            "Access denied. Admin privileges are required."
        );

        window.location.href =
            "admin-login.html";

        return;

    }


    if (!response.ok) {

        throw new Error(
            result.error ||
            result.message ||
            "Failed to fetch issues"
        );

    }


    /* ---------------------------------------------
       STORE ISSUES
    --------------------------------------------- */

    adminReports =
        Array.isArray(result.issues)
            ? result.issues
            : [];


    console.log(
        "Admin issues:",
        adminReports
    );


    /* ---------------------------------------------
       LOAD ALL DASHBOARD FEATURES
    --------------------------------------------- */

    updateAdminStats(
        adminReports
    );


    renderRecentIssues(
        adminReports
    );


    renderAdminIssues(
        adminReports
    );


    loadAnalytics();

    loadNotifications();


    /* ---------------------------------------------
       MAP IF ALREADY OPEN
    --------------------------------------------- */

    if (
        document.getElementById("map") &&
        document.getElementById("map").style.display !== "none"
    ) {

        loadIssueMap();

    }


} catch (error) {

    console.error(
        "Admin issues error:",
        error
    );


    const table =
        document.getElementById(
            "adminIssueTable"
        );


    const recentTable =
        document.getElementById(
            "recentIssueTable"
        );


    if (table) {

        table.innerHTML = `

            <tr>

                <td colspan="6">

                    Unable to load issues.

                    <button
                        onclick="fetchAdminIssues()">

                        Retry

                    </button>

                </td>

            </tr>

        `;

    }


    if (recentTable) {

        recentTable.innerHTML = `

            <tr>

                <td colspan="6">

                    Unable to load issues.

                </td>

            </tr>

        `;

    }


    updateAdminStats([]);

}


}

/* =====================================================
UPDATE STATISTICS
===================================================== */

function updateAdminStats(issues) {


const total =
    issues.length;


const pending =
    issues.filter(
        issue =>
            issue.status === "Pending"
    ).length;


const progress =
    issues.filter(
        issue =>
            issue.status === "In Progress"
    ).length;


const solved =
    issues.filter(
        issue =>
            issue.status === "Solved"
    ).length;


setAdminStat(
    "adminTotal",
    total
);


setAdminStat(
    "adminPending",
    pending
);


setAdminStat(
    "adminProgress",
    progress
);


setAdminStat(
    "adminSolved",
    solved
);


}

/* =====================================================
RENDER RECENT ISSUES
===================================================== */

function renderRecentIssues(issues) {


const table =
    document.getElementById(
        "recentIssueTable"
    );


if (!table) {

    return;

}


table.innerHTML = "";


if (
    !issues ||
    issues.length === 0
) {

    table.innerHTML = `

        <tr>

            <td colspan="6">
                No issues found.
            </td>

        </tr>

    `;

    return;

}


const recentIssues =
    [...issues]
        .sort(
            (a, b) =>
                new Date(
                    b.createdAt || 0
                ) -
                new Date(
                    a.createdAt || 0
                )
        )
        .slice(0, 5);


recentIssues.forEach(
    issue => {

        const row =
            document.createElement("tr");


        const issueId =
            issue.issueId || "N/A";


        const category =
            issue.category ||
            "Pending Classification";


        const location =
            issue.locationName ||
            "Location unavailable";


        const date =
            formatAdminDate(
                issue.createdAt
            );


        const status =
            issue.status ||
            "Pending";


        row.innerHTML = `

            <td>

                <strong>
                    ${escapeHTML(issueId)}
                </strong>

            </td>


            <td>
                ${escapeHTML(category)}
            </td>


            <td>
                📍
                ${escapeHTML(location)}
            </td>


            <td>
                ${date}
            </td>


            <td>

                <span class="status ${getAdminStatusClass(status)}">

                    ${escapeHTML(status)}

                </span>

            </td>


            <td>

                <a
                    class="view-btn"
                    href="issue-details.html?id=${encodeURIComponent(issueId)}">

                    View →

                </a>

            </td>

        `;


        table.appendChild(row);

    }
);


}

/* =====================================================
RENDER ALL ISSUES
===================================================== */

function renderAdminIssues(issues) {


const table =
    document.getElementById(
        "adminIssueTable"
    );


if (!table) {

    return;

}


table.innerHTML = "";


if (
    !issues ||
    issues.length === 0
) {

    table.innerHTML = `

        <tr>

            <td colspan="6">
                No issues found.
            </td>

        </tr>

    `;

    return;

}


issues.forEach(
    issue => {

        const row =
            document.createElement("tr");


        const issueId =
            issue.issueId || "N/A";


        const category =
            issue.category ||
            "Pending Classification";


        const location =
            issue.locationName ||
            "Location unavailable";


        const date =
            formatAdminDate(
                issue.createdAt
            );


        const status =
            issue.status ||
            "Pending";


        row.innerHTML = `

            <td>

                <strong>
                    ${escapeHTML(issueId)}
                </strong>

            </td>


            <td>
                ${escapeHTML(category)}
            </td>


            <td>
                📍
                ${escapeHTML(location)}
            </td>


            <td>
                ${date}
            </td>


            <td>

                <span class="status ${getAdminStatusClass(status)}">

                    ${escapeHTML(status)}

                </span>

            </td>


            <td>

                <a
                    class="view-btn"
                    href="issue-details.html?id=${encodeURIComponent(issueId)}">

                    View →

                </a>

            </td>

        `;


        table.appendChild(row);

    }
);


}

/* =====================================================
FILTER ISSUES
===================================================== */

function filterAdminIssues() {


const searchInput =
    document.getElementById(
        "adminSearch"
    );


const statusFilter =
    document.getElementById(
        "adminStatusFilter"
    );


const categoryFilter =
    document.getElementById(
        "adminCategoryFilter"
    );


const searchText =
    searchInput
        ? searchInput.value
            .trim()
            .toLowerCase()
        : "";


const selectedStatus =
    statusFilter
        ? statusFilter.value
        : "ALL";


const selectedCategory =
    categoryFilter
        ? categoryFilter.value
        : "ALL";


const filtered =
    adminReports.filter(
        issue => {

            const issueId =
                String(
                    issue.issueId || ""
                ).toLowerCase();


            const category =
                String(
                    issue.category || ""
                ).toLowerCase();


            const location =
                String(
                    issue.locationName || ""
                ).toLowerCase();


            const matchesSearch =
                issueId.includes(searchText) ||
                category.includes(searchText) ||
                location.includes(searchText);


            const matchesStatus =
                selectedStatus === "ALL" ||
                issue.status === selectedStatus;


            const matchesCategory =
                selectedCategory === "ALL" ||
                issue.category === selectedCategory;


            return (
                matchesSearch &&
                matchesStatus &&
                matchesCategory
            );

        }
    );


renderAdminIssues(filtered);


}

/* =====================================================
RESET FILTERS
===================================================== */

function resetIssueFilters() {


const search =
    document.getElementById(
        "adminSearch"
    );


const status =
    document.getElementById(
        "adminStatusFilter"
    );


const category =
    document.getElementById(
        "adminCategoryFilter"
    );


if (search) {

    search.value = "";

}


if (status) {

    status.value = "ALL";

}


if (category) {

    category.value = "ALL";

}


renderAdminIssues(
    adminReports
);


}

/* =====================================================
ANALYTICS
===================================================== */

function loadAnalytics() {


const total =
    adminReports.length;


const pending =
    adminReports.filter(
        issue =>
            issue.status === "Pending"
    ).length;


const progress =
    adminReports.filter(
        issue =>
            issue.status === "In Progress"
    ).length;


const solved =
    adminReports.filter(
        issue =>
            issue.status === "Solved"
    ).length;


setAdminStat(
    "analyticsTotal",
    total
);


setAdminStat(
    "analyticsPending",
    pending
);


setAdminStat(
    "analyticsProgress",
    progress
);


setAdminStat(
    "analyticsSolved",
    solved
);


createStatusChart(
    pending,
    progress,
    solved
);


const categoryCounts = {};


adminReports.forEach(
    issue => {

        const category =
            issue.category ||
            "Pending Classification";


        categoryCounts[category] =
            (categoryCounts[category] || 0) + 1;

    }
);


createCategoryChart(
    categoryCounts
);


}

/* =====================================================
STATUS CHART
===================================================== */

function createStatusChart(
pending,
progress,
solved
) {


const canvas =
    document.getElementById(
        "statusChart"
    );


if (!canvas) {

    return;

}


if (statusChart) {

    statusChart.destroy();

}


statusChart =
    new Chart(
        canvas,
        {

            type: "doughnut",

            data: {

                labels: [
                    "Pending",
                    "In Progress",
                    "Solved"
                ],

                datasets: [

                    {

                        data: [
                            pending,
                            progress,
                            solved
                        ]

                    }

                ]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                plugins: {

                    legend: {

                        position: "bottom"

                    }

                }

            }

        }
    );


}

/* =====================================================
CATEGORY CHART
===================================================== */

function createCategoryChart(
categoryCounts
) {


const canvas =
    document.getElementById(
        "categoryChart"
    );


if (!canvas) {

    return;

}


if (categoryChart) {

    categoryChart.destroy();

}


const labels =
    Object.keys(categoryCounts);


const values =
    Object.values(categoryCounts);


categoryChart =
    new Chart(
        canvas,
        {

            type: "bar",

            data: {

                labels: labels,

                datasets: [

                    {

                        label:
                            "Number of Issues",

                        data: values

                    }

                ]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                scales: {

                    y: {

                        beginAtZero: true,

                        ticks: {

                            precision: 0

                        }

                    }

                }

            }

        }
    );


}

/* =====================================================
MAP
===================================================== */

function loadIssueMap() {


const mapContainer =
    document.getElementById(
        "issueMap"
    );


if (!mapContainer) {

    return;

}


if (
    typeof L === "undefined"
) {

    console.error(
        "Leaflet library not loaded."
    );

    return;

}


if (!issueMap) {

    issueMap =
        L.map(
            "issueMap"
        ).setView(
            [18.5204, 73.8567],
            12
        );


    L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        {

            attribution:
                "&copy; OpenStreetMap contributors"

        }
    ).addTo(issueMap);

}


/* ---------------------------------------------
   REMOVE OLD MARKERS
--------------------------------------------- */

issueMap.eachLayer(
    layer => {

        if (
            layer instanceof
            L.Marker
        ) {

            issueMap.removeLayer(
                layer
            );

        }

    }
);


const categoryFilter =
    document.getElementById(
        "mapCategoryFilter"
    );


const statusFilter =
    document.getElementById(
        "mapStatusFilter"
    );


const selectedCategory =
    categoryFilter
        ? categoryFilter.value
        : "ALL";


const selectedStatus =
    statusFilter
        ? statusFilter.value
        : "ALL";


let markerCount = 0;


adminReports.forEach(
    issue => {

        const latitude =
            parseFloat(
                issue.latitude
            );


        const longitude =
            parseFloat(
                issue.longitude
            );


        if (
            Number.isNaN(latitude) ||
            Number.isNaN(longitude)
        ) {

            return;

        }


        if (
            selectedCategory !== "ALL" &&
            issue.category !== selectedCategory
        ) {

            return;

        }


        if (
            selectedStatus !== "ALL" &&
            issue.status !== selectedStatus
        ) {

            return;

        }


        const marker =
            L.marker(
                [
                    latitude,
                    longitude
                ]
            );


        marker.bindPopup(`

            <div class="map-popup">

                <h3>
                    ${escapeHTML(issue.issueId || "N/A")}
                </h3>

                <p>
                    <strong>Category:</strong>
                    ${escapeHTML(issue.category || "Pending")}
                </p>

                <p>
                    <strong>Status:</strong>
                    ${escapeHTML(issue.status || "Pending")}
                </p>

                <p>
                    <strong>Location:</strong>
                    ${escapeHTML(issue.locationName || "Unknown")}
                </p>

                <a
                    href="issue-details.html?id=${encodeURIComponent(issue.issueId || "")}">

                    View Issue

                </a>

            </div>

        `);


        marker.addTo(
            issueMap
        );


        markerCount++;

    }
);


setTimeout(
    () => {

        issueMap.invalidateSize();

    },
    200
);


console.log(
    "Map markers:",
    markerCount
);


}

/* =====================================================
NOTIFICATIONS
===================================================== */

function loadNotifications() {


const container =
    document.getElementById(
        "notificationList"
    );


const badge =
    document.getElementById(
        "notificationBadge"
    );


if (!container) {

    return;

}


const notifications = [];


adminReports.forEach(
    issue => {

        if (
            issue.status === "Pending"
        ) {

            notifications.push({

                type: "pending",

                title:
                    "Pending Issue",

                message:
                    `${issue.issueId || "Issue"} requires administrative attention.`,

                date:
                    formatAdminDate(
                        issue.createdAt
                    )

            });

        }


        if (
            issue.status === "In Progress"
        ) {

            notifications.push({

                type: "progress",

                title:
                    "Issue In Progress",

                message:
                    `${issue.issueId || "Issue"} is currently being processed.`,

                date:
                    formatAdminDate(
                        issue.createdAt
                    )

            });

        }


        if (
            issue.status === "Solved"
        ) {

            notifications.push({

                type: "solved",

                title:
                    "Issue Resolved",

                message:
                    `${issue.issueId || "Issue"} has been marked as solved.`,

                date:
                    formatAdminDate(
                        issue.createdAt
                    )

            });

        }

    }
);


if (badge) {

    badge.textContent =
        notifications.length;

}


if (
    notifications.length === 0
) {

    container.innerHTML = `

        <div class="empty-notifications">

            <div class="empty-icon">
                🔔
            </div>

            <h3>
                No notifications
            </h3>

            <p>
                You are all caught up.
            </p>

        </div>

    `;

    return;

}


container.innerHTML =
    notifications
        .map(
            notification => `

                <div class="notification-item">

                    <div class="notification-icon">

                        ${
                            notification.type === "pending"
                                ? "🟡"
                                : notification.type === "progress"
                                    ? "🔵"
                                    : "🟢"
                        }

                    </div>


                    <div class="notification-content">

                        <h4>
                            ${escapeHTML(notification.title)}
                        </h4>

                        <p>
                            ${escapeHTML(notification.message)}
                        </p>

                        <small>
                            ${notification.date}
                        </small>

                    </div>

                </div>

            `
        )
        .join("");


}

/* =====================================================
CLEAR NOTIFICATIONS
===================================================== */

function clearNotifications() {


const container =
    document.getElementById(
        "notificationList"
    );


const badge =
    document.getElementById(
        "notificationBadge"
    );


if (container) {

    container.innerHTML = `

        <div class="empty-notifications">

            <div class="empty-icon">
                ✓
            </div>

            <h3>
                All notifications read
            </h3>

            <p>
                You have no unread notifications.
            </p>

        </div>

    `;

}


if (badge) {

    badge.textContent = "0";

}


}

/* =====================================================
SECTION NAVIGATION
===================================================== */

function openSection(sectionId) {


window.location.hash =
    sectionId;

showSection(
    sectionId
);


}

function showSection(sectionId) {


const modules =
    document.querySelectorAll(
        ".admin-module"
    );


modules.forEach(
    module => {

        module.style.display =
            "none";

    }
);


const selected =
    document.getElementById(
        sectionId
    );


if (selected) {

    selected.style.display =
        "block";

}


const links =
    document.querySelectorAll(
        ".sidebar-link"
    );


links.forEach(
    link => {

        link.classList.remove(
            "active"
        );


        if (
            link.dataset.section ===
            sectionId
        ) {

            link.classList.add(
                "active"
            );

        }

    }
);


/* ---------------------------------------------
   SECTION-SPECIFIC LOAD
--------------------------------------------- */

if (
    sectionId === "analytics"
) {

    loadAnalytics();

}


if (
    sectionId === "map"
) {

    setTimeout(
        () => {

            loadIssueMap();

        },
        100
    );

}


if (
    sectionId === "notifications"
) {

    loadNotifications();

}


}

/* =====================================================
NAVIGATION INITIALIZATION
===================================================== */

function initializeAdminNavigation() {


const links =
    document.querySelectorAll(
        ".sidebar-link"
    );


links.forEach(
    link => {

        link.addEventListener(
            "click",
            event => {

                event.preventDefault();


                const section =
                    link.dataset.section;


                openSection(
                    section
                );

            }
        );

    }
);


let initialSection =
    window.location.hash
        .replace("#", "");


const validSections = [

    "dashboard",
    "issues",
    "analytics",
    "map",
    "notifications"

];


if (
    !validSections.includes(
        initialSection
    )
) {

    initialSection =
        "dashboard";

}


showSection(
    initialSection
);


}

/* =====================================================
SEARCH/FILTER LISTENERS
===================================================== */

function initializeFilters() {


const search =
    document.getElementById(
        "adminSearch"
    );


const status =
    document.getElementById(
        "adminStatusFilter"
    );


const category =
    document.getElementById(
        "adminCategoryFilter"
    );


if (search) {

    search.addEventListener(
        "input",
        filterAdminIssues
    );

}


if (status) {

    status.addEventListener(
        "change",
        filterAdminIssues
    );

}


if (category) {

    category.addEventListener(
        "change",
        filterAdminIssues
    );

}


const mapCategory =
    document.getElementById(
        "mapCategoryFilter"
    );


const mapStatus =
    document.getElementById(
        "mapStatusFilter"
    );


if (mapCategory) {

    mapCategory.addEventListener(
        "change",
        loadIssueMap
    );

}


if (mapStatus) {

    mapStatus.addEventListener(
        "change",
        loadIssueMap
    );

}


}

/* =====================================================
HTML ESCAPE
===================================================== */

function escapeHTML(value) {


return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");


}

/* =====================================================
LOGOUT
===================================================== */

function adminLogout() {


localStorage.removeItem(
    "token"
);


localStorage.removeItem(
    "user"
);


localStorage.removeItem(
    "userName"
);


window.location.href =
    "admin-login.html";


}

/* =====================================================
ADMIN NAME
===================================================== */

function loadAdminName() {


const element =
    document.getElementById(
        "adminName"
    );


if (!element) {

    return;

}


const userName =
    localStorage.getItem(
        "userName"
    );


const user =
    localStorage.getItem(
        "user"
    );


if (userName) {

    element.textContent =
        userName;

    return;

}


if (user) {

    try {

        const userData =
            JSON.parse(user);


        element.textContent =
            userData.name ||
            userData.username ||
            "Administrator";

    } catch {

        element.textContent =
            "Administrator";

    }

}


}

/* =====================================================
INITIALIZATION
===================================================== */

document.addEventListener(
"DOMContentLoaded",
function() {


    initializeAdminNavigation();

    initializeFilters();

    loadAdminName();

    fetchAdminIssues();

}


);
