const {query} = require("express");

/**
 * Executes a SQL query on a PostgreSQL database.
 *
 * @param {string} sqlQuery - The SQL query to be executed.
 * @param {Array} [queryParams=[]] - An optional array of parameters to be used with the query.
 * @return {Promise<Object>} - A promise that resolves to the result of the SQL query, including properties like rows and fields.
 * @throws {Error} - Throws an error if the query execution fails or if the database connection cannot be closed.
 */
async function executeSQL(sqlQuery, queryParams = []) {
    const { Client } = require('pg');
    const client = new Client({
        host: 'zeno',
        port: 5432,
        user: 'nt_client',
        password: 'nt_client',
        database: 'postgres'
    });

    try {
        await client.connect();
        // console.log('Connected to the database');

        const result = await client.query(sqlQuery, queryParams); // Use queryParams here
        // console.log('Query executed successfully:', result.rows);

        return result; // Return the entire result object, not just rows
    } catch (error) {
        console.error('Error executing query:', error);
        throw error; // Rethrow the error for the caller
    } finally {
        try {
            await client.end();
            // console.log('Database connection closed');
        } catch (err) {
            console.error('Error closing the database connection:', err);
        }
    }
}


/**
 * Fetches project data from the database based on the provided project ID.
 * Optionally includes only active projects if specified.
 *
 * @param {number|string} projectId - The unique identifier of the project to retrieve.
 * @param {boolean} [includeIsActive=true] - Whether to include only active projects in the query.
 * @return {Promise<*>} A promise resolving to the result of the executed SQL query.
 */
async function getProjectData(projectId, includeIsActive = true) {
    console.log("getProjectData: " + projectId);
    let prjQuery = "SELECT * FROM seaview.projects WHERE id = " + projectId;
    if (includeIsActive) {
        prjQuery += " AND is_active = true";
    }
    // console.log("prjQuery: " + prjQuery);
    // return executeSQL(prjQuery);
    let projectResponse = await executeSQL(prjQuery);
    // console.log("projectResponse: " + projectResponse.rows[0]);
    return projectResponse.rows[0];
}


/**
 * Retrieves tasks associated with a specific project.
 *
 * @param {number} projectId - The unique identifier of the project for which tasks are to be retrieved.
 * @param {boolean} [includeIsActive=true] - A flag indicating whether to include only active tasks.
 * @return {Promise<Array>} A promise that resolves to an array of tasks for the specified project.
 */
async function getProjectTasks(projectId, includeIsActive=true)
{
    let prjTskQuery = "SELECT * FROM seaview.tasks WHERE project_id = " + projectId;
    if (includeIsActive) {
        prjTskQuery += " AND is_active = true";
    }
    prjTskQuery += " ORDER BY start_date";
    return await executeSQL(prjTskQuery);
}


// /**
//  * Populates and organizes task information for display in a Gantt chart, including hierarchical levels and parent-child relationships.
//  *
//  * @param {number|string} projectID The unique identifier for the project whose tasks are to be processed.
//  * @return {Array<Object>} An array of root tasks, each including hierarchical information and child tasks.
//  */
// async function populateTasksAdditionalInformationForGanttChart(projectID)
// {
//     let projectRows = getProjectTasks(projectID).rows;
//     let taskMap = new Map();
//     projectRows.forEach(row => taskMap.set(row.id, {...row, level:0,children:[]}));
//     let rootTasks = [];
//     projectRows.forEach(row => {
//         if(row.parent_id){
//             let parentTask = taskMap.get(row.parent_id);
//             if(parentTask){
//                 parentTask.children.push(taskMap.get(row.id));
//                 taskMap.get(row.id).level = parentTask.level + 1;
//             }
//         } else
//         {
//             rootTasks.push(taskMap.get(row.id));
//         }
//     });
//     return Array.from(rootTasks.values());
// }


/**
 * Retrieves the project permissions for a specific user. If no permissions are found,
 * a default permission entry is inserted into the database and returned.
 *
 * @param {number} projectID - The unique identifier of the project for which permissions are being retrieved.
 * @param {number} userID - The unique identifier of the user whose permissions are being retrieved.
 * @return {Promise<Object>} A promise that resolves to an object representing the user's project permissions.
 */
async function getUserProjectPermissions(projectID, userID)
{
    // console.log("getUserProjectPermissions projectID: " + projectID);
    // console.log("getUserProjectPermissions userID: " + userID);
    let permissionsSQL = `SELECT * FROM seaview.gantt_permissions_store WHERE project_id = ${projectID} 
        AND user_id = ${userID}`;
    // console.log("permissionsSQL: " + permissionsSQL);
    let permissionsResponse = await executeSQL(permissionsSQL);
    
    if (permissionsResponse.rows.length === 0) {
        console.log("No rows found. Inserting a default row.");
        let defaultInsertSQL = `INSERT INTO seaview.gantt_permissions_store (project_id, user_id)
                                VALUES (${projectID}, ${userID}) RETURNING *`;

        permissionsResponse = await executeSQL(defaultInsertSQL);
    }
    return permissionsResponse.rows[0];
}


