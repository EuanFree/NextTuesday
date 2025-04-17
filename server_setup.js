require('dotenv').config(); // Load environment variables from .env file
const express = require('express');

const path = require('path');
const { executeSQL,
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
    getProjectJSON,
    getResourcesList,
    getProjectTaskUserSetup,
    countTaskAncestors,
    getCombinedProjectTaskDetails,
    getCombinedTaskDetails,
    getProjectUserSetup,
    getTaskDependencies, 
    getTaskResources,
    updateTaskResourceAssociation,
    updateTaskCollapsed,
    updateTaskDependencies

} = require('./seaviewConnection');


// TODO: Move the username to a client side cookie in order to keep things more simple


const os = require('os');
const username = os.userInfo().username;
// console.log("Current user:", username);

let userID = null;
(async () => {
    try {
        userID = await getResourceID(username);
        console.log("Resource ID for current user:", userID);
    } catch (error) {
        console.error("Error fetching resource ID for current user:", error);
    }
})();
//const userID = await getResourceID(username);

// Initialize express app
const app = express();

// Specify the port to run the server (default to 3000 if not set in .env)
const PORT = process.env.PORT || 3000;

// Serve static files (HTML, CSS, JS) from the 'public' directory
//app.use(express.static(path.join(__dirname)));
app.use(express.static(__dirname));

// Serve the main HTML file by default
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'gantt.html'));
});

app.get('/getUsername', async (req, res) => {
    try{
        res.json(username);
    } catch (error) {
        console.error('Error getting username:', error);
        res.status(500).send('An error occurred while getting the username.');
    }
})

// Endpoint to execute an SQL query
app.get('/executeSQL', async (req, res) => {
    try {
        const sqlQuery = req.query.query; // Expecting the SQL query to be passed as a query parameter
        if (!sqlQuery) {
            return res.status(400).send('SQL query not provided.');
        }
        const result = await executeSQL(sqlQuery);
        res.json(result);
    } catch (error) {
        console.error('Error executing SQL query:', error);
        res.status(500).send('An error occurred while executing the SQL query.');
    }
});


// Endpoint to get user ID by username
app.get('/getUserId', async (req, res) => {
    try {
        const userId = await getResourceID(username); // Pass username variable to getResourceID method
        res.json({userId});
    } catch (error) {
        console.error('Error fetching user ID:', error);
        res.status(500).send('An error occurred while fetching the user ID.');
    }
});


// Endpoint to get task by ID
app.get('/getTask', async (req, res) => {
    try {
        const taskId = req.query.taskId; // Expecting `taskId` as query parameter
        if (!taskId) {
            return res.status(400).send('Task ID not provided.');
        }
        const task = await getTask(taskId);
        res.json(task);
    } catch (error) {
        console.error('Error fetching task:', error);
        res.status(500).send('An error occurred while fetching the task.');
    }
});

// Endpoint to get the portfolio list
app.get('/portfolioList', async (req, res) => {
    try {
        console.log('Getting portfolio list...');
        const portfolioList = await getPortfolioList();
        res.json(portfolioList);
    } catch (error) {
        console.error('Error fetching portfolio list:', error);
        res.status(500).send('An error occurred while fetching the portfolio list.');
    }
});


// Endpoint to get project tasks
app.get('/projectTasks', async (req, res) => {
    try {
        console.log('Starting to get project tasks...');
        const projectId = req.query.projectId;
        const activeOnly = req.query.activeOnly;// Expecting `projectId` as query parameter
        if (!projectId) {
            return res.status(400).send('Project ID not provided.');
        }
        if (!activeOnly) {
            return res.status(400).send('Active only not provided.');
        }
        const tasks = await getProjectTasks(projectId, activeOnly=="true");
        console.log('Done getting project tasks...');
        res.json(tasks);
    } catch (error) {
        console.error('Error fetching project tasks:', error);
        res.status(500).send('An error occurred while fetching project tasks.');
    }
});

// Endpoint to get project data
app.get('/projectData', async (req, res) => {
    try {
        const projectId = req.query.projectId; // Expecting `projectId` as query parameter
        if (!projectId) {
            return res.status(400).send('Project ID not provided.');
        }
        const projectData = await getProjectData(projectId);
        res.json(projectData);
    } catch (error) {
        console.error('Error fetching project data:', error);
        res.status(500).send('An error occurred while fetching project data.');
    }
});

