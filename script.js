/*
        =========================================
        1. MAIN DATA
        =========================================
    */

let problems = [];


/*
        =========================================
        2. HELPER FUNCTION
        =========================================
    */

// Convert seconds into MM:SS format
function formatTime(seconds) {

    let minutes = Math.floor(seconds / 60);
    let remainingSeconds = seconds % 60;

    return String(minutes).padStart(2, "0") +
           ":" +
           String(remainingSeconds).padStart(2, "0");
}


// Show a message to the user
function showMessage(text, type) {

    let message = document.getElementById("message");

    message.textContent = text;
    message.style.display = "block";

    if (type === "success") {
        message.style.background = "#d4edda";
        message.style.color = "#155724";
    } else {
        message.style.background = "#f8d7da";
        message.style.color = "#721c24";
    }

    setTimeout(function () {
        message.style.display = "none";
    }, 3000);
}


/*
        =========================================
        3. FETCH PROBLEM FROM CODEFORCES
        =========================================
    */

async function fetchProblem() {

    let input = document.getElementById("problemId");
    let problemId = input.value.trim();

    if (problemId === "") {
        showMessage("Please enter a problem ID.", "error");
        return;
    }

    // Example: 4A
    // contestId = 4
    // index = A
    let contestId = problemId.replace(/[^0-9]/g, "");
    let index = problemId.replace(/[0-9]/g, "");

    if (contestId === "" || index === "") {
        showMessage("Use a format like 4A or 118A.", "error");
        return;
    }

    // Check duplicate problem
    let alreadyExists = problems.some(function(problem) {
        return problem.id === problemId;
    });

    if (alreadyExists) {
        showMessage("This problem is already added.", "error");
        return;
    }

    try {

        // Call Codeforces API
        let response = await fetch(
            "https://codeforces.com/api/problemset.problems"
        );

        if (!response.ok) {
            throw new Error("Could not connect to Codeforces.");
        }

        let data = await response.json();

        // Find the requested problem
        let foundProblem = data.result.problems.find(function(problem) {

            return problem.contestId == contestId &&
                   problem.index === index;
        });

        if (!foundProblem) {
            showMessage("Problem not found.", "error");
            return;
        }

        // Add the problem
        addProblem(foundProblem);

        input.value = "";

        showMessage("Problem added successfully!", "success");

    } catch (error) {

        showMessage(error.message, "error");
    }
}


/*
        =========================================
        4. ADD PROBLEM
        =========================================
    */

function addProblem(problem) {

    let newProblem = {

        id: problem.contestId + problem.index,

        contestId: problem.contestId,

        index: problem.index,

        name: problem.name,

        rating: problem.rating || "Unknown",

        tags: problem.tags || [],

        date: new Date().toLocaleDateString(),

        status: "unsolved",

        timeSpent: 0,

        timer: null,

        isRunning: false,

        solvedByMe: false
    };

    problems.push(newProblem);

    applyFilters();
    updateStatistics();
}


/*
        =========================================
        5. DISPLAY PROBLEMS
        =========================================
    */

function displayProblems(list) {

    let container = document.getElementById("problemContainer");

    container.innerHTML = "";

    if (list.length === 0) {

        container.innerHTML =
            '<p style="padding:20px;text-align:center;">' +
            'No problems found.' +
            '</p>';

        return;
    }

    list.forEach(function(problem) {

        let row = document.createElement("div");

        row.className = "problem-row";

        let topicText = "Solve to reveal topics";

        if (problem.status === "solved") {
            topicText = problem.tags.join(", ");
        }

        row.innerHTML = `

            <div class="problem-id">

                <a href="https://codeforces.com/problemset/problem/${problem.contestId}/${problem.index}"
                   target="_blank">

                    ${problem.id}

                </a>

            </div>


            <div>
                ${problem.name}
            </div>


            <div class="topic ${
                problem.status !== "solved"
                    ? "hidden-topic"
                    : ""
            }">

                ${topicText}

            </div>


            <div class="rating">

                ${problem.rating}

            </div>


            <div>

                ${problem.date}

            </div>


            <div>

                <select class="status"
                        onchange="changeStatus('${problem.id}', this.value)">

                    <option value="unsolved"
                        ${problem.status === "unsolved"
                            ? "selected"
                            : ""}>

                        Unsolved

                    </option>


                    <option value="attempted"
                        ${problem.status === "attempted"
                            ? "selected"
                            : ""}>

                        Attempted

                    </option>


                    <option value="solved"
                        ${problem.status === "solved"
                            ? "selected"
                            : ""}>

                        Solved

                    </option>

                </select>

            </div>


            <div>

                <div class="time" id="time-${problem.id}">

                    ${formatTime(problem.timeSpent)}

                </div>


                <div class="timer-buttons">

                    <button class="start"
                            onclick="startTimer('${problem.id}')">

                        Start

                    </button>


                    <button class="stop"
                            onclick="stopTimer('${problem.id}')">

                        Stop

                    </button>


                    <button class="reset"
                            onclick="resetTimer('${problem.id}')">

                        Reset

                    </button>

                </div>

            </div>


            <div class="solved-check">

                <input type="checkbox"
                       ${problem.solvedByMe ? "checked" : ""}
                       ${problem.status !== "solved" ? "disabled" : ""}
                       onchange="changeSolvedByMe('${problem.id}', this.checked)">

            </div>


            <div>

                <button class="delete"
                        onclick="deleteProblem('${problem.id}')">

                    Delete

                </button>

            </div>

        `;

        container.appendChild(row);
    });
}


