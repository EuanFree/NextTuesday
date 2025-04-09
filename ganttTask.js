/*
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

// function createGroupedDebouncedCallback(fn, delay = 200) {
//   let queue = [];
//   let timeout;
//
//   return function (change) {
//     queue.push(change);
//     clearTimeout(timeout);
//     timeout = setTimeout(() => {
//       fn(queue);
//       queue = [];
//     }, delay);
//   };
// }


function createDebouncedCallback(callback, delay = 200) {
  let changes = [];
  let timeout;

  return function (change) {
    changes.push(change);
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      callback(changes);
      changes = [];
    }, delay);
  };
}

function createShallowProxy(target, onChangeCallback) {
  const debouncedCallback = createDebouncedCallback(onChangeCallback, 200);
  const monitoredKeys = new Set(["name",
    "progress",
    "relevance",
    "level",
    "status",
    "description",
    "type",
    "depends",
    "start",
    "duration",
    "assigs",
    "collapsed",
  "master",]);

  return new Proxy(target, {

    set(obj, prop, value)
    {
      // console.log("set", obj, prop, value);
      if (monitoredKeys.has(prop))
      {
        const oldValue = obj[prop];

        if (oldValue !== value) {
          obj[prop] = value;

          if (typeof onChangeCallback === "function")
          {
            debouncedCallback({
              id: obj.id,
              property: prop,
              oldValue: oldValue,
              newValue: value
            });
          }
        }
      }
      else
      {
        if(prop === "master" || prop === "ganttElement")
        {

          if (obj.master)
          {
            const master = obj.master;
            const undoStack = master.__undoStack;

            // Check if the master object and its undoStack are formatted correctly
            if (Array.isArray(undoStack) && undoStack.length > 0) {
              // Get the status before the change from the undo stack
              const beforeChange = JSON.parse(undoStack[undoStack.length - 1]);

              if (beforeChange && beforeChange.tasks)
              {
                const currentTask = beforeChange.tasks.find(task => task.id === obj.id);

                if (currentTask)
                {
                  const changes = Object.keys(currentTask).reduce((acc, key) =>
                  {
                    if (Array.isArray(currentTask[key]) && Array.isArray(obj[key]))
                    {
                      if (Array.isArray(currentTask[key]) && Array.isArray(obj[key])) {
                        if (currentTask[key].length !== obj[key].length || !currentTask[key].every((val, index) => {
                          const currentValString = typeof val === "object" ? JSON.stringify(val) : val;
                          const objValString = typeof obj[key][index] === "object" ? JSON.stringify(obj[key][index]) : obj[key][index];
                          return currentValString === objValString;
                        })) {
                          acc[key] = {oldValue: currentTask[key], newValue: obj[key]};
                          console.log("old value ", currentTask[key], " new value", obj[key]);
                        }
                      }
                    }
                    else if (currentTask[key] !== obj[key])
                    {
                      acc[key] = {
                        oldValue: currentTask[key],
                        newValue: obj[key],
                      };
                    }
                    return acc;
                  }, {});

                  if (Object.keys(changes).length > 0)
                  {
                    console.log("Changes detected for task:", obj.id);
                    console.log("Change Details:", changes);
                  } else
                  {
                    console.log("No changes detected for task:", obj.id);
                  }
                }
                else
                {
                  // console.log("Task with ID:", obj.id, "was not found in the undo stack.");
                }
              }
              else
              {
                // console.log("No relevant task data found in the undo stack.");
              }
            }
            else
            {
              // console.log("Undo stack is empty or improperly formatted.");
            }
          }
        }
        obj[prop] = value;
      }
      return true;
    },

    // get(obj, prop) {
    //   const value = obj[prop];
    //   return typeof value === "function" ? value.bind(obj) : value;
    // }

    get(obj, prop) {
      const value = obj[prop];

      if (typeof value === "function") {
        return function (...args) {
          return value.apply(obj, args);
        };
      }

      return value;
    }
  });

}


// function createDeepProxy(target, onChange, path = "") {
//   if (target === null || typeof target !== "object" || target instanceof Date) {
//     return target;
//   }
//
//   return new Proxy(target, {
//     get(obj, prop) {
//       const fullPath = path ? `${path}.${String(prop)}` : String(prop);
//       const value = obj[prop];
//
//       if (typeof value === "function") {
//         return value.bind(obj);
//       }
//
//       return createDeepProxy(value, onChange, fullPath);
//     },
//     set(obj, prop, value) {
//       const fullPath = path ? `${path}.${String(prop)}` : String(prop);
//       const oldValue = obj[prop];
//
//       if (oldValue !== value) {
//         obj[prop] = value;
//         if (typeof onChange === "function") {
//           onChange({
//             path: fullPath,
//             property: prop,
//             oldValue: oldValue,
//             newValue: value,
//           });
//         }
//       }
//
//       return true;
//     }
//   });
// }




/**
 * TaskFactory is a constructor function that provides functionality to
 * create and manage Task instances.
 */
// function TaskFactory() {
//
//   /**
//    * Build a new Task
//    */
//   this.build = function (id, name, code, level, start, duration, collapsed) {
//     // Set at beginning of day
//     var adjusted_start = computeStart(start);
//     var calculated_end = computeEndByDuration(adjusted_start, duration);
//     return new Task(id, name, code, level, adjusted_start, calculated_end, duration, collapsed);
//   };
// }

// function TaskFactory() {
//   this.build = function (id, name, code, level, start, duration, collapsed, onChangesCallback) {
//     const adjusted_start = computeStart(start);
//     const calculated_end = computeEndByDuration(adjusted_start, duration);
//     const task = new Task(id, name, code, level, adjusted_start, calculated_end, duration, collapsed);
//
//     // Wrap the callback in a grouped + debounced handler
//     const groupedDebouncedCallback = createGroupedDebouncedCallback(onChangesCallback, 250);
//
//     // Return a deep proxy
//     return createDeepProxy(task, groupedDebouncedCallback);
//   };
// }

function TaskFactory() {
  this.build = function (id, name, code, level, start, duration, collapsed, onChangeCallback) {
    const adjusted_start = computeStart(start);
    const calculated_end = computeEndByDuration(adjusted_start, duration);
    const task = new Task(id, name, code, level, adjusted_start, calculated_end, duration, collapsed);

    return createShallowProxy(task, onChangeCallback);
    // return {task: task, proxy:createShallowProxy(task, onChangeCallback)};
  };
}


/**
 * Represents a task with properties related to its progress, schedule, permissions, and assignments.
 *
 * @param {string} id - The unique identifier of the task.
 * @param {string} name - The name or title of the task.
 * @param {string} code - A code or short identifier for the task.
 * @param {number} level - The level or hierarchy position of the task.
 * @param {Date} start - The start date of the task.
 * @param {Date} end - The end date of the task.
 * @param {number} duration - The duration of the task, typically measured in days.
 * @param {boolean} collapsed - Indicates whether the task is displayed in a collapsed state.
 * @return {Task} A new instance of the Task object with the specified properties.
 */
