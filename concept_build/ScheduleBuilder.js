/** MakeMyFuture ScheduleBuilder
 * The ScheduleBuilder class helps build the schedule
 * based on the nodes selected on the IGETCTable.
 * 
 * Required DOM elements for ScheduleBuilder successful execution.
 * 
 * table, id = ScheduleBuilder
 * table row, id = builderHeader
 * table row, id = builderRows
 * 
 * @author Pirjot Atwal
 * @file ScheduleBuilder.js
 * @version 08/07/2021
 */

//TODO: Add a "Move All to Bank" Button which moves all classes to the bank (update_headers)
//TODO: Add a "Clear all button" which unselects all classes currently selected
//TODO: Add a display to see classes/units per semester as provided by Analytics
//TODO: Restyle Rows (Do this in a way so that backend is easy to change)

class ScheduleBuilder
{
    static initialize(id, builderHeader = "builderHeader", builderRows = "builderRows")
    {
        ScheduleBuilder.id = id;
        ScheduleBuilder.instance = document.getElementById(id);
        ScheduleBuilder.body = ScheduleBuilder.instance.getElementsByTagName("tbody")[0];
        ScheduleBuilder.builderHeader = document.getElementById(builderHeader);
        ScheduleBuilder.builderRows = document.getElementById(builderRows);
        ScheduleBuilder.columns = 1;
        //Array of arrays with class instances
        ScheduleBuilder.semesters = [];
        ScheduleBuilder.initializeContent();
    }

    /** initializeContent
     * 
     * Initializes ScheduleBuilder schedule builder's header and its contents
     * to an empty table based on the current value of 
     * ScheduleBuilder.columns (by default 1)
     * 
     */
    static initializeContent()
    {
        //The Schedule Builder assumes that the given table instance
        //has two rows by default (ids by "builderHeader" and "builderRows")
        //The Schedule Builder assumes that the table will have 
        //ONLY 2 rows after initialization, ATLEAST 1 column with classes,
        //and assumes that the last column of the table's second
        //row is the "bank" of all selected classes.
        //The IGETCTable will repeatedly call the Schedule Builder's
        //update function, passing in its buttons. The Schedule Builder
        //will, on update, check through all buttons in all of its columns
        //and add/remove them as needed. When adding a button, it will be added
        //to the "bank." The Schedule Builder's columns will be built based
        //on the number of columns determined in the Form class. They will be
        //filled with "Semester 1, Semester 2, ..." headers and "No classes selected"
        //in each of the entries (selectable as spans).

        // Event Listeners to Add/Remove Classes
        document.addEventListener("Class Selected", async (evt) => {
            let clas = await ClassRepo.get_class(evt.acr);
            ScheduleBuilder.add_class(clas);
        });

        document.addEventListener("Class Unselected", async (evt) => {
            let clas = await ClassRepo.get_class(evt.acr);
            ScheduleBuilder.remove_class(clas);
        });

        ScheduleBuilder.update_header(ScheduleBuilder.columns);
    }

    /** update_header
     * 
     * Updates ScheduleBuilder table's header to be
     * "Semester 1 | Semester 2 | ... | Selected Classes"
     * where the number of semesters is equivalent to the number
     * of columns passed in. Sets ScheduleBuilder.columns to the passed in number.
     * 
     * @param {Number} columns an integer, equivalent to the number of semesters
     */
    static update_header(columns)
    {
        if (columns <= 0) //Columns must be > 0
        {
            return;
        }

        ScheduleBuilder.columns = columns;
        //Change the header row to "Semester 1 | Semester 2 | ... | Selected Classes"
        //Clear the header
        ScheduleBuilder.builderHeader.innerHTML = "";
        for (let i = 1; i < columns + 2; i++)
        {
            let newSemester = document.createElement("th");
            newSemester.textContent = "Semester " + i;
            if (i == columns + 1) { // Last column is bank
                newSemester.textContent = "Selected Classes";
            }
            ScheduleBuilder.builderHeader.appendChild(newSemester);
        }

        ScheduleBuilder.fill_entries();
    }