/**
 * Retrieves or initializes the user's project setup for the specified project, task, and user.
 * If no setup exists, a default setup is inserted into the database.
 *
 * @param {number} projectID - The ID of the project for which the setup is being retrieved.
 * @param {number} taskID - The ID of the task associated with the project setup.
 * @param {number} userID - The ID of the user for whom the setup is being retrieved or created.
 * @return {Promise<Object>} A promise that resolves to the user's project setup object.
 */
async function getUserProjectSetup(projectID, taskID, userID)
{
    console.log("getUserProjectSetup projectID: " + projectID);
    console.log("getUserProjectSetup userID: " + userID);
    let userSetupSQL = "SELECT * FROM seaview.gantt_user_project_view_options WHERE project_id = " + projectID +
        " AND user_id = " + userID + " AND task_id = " + taskID;
    let userSetupResponse = await executeSQL(userSetupSQL);
    if (userSetupResponse.rows.length === 0)
    {
        console.log("No rows found in gantt_user_project_view_options. Inserting a default row.");
        let defaultInsertSQL = `INSERT INTO seaview.gantt_user_project_view_options (project_id, task_id, user_id)
                                 VALUES (${projectID}, ${taskID}, ${userID}) RETURNING *`;
        userSetupResponse = await executeSQL(defaultInsertSQL);
    }
    return userSetupResponse.rows[0];
}

async function getProjectUserSetup(projectID, userID)
{
    console.log("getProjectUserSetup projectID: " + projectID);
    console.log("getProjectUserSetup userID: " + userID);
    let userSetupSQL = `SELECT * FROM seaview.gantt_user_project_view_options WHERE project_id = ${projectID}
         AND user_id = ${userID}`;
    let userSetupResponse = await executeSQL(userSetupSQL);
    if (userSetupResponse.rows.length === 0)
    {
        console.log("No rows found in gantt_user_project_view_options. Inserting a default row.");
        let defaultInsertSQL = `INSERT INTO seaview.gantt_user_project_view_options (project_id, user_id)
                                        VALUES (${projectID}, ${userID}) RETURNING *`;
        userSetupResponse = await executeSQL(defaultInsertSQL);
    }
    return userSetupResponse.rows[0];
}


/**
 * Retrieves the project details, permissions, and user setup for a specified project
 * and user, and generates a JSON representation of the project data.
 *
 * @param {number} projectID - The unique identifier for the project.
 * @param {number} userID - The unique identifier for the user.
 * @return {Promise<Object>} A promise that resolves to the project JSON object containing
 * project details, permissions, and user-specific setup information.
 */
async function getProjectJSON(projectID, userID)
{
    // let projectTaskArray = populateTasksAdditionalInformationForGanttChart(projectID);
    console.log("Starting getProjectJSON: User ID",userID, "Project ID", projectID);
    // console.log("projectID: " + projectID);
    // console.log("userID: " + userID);
    let projectDetails = await getProjectData(projectID);
    let projectPermissions = await getUserProjectPermissions(projectID, userID);
    let userSetup = await getProjectUserSetup(projectID, userID);

    let projectJSON = {
        project:
            {
                id: projectID,
                name: projectDetails.title,
                start_date: projectDetails.start_date ? new Date(projectDetails.start_date).getTime() : null,
                is_active: projectDetails.is_active,
                canWrite: projectPermissions.write_permission,
                canAdd: projectPermissions.add_permission,
                canWriteOnParent: projectPermissions.write_on_parent_permission,
                cannotCloseTaskIfIssueOpen: projectPermissions.cannot_close_task_if_issue_open_permission,
                canAddIssue: projectPermissions.can_add_permission,
                canDelete: projectPermissions.can_delete_permission,
                minEditableDate: projectDetails.minimum_date,
                maxEditableDate: projectDetails.maximum_date,
                zoom: userSetup.zoom_level
            }
        // },
        // tasks: []
    }
    return projectJSON;
}


/**
 * Retrieves the list of projects.
 *
 * @param {boolean} [includeIsActive=true] - A flag indicating whether to include only active projects.
 * @returns {Promise<Array>} A promise that resolves to the list of projects.
 */
async function getProjectList(includeIsActive = true) {
    let projectListSQL = "SELECT * FROM seaview.projects";
    if (includeIsActive) {
        projectListSQL += " WHERE is_active = true";
    }
    return executeSQL(projectListSQL);
}


/**
 * Retrieves a list of all programs.
 *
 * @param {boolean} [includeIsActive=true] - A flag indicating whether to include only active programs.
 * @returns {Promise<Array>} A promise that resolves to the list of programs.
 */