function Task(id, name, code, level, start, end, duration, collapsed) {
  this.id = id;
  this.name = name;
  this.progress = 0;
  this.progressByWorklog = false;
  this.relevance = 0;
  this.type = "";
  this.typeId = "";
  this.description = "";
  this.code = code;
  this.level = level;
  this.status = "BACKLOG";
  this.depends = "";

  this.start = start;
  this.duration = duration;
  this.end = end;

  this.startIsMilestone = false;
  this.endIsMilestone = false;

  this.collapsed = collapsed;

  //permissions
  // by default all true, but must be inherited from parent
  this.canWrite = true;
  this.canAdd = true;
  this.canDelete = true;
  this.canAddIssue = true;
  
  /* Status of last database interaction */
  this.lastDBInteraction = null;

  this.rowElement; //row editor html element
  this.ganttElement; //gantt html element
  this.master;


  this.assigs = [];
}

/**
 * Creates a shallow clone of the current object, copying all enumerable properties
 * except those that are functions or non-array objects.
 *
 * @return {Object} A new object containing the shallow-copied properties of the original object.
 */
Task.prototype.clone = function () {
  var ret = {};
  for (var key in this) {
    if (typeof(this[key]) != "function")
      if (typeof(this[key]) != "object" || Array.isArray(this[key]))
      ret[key] = this[key];
    }
  return ret;
};


// TODO: ensure this works with the database - also work out how assignments work with tasks

/**
 * Retrieves a string representation of all assignments related to the task.
 *
 * This method compiles and returns a string that contains the
 * formatted details of the assignments for this task,
 * which may include specific data about the assignees or
 * associated details.
 *
 * @returns {string} The string representation of the task's assignments.
 */
Task.prototype.getAssigsString = function () {
  var ret = "";
  for (var i = 0; i < this.assigs.length; i++) {
    var ass = this.assigs[i];
    var res = this.master.getResource(ass.resourceId);
    if (res) {
      ret = ret + (ret == "" ? "" : ", ") + res.name;
    }
  }
  return ret;
};

/**
 * Creates a new assignment for the task.
 *
 * This method is used to attach a specific assignment to the task instance.
 * It may involve setting up required parameters or properties related to a task's assignment.
 *
 * @method
 * @param {Object} details - An object containing the details required to create the assignment.
 * @param {string} details.title - The title of the assignment.
 * @param {string} details.description - A brief description of the assignment.
 * @param {Date} details.dueDate - The due date for the assignment.
 * @throws {Error} Throws an error if the required parameters are not provided or invalid.
 * @returns {Object} Returns the created assignment object.
 */
Task.prototype.createAssignment = function (id, resourceId, roleId, effort) {
  var assig = new Assignment(id, resourceId, roleId, effort);
  this.assigs.push(assig);
  return assig;
};


//<%---------- SET PERIOD ---------------------- --%>
/**
 * Sets the period for the task.
 *
 * This method updates the period property of the Task instance,
 * allowing you to define or change the time period associated with it.
 *
 * @param {number} start - The start time of the period.
 * @param {number} end - The end time of the period.
 * Both parameters are expected to be numeric values representing time.
 */
Task.prototype.setPeriod = function (start, end) {
  //console.debug("setPeriod ",this.code,this.name,new Date(start), new Date(end));
  //var profilerSetPer = new Profiler("gt_setPeriodJS");

  if (start instanceof Date) {
    start = start.getTime();
  }

  if (end instanceof Date) {
    end = end.getTime();
  }

  var originalPeriod = {
    start:    this.start,
    end:      this.end,
    duration: this.duration
  };


  //compute legal start/end //todo moved here R&S 30/3/2016 because otherwise the duration calculation, which was modified by adding days, fails
  start = computeStart(start);
  end=computeEnd(end);

  var newDuration = recomputeDuration(start, end);

  //if are equals do nothing and return true
  if ( start == originalPeriod.start && end == originalPeriod.end && newDuration == originalPeriod.duration) {
    return true;
  }

  if (newDuration == this.duration) { // is shift
    return this.moveTo(start, false,true);
  }

  var wantedStartMillis = start;

  var children = this.getChildren();

  if(this.master.shrinkParent && children.length>0) {
    var chPeriod= this.getChildrenBoudaries();
    start = chPeriod.start;
    end = chPeriod.end;
  }


  //cannot start after end
  if (start > end) {
    start = end;
  }

  //if there are dependencies compute the start date and eventually moveTo
  var startBySuperiors = this.computeStartBySuperiors(start);
  if (startBySuperiors != start) {
    return this.moveTo(startBySuperiors, false,true);
  }

  var somethingChanged = false;

  if (this.start != start || this.start != wantedStartMillis) {
    this.start = start;
    somethingChanged = true;
  }

  //set end
  var wantedEndMillis = end;

  if (this.end != end || this.end != wantedEndMillis) {
    this.end = end;
    somethingChanged = true;
  }

  this.duration = recomputeDuration(this.start, this.end);

  //profilerSetPer.stop();

  //nothing changed exit
  if (!somethingChanged)
    return true;

  //cannot write exit
  if (!this.canWrite) {
    this.master.setErrorOnTransaction("\"" + this.name + "\"\n" + GanttMaster.messages["CANNOT_WRITE"], this);
    return false;
  }

  //external dependencies: exit with error
  if (this.hasExternalDep) {
    this.master.setErrorOnTransaction("\"" + this.name + "\"\n" + GanttMaster.messages["TASK_HAS_EXTERNAL_DEPS"], this);
    return false;
  }

  var todoOk = true;

  //I'm restricting
  var deltaPeriod = originalPeriod.duration - this.duration;
  var restricting = deltaPeriod > 0;
  var enlarging = deltaPeriod < 0;
  var restrictingStart = restricting && (originalPeriod.start < this.start);
  var restrictingEnd = restricting && (originalPeriod.end > this.end);

  if (restricting) {
    //loops children to get boundaries
    var bs = Infinity;
    var be = 0;
    for (var i = 0; i < children.length; i++) {

      var ch = children[i];
      if (restrictingEnd) {
        be = Math.max(be, ch.end);
      } else {
        bs = Math.min(bs, ch.start);
      }
    }

    if (restrictingEnd) {
      this.end = Math.max(be, this.end);
    } else {
      this.start = Math.min(bs, this.start);
    }
    this.duration = recomputeDuration(this.start, this.end);
    if (this.master.shrinkParent ) {
      todoOk = updateTree(this);
    }

  } else {

    //check global boundaries
    if (this.start < this.master.minEditableDate || this.end > this.master.maxEditableDate) {
      this.master.setErrorOnTransaction("\"" + this.name + "\"\n" +GanttMaster.messages["CHANGE_OUT_OF_SCOPE"], this);
      todoOk = false;
    }

    //console.debug("set period: somethingChanged",this);
    if (todoOk ) {
      todoOk = updateTree(this);
    }
  }

  if (todoOk) {
    todoOk = this.propagateToInferiors(end);
  }
  return todoOk;
};


