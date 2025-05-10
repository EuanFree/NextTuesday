// Function to create hierarchical menu
const createHierarchicalMenu = async (menuElement, userID) => {
    try
    {
        const portfolios = await getPortfolioListFromServer(); // Fetch portfolios
        const portfoliosContents = [];
        for(let i = 0; i < portfolios.length; i++)
        {
            const portfolioContents = {'programmes':[],'projects':[],'id':portfolios[i].id, "title": portfolios[i].title};
            const pContents = await getPortfolioContentsFromServer(portfolios[i].id);
            for(let j = 0; j < pContents.length; j++)
            {
                let progCt = 0;
                if(pContents[j].programme_id != null)
                {
                    portfolioContents.programmes.push({"id": pContents[j].programme_id, "title":pContents[j].title,"projects": []});
                    progCt = portfolioContents.programmes.length - 1;
                    const progProjs =  await getProgrammeContentsFromServer(pContents[j].programme_id);
                    for(let k = 0; k < progProjs.length; k++)
                    {
                        portfolioContents.programmes[progCt].projects.push({"id":progProjs[k].id,"title":progProjs[k].title});
                    }
                    // progCt++;

                }
                if(pContents[j].project_id != null)
                {
                    portfolioContents.projects.push({"id":pContents[j].project_id,"title":pContents[j].title});
                }
            }
            portfoliosContents.push(portfolioContents);
            portfoliosContents[i].id = portfolios[i].id;
        }
        menuElement.empty(); // Clear existing menu
        let portfolioCt = 0;
        portfoliosContents.forEach((portfolio) => {
            const portfolioDiv = $("<div>")
                .addClass("menuItem portfolio")
                .text(portfolio.title)
                .data('id', portfolio.id)
                .data('type', 'portfolio');

            // Add triangle indicator to the portfolio div
            const triangle = $("<span>")
                .addClass("triangle")
                .css({
                    display: "inline-block",
                    marginRight: "8px",
                    width: "0",
                    height: "0",
                    borderLeft: "8px solid black",
                    borderTop: "5px solid transparent",
                    borderBottom: "5px solid transparent",
                    borderRight: "none",
                    verticalAlign: "middle",
                });
            portfolioDiv.prepend(triangle);

            portfolioDiv.on("click", function () {
                // Show portfolio details
                showSummaryWindow("Portfolio", portfolio.id);
            });

            portfolioDiv.on("dblclick", function ()
            {
                // Expand/collapse programmes under this portfolio
                const childProgrammes = $(this).nextUntil(".portfolio", ".programme");
                const childProjects = $(this).nextUntil(".portfolio", ".programme").addBack().nextUntil(".portfolio", ".portfolioProject");
                const visibleChildren = childProgrammes.filter(":visible");
                if (visibleChildren.length > 0)
                {
                    // childProgrammes.slideUp();
                    // childProjects.slideUp();
                    $(this).nextUntil(".portfolio").slideUp();
                    triangle.css({
                        borderLeft: "8px solid black",
                        borderTop: "5px solid transparent",
                        borderBottom: "5px solid transparent",
                        borderRight: "none",
                    }); // Point triangle to the right
                }
                else
                {
                    childProgrammes.slideDown();
                    childProjects.slideDown();
                    triangle.css({
                        borderLeft: "5px solid transparent",
                        borderRight: "5px solid transparent",
                        borderTop: "8px solid black",
                        borderBottom: "none",});
                }

                window.getSelection()?.removeAllRanges();
            });

            menuElement.append(portfolioDiv);

            // Generate programmes for this portfolio
            if (portfolio.programmes) {
                const projProgs = async () => {
                    for(let i = 0; i < portfolio.programmes.length; i++)
                    {
                        const progProjs =  await getProgrammeContentsFromServer(portfolio.programmes[i].id);
                        for(let j = 0; j < progProjs.length; j++)
                        {
                            portfoliosContents[portfolioCt].programmes[i].projects.push({"id":progProjs[j].id,"title":progProjs[j].title});
                        }
                    }
                    return true;
                };
                portfoliosContents[portfolioCt].programmes.forEach(async (programme) => {
                    const programmeDiv = $("<div>")
                        .addClass("menuItem programme")
                        .text(programme.title)
                        .data('id', programme.id)
                        .data('type', 'programme')
                        .css("display", "none"); // Initially hidden

                    const progTriangle = $("<span>")
                        .addClass("triangle")
                        .css({
                            display: "inline-block",
                            marginRight: "8px",
                            width: "0",
                            height: "0",
                            borderLeft: "8px solid black",
                            borderTop: "5px solid transparent",
                            borderBottom: "5px solid transparent",
                            borderRight: "none",
                            verticalAlign: "middle",
                        });
                    programmeDiv.prepend(progTriangle);

                    programmeDiv.on("click", function () {
                        // Show programme details
                        showSummaryWindow("Programme", programme.id);
                    });

                    programmeDiv.on("dblclick", function () {
                        // Expand/collapse projects under this programme
                        const childProjects = $(this).nextUntil(".programme, .portfolio", ".programmeProject");
                        const visibleChildren = childProjects.filter(":visible");
                        if (visibleChildren.length > 0) {
                            childProjects.slideUp();
                            progTriangle.css({
                                borderLeft: "8px solid black",
                                borderTop: "5px solid transparent",
                                borderBottom: "5px solid transparent",
                                borderRight: "none",
                            }); // Point triangle to the right
                        } else {
                            console.log("Child Projects: ", childProjects);
                            childProjects.slideDown();
                            progTriangle.css({
                                borderLeft: "5px solid transparent",
                                borderRight: "5px solid transparent",
                                borderTop: "8px solid black",
                                borderBottom: "none",
                            }); // Point triangle down
                        }
                        window.getSelection()?.removeAllRanges();
                    });

                    menuElement.append(programmeDiv);

                    // Generate projects for this programme
                    if (programme.projects) {
                        programme.projects.forEach((project) => {
                            const projectDiv = $("<div>")
                                .addClass("menuItem programmeProject")
                                .text(project.title)
                                .data('id', project.id)
                                .data('type', 'programmeProject')
                                .css("display", "none"); // Initially hidden

                            projectDiv.on("click", function () {
                                // Show project details
                                showSummaryWindow("Project", project.id);
                            });

                            projectDiv.on("dblclick", function () {
                                // Load project into Gantt
                                console.log("Load project into Gantt");
                                console.log("GE:",ge);
                                const projectId = project.id;
                                ge.loadProjectFromDatabase(projectId, userID).then(() => {
                                    console.log(`Project ${projectId} loaded from database successfully.`);

                                    ge.loadTasksFromPostgreSQL(userID, projectId).then(() => {
                                        console.log(`Tasks for project ${projectId} loaded successfully.`);
                                    }).catch(error => {
                                        console.error(`Error loading tasks for project ${projectId}:`, error);
                                    });
                                    // Reset the background color of all other programmeProjects and portfolioProjects to default
                                    $(".menuItem.programmeProject, .menuItem.portfolioProject").css({"background-color": "", "box-shadow": "none"});


                                    // Add shadow effect to improved selection visibility
                                    $(this).css({
                                        "background-color": "#ffffff", // Change background to white
                                        "box-shadow": "0px 4px 8px rgba(0, 0, 0, 0.2)" // Add subtle shadow
                                    });
                                }).catch(error => {
                                    console.error(`Error loading project ${projectId} from database:`, error);
                                });
                            });
                            menuElement.append(projectDiv);
                        });
                    }
                });
            }

            // Generate projects directly under this portfolio
            if (portfolio.projects) {
                portfolio.projects.forEach((project) => {
                    const projectDiv = $("<div>")
                        .addClass("menuItem portfolioProject")
                        .text(project.title)
                        .data('id', project.id)
                        .data('type', 'portfolioProject')
                        .css("display", "none"); // Initially hidden

                    projectDiv.on("click", function () {
                        // Show project details
                        showSummaryWindow("Project", project.id);
                    });

                    projectDiv.on("dblclick", function () {
                        // Load project into Gantt
                        // TODO: Fix this connection to the gannt window
                        // updateGanttForProject(project.id);
                        console.log("Load project into Gantt");
                        console.log("GE:",ge);
                        const projectId = project.id;
                        ge.loadProjectFromDatabase(projectId, userID).then(() => {
                            console.log(`Project ${projectId} loaded from database successfully.`);

                            ge.loadTasksFromPostgreSQL(userID, projectId).then(() => {
                                console.log(`Tasks for project ${projectId} loaded successfully.`);
                            }).catch(error => {
                                console.error(`Error loading tasks for project ${projectId}:`, error);
                            });


                            // Reset the background color of all other programmeProjects and portfolioProjects to default
                            $(".menuItem.programmeProject, .menuItem.portfolioProject").css({"background-color": "", "box-shadow": "none"});


                            // Add shadow effect to improved selection visibility
                            $(this).css({
                                "background-color": "#ffffff", // Change background to white
                                "box-shadow": "0px 4px 8px rgba(0, 0, 0, 0.2)" // Add subtle shadow
                            });

                        }).catch(error => {
                            console.error(`Error loading project ${projectId} from database:`, error);
                        });
                    });

                    menuElement.append(projectDiv);
                });
            }
            portfolioCt++;
        });
    } catch (error) {
        console.error("Error creating hierarchical menu:", error);
    }
    // console.log(menuElement);
};