    /** fill_entries
     * 
     * Clears ScheduleBuilder table's second row entries
     * and adds all the classes in currently selected
     * into the bank.
     * 
     */
    static async fill_entries()
    {
        //Clear the rows
        ScheduleBuilder.builderRows.innerHTML = "";
        //Create columns for each semester
        for (let i = 0; i < ScheduleBuilder.columns + 1; i++)
        {
            let unselected = document.createElement("td");
            unselected.id = "builderNode" + i;

            //Add the span for each of the elements "No classes selected message"
            let new_span = document.createElement("span");
            new_span.textContent = "No classes selected";
            unselected.appendChild(new_span);

            //TODO: Clean up
            //Set drag functions
            unselected.addEventListener("drop", (evt) => {
                let orig_parent_id = evt.dataTransfer.getData("orig_parent_id");
                let target = evt.target;

                //If the user is dropping into the "No classes selected" span, set the evt.target to be its parent instead
                if (target.localName != "td")
                {
                    target = target.parentElement;
                }

                if(target.id != orig_parent_id && target.localName == "td") //Only allow buttons to be dropped into tds that aren't its current parent
                {
                    //Clear the td's text content in its span
                    target.childNodes[0].textContent = "";
                    //Drop First to avoid getElementById collision.
                    evt.preventDefault();
                    let data = evt.dataTransfer.getData("id");
                    target.appendChild(document.getElementById(data));

                    //Set the original td's span's text content
                    let orig_td = document.getElementById(orig_parent_id);
                    if (orig_td.childNodes.length == 1) //This semester has only its span left
                    {
                        //Grab the span and change its content
                        orig_td.childNodes[0].textContent = "No classes selected";
                    }

                    //Update the semesters array (for generating the schedule)
                    ScheduleBuilder.update_semesters();
                }
            });
            unselected.addEventListener("dragover", (evt) => {allowDrop(evt);});

            ScheduleBuilder.builderRows.appendChild(unselected);
        }
        while (ClassRepo.ready == false) {
            await delay(500);
        }

        //Add all classes currently in the ClassRepo bank
        for (let clas of ClassRepo.selected) {
            ScheduleBuilder.add_class(clas);
        }
        ScheduleBuilder.update_semesters();
    }

    /** add_class
     * 
     * Adds a class to this table's bank (the last column of the second row).
     * Sets the button's draggable function.
     * 
     * @param {JSON} clas - The new class to add to the bank
     */
    static add_class(clas)
    {
        //Get the last column of the second row
        let semesters = collect_to_arr(ScheduleBuilder.builderRows.getElementsByTagName("td"));
        let button_area = semesters[semesters.length - 1];
        //Clear the text content of the area (span element)
        button_area.childNodes[0].textContent = "";

        //Append to GUI
        let new_button = gen_drag_button(clas["NAME"], "builder" + clas["DIVISION"] + "-" + clas["NUMBER"], (evt) => {
            evt.dataTransfer.setData("orig_parent_id", evt.target.parentElement.id);
            drag(evt);
        });
        new_button.acr = clas["DIVISION"] + "-" + clas["NUMBER"];
        new_button.name = clas["NAME"];

        button_area.appendChild(new_button);
    }

    /** remove_class
     * 
     * Removes the class from this table, regardless of its position.
     * 
     * @param {JSON} clas - The class to remove from the table.
     */
    static remove_class(clas)
    {
        //Find the column that the button is in
        let semesters = collect_to_arr(ScheduleBuilder.builderRows.getElementsByTagName("td"));
        let semester = null;
        for (let sem of semesters) //For every semester (including the bank) in the second row
        {
            for (let c of sem.getElementsByTagName("button")) // For every class in this semester
            {
                if (c.acr == clas["DIVISION"] + "-" + clas["NUMBER"]) // If this class is the class we're looking for
                {
                    semester = sem; // Set semester to the current semester
                    
                    //Remove the class from this semester
                    sem.removeChild(c);
                    //If the semester has only its span left, change the span to "No classes selected"
                    if (sem.childNodes.length == 1)
                    {
                        //Selects Span
                        sem.childNodes[0].textContent = "No classes selected";
                    }

                    break;
                }
            }
            if (semester != null) //The class was found in this semester
            {
                break;
            }
        }
    }

    static async update_semesters() {
        ScheduleBuilder.semesters = [];
        let semesters = collect_to_arr(ScheduleBuilder.builderRows.getElementsByTagName("td"));
        for (let sem of semesters) //For every semester (including the bank) in the second row
        {
            let sem_arr = [];
            for (let c of sem.getElementsByTagName("button")) // For every class in this semester
            {
                sem_arr.push(await ClassRepo.get_class(c.acr)); 
            }
            ScheduleBuilder.semesters.push(sem_arr);
        }
        //Remove the classes from the bank
        ScheduleBuilder.semesters.splice(ScheduleBuilder.semesters.length - 1);

        let new_event = document.createEvent("HTMLEvents");
        new_event.initEvent("Semester Update", true, true);
        document.dispatchEvent(new_event);
    }

    //TODO: Improve, move to Analytics probably
    static save_schedule() {
        let data = JSON.stringify(ScheduleBuilder.semesters);
        let filename = "schedule.json";
        let type = "json";
        var file = new Blob([data], {type: type});
        if (window.navigator.msSaveOrOpenBlob)
            window.navigator.msSaveOrOpenBlob(file, filename);
        else {
            var a = document.createElement("a"),
                    url = URL.createObjectURL(file);
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            setTimeout(function() {
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);  
            }, 0); 
        }
    }
}

//From Form
document.addEventListener("Change Semesters", (evt) => {
    ScheduleBuilder.update_header(evt.semesters);
});