//<%---------- MOVE TO ---------------------- --%>
/**
 * Moves the task to a specified location or container.
 *
 * This method is intended to change the current position or parent grouping
 * of the task. The exact implementation and behavior will depend on the
 * object's context and the arguments provided.
 *
 * @function
 * @name Task.prototype.moveTo
 * @param {Object|string|number} target - The destination or container to which the task should be moved.
 *                                        The type and format of this parameter depend on the implementation.
 * @throws {Error} Throws an error if the task cannot be moved to the specified target.
 * @returns {void}
 */
Task.prototype.moveTo = function (start, ignoreMilestones, propagateToInferiors) {
  //console.debug("moveTo ",this.name,new Date(start),this.duration,ignoreMilestones);
  //var profiler = new Profiler("gt_task_moveTo");

  if (start instanceof Date) {
    start = start.getTime();
  }

  var originalPeriod = {
    start: this.start,
    end:   this.end
  };

  var wantedStartMillis = start;

  //set a legal start
  start = computeStart(start);

  //if depends, start is set to max end + lag of superior
  start = this.computeStartBySuperiors(start);

  var end = computeEndByDuration(start, this.duration);


  //check milestones compatibility
  if (!this.checkMilestonesConstraints(start,end,ignoreMilestones))
      return false;

  if (this.start != start || this.start != wantedStartMillis) {
    //in case of end is milestone it never changes!
    //if (!ignoreMilestones && this.endIsMilestone && end != this.end) {
    //  this.master.setErrorOnTransaction("\"" + this.name + "\"\n" + GanttMaster.messages["END_IS_MILESTONE"], this);
    //  return false;
    //}
    this.start = start;
    this.end = end;
    //profiler.stop();

    //check global boundaries
    if (this.start < this.master.minEditableDate || this.end > this.master.maxEditableDate) {
      this.master.setErrorOnTransaction("\"" + this.name + "\"\n" +GanttMaster.messages["CHANGE_OUT_OF_SCOPE"], this);
      return false;
    }


    // bicch 22/4/2016: quando si sposta un task con child a cavallo di holidays, i figli devono essere shiftati in workingDays, non in millisecondi, altrimenti si cambiano le durate
    // when moving children you MUST consider WORKING days,
    var panDeltaInWM = getDistanceInUnits(new Date(originalPeriod.start),new Date(this.start));

    //loops children to shift them
    var children = this.getChildren();
    for (var i = 0; i < children.length; i++) {
      var ch = children[i];
      var chStart=incrementDateByUnits(new Date(ch.start),panDeltaInWM);
      ch.moveTo(chStart,false,false);
      }

    if (!updateTree(this)) {
      return false;
    }

    if (propagateToInferiors) {
      this.propagateToInferiors(end);
      var todoOk = true;
      var descendants = this.getDescendant();
      for (var i = 0; i < descendants.length; i++) {
        ch = descendants[i];
        if (!ch.propagateToInferiors(ch.end))
          return false;
      }
    }
  }

  return true;
};

/** TODO: Need to figure out how to modify milestones in the gantt chart to be 0 duration markers not directly associated
 ** with a task
 */

/**
 * Checks whether the constraints for all milestones of the task are satisfied.
 *
 * This method evaluates each milestone associated with the task to determine
 * if it fulfills its defined constraints, returning a boolean result that
 * indicates whether all milestones meet the required conditions.
 *
 * @returns {boolean} True if all milestones satisfy their constraints, false otherwise.
 */
Task.prototype.checkMilestonesConstraints = function (newStart,newEnd,ignoreMilestones) {

//if start is milestone cannot be move
  if (!ignoreMilestones && (this.startIsMilestone && newStart != this.start  )) {
    //notify error
    this.master.setErrorOnTransaction("\"" + this.name + "\"\n" + GanttMaster.messages["START_IS_MILESTONE"], this);
    return false;
  } else if (!ignoreMilestones && (this.endIsMilestone && newEnd != this.end)) {
    //notify error
    this.master.setErrorOnTransaction("\"" + this.name + "\"\n" + GanttMaster.messages["END_IS_MILESTONE"], this);
    return false;
  } else if (this.hasExternalDep) {
    //notify error
    this.master.setErrorOnTransaction("\"" + this.name + "\"\n" + GanttMaster.messages["TASK_HAS_EXTERNAL_DEPS"], this);
    return false;
  }
  return true;
};

//<%---------- PROPAGATE TO INFERIORS ---------------------- --%>
/**
 * Propagates changes or updates to all inferior tasks associated with the current task.
 * This function ensures that any modifications or effects applied to the task are
 * communicated or transferred appropriately to its subordinate tasks, maintaining
 * consistency and alignment within a task hierarchy or dependency structure.
 */
Task.prototype.propagateToInferiors = function (end) {
  //console.debug("propagateToInferiors "+this.name)
  //and now propagate to inferiors
  var todoOk = true;
  var infs = this.getInferiors();
  if (infs && infs.length > 0) {
    for (var i = 0; i < infs.length; i++) {
      var link = infs[i];
      if (!link.to.canWrite) {
        this.master.setErrorOnTransaction(GanttMaster.messages["CANNOT_WRITE"] + "\n\"" + link.to.name + "\"", link.to);
        break;
      }
      todoOk = link.to.moveTo(end, false,true); //this is not the right date but moveTo checks start
      if (!todoOk)
        break;
    }
  }
  return todoOk;
};


//<%---------- COMPUTE START BY SUPERIORS ---------------------- --%>
/**
 * Computes and determines the start time of the task based on the start times and dependencies
 * defined by its superior tasks. This method evaluates the task's superior relationships to
 * calculate a start time that ensures all dependencies are met.
 *
 * @method
 * @memberof Task.prototype
 */
Task.prototype.computeStartBySuperiors = function (proposedStart) {
  //if depends -> start is set to max end + lag of superior
  var supEnd=proposedStart;
  var sups = this.getSuperiors();
  if (sups && sups.length > 0) {
    supEnd=0;
    for (var i = 0; i < sups.length; i++) {
      var link = sups[i];
      supEnd = Math.max(supEnd, incrementDateByUnits(new Date(link.from.end), link.lag));
    }
    supEnd+=1;
  }
  return computeStart(supEnd);
};


/**
 * Updates the boundaries of the parent task based on the current task's start and end dates.
 * This function ensures that the parent's start and end dates are adjusted accordingly
 * to encompass its children's boundaries while considering milestones and constraints.
 *
 * @param {Object} task - The task instance that is being evaluated, containing its start, end, parent, and other metadata.
 * @return {boolean} - Returns true if the update was successful, otherwise false if there were constraints or errors.
 */