/**
 * Expands the menu to display the project with the given projectId.
 * @param {string} projectId - The ID of the project to be displayed.
 */
const expandMenuToShowProject = (projectId) => {

// Collapse the menu to show only portfolio elements
    $(".menuItem.portfolio").each(function () {
        const childItems = $(this).nextUntil(".portfolio", ".menuItem");
        childItems.slideUp(); // Collapse all child items
    });

// Reset triangle indicators for programmes
    $(".menuItem.programme .triangle").css({
        borderLeft: "8px solid black",
        borderTop: "5px solid transparent",
        borderBottom: "5px solid transparent",
        borderRight: "none", // Point triangle to the right
    });
    
    // Find all project divs (programmeProjects and portfolioProjects)
    const projectDiv = $(`.menuItem.programmeProject, .menuItem.portfolioProject`).filter(function () {
        return $(this).data('id') === projectId;
    });

    if (projectDiv.length > 0) {
        // Expand parent portfolio or programme menus where the project resides
        // const parentMenu = projectDiv.prevUntil(".portfolio, .programme").add(projectDiv.prevAll(".portfolio").first());
        const prevPortfolioContent = projectDiv.prevUntil(".portfolio");
        const ownPortfolio = projectDiv.prevAll(".portfolio").first();
        $(ownPortfolio).trigger("dblclick");
        if(prevPortfolioContent.filter(".programme").length > 0)
        {

            const firstProgramme = prevPortfolioContent.filter(".programme").first();
            $(firstProgramme).trigger("dblclick");
        }
        

        // Make the project visible
        projectDiv.css("display", "");

        // Optionally scroll into view for better visibility
        projectDiv[0].scrollIntoView({behavior: "smooth", block: "center"});

        // Highlight the project for visibility
        projectDiv.css({
            "background-color": "#ffeb3b", // Highlight with yellow
            "box-shadow": "0px 4px 8px rgba(0, 0, 0, 0.2)" // Add subtle shadow
        });

        // Remove the highlight after a short delay
        setTimeout(() => {
            projectDiv.css("background-color", "#ffffff");
        }, 2000);
    } else {
        console.warn(`Project with ID ${projectId} not found.`);
    }
};

