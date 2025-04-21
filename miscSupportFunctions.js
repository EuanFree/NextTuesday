/** Next Tuesday
 *
 * (c) Euan Freeman 2025
 *
 * Module to hold miscellaneous client side functions required outside the core
 * project/resource management activities
 *
 */
/* Cookie Functions */


/**
 * Retrieves the value of a cookie by its name.
 *
 * @param {string} name - The name of the cookie to retrieve.
 * @return {string|null} The value of the cookie if found, otherwise null.
 */
function getCookie(name) {
    const cookies = document.cookie.split('; ');
    for (let i = 0; i < cookies.length; i++) {
        const [key, value] = cookies[i].split('=');
        if (key === name) {
            console.log(`Cookie "${name}" found with value "${value}"`);
            return value;
        }
    }
    return null;
}

// Utility function to set a cookie
/**
 * Sets a cookie with a specified name, value, and expiration period in days.
 *
 * @param {string} name - The name of the cookie to be set.
 * @param {string} value - The value to be stored in the cookie.
 * @param {number} days - The number of days before the cookie expires.
 * @return {void} This function does not return a value.
 */
function setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000)); // Days to milliseconds
    document.cookie = `${name}=${value};expires=${date.toUTCString()};path=/`;
    console.log(`Cookie "${name}" set to "${value}" for ${days} days.`);
    console.log(document.cookie);
    console.log(getCookie(name));
}


/**
 * Deletes a cookie by its name.
 *
 * @param {string} name - The name of the cookie to delete.
 * @return {void} This function does not return a value.
 */
function deleteCookie(name) {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/`;
    console.log(`Cookie "${name}" has been deleted.`);
}

/**
 * Calculates the rendered width of a given text string for a specific element's styles.
 *
 * @param {string} text The text string whose rendered width is to be measured.
 * @param {jQuery} element A jQuery-wrapped DOM element used to retrieve font-related styling.
 * @return {number} The rendered width of the text in pixels.
 */
function getTextWidth(text, element) {
    // Create a hidden clone with same styling
    const $temp = $('<span>')
        .css({
            position: 'absolute',
            visibility: 'hidden',
            whiteSpace: 'nowrap',
            fontFamily: element.css('fontFamily'),
            fontSize: element.css('fontSize'),
            fontWeight: element.css('fontWeight')
        })
        .text(text)
        .appendTo('body');

    // Get the width
    const width = $temp.width();

    // Remove the temporary element
    $temp.remove();

    return width;
}




// Example: Checking for an existing username cookie
// const storedUsername = getCookie('username');
// if (storedUsername) {
//     console.log(`Welcome back, ${storedUsername}`);
// } else {
//     // If there's no stored username, prompt for one
//     const username = prompt('Enter your username:');
//     if (username) {
//         setCookie('username', username, 30); // Store username for 30 days
//         console.log(`Username "${username}" saved in a cookie.`);
//     }
// }

// function initializeGanttWithProject() {
//     console.log("Initializing Gantt chart...");
//
//     const ge = new GanttMaster(); // GanttMaster object
//     let userID, project;
//
//     // Step 1: Get User ID
//     getMyUserID()
//         .then(uID => {
//             console.log("User ID fetched:", uID);
//             if (!uID) throw new Error("Invalid User ID");
//             userID = uID;
//
//             // Step 2: Load Project from Database
//             return ge.loadProjectFromDatabase(1, userID);
//         })
//         .then(fetchedProject => {
//             console.log("Project fetched:", fetchedProject);
//
//             if (!fetchedProject) throw new Error("Project not found or invalid.");
//             project = fetchedProject;
//
//             // Step 3: Load Tasks from PostgreSQL
//             return ge.loadTasksFromPostgreSQL(1);
//         })
//         .then(tasks => {
//             console.log("Tasks fetched:", tasks);
//
//             if (!tasks || !tasks.length) {
//                 throw new Error("No tasks found for the project.");
//             }
//
//             // Step 4: Find the #workSpace element in the DOM
//             const workSpaceElement = $("#workSpace");
//             if (workSpaceElement.length === 0) {
//                 throw new Error("Workspace element (#workSpace) not found in DOM.");
//             }
//             console.log("Workspace element found:", workSpaceElement);
//
//             // Step 5: Initialize Gantt editor
//             ge.init(workSpaceElement);
//             loadI18n(); // Load localization
//
//             // Update UI permissions
//             if (!project.canWrite) {
//                 $(".ganttButtonBar button.requireWrite").attr("disabled", "true");
//             }
//
//             ge.set100OnClose = true;
//             ge.shrinkParent = true;
//
//             // Load the fetched project and tasks into the editor
//             ge.loadProject(project);
//             ge.tasks = tasks; // Assign tasks from database
//             ge.checkpoint(); // Reset undo stack
//
//             console.log("Gantt editor initialized successfully.");
//         })
//         .catch(error => {
//             // Log encountered errors
//             console.error("Error during Gantt initialization:", error);
//         });