function updateTree(task) {
  //console.debug("updateTree ",task.code,task.name, new Date(task.start), new Date(task.end));
  var error;

  //try to enlarge parent
  var p = task.getParent();

  //no parent:exit
  if (!p)
    return true;

  var newStart;
  var newEnd;

  //id shrink start and end are computed on children boundaries
  if (task.master.shrinkParent) {
    var chPeriod= p.getChildrenBoudaries();
    newStart = chPeriod.start;
    newEnd = chPeriod.end;
  } else {
    newStart = p.start;
    newEnd = p.end;

  if (p.start > task.start) {
      newStart = task.start;
    }
    if (p.end < task.end) {
      newEnd = task.end;
    }
  }

  if (p.start!=newStart) {
    if (p.startIsMilestone) {
      task.master.setErrorOnTransaction("\"" + p.name + "\"\n" + GanttMaster.messages["START_IS_MILESTONE"], task);
      return false;
    } else if (p.depends) {
      task.master.setErrorOnTransaction("\"" + p.name + "\"\n" + GanttMaster.messages["TASK_HAS_CONSTRAINTS"], task);
      return false;
    }
  }
  if (p.end!=newEnd) {
    if (p.endIsMilestone) {
      task.master.setErrorOnTransaction("\"" + p.name + "\"\n" + GanttMaster.messages["END_IS_MILESTONE"], task);
      return false;
    }
  }


  //propagate updates if needed
  if (newStart != p.start || newEnd != p.end) {

    //can write?
    if (!p.canWrite) {
      task.master.setErrorOnTransaction(GanttMaster.messages["CANNOT_WRITE"] + "\n" + p.name, task);
      return false;
    }

    //has external deps ?
    if (p.hasExternalDep) {
      task.master.setErrorOnTransaction(GanttMaster.messages["TASK_HAS_EXTERNAL_DEPS"] + "\n\"" + p.name + "\"", task);
      return false;
    }

    return p.setPeriod(newStart, newEnd);
  }

  return true;
}


/**
 * Retrieves the boundary coordinates for the children of a task instance.
 * The boundaries typically include positions like minimum and maximum coordinates
 * relative to the task's children. Useful for layout calculations or determining
 * visual boundaries of nested task elements.
 *
 * @returns {Object} An object containing boundary coordinates. The structure of the object
 * is typically defined by the implementation and may include properties such as `minX`,
 * `maxX`, `minY`, and `maxY`.
 */
Task.prototype.getChildrenBoudaries = function () {
  var newStart = Infinity;
  var newEnd = -Infinity;
  var children = this.getChildren();
  for (var i = 0; i < children.length; i++) {
    var ch = children[i];
    newStart = Math.min(newStart, ch.start);
    newEnd = Math.max(newEnd, ch.end);
  }
  return({start:newStart,end:newEnd})
}

/* *TODO: Need to change this to match the database version of statuses

//<%---------- CHANGE STATUS ---------------------- --%>
/**
 * Changes the status of the task to the specified value.
 *
 * @param {string} newStatus - The new status to set for the task.
 *                             This value typically represents the
 *                             current state of the task, such as
 *                             "pending", "in-progress", or "completed".
 */