// Summary window function
const showSummaryWindow = (type, id) => {
    console.log(`Showing summary for ${type} with ID: ${id}`);
    // TODO: Add logic to open and populate the summary window based on the type and ID
};





/* -------------------------------------------------------------------------------------------------------------------
/* Right click functionality
   -------------------------------------------------------------------------------------------------------------------*/

let cMenu = null;
let cMenuVisible = false;



// Commented out as trying to find an easy way to identify the task is not available
// rcMenuSetups.push({objClass:"ganttLinesSVG", rcMenuItems: rcMenuSetups.find(setup => setup.objClass === "gdfCell").rcMenuItems});
// rcMenuSetups.push({objClass:"ganttLinesSVG rowSelected", rcMenuItems: rcMenuSetups.find(setup => setup.objClass === "gdfCell").rcMenuItems});


/**
 * Creates a summary popup at the mouse position.
 * The popup consists of a `callOutMain` div and a `callOutPointer` div, dynamically positioned to ensure it stays within the document window.
 * The triangle pointer connects the mouse position to the popup.
 *
 * @param {MouseEvent} event - The mouse event containing the position to anchor the popup.
 * @returns {HTMLElement} - The resulting div element for the callout.
 */
function createSummaryPopup(event) {
    event.preventDefault();
    const userInteractionTemplates = $("#userInteractionTemplates");
    userInteractionTemplates.loadTemplates();

    // Remove any existing callouts
    document.querySelectorAll('.callout').forEach(existing => existing.remove());

    // Remove any existing right click menus
    if(cMenu !== null)
    {
        hideContextMenu(event, this);
        cMenu = null;
    }
    document.addEventListener("contextmenu", (e) => e.preventDefault());

    // Main container for the callout
    const callOutContainer = $.JST.createFromTemplate({}, "SUMMARY_POPUP");
    callOutContainer.addClass('callout'); // Add class to identify it as a callout
    callOutContainer.css({
        position: 'absolute',
        zIndex: '1000',
        pointerEvents: 'auto', // Ensure interactions are enabled after creation
        display: 'none' // Initially hide the container
    });

    // Ensure the callOutMain and callOutPointer exist in the template
    const callOutMain = callOutContainer.find('.callOutMain');
    if (callOutMain.length === 0) {
        console.error("Template does not contain 'callOutMain' element.");
        return;
    }

    const callOutPointer = callOutContainer.find('.callOutPointer');
    if (callOutPointer.length === 0) {
        console.error("Template does not contain 'callOutPointer' element.");
        return;
    }

    
    
    // Apply styles to the main content area
    callOutMain.css({
        position: 'relative',
        background: '#cdbdbd',
        border: '1px solid #ccc',
        borderRadius: '5px',
        boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
        padding: '10px',
        minWidth: '200px',
        minHeight: '100px'
    });


    // Triangle pointer styles (default reset)
    callOutPointer.css({
        width: '0',
        height: '0',
    });

    // Append the callout to the body
    $('body').append(callOutContainer);

    // Get mouse position
    const mouseX = event.clientX;
    const mouseY = event.clientY;

    // Get viewport dimensions
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Dimensions of callout
    const popupWidth = 220;
    const popupHeight = 120;
    const pointerSize = 10;

    let popupX = mouseX;
    let popupY = mouseY;
    let pointerStyle = {};

    // Determine the best position for the popup
    if (mouseX + popupWidth < viewportWidth && mouseY + popupHeight + pointerSize < viewportHeight) {
        popupX = mouseX + pointerSize;
        popupY = mouseY + pointerSize;
        pointerStyle = {
            left: `${-pointerSize}px`,
            top: '0',
            borderLeft: '10px solid transparent',
            borderRight: '10px solid transparent',
            borderBottom: '10px solid #ffffff',
        };
    } else if (mouseX - popupWidth > 0 && mouseY + popupHeight + pointerSize < viewportHeight) {
        popupX = mouseX - popupWidth - pointerSize;
        popupY = mouseY + pointerSize;
        pointerStyle = {
            right: `${-pointerSize}px`,
            top: '0',
            borderLeft: '10px solid #ffffff',
            borderRight: '10px solid transparent',
            borderTop: '10px solid transparent',
        };
    } else if (mouseX + popupWidth < viewportWidth && mouseY - popupHeight - pointerSize > 0) {
        popupX = mouseX + pointerSize;
        popupY = mouseY - popupHeight - pointerSize;
        pointerStyle = {
            left: `${-pointerSize}px`,
            bottom: '0',
            borderLeft: '10px solid transparent',
            borderRight: '10px solid transparent',
            borderTop: '10px solid #ffffff',
        };
    } else if (mouseX - popupWidth > 0 && mouseY - popupHeight - pointerSize > 0) {
        popupX = mouseX - popupWidth - pointerSize;
        popupY = mouseY - popupHeight - pointerSize;
        pointerStyle = {
            right: `${-pointerSize}px`,
            bottom: '0',
            borderLeft: '10px solid #ffffff',
            borderRight: '10px solid transparent',
            borderBottom: '10px solid transparent',
        };
    }
    
    callOutPointer.css({
        ...pointerStyle,
        position: 'relative',
        borderBottomColor: callOutMain.css('background'), // Ensures pointer color matches callOutMain
        borderTopColor: callOutMain.css('background'),   // For cases where the pointer faces upwards
        borderLeftColor: callOutMain.css('background'),  // For cases where the pointer faces left
        borderRightColor: callOutMain.css('background')  // For cases where the pointer faces right
    });
    

    // Ensure popup stays within the window boundaries
    popupX = Math.max(0, Math.min(popupX, viewportWidth - popupWidth));
    popupY = Math.max(0, Math.min(popupY, viewportHeight - popupHeight));


    // Apply calculated positions and pointer style
    callOutMain.css({
        left: callOutPointer.position().left + callOutPointer.width() + 'px',
        top: callOutPointer.position().top + callOutPointer.height() + 'px',
    });
    
    
    callOutPointer.css(pointerStyle);

    // Display the callout
    callOutContainer.css({ display: 'block' });

    // Attach the pointer to the callOutContainer
    callOutContainer.append(callOutPointer);



    // // Event handlers for removing the callout
    // if (event.type === 'mouseenter') {
    //     callOutContainer.on('mouseleave', () => {
    //         callOutContainer.remove();
    //     });
    // } else {
    //     $(document).on('click', (e) => {
    //         if (!callOutContainer.is(e.target) && callOutContainer.has(e.target).length === 0) {
    //             callOutContainer.remove();
    //             $(document).off('click');
    //         }
    //     });
    // }

    
    callOutContainer.css({
        width: `${popupWidth}px`,
        height: `${popupHeight}px`,
        left: `${popupX}px`,
        top: `${popupY}px`,
    });
    $(callOutContainer).css({display: 'block',zIndex: '3000'});
    return callOutContainer[0];
}


