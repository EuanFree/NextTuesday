/* Client side functions to communicate with the seaview database via http server
    EF 18/0/25
    
    (c) 2025
 */

const server = "http://localhost:3000";



/**
 * Asynchronously fetches the maximum task change ID from the server.
 *
 * This function sends a GET request to the `/maxTaskChangeId` endpoint of the server
 * to retrieve the maximum task change ID. The response is expected to be in JSON format,
 * containing a `rows` field. If successful, it resolves with the rows containing the ID.
 * In case of an error, it logs the error and returns -1.
 *
 * @async
 * @function getMaxTaskChangeId
 * @returns {Promise<Array|number>} A promise resolving to the rows containing the maximum task change ID,
 * or -1 if an error occurs.
 */
const getMaxTaskChangeId = async () => {
    try {
        const response = await fetch(`${server}/maxTaskChangeId`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const json = await response.json();
        console.log("Max Task Change ID: ", json);
        const rows = json.rows;
        return rows;
    } catch (error) {
        console.error(`Error fetching max task change ID:`, error);
        return -1;
    }
}

/**
 * Asynchronously fetches the list of portfolios from the server.
 *
 * This function sends a GET request to the `/portfolioList` endpoint to retrieve
 * the list of portfolios. If successful, it resolves with the rows containing the portfolio data.
 * In case of an error, an appropriate error is logged.
 *
 * @async
 * @function getPortfolioListFromServer
 * @returns {Promise<Array|undefined>} A promise resolving to the rows containing portfolios,
 * or undefined if an error occurs.
 */
const getPortfolioListFromServer = async() => {
    try {
        console.log('Fetching portfolio list from server...');
        const response = await fetch(`${server}/portfolioList`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const json = await response.json();
        const rows = json.rows;
        console.log("Rows: ");
        console.log(rows);
        return rows;
    } catch (error) {
        console.error('Error fetching portfolio list:', error);
    }
}

/**
 * Fetches portfolio contents from the server based on the given portfolio ID.
 *
 * @param {string} portfolioId - The ID of the portfolio whose contents need to be retrieved.
 * @return {Promise<Object[]|undefined>} A promise that resolves to an array of portfolio content rows if successful,
 * or undefined in case of an error.
 */
const getPortfolioContentsFromServer = async(portfolioId) => {
    try {
        console.log(`Fetching contents for portfolio ID: ${portfolioId}...`);
        const response = await fetch(`${server}/portfolioContents?portfolioId=${portfolioId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const json = await response.json();
        console.log("Portfolio Contents: ", json);
        const rows = json.rows;
        console.log("Rows: ");
        console.log(rows);
        return rows;
    } catch (error) {
        console.error(`Error fetching portfolio contents for ID ${portfolioId}:`, error);
    }
}

/**
 * Fetches tasks related to a specific project from the server.
 *
 * @param {string} projectId - The unique identifier of the project for which tasks need to be fetched.
 * @param {boolean} activeOnly - A flag indicating whether to fetch only active tasks (true) or all tasks (false) for the project.
 * @return {Promise<Array>} A promise that resolves to an array of tasks for the given project. Returns an empty array if no tasks are available or an error occurs.
 */
const getProjectTasksFromServer = async(projectId, activeOnly) => {
    try {
        console.log(`Fetching tasks for project ID: ${projectId}...`);
        const response = await fetch(`${server}/projectTasks?projectId=${projectId}&activeOnly=${activeOnly}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const json = await response.json();
        console.log("Project Tasks: ", json);
        return json;
    } catch (error) {
        console.error(`Error fetching tasks for project ID ${projectId}:`, error);
    }
}

/**
 * Adds a blank task to a specific project on the server.
 *
 * This function sends a GET request to the `/addBlankTaskToProject` endpoint, passing the project ID as a query parameter.
 * If successful, it logs and returns the rows containing the task data associated with the project.
 * In case of an error, it logs an appropriate error message.
 *
 * @async
 * @function addBlankTaskToProject
 * @param {string} projectId - The ID of the project to which a blank task will be added.
 * @returns {Promise<Array|undefined>} A promise that resolves to an array of task rows if successful,
 * or undefined if an error occurs.
 */
const addBlankTaskToProject = async (projectId) => {
    try {
        const response = await fetch(`${server}/addBlankTaskToProject?projectId=${projectId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const json = await response.json();
        console.log("Project Tasks: ", json);
        const rows = json.rows;
        return rows;
    } catch (error) {
        console.error(`Error adding task to project ${projectId}:`, error);
    }
};

/**
 * Asynchronously fetches the username from a server endpoint.
 *
 * This function makes a GET request to `http://localhost:3000/getUsername`
 * to fetch the username. It handles HTTP errors and logs any errors encountered
 * during the fetch operation.
 *
 * @returns {Promise<Object | undefined>} A promise that resolves to the response
 * data as a JSON object if the request is successful, or undefined if an error occurs.
 */
const getUsername = async () => {
    try {
        const response = await fetch(`${server}/getUsername`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Error getting username:`, error);
    }
};

/**
 * Asynchronously fetches the user ID from a server endpoint.
 *
 * This function makes a GET request to `http://localhost:3000/getUserID`
 * to fetch the user ID as JSON. It handles HTTP errors and logs any errors encountered
 * during the fetch operation.
 *
 * @async
 * @function getUserID
 * @returns {Promise<Object | undefined>} A promise that resolves to the response
 * data as a JSON object if the request is successful, or undefined if an error occurs.
 */
const getUserID = async () => {
    try {
        const response = await fetch(`${server}/getUserID`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Error getting user ID:`, error);
    }
};

/**
 * Fetches a task by its ID from the server.
 *
 * @param {number|string} taskId - The ID of the task to be fetched.
 * @returns {Promise<Object | undefined>} A promise that resolves to the task object if the request is successful, or undefined if an error occurs.
 */
const getTaskById = async (taskId) => {
    try {
        if (!taskId) {
            throw new Error("Task ID must be provided.");
        }
        const response = await fetch(`${server}/getTask?taskId=${taskId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const task = await response.json();
        console.log("Fetched task:", task);
        return task;
    } catch (error) {
        console.error(`Error fetching task with ID ${taskId}:`, error);
    }
};


/**
 * An asynchronous function that logs and sends task changes for audit purposes.
 * This function prepares the details of a task's changes, logs them, and sends
 * the data to a server endpoint for further recording.
 *
 * @param {string} taskId - The unique identifier of the task being modified.
 * @param {Object} task - The updated task data containing changes made to the task.
 * @returns {Promise<Object|undefined>} A promise that resolves with the response
 * from the server if the task change is recorded successfully, or undefined in case of an error.
 *
 * @throws {Error} Will throw an error if:
 * - User ID cannot be retrieved for audit logging.
 * - Task data for the specified task ID cannot be fetched for comparison.
 * - The server request fails or returns a non-OK status.
 */
const addTaskChange = async (taskId, task) => {
    try {


        // Prepare task change details for audit logging
        const taskChangeDetails = async () => {
            try {
                console.log("Preparing task change details...");
                const userIDData = await getUserID();
                if (!userIDData) {
                    throw new Error("Failed to fetch the user ID for audit logging.");
                }

                const changedBy = userIDData.userId; // Assuming `userId` is the field in the response
                const currentTaskData = await getTaskById(taskId);
                if (!currentTaskData) {
                    throw new Error(`Failed to fetch task with ID ${taskId} for audit logging.`);
                }

                const oldValues = Object.keys(task).reduce((result, key) => {
                    if (currentTaskData.hasOwnProperty(key)) {
                        result[key] = currentTaskData[key];
                    }
                    return result;
                }, {});
                const newValues = task;
                console.log("Task change details:");
                console.log("Task ID:", taskId);
                console.log("Changed by:", changedBy);
                console.log("Old values:", oldValues);
                console.log("New values:", newValues);

                return {
                    taskId,
                    changedBy,
                    oldValues,
                    newValues,
                    timestamp: new Date().toISOString() // Adding a timestamp for logging purposes
                };
            } catch (error) {
                console.error("Error logging task change:", error);
            }
        };

        // Call the taskChangeDetails function to log the change
        const tcd = await taskChangeDetails();

        console.log('Sending task change details to server:', tcd);

        const response = await fetch(`${server}/addTaskChange`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(tcd),
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const json = await response.json();
        console.log('Task change successfully recorded:', json);
        return json;
    } catch (error) {
        console.error('Error sending task change:', error);
    }
};


/**
 * Asynchronously updates a task by sending a POST request to the server.
 *
 * This function performs two main operations:
 * 1. Sends a POST request to update a task on the server.
 * 2. Logs the task changes for audit purposes by invoking `addTaskChange`.
 *
 * @param {string} taskId - The unique identifier of the task to be updated.
 * @param {Object} task - The task object containing the updated properties.
 * @returns {Promise<Object>} A promise that resolves to an object containing:
 * - `updateSuccess` (boolean): Indicates if the task was successfully updated.
 * - `changeLogSuccess` (boolean): Indicates if the task change was successfully logged.
 * @throws {Error} Throws an error if the HTTP response for the update is not successful or if an exception occurs during the update or logging process.
 */
const updateTask = async (taskId, task) => {

    let updateSuccess = false;
    let changeLogSuccess = false;

    // Update the task
    try {
        console.log("Updating task: ", task);
        const response = await fetch(`${server}/updateTask?taskId=${taskId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(task)
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        updateSuccess = true; // Mark update as successful
    } catch (error) {
        console.error(`Error updating task ${taskId}:`, error);
    }

    // Logging and adding task change for audit purposes
    try {
        const auditResponse = await addTaskChange(taskId, task);
        if (auditResponse) {
            changeLogSuccess = true; // Mark task change log as successful if the response is valid
        }
    } catch (error) {
        console.error(`Error adding task change for ${taskId}:`, error);
    }

    // Return success status for both operations
    return {updateSuccess, changeLogSuccess};
};

const getEnumerationTable = async (typeName) => {
    try{
        const response = await fetch(`${server}/getEnumerationTable?typeName=${typeName}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const json = await response.json();
        console.log("Enumeration table: ", json);
        // const rows = json.rows;
        // return rows;
        return json;
    }
    catch(error)
    {
        console.error(`Error fetching enumeration table for ${typeName}:`, error);
    }
}

const getProjectJSON = async (projectId, userId) => {
    try{
        console.log("Fetching project JSON for project ID: ", projectId);
        console.log("Fetching project JSON for user ID: ", userId);
        const response = await fetch(`${server}/getProjectJSON?projectId=${projectId}&userId=${userId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const json = await response.json();
        console.log("Project JSON: ", json);

        return json;
    }
    catch(error)
    {
        console.error(`Error fetching project JSON for ${projectId}:`, error);
    }
}

const getResourcesList = async () => {
    try{
        const response = await fetch(`${server}/getResourcesList`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const json = await response.json();
        console.log("Resources list: ", json);
        return json;
    }catch(error)
    {
        console.error(`Error fetching resources list:`, error);
    }
}

const getProjectTaskUserSetup = async (taskID) => {
    try{
        const response = await fetch(`${server}/getProjectTaskUserSetup?taskId=${taskID}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const json = await response.json();
        // console.log("Project task user setup: ", json);
        return json;
    }catch(error){
        console.error(`Error fetching project task user setup:`, error);
    }
}

const getTaskAncestorCount = async (taskId) => {
    try{
        const response = await fetch(`${server}/countTaskAncestors?taskId=${taskId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const json = await response.json();
        // console.log("Task ancestor count: ", json);
        return json;
    }catch (error){
        console.error(`Error fetching task ancestor count:`, error);
    }
}

const getMyUserID = async () => {
    try{
        const response = await fetch(`${server}/getMyUserID`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const json = await response.json();
        console.log("My ID: ", json);
        return json;
    }
    catch(error){
        console.error(`Error fetching my ID:`, error);
    }
}