/*
        =========================================
        7. SOLVED BY ME
        =========================================
    */

function changeSolvedByMe(problemId, value) {

    let problem = problems.find(function(problem) {
        return problem.id === problemId;
    });

    if (problem) {
        problem.solvedByMe = value;
    }

    applyFilters();
}



/*
        =========================================
        8. TIMER
        =========================================
    */

function startTimer(problemId) {

    let problem = problems.find(function(problem) {
        return problem.id === problemId;
    });

    if (!problem || problem.isRunning) {
        return;
    }

    problem.isRunning = true;

    problem.timer = setInterval(function() {

        problem.timeSpent++;

        let timeElement =
            document.getElementById("time-" + problemId);

        if (timeElement) {
            timeElement.textContent =
                formatTime(problem.timeSpent);
        }

        // Update only the dashboard.
        // Do not re-render the filtered problem list every second.
        updateStatistics(getVisibleProblems());

    }, 1000);
}


function stopTimer(problemId) {

    let problem = problems.find(function(problem) {
        return problem.id === problemId;
    });

    if (!problem) {
        return;
    }

    clearInterval(problem.timer);

    problem.timer = null;
    problem.isRunning = false;

    updateStatistics(getVisibleProblems());
}


function resetTimer(problemId) {

    let problem = problems.find(function(problem) {
        return problem.id === problemId;
    });

    if (!problem) {
        return;
    }

    stopTimer(problemId);

    problem.timeSpent = 0;

    let timeElement =
        document.getElementById("time-" + problemId);

    if (timeElement) {
        timeElement.textContent = "00:00";
    }

    updateStatistics(getVisibleProblems());
}
/*
        =========================================
        9. FILTER AND SEARCH
        =========================================
    */

// Return the problems that are currently visible
// according to the active filters.
function getVisibleProblems() {

    let status =
        document.getElementById("statusFilter").value;

    let rating =
        document.getElementById("ratingFilter").value;

    let solved =
        document.getElementById("solvedFilter").value;

    let search =
        document.getElementById("searchInput").value.toLowerCase();


    return problems.filter(function(problem) {

        // Status filter
        if (status !== "all" &&
            problem.status !== status) {

            return false;
        }


        // Rating filter
        if (rating !== "all") {

            // 1600 means 1600+
            if (rating === "1600") {

                if (problem.rating < 1600) {
                    return false;
                }

            } else {

                if (problem.rating != Number(rating)) {
                    return false;
                }
            }
        }


        // Solved by me filter
        if (solved === "yes" &&
            !problem.solvedByMe) {

            return false;
        }


        if (solved === "no" &&
            problem.solvedByMe) {

            return false;
        }


        // Search filter
        if (search !== "") {

            let id =
                problem.id.toLowerCase();

            let name =
                problem.name.toLowerCase();


            if (!id.includes(search) &&
                !name.includes(search)) {

                return false;
            }
        }


        return true;
    });
}


/*
        =========================================
        APPLY FILTERS
        =========================================
    */

function applyFilters() {

    let filtered =
        getVisibleProblems();


    // Display filtered problems
    displayProblems(filtered);


    // Dashboard shows statistics
    // for the currently visible problems.
    updateStatistics(filtered);
}


/*
        =========================================
        RESET FILTERS
        =========================================
    */

function resetFilters() {

    document.getElementById("statusFilter").value =
        "all";

    document.getElementById("ratingFilter").value =
        "all";

    document.getElementById("solvedFilter").value =
        "all";

    document.getElementById("searchInput").value =
        "";


    applyFilters();
}