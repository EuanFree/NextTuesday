/*
  Development of the Open Lab ganttMaster.js
  Modifications written by Euan Freeman
  Copyright (c) 2025 Euan Freeman

 Copyright (c) 2012-2018 Open Lab
 Written by Roberto Bicchierai and Silvia Chelazzi http://roberto.open-lab.com
 Permission is hereby granted, free of charge, to any person obtaining
 a copy of this software and associated documentation files (the
 "Software"), to deal in the Software without restriction, including
 without limitation the rights to use, copy, modify, merge, publish,
 distribute, sublicense, and/or sell copies of the Software, and to
 permit persons to whom the Software is furnished to do so, subject to
 the following conditions:

 The above copyright notice and this permission notice shall be
 included in all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

/**
 * Constructor for the GanttMaster class. This class is responsible for handling
 * the main logic and state for a Gantt chart, including tasks, dependencies, resources,
 * and permissions. It also manages UI elements such as the editor, Gantt view, and splitter layout.
 *
 * @return {GanttMaster} Returns an instance of the GanttMaster class configured with default properties.
 */
function GanttMaster(userID) {
  this.userId = userID;
  this.tasks = [];
  this.deletedTaskIds = [];
  this.links = [];

  this.editor; //element for editor
  this.gantt; //element for gantt
  this.splitter; //element for splitter

  this.isMultiRoot=false; // set to true in case of tasklist

  this.workSpace;  // the original element used for containing everything
  this.element; // editor and gantt box without buttons


  this.resources = []; //list of resources
  this.roles = [];  //list of roles

  this.minEditableDate = 0;
  this.maxEditableDate = Infinity;
  this.set100OnClose=false;
  this.shrinkParent=false;

  this.fillWithEmptyLines=true; //when is used by widget it could be usefull to do not fill with empty lines

  this.rowHeight = 30; // todo get it from css?
  this.minRowsInEditor=30; // number of rows always visible in editor
  this.numOfVisibleRows=0; //number of visible rows in the editor
  this.firstScreenLine=0; //first visible row ignoring collapsed tasks
  this.rowBufferSize=5;
  this.firstVisibleTaskIndex=-1; //index of first task visible
  this.lastVisibleTaskIndex=-1; //index of last task visible

  this.baselines={}; // contains {taskId:{taskId,start,end,status,progress}}
  this.showBaselines=false; //allows to draw baselines
  this.baselineMillis; //millis of the current baseline loaded


  this.permissions = {
    canWriteOnParent: true,
    canWrite: true,
    canAdd: true,
    canDelete: true,
    canInOutdent: true,
    canMoveUpDown: true,
    canSeePopEdit: true,
    canSeeFullEdit: true,
    canSeeDep: true,
    canSeeCriticalPath: true,
    canAddIssue: false,
    cannotCloseTaskIfIssueOpen: false
  };

  this.firstDayOfWeek = Date.firstDayOfWeek;
  this.serverClientTimeOffset = 0;

  this.currentTask; // task currently selected;

  this.resourceUrl = "res/"; // URL to resources (images etc.)
  this.__currentTransaction;  // a transaction object holds previous state during changes
  this.__undoStack = [];
  this.__redoStack = [];
  this.__inUndoRedo = false; // a control flag to avoid Undo/Redo stacks reset when needed

  /* 2025/03/19 EF - Switched to 0.5 a day */
  Date.workingPeriodResolution=0.5; //by default 1 day

  var self = this;
}


/**
 * Initializes the GanttMaster instance by setting up the container, defining editable tasks,
 * preparing plugins, and binding various event listeners required for the Gantt chart.
 *
 * This method is essential to prepare and render the Gantt chart within the specified DOM container.
 *
 * Configuration includes:
 * - Setting up the DOM structure.
 * - Handling resource management for tasks.
 * - Binding specific UI events such as clicks, keypresses, and mouse actions.
 * - Initializing task filters and sorters if applicable.
 * - Loading any predefined or default settings for the Gantt chart interface.
 *
 * Ensure that the container element and necessary configurations are provided before calling this method.
 */
GanttMaster.prototype.init = function (workSpace) {
  var place=$("<div>").prop("id","TWGanttArea").css( {padding:0, "overflow-y":"auto", "overflow-x":"hidden","border":"1px solid #e5e5e5",position:"relative"});
  workSpace.append(place).addClass("TWGanttWorkSpace");

  this.workSpace=workSpace;
  this.element = place;
  this.numOfVisibleRows=Math.ceil(this.element.height()/this.rowHeight);

  //by default task are coloured by status
  this.element.addClass('colorByStatus' )

  var self = this;
  //load templates
  $("#gantEditorTemplates").loadTemplates().remove();

  //create editor
  this.editor = new GridEditor(this);
  place.append(this.editor.gridified);

  //create gantt
  // console.log('init gantt');
  this.gantt = new Ganttalendar(new Date().getTime() - 3600000 * 24 * 2, new Date().getTime() + 3600000 * 24 * 5, this, place.width() * .6);
  // console.log('init gantt done');
  //setup splitter
  self.splitter = $.splittify.init(place, this.editor.gridified, this.gantt.element, 60);
  self.splitter.firstBoxMinWidth = 5;
  self.splitter.secondBoxMinWidth = 20;


  // Setup the buttons for the plan ------------------------------------------------------------------------------------

  //prepend buttons
  var ganttButtons = $.JST.createFromTemplate({}, "GANTBUTTONS");
  place.before(ganttButtons);
  this.checkButtonPermissions();


  //bindings
  workSpace.bind("deleteFocused.gantt", function (e) {
    //delete task or link?
    var focusedSVGElement=self.gantt.element.find(".focused.focused.linkGroup");
    if (focusedSVGElement.size()>0)
      self.removeLink(focusedSVGElement.data("from"), focusedSVGElement.data("to"));
    else
    self.deleteCurrentTask();
  }).bind("addAboveCurrentTask.gantt", function () {
    self.addAboveCurrentTask();
  }).bind("addBelowCurrentTask.gantt", function () {
    self.addBelowCurrentTask();
  }).bind("indentCurrentTask.gantt", function () {
    self.indentCurrentTask();
  }).bind("outdentCurrentTask.gantt", function () {
    self.outdentCurrentTask();
  }).bind("moveUpCurrentTask.gantt", function () {
    self.moveUpCurrentTask();
  }).bind("moveDownCurrentTask.gantt", function () {
    self.moveDownCurrentTask();
  }).bind("collapseAll.gantt", function () {
    self.collapseAll();
  }).bind("expandAll.gantt", function () {
    self.expandAll();
  }).bind("fullScreen.gantt", function () {
    self.fullScreen();
  }).bind("print.gantt", function () {
    self.print();


  }).bind("zoomPlus.gantt", function () {
    self.gantt.zoomGantt(true);
  }).bind("zoomMinus.gantt", function () {
    self.gantt.zoomGantt(false);

  }).bind("openFullEditor.gantt", function () {
    self.editor.openFullEditor(self.currentTask,false);
  }).bind("openAssignmentEditor.gantt", function () {
    self.editor.openFullEditor(self.currentTask,true);
  }).bind("addIssue.gantt", function () {
    self.addIssue();
  }).bind("openExternalEditor.gantt", function () {
    self.openExternalEditor();

  }).bind("undo.gantt", function () {
    self.undo();
  }).bind("redo.gantt", function () {
    self.redo();
  }).bind("resize.gantt", function () {
    self.resize();
  });


  //bind editor scroll
  self.splitter.firstBox.scroll(function () {

    //notify scroll to editor and gantt
    self.gantt.element.stopTime("test").oneTime(10, "test", function () {
      var oldFirstRow = self.firstScreenLine;
      var newFirstRow = Math.floor(self.splitter.firstBox.scrollTop() / self.rowHeight);
      if (Math.abs(oldFirstRow - newFirstRow) >= self.rowBufferSize) {
        self.firstScreenLine = newFirstRow;
        self.scrolled(oldFirstRow);
      }
    });
  });


  //keyboard management bindings
  $("body").bind("keydown.body", function (e) {
    //console.debug(e.keyCode+ " "+e.target.nodeName, e.ctrlKey)

    var eventManaged = true;
    var isCtrl = e.ctrlKey || e.metaKey;
    var bodyOrSVG = e.target.nodeName.toLowerCase() == "body" || e.target.nodeName.toLowerCase() == "svg";
    var inWorkSpace=$(e.target).closest("#TWGanttArea").length>0;

    //store focused field
    var focusedField=$(":focus");
    var focusedSVGElement = self.gantt.element.find(".focused.focused");// orrible hack for chrome that seems to keep in memory a cached object

    var isFocusedSVGElement=focusedSVGElement.length >0;

    if ((inWorkSpace ||isFocusedSVGElement) && isCtrl && e.keyCode == 37) { // CTRL+LEFT on the grid
      self.outdentCurrentTask();
      focusedField.focus();

    } else if (inWorkSpace && isCtrl && e.keyCode == 38) { // CTRL+UP   on the grid
      self.moveUpCurrentTask();
      focusedField.focus();

    } else if (inWorkSpace && isCtrl && e.keyCode == 39) { //CTRL+RIGHT  on the grid
      self.indentCurrentTask();
      focusedField.focus();

    } else if (inWorkSpace && isCtrl && e.keyCode == 40) { //CTRL+DOWN   on the grid
      self.moveDownCurrentTask();
      focusedField.focus();

    } else if (isCtrl && e.keyCode == 89) { //CTRL+Y
      self.redo();

    } else if (isCtrl && e.keyCode == 90) { //CTRL+Y
      self.undo();


    } else if ( (isCtrl && inWorkSpace) &&   (e.keyCode == 8 || e.keyCode == 46)  ) { //CTRL+DEL CTRL+BACKSPACE  on grid
      self.deleteCurrentTask();

    } else if ( focusedSVGElement.is(".taskBox") &&   (e.keyCode == 8 || e.keyCode == 46)  ) { //DEL BACKSPACE  svg task
        self.deleteCurrentTask();

    } else if ( focusedSVGElement.is(".linkGroup") &&   (e.keyCode == 8 || e.keyCode == 46)  ) { //DEL BACKSPACE  svg link
        self.removeLink(focusedSVGElement.data("from"), focusedSVGElement.data("to"));

    } else {
      eventManaged=false;
    }


    if (eventManaged) {
      e.preventDefault();
      e.stopPropagation();
    }

  });

  //ask for comment input
  $("#saveGanttButton").after($('#LOG_CHANGES_CONTAINER'));

  //ask for comment management
  //TODO: This was commented out to try and understand error - need to understand why!
  //this.element.on("saveRequired.gantt",this.manageSaveRequired);


  //resize
  $(window).resize(function () {
    place.css({width: "100%", height: $(window).height() - place.position().top});
    place.trigger("resize.gantt");
  }).oneTime(2, "resize", function () {$(window).trigger("resize")});


};

/**
 * The `GanttMaster.messages` object contains a collection of localized messages or strings
 * typically used for internationalization and user interface text in the GanttMaster library.
 * These messages can be used for displaying prompts, alerts, confirmations, or any other
 * user-facing text, and allow for easy customization and translation.
 */
