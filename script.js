/*
        =========================================
        1. MAIN DATA
        =========================================

        All problems are stored in this array.

        Example:
        problems = [
            {
                id: "4A",
                name: "Watermelon",
                rating: 800,
                tags: ["math"],
                status: "unsolved"
            }
        ]
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