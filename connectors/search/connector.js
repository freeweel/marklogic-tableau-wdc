const register = () => {
    const connector = tableau.makeConnector();

    /**
     * Define and register the table column definitions
     * @param {*} schemaCallback 
     */
    connector.getSchema = (schemaCallback) => {
        const cols = [
            { id: "uri", dataType: tableau.dataTypeEnum.string },
            { id: "firstName", dataType: tableau.dataTypeEnum.string },
            { id: "lastName", dataType: tableau.dataTypeEnum.string }
        ];

        const tableInfo = {
            alias: "MarkLogic Search Connector",
            id: "SearchTable",
            columns: cols,
            incrementColumnId: "id"
        };
        schemaCallback([tableInfo]);
    };


    /**
     * Get Data from Endpoint
     * This does a search in MarkLogic, then extracts URI, LastName, and FirstName
     * from the returned search results
     * @param {*} table  A table array to store results
     * @param {*} doneCallback
     */
    connector.getData = (table, doneCallback) => {
        fetch('/db/v1/search?q=&options=search-options&pageLength=2')
            .then(response => response.json())
            .then(data => {
                const results = data.results, tableData = [];

                // Iterate over the JSON object
                results.forEach(result => {
                    const person = result.extracted.content[0].envelope.instance.claim.person;
                    row = {
                        "uri": result.uri,
                        "firstName": person.firstName,
                        "lastName": person.lastName
                    }
                    tableData.push(row);
                });

                table.appendRows(tableData);
            })
            .finally(() => doneCallback());
    }

    tableau.registerConnector(connector);

    // Submit the connection when user clicks button or after a 5 seconds have passed
    document.addEventListener('DOMContentLoaded',
        () => {
            document.getElementById('submitButton').addEventListener('click', () => {
                tableau.connectionName = "MarkLogic Search"; // This will be the data source name in Tableau
                tableau.submit(); // This sends the connector object to Tableau
            });
            setTimeout(()=>document.getElementById('submitButton').click(), 5000);
        }
    );
}

register();