Task.prototype.changeStatus = function (newStatus,forceStatusCheck) {
  //console.debug("changeStatus: "+this.name+" from "+this.status+" -> "+newStatus);

  var cone = this.getDescendant();
  
  /**
   * Propagates the status of a task based on its new status, dependencies, and parent-child relationships.
   * Handles cascading status changes across tasks and their relationships (e.g., parent/child, superior/inferior).
   * Several status transitions are managed with specific business rules for task management.
   *
   * @param {Object} task - The current task object whose status is being propagated.
   * @param {string} newStatus - The new status to be applied to the task (e.g., "STATUS_DONE", "STATUS_ACTIVE").
   * @param {boolean} manuallyChanged - Indicates whether the status was manually changed by the user.
   * @param {boolean} propagateFromParent - Whether the status change is propagated from the task's parent.
   * @param {boolean} propagateFromChildren - Whether the status change is propagated from the task's children.
   * @return {boolean} Returns true if the status propagation succeeded, otherwise false.
   */
  function propagateStatus(task, newStatus, manuallyChanged, propagateFromParent, propagateFromChildren) {
    //console.debug("propagateStatus",task.name, task.status,newStatus, manuallyChanged, propagateFromParent, propagateFromChildren);
    var oldStatus = task.status;
    var parent = task.getParent();
    //no changes exit
    if (newStatus == oldStatus && !forceStatusCheck) {
      return true;
    }

    /* EF Update
    * Specify certain status changes that shouldn't be propagated soexit function
    * */
    if (newStatus == "BLOCKED" || newStatus == "BACKLOG") {
      return true;
    }

    var todoOk = true;
    task.status = newStatus;

    
// If the new status is "IN_PROGRESS", check the parent status.
    if (newStatus === "IN_PROGRESS") {      
      if (parent && parent.status === "BACKLOG") {
        parent.status = "IN_PROGRESS";
      }
    }


    if (newStatus === "COMPLETE") {
      var allChildrenComplete = true;

      // Get all siblings (parent's children) and check their statuses
      if (parent) {
        var siblings = parent.getChildren();
        for (var i = 0; i < siblings.length; i++) {
          if (siblings[i].status !== "COMPLETE") {
            allChildrenComplete = false;
            break;
          }
        }

        // If all sibling tasks are complete, set the parent's status to Complete
        if (allChildrenComplete) {
          parent.status = "COMPLETE";
        }
      }
    }


// If the new status is "CANCELLED", "RETIRED", or "DEFERRED", propagate the status to children
    if (newStatus === "CANCELLED" || newStatus === "RETIRED" || newStatus === "DEFERRED") {
      propagateStatusToChildren(task, newStatus, false);
    }
    
    /* Commented Out Old functionality for reference */
    // //xxxx -> STATUS_DONE            may activate dependent tasks, both suspended and undefined. Will set to done all children.
    // //STATUS_FAILED -> STATUS_DONE   do nothing if not forced by hand
    // if (newStatus == "STATUS_DONE") {
    //
    //   // cannot close task if open issues
    //   if (task.master.permissions.cannotCloseTaskIfIssueOpen && task.openIssues > 0) {
    //     task.master.setErrorOnTransaction(GanttMaster.messages["CANNOT_CLOSE_TASK_IF_OPEN_ISSUE"] + " \"" + task.name + "\"");
    //     return false;
    //   }
    //
    //
    //   if ((manuallyChanged || oldStatus != "STATUS_FAILED")) { //cannot set failed task as closed for cascade - only if changed manually
    //
    //     //can be closed only if superiors are already done
    //     var sups = task.getSuperiors();
    //     for (var i = 0; i < sups.length; i++) {
    //       if (sups[i].from.status != "STATUS_DONE" && cone.indexOf(sups[i].from)<0) { // it is an error if a predecessor is not closed and is outside the cone
    //         if (manuallyChanged || propagateFromParent)  //generate a blocking error if changed manually or if the change comes from the parent and I have a dependency outside the scope (otherwise I would have an active child of a closed one)
    //           task.master.setErrorOnTransaction(GanttMaster.messages["GANTT_ERROR_DEPENDS_ON_OPEN_TASK"] + "\n\"" + sups[i].from.name + "\" -> \"" + task.name + "\"");
    //         todoOk = false;
    //         break;
    //       }
    //     }
    //
    //     if (todoOk) {
    //       // set progress to 100% if needed by settings
    //       if (task.master.set100OnClose && !task.progressByWorklog ){
    //         task.progress=100;
    //       }
    //
    //       //set children as done
    //       propagateStatusToChildren(task,newStatus,false);
    //
    //       //set inferiors as active
    //       propagateStatusToInferiors( task.getInferiors(), "STATUS_ACTIVE");
    //     }
    //   } else { // a propagation attempts to close a failed task
    //     todoOk = false;
    //   }
    //
    //
    //   //  STATUS_UNDEFINED -> STATUS_ACTIVE       all children become active, if they have no dependencies.
    //   //  STATUS_SUSPENDED -> STATUS_ACTIVE       sets to active all children and their descendants that have no inhibiting dependencies.
    //   //  STATUS_WAITING -> STATUS_ACTIVE         sets to active all children and their descendants that have no inhibiting dependencies.
    //   //  STATUS_DONE -> STATUS_ACTIVE            all those that have dependencies must be set to suspended.
    //   //  STATUS_FAILED -> STATUS_ACTIVE          nothing happens: child statuses must be reset by hand.
    // } else if (newStatus == "STATUS_ACTIVE") {
    //
    //   if (manuallyChanged || (oldStatus != "STATUS_FAILED" && oldStatus != "STATUS_SUSPENDED")) { //cannot set failed or suspended task as active for cascade - only if changed manually
    //
    //     //can be active only if superiors are already done, not only on this task, but also on ancestors superiors
    //     var sups = task.getSuperiors();
    //
    //     for (var i = 0; i < sups.length; i++) {
    //       if (sups[i].from.status != "STATUS_DONE") {
    //         if (manuallyChanged || propagateFromChildren)
    //           task.master.setErrorOnTransaction(GanttMaster.messages["GANTT_ERROR_DEPENDS_ON_OPEN_TASK"] + "\n\"" + sups[i].from.name + "\" -> \"" + task.name + "\"");
    //         todoOk = false;
    //         break;
    //       }
    //     }
    //
    //     // check if parent is already active
    //     if (todoOk) {
    //       var par = task.getParent();
    //       if (par && par.status != "STATUS_ACTIVE") {
    //         // todoOk = propagateStatus(par, "STATUS_ACTIVE", false, false, true); //TODO we decided not to propagate the status upwards
    //         todoOk = false;
    //       }
    //     }
    //
    //
    //     if (todoOk) {
    //       if (oldStatus == "STATUS_UNDEFINED" || oldStatus == "STATUS_SUSPENDED" || oldStatus == "STATUS_WAITING" ) {
    //         //set children as active
    //         propagateStatusToChildren(task,newStatus,true);
    //       }
    //
    //       //set inferiors as suspended
    //       //propagateStatusToInferiors( task.getInferiors(), "STATUS_SUSPENDED");
    //       propagateStatusToInferiors( task.getInferiors(), "STATUS_WAITING");
    //     }
    //   } else {
    //     todoOk = false;
    //   }
    //
    //   // xxxx -> STATUS_WAITING       all active children and their active descendants become waiting. when not failed or forced
    // } else if (newStatus == "STATUS_WAITING" ) {
    //   if (manuallyChanged || oldStatus != "STATUS_FAILED") { //cannot set failed task as waiting for cascade - only if changed manually
    //
    //     //check if parent if not active
    //     var par = task.getParent();
    //     if (par && (par.status != "STATUS_ACTIVE" && par.status != "STATUS_SUSPENDED" && par.status != "STATUS_WAITING")) {
    //       todoOk = false;
    //     }
    //
    //
    //     if (todoOk) {
    //       //set children as STATUS_WAITING
    //       propagateStatusToChildren(task, "STATUS_WAITING", true);
    //
    //       //set inferiors as STATUS_WAITING
    //       propagateStatusToInferiors( task.getInferiors(), "STATUS_WAITING");
    //     }
    //   } else {
    //     todoOk = false;
    //   }
    //
    //   // xxxx -> STATUS_SUSPENDED       all active children and their active descendants become suspended. when not failed or forced
    // } else if (newStatus == "STATUS_SUSPENDED" ) {
    //   if (manuallyChanged || oldStatus != "STATUS_FAILED") { //cannot set failed task as closed for cascade - only if changed manually
    //
    //     //check if parent if not active
    //     var par = task.getParent();
    //     if (par && (par.status != "STATUS_ACTIVE" && par.status != "STATUS_SUSPENDED" && par.status != "STATUS_WAITING")) {
    //       todoOk = false;
    //     }
    //
    //
    //     if (todoOk) {
    //       //set children as STATUS_SUSPENDED
    //       propagateStatusToChildren(task, "STATUS_SUSPENDED", true);
    //
    //       //set inferiors as STATUS_SUSPENDED
    //       propagateStatusToInferiors( task.getInferiors(), "STATUS_SUSPENDED");
    //     }
    //   } else {
    //     todoOk = false;
    //   }
    //
    //   // xxxx -> STATUS_FAILED children and dependent failed
    //   // xxxx -> STATUS_UNDEFINED  children and dependant become undefined.
    // } else if (newStatus == "STATUS_FAILED" || newStatus == "STATUS_UNDEFINED") {
    //
    //   //set children as failed or undefined
    //   propagateStatusToChildren(task,newStatus,false);
    //
    //   //set inferiors as failed
    //   propagateStatusToInferiors( task.getInferiors(), newStatus);
    // }
    // if (!todoOk) {
    //   task.status = oldStatus;
    //   //console.debug("status rolled back: "+task.name + " to " + oldStatus);
    // }

    return todoOk;
  }

  /**
   * Propagates a given status to a list of inferiors by iterating through them
   * and calling the propagateStatus function for each item.
   *
   * @param {Array} infs - An array of inferiors, where each inferior contains a `to` property representing the target of the status propagation.
   * @param {string} status - The status value that needs to be propagated to the inferiors.
   * @return {void} - Does not return a value.
   */
  function propagateStatusToInferiors( infs, status) {
    for (var i = 0; i < infs.length; i++) {
      propagateStatus(infs[i].to, status, false, false, false);
    }
  }

  /**
   * Propagates a given status to the child tasks of the specified task.
   *
   * @param {Object} task The parent task whose child tasks' statuses need to be updated.
   * @param {string} newStatus The new status to propagate to the child tasks.
   * @param {boolean} skipClosedTasks Indicates whether or not to skip tasks that are already marked as "COMPLETE"/"CANCELLED"/"DEFERRED"/"RETIRED".
   * @return {void} No return value, as this function modifies the statuses of child tasks directly.
   */
  function propagateStatusToChildren(task, newStatus, skipClosedTasks) {
    var chds = task.getChildren();
    for (var i = 0; i < chds.length; i++)
      if (!(skipClosedTasks && (chds[i].status == "COMPLETE" ||
                                chds[i].status == "CANCELLED" ||
                                chds[i].status == "DEFERRED" ||
                                chds[i].status == "RETIRED")) )
        propagateStatus(chds[i], newStatus, false, true, false);
  }


  var manuallyChanged=true;

  var oldStatus = this.status;

  /* TODO: Check that this function does recur for all changes - otherwise need to make the task database update
      work for all changes in the parents/children
   */

  updateTask(this.id, {status: newStatus}).then((result) => {
    this.lastDBInteraction = result;
  }).catch((error) => {
    this.lastDBInteraction = error;
    console.error("Failed to update task status:", error);
  });

  //first call
  if (propagateStatus(this, newStatus, manuallyChanged, false, false)) {
    return true;
  } else {
    this.status = oldStatus;
    return false;
  }
};