GanttMaster.messages = {
  "CANNOT_WRITE":                          "CANNOT_WRITE",
  "CHANGE_OUT_OF_SCOPE":                   "NO_RIGHTS_FOR_UPDATE_PARENTS_OUT_OF_EDITOR_SCOPE",
  "START_IS_MILESTONE":                    "START_IS_MILESTONE",
  "END_IS_MILESTONE":                      "END_IS_MILESTONE",
  "TASK_HAS_CONSTRAINTS":                  "TASK_HAS_CONSTRAINTS",
  "GANTT_ERROR_DEPENDS_ON_OPEN_TASK":      "GANTT_ERROR_DEPENDS_ON_OPEN_TASK",
  "GANTT_ERROR_DESCENDANT_OF_CLOSED_TASK": "GANTT_ERROR_DESCENDANT_OF_CLOSED_TASK",
  "TASK_HAS_EXTERNAL_DEPS":                "TASK_HAS_EXTERNAL_DEPS",
  "GANTT_ERROR_LOADING_DATA_TASK_REMOVED": "GANTT_ERROR_LOADING_DATA_TASK_REMOVED",
  "CIRCULAR_REFERENCE":                    "CIRCULAR_REFERENCE",
  "CANNOT_MOVE_TASK":                      "CANNOT_MOVE_TASK",
  "CANNOT_DEPENDS_ON_ANCESTORS":           "CANNOT_DEPENDS_ON_ANCESTORS",
  "CANNOT_DEPENDS_ON_DESCENDANTS":         "CANNOT_DEPENDS_ON_DESCENDANTS",
  "INVALID_DATE_FORMAT":                   "INVALID_DATE_FORMAT",
  "GANTT_SEMESTER_SHORT":                  "GANTT_SEMESTER_SHORT",
  "GANTT_SEMESTER":                        "GANTT_SEMESTER",
  "GANTT_QUARTER_SHORT":                   "GANTT_QUARTER_SHORT",
  "GANTT_QUARTER":                         "GANTT_QUARTER",
  "GANTT_WEEK":                            "GANTT_WEEK",
  "GANTT_WEEK_SHORT":                      "GANTT_WEEK_SHORT",
  "CANNOT_CLOSE_TASK_IF_OPEN_ISSUE":       "CANNOT_CLOSE_TASK_IF_OPEN_ISSUE",
  "PLEASE_SAVE_PROJECT":                   "PLEASE_SAVE_PROJECT",
  "CANNOT_CREATE_SAME_LINK":               "CANNOT_CREATE_SAME_LINK"
};

//TODO: Needs the id to come from the PostgreSQL database - sort out in the TaskFactory rather than here
//TODO: Ensure the project ID is past across so task is created in the right project
/**
 * Creates a new task and attaches it to the project structure.
 *
 * @param {string} name - The name of the task to be created.
 * @param {Date} start - The starting date of the task.
 * @param {number} duration - The duration of the task in project units (e.g., days).
 * @returns {Task} The created task object with updated project task list and hierarchy.
 */
GanttMaster.prototype.createTask = function (name, code, level, start, duration) {
  //Connect to the seaview database and get an id for
  var factory = new TaskFactory();
  return factory.build(id, name, code, level, start, duration);
};

/** TODO: Connect this up with the database to ensure that only the correct resources are used
 * Don't want this to allow the creation of many resources
 */
/**
 * Retrieves an existing resource from the resource list based on its name.
 * If the resource with the specified name does not exist in the list,
 * this method creates a new resource, adds it to the resource list,
 * and returns the newly created resource object.
 *
 * @param {string} resourceName - The name of the resource to retrieve or create.
 * @returns {object} The retrieved or newly created resource object.
 */
GanttMaster.prototype.getOrCreateResource = function (id, name) {
  var res= this.getResource(id);
  if (!res && id && name) {
    res = this.createResource(name);
  }
  return res
};

/**
 * Creates a new resource and adds it to the project's resource list.
 * The new resource is assigned a unique ID and initialized with the provided name.
 *
 * @param {string} resourceName - The name of the resource to be created.
 * @returns {object} The newly created resource object, containing an ID and name.
 */
GanttMaster.prototype.createResource = function (name) {
  var id = addBlankResource();
  var res = new Resource(id, name);
  this.resources.push(res);
  return res;
};


//update depends strings
/**
 * Updates the dependency strings for all tasks in the Gantt chart.
 * This method iterates over each task in the project and recalculates
 * the dependency strings, which represent the relationships between tasks.
 * Dependencies are encoded to reflect the task's predecessors and constraints.
 *
 * The updated dependency strings are stored in each task's "depends" property.
 * Ensures that all dependencies are consistent with the current project structure.
 */
GanttMaster.prototype.updateDependsStrings = function () {
  //remove all deps
  for (var i = 0; i < this.tasks.length; i++) {
    this.tasks[i].depends = "";
  }

  for (var i = 0; i < this.links.length; i++) {
    var link = this.links[i];
    var dep = link.to.depends;
    link.to.depends = link.to.depends + (link.to.depends == "" ? "" : ",") + (link.from.getRow() + 1) + (link.lag ? ":" + link.lag : "");
  }

};

/**
 * Removes a link from the current Gantt project by its ID.
 *
 * This method deletes a specified link from the internal array of links in the Gantt master data.
 * It performs the removal by matching the supplied link ID.
 * If the link is successfully removed, it triggers a refresh of the task grid and the Gantt chart.
 * If the provided link ID is invalid or not found, the method does nothing.
 *
 * @param {string} linkId - The unique identifier of the link to be removed.
 */
GanttMaster.prototype.removeLink = function (fromTask, toTask) {
  //console.debug("removeLink");
  if (!this.permissions.canWrite || (!fromTask.canWrite && !toTask.canWrite))
    return;

  this.beginTransaction();
  var found = false;
  for (var i = 0; i < this.links.length; i++) {
    if (this.links[i].from == fromTask && this.links[i].to == toTask) {
      this.links.splice(i, 1);
      found = true;
      break;
    }
  }

  if (found) {
    this.updateDependsStrings();
    if (this.updateLinks(toTask))
      this.changeTaskDates(toTask, toTask.start, toTask.end); // fake change to force date recomputation from dependencies
  }
  this.endTransaction();
};

/**
 * Removes all links from the current project by clearing the links array
 * and resetting the dependencies for all tasks in the task list.
 * Iterates through the task list and sets the 'depends' property of each
 * task to an empty string, ensuring that no dependencies remain after
 * this operation.
 */
GanttMaster.prototype.__removeAllLinks = function (task, openTrans) {

  if (openTrans)
    this.beginTransaction();
  var found = false;
  for (var i = 0; i < this.links.length; i++) {
    if (this.links[i].from == task || this.links[i].to == task) {
      this.links.splice(i, 1);
      found = true;
    }
  }

  if (found) {
    this.updateDependsStrings();
  }
  if (openTrans)
    this.endTransaction();
};

//------------------------------------  ADD TASK --------------------------------------------
//TODO: Add in request to PostgreSQL to create new task and receiving back the unique task ID
//TODO: Write task update function that will be used in multiple methods (probably best in ganttTask.js)
/**
 * Adds a new task to the Gantt chart.
 *
 * This method is used to add a task to the project's task hierarchy.
 * It ensures that the new task is properly linked to the specified parent task
 * if provided, and updates the task dependencies and project timeline accordingly.
 *
 * @param {Task} task - The task object to be added. It should contain properties
 *                      such as id, name, start date, duration, and dependencies.
 * @param {number} [parentId] - The ID of the parent task, if the new task is a subtask.
 *                              If no parentId is provided, the task is added as a root task.
 * @throws {Error} Throws an error if the task object is invalid or if adding the task
 *                 violates project constraints.
 * @returns {boolean} Returns true if the task is successfully added, otherwise false.
 */
GanttMaster.prototype.addTask = function (task, row) {
  //console.debug("master.addTask",task,row,this);

  task.master = this; // in order to access controller from task

  //replace if already exists
  var pos = -1;
  for (var i = 0; i < this.tasks.length; i++) {
    if (task.id == this.tasks[i].id) {
      pos = i;
      break;
    }
  }

  if (pos >= 0) {
    this.tasks.splice(pos, 1);
    row = parseInt(pos);
  }

  //add task in collection
  if (typeof(row) != "number") {
    this.tasks.push(task);
  } else {
    this.tasks.splice(row, 0, task);

    //recompute depends string
    this.updateDependsStrings();
  }

  //add Link collection in memory
  var linkLoops = !this.updateLinks(task);

  //set the status according to parent
  if (task.getParent())
    task.status = task.getParent().status;
  else
    task.status = "STATUS_ACTIVE";

  var ret = task;
  if (linkLoops || !task.setPeriod(task.start, task.end)) {
    //remove task from in-memory collection
    //console.debug("removing task from memory",task);
    this.tasks.splice(task.getRow(), 1);
    ret = undefined;
  } else {
    //append task to editor
    this.editor.addTask(task, row);
    //append task to gantt
    this.gantt.addTask(task);
  }

//trigger addedTask event 
  $(this.element).trigger("addedTask.gantt", task);
  return ret;
};

/* EF connection to the PostgreSQL database */

/**
 * Loads a project from the database into the GanttMaster instance.
 *
 * This function fetches project data from the database and initializes the GanttMaster instance
 * with tasks, resources, roles, and user permissions. It sets up all the necessary configurations
 * to render a Gantt chart with the loaded project. The method ensures compatibility between
 * database-stored data and the Gantt chart by processing and adjusting it appropriately.
 *
 * @async
 * @param {number} projectId - The unique identifier of the project to be loaded from the database.
 * @param {number} userID - The unique identifier of the user requesting the project data.
 *
 * @throws {Error} Throws an error if the project data cannot be retrieved, or if an unexpected error occurs during the process.
 *
 * @returns {Promise<boolean>} Returns true if the project is successfully loaded, otherwise false.
 *
 * Functionality:
 * 1. Starts a database transaction to ensure consistency while data is being loaded.
 * 2. Fetches project details from the database, including tasks, resources, and permissions.
 * 3. Adjusts the server-client time offset to maintain consistent scheduling.
 * 4. Loads and maps resources and roles from the database into the GanttMaster instance.
 * 5. Configures permissions for the currently loaded project, enabling or restricting user actions based on their role.
 * 6. Sets task boundaries and adjusts the Gantt chart's zoom level for optimal view.
 * 7. Recovers and applies previously collapsed task states if applicable.
 * 8. Centers the Gantt chart on today's date for better task tracking and visualization.
 *
 * Database Dependencies:
 * - `getProjectJSON`: Retrieves the project JSON data from the database.
 * - `getResourcesList`: Fetches the list of resources associated with the project.
 * - `getEnumerationTable`: Retrieves role data based on a specific type (e.g., resource type).
 */
