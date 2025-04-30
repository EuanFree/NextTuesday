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
        // console.log("Rows: ");
        // console.log(rows);
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
        // console.log(`Fetching contents for portfolio ID: ${portfolioId}...`);
        const response = await fetch(`${server}/portfolioContents?portfolioId=${portfolioId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const rows = await response.json();
        // console.log("Portfolio Contents: ", rows);
        return rows;
    } catch (error) {
        console.error(`Error fetching portfolio contents for ID ${portfolioId}:`, error);
    }
}

const getProgrammeContentsFromServer = async(programmeId) => {
    try {
        // console.log(`Fetching contents for programme ID: ${programmeId}...`);
        const response = await fetch(`${server}/programmeContents?programmeId=${programmeId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const json = await response.json();
        // console.log("Programme Contents: ", json);
        return json;
    } catch (error) {
        console.error(`Error fetching programme contents for ID ${programmeId}:`, error);
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
 * Fetches the resource ID for a given username from the server.
 *
 * @async
 * @function getResourceIdByUsername
 * @param {string} username - The username for which the resource ID needs to be fetched.
 * @returns {Promise<string|undefined>} Resolves with the resource ID if successful, or undefined if an error occurs.
 */
const getResourceIdByUsername = async (username) => {
    try {
        if (!username) {
            throw new Error("Username must be provided.");
        }

        const response = await fetch(`${server}/getResourceIdByUsername?username=${username}`);
        console.log("Fetching resource ID for username:", username);
        console.log("Response:", response);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        console.log("Response data:", data);
        return data;
    } catch (error) {
        console.error(`Error fetching resource ID for username "${username}":`, error);
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
    }
    catch(error)
    {
        console.error(`Error fetching task with ID ${taskId}:`, error);
    }
};

/**
 * Logs details of a task change and sends the information to the server for audit purposes.
 *
 * @function addTaskChange
 * @async
 * @param {string} userId - The ID of the user making the change to the task.
 * @param {string} taskId - The ID of the task being changed.
 * @param {Object} task - An object containing updated task details.
 * @returns {Promise<Object|undefined>} Resolves with the server's response after successfully recording the task change, or undefined if an error occurs.
 * @throws {Error} Throws an error if the server returns a non-OK status or if there are issues fetching or processing task change details.
 */
const addTaskChange = async (userId, task) => {
    try {


        // Prepare task change details for audit logging
        const taskChangeDetails = async () => {
            try {
                console.log("Preparing task change details...");
                // const userIDData = await getUserID();
                // if (!userIDData) {
                //     throw new Error("Failed to fetch the user ID for audit logging.");
                // }
                
                const taskMaster = task.master;
                const changedBy = userId; // Assuming `userId` is the field in the response
                // const currentTaskData = await getTaskById(taskId);
                const currentTaskData =
                    await fetch(`${server}/getCombinedTaskDetails?taskId=${task.id}&&userId=${userId}&activeOnly=true`);
                if (!currentTaskData.ok) {
                    throw new Error(`Failed to fetch task with ID ${task.id} for audit logging.`);
                }
                const cTDJSON = await currentTaskData.json();
                console.log("Current task data:", cTDJSON);
                var factory = new TaskFactory();
                const t = factory.buildSimple(cTDJSON.rows[0].id,
                    cTDJSON.rows[0].title,
                    'misc',
                    cTDJSON.rows[0].hierarchy_level,
                    cTDJSON.rows[0].start_date,
                    cTDJSON.rows[0].duration,
                    cTDJSON.rows[0].collapsed)


                const dependencies = await getTaskDependencies(task.id);
                const taskResources = await getTaskResources(task.id);
                if(dependencies[0].successor_id !== -1) {
                    let deps = '';
                    for (let j = 0; j < dependencies.length; j++) {
                        deps += dependencies[j].predecessor_id +
                            (j === dependencies.length - 1 ? '' : ',');
                    }
                    t.depends = deps;
                }
                else
                {
                    t.depends = '';
                }

                t.assigs = [];
                if(taskResources.length > 0 && taskMaster.roles.length > 0)
                {
                    for(let j = 0; j < taskResources.length; j++)
                    {
                        const resourceID = taskResources[j].resource_id;
                        

                        // Look up the resource type from this.resources based on the taskResource id - 1
                        const resourceType = taskMaster.resources[resourceID - 1].resourceType;

                        if (resourceType)
                        {
                            // Search the this.roles array for a role matching the resource type
                            const role = taskMaster.roles.find(role => role.name === resourceType);

                            if (role)
                            {
                                const roleID = role.id;

                                const id = 'resId_' + resourceID + '_roleId_' + role.id;
                                const effort = t.duration * 3600000 * 24;
                                const assig = {resourceId: resourceID, id: id, roleId: roleID, effort: effort};
                                t.assigs.push(assig);
                            } else
                            {
                                console.warn(`No role found for resource type: ${resourceType}`);
                            }
                        } else
                        {
                            console.warn(`No resource type found for resource ID: ${resourceID}`);
                        }
                    }
                }


                const oldValues = {};
                const newValues = {};

                Object.keys(t).forEach(key => {
                    // Compare properties that exist in both old and new tasks
                    if (task.hasOwnProperty(key)) {

                        if(key==='assigs') {

                                const oldAssigs = t.assigs || [];
                                const newAssigs = task.assigs || [];

                                if (JSON.stringify(oldAssigs) !== JSON.stringify(newAssigs)) {
                                    oldValues[key] = oldAssigs;
                                    newValues[key] = newAssigs;
                                }
                        }
                        else {
                            if (t[key] !== task[key]) {
                                oldValues[key] = t[key];
                                newValues[key] = task[key];
                            }
                        }
                    }
                });

                // Collect properties that only exist in the new task
                Object.keys(task).forEach(key => {
                    if (!t.hasOwnProperty(key) && key !== 'ganttElement' && key !== 'master' && key !== 'rowElement') {
                        newValues[key] = task[key];
                    }
                });


                // Remove 'trackChanges' key from both oldValues and newValues if it exists
                if (oldValues.hasOwnProperty('trackChanges')) {
                    delete oldValues['trackChanges'];
                }
                if (newValues.hasOwnProperty('trackChanges')) {
                    delete newValues['trackChanges'];
                }

                console.log("Task change details:");
                console.log("Task ID:", task.id);
                console.log("Changed by:", changedBy);
                console.log("Old values:", oldValues);
                console.log("New values:", newValues);

                return {
                    taskId: task.id,
                    changedBy: changedBy,
                    oldValues: oldValues,
                    newValues: newValues
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
        return {changeSummary:tcd, serverResponse:json};
    } catch (error) {
        console.error('Error sending task change:', error);
    }
};


/**
 * Updates the dependencies of a specified task by sending a POST request to the server.
 *
 * @async
 * @param {Object} task - The task object containing the task id and its dependencies.
 * @param {string} task.id - The unique identifier of the task to be updated.
 * @param {Array} task.depends - An array of dependency identifiers associated with the task.
 * @returns {Promise<Object|undefined>} A promise resolving to the response JSON if the request is successful,
 * or undefined if an error occurs during the process.
 * @throws {Error} Throws an error if the server responds with a non-ok status.
 */
const updateTaskDependencies = async (task) => {
    try {
        const response = await fetch(`${server}/updateTaskDependencies`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({taskId: task.id, dependencies: task.depends})
        });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const json = await response.json();
        console.log("Task dependencies updated successfully:", json);
        return json;
    } catch (error) {
        console.error(`Error updating task dependencies for ${task.id}:`, error);
    }
};

/**
 * Updates the resources assigned to a specific task on the server.
 *
 * @param {Object} task - An object representing the task to be updated.
 * @param {string} task.id - The unique identifier of the task.
 * @param {Array} task.assigs - The list of resources to be assigned to the task.
 * @return {Promise<Object>} A promise that resolves to the server's response after updating the task resources.
 *                            If the fetch operation fails, the promise will reject with an error.
 */
const updateTaskResources = async (task) => {
    try {
        const response = await fetch(`${server}/updateTaskResourceAssociation`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({taskId: task.id, resources: task.assigs})
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const json = await response.json();
        console.log("Task resources updated successfully:", json);
        return json;
    } catch (error) {
        console.error(`Error updating task resources for ${task.id}:`, error);
    }
}

const updateTaskCollapsed = async (task, userId) => {
    try {
        if(!(typeof task.collapsed === 'boolean') || task.collapsed === null)
        {
            task.collapsed = false;
        }
        const response = await fetch(`${server}/updateTaskCollapsed?taskId=${task.id}&userId=${userId}&collapsed=${task.collapsed}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        // const json = await response.json();
        // console.log("Task collapsed updated successfully:", json);
        // return json;
        return true;
    } catch (error) {
        console.error(`Error updating task collapsed for ${task.id}:`, error);
    }
}


/**
 * Updates a task and logs the change for audit purposes.
 *
 * This method first attempts to log the change of a task for audit purposes.
 * It then proceeds to update the task itself. Both operations have independent
 * success states.
 *
 * @param {string} userId - The ID of the user making the update request.
 * @param {Object} task - The task object containing task details to be updated.
 * @return {Object} - An object containing the success statuses of both the update operation (`updateSuccess`)
 *                    and the change log operation (`changeLogSuccess`).
 */
const updateTask = async (userId, task) => {

    let updateSuccess = false;
    let changeLogSuccess = false;
    let changeSummary = {};
    // Track the change first
    // Logging and adding task change for audit purposes
    try {
        const auditResponse = await addTaskChange(userId, task);
        if (auditResponse) {
            changeLogSuccess = true; // Mark task change log as successful if the response is valid
            changeSummary = auditResponse.changeSummary;
            console.log("Task change logged successfully:", changeSummary);
        }
    } catch (error) {
        console.error(`Error adding task change for ${taskId}:`, error);
    }

    // Then Update the task
    try {
        console.log("Updating task: ", task);

        if(changeSummary.hasOwnProperty('newValues'))
        {
            if(changeSummary.newValues.hasOwnProperty('assigs'))
            {
                const utrResult =  await updateTaskResources(task);
                delete changeSummary.newValues.assigs;
            }
            if(changeSummary.newValues.hasOwnProperty('depends'))
            {
                const utdResult = await updateTaskDependencies(task);
                delete changeSummary.newValues.depends;
            }
            if(changeSummary.newValues.hasOwnProperty('collapsed'))
            {
                const utcResult = updateTaskCollapsed(task, userId);
                delete changeSummary.newValues.collapsed;
            }
            if(changeSummary.newValues.hasOwnProperty('start'))
            {

                const start_date = new Date(changeSummary.newValues.start).toISOString().replace('T', ' ').replace('Z', '');
                changeSummary.newValues.start = start_date;
            }
            if(changeSummary.newValues.hasOwnProperty('end'))
            {

                const end_date = new Date(changeSummary.newValues.end).toISOString().replace('T', ' ').replace('Z', '');
                changeSummary.newValues.end = end_date;
            }
            if(changeSummary.newValues.hasOwnProperty('trackChanges'))
            {
                delete changeSummary.newValues['trackChanges'];
            }
            
            let changeTxt = JSON.stringify(changeSummary.newValues);
            console.log("Change summary: ", changeTxt);
            changeTxt = changeTxt.replace(/"start":/g, '"start_date":').replace(/"end":/g, '"end_date":').replace(/"name":/g, '"title":');
            console.log("Change summary Edited: ", changeTxt);

            const response = await fetch(`${server}/updateTask?taskId=${task.id}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: changeTxt
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
        }
        updateSuccess = true; // Mark update as successful
    } catch (error) {
        console.error(`Error updating task ${task.id}:`, error);
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
        // console.log("Enumeration table: ", json);
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
        // console.log("Fetching project JSON for project ID: ", projectId);
        // console.log("Fetching project JSON for user ID: ", userId);
        const response = await fetch(`${server}/getProjectJSON?projectId=${projectId}&userId=${userId}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const json = await response.json();
        // console.log("Project JSON: ", json);

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
        // console.log("Resources list: ", json);
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

/**
 * Asynchronously retrieves the count of ancestor tasks for a specified task ID.
 *
 * This function sends a request to the server to fetch the number of ancestor tasks
 * associated with the given task ID. On a successful response, it returns the count
 * parsed from the server's JSON response. If an error occurs during the request or
 * the response is unsuccessful, an error is logged to the console.
 *
 * @param {string} taskId - The unique identifier of the task for which ancestor count is requested.
 * @returns {Promise<number | undefined>} A promise that resolves to the number of ancestor tasks
 * associated with the given task ID. If an error occurs, the function will log the error and may
 * return undefined.
 */
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

/**
 * Asynchronously retrieves the user ID of the current user by making a fetch request to the server endpoint.
 *
 * Sends a GET request to the predefined server URL to fetch the user ID in JSON format. Handles HTTP errors
 * and logs any issues that occur during the fetch attempt.
 *
 * @returns {Promise<Object|undefined>} A promise that resolves to the JSON response containing the user ID
 * if the request is successful. Returns `undefined` if an error occurs.
 */
const getMyUserID = async () => {
    try{
        const response = await fetch(`${server}/getMyUserID`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const json = await response.json();
        // console.log("My ID: ", json);
        return json;
    }
    catch(error){
        console.error(`Error fetching my ID:`, error);
    }
}

/**
 * Fetches combined project and task details based on the provided project ID, user ID, and active-only filter.
 *
 * @param {string} projectID - The unique identifier for the project.
 * @param {string} userID - The unique identifier for the user.
 * @param {boolean} activeOnly - Determines whether to fetch only active tasks.
 * @returns {Promise<Object>} A promise that resolves to the combined project and task details data.
 * @throws {Error} If the fetch request fails or an HTTP error occurs.
 */
const getCombinedProjectTaskDetails = async (projectID, userID, activeOnly) => {
    try{
        const response = await fetch(`${server}/getCombinedProjectTaskDetails?projectId=${projectID}&userId=${userID}&activeOnly=${activeOnly}`);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const json = await response.json();
        // console.log("Combined project task details: ", json);

        for(let i = 0; i < json.length; i++)
        {
            if(json[i].predecessors === null)
            {
                json[i].predecessors = [-1];
            }
        }
        return json;}
    catch(error){
        console.error(`Error fetching combined project task details:`, error);
    }
}

/**
 * Fetches and processes the user setup for a specific project.
 *
 * This asynchronous function sends a GET request to the server to retrieve
 * user-specific project setup data based on the provided project ID and user ID.
 * It also maps the `zoom_level` in the response to a more readable format using
 * a predefined mapping.
 *
 * @param {string} projectId - The unique identifier for the project.
 * @param {string} userID - The unique identifier for the user.
 * @returns {Promise<Object|undefined>} A promise that resolves to the processed project user setup data as an object, or `undefined` if an error occurs.
 * @throws Will log an error message to the console if the request fails or the server responds with an error status.
 */
const getProjectUserSetup = async (projectId, userID) =>
{
    try{
        const response = await fetch(`${server}/getProjectUserSetup?projectId=${projectId}&userId=${userID}`);
        if(!response.ok)
        {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const json = await response.json();
        // console.log("Project user setup: ", json);

        const zoomLevelMapping = {
            "DAYS3": "3d",
            "WEEK1": "1w",
            "WEEK2": "2w",
            "MONTH1": "1M",
            "QUARTER1": "1Q",
            "QUARTER2": "2Q",
            "YEAR1": "1y",
            "YEAR2": "2y",
        };

        json.zoom_level = zoomLevelMapping[json.zoom_level] || json.zoom_level; // Convert zoom_level using the mapping.
        // console.log("Project user setup: ", json);
        return json;
    }catch(error){
        console.error(`Error fetching project user setup:`, error);
    }
}

/**
 * Retrieves the activity data of a specific user by their unique identifier.
 *
 * This asynchronous function sends a request to the server to fetch user activity based on the provided `userId`.
 * If the request is successful, it returns the JSON response containing the user's activity data.
 * If an error occurs (e.g., network issue or non-OK HTTP status), it logs the error to the console.
 *
 * @param {string} userId - The unique identifier of the user whose activity data is being fetched.
 * @returns {Promise<Object|undefined>} A promise that resolves to the user's activity data in JSON format if successful, or undefined if an error occurs.
 */
const getUserActivity = async (userId) => {
    try {
        const response = await fetch(`${server}/getUserActivity?userId=${userId}`);
        if (response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const json = await response.json();
        return json;
    }
    catch (error) {
        console.error(`Error fetching user activity:`, error);
    }
}

/**
 * Fetches the dependencies of a specific task by task ID.
 *
 * This asynchronous function sends a GET request to the server to retrieve
 * all task dependencies associated with the provided task ID. If the request
 * is successful, it parses and returns the JSON response containing the task
 * dependencies. If the request fails, an error message is logged in the console.
 *
 * @param {string} taskId - The unique identifier of the task for which dependencies are being retrieved.
 * @returns {Promise<Object>} A promise that resolves to the JSON object representing the task dependencies.
 * @throws {Error} Throws an error if the response status is not ok or there is an issue during the fetch operation.
 */
const getTaskDependencies = async (taskId) => {
    try{
        const response = await fetch(`${server}/getTaskDependencies?taskId=${taskId}`);
        if(!response.ok)
        {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const json = await response.json();
        // console.log("Task dependencies: ", json);
        return json;
    }
    catch(error){
        console.error(`Error fetching task dependencies:`, error);
    }
}

/**
 * Retrieves resources associated with a specific task by its ID.
 *
 * This asynchronous function sends a GET request to the server to fetch the task resources.
 * If the server responds successfully, the resources are returned as a JSON object.
 * In case of an error during the fetch operation or if the response is not OK,
 * the error is logged to the console.
 *
 * @param {string} taskId - The unique identifier of the task for which resources are being retrieved.
 * @returns {Promise<Object|undefined>} A promise that resolves to the retrieved task resources as a JSON object, or `undefined` if an error occurs.
 */
const getTaskResources = async (taskId) => {
    try{
        const response = await fetch(`${server}/getTaskResources?taskId=${taskId}`);
        if(!response.ok)
        {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const json = await response.json();
        return json;
    }
    catch(error){
        console.error(`Error fetching task resources:`, error);
    }
}

/**
 * Asynchronously retrieves a list of all user names from the server.
 *
 * This function sends a GET request to the server's "getAllUserNames" endpoint and
 * returns the parsed JSON response, which is expected to contain the list of user names.
 * If the server responds with an error status code or if the request fails, the
 * error is logged to the console.
 *
 * @async
 * @function
 * @returns {Promise<Object|undefined>} A promise that resolves to the parsed JSON
 * response containing the list of user names if the request is successful, or
 * `undefined` if an error occurs.
 */
const getAllUserNames = async () => {
    try{
        const response = await fetch(`${server}/getAllUserNames`);
        if(!response.ok)
        {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const json = await response.json();
        return json;
    }
    catch(error){
        console.error(`Error fetching all user names:`, error);
    }
}

/**
 * Fetches all tasks associated with a specific user.
 *
 * This function sends a GET request to the server to retrieve
 * all tasks for the user specified by the provided userId.
 *
 * @param {string} userId - The unique identifier of the user whose tasks are to be retrieved.
 * @returns {Promise<Object>} A promise that resolves to the JSON response containing the user's tasks.
 *                            If the request fails, it logs an error to the console.
 * @throws {Error} Throws an error if the HTTP response has a non-OK status.
 */
const getAllUsersTask = async (userId) => {
    try{
        const response = await fetch(`${server}/getAllUsersTasks?userId=${userId}`);
        if(!response.ok)
        {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const json = await response.json();
        if (json.successor_id == null)
        {
            json.successor_id = [-1];
            json.predecessor_id = [-1];
        }
        return json;
    }
    catch(error){
        console.error(`Error fetching all users task:`, error);
    }
}