// Endpoint to get user project permissions
app.get('/userProjectPermissions', async (req, res) => {
    try {
        const userId = req.query.userId; // Expecting `userId` as query parameter
        if (!userId) {
            return res.status(400).send('User ID not provided.');
        }
        const permissions = await getUserProjectPermissions(userId);
        res.json(permissions);
    } catch (error) {
        console.error('Error fetching user project permissions:', error);
        res.status(500).send('An error occurred while fetching user project permissions.');
    }
});

// Endpoint to get portfolio contents
app.get('/portfolioContents', async (req, res) => {
    try {
        const portfolioId = req.query.portfolioId; // Expecting `portfolioId` as query parameter
        if (!portfolioId) {
            return res.status(400).send('Portfolio ID not provided.');
        }
        const contents = await getPortfolioContents(portfolioId);
        console.log('Portfolio contents:', contents);
        if(contents.length === 0)
        {
            res.json([]);
        }
        else
        {
            res.json(contents);
        }
    } catch (error) {
        console.error('Error fetching portfolio contents:', error);
        res.status(500).send('An error occurred while fetching portfolio contents.');
    }
});

app.use(express.json()); // Allows server to process incoming JSON payloads


// Endpoint to get programme contents
app.get('/programmeContents', async (req, res) => {
    try {
        const programmeId = req.query.programmeId; // Expecting `programmeId` as query parameter
        if (!programmeId) {
            return res.status(400).send('Programme ID not provided.');
        }
        const contents = await getProgrammeContents(programmeId);
        res.json(contents);
    } catch (error) {
        console.error('Error fetching programme contents:', error);
        res.status(500).send('An error occurred while fetching programme contents.');
    }
});

// Endpoint to get programme list for portfolio
app.get('/programmeListForPortfolio', async (req, res) => {
    try {
        const portfolioId = req.query.portfolioId; // Expecting `portfolioId` as query parameter
        if (!portfolioId) {
            return res.status(400).send('Portfolio ID not provided.');
        }
        const programmeList = await getProgrammeListForPortfolio(portfolioId);
        res.json(programmeList);
    } catch (error) {
        console.error('Error fetching programme list for portfolio:', error);
        res.status(500).send('An error occurred while fetching programme list for portfolio.');
    }
});

// Endpoint to get project list
app.get('/projectList', async (req, res) => {
    try {
        const projectList = await getProjectList();
        res.json(projectList);
    } catch (error) {
        console.error('Error fetching project list:', error);
        res.status(500).send('An error occurred while fetching project list.');
    }
});

// Endpoint to get user project view options
app.get('/userProjectViewOptions', async (req, res) => {
    try {
        const userId = req.query.userId; // Expecting `userId` as query parameter
        if (!userId) {
            return res.status(400).send('User ID not provided.');
        }
        const viewOptions = await getUserProjectViewOptions(userId);
        res.json(viewOptions);
    } catch (error) {
        console.error('Error fetching user project view options:', error);
        res.status(500).send('An error occurred while fetching user project view options.');
    }
});


// Endpoint to add blank portfolio
app.get('/addBlankPortfolio', async (req, res) => {
    try {
        const portfolio = await addBlankPortfolio();
        res.json(portfolio);
    } catch (error) {
        console.error('Error adding blank portfolio:', error);
        res.status(500).send('An error occurred while adding blank portfolio.');
    }
});

// Endpoint to add blank programme
app.get('/addBlankProgramme', async (req, res) => {
    try {
        const programme = await addBlankProgramme();
        res.json(programme);
    } catch (error) {
        console.error('Error adding blank programme:', error);
        res.status(500).send('An error occurred while adding blank programme.');
    }
});

// Endpoint to add blank project
app.get('/addBlankProject', async (req, res) => {
    try {
        const project = await addBlankProject();
        res.json(project);
    } catch (error) {
        console.error('Error adding blank project:', error);
        res.status(500).send('An error occurred while adding blank project.');
    }
});

// Endpoint to add blank task
app.get('/addBlankTask', async (req, res) => {
    try {
        const task = await addBlankTask();
        res.json(task);
    } catch (error) {
        console.error('Error adding blank task:', error);
        res.status(500).send('An error occurred while adding blank task.');
    }
});