/**
 * Synchronizes the status of the current task with the external system or source.
 * This method ensures that the task's status is updated to reflect the most current state.
 *
 * @function
 * @returns {void} Does not return a value.
 */
Task.prototype.synchronizeStatus = function () {
  //console.debug("synchronizeStatus",this.name);
  var oldS = this.status;
  this.status = this.getParent()?this.getParent().status:"STATUS_UNDEFINED"; // di default si invalida lo stato mettendo quello del padre, in modo che inde/outd siano consistenti
  return this.changeStatus(oldS,true);
};

/**
 * Checks if the task is blocked locally due to unresolved dependencies.
 * Returns a boolean indicating whether the task cannot proceed because
 * at least one local dependency is not satisfied.
 *
 * @returns {boolean} True if the task is locally blocked by dependencies, false otherwise.
 */
Task.prototype.isLocallyBlockedByDependencies = function () {
  var sups = this.getSuperiors();
  var blocked = false;
  for (var i = 0; i < sups.length; i++) {
    if (sups[i].from.status != "STATUS_DONE") {
      blocked = true;
      break;
    }
  }
  return blocked;
};

//<%---------- TASK STRUCTURE ---------------------- --%>
/**
 * Retrieves the index of the current task within the master's tasks list.
 *
 * @return {number} The index of the current task in the master's tasks array. Returns -1 if the task or master is not found.
 */
Task.prototype.getRow = function () {
  var ret = -1;
  if (this.master)
    ret = this.master.tasks.findIndex(task => task.id === this.id);
  return ret;
};


/**
 * Retrieves all parent tasks associated with the current task instance.
 * Parent tasks are typically higher-level tasks or categories under
 * which the current task is organized.
 *
 * @returns {Array<Task>} An array of parent task objects.
 */
Task.prototype.getParents = function () {
  var ret;
  if (this.master) {
    var topLevel = this.level;
    var pos = this.getRow();
    ret = [];
    for (var i = pos; i >= 0; i--) {
      var par = this.master.tasks[i];
      if (topLevel > par.level) {
        topLevel = par.level;
        ret.push(par);
      }
    }
  }
  return ret;
};


/**
 * Retrieves the parent task associated with the current task.
 *
 * @returns {Task|null} The parent task if it exists, otherwise null.
 */
Task.prototype.getParent = function () {
  var ret;
  if (this.master) {
    for (var i = this.getRow(); i >= 0; i--) {
      var par = this.master.tasks[i];
      if (this.level > par.level) {
        ret = par;
        break;
      }
    }
  }
  return ret;
};


/**
 * Determines if the current task is a parent task.
 * A parent task typically has subtasks or child tasks associated with it.
 *
 * @returns {boolean} Returns true if the task is a parent task, otherwise false.
 */
Task.prototype.isParent = function () {
  var ret = false;
  if (this.master) {
    var pos = this.getRow();
    if (pos < this.master.tasks.length - 1)
      ret = this.master.tasks[pos + 1].level > this.level;
  }
  return ret;
};


/**
 * Retrieves the child tasks associated with the current task.
 *
 * @returns {Array<Task>} An array of child Task instances associated with the current task.
 * If there are no child tasks, returns an empty array.
 */
Task.prototype.getChildren = function () {
  var ret = [];
  if (this.master) {
    var pos = this.getRow();
    for (var i = pos + 1; i < this.master.tasks.length; i++) {
      var ch = this.master.tasks[i];
      if (ch.level == this.level + 1)
        ret.push(ch);
      else if (ch.level <= this.level) // exit loop if parent or brother
        break;
    }
  }
  return ret;
};


/**
 * Retrieves a descendant task from the current task hierarchy based on the provided task ID.
 *
 * This method traverses through the current task and its children recursively to locate a descendant
 * task matching the specified ID. If the task is found, it is returned; otherwise, the method returns null.
 *
 * @function
 * @name Task.prototype.getDescendant
 * @param {string} taskId - The unique identifier of the task to search for within the task hierarchy.
 * @returns {Task|null} The descendant task if found, or null if no task with the specified ID exists.
 */
Task.prototype.getDescendant = function () {
  var ret = [];
  if (this.master) {
    var pos = this.getRow();
    for (var i = pos + 1; i < this.master.tasks.length; i++) {
      var ch = this.master.tasks[i];
      if (ch.level > this.level)
        ret.push(ch);
      else
        break;
    }
  }
  return ret;
};


/**
 * Retrieves the list of superior tasks for the current task instance.
 * A superior task is typically one that has a higher level of hierarchy
 * or dependency in relation to this task.
 *
 * @returns {Array<Task>} An array of Task objects that are the superiors
 * of the current task. If no superiors exist, an empty array is returned.
 */
Task.prototype.getSuperiors = function () {
  var ret = [];
  var task = this;
  if (this.master) {
    ret = this.master.links.filter(function (link) {
      return link.to == task;
    });
  }
  return ret;
};

/**
 * Retrieves the list of tasks that are considered superior to the current task.
 * A superior task is typically one that has a hierarchical relationship above
 * the current task, such as a parent task in a task management system.
 *
 * @returns {Array<Task>} An array of tasks that are identified as superior to
 * the current task. Returns an empty array if no superior tasks are found.
 */
Task.prototype.getSuperiorTasks = function () {
  var ret = [];
  var sups = this.getSuperiors();
  for (var i = 0; i < sups.length; i++)
    ret.push(sups[i].from);
  return ret;
};


/**
 * Retrieves a list of inferiors (subtasks or dependent tasks)
 * associated with the current task.
 *
 * @method
 * @returns {Array} An array containing the list of inferiors for the task.
 */
Task.prototype.getInferiors = function () {
  var ret = [];
  var task = this;
  if (this.master) {
    ret = this.master.links.filter(function (link) {
      return link.from == task;
    });
  }
  return ret;
};

/**
 * Retrieves the list of tasks that are considered inferior or subordinate
 * to the current task instance. This might include tasks that are
 * hierarchically lower or dependent on the current task.
 *
 * @returns {Array} An array containing the inferior tasks associated with the current task.
 */
Task.prototype.getInferiorTasks = function () {
  var ret = [];
  var infs = this.getInferiors();
  for (var i = 0; i < infs.length; i++)
    ret.push(infs[i].to);
  return ret;
};