/**
 * Adds rows to the callOutTable based on the given input.
 *
 * @param {Array<Array<string>> | null} data - A 2D array or null. If it's a 2D array, the rows' data will be added to the table. If null, a blank row will be added.
 * @param {HTMLElement} callOutTable - The target HTML table element where rows should be added.
 */
function addRowsToCallOutTable(data, callOutTable) {
    if (!callOutTable || !(callOutTable instanceof HTMLTableElement)) {
        console.error("Invalid table element provided.");
        return;
    }

    if (Array.isArray(data)) {
        // Add rows based on the 2D array
        data.forEach(rowData => {
            const row = callOutTable.insertRow(); // Create a new table row
            rowData.forEach(cellData => {
                const cell = row.insertCell(); // Create a new cell for the row
                cell.textContent = cellData; // Add the text content to the cell
            });
        });
    } else if (data === null) {
        // Add a blank row
        const row = callOutTable.insertRow(); // Create a blank row
        const blankCell = row.insertCell(); // Create a single blank cell
        blankCell.textContent = ""; // Add an empty string to the cell
    }
}

/**
 * Hides the context menu if the clicked target is outside of the specified menu element.
 *
 * @param {Event} event The event object representing the user interaction.
 * @param {HTMLElement} target The target HTML element associated with the context menu.
 * @return {void}
 */