// Endpoint to add blank resource
app.get('/addBlankResource', async (req, res) => {
    try {
        const resource = await addBlankResource();
        res.json(resource);
    } catch (error) {
        console.error('Error adding blank resource:', error);
        res.status(500).send('An error occurred while adding blank resource.');
    }
});


app.get('/getMyUserID', async (req, res) => {
    try{
        res.json(userID);
    } catch (error) {
        console.error('Error getting my user ID:', error);
        res.status(500).send('An error occurred while getting the my user ID.');
    }
})


app.post('/updateTask', async (req, res) => {
    try {
        console.log('Updating task...');
        const taskId = req.query.taskId; // `taskId` still expected as a query parameter
        const taskDetails = req.body; // Parse task details from the POST body
        console.log(taskDetails);

        if (!taskId || !taskDetails) {
            return res.status(400).send('Task ID or task details not provided.');
        }

        const updatedTask = await updateTask(taskId, taskDetails); // Assuming `updateTask` processes the update logic
        res.json(updatedTask);
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).send('An error occurred while updating the task.');
    }
});

app.post('/addTaskChange', async (req, res) => {
    try{
        // console.log('Recording task change...');

        const taskChangeDetails = req.body; // Parse task change details from the POST body
        // console.log('Task change details received:', taskChangeDetails);

        if (!taskChangeDetails || Object.keys(taskChangeDetails).length === 0) {
            return res.status(400).send('Task change details not provided.');
        }
        // console.log('server_setup.js: addTaskChange: taskChangeDetails:');
        // console.log('Task change details:', taskChangeDetails);

        const taskChangeEntry = await addTaskChange(taskChangeDetails.taskId,
            taskChangeDetails.changedBy, taskChangeDetails.oldValues, taskChangeDetails.newValues); // Assuming `addTaskChange` is the database function to add changes
        res.json(taskChangeEntry);
    }
    catch (error) {
        console.error('Error recording task change:', error);
        res.status(500).send('An error occurred while recording the task change.');
    }
})


app.post('/updateTaskResourceAssociation', async (req, res) => {
    try {
        console.log('Updating task-resource association...');
        // const {taskId, resourceId, associationDetails} = req.body; // Parse input data from the POST body
        const resources = req.body;

        const updatedAssociation = await updateTaskResourceAssociation(resources); // Call your function
        console.log('----- updatedAssociation:', updatedAssociation);
        res.json(updatedAssociation);
    } catch (error) {
        console.error('Error updating task-resource association:', error);
        res.status(500).send('An error occurred while updating the task-resource association.');
    }
});


app.post('/updateTaskDependencies', async (req, res) => {
    try {
        console.log('Updating task dependencies...');
        const {taskId, dependencies} = req.body; // Parse input data from the POST body

        if (!taskId || !dependencies) {
            return res.status(400).send('Task ID or dependencies not provided.');
        }

        const updatedDependencies = await updateTaskDependencies(taskId, dependencies); // Call your function to handle updating dependencies
        res.json(updatedDependencies);
    } catch (error) {
        console.error('Error updating task dependencies:', error);
        res.status(500).send('An error occurred while updating the task dependencies.');
    }
});



app.get( '/maxTaskChangeId', async (req, res) => {
    try{
        const maxTaskChangeId = await getMaxTaskChangeID();
        res.json(maxTaskChangeId);
    } catch (error) {
        console.error('Error getting max task change ID:', error);
        res.status(500).send('An error occurred while getting the max task change ID.');
    }
})

app.get('/addBlankTaskToProject', async (req, res) => {
    try{
        // console.log('Adding blank task to project...');
        const projectId = req.query.projectId;
        if (!projectId) {
            return res.status(400).send('Project ID not provided.');
        }
        const newTask = await addBlankTaskToProject(projectId);
        console.log('Added blank task to project...');
        res.json(newTask);
    } catch (error) {
        console.error('Error adding blank task to project:', error);
        res.status(500).send('An error occurred while adding blank task to project.');
    }
});

app.get('/getEnumerationTable', async (req, res) => {
    const typeName = req.query.typeName;
    try{
        const table = await getEnumerationTable(typeName);
        res.json(table);
    } catch (error) {
        console.error('Error getting enumeration table:', error);
        res.status(500).send('An error occurred while getting the enumeration table.');
    }
})