//TODO: Need to set up the push update to the SeeView DB to deactivate the task in the table
//TODO: Get the deletion to affect child tasks where appropriate
/**
 * Deletes the current task instance.
 *
 * This method is used to remove the task from its existing state or collection.
 * It performs any necessary cleanup to ensure the task is properly removed.
 * Depending on implementation, it may also handle any associated dependencies
 * or references tied to the task.
 *
 * Note: Ensure this method is used cautiously, as it may lead to unexpected
 * behaviors if the task is referenced or relied upon elsewhere after deletion.
 */
Task.prototype.deleteTask = function () {
  //console.debug("deleteTask",this.name,this.master.deletedTaskIds)
  //if is the current one remove it
  if (this.master.currentTask && this.master.currentTask.id==this.id)
    delete this.master.currentTask;

  //delete both dom elements if exists
  if (this.rowElement)
    this.rowElement.remove();
  if (this.ganttElement)
    this.ganttElement.remove();

  //remove children
  var chd = this.getChildren();
  for (var i = 0; i < chd.length; i++) {
    //add removed child in list
    chd[i].deleteTask();
  }

  if (!this.isNew())
    this.master.deletedTaskIds.push(this.id);


  //remove from in-memory collection
  this.master.tasks.splice(this.getRow(), 1);

  //remove from links
  var task = this;
  this.master.links = this.master.links.filter(function (link) {
    return link.from != task && link.to != task;
  });
};


/**
 * Determines if the current object's ID starts with the prefix "tmp_",
 * indicating that it is considered new or temporary.
 *
 * @return {boolean} True if the ID starts with "tmp_", otherwise false.
 */
Task.prototype.isNew = function () {
  return (this.id + "").indexOf("tmp_") == 0;
};

/**
 * Checks if the current task is dependent on other tasks.
 *
 * This method determines whether the task has dependencies,
 * meaning it relies on the completion or output of one or
 * more other tasks in order to proceed or be considered complete.
 *
 * @returns {boolean} True if the task is dependent on other tasks, false otherwise.
 */
Task.prototype.isDependent = function (t) {
  //console.debug("isDependent",this.name, t.name)
  var task = this;
  var dep = this.master.links.filter(function (link) {
    return link.from == task;
  });

  // is t a direct dependency?
  for (var i = 0; i < dep.length; i++) {
    if (dep[i].to == t)
      return true;
  }
  // is t an indirect dependency
  for (var i = 0; i < dep.length; i++) {
    if (dep[i].to.isDependent(t)) {
      return true;
    }
  }
  return false;
};

/**
 * Sets the latest possible start and finish times for a task based on the given maximum cost.
 *
 * @param {number} maxCost - The maximum allowable cost for the task.
 * @return {void} This method does not return a value.
 */
Task.prototype.setLatest = function (maxCost) {
  this.latestStart = maxCost - this.criticalCost;
  this.latestFinish = this.latestStart + this.duration;
};


//<%------------------------------------------  INDENT/OUTDENT --------------------------------%>
/**
 * Adjusts the indentation level of the task.
 *
 * Updates the task's indentation level by modifying its internal state.
 * This method is used to ensure that tasks maintain a correct hierarchical
 * representation based on their indentation.
 *
 * @param {number} levels - The number of indentation levels to adjust.
 *                           Positive values increase indentation,
 *                           while negative values decrease it.
 * @throws {RangeError} Throws if the resulting indentation level is invalid.
 * @returns {void}
 */
Task.prototype.indent = function () {
  //console.debug("indent", this);
  //a row above must exist
  var row = this.getRow();

  //no row no party
  if (row <= 0)
    return false;

  var ret = false;
  var taskAbove = this.master.tasks[row - 1];
  var newLev = this.level + 1;
  if (newLev <= taskAbove.level + 1) {
    ret = true;

    //trick to get parents after indent
    this.level++;
    var futureParents = this.getParents();
    this.level--;

    var oldLevel = this.level;
    for (var i = row; i < this.master.tasks.length; i++) {
      var desc = this.master.tasks[i];
      if (desc.level > oldLevel || desc == this) {
        desc.level++;
        //remove links from this and descendant to my parents
        this.master.links = this.master.links.filter(function (link) {
          var linkToParent = false;
          if (link.to == desc)
            linkToParent = futureParents.indexOf(link.from) >= 0;
          else if (link.from == desc)
            linkToParent = futureParents.indexOf(link.to) >= 0;
          return !linkToParent;
        });
        //remove links from this and descendants to predecessors of parents in order to avoid loop
        var predecessorsOfFutureParents=[];
        for (var j=0;j<futureParents.length;j++)
          predecessorsOfFutureParents=predecessorsOfFutureParents.concat(futureParents[j].getSuperiorTasks());

        this.master.links = this.master.links.filter(function (link) {
          var linkToParent = false;
          if (link.from == desc)
            linkToParent = predecessorsOfFutureParents.indexOf(link.to) >= 0;
          return !linkToParent;
        });


      } else
        break;
    }

    var parent = this.getParent();
    // set start date to parent' start if no deps
    if (parent && !this.depends) {
      var new_end = computeEndByDuration(parent.start, this.duration);
      this.master.changeTaskDates(this, parent.start, new_end);
    }


    //recompute depends string
    this.master.updateDependsStrings();
    //enlarge parent using a fake set period
    updateTree(this);
    //force status check starting from parent
    this.getParent().synchronizeStatus();
  }
  return ret;
};


/**
 * Reduces the indentation level of the current task.
 * Moves the task one level up in the hierarchy,
 * effectively making it less nested than its current state.
 *
 * If the task is already at the top level (not indented),
 * this method will typically have no effect.
 */
Task.prototype.outdent = function () {
  //console.debug("outdent", this);

  //a level must be >1 -> cannot escape from root
  if (this.level <= 1)
    return false;

  var ret = false;
  var oldLevel = this.level;

  ret = true;
  var row = this.getRow();
  for (var i = row; i < this.master.tasks.length; i++) {
    var desc = this.master.tasks[i];
    if (desc.level > oldLevel || desc == this) {
      desc.level--;
    } else
      break;
  }

  var task = this;
  var chds = this.getChildren();
  //remove links from me to my new children
  this.master.links = this.master.links.filter(function (link) {
    var linkExist = (link.to == task && chds.indexOf(link.from) >= 0 || link.from == task && chds.indexOf(link.to) >= 0);
    return !linkExist;
  });


  //enlarge me if inherited children are larger
  for (var i = 0; i < chds.length; i++) {
    //remove links from me to my new children
    chds[i].setPeriod(chds[i].start + 1, chds[i].end + 1);
  }

  //recompute depends string
  this.master.updateDependsStrings();

  //enlarge parent using a fake set period
  this.setPeriod(this.start + 1, this.end + 1);

  //force status check
  this.synchronizeStatus();
  return ret;
};


//<%------------------------------------------  MOVE UP / MOVE DOWN --------------------------------%>
/**
 * Attempts to move the current task one position up in the task list.
 * Ensures that the task adheres to the level hierarchy and updates its position both in memory and the DOM.
 * Also recalculates dependency strings if the task is moved successfully.
 *
 * @return {boolean} Returns true if the task was successfully moved up. Returns false if the task cannot be moved
 *                   due to invalid levels, no row above, or other inconsistencies.
 */
