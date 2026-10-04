const API_BASE_URL =
    "https://gubq20u4di.execute-api.ap-south-1.amazonaws.com/auth";


/* =========================================================
   COMMON LOGIN FUNCTION
========================================================= */

/* =========================================================
   CLIENT REGISTRATION
========================================================= */

const registerForm =
    document.getElementById("registerForm");


if (registerForm) {

    registerForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            /* ------------------------------------------------
               GET FORM VALUES
            ------------------------------------------------ */

            const name =
                document.getElementById("name")
                    .value
                    .trim();


            const email =
                document.getElementById("registerEmail")
                    .value
                    .trim();


            const password =
                document.getElementById("registerPassword")
                    .value;


            const confirmPassword =
                document.getElementById("confirmPassword")
                    .value;


            const message =
                document.getElementById("registerMessage");


            /* ------------------------------------------------
               RESET MESSAGE
            ------------------------------------------------ */

            message.textContent = "";
            message.className = "message";


            /* ------------------------------------------------
               VALIDATION
            ------------------------------------------------ */

            if (
                !name ||
                !email ||
                !password ||
                !confirmPassword
            ) {

                message.textContent =
                    "Please fill in all fields.";

                message.classList.add("error");

                return;
            }


            if (password.length < 6) {

                message.textContent =
                    "Password must be at least 6 characters.";

                message.classList.add("error");

                return;
            }


            if (password !== confirmPassword) {

                message.textContent =
                    "Passwords do not match.";

                message.classList.add("error");

                return;
            }


            /* ------------------------------------------------
               SEND REGISTRATION REQUEST
            ------------------------------------------------ */

            try {

                message.textContent =
                    "Creating account...";

                message.classList.add("info");


                const response =
                    await fetch(
                        `${API_BASE_URL}/register`,
                        {
                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "application/json"
                            },

                            body: JSON.stringify({
                                name: name,
                                email: email,
                                password: password
                            })
                        }
                    );


                /* ------------------------------------------------
                   SAFE RESPONSE PARSING
                ------------------------------------------------ */

                let result;

                try {

                    result =
                        await response.json();

                } catch (jsonError) {

                    console.error(
                        "Invalid registration response:",
                        jsonError
                    );

                    message.textContent =
                        "Invalid response received from server.";

                    message.className =
                        "message error";

                    return;
                }


                console.log(
                    "Registration API response:",
                    result
                );


                /* ------------------------------------------------
                   API ERROR
                ------------------------------------------------ */

                if (!response.ok) {

                    message.textContent =
                        result.error ||
                        result.message ||
                        "Registration failed.";

                    message.className =
                        "message error";

                    return;
                }


                /* ------------------------------------------------
                   SUCCESS
                ------------------------------------------------ */

                message.textContent =
                    result.message ||
                    "Account created successfully.";

                message.className =
                    "message success";


                /* ------------------------------------------------
                   REDIRECT TO LOGIN
                ------------------------------------------------ */

                setTimeout(
                    function () {

                        window.location.href =
                            "login.html";

                    },
                    1500
                );

            }


            catch (error) {

                console.error(
                    "Registration error:",
                    error
                );

                message.textContent =
                    "Unable to connect to the server.";

                message.className =
                    "message error";
            }

        }
    );
}