app.get('/getProjectJSON', async (req, res) => {
    const projectId = req.query.projectId;
    const userId = req.query.userId;
    // console.log('Getting project JSON for project ID: ', projectId);
    // console.log('Getting project JSON for user ID: ', userId);
    try{
        const project = await getProjectJSON(projectId, userId);
        res.json(project);
    } catch (error) {
        console.error('Error getting project JSON:', error);
        res.status(500).send('An error occurred while getting the project JSON.');
    }
})

app.get('/getResourcesList', async (req, res) => {
    try{
        const resources = await getResourcesList();
        res.json(resources);
    } catch (error) {
        console.error('Error getting resources list:', error);
        res.status(500).send('An error occurred while getting the resources list.');
    }
})

app.get('/getProjectTaskUserSetup', async (req, res) => {
    const taskId = req.query.taskId;
    try{
        const taskSetup = await getProjectTaskUserSetup(taskId);
        res.json(taskSetup);
    } catch (error) {
        console.error('Error getting project task user setup:', error);
        res.status(500).send('An error occurred while getting the project task user setup.');
    }
})


app.get('/countTaskAncestors', async (req, res) => {
    const taskId = req.query.taskId;
    try{
        const count = await countTaskAncestors(taskId);
        console.log('Task ancestors count:', count);
        res.json(count);
    } catch (error) {
        console.error('Error counting task ancestors:', error);
        res.status(500).send('An error occurred while counting the task ancestors.');
    }
})

app.get('/getCombinedProjectTaskDetails', async (req, res) => {
    const projectId = req.query.projectId;
    const userId = req.query.userId;
    const activeOnly = req.query.activeOnly;
    try{
        // console.log('Getting combined project task details...');
        const details = await getCombinedProjectTaskDetails(projectId, userId, activeOnly);
        res.json(details);
    } catch (error) {
        console.error('Error getting combined project task details:', error);
        res.status(500).send('An error occurred while getting the combined project task details.');
    }
})

app.get('/getCombinedTaskDetails', async (req, res) => {
    const taskId = req.query.taskId;
    const userId = req.query.userId;
    const activeOnly = req.query.activeOnly;
    // console.log('Getting combined task details...');
    // console.log('Task ID:', taskId);
    // console.log('User ID:', userId);
    // console.log('Active only:', activeOnly);
    try{
        // console.log('Getting combined project task details...');
        const details = await getCombinedTaskDetails(taskId, userId, activeOnly);
        res.json(details);
    } catch (error) {
        console.error('Error getting combined project task details:', error);
        res.status(500).send('An error occurred while getting the combined project task details.');
    }
})


app.get('/getProjectUserSetup', async (req, res) => {
    const projectId = req.query.projectId;
    const userId = req.query.userId;
    try{
        const setup = await getProjectUserSetup(projectId, userId);
        res.json(setup);
    } catch (error) {
        console.error('Error getting project user setup:', error);
        res.status(500).send('An error occurred while getting the project user setup.');
    }
})

app.get('/getTaskDependencies', async (req, res) => {
    try {
        const taskId = req.query.taskId;
        if (!taskId) {
            return res.status(400).send('Task ID not provided.');
        }
        const dependencies = await getTaskDependencies(taskId);
        if (!dependencies) {
            // return res.status(404).send('Task dependencies not found.');
            return [{'predecessor_id': null, 'successor_id': null}];
        }
        // console.log('Task dependencies:', dependencies);
        res.json(dependencies);
    } catch (error) {
        console.error('Error getting task dependencies:', error);
        res.status(500).send('An error occurred while getting the task dependencies.');
    }
});

app.get('/getTaskResources', async (req, res) => {
    const taskId = req.query.taskId;
    try{
        const resources = await getTaskResources(taskId);
        res.json(resources);
    } catch (error) {
        console.error('Error getting task resources:', error);
        res.status(500).send('An error occurred while getting the task resources.');
    }
})

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

app.get('/updateTaskCollapsed', async (req, res) => {
  const taskId = req.query.taskId;
  const userId = req.query.userId;
  const collapsed = req.query.collapsed;
  try{
      const updateSuccess = await updateTaskCollapsed(taskId, userId, collapsed);
      res.json(updateSuccess);
  } catch (error) {
      console.error('Error updating task collapse:', error);
      console.log('taskId: ', taskId, ', userId: ', userId, ', collapsed: ', collapsed);
      res.status(500).send('An error occurred while updating the task collapse.');
  }
})