GanttMaster.prototype.loadProjectFromDatabase = async function (projectId, userID) {
  try {
    // Begin a new transaction
    this.beginTransaction();

    // Fetch the project JSON from the database using the external function
    // console.log(`Loading project ${projectId} from database and user ${userID}...`);
    // const project = await getProjectJSON(projectId, userID);
    getProjectJSON(projectId, userID).then(project =>  {
      if (!project) {
        throw new Error("Failed to load project data from the database.");
      }
      // console.log(`Project ${projectId} loaded from database.`);
      // console.log('Project: ' + project);
      // Set time offset from the server
      this.serverClientTimeOffset = typeof project.serverTimeOffset !== "undefined"
          ? (parseInt(project.serverTimeOffset) + new Date().getTimezoneOffset() * 60000)
          : 0;

      // Load resources and roles from the project
      // let resourcesFromDB = await getResourcesList();
      getResourcesList().then(resourcesFromDB =>  {
        let localID = 0;
        for (let resource of resourcesFromDB.rows) {
          if (!this.resources[localID]) {
            // If it doesn't exist, create a new object at that index.
            this.resources[localID] = {};
          }
          this.resources[localID].name = resource.name;
          this.resources[localID].id = Number(resource.id);
          this.resources[localID].resourceType = resource.resource_type;
          this.resources[localID].resourceDepartment = resource.resource_department;
          this.resources[localID].email = resource.email;
          this.resources[localID].username = resource.username;
          this.resources[localID].isActive = resource.is_active;
          this.resources[localID].workPattern = [resource.works_on_monday,
            resource.works_on_tuesday,
            resource.works_on_wednesday,
            resource.works_on_thursday,
            resource.works_on_friday,
            resource.works_on_saturday,
            resource.works_on_sunday];
          localID++;
        }

        // Pull in the data for the roles
        // let rolesFromDB = await getEnumerationTable("resourcetype");
        getEnumerationTable("resourcetype").then(rolesFromDB =>  {
          // console.log('rolesFromDB: ' + rolesFromDB);
          let localID = 0;
          for (let role of rolesFromDB) {
            // console.log('role: ' + role.enumlabel);
            if(!this.roles[localID])
            {
              this.roles[localID] = {};
            }
            this.roles[localID].name = role.enumlabel;
            this.roles[localID].id = role.enumsortorder;
            localID++;
          }

          // Apply permissions from the loaded project
          this.permissions.canWrite = project.project.canWrite;
          this.permissions.canAdd = project.project.canAdd;
          this.permissions.canWriteOnParent = project.project.canWriteOnParent;
          this.permissions.cannotCloseTaskIfIssueOpen = project.project.cannotCloseTaskIfIssueOpen;
          this.permissions.canAddIssue = project.project.canAddIssue;
          this.permissions.canDelete = project.project.canDelete;

          // Refresh the button bar based on permissions
          this.checkButtonPermissions();

          // Set editable boundaries
          this.minEditableDate = project.minEditableDate ? computeStart(project.minEditableDate) : -Infinity;
          this.maxEditableDate = project.maxEditableDate ? computeEnd(project.maxEditableDate) : Infinity;

          // Recover stored collapsed states
          const collTasks = this.loadCollapsedTasks();

          //NOTE: Not sure what's going on with this
          // // Adjust task dates and set collapsed status
          // for (const task of project.tasks) {
          //   task.start += this.serverClientTimeOffset;
          //   task.end += this.serverClientTimeOffset;
          //   task.collapsed = collTasks.indexOf(task.id) >= 0;
          // }

          // Load tasks into GanttMaster
          this.loadTasksFromPostgreSQL(projectId).then(() =>
          {
            this.deletedTaskIds = [];
            getProjectUserSetup(projectId, userID).then(projectSetup => {
              // Handle saved zoom level
              console.log('projectSetup - zoom: ' + projectSetup.zoom_level);
              if (projectSetup.zoom_level) {
                // this.gantt.zoom = this.gantt.getZoomLevelIndex(projectSetup.zoom_level);
                this.gantt.zoom = projectSetup.zoom_level;
                console.log('this.gannt - zoom: ' + this.gantt.zoom);
                this.gantt.storeZoomLevel();
                // console.log("+++++++++++> GM Debug 1");
                this.gantt.redraw(); // Redraw the chart now that the zoom level has been set
                // console.log("+++++++++++> GM Debug 2");
                // this.gantt.goToMillis(this,gantt.getCe)
              } else {
                this.gantt.shrinkBoundaries();
                this.gantt.setBestFittingZoom();
              }
              // End the transaction
              this.endTransaction();
              // console.log("++++++++++> GM Debug 3");
              // Center Gantt on today's date
              const self = this;
              this.gantt.element.oneTime(200, () => {
                self.gantt.centerOnToday();
              });
              // console.log("++++++++++> GM Debug 4");
            //   Switch on the task changes tracking
              console.log("Switching on task changes tracking");
              for(let i = 0; i < this.tasks.length; i++)
              {
                this.tasks[i].trackChanges = true;
              }

              this.resetUndoRedoStack();

              
              console.log("Switching on task changes tracking - Done");
            })
          });
        })
      })
    })
    return true;
  } catch (error) {
    console.error("Error loading project from database:", error);
    this.endTransaction();
    return false;
  }
};



function handleTaskChanges(changes)
{
  console.log("*******************Batched Task Changes*****************************:");
  changes.forEach(change => console.log(change));
  console.log("********************************************************************:");
  // changes.forEach(async change => {
  //   await updateTask(change.task.id, change.)
  // });


  // Check if any of the changes have "property" equal to "trackChange"
  const hasTrackChangeProperty = changes.some(change => change.property === "trackChange");
  if (hasTrackChangeProperty) {
    console.log("Track Changes option is being changed - ignore change");
    return false;
  }

  changes.forEach(async change => {
    try {
      // Update the task with the given change

      // Find the task with the matching change.id in this.tasks
      // const targetTask = this.tasks.find(task => task.id === change.id);
      const targetTask = change.task;
      if(!targetTask.trackChanges)
      {
        console.log("Task Change Tracking is off. Skipping task change.");
        return false;
      }
      
      
      console.log("targetTask:",targetTask, " Task Update being logged");
      let userID;
      if (targetTask.master) {
        userID = targetTask.master.userId;
      } else {
        userID = getCookie("SVNT_GANTT_USERID");
      }
      if (!userID) {
        throw new Error("Unable to determine user ID. Ensure that targetTask.master is properly set or the 'SVNT_GANTT_USERID' cookie is available.");
      }
      if (!targetTask) {
        throw new Error(`Task with ID ${change.id} not found in this.tasks.`);
      }
      await updateTask(userID, targetTask);

      // Add the task change
      // await addTaskChange(this.userId, change.id, change);
    } catch (error) {
      console.error(`Error processing change for task ID: ${change.task.id}`, error);
    }
  });
}

/**
 * Asynchronously loads tasks for a given project from PostgreSQL and initializes them in the GanttMaster object.
 * The method sets up tasks, their properties, links, and periods, and adds tasks to editor and Gantt views.
 *
 * @param {number|string} projectID - The unique identifier of the project from which tasks should be loaded.
 * @param {boolean} [activeOnly=true] - If true, only active tasks are loaded; otherwise, both active and inactive tasks are included.
 * @return {Promise<void>} A promise that resolves once the tasks are successfully loaded and initialized.
 */