async function getProgramList(includeIsActive = true) {
    let programListSQL = "SELECT * FROM seaview.programmes";
    if (includeIsActive) {
        programListSQL += " WHERE is_active = true";
    }
    return executeSQL(programListSQL);
}


/**
 * Retrieves a list of all portfolios.
 *
 * @param {boolean} [includeIsActive=true] - A flag indicating whether to include only active portfolios.
 * @returns {Promise<Array>} A promise that resolves to the list of portfolios.
 */
async function getPortfolioList(includeIsActive = true) {
    let portfolioListSQL = "SELECT * FROM seaview.portfolios";
    if (includeIsActive) {
        portfolioListSQL += " WHERE is_active = true";
    }
    console.log("portfolioList SQL: " + portfolioListSQL);
    return executeSQL(portfolioListSQL);
}


/**
 * Retrieves a list of projects for a specific portfolio.
 *
 * @param {number|string} portfolioID - The unique identifier of the portfolio.
 * @param {boolean} [includeIsActive=true] - A flag indicating whether to include only active projects.
 * @returns {Promise<Array>} A promise that resolves to the list of projects for the portfolio.
 */
async function getProjectListForPortfolio(portfolioID, includeIsActive = true) {
    let projectListSQL = "SELECT projects FROM seaview.portfolios WHERE portfolio_id = " + portfolioID;
    if (includeIsActive) {
        projectListSQL += " AND is_active = true";
    }
    return executeSQL(projectListSQL);
}


/**
 * Retrieves a list of projects for a specific program.
 *
 * @param {number|string} programmeID - The unique identifier of the program.
 * @param {boolean} [includeIsActive=true] - A flag indicating whether to include only active projects.
 * @returns {Promise<Array>} A promise that resolves to the list of projects for the program.
 */
async function getProjectListForProgramme(programmeID, includeIsActive = true) {
    let projectListSQL = "SELECT id FROM seaview.projects WHERE programme_id = " + programmeID;
    if (includeIsActive) {
        projectListSQL += " AND is_active = true";
    }
    return executeSQL(projectListSQL);
}


/**
 * Retrieves a list of programs for a specific portfolio.
 *
 * @param {number|string} projectID - The unique identifier of the portfolio.
 * @param {boolean} [includeIsActive=true] - A flag indicating whether to include only active programs.
 * @returns {Promise<Array>} A promise that resolves to the list of programs for the portfolio.
 */
async function getProgrammeListForPortfolio(projectID, includeIsActive = true) {
    let programmeListSQL = "SELECT programmes FROM seaview.portfolios WHERE portfolio_id = " + projectID;
    if (includeIsActive) {
        programmeListSQL += " AND is_active = true";
    }
    return executeSQL(programmeListSQL);
}


/**
 * Retrieves a user's project view options from the 'gantt_user_project_view_options' table.
 *
 * @param {number} userID - The unique identifier of the user.
 * @returns {Object|null} An object containing the user's project view options or null if no data is found.
 */
async function getUserProjectViewOptions(userID)
{
    const query = `SELECT user_id, project_id, zoom_level, start_date 
        FROM seaview.gantt_user_project_view_options 
        WHERE user_id = ${userID}`;

    const result = executeSQL(query);

    if (result.rows.length > 0) {
        return result.rows[0];
    }

    return null;
}


/**
 * Adds a record of changes made to a task in the database.
 *
 * @param {number} taskID - The unique identifier of the task that has been modified.
 * @param {string} changedBy - The identifier (e.g., user ID) of who made the changes.
 * @param {Object} oldValues - The previous values of the task before the change.
 * @param {Object} newValues - The updated values of the task after the change.
 * @return {Promise<Object>} A promise that resolves to the inserted task change record.
 * @throws {Error} If there is an issue executing the database query.
 */
async function addTaskChange(taskID, changedBy, oldValues, newValues)
{
    const query = `
        INSERT INTO seaview.task_changes (task_id, change_date, changed_by, old_values_json, new_value_json)
        VALUES ($1, NOW(), $2, $3, $4)
        RETURNING *;
    `;

    const values = [
        taskID,
        changedBy,
        JSON.stringify(oldValues || {}),
        JSON.stringify(newValues || {})
    ];

    try {
        // console.log("addTaskChange query: " + query);
        // console.log("addTaskChange values: " + values);
        const result = await executeSQL(query, values);
        // console.log("addTaskChange result: " + result);
        return result.rows[0];
    } catch (error) {
        console.error("Error inserting a task change record:", error);
        throw error;
    }
}


/**
 * Retrieves the maximum ID from the 'seaview.task_changes' table.
 *
 * @returns {Promise<number|null>} A promise that resolves to the maximum ID value
 *                                or null if there are no records in the table.
 */