Task.prototype.moveUp = function () {
  //console.debug("moveUp", this);
  var ret = false;

  //a row above must exist
  var row = this.getRow();

  //no row no party
  if (row <= 0)
    return false;

  //find new row
  var newRow;
  for (newRow = row - 1; newRow >= 0; newRow--) {
    if (this.master.tasks[newRow].level <= this.level)
      break;
  }

  //is a parent or a brother
  if (this.master.tasks[newRow].level == this.level) {
    ret = true;
    //compute descendant
    var descNumber = 0;
    for (var i = row + 1; i < this.master.tasks.length; i++) {
      var desc = this.master.tasks[i];
      if (desc.level > this.level) {
        descNumber++;
      } else {
        break;
      }
    }
    //move in memory
    var blockToMove = this.master.tasks.splice(row, descNumber + 1);
    var top = this.master.tasks.splice(0, newRow);
    this.master.tasks = [].concat(top, blockToMove, this.master.tasks);
    //move on dom
    var rows = this.master.editor.element.find("tr[taskid]");
    var domBlockToMove = rows.slice(row, row + descNumber + 1);
    rows.eq(newRow).before(domBlockToMove);

    //recompute depends string
    this.master.updateDependsStrings();
  } else {
    this.master.setErrorOnTransaction(GanttMaster.messages["TASK_MOVE_INCONSISTENT_LEVEL"], this);
    ret = false;
  }
  return ret;
};


/**
 * Moves the current task row down if a valid position exists and the task is not the root task.
 *
 * The method looks for the nearest sibling or valid row position below the current row to relocate the task.
 * It ensures that the task hierarchy and dependencies remain consistent after the move operation.
 *
 * @return {boolean} Returns true if the task row was successfully moved down; otherwise, returns false.
 */
Task.prototype.moveDown = function () {
  //console.debug("moveDown", this);

  //a row below must exist, and cannot move root task
  var row = this.getRow();
  if (row >= this.master.tasks.length - 1 || row == 0)
    return false;

  var ret = false;

  //find nearest brother
  var newRow;
  for (newRow = row + 1; newRow < this.master.tasks.length; newRow++) {
    if (this.master.tasks[newRow].level <= this.level)
      break;
  }

  //is brother
  if (this.master.tasks[newRow] && this.master.tasks[newRow].level == this.level) {
    ret = true;
    //find last desc
    for (newRow = newRow + 1; newRow < this.master.tasks.length; newRow++) {
      if (this.master.tasks[newRow].level <= this.level)
        break;
    }

    //compute descendant
    var descNumber = 0;
    for (var i = row + 1; i < this.master.tasks.length; i++) {
      var desc = this.master.tasks[i];
      if (desc.level > this.level) {
        descNumber++;
      } else {
        break;
      }
    }

    //move in memory
    var blockToMove = this.master.tasks.splice(row, descNumber + 1);
    var top = this.master.tasks.splice(0, newRow - descNumber - 1);
    this.master.tasks = [].concat(top, blockToMove, this.master.tasks);


    //move on dom
    var rows = this.master.editor.element.find("tr[taskid]");
    var aft = rows.eq(newRow - 1);
    var domBlockToMove = rows.slice(row, row + descNumber + 1);
    aft.after(domBlockToMove);

    //recompute depends string
    this.master.updateDependsStrings();
  }

  return ret;
};





// COMPLETEDTODO: Modify this to match the current statuses for NT
// ** TODO: Put in place mechanism to bulk cascade the status to all children
// ** TODO: Have an automatic pop up when task turned to certain statuses - blocked etc.

/* NOTE: For the time being replace this function with a replacement function which allows the task status to be
 * changed to anything - the logic controlling it seems to be arbitrary
 */



/*
 * This function evaluates whether a transition to the given status is valid
 * based on predefined business rules or conditions.
 *
 * @param {string} newStatus - The target status to evaluate for the transition.
 * @returns {boolean} Returns true if the status can be changed to the specified target status, otherwise false.
 */
Task.prototype.canStatusBeChangedTo = function (newStatus) {
  return true
}

//<%------------------------------------------------------------------------  LINKS OBJECT ---------------------------------------------------------------%>
/**
 * Creates a Link object that represents a connection between two tasks with an optional lag in working days.
 *
 * @param {Object} taskFrom - The starting task object for the link.
 * @param {Object} taskTo - The ending task object for the link.
 * @param {number} lagInWorkingDays - The delay or lag time between the tasks in working days.
 * @return {void}
 */
function Link(taskFrom, taskTo, lagInWorkingDays) {
  this.from = taskFrom;
  this.to = taskTo;
  this.lag = lagInWorkingDays;
}


//<%------------------------------------------------------------------------  ASSIGNMENT ---------------------------------------------------------------%>

// NOTE: This is essentially the resource item in Seaview database
/**
 * Represents an assignment for a resource with a specific role and effort.
 *
 * @param {number} id - The unique identifier for the assignment.
 * @param {number} resourceId - The unique identifier of the resource assigned.
 * @param {number} roleId - The unique identifier of the role assigned.
 * @param {number} effort - The effort assigned, usually represented in hours or percentage.
 */
function Assignment(id, resourceId, roleId, effort) {
  this.id = id;
  this.resourceId = resourceId;
  this.roleId = roleId;
  this.effort = effort;
}


//<%------------------------------------------------------------------------  RESOURCE ---------------------------------------------------------------%>

//TODO: Add in additional properties of a resource
//TODO: Add in categorisation enumeration
/**
 * Represents a resource with attributes like ID, name, type, department, etc.
 *
 * @param {number} id - Unique identifier for the resource.
 * @param {string} name - Name of the resource.
 * @param {string} resourceType - Type of the resource.
 * @param {string} resourceDepartment - Department the resource belongs to.
 * @param {string} email - Email address of the resource.
 * @param {string} username - Username associated with the resource.
 * @param {boolean} isActive - Indicates whether the resource is active.
 * @param {Array} workPattern - Work pattern or schedule of the resource.
 * @return {void} This constructor function does not return a value.
 */
function Resource(id, name, resourceType, resourceDepartment, email, username, isActive, workPattern) {
  this.id = id;
  this.name = name;
  this.resourceType = resourceType;
  this.resourceDepartment = resourceDepartment;
  this.email = email;
  this.username = username;
  this.isActive = isActive;
  this.workPattern = workPattern;
}


//<%------------------------------------------------------------------------  ROLE ---------------------------------------------------------------%>

// NOTE: This is essentially the resource_type enumeration
/**
 * Constructs a new Role object with the specified id and name.
 *
 * @param {number|string} id - The unique identifier for the role.
 * @param {string} name - The name or designation of the role.
 * @return {Role} A new instance of the Role object.
 */
function Role(id, name) {
  this.id = id;
  this.name = name;
}