GanttMaster.prototype.loadTasksFromPostgreSQL = async function(projectID,activeOnly=true)
{

  // console.log('loadTasksFromPostgreSQL');
  // console.log('taskChangeTracking:',taskChangeTracking);
  var factory = new TaskFactory();
  try
  {
    this.reset();
  }
  catch(e)
  {
    console.log('Error resetting GanttMaster:');
    console.log(e);
  }
  /* TODO - Need to update with a cookie based system as a stand in for other look up from other systems that
      require payment
   */
  const userID = await getMyUserID();
  let selectedRow;
  const tasks = await getCombinedProjectTaskDetails(projectID, userID, activeOnly);


  for (let k = 0; k < tasks.rowCount; k++) {
    const task = tasks.rows[k];

    // if (k === 0) {
    //   console.log('taskdata:', task);
    // }

    // Build the task
    const t = factory.build(
        task.id,
        task.title,
        'misc',
        task.hierarchy_level,
        task.start_date,
        task.duration,
        task.collapsed,
        handleTaskChanges
    );

    t.rawPredecessors = task.predecessors;
    t.rawLags = task.lags;
    t.rawResources = task.resources;

    t.status = task.status;
    t.progress = task.progress;

    // Finalize task and add to the master list
    t.master = this;
    this.tasks.push(t);

  }
  // console.log("Test Point 1");
  for(let k = 0; k < this.tasks.length; k++)
  {
    // Fetch task dependencies
    // const dependencies = await getTaskDependencies(this.tasks[k].id);
    // const taskResource = await getTaskResources(this.tasks[k].id);
    const dependencies = this.tasks[k].rawPredecessors;
    const lags = this.tasks[k].rawLags;
    const taskResource = this.tasks[k].rawResources;
    delete this.tasks[k].rawPredecessors;
    delete this.tasks[k].rawLags;
    delete this.tasks[k].rawResources;
    // console.log('taskResource:', taskResource);

    // Process dependencies
    if (dependencies && dependencies[0] !== -1)
    {
      let deps = '';
      for (let j = 0; j < dependencies.length; j++) {
        deps += dependencies[j] +
            (j === dependencies.length - 1 ? '' : ',');
      }
      this.tasks[k].depends = deps;

      // Add a new link to the this.links array based on dependencies
      for (let j = 0; j < dependencies.length; j++) {
        const predecessorId = dependencies[j];
        const successorId = this.tasks[k].id;

        let fromTask = this.tasks.find(task => (task.id === predecessorId));
        let toTask = this.tasks.find(task => (task.id === successorId));
        let lag = lags[j];

        // console.log('fromTask:', fromTask);
        // console.log('toTask:', toTask);
        // console.log('fromTask.id:', fromTask.id);
        // console.log('toTask.id:', toTask.id);

        if (fromTask && toTask) {
          // Create a new link object and add it to the this.links array
          const link = {
            id: `${fromTask.id}_${toTask.id}`,
            from: fromTask,
            to: toTask,
            lag: lag
          };

          // console.log('link:', link);
          // this.links = this.links || [];
          this.links.push(link);
        } else {
          console.warn(
              `Could not create link: From task (ID: ${predecessorId}) or To task (ID: ${successorId}) not found.`
          );
        }
      }
    } else {
      this.tasks[k].depends = '';
    }

    this.tasks[k].assigs = [];
    if(taskResource.length > 0 && this.roles.length > 0)
    {
      for(let j = 0; j < taskResource.length; j++)
      {
        const resourceID = taskResource[j];


        // Look up the resource type from this.resources based on the taskResource id - 1
        const resourceType = this.resources[resourceID - 1].resourceType;

        if (resourceType)
        {
          // Search the this.roles array for a role matching the resource type
          const role = this.roles.find(role => role.name === resourceType);

          if (role)
          {
            const roleID = role.id;

            const id = 'resId_' + resourceID + '_roleId_' + role.id;
            const effort = this.tasks[k].duration * 3600000 * 24;
            const assig = {resourceId: resourceID, id: id, roleId: roleID, effort: effort};
            this.tasks[k].assigs.push(assig);
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
  }

  console.log("Test Point 2");

  for (var i = 0; i < this.tasks.length; i++)
  {
    var task = this.tasks[i];
    var numOfError = this.__currentTransaction && this.__currentTransaction.errors ? this.__currentTransaction.errors.length : 0;
    if (!task.setPeriod(task.start, task.end))
    {
      alert(GanttMaster.messages.GANNT_ERROR_LOADING_DATA_TASK_REMOVED + "\n" + task.name );
      //remove task from in-memory collection
      this.tasks.splice(task.getRow(), 1);
    } else {
      //append task to editor
      this.editor.addTask(task, null, true);
      //append task to gantt
      this.gantt.addTask(task);
    }
  }
  console.log("Test Point 3");
  //this.editor.fillEmptyLines();
  //prof.stop();

  /* Define default selected row if one is not passed */
  if(!selectedRow)
  {
    selectedRow = 0;
  }
  console.log("Test Point 4");

  // re-select old row if tasks is not empty
  if (this.tasks && this.tasks.length > 0) {
    selectedRow = selectedRow ? selectedRow : 0;
    this.tasks[selectedRow].rowElement.click();
  }
  // taskChangeTracking = true;
  // allowTaskUpdate = true;
  //

  console.log('>>>>>>>>End of task loading <<<<<<<<<<');
  return true;
}

/**
 * Retrieves a task by its unique identifier (ID).
 *
 * @param {string|number} taskId - The ID of the task to be retrieved.
 * @returns {Object|null} The task object if found, or null if no task with the specified ID exists.
 */
GanttMaster.prototype.getTask = function (taskId) {
  var ret;
  for (var i = 0; i < this.tasks.length; i++) {
    var tsk = this.tasks[i];
    if (tsk.id == taskId) {
      ret = tsk;
      break;
    }
  }
  return ret;
};


/**
 * Retrieves a resource object by its unique identifier.
 *
 * @param {number|string} id - The unique identifier of the resource to retrieve.
 * @returns {Object|null} The resource object matching the given id, or null if no resource is found.
 */
GanttMaster.prototype.getResource = function (resId) {
  var ret;
  for (var i = 0; i < this.resources.length; i++) {
    var res = this.resources[i];
    if (res.id == resId) {
      ret = res;
      break;
    }
  }
  return ret;
};


/**
 * Updates the dependencies of a task and triggers the necessary updates in the Gantt chart.
 *
 * @param {Object} task - The task object whose dependencies are to be changed.
 * @param {Array} newDeps - An array of new dependencies for the task. Each dependency is typically represented by the ID of the task it depends on.
 * @returns {void}
 */
GanttMaster.prototype.changeTaskDeps = function (task) {
  return task.moveTo(task.start,false,true);
};

/**
 * Changes the start and/or end dates of a given task.
 *
 * If the new dates are within acceptable limits and do not conflict with project constraints,
 * this method updates the task's start and/or end date and adjusts related attributes such as duration and dependencies.
 *
 * It also triggers updates to child, parent, and dependent tasks based on the changes.
 *
 * @param {Object} task - The task object whose dates need to be changed.
 * @param {Date} start - The new start date for the task.
 * @param {Date} end - The new end date for the task.
 * @returns {boolean} - Returns true if the task dates were successfully changed, false otherwise.
 */
GanttMaster.prototype.changeTaskDates = function (task, start, end) {
  //console.debug("changeTaskDates",task, start, end)
  return task.setPeriod(start, end);
};


/**
 * Moves a task to a new position or within a different structure in the Gantt chart.
 *
 * @param {Task} task - The task to be moved.
 * @param {number} newStart - The new start date for the task, represented as a timestamp.
 * @param {number} [newEnd] - (Optional) The new end date for the task, represented as a timestamp.
 * @returns {boolean} Returns true if the task was successfully moved, otherwise false.
 */
GanttMaster.prototype.moveTask = function (task, newStart) {
  return task.moveTo(newStart, true,true);
};


/**
 * This method is triggered when a task is modified. NOTE: No it doesn't!!!!
 * It handles the changes to a task within the GanttMaster project management system.
 *
 * @param {Object} task - The task object that has been changed.
 */
GanttMaster.prototype.taskIsChanged = function () {
  // console.debug("taskIsChanged");
  var master = this;

  //refresh is executed only once every 50ms
  this.element.stopTime("gnnttaskIsChanged");
  //var profilerext = new Profiler("gm_taskIsChangedRequest");
  this.element.oneTime(50, "gnnttaskIsChanged", function () {
    //console.debug("task Is Changed real call to redraw");
    //var profiler = new Profiler("gm_taskIsChangedReal");
    

    
    master.redraw();
    master.element.trigger("gantt.redrawCompleted");
    //profiler.stop();
  });
  //profilerext.stop();

};


/**
 * Checks and applies permission settings to the buttons in the GanttMaster interface.
 * It iterates over all buttons defined in the Gantt interface and enables or disables them
 * based on the user's permissions specified in the `permissions` object.
 *
 * This method evaluates button permissions dynamically against the corresponding
 * permission keys and adjusts their operability within the user interface.
 *
 * @method
 */
GanttMaster.prototype.checkButtonPermissions = function () {
  var ganttButtons=$(".ganttButtonBar");
  //hide buttons basing on permissions
  if (!this.permissions.canWrite)
    ganttButtons.find(".requireCanWrite").hide();

  if (!this.permissions.canAdd)
    ganttButtons.find(".requireCanAdd").hide();

  if (!this.permissions.canInOutdent)
    ganttButtons.find(".requireCanInOutdent").hide();

  if (!this.permissions.canMoveUpDown)
    ganttButtons.find(".requireCanMoveUpDown").hide();

  if (!this.permissions.canDelete)
    ganttButtons.find(".requireCanDelete").hide();

  if (!this.permissions.canSeeCriticalPath)
    ganttButtons.find(".requireCanSeeCriticalPath").hide();

  if (!this.permissions.canAddIssue)
    ganttButtons.find(".requireCanAddIssue").hide();

};


/**
 * Redraws the Gantt chart interface based on the current data and settings.
 * This method typically triggers a visual update, ensuring the UI reflects
 * any changes made to the task list, dependencies, settings, or other
 * attributes related to the Gantt chart.
 *
 * It is usually called after operations such as modifying tasks,
 * updating dependencies, or resizing columns.
 *
 * The method is responsible for adjusting the graphical representation
 * of tasks, the grid, and any other chart elements to accurately
 * represent the current state of the project.
 */
GanttMaster.prototype.redraw = function () {
  this.editor.redraw();
  this.gantt.redraw();
};

/**
 * Resets the GanttMaster instance to its initial state.
 * This method clears all data, tasks, and dependencies and,
 * if necessary, reinitializes internal structures.
 * It is typically used for restarting or reloading the Gantt chart.
 */
GanttMaster.prototype.reset = function () {
  //console.debug("GanttMaster.prototype.reset");
  this.tasks = [];
  this.links = [];
  this.deletedTaskIds = [];
  if (!this.__inUndoRedo) {
    this.__undoStack = [];
    this.__redoStack = [];
  } else { // don't reset the stacks if we're in an Undo/Redo, but restart the inUndoRedo control
    this.__inUndoRedo = false;
  }
  delete this.currentTask;

  this.editor.reset();
  this.gantt.reset();
};


/**
 * Displays the task editor for the specified task, allowing users to edit its properties.
 * This method is typically called when a task is selected for editing.
 *
 * @param {Task} task - The task object to be edited.
 */
GanttMaster.prototype.showTaskEditor = function (taskId) {
  var task = this.getTask(taskId);
  task.rowElement.find(".edit").click();
};

/**
 * Saves the current project state.
 *
 * This method serializes the project's current state, including tasks, resources, roles, and configurations,
 * into a JSON object. It can be used to persist the project data for storage or transfer.
 *
 * @returns {Object} A JSON object representing the current state of the project, including tasks,
 * resources, dependencies, and other project-related data.
 */
GanttMaster.prototype.saveProject = function () {
  return this.saveGantt(false);
};

/**
 * Saves the current state of the Gantt chart, including all tasks, links, and settings.
 *
 * This method collects the current state of the Gantt chart, serializes it in JSON format,
 * and triggers a save operation to persist the data. It is typically used to ensure
 * that any changes made to the Gantt chart are stored and can be retrieved later.
 *
 * @returns {string} A JSON string representation of the current Gantt chart's state.
 */
GanttMaster.prototype.saveGantt = function (forTransaction) {
  //var prof = new Profiler("gm_saveGantt");
  var saved = [];
  for (var i = 0; i < this.tasks.length; i++) {
    var task = this.tasks[i];
    var cloned = task.clone();

    //shift back to server side timezone
    if (!forTransaction) {
      cloned.start -= this.serverClientTimeOffset;
      cloned.end -= this.serverClientTimeOffset;
    }

    saved.push(cloned);
  }

  var ret = {tasks: saved};
  if (this.currentTask) {
    ret.selectedRow = this.currentTask.getRow();
  }

  ret.deletedTaskIds = this.deletedTaskIds;  //this must be consistent with transactions and undo

  if (!forTransaction) {
    ret.resources = this.resources;
    ret.roles = this.roles;
    ret.canAdd = this.permissions.canAdd;
    ret.canWrite = this.permissions.canWrite;
    ret.canWriteOnParent = this.permissions.canWriteOnParent;
    ret.zoom = this.gantt.zoom;

    //save collapsed tasks on localStorage
    this.storeCollapsedTasks();

    //mark un-changed task and assignments
    this.markUnChangedTasksAndAssignments(ret);

    //si aggiunge il commento al cambiamento di date/status
    ret.changesReasonWhy=$("#LOG_CHANGES").val();

  }

  //prof.stop();
  return ret;
};


/**
 * Marks tasks and assignments as unchanged within the GanttMaster instance.
 * This method is typically used to reset the change state of tasks and
 * assignments after a specific operation has been completed or to prepare
 * them for a change-detection mechanism.
 */
GanttMaster.prototype.markUnChangedTasksAndAssignments=function(newProject){
  //console.debug("markUnChangedTasksAndAssignments");
  //si controlla che ci sia qualcosa di cambiato, ovvero che ci sia l'undo stack
  if (this.__undoStack.length>0){
    var oldProject=JSON.parse(this.__undoStack[0]);
    //si looppano i "nuovi" task
    for (var i=0;i<newProject.tasks.length;i++){
      var newTask=newProject.tasks[i];
      //se è un task che c'erà già
      if (typeof (newTask.id)=="string" && !newTask.id.startsWith("tmp_")){
        //si recupera il vecchio task
        var oldTask;
        for (var j=0;j<oldProject.tasks.length;j++){
          if (oldProject.tasks[j].id==newTask.id){
            oldTask=oldProject.tasks[j];
            break;
          }
        }

        //si controlla se ci sono stati cambiamenti
        var taskChanged=
          oldTask.id != newTask.id ||
          oldTask.code != newTask.code ||
          oldTask.name != newTask.name ||
          oldTask.start != newTask.start ||
          oldTask.startIsMilestone != newTask.startIsMilestone ||
          oldTask.end != newTask.end ||
          oldTask.endIsMilestone != newTask.endIsMilestone ||
          oldTask.duration != newTask.duration ||
          oldTask.status != newTask.status ||
          oldTask.typeId != newTask.typeId ||
          oldTask.relevance != newTask.relevance ||
          oldTask.progress != newTask.progress ||
          oldTask.progressByWorklog != newTask.progressByWorklog ||
          oldTask.description != newTask.description ||
          oldTask.level != newTask.level||
          oldTask.depends != newTask.depends;

        newTask.unchanged=!taskChanged;


        //se ci sono assegnazioni
        if (newTask.assigs&&newTask.assigs.length>0){

          //se abbiamo trovato il vecchio task e questo aveva delle assegnazioni
          if (oldTask && oldTask.assigs && oldTask.assigs.length>0){
            for (var j=0;j<oldTask.assigs.length;j++){
              var oldAssig=oldTask.assigs[j];
              //si cerca la nuova assegnazione corrispondente
              var newAssig;
              for (var k=0;k<newTask.assigs.length;k++){
                if(oldAssig.id==newTask.assigs[k].id){
                  newAssig=newTask.assigs[k];
                  break;
                }
              }

              //se c'è una nuova assig corrispondente
              if(newAssig){
                //si confrontano i valori per vedere se è cambiata
                newAssig.unchanged=
                  newAssig.resourceId==oldAssig.resourceId &&
                  newAssig.roleId==oldAssig.roleId &&
                  newAssig.effort==oldAssig.effort;
              }
            }
          }
        }
      }
    }
  }
};

/**
 * Loads the collapsed state of tasks into the GanttMaster instance.
 * This method iterates through tasks and marks them as collapsed
 * based on a provided array containing the IDs of collapsed tasks.
 *
 * @param {Array<string | number>} collapsedTasks - An array of task IDs representing the tasks that should be marked as collapsed.
 */
GanttMaster.prototype.loadCollapsedTasks = function () {
  var collTasks=[];
  if (localStorage ) {
    if (localStorage.getObject("TWPGanttCollTasks"))
      collTasks = localStorage.getObject("TWPGanttCollTasks");
    return collTasks;
  }
};

/**
 * Stores the IDs of all collapsed tasks in the Gantt chart.
 * Iterates through the list of tasks in the project and records the IDs of tasks that are collapsed (i.e., have their "collapsed" property set to true).
 *
 * @returns {Array<number>} An array containing the IDs of all collapsed tasks.
 */
GanttMaster.prototype.storeCollapsedTasks = function () {
  //console.debug("storeCollapsedTasks");
  if (localStorage) {
    var collTasks;
    if (!localStorage.getObject("TWPGanttCollTasks"))
      collTasks = [];
    else
      collTasks = localStorage.getObject("TWPGanttCollTasks");


    for (var i = 0; i < this.tasks.length; i++) {
      var task = this.tasks[i];

      var pos=collTasks.indexOf(task.id);
      if (task.collapsed){
        if (pos<0)
          collTasks.push(task.id);
      } else {
        if (pos>=0)
          collTasks.splice(pos,1);
      }
    }
    localStorage.setObject("TWPGanttCollTasks", collTasks);
  }
};

// TODO: Adapt the code to use this for defining dependencies - may need to add dependencies on to the task
//  during read in

/**
 * Updates the links between tasks in the Gantt chart.
 * Ensures that task dependencies are correctly aligned and validated.
 *
 * This function iterates over all tasks and updates their link states,
 * recalculating dependencies based on the current task status and relationships.
 *
 * It performs the following actions:
 * - Clears the existing dependencies for each task.
 * - Recomputes the incoming and outgoing links for each task.
 * - Ensures that circular dependencies are not present.
 * - Validates the consistency of links among tasks.
 */
GanttMaster.prototype.updateLinks = function (task) {
  //console.debug("updateLinks",task);
  //var prof= new Profiler("gm_updateLinks");

  // defines isLoop function
  function isLoop(task, target, visited) {
    //var prof= new Profiler("gm_isLoop");
    //console.debug("isLoop :"+task.name+" - "+target.name);
    if (target == task) {
      return true;
    }

    var sups = task.getSuperiors();

    //my parent' superiors are my superiors too
    var p = task.getParent();
    while (p) {
      sups = sups.concat(p.getSuperiors());
      p = p.getParent();
    }

    //my children superiors are my superiors too
    var chs = task.getChildren();
    for (var i = 0; i < chs.length; i++) {
      sups = sups.concat(chs[i].getSuperiors());
    }

    var loop = false;
    //check superiors
    for (var i = 0; i < sups.length; i++) {
      var supLink = sups[i];
      if (supLink.from == target) {
        loop = true;
        break;
      } else {
        if (visited.indexOf(supLink.from.id + "x" + target.id) <= 0) {
          visited.push(supLink.from.id + "x" + target.id);
          if (isLoop(supLink.from, target, visited)) {
            loop = true;
            break;
          }
        }
      }
    }

    //check target parent
    var tpar = target.getParent();
    if (tpar) {
      if (visited.indexOf(task.id + "x" + tpar.id) <= 0) {
        visited.push(task.id + "x" + tpar.id);
        if (isLoop(task, tpar, visited)) {
          loop = true;
        }
      }
    }

    //prof.stop();
    return loop;
  }

  //remove my depends
  this.links = this.links.filter(function (link) {
    return link.to != task;
  });

  var todoOk = true;
  if (task.depends) {

    //cannot depend from an ancestor
    var parents = task.getParents();
    //cannot depend from descendants
    var descendants = task.getDescendant();

    var deps = task.depends.split(",");
    var newDepsString = "";

    var visited = [];
    var depsEqualCheck = [];
    for (var j = 0; j < deps.length; j++) {
      var depString = deps[j]; // in the form of row(lag) e.g. 2:3,3:4,5
      var supStr =depString;
      var lag = 0;
      var pos = depString.indexOf(":");
      if (pos>0){
        supStr=depString.substr(0,pos);
        var lagStr=depString.substr(pos+1);
        lag=Math.ceil((stringToDuration(lagStr)) / Date.workingPeriodResolution) * Date.workingPeriodResolution;
      }

      var sup = this.tasks[parseInt(supStr)-1];

      if (sup) {
        if (parents && parents.indexOf(sup) >= 0) {
          this.setErrorOnTransaction("\""+task.name + "\"\n" + GanttMaster.messages.CANNOT_DEPENDS_ON_ANCESTORS + "\n\"" + sup.name+"\"");
          todoOk = false;

        } else if (descendants && descendants.indexOf(sup) >= 0) {
          this.setErrorOnTransaction("\""+task.name + "\"\n" + GanttMaster.messages.CANNOT_DEPENDS_ON_DESCENDANTS + "\n\"" + sup.name+"\"");
          todoOk = false;

        } else if (isLoop(sup, task, visited)) {
          todoOk = false;
          this.setErrorOnTransaction(GanttMaster.messages.CIRCULAR_REFERENCE + "\n\"" + task.id +" - "+ task.name + "\" -> \"" + sup.id +" - "+sup.name+"\"");

        } else if(depsEqualCheck.indexOf(sup)>=0) {
          this.setErrorOnTransaction(GanttMaster.messages.CANNOT_CREATE_SAME_LINK + "\n\"" + sup.name+"\" -> \""+task.name+"\"");
          todoOk = false;

        } else {
          this.links.push(new Link(sup, task, lag));
          newDepsString = newDepsString + (newDepsString.length > 0 ? "," : "") + supStr+(lag==0?"":":"+durationToString(lag));
        }

        if (todoOk)
          depsEqualCheck.push(sup);
      }
    }
    task.depends = newDepsString;
  }
  //prof.stop();

  return todoOk;
};


/**
 * Moves the currently selected task up in the task list.
 * This action adjusts the position of the current task in the hierarchy to place it before its preceding sibling.
 * The method ensures that task dependencies and the project's structure remain valid after the task is moved.
 * If the current task is at the top of the list or unable to be moved, no changes will occur.
 * The method triggers necessary events to update the UI and notify other components of the change.
 */
GanttMaster.prototype.moveUpCurrentTask = function () {
  var self = this;
  //console.debug("moveUpCurrentTask",self.currentTask)
  if (self.currentTask) {
    if (!(self.permissions.canWrite  || self.currentTask.canWrite) || !self.permissions.canMoveUpDown )
    return;

    self.beginTransaction();
    self.currentTask.moveUp();
    self.endTransaction();
  }
};

/**
 * Moves the currently selected task down in the task list.
 * This function adjusts the task's position and updates the task's dependencies
 * while ensuring data consistency and UI updates.
 *
 * Preconditions:
 * - A task must be selected as the current task.
 * - The current task must not already be the last task in the list.
 *
 * Postconditions:
 * - The current task is moved to the next position in the task list.
 * - Dependencies between tasks are maintained after the move.
 * - The user interface is refreshed to reflect the updated task order.
 *
 * Throws:
 * - Throws an error if no task is selected or if the operation violates task constraints.
 */
GanttMaster.prototype.moveDownCurrentTask = function () {
  var self = this;
  //console.debug("moveDownCurrentTask",self.currentTask)
  if (self.currentTask) {
    if (!(self.permissions.canWrite  || self.currentTask.canWrite) || !self.permissions.canMoveUpDown )
    return;

    self.beginTransaction();
    self.currentTask.moveDown();
    self.endTransaction();
  }
};

/**
 * Outdents the currently selected task in the Gantt chart.
 *
 * The method decreases the task's indentation level, effectively moving it up
 * one level in the task hierarchy, provided the current task can be outdented.
 * If the task cannot be outdented (e.g., it is already at the top level), no changes
 * are made.
 *
 * The parent-child relationship of tasks is updated, and the task's position in
 * the hierarchy is adjusted in accordance with the outdenting operation.
 */
GanttMaster.prototype.outdentCurrentTask = function () {
  var self = this;
  if (self.currentTask) {
    var par = self.currentTask.getParent();
    //can outdent if you have canRight on current task and on its parent and canAdd on grandfather
    if (!self.currentTask.canWrite || !par.canWrite || !par.getParent() || !par.getParent().canAdd)
    return;

    self.beginTransaction();
    self.currentTask.outdent();
    self.endTransaction();

    //[expand]
    if (par) self.editor.refreshExpandStatus(par);
  }
};

/**
 * Indents the currently selected task in the Gantt chart hierarchy.
 * This operation shifts the current task to become a child of its immediate preceding sibling,
 * provided the hierarchy allows such an operation. The method updates the task's structure,
 * recalculates dependencies, and adjusts related task properties.
 *
 * If the operation is not feasible (e.g., there is no immediate preceding sibling or
 * the task hierarchy does not allow indentation), the method does not perform the action.
 *
 * Related changes triggered by this action include:
 * - Updating the parent-child relationship for the current task and its siblings.
 * - Recalculating the scheduling constraints and dependencies for all affected tasks.
 * - Adjusting the task hierarchy and visualization accordingly in the Gantt chart interface.
 *
 * Preconditions:
 * - A task must be selected as the current task.
 * - The selected task must have an immediate preceding sibling eligible for parent-child restructuring.
 *
 * Postconditions:
 * - The selected task becomes a child of its immediate preceding sibling if the operation
 *   is valid.
 * - Task relationships, constraints, and the overall structure are updated in the Gantt chart.
 */
GanttMaster.prototype.indentCurrentTask = function () {
  var self = this;
  if (self.currentTask) {

    //can indent if you have canRight on current and canAdd on the row above
    var row = self.currentTask.getRow();
    if (!self.currentTask.canWrite || row <= 0 || !self.tasks[row - 1].canAdd)
    return;

    self.beginTransaction();
    self.currentTask.indent();
    self.endTransaction();
  }
};

/**
 * Adds a new task below the currently selected task in the Gantt chart.
 * The new task will be created as a sibling task of the currently selected task.
 *
 * If no task is currently selected, this method will not perform any action.
 * If the currently selected task is a root-level task, the new task will also
 * be created as a root-level task.
 *
 * This method updates the task list and the Gantt chart display accordingly.
 *
 * Preconditions:
 * - A current task must be selected to perform this operation.
 *
 * Side Effects:
 * - Modifies the task list by adding a new task.
 * - Re-renders the Gantt chart to include the new task.
 */
GanttMaster.prototype.addBelowCurrentTask = function () {
  var self = this;
  //console.debug("addBelowCurrentTask",self.currentTask)
  var factory = new TaskFactory();
  var ch;
  var row = 0;
  if (self.currentTask && self.currentTask.name) {
    //add below add a brother if current task is not already a parent
    var addNewBrother = !(self.currentTask.isParent() || self.currentTask.level==0);

    var canAddChild=self.currentTask.canAdd;
    var canAddBrother=self.currentTask.getParent() && self.currentTask.getParent().canAdd;

    //if you cannot add a brother you will try to add a child
    addNewBrother=addNewBrother&&canAddBrother;

    if (!canAddBrother && !canAddChild)
        return;


    ch = factory.build("tmp_" + new Date().getTime(), "", "", self.currentTask.level+ (addNewBrother ?0:1), self.currentTask.start, 1);
    row = self.currentTask.getRow() + 1;

    if (row>0) {
      self.beginTransaction();
      var task = self.addTask(ch, row);
      if (task) {
        task.rowElement.click();
        task.rowElement.find("[name=name]").focus();
      }
      self.endTransaction();
    }
  }
};

/**
 * Adds a new task above the currently selected task in the Gantt chart.
 *
 * This method creates a new task, sets the appropriate hierarchical level,
 * links it with the sibling tasks, and places it immediately above the selected task.
 * It automatically adjusts the position of the existing tasks as needed.
 *
 * Preconditions:
 * - A task must be currently selected in the Gantt chart.
 * - The task hierarchy and dependencies will be updated accordingly.
 *
 * Effects:
 * - The new task is added directly above the selected task.
 * - The Gantt chart is updated to reflect the new task placement.
 * - Task numbering and hierarchical relationships are adjusted.
 *
 * @throws {Error} Throws an error if no task is selected or if the operation fails.
 */
GanttMaster.prototype.addAboveCurrentTask = function () {
  var self = this;
  // console.debug("addAboveCurrentTask",self.currentTask)

  //check permissions
  if ((self.currentTask.getParent() && !self.currentTask.getParent().canAdd) )
    return;

  var factory = new TaskFactory();

  var ch;
  var row = 0;
  if (self.currentTask  && self.currentTask.name) {
    //cannot add brothers to root
    if (self.currentTask.level <= 0)
      return;

    ch = factory.build("tmp_" + new Date().getTime(), "", "", self.currentTask.level, self.currentTask.start, 1);
    row = self.currentTask.getRow();

    if (row > 0) {
      self.beginTransaction();
      var task = self.addTask(ch, row);
      if (task) {
        task.rowElement.click();
        task.rowElement.find("[name=name]").focus();
      }
      self.endTransaction();
    }
  }
};

/**
 * Deletes the currently selected task from the Gantt chart.
 * If the current task is a parent, its children will also be removed.
 * Performs necessary updates to maintain the integrity of the task dependency structure.
 * This operation cannot be undone.
 *
 * Preconditions:
 * - A task must be selected for this method to execute.
 *
 * Postconditions:
 * - The selected task and its dependencies are removed.
 * - Parent or sibling tasks are updated accordingly to reflect the deletion.
 *
 * Throws:
 * - An error if no task is currently selected.
 */
GanttMaster.prototype.deleteCurrentTask = function (taskId) {
  //console.debug("deleteCurrentTask",this.currentTask , this.isMultiRoot)
  var self = this;

  var task;
  if (taskId)
    task=self.getTask(taskId);
  else
    task=self.currentTask;

  if (!task || !self.permissions.canDelete && !task.canDelete)
    return;

  var taskIsEmpty=task.name=="";

  var row = task.getRow();
  if (task && (row > 0 || self.isMultiRoot || task.isNew()) ) {
    var par = task.getParent();
    self.beginTransaction();
    task.deleteTask();
    task = undefined;

    //recompute depends string
    self.updateDependsStrings();

    //redraw
    self.taskIsChanged();

    //[expand]
    if (par)
      self.editor.refreshExpandStatus(par);


    //focus next row
    row = row > self.tasks.length - 1 ? self.tasks.length - 1 : row;
    if (!taskIsEmpty && row >= 0) {
      task = self.tasks[row];
      task.rowElement.click();
      task.rowElement.find("[name=name]").focus();
    }
    self.endTransaction();
  }
};


GanttMaster.prototype.highlightTask = function (taskId) {

  if (!taskId) return;

  var self = this;
  var task = self.getTask(taskId);

  if (!task) return;

  // Scroll the task into view and center it
  var taskElement = task.rowElement;
  if (taskElement && taskElement.length) {
    self.scrollToTask(task);
  }

  // Highlight the task
  taskElement.addClass("highlighted");

  // Ensure task is selected visually
  task.rowElement.click();
  this.redraw();
}

/**
 * Scrolls the Gantt chart to bring the specified task into view.
 * Ensures that the task is centered within the visible area of the chart.
 *
 * @param {Object} task - The task object to scroll to.
 */
GanttMaster.prototype.scrollToTask = function (task) {
  if (!task || !task.rowElement) return;

  var taskElement = task.rowElement; // The DOM element representing the task row
  var container = this.workSpace; // The container holding the Gantt chart

  if (!container || !container.length) return;

  // Get the position of the task element relative to the container
  var containerOffset = container.offset().top;
  var taskOffset = taskElement.offset().top;

  // Calculate the scroll position to center the task in the container
  var containerHeight = container.height();
  var taskHeight = taskElement.outerHeight();
  var scrollPosition = container.scrollTop() + (taskOffset - containerOffset) - (containerHeight / 2) + (taskHeight / 2);

  // Smoothly scroll to the calculated position
  container.animate({scrollTop: scrollPosition}, 300);
};



/**
 * Collapses all tasks in the Gantt chart.
 * This method iterates over all tasks in the project and sets their collapsed property to true.
 * The method then refreshes the graphical elements of the Gantt chart
 * to reflect the collapsed state of all tasks.
 */
GanttMaster.prototype.collapseAll = function () {
  //console.debug("collapseAll");
  if (this.currentTask){
    this.currentTask.collapsed=true;
    var desc = this.currentTask.getDescendant();
    for (var i=0; i<desc.length; i++) {
      if (desc[i].isParent()) // set collapsed only if is a parent
        desc[i].collapsed = true;
      desc[i].rowElement.hide();
    }

    this.redraw();

    //store collapse statuses
    this.storeCollapsedTasks();
  }
};

/**
 * Toggles the GanttMaster application to full-screen mode.
 * Adjusts the Gantt chart's size and display configuration for improved visibility
 * when operating in a full-screen environment.
 */
GanttMaster.prototype.fullScreen = function () {
  //console.debug("fullScreen");
  this.workSpace.toggleClass("ganttFullScreen").resize();
  $("#fullscrbtn .teamworkIcon").html(this.workSpace.is(".ganttFullScreen")?"€":"@");
};


/**
 * Expands all collapsed tasks in the Gantt chart.
 * Ensures that all tasks within the chart are visible by setting their visibility property.
 * Iterates through each task in the GanttMaster's task list and checks its collapsed state.
 * If a task is marked as collapsed, its state is updated to expanded.
 * After updating the collapsible states of all tasks, the Gantt chart UI is re-rendered
 * to reflect the expanded tasks.
 */
GanttMaster.prototype.expandAll = function () {
  //console.debug("expandAll");
  if (this.currentTask){
    this.currentTask.collapsed=false;
    var desc = this.currentTask.getDescendant();
    for (var i=0; i<desc.length; i++) {
      desc[i].collapsed = false;
      desc[i].rowElement.show();
    }

    this.redraw();

    //store collapse statuses
    this.storeCollapsedTasks();

  }
};



/**
 * Collapses the tasks in the Gantt chart, grouping them visually to display only the higher-level summary tasks.
 * This method hides the details of subtasks under their parent task.
 * Typically used to improve readability of the Gantt chart by reducing on-screen clutter.
 */
GanttMaster.prototype.collapse = function (task, all) {
  //console.debug("collapse",task)
  task.collapsed=true;
  task.rowElement.addClass("collapsed");

  var descs = task.getDescendant();
  for (var i = 0; i < descs.length; i++)
    descs[i].rowElement.hide();

  this.redraw();

  //store collapse statuses
  this.storeCollapsedTasks();
};


/**
 * Expands the task row at the specified task index.
 * This function updates the visibility of subtasks for the given task, making child tasks visible in the Gantt chart.
 * It updates the task visibility status and triggers the rendering of the chart to reflect the changes.
 *
 * @param {number} taskIndex - The index of the task in the Gantt chart that needs to be expanded.
 */
GanttMaster.prototype.expand = function (task,all) {
  //console.debug("expand",task)
  task.collapsed=false;
  task.rowElement.removeClass("collapsed");

  var collapsedDescendant = this.getCollapsedDescendant();
  var descs = task.getDescendant();
  for (var i = 0; i < descs.length; i++) {
    var childTask = descs[i];
    if (collapsedDescendant.indexOf(childTask) >= 0) continue;
    childTask.rowElement.show();
  }

  this.redraw();

  //store collapse statuses
  this.storeCollapsedTasks();

};


/**
 * Recursively collects a list of task IDs for all descendant tasks
 * that are marked as collapsed under a specific task.
 *
 * @param {Object} task - The parent task from which to retrieve collapsed descendants.
 * @returns {Array<number>} An array of task IDs representing all collapsed descendant tasks.
 */
GanttMaster.prototype.getCollapsedDescendant = function () {
  var allTasks = this.tasks;
  var collapsedDescendant = [];
  for (var i = 0; i < allTasks.length; i++) {
    var task = allTasks[i];
    if (collapsedDescendant.indexOf(task) >= 0) continue;
    if (task.collapsed) collapsedDescendant = collapsedDescendant.concat(task.getDescendant());
  }
  return collapsedDescendant;
}




/**
 * Adds a new issue to the Gantt chart system.
 *
 * @function
 * @name GanttMaster.prototype.addIssue
 * @param {Object} issue - The issue object to be added.
 * @param {string} issue.id - The unique identifier of the issue.
 * @param {string} issue.name - The name or title of the issue.
 * @param {string} issue.description - A detailed description of the issue.
 * @param {string} issue.type - The type or category of the issue (e.g., bug, task, etc.).
 * @param {Date} issue.startDate - The start date of the issue.
 * @param {Date} issue.endDate - The end date or deadline for the issue.
 * @param {string} [issue.assignee] - The person or team assigned to handle the issue (optional).
 * @param {string} [issue.priority] - The priority level of the issue, such as low, medium, or high (optional).
 * @returns {boolean} Returns true if the issue was successfully added, otherwise false.
 */
GanttMaster.prototype.addIssue = function () {
  var self = this;

  if (self.currentTask && self.currentTask.isNew()){
    alert(GanttMaster.messages.PLEASE_SAVE_PROJECT);
    return;
  }
  if (!self.currentTask || !self.currentTask.canAddIssue)
    return;

  openIssueEditorInBlack('0',"AD","ISSUE_TASK="+self.currentTask.id);
};

/**
 * Opens an external editor for the currently selected task in the Gantt chart.
 * This method is designed to invoke an external application or editor for further
 * customization or advanced editing of the selected task.
 *
 * Preconditions:
 * - There must be a task currently selected in the Gantt chart.
 * - The initialization of the GanttMaster instance has been completed.
 *
 * Behavior:
 * - Retrieves the currently selected task.
 * - Sends the task details to an external editor or triggers an external process.
 *
 * Guidelines for implementation:
 * - Ensure communication with the external editor is properly configured.
 * - Handle cases where no task is selected gracefully, with appropriate error handling/logging.
 * - Maintain data integrity and prevent conflicts when returning from the external editor.
 *
 * Note: The configuration for the external editor (if required) should be handled separately.
 */
GanttMaster.prototype.openExternalEditor = function () {
  //console.debug("openExternalEditor ")
  var self = this;
  if (!self.currentTask)
    return;

  if (self.currentTask.isNew()){
    alert(GanttMaster.messages.PLEASE_SAVE_PROJECT);
    return;
  }

  //window.location.href=contextPath+"/applications/teamwork/task/taskEditor.jsp?CM=ED&OBJID="+self.currentTask.id;
};

//<%----------------------------- TRANSACTION MANAGEMENT ---------------------------------%>
/**
 * Initiates a new transaction in the GanttMaster instance.
 * A transaction is used to group multiple changes together so they can be treated as a single unit of work.
 * Typically, this method is called before making changes that need to be collectively executed or reverted.
 *
 * This method serves as the beginning of the transactional operation. The transaction can be completed or reverted
 * by calling the appropriate methods after modifications are applied.
 */
GanttMaster.prototype.beginTransaction = function () {
  if (!this.__currentTransaction) {
    this.__currentTransaction = {
      snapshot: JSON.stringify(this.saveGantt(true)),
      errors:   []
    };
  } else {
    console.error("Cannot open twice a transaction");
  }
  return this.__currentTransaction;
};


//this function notify an error to a transaction -> transaction will rollback
/**
 * Sets an error message on the current transaction.
 * This method is used to associate an error message with a transaction,
 * indicating that the transaction has encountered an issue.
 *
 * @param {string} message - The error message to be associated with the transaction.
 */
GanttMaster.prototype.setErrorOnTransaction = function (errorMessage, task) {
  if (this.__currentTransaction) {
    this.__currentTransaction.errors.push({msg: errorMessage, task: task});
  } else {
    console.error(errorMessage);
  }
};

/**
 * Checks if the current transaction is in an error state.
 *
 * This function evaluates whether the ongoing transaction has encountered
 * any error condition. Transactions in error state typically mean that
 * some operation has violated the constraints, failed validations, or
 * has been interrupted due to an issue. This method helps in determining
 * the error status of the current transaction so that appropriate handling
 * can be applied.
 *
 * @returns {boolean} Returns true if the transaction is in an error state,
 * otherwise false.
 */
GanttMaster.prototype.isTransactionInError = function () {
  if (!this.__currentTransaction) {
    console.error("Transaction never started.");
    return true;
  } else {
    return this.__currentTransaction.errors.length > 0
  }

};

/**
 * Ends an ongoing transaction in the GanttMaster instance.
 * Commits the changes made during the transaction, validates the data,
 * and updates the associated state and UI components if necessary.
 *
 * This method finalizes a transaction that was started with
 * GanttMaster.prototype.beginTransaction. If data validation fails
 * or undo/redo functionality is enabled, appropriate actions are
 * taken to ensure consistency in data and user actions.
 *
 * It also triggers events and updates related to task or project changes.
 */
GanttMaster.prototype.endTransaction = function () {
  if (!this.__currentTransaction) {
    console.error("Transaction never started.");
    return true;
  }

  var ret = true;

  //no error -> commit
  if (this.__currentTransaction.errors.length <= 0) {
    //console.debug("committing transaction");

    //put snapshot in undo
    this.__undoStack.push(this.__currentTransaction.snapshot);
    //clear redo stack
    this.__redoStack = [];

    //shrink gantt bundaries
    this.gantt.shrinkBoundaries();
    this.taskIsChanged(); //enqueue for gantt refresh


    //error -> rollback
  } else {
    ret = false;
    //console.debug("rolling-back transaction");

    //compose error message
    var msg = "ERROR:\n";
    for (var i = 0; i < this.__currentTransaction.errors.length; i++) {
      var err = this.__currentTransaction.errors[i];
      msg = msg + err.msg + "\n\n";
    }
    alert(msg);


    //try to restore changed tasks
    var oldTasks = JSON.parse(this.__currentTransaction.snapshot);
    this.deletedTaskIds = oldTasks.deletedTaskIds;
    this.__inUndoRedo = true; // avoid Undo/Redo stacks reset
    this.loadTasks(oldTasks.tasks, oldTasks.selectedRow);
    this.redraw();

  }
  //reset transaction
  this.__currentTransaction = undefined;

  //show/hide save button
  this.saveRequired();

  //[expand]
  this.editor.refreshExpandStatus(this.currentTask);

  return ret;
};

// inhibit undo-redo
/**
 * Creates a checkpoint in the current state of the GanttMaster object.
 * This checkpoint is used to save the current state of tasks and changes,
 * enabling the application to revert to this state if necessary.
 * Multiple checkpoints can be used to manage undo/redo functionality.
 *
 * Note:
 * This function is meant to be invoked internally and works
 * as a snapshot for the current state.
 *
 * Postcondition:
 * After invoking this method, the current state is stored
 * and can be retrieved later by other associated functions.
 */
GanttMaster.prototype.checkpoint = function () {
  //console.debug("GanttMaster.prototype.checkpoint");
  this.__undoStack = [];
  this.__redoStack = [];
  this.saveRequired();
};


GanttMaster.prototype.resetUndoRedoStack = function () {
  this.__undoStack = [];
  this.__redoStack = [];
}


//----------------------------- UNDO/REDO MANAGEMENT ---------------------------------%>

/**
 * Reverts the last action performed to return the Gantt chart
 * to its previous state. The undo mechanism relies on a history
 * of actions saved in a stack. If no actions are available to undo,
 * the method has no effect.
 *
 * The method checks if there is an item available in the undo stack
 * and applies the undo operation. After undoing an action, the undone
 * operation is pushed onto the redo stack for potential future re-application.
 *
 * This method is useful for scenarios where changes need to
 * be temporarily reverted without permanently discarding them.
 *
 * Preconditions:
 * - There must be at least one action in the undo stack for the method to perform an undo operation.
 *
 * Postconditions:
 * - The last performed action is undone, and the system's state reverts
 *   to the point immediately before the last action was executed.
 * - The undone action is moved to the redo stack.
 *
 * Limitations:
 * - Consecutive calls to undo must be balanced with correctly managed redo stack for re-application.
 */
GanttMaster.prototype.undo = function () {
  //console.debug("undo before:",this.__undoStack,this.__redoStack);
  if (this.__undoStack.length > 0) {
    var his = this.__undoStack.pop();
    this.__redoStack.push(JSON.stringify(this.saveGantt()));
    var oldTasks = JSON.parse(his);
    this.deletedTaskIds = oldTasks.deletedTaskIds;
    this.__inUndoRedo = true; // avoid Undo/Redo stacks reset
    this.loadTasks(oldTasks.tasks, oldTasks.selectedRow);
    this.redraw();
    //show/hide save button
    this.saveRequired();
  }
};

/**
 * Redoes the last undone operation in the GanttMaster undo stack.
 *
 * This method is used to reapply the most recently undone changes
 * to the Gantt chart, effectively restoring the state prior to the undo.
 * It works in conjunction with the undo functionality to allow users
 * to navigate the history of changes performed on the chart.
 *
 * If there are no actions in the redo stack, the method performs no operation.
 */
GanttMaster.prototype.redo = function () {
  //console.debug("redo before:",undoStack,redoStack);
  if (this.__redoStack.length > 0) {
    var his = this.__redoStack.pop();
    this.__undoStack.push(JSON.stringify(this.saveGantt()));
    var oldTasks = JSON.parse(his);
    this.deletedTaskIds = oldTasks.deletedTaskIds;
    this.__inUndoRedo = true; // avoid Undo/Redo stacks reset
    this.loadTasks(oldTasks.tasks, oldTasks.selectedRow);
    this.redraw();
    //console.debug("redo after:",undoStack,redoStack);

    this.saveRequired();
  }
};


/**
 * Determines if there are unsaved changes in the current state of the Gantt chart.
 *
 * @returns {boolean} Returns true if there are unsaved changes that require saving; otherwise, returns false.
 */
GanttMaster.prototype.saveRequired = function () {
  //console.debug("saveRequired")
  //show/hide save button
  if(this.__undoStack.length>0 ) {
    $("#saveGanttButton").removeClass("disabled");
    $("form[alertOnChange] #Gantt").val(new Date().getTime()); // set a fake variable as dirty
    this.element.trigger("saveRequired.gantt",[true]);


  } else {
    $("#saveGanttButton").addClass("disabled");
    $("form[alertOnChange] #Gantt").updateOldValue(); // set a fake variable as clean
    this.element.trigger("saveRequired.gantt",[false]);

  }
};


/**
 * Prints the Gantt chart by rendering it on a new window/tab.
 * This function prepares the current state of the Gantt chart for printing,
 * adjusts the page layout, and opens the rendered content in a printable format.
 * It manipulates the DOM to gather and format the chart into a printable document.
 *
 * This function is intended to be used as a utility for offline documentation,
 * reporting, or sharing purposes. It assumes the Gantt chart is rendered
 * in a DOM element and exports it for print preview and printing.
 *
 * Note:
 * - Ensure the chart is fully rendered and visible before attempting to print.
 * - Printing styles applied to the Gantt chart should be predefined for proper layout in the printout.
 */
GanttMaster.prototype.print = function () {
  this.gantt.redrawTasks(true);
  print();
};


/**
 * Resizes the GanttMaster component to fit its container or specified dimensions.
 * This method should be called to adjust the dimensions of the Gantt chart when
 * the container size changes or when a manual resize is required. It ensures
 * that all visual elements of the Gantt chart are appropriately scaled and
 * visible within the new dimensions.
 */
GanttMaster.prototype.resize = function () {
  var self=this;
  //console.debug("GanttMaster.resize")
  this.element.stopTime("resizeRedraw").oneTime(50,"resizeRedraw",function(){
    self.splitter.resize();
    self.numOfVisibleRows=Math.ceil(self.element.height()/self.rowHeight);
    self.firstScreenLine=Math.floor(self.splitter.firstBox.scrollTop()/self.rowHeight) ;
    self.gantt.redrawTasks();
  });
};




/**
 * Handles the scroll event for the GanttMaster component.
 * This function is triggered when a scrolling action occurs in the Gantt chart,
 * typically to synchronize UI elements or execute logic associated with the scroll.
 *
 * @param {Event} event - The scroll event object containing details about the scroll action.
 */
GanttMaster.prototype.scrolled = function (oldFirstRow) {
  var self=this;
  var newFirstRow=self.firstScreenLine;

  //if scroll something
  if (newFirstRow!=oldFirstRow){
    //console.debug("Ganttalendar.scrolled oldFirstRow:"+oldFirstRow+" new firstScreenLine:"+newFirstRow);

    var collapsedDescendant = self.getCollapsedDescendant();

    var scrollDown=newFirstRow>oldFirstRow;
    var startRowDel;
    var endRowDel;
    var startRowAdd;
    var endRowAdd;

    if(scrollDown){
      startRowDel=oldFirstRow-self.rowBufferSize;
      endRowDel=newFirstRow-self.rowBufferSize;
      startRowAdd=Math.max(oldFirstRow+self.numOfVisibleRows+self.rowBufferSize,endRowDel);
      endRowAdd =newFirstRow+self.numOfVisibleRows+self.rowBufferSize;
    } else {
      startRowDel=newFirstRow+self.numOfVisibleRows+self.rowBufferSize;
      endRowDel=oldFirstRow+self.numOfVisibleRows+self.rowBufferSize;
      startRowAdd=newFirstRow-self.rowBufferSize;
      endRowAdd =Math.min(oldFirstRow-self.rowBufferSize,startRowDel);
    }

    var firstVisibleRow=newFirstRow-self.rowBufferSize; //ignoring collapsed tasks
    var lastVisibleRow =newFirstRow+self.numOfVisibleRows+self.rowBufferSize;


    //console.debug("remove startRowDel:"+startRowDel+" endRowDel:"+endRowDel )
    //console.debug("add startRowAdd:"+startRowAdd+" endRowAdd:"+endRowAdd)

    var row=0;
    self.firstVisibleTaskIndex=-1;
    for (var i=0;i<self.tasks.length;i++){
      var task=self.tasks[i];
      if (collapsedDescendant.indexOf(task) >=0){
        continue;
      }

      //remove rows on top
      if (row>=startRowDel && row<endRowDel) {
        if (task.ganttElement)
          task.ganttElement.remove();
        if (task.ganttBaselineElement)
          task.ganttBaselineElement.remove();

        //add missing ones
      } else if (row>=startRowAdd && row<endRowAdd) {
        self.gantt.drawTask(task);
      }

      if (row>=firstVisibleRow && row<lastVisibleRow) {
        self.firstVisibleTaskIndex=self.firstVisibleTaskIndex==-1?i:self.firstVisibleTaskIndex;
        self.lastVisibleTaskIndex = i;
      }

      row++
    }
  }
};


/**
 * Computes the critical path for the Gantt chart.
 * The critical path is the sequence of tasks that determines the minimum project duration.
 * It identifies tasks that directly impact the project completion date.
 *
 * This function analyzes tasks and dependencies to determine which tasks are on the critical path.
 *
 * Process:
 * - Iterates through all tasks.
 * - Calculates early start, early finish, late start, and late finish times for each task.
 * - Identifies tasks that have zero float (tasks where early start equals late start, and early finish equals late finish).
 * - Marks those tasks as part of the critical path.
 *
 * Updates the task model with critical path status and highlights critical tasks.
 *
 * Requirements:
 * - Ensure that task dependencies and durations are correctly defined for accurate results.
 */
GanttMaster.prototype.computeCriticalPath = function () {

  if (!this.tasks)
    return false;

  // do not consider grouping tasks
  var tasks = this.tasks.filter(function (t) {
    //return !t.isParent()
    return (t.getRow() > 0) && (!t.isParent() || (t.isParent() && !t.isDependent()));
  });

  // reset values
  for (var i = 0; i < tasks.length; i++) {
    var t = tasks[i];
    t.earlyStart = -1;
    t.earlyFinish = -1;
    t.latestStart = -1;
    t.latestFinish = -1;
    t.criticalCost = -1;
    t.isCritical = false;
  }

  // tasks whose critical cost has been calculated
  var completed = [];
  // tasks whose critical cost needs to be calculated
  var remaining = tasks.concat(); // put all tasks in remaining


  // Backflow algorithm
  // while there are tasks whose critical cost isn't calculated.
  while (remaining.length > 0) {
    var progress = false;

    // find a new task to calculate
    for (var i = 0; i < remaining.length; i++) {
      var task = remaining[i];
      var inferiorTasks = task.getInferiorTasks();

      if (containsAll(completed, inferiorTasks)) {
        // all dependencies calculated, critical cost is max dependency critical cost, plus our cost
        var critical = 0;
        for (var j = 0; j < inferiorTasks.length; j++) {
          var t = inferiorTasks[j];
          if (t.criticalCost > critical) {
            critical = t.criticalCost;
          }
        }
        task.criticalCost = critical + task.duration;
        // set task as calculated an remove
        completed.push(task);
        remaining.splice(i, 1);

        // note we are making progress
        progress = true;
      }
    }
    // If we haven't made any progress then a cycle must exist in
    // the graph and we wont be able to calculate the critical path
    if (!progress) {
      console.error("Cyclic dependency, algorithm stopped!");
      return false;
    }
  }

  // set earlyStart, earlyFinish, latestStart, latestFinish
  computeMaxCost(tasks);
  var initialNodes = initials(tasks);
  calculateEarly(initialNodes);
  calculateCritical(tasks);

  return tasks;


  function containsAll(set, targets) {
    for (var i = 0; i < targets.length; i++) {
      if (set.indexOf(targets[i]) < 0)
        return false;
    }
    return true;
  }

  function computeMaxCost(tasks) {
    var max = -1;
    for (var i = 0; i < tasks.length; i++) {
      var t = tasks[i];

      if (t.criticalCost > max)
        max = t.criticalCost;
    }
    //console.debug("Critical path length (cost): " + max);
    for (var i = 0; i < tasks.length; i++) {
      var t = tasks[i];
      t.setLatest(max);
    }
  }

  function initials(tasks) {
    var initials = [];
    for (var i = 0; i < tasks.length; i++) {
      if (!tasks[i].depends || tasks[i].depends == "")
        initials.push(tasks[i]);
    }
    return initials;
  }

  function calculateEarly(initials) {
    for (var i = 0; i < initials.length; i++) {
      var initial = initials[i];
      initial.earlyStart = 0;
      initial.earlyFinish = initial.duration;
      setEarly(initial);
    }
  }

  function setEarly(initial) {
    var completionTime = initial.earlyFinish;
    var inferiorTasks = initial.getInferiorTasks();
    for (var i = 0; i < inferiorTasks.length; i++) {
      var t = inferiorTasks[i];
      if (completionTime >= t.earlyStart) {
        t.earlyStart = completionTime;
        t.earlyFinish = completionTime + t.duration;
      }
      setEarly(t);
    }
  }

  function calculateCritical(tasks) {
    for (var i = 0; i < tasks.length; i++) {
      var t = tasks[i];
      t.isCritical = (t.earlyStart == t.latestStart)
    }
  }

};

//------------------------------------------- MANAGE CHANGE LOG INPUT ---------------------------------------------------
/**
 * Manages the save required state of the GanttMaster.
 * This function is responsible for handling and updating the internal
 * state to track any modifications or changes made to the Gantt chart,
 * ensuring that it prompts to save changes when necessary.
 *
 * This method will typically be invoked when modifications are detected
 * within the Gantt chart, enabling the application to track changes and
 * mark them for saving appropriately.
 */
GanttMaster.prototype.manageSaveRequired=function(ev, showSave) {
  //console.debug("manageSaveRequired", showSave);

  var self=this;
  function checkChanges() {
    var changes = false;
    //there is somethin in the redo stack?
    if (self.__undoStack.length > 0) {
      var oldProject = JSON.parse(self.__undoStack[0]);
      //si looppano i "nuovi" task
      for (var i = 0; !changes && i < self.tasks.length; i++) {
        var newTask = self.tasks[i];
        //se è un task che c'erà già
        if (!(""+newTask.id).startsWith("tmp_")) {
          //si recupera il vecchio task
          var oldTask;
          for (var j = 0; j < oldProject.tasks.length; j++) {
            if (oldProject.tasks[j].id == newTask.id) {
              oldTask = oldProject.tasks[j];
              break;
            }
          }
          // chack only status or dateChanges
          if (oldTask && (oldTask.status != newTask.status || oldTask.start != newTask.start || oldTask.end != newTask.end)) {
            changes = true;
            break;
          }
        }
      }
    }
    $("#LOG_CHANGES_CONTAINER").css("display", changes ? "inline-block" : "none");
  }


  if (showSave) {
    $("body").stopTime("gantt.manageSaveRequired").oneTime(200, "gantt.manageSaveRequired", checkChanges);
  } else {
    $("#LOG_CHANGES_CONTAINER").hide();
  }

}


/**
 * Sets the working hours on the GanttMaster instance.
 *
 * This method is used to define the working hours for a task or a specific
 * time period in the GanttMaster project. It adjusts the start and end times
 * to ensure they align with the specified working hours.
 *
 * @param {Date} startTime - The starting time of the working period.
 * @param {Date} endTime - The ending time of the working period.
 * @param {number} hours - The number of working hours to set within the specified period.
 * @returns {boolean} Returns true if the working hours were set successfully, otherwise false.
 */
GanttMaster.prototype.setHoursOn = function(startWorkingHour,endWorkingHour,dateFormat,resolution){
  //console.debug("resolution",resolution)
  Date.defaultFormat= dateFormat;
  Date.startWorkingHour=startWorkingHour;
  Date.endWorkingHour=endWorkingHour;
  Date.useMillis=resolution>=1000;
  Date.workingPeriodResolution=resolution;
  millisInWorkingDay=endWorkingHour-startWorkingHour;
};


$(document).ready(function () {
    // Remove any existing context menu suppression on the entire document
    $(document).off("contextmenu");

    // Remove context menu suppression inside the Gantt chart workspace
    $("#workSpace").off("contextmenu");
});
/*
$("#workSpace").on("contextmenu", function(event) {
    event.preventDefault(); // Prevent default right-click behavior

    // Create context menu if it doesn't exist
    if ($("#customContextMenu").length === 0) {
        $("body").append(`
            <div id="customContextMenu" style="position: absolute; display: none; background: white; border: 1px solid black; padding: 5px;">
                <ul style="list-style: none; padding: 0; margin: 0;">
                    <li class="context-item">Option 1</li>
                    <li class="context-item">Option 2</li>
                    <li class="context-item">Option 3</li>
                </ul>
            </div>
        `);

        // Close menu when clicking elsewhere
        $(document).on("click", function() {
            $("#customContextMenu").hide();
        });
    }

    // Position and display menu
    $("#customContextMenu")
        .css({ top: event.pageY + "px", left: event.pageX + "px" })
        .show();
});
*/
/*
$(document).on("contextmenu", function(event) {
    event.preventDefault(); // Stop default right-click menu

    // Ensure we're in the right section (optional check)
    if (!$(event.target).closest("#workSpace").length) return;

    // Remove old menu if it exists
    $("#customContextMenu").remove();

    // Create a new right-click menu
    let menu = $(`
        <div id="customContextMenu" style="position: absolute; background: white; border: 1px solid black; padding: 5px; z-index: 10000;">
            <ul style="list-style: none; padding: 0; margin: 0;">
                <li class="context-item">Option 1</li>
                <li class="context-item">Option 2</li>
                <li class="context-item">Option 3</li>
            </ul>
        </div>
    `).appendTo("body");

    // Position the menu at the mouse cursor
    menu.css({ top: event.pageY + "px", left: event.pageX + "px" }).fadeIn(200);

    // Close menu when clicking anywhere else
    $(document).on("click", function() {
        $("#customContextMenu").fadeOut(200, function() {
            $(this).remove();
        });
    });
});

*/

// Force-enable right-click functionality across the document
$(document).on("contextmenu", function(event) {
    console.log("Right-click detected:", event.target); // Debugging log
    event.stopPropagation();  // Stop interference from other handlers
    event.preventDefault();   // Prevent default menu

    if (!$(event.target).closest("#workSpace").length) return; // Ensure it's inside the Gantt area

    // Remove any existing menu
    $("#customContextMenu").remove();

    // Create a new right-click menu
    let menu = $(`
        <div id="customContextMenu" style="position: absolute; background: white; border: 1px solid black; padding: 5px; z-index: 10000;">
            <ul style="list-style: none; padding: 0; margin: 0;">
                <li class="context-item">Option 1</li>
                <li class="context-item">Option 2</li>
                <li class="context-item">Option 3</li>
            </ul>
        </div>
    `).appendTo("body");

    // Position the menu at the mouse cursor
    menu.css({ top: event.pageY + "px", left: event.pageX + "px" }).fadeIn(200);

    // Close menu when clicking elsewhere
    $(document).on("click", function() {
        $("#customContextMenu").fadeOut(200, function() {
            $(this).remove();
        });
    });

    return false; // Ensure other handlers don't interfere
});