async function getMaxTaskChangeID() {
    const query = `
        SELECT MAX(task_id) AS max_id
        FROM seaview.task_changes;
    `;
    try {
        const result = await executeSQL(query);
        if (result.rows.length > 0 && result.rows[0].max_id !== null) {
            return result.rows[0].max_id;
        } else {
            return null;
        }
    } catch (error) {
        console.error("Error retrieving maximum task ID from task_changes table:", error);
        throw error;
    }
}


/**
 * Updates an existing task in the 'tasks' table.
 *
 * @param {number} taskID - The unique identifier for the task to update.
 * @param {Object} updates - An object containing the fields to update with their new values.
 * @returns {Promise<Object>} A promise that resolves to the updated task.
 */
async function updateTask(taskID, updates)
{
    const fields = [];
    const values = [];
    let index = 1;

    // Construct the SQL query with the fields provided in the updates object
    for (const [key, value] of Object.entries(updates)) {
        fields.push(`${key} = $${index}`);
        values.push(value);
        index++;
    }

    const query = `
        UPDATE seaview.tasks
        SET ${fields.join(", ")}
        WHERE id = $${index}
        RETURNING *;
    `;

    values.push(taskID); // Add taskID as the final parameter in the query


    const result = await executeSQL(query, values); // Add the values to the query execution

    try {

        const result = await executeSQL(query, values);
        if (result.rows.length > 0) {
            return result.rows[0];
        } else {
            throw new Error(`Task with ID ${taskID} not found.`);
        }
    } catch (error) {
        console.error("Error updating task:", error);
        throw error;
    }

    //TODO: NEED TO ENSURE THIS WORKS CORRECTLY -
    // try {
    //     const projResult = await updateProjectFromAssociatedTasks(task.project)
    //     if (projResult.rows.length > 0) {
    //         return projResult.rows[0];
    //     } else {
    //         throw new Error(`Project with ID ${task.project} not found.`);
    //     }
    // } catch
    // {
    //     console.error("Error updating project:", error);
    //     throw error;
    // }
    // try {
    //     const taskChangeResult = await addTaskChange(taskID, changedBy, oldValues, updates);
    // }
}

async function getResourceID(username)
{
    const query = `
        SELECT id FROM seaview.resources WHERE username = $1;
    `;
    try {
        const result = await executeSQL(query, [username]);
        if (result.rows.length > 0) {
            return result.rows[0].id;
        } else {
            throw new Error(`User with username ${username} not found.`);
        }
    } catch (error) {
        console.error("Error updating task:", error);
        throw error;
    }
}

/**
 * Updates a project's details in the 'projects' table based on all associated tasks.
 *
 * This function calculates the project's start and end dates based on the earliest start
 * and latest end dates of all tasks associated with the project.
 *
 * @param {number} projectID - The unique identifier for the project to update.
 * @returns {Promise<Object>} A promise that resolves to the updated project's details.
 */
async function updateProjectFromAssociatedTasks(projectID) {
    const query = `
        SELECT MIN(start_date) AS earliest_start_date, MAX(end_date) AS latest_end_date
        FROM seaview.tasks
        WHERE project_id = $1;
    `;

    try {
        // Fetch the aggregated task data for the project
        const taskDataResult = await executeSQL(query, [projectID]);
        const taskData = taskDataResult.rows[0];

        if (!taskData || (!taskData.earliest_start_date && !taskData.latest_end_date)) {
            throw new Error(`No associated tasks found for project ID ${projectID}.`);
        }

        // Prepare the updates for the project
        const updates = {};
        if (taskData.earliest_start_date) {
            updates.start_date = taskData.earliest_start_date;
        }
        if (taskData.latest_end_date) {
            updates.end_date = taskData.latest_end_date;
        }

        // Update the project in the database
        const fields = [];
        const values = [];
        let index = 1;

        for (const [key, value] of Object.entries(updates)) {
            fields.push(`${key} = $${index}`);
            values.push(value);
            index++;
        }

        const updateQuery = `
            UPDATE seaview.projects
            SET ${fields.join(", ")}
            WHERE project_id = $${index}
            RETURNING *;
        `;

        values.push(projectID); // Add projectID as the last parameter

        const updateResult = await executeSQL(updateQuery, values);
        if (updateResult.rows.length > 0) {
            return updateResult.rows[0];
        } else {
            throw new Error(`Failed to update project with ID ${projectID}.`);
        }
    } catch (error) {
        console.error("Error updating project based on associated tasks:", error);
        throw error;
    }
}


/**
 * Updates a programme's details in the 'programmes' table based on all associated projects.
 *
 * This function calculates the programme's start and end dates based on the earliest start
 * and latest end dates of all projects associated with the programme.
 *
 * @param {number} programmeID - The unique identifier for the programme to update.
 * @returns {Promise<Object>} A promise that resolves to the updated programme's details.
 */
