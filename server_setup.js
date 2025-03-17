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
    getTask} = require('./seaviewConnection');


const os = require('os');
const username = os.userInfo().username;
console.log("Current user:", username);

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
        const projectId = req.query.projectId; // Expecting `projectId` as query parameter
        if (!projectId) {
            return res.status(400).send('Project ID not provided.');
        }
        const tasks = await getProjectTasks(projectId);
        console.log('Getting project tasks...');
        console.log(tasks);
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
        res.json(contents);
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
        return res.json(updatedTask);
    } catch (error) {
        console.error('Error updating task:', error);
        res.status(500).send('An error occurred while updating the task.');
    }
});

app.post('/addTaskChange', async (req, res) => {
    try{
        console.log('Recording task change...');

        const taskChangeDetails = req.body; // Parse task change details from the POST body
        console.log('Task change details received:', taskChangeDetails);

        if (!taskChangeDetails || Object.keys(taskChangeDetails).length === 0) {
            return res.status(400).send('Task change details not provided.');
        }
        console.log('server_setup.js: addTaskChange: taskChangeDetails:');
        console.log('Task change details:', taskChangeDetails);

        const taskChangeEntry = await addTaskChange(taskChangeDetails.taskId,
            taskChangeDetails.changedBy, taskChangeDetails.oldValues, taskChangeDetails.newValues); // Assuming `addTaskChange` is the database function to add changes
        return res.json(taskChangeEntry);
    }
    catch (error) {
        console.error('Error recording task change:', error);
        res.status(500).send('An error occurred while recording the task change.');
    }
})


app.get('/addBlankTaskToProject', async (req, res) => {
    try{
        console.log('Adding blank task to project...');
        const projectId = req.query.projectId;
        if (!projectId) {
            return res.status(400).send('Project ID not provided.');
        }
        const newTask = await addBlankTaskToProject(projectId);
        console.log('Added blank task to project...');
        return res.json(newTask);
    } catch (error) {
        console.error('Error adding blank task to project:', error);
        res.status(500).send('An error occurred while adding blank task to project.');
    }
});


// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});