async function performLogin(email, password, message, expectedRole = null) {

    message.textContent = "";
    message.className = "message";


    /* -------------------------------------------------------
       FRONTEND VALIDATION
    ------------------------------------------------------- */

    if (!email || !password) {

        message.textContent =
            "Email and password are required.";

        message.classList.add("error");

        return;
    }


    try {

        /* ---------------------------------------------------
           API REQUEST
        --------------------------------------------------- */

        const response = await fetch(
            `${API_BASE_URL}/login`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    email: email,
                    password: password
                })
            }
        );


        /* ---------------------------------------------------
           PARSE RESPONSE SAFELY
        --------------------------------------------------- */

        let result;

        try {

            result = await response.json();

        } catch (jsonError) {

            console.error(
                "Invalid JSON response:",
                jsonError
            );

            message.textContent =
                "Invalid response received from server.";

            message.classList.add("error");

            return;
        }


        console.log("Login API response:", result);


        /* ---------------------------------------------------
           API ERROR
        --------------------------------------------------- */

        if (!response.ok) {

            message.textContent =
                result.error ||
                result.message ||
                "Login failed.";

            message.classList.add("error");

            return;
        }


        /* ---------------------------------------------------
           TOKEN CHECK
        --------------------------------------------------- */

        if (!result.token) {

            message.textContent =
                "Login succeeded but token was not returned.";

            message.classList.add("error");

            console.error(
                "Missing token:",
                result
            );

            return;
        }


        /* ---------------------------------------------------
           ROLE CHECK
        --------------------------------------------------- */

        if (!result.role) {

            message.textContent =
                "Login succeeded but user role was not returned.";

            message.classList.add("error");

            console.error(
                "Missing role:",
                result
            );

            return;
        }


        /* ---------------------------------------------------
           NORMALIZE ROLE
        --------------------------------------------------- */

        const role =
            String(result.role)
                .trim()
                .toUpperCase();


        console.log("User role:", role);


        /* ---------------------------------------------------
           ADMIN PAGE ROLE PROTECTION
        --------------------------------------------------- */

        if (
            expectedRole &&
            role !== expectedRole.toUpperCase()
        ) {

            message.textContent =
                "Access denied. This login is only for " +
                expectedRole +
                " users.";

            message.classList.add("error");

            console.error(
                "Incorrect role:",
                role
            );

            return;
        }


        /* ---------------------------------------------------
           CREATE USER OBJECT
        --------------------------------------------------- */

        const user = {

            userId: result.userId,

            name: result.name,

            email: result.email,

            role: role
        };


        /* ---------------------------------------------------
           STORE JWT
        --------------------------------------------------- */

        localStorage.setItem(
            "token",
            result.token
        );


        /* ---------------------------------------------------
           STORE USER
        --------------------------------------------------- */

        localStorage.setItem(
            "user",
            JSON.stringify(user)
        );


        console.log(
            "Logged-in user:",
            user
        );


        /* ===================================================
           ADMIN REDIRECT
        =================================================== */

        if (role === "ADMIN") {

            window.location.href =
                "admin-dashboard.html";

            return;
        }


        /* ===================================================
           CLIENT REDIRECT
        =================================================== */

        if (role === "CLIENT") {

            window.location.href =
                "client-dashboard.html";

            return;
        }


        /* ---------------------------------------------------
           UNKNOWN ROLE
        --------------------------------------------------- */

        console.error(
            "Unknown user role:",
            role
        );

        message.textContent =
            "Invalid user role.";

        message.classList.add("error");

        localStorage.removeItem("token");

        localStorage.removeItem("user");

    }


    catch (error) {

        console.error(
            "Login error:",
            error
        );

        message.textContent =
            "Unable to connect to the server.";

        message.classList.add("error");
    }
}


/* =========================================================
   CLIENT LOGIN
========================================================= */

const loginForm =
    document.getElementById("loginForm");


if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const email =
                document.getElementById("email")
                    .value
                    .trim();


            const password =
                document.getElementById("password")
                    .value;


            const message =
                document.getElementById("loginMessage");


            await performLogin(
                email,
                password,
                message
            );

        }
    );
}


/* =========================================================
   ADMIN LOGIN
========================================================= */

const adminLoginForm =
    document.getElementById("adminLoginForm");


if (adminLoginForm) {

    adminLoginForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            const email =
                document.getElementById("adminEmail")
                    .value
                    .trim();


            const password =
                document.getElementById("adminPassword")
                    .value;


            const message =
                document.getElementById(
                    "adminLoginMessage"
                );


            await performLogin(
                email,
                password,
                message,
                "ADMIN"
            );

        }
    );
}


/* =========================================================
   PASSWORD VISIBILITY
========================================================= */

function togglePassword() {

    let passwordInput =
        document.getElementById("password");


    /* -----------------------------------------------
       If client password doesn't exist,
       try admin password.
    ------------------------------------------------ */

    if (!passwordInput) {

        passwordInput =
            document.getElementById(
                "adminPassword"
            );
    }


    if (!passwordInput) {
        return;
    }


    if (passwordInput.type === "password") {

        passwordInput.type = "text";

    } else {

        passwordInput.type = "password";
    }
}