async function updateProgrammeFromAssociatedProjects(programmeID) {
    const query = `
        SELECT MIN(start_date) AS earliest_start_date, MAX(end_date) AS latest_end_date
        FROM seaview.projects
        WHERE programme_id = $1;
    `;

    try {
        // Fetch the aggregated project data for the programme
        const projectDataResult = await executeSQL(query, [programmeID]);
        const projectData = projectDataResult.rows[0];

        if (!projectData || (!projectData.earliest_start_date && !projectData.latest_end_date)) {
            throw new Error(`No associated projects found for programme ID ${programmeID}.`);
        }

        // Prepare the updates for the programme
        const updates = {};
        if (projectData.earliest_start_date) {
            updates.start_date = projectData.earliest_start_date;
        }
        if (projectData.latest_end_date) {
            updates.end_date = projectData.latest_end_date;
        }

        // Update the programme in the database
        const fields = [];
        const values = [];
        let index = 1;

        for (const [key, value] of Object.entries(updates)) {
            fields.push(`${key} = $${index}`);
            values.push(value);
            index++;
        }

        const updateQuery = `
            UPDATE seaview.programmes
            SET ${fields.join(", ")}
            WHERE programme_id = $${index} AND $${index + 1} = ANY(projects)
            RETURNING *;
        `;

        values.push(programmeID); // Add programmeID as the last parameter

        const updateResult = await executeSQL(updateQuery, values);
        if (updateResult.rows.length > 0) {
            return updateResult.rows[0];
        } else {
            throw new Error(`Failed to update programme with ID ${programmeID}.`);
        }
    } catch (error) {
        console.error("Error updating programme based on associated projects:", error);
        throw error;
    }
}


/**
 * Updates a portfolio's details in the 'portfolios' table based on all associated projects
 * and programmes.
 *
 * This function calculates the portfolio's start and end dates based on the earliest start
 * and latest end dates of all projects and programmes associated with the portfolio.
 *
 * @param {number} portfolioID - The unique identifier for the portfolio to update.
 * @returns {Promise<Object>} A promise that resolves to the updated portfolio's details.
 */
async function updatePortfolioFromAssociatedProjectsAndProgrammes(portfolioID) {
    try {
        // Query to fetch the earliest start and latest end dates from associated projects and programmes
        const query = `
            SELECT 
                MIN(start_date) AS earliest_start_date, 
                MAX(end_date) AS latest_end_date
            FROM (
                SELECT start_date, end_date FROM seaview.projects WHERE portfolio_id = $1
                UNION ALL
                SELECT start_date, end_date FROM seaview.programmes WHERE portfolio_id = $1
            ) AS combined_dates;
        `;

        // Fetch the aggregated data
        const result = await executeSQL(query, [portfolioID]);
        const data = result.rows[0];

        if (!data || (!data.earliest_start_date && !data.latest_end_date)) {
            throw new Error(`No associated projects or programmes found for portfolio ID ${portfolioID}.`);
        }

        // Prepare the updates for the portfolio
        const updates = {};
        if (data.earliest_start_date) {
            updates.start_date = data.earliest_start_date;
        }
        if (data.latest_end_date) {
            updates.end_date = data.latest_end_date;
        }

        // Update the portfolio in the database
        const fields = [];
        const values = [];
        let index = 1;

        for (const [key, value] of Object.entries(updates)) {
            fields.push(`${key} = $${index}`);
            values.push(value);
            index++;
        }

        const updateQuery = `
            UPDATE seaview.portfolios
            SET ${fields.join(", ")}
            WHERE portfolio_id = $${index}
            OR $${index} = ANY(programmes)
            OR $${index} = ANY(projects)
            RETURNING *;
        `;

        values.push(portfolioID); // Add portfolioID as the last parameter

        const updateResult = await executeSQL(updateQuery, values);
        if (updateResult.rows.length > 0) {
            return updateResult.rows[0];
        } else {
            throw new Error(`Failed to update portfolio with ID ${portfolioID}.`);
        }
    } catch (error) {
        console.error("Error updating portfolio based on associated projects and programmes:", error);
        throw error;
    }
}


/**
 * Inserts a blank item into the 'tasks' table and returns the newly created task's ID.
 *
 * @returns {Promise<number>} A promise that resolves to the newly created task's ID.
 */
async function addBlankTask() {
    const query = `
        INSERT INTO seaview.tasks DEFAULT VALUES
        RETURNING id;
    `;

    try {
        const result = await executeSQL(query);
        if (result.rows.length > 0) {
            return result.rows[0].id;
        } else {
            throw new Error("Failed to insert a blank task.");
        }
    } catch (error) {
        console.error("Error inserting a blank task:", error);
        throw error;
    }
}

