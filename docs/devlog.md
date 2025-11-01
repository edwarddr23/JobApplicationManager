# Backlog

## Company add/deletion functionality.
- A user should be able to insert and delete companies manually from a dedicated page.
- Deliverables:<br>
    - <b>(Backend)</b>:
        - Endpoint for adding a company to the db using a company name passed in (/addcompany)
        - Endpoint for deleting a company from the db using a company name passed in (/removecompany)
        - Endpoint for fetching all companies from db (/companies)
    - <b>(Frontend)</b>: On the home page, there should be a "Configure" page. "Configure" should be found in the home navbar. After selecting "Configure", the user should be led to a page with its own sidebar, which has several options, the one relevant to this being "Companies". The "Companies" page should have a dropdown that lets the user select an existing company in the database and lets them delete it using a delete button. after doing so, it should notify them that the company in question has been deleted. There should also be a section for adding a company, where an input box allows the user to enter a name for a company, and then that name should be validated, parsed, and saved to the database.

## Job board add/deletion functionality.
- A user should be able to insert and delete job boards manually from a dedicated page.
- Deliverables:<br>
    - <b>(Backend)</b>:
        - Endpoint for adding a job board to the db using a job board name passed in (/addjobboard)
        - Endpoint for deleting a job board from the db using a job board name passed in (/removejobboard)
    - <b>(Frontend)</b>: On the home page, there should be a "Configure" page. "Configure" should be found in the home navbar. After selecting "Configure", the user should be led to a page with its own sidebar, which has several options, the one relevant to this being "Job Boards". The "Job Boards" page should have a dropdown that lets the user select an existing job board in the database and lets them delete it using a delete button. after doing so, it should notify them that the job board in question has been deleted. There should also be a section for adding a job board, where an input box allows the user to enter a name for a job board, and then that name should be validated, parsed, and saved to the database.

## Quick Draw functionality.
- User should be able to create quick access links and responses according to their needs. For example, if the user enters an entry for the tag "LinkedIn URL", the user needs to specify the value for "LinkedIn URL" and confirm their changes. Once these changes are confirmed, these changes must be reflected in the database so that they remain persistent for every user. Each row is a tagvalue pair, and each row's behavior should include a viewing mode where the tag, value, and type are read-only with an edit button, and an edit mode where the tag, value, and type are editable, the edit button is disabled, and the confirm and delete buttons are enabled.
- Deliverables:<br>
    - <b>(Backend)</b>:
        - Endpoint for adding new tag and value to the tagvalues table. The tag and value must be validated and cleaned before adding to DB (/addtagvalue)
        - Endpoint for removing a given tag/value from the DB (/removetagvalue)
        - Endpoint for patching a given tag/value from the DB (/edittagvalue)
    - <b>(Frontend)</b>:
        - On the navbar there should be a "Quick Draw" link for the user to select to enter the Quick Draw page. On the Quick Draw page, there must be a "+" button, which will add a row to the Quick Draw page's table of tagvalue pairs. The row should have an input box for the tag, a dropdown for the type, an input box for the value, a delete button to remove the row from the table, and a confirm button to save the changes to the row. These inputs must be validated, cleaned, and then passed to the add tagvalue endpoint for adding a new tag/value pair. There should be a "Save" button which will call the add tagvalue endpoint, and then disable the confirm and delete buttons, leaving only an edit button. After creating a tag/value pair, the tag, value, and the type should appear as a row in a table on the "Quick Draw" page without a manual refresh of the page.
        - Each row should have an edit button on the very end of the row (choose whatever icon you want) and this edit button will open a small window which will allow the user to change the tag, value, or type of the tagvalue entry. The edit button's visibility should be mutually exclusive with the delete and confirm buttons (that is, (delete and confirm) XOR edit). After clicking the submit button after an edit, it should call the patch tagvalue endpoint
        - Each row should have a delete button which allows the user to remove the row from the view. The delete tagvalue endpoint should also be called so the database reflects the changes.
    - <b>(Database)</b>:
    A new table called "tagvalues" must be made which will have the following columns: "tag" (string), "value"(string), and "type" (categorical: "link", "text"). One user may have many tagvalues.

## Cover Letter Saving Functionality.
- User should be able to enter a page from the navbar called "Cover Letters". The link should lead them to a page which stores all of the cover letters they have uploaded, allowing them to add, delete, and upload cover letter files and save them under a label of their choosing.
- Deliverables:<br>
    - <b>(Backend)</b>:
        - Endpoint for adding new cover letter to coverletters table in database (/addcoverletter)
        - Endpoint for removing a given cover letter from the DB (/removecoverletter)
        - Endpoint for patching a given cover letter in the coverletters table (/editcoverletter)
    - <b>(Frontend)</b>:
        - On the navbar should be a "Cover Letters" link which leads them to the Cover Letters page. This page should have a "+" button on the top which on click, adds a row to the table of cover letters. It should already be in edit mode. In edit mode, it should have a section for the user to drag and drop a document, or perhaps browse somewhere local on their computer to upload a document. It should only accept .pdf files and validate that a given file uploaded is .pdf or not. If it's not a PDF, reject the upload and display an error message saying they can't upload the document because it is not the right file type. In edit mode, the edit button should be disabled and the confirm and delete buttons should be enabled. A text input box should be available labeled "Label" to let the user call their cover letter whatever they choose. On confirm, it should validate whether or not a valid file was uploaded or not. If it wasn't, display an error message that lets them know they must submit a cover letter or discard the row. Otherwise, it is a valid upload, call the addcoverletter endpoint and then change the row to viewing mode (where they can see only the label, the filename, and the edit button).
        - Each row should show the label, the filename, and either the edit button when the row is in viewing mode or the confirm and delete buttons when the row is in edit mode.
        - When the row already has a successful saved entry, and the user enters edit mode and changes a value, the changed value should be passed to the editcoverletter endpoint so the database reflects the changes, and the frontend should also make its own changes so it's updated as soon as the user clicks the confirm button.
    - <b>(Database)</b>:
    A new table called "coverletters" must be made which will have the following columns: "id" (serial?) PK, filename (VARCHAR), mime_type (VARCHAR), and file_data (BYTEA).

# Bonus functionalities.

## Email reminder for an interview.

## Switch available at all times to switch between light and dark mode