function hideContextMenu(event, target)
{


    // Search for any element with a class of rcMenu type and remove it from the document
    const menus = document.querySelectorAll('.rcMenu');
    menus.forEach(menu => {
        if (menu.parentNode) {
            menu.parentNode.removeChild(menu);
        }
    });
    cMenu = null;
    cMenuVisible = false;
    
    // if (!$(cMenu)[0].contains(event.target)) {
    //     $(cMenu)[0].style.display = 'none';
    //     cMenuVisible = false;
    //
    //     // Remove the pop-up menu from the document
    //     if ($(cMenu)[0].parentNode) {
    //         $(cMenu)[0].parentNode.removeChild($(cMenu)[0]);
    //     }
    // }
    // cMenu = null;
    // cMenuVisible = false;
}


const launchRightClickMenu = (event) => {
    if (cMenu!== null)
    {
        hideContextMenu(event, this);
    }

    document.addEventListener('click',hideContextMenu);
    createRightClickMenu(event, this);
}



const createRightClickMenu = (event, target) => {
    event.preventDefault();
    $("#userInteractionTemplates").loadTemplates();

    // const tgtClass = event.target.classList[0];

    let tgtClass = event.target.className;
    let tgtElement = event.target;


    if (tgtClass instanceof SVGAnimatedString) {
        tgtClass = tgtClass.baseVal; // Get the actual string value from SVGAnimatedString
    }

    if(tgtClass === "")
    {
        tgtClass = event.target.parentNode.className;
    }

    console.log("Target class:", tgtClass);

    // Fires up the task editor for the right clicked task

    /**
     * Finds the task in ganttMaster and triggers the openFullEditor function from ganttGridEditor.
     *
     * @param {Event} event - The event object representing the user interaction.
     * @param {HTMLElement} target - The target HTML element associated with the context menu.
     */
    function openTaskEditor(event, target) {
        // Prevent default interaction
        event.preventDefault();
        if (tgtClass === "taskLayout")
        {
            $(tgtElement.parentNode).trigger("dblclick");
        }
    }

    function addTaskAbove(event, target) {
        if(!ge)
        {
            return false;
        }
        else
        {
            ge.addAboveCurrentTask();
        }
    }

    function addTaskBelow(event, target) {
        if(!ge)
        {
            return false;
        }
        else
        {
            ge.addBelowCurrentTask();
        }
    }

    function addChildTask(event, target) {
        if(!ge)
        {
            return false;
        }
        else
        {
            ge.addBelowCurrentTask();
            ge.indentCurrentTask();
        }
    }

    function deleteTask(event, target) {
        if(!ge)
        {
            return false;
        }
        else
        {
            ge.deleteCurrentTask();
        }
    }

    function addFollowOnTask(event, target) {
        if(!ge)
        {
            return false;
        }
        else
        {
            const taskPair = ge.addBelowCurrentTask();
            if(taskPair)
            {
                /* Add the dependency in for the new task */
                taskPair[1].depends = String(taskPair[0].id);
                const newLink = {
                    id: `${taskPair[0].id}-${taskPair[1].id}`,
                    from: taskPair[0],
                    to: taskPair[1],
                    lag: 0
                }
                ge.links.push(newLink);
                ge.redraw();
            }
        }
    }

    /* json to define what menus to show when */
    let rcMenuSetups = [
        {
            objClass:"taskLayout",
            rcMenuItems: [
                {text:"Edit Task", iconName:"edit", func:openTaskEditor},
                {text:"Task Details", iconName: "notes", func:createSummaryPopup},
                {text:"Add Task", iconName:"add", func:addTaskAbove},
                {text:"Delete Task", iconName: "delete", func:deleteTask},
                {text:"Add Task Above", iconName: "add_row_above", func:addTaskAbove},
                {text:"Add Task Below", iconName: "add_row_below", func:addTaskBelow},
                {text:"Add Follow On Task", iconName: "view_object_track", func:addFollowOnTask},
                {text:"Add Sub Task", iconName: "place_item", func:addChildTask},
            ]
        },
        {
            objClass:"gdfCell",
            rcMenuItems: [
                {text:"Edit Task", iconName:"edit", func:openTaskEditor},
                // {text:"Task Details", iconName: "notes", func:createSummaryPopup},
                {text:"Add Task", iconName:"add", func:null},
                {text:"Delete Task", iconName: "delete", func:null},
                {text:"Add Task Above", iconName: "add_row_above", func:null},
                {text:"Add Task Below", iconName: "add_row_below", func:null},
                {text:"Add Follow On Task", iconName: "view_object_track", func:null},
                {text:"Add Sub Task", iconName: "place_item", func:null},
            ]
        },
        {
            objClass:"taskLinkPathSVG",
            rcMenuItems: [
            ]
        },
        {
            objClass:"menuItem portfolio",
            rcMenuItems: [
                {text:"Expand Portfolio", iconName: "expand", func:null},
                {text:"Add Programme", iconName: "add", func:null},
                {text:"Add Project", iconName: "add", func:null},
            ]
        },
        {
            objClass:"menuItem programme",
            rcMenuItems: [
                {text:"Expand Programme", iconName: "expand", func:null},
                {text:"Add Project", iconName: "add", func:null},
            ]
        }
    ];

    rcMenuSetups.push({objClass:"gdfCell indentCell", rcMenuItems: rcMenuSetups.find(setup => setup.objClass === "gdfCell").rcMenuItems});
    rcMenuSetups.push({objClass:"gdfCell taskAssigs", rcMenuItems: rcMenuSetups.find(setup => setup.objClass === "gdfCell").rcMenuItems});
    rcMenuSetups.push({objClass:"gdfCell requireCanSeeDep", rcMenuItems: rcMenuSetups.find(setup => setup.objClass === "gdfCell").rcMenuItems});
    rcMenuSetups.push({objClass:"date", rcMenuItems: rcMenuSetups.find(setup => setup.objClass === "gdfCell").rcMenuItems});
    rcMenuSetups.push({objClass:"taskRowIndex", rcMenuItems: rcMenuSetups.find(setup => setup.objClass === "gdfCell").rcMenuItems});
    rcMenuSetups.push({objClass:"validated", rcMenuItems: rcMenuSetups.find(setup => setup.objClass === "gdfCell").rcMenuItems});


    let riClkMenu = $.JST.createFromTemplate("", "RIGHT_CLICK_MENU");

    if (!ge) {
        console.error("ganttMaster object is not available");
        return;
    }

    // Obtain task ID or details from the target element (assuming it has some identifying attribute like 'data-task-id')
    // const taskId = target.closest("[data-task-id]")?.getAttribute("data-task-id");
    // const taskId = null;
    // console.log("Task ID:", taskId);
    // if (!taskId) {
    //     console.error("Task ID not found on the target element");
    //     return false;
    // }


// Find the matching menu setup for the target class
    const menuSetup = rcMenuSetups.find(setup => setup.objClass === tgtClass);
    console.log("Menu setup:", menuSetup);
    if (menuSetup && menuSetup.rcMenuItems.length > 0) {
        // Create menu rows dynamically for each menu item
        menuSetup.rcMenuItems.forEach(menuItem => {
            const menuRow = $.JST.createFromTemplate(menuItem, "RIGHT_CLICK_MENU_ITEM");
            if (menuItem.func !== null) {
                $(menuRow).on('click', menuItem.func/*(event, target)*/);
            }
            console.log("Menu row:", menuRow);
            // Append the row to the context menu
            $(riClkMenu).append(menuRow);
        });
    } else {
        console.warn(`No menu setup found or menu items are empty for target class: ${tgtClass}`);
        return false;
    }

    document.body.appendChild($(riClkMenu)[0]);


    $(riClkMenu)[0].style.left = `${event.clientX}px`;
    $(riClkMenu)[0].style.top = `${event.clientY}px`;
    console.log("Right click menu:", riClkMenu);
    console.log("X,Y:", event.pageX, ",",event.pageY)
    $(riClkMenu)[0].style.display = "block";
    cMenu = $(riClkMenu);

}