async function addBlankTaskToProject(projectID) {
    const query = `
        INSERT INTO seaview.tasks (title, project_id, status, is_active) 
        VALUES (\'Blank\', $1, \'BACKLOG\', true)
        RETURNING id;
    `;
    try {
        const result = await executeSQL(query, [projectID]);
        if (result.rows.length > 0) {
            return result.rows[0].id;
        } else {
            throw new Error("Failed to insert a blank task.");
        }
    } catch (error) {
        console.error("Error inserting a blank task:", error);
        throw error;
    }
}

/**
 * Adds a predecessor to a specific task in the system by inserting a record
 * into the task dependencies table.
 *
 * @param {number} taskID - The ID of the task that will have a predecessor added.
 * @param {number} predecessorID - The ID of the task to be set as a predecessor.
 * @return {Promise<number>} A promise that resolves to the ID of the newly created task dependency record.
 * @throws Will throw an error if the database operation fails.
 */
async function addPredecessorToTask(taskID, predecessorID) {
    const query = `
        INSERT INTO seaview.task_dependencies (predecessor_id, successor_id) VALUES ($1, $2)
        RETURNING id;
    `;
    try {
        const result = await executeSQL(query, [predecessorID, taskID]);
        if (result.rows.length > 0) {
            return result.rows[0].id;
        } else {}
    }
    catch (error) {
        console.error("Error adding predecessor to task:", error);
        throw error;
    }
}

/**
 * Inserts a blank entry into the 'programmes' table and returns the newly created program's ID.
 *
 * @returns {Promise<number>} A promise that resolves to the newly created program's ID.
 */
async function addBlankProgramme() {
    const query = `
        INSERT INTO seaview.programmes DEFAULT VALUES
        RETURNING programme_id;
    `;
    try {
        const result = await executeSQL(query);
        if (result.rows.length > 0) {
            return result.rows[0].programme_id;
        } else {
            throw new Error("Failed to insert a blank programme.");
        }
    } catch (error) {
        console.error("Error inserting a blank programme:", error);
        throw error;
    }
}

/**
 * Inserts a blank entry into the 'portfolios' table and returns the newly created portfolio's ID.
 *
 * @returns {Promise<number>} A promise that resolves to the newly created portfolio's ID.
 */
async function addBlankPortfolio() {
    const query = `
        INSERT INTO seaview.portfolios DEFAULT VALUES
        RETURNING portfolio_id;
    `;
    try {
        const result = await executeSQL(query);
        if (result.rows.length > 0) {
            return result.rows[0].portfolio_id;
        } else {
            throw new Error("Failed to insert a blank portfolio.");
        }
    } catch (error) {
        console.error("Error inserting a blank portfolio:", error);
        throw error;
    }
}

/**
 * Inserts a blank entry into the 'projects' table and returns the newly created project's ID.
 *
 * @returns {Promise<number>} A promise that resolves to the newly created project's ID.
 */
async function addBlankProject() {
    const query = `
        INSERT INTO seaview.projects DEFAULT VALUES
        RETURNING project_id;
    `;
    try {
        const result = await executeSQL(query);
        if (result.rows.length > 0) {
            return result.rows[0].project_id;
        } else {
            throw new Error("Failed to insert a blank project.");
        }
    } catch (error) {
        console.error("Error inserting a blank project:", error);
        throw error;
    }
}

/**
 * Inserts a blank entry into the 'resources' table and returns the newly created resource's ID.
 *
 * @returns {Promise<number>} A promise that resolves to the newly created resource's ID.
 */
async function addBlankResource() {
    const query = `
        INSERT INTO seaview.resources DEFAULT VALUES
        RETURNING resource_id;
    `;
    try {
        const result = await executeSQL(query);
        if (result.rows.length > 0) {
            return result.rows[0].resource_id;
        } else {
            throw new Error("Failed to insert a blank resource.");
        }
    } catch (error) {
        console.error("Error inserting a blank resource:", error);
        throw error;
    }
}


async function getPortfolioContents(portfolioID)
{
    const query = `SELECT id AS programme_id, NULL AS project_id, title FROM seaview.programmes WHERE portfolio_id = ${portfolioID}
                            UNION SELECT NULL AS programme_id, id AS project_id, title FROM seaview.projects WHERE portfolio_id = ${portfolioID}`;
    try
    {
        const result = await executeSQL(query);
        console.log(result.rows);
        // if (result.rows.length > 0)
        // {
        //     return result.rows[0];
        // }
        // else
        // {
        //     throw new Error(`Portfolio with ID ${portfolioID} not found.`);
        // }
        return result.rows;
    }
    catch(error)
    {
        console.error("Error getting portfolio contents:", error);
        throw error;
    }
}

