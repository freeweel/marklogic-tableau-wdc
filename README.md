## Description
This code contains a simple web server that is used for two purposes.  The *connectors* are web pages that are to be accessed by Tableau to register web data connectors that define how to get data from MarkLogic and convert the results to tabular format.

The index.js is the actual web server page used to proxy connections to MarkLogic.  Any URL coming in with a /db prefix will go directly to MarkLogic using the embedded credentials.

For example.

The following URI:  
/db/v1/documents?uri=xyz.json

Will be sent to MarkLogic as:  
/v1/documents?uri=xyz.json

## To Run
Set the parameters for your system in the index.js file.   This includes machine name, port, user name, and password.

You will need to have nodeJS and NPM installed on your system.  Once that is complete, run these commands:
* npm install
* npm start


_NOTE:_ Any changes to the code seem to require a restart of the server

## Setting Queries
There are several example queries that are hard-coded to specific data.  The Optic queries may be replaced by creating your own queries and then serializing them by running the .export() command instead of .result().  