async function getProgrammeContents(programmeID)
{
    const query = `SELECT id, title FROM seaview.projects WHERE programme_id = ${programmeID}`;
    try
    {
        const result = await executeSQL(query);
        if (result.rows.length > 0)
        {
            return result.rows;
        }
        else
        {
            return [];
        }
    } catch (error)
    {
        console.error("Error getting program contents:", error);
        throw error;
    }
}

/**
 * Retrieves a task from the 'tasks' table based on the provided task ID.
 *
 * @param {number} taskID - The ID of the task to retrieve.
 * @returns {Promise<Object>} A promise that resolves to the task object if found.
 * @throws {Error} Will throw an error if the task is not found or if the database operation fails.
 */
async function getTask(taskID) {
    const query = `SELECT * FROM seaview.tasks WHERE id = ${taskID}`;
    try {
        const result = await executeSQL(query);
        if (result.rows.length > 0) {
            return result.rows[0];
        } else {
            throw new Error(`Task with ID ${taskID} not found.`);
        }
    } catch (error) {
        console.error("Error getting task:", error);
        throw error;
    }
}

/**
 * Retrieves the labels and sort order of an enumeration type from the database.
 *
 * @param {string} typeName - The name of the enumeration type to retrieve.
 * @returns {Promise<Object[]>} A promise that resolves to an array of objects, each representing an enumeration label and its sort order.
 * @throws Will throw an error if the enumeration type is not found or if the database operation fails.
 */
async function getEnumerationTable(typeName) {
    const query = `SELECT enumlabel, enumsortorder
                    FROM pg_enum
                    JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
                    WHERE typname = '${typeName}';`;
    try {
        const result = await executeSQL(query);
        if (result.rows.length > 0) {
            return result.rows;
        } else {
            throw new Error(`Enumeration with type ${typeName} not found.`);
        }
    } catch (error) {
        console.error("Error getting enumeration:", error);
        throw error;
    }
}

async function getResourcesList(){
    const query = `SELECT * FROM seaview.resources`;
    try
    {
        const result = await executeSQL(query);
        if (result.rows.length > 0) {
            return result;
        } else {
            throw new Error(`No resources found.`);
        }
    }
    catch(error)
    {
        console.error("Error getting resources list:", error);
        throw error;
    }
}

async function getProjectTaskUserSetup(taskID)
{
    let query = `SELECT * FROM seaview.gantt_user_project_tasks_view_options
                            WHERE task_id = ${taskID}`;
    try
    {
        // console.log('getProjTaskUserSetup query: ', query);
        const result = await executeSQL(query);
        console.log('Project Task User Setup '+result.rowCount);
        if (result.rows.length > 0) {
            return result;
        } else {
            query = `INSERT INTO seaview.gantt_user_project_tasks_view_options (task_id) VALUES (${taskID})`;
            // console.log('query: ', query);
            const result2 = await executeSQL(query);
            console.log('Project Task User Setup '+result2.rowCount);
            return result2;
        }
    } catch (error) {
        console.error("Error getting project task user setup:", error);
        throw error;
    }
}


/**
 * Finds the number of ancestors for a given task through parent_task_id until the top task is reached.
 *
 * @param {number} taskID - The ID of the task whose ancestors are to be counted.
 * @returns {Promise<number>} A promise that resolves to the number of ancestors.
 */
async function countTaskAncestors(taskID) {
    const query = `
        WITH RECURSIVE task_hierarchy AS (
            SELECT id, parent_id
            FROM seaview.tasks
            WHERE id = ${taskID}
            UNION ALL
            SELECT t.id, t.parent_id
            FROM seaview.tasks t
            INNER JOIN task_hierarchy th ON t.id = th.parent_id
        )
        SELECT COUNT(*) - 1 AS ancestor_count FROM task_hierarchy;
    `;

    try {
        const result = await executeSQL(query);

        if (result.rows.length === 0) {
            throw new Error(`Task with ID ${taskID} not found.`);
        }

        return result.rows[0].ancestor_count;
    } catch (error) {
        console.error("Error counting task ancestors:", error);
        throw error;
    }
}


/**
 * Combines project tasks, their ancestor counts, and user-specific task setup into a single output.
 *
 * @param {number} projectID - The ID of the project.
 * @param {number} userID - The ID of the user.
 * @param {boolean} activeOnly - Whether to filter active tasks only.
 * @returns {Promise<Object[]>} A promise that resolves to a table containing the combined task data.
 */
async function getCombinedProjectTaskDetails(projectID, userID, activeOnly=true) {
    const activeFilter = activeOnly ? "AND t.is_active = true" : "";

    const combinedQuery = `WITH tasks_for_project AS (
    SELECT *
    FROM seaview.tasks t
    WHERE project_id = $1 ${activeFilter} ), insert_guptvo AS (
                           INSERT
                           INTO seaview.gantt_user_project_tasks_view_options (project_id, task_id, user_id)
                           SELECT $1, t.id, $2
                           FROM tasks_for_project t
                               LEFT JOIN seaview.gantt_user_project_tasks_view_options guptvo
                           ON t.id = guptvo.task_id AND guptvo.project_id = $1 AND guptvo.user_id = $2
                           WHERE guptvo.task_id IS NULL
                               RETURNING task_id
                               )
                               , task_hierarchy AS (
                           WITH RECURSIVE hierarchy_cte AS (
                               SELECT id AS task_id, parent_id, 0 AS level
                               FROM seaview.tasks t
                               WHERE project_id = $1 ${activeFilter}
                               UNION ALL
                               SELECT t.id AS task_id, t.parent_id, level + 1
                               FROM seaview.tasks t
                               INNER JOIN hierarchy_cte h ON t.parent_id = h.task_id
                               )
                           SELECT task_id, MAX (level) AS hierarchy_level
                           FROM hierarchy_cte
                           GROUP BY task_id
                               ),
                               final_combination AS (
                           SELECT t.*, th.hierarchy_level, guptvo.collapsed, ptl.line_number
                           FROM tasks_for_project t
                               LEFT JOIN task_hierarchy th
                           ON t.id = th.task_id
                               LEFT JOIN seaview.gantt_user_project_tasks_view_options guptvo
                               ON t.id = guptvo.task_id AND guptvo.user_id = $2
                               LEFT JOIN (
                                   SELECT task_id, line_number 
                                   FROM seaview.project_task_line 
                                   WHERE project_id = $1
                               ) ptl ON t.id = ptl.task_id
                               )
    SELECT *
    FROM final_combination
    WHERE title IS NOT NULL
      AND title != 'Blank'
    ORDER BY line_number ASC;`;
    try {
        // console.log('getCombinedProjectTaskDetails query: \n\r', combinedQuery);
        const combinedResult = await executeSQL(combinedQuery, [projectID, userID]);
        if (combinedResult.rows.length === 0) {
            throw new Error(`No tasks found for project ID ${projectID}.`);
        }
        return combinedResult;
    } catch (error) {
        console.error("Error getting combined project task details:", error);
        throw error;
    }
}

async function getProjectUserSetup(projectID, userID) {
    const query = `SELECT * FROM seaview.gantt_user_project_view_options WHERE project_id = $1 AND user_id = $2`;
    try {
        const result = await executeSQL(query, [projectID, userID]);
        if (result.rows.length === 0) {
            throw new Error(`Error getting project user setup for Project: ${projectID}, User: ${userID}`);
        }
        return result.rows[0];
    } catch (error) {
        console.error("Error getting project user setup:", error);
        throw error;
    }
}

async function getTaskDependencies(taskID) {
    const query = `SELECT * FROM seaview.task_dependencies WHERE successor_id = ${taskID}`;
    try {
        const result = await executeSQL(query);
        if (result.rows.length === 0) {
            // throw new Error(`Error getting task dependencies for task ID ${taskID}`);
            return [{'predecessor_id': -1, 'successor_id': -1}];
        }
        return result.rows;
    } catch (error) {
        console.error("Error getting task dependencies:", error);
    }
}

async function getTaskResources(taskID) {
    const query = `SELECT resource_id FROM seaview.task_resource_association WHERE task_id = ${taskID}`;
    try {
        const result = await executeSQL(query);
        // console.log('getTaskResources result: ', result);
        if (result.rows.length === 0) {
            console.log('Error getting task resources for task ID' + taskID + ' : ' + result.rows.length);
            return [];
        }
        // console.log('getTaskResources result: ', result.rows);
        return result.rows;
    } catch (error) {
        console.error("Error getting task resources:", error);
    }
}

//Export functions
module.exports = {
    addPredecessorToTask,
    getProgrammeListForPortfolio,
    getUserProjectViewOptions,
    addTaskChange,
    updateTask,
    addBlankTask,
    addBlankTaskToProject,
    addBlankProgramme,
    addBlankPortfolio,
    addBlankProject,
    executeSQL,
    addBlankResource,
    getPortfolioContents,
    getProgrammeContents,
    updateProjectFromAssociatedTasks,
    updateProgrammeFromAssociatedProjects,
    updatePortfolioFromAssociatedProjectsAndProgrammes,
    getPortfolioList,
    getUserProjectPermissions,
    getProjectData,
    getProjectList,
    getProjectTasks,
    getResourceID,
    getTask,
    getMaxTaskChangeID,
    getEnumerationTable,
    getResourcesList,
    getProjectJSON,
    getProjectTaskUserSetup,
    countTaskAncestors,
    getCombinedProjectTaskDetails,
    getProjectUserSetup,
    getTaskDependencies,
    getTaskResources
}


//Test code


