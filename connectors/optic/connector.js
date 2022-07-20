const register = () => {
    const connector = tableau.makeConnector();

    const query = {"$optic":{"ns":"op","fn":"operators","args":[{"ns":"op","fn":"from-search","args":[{"ns":"cts","fn":"json-property-word-query","args":["facility","0202C","lang=en",1]},null,null,null]},{"ns":"op","fn":"join-doc-uri","args":[{"ns":"op","fn":"col","args":["uri"]},{"ns":"op","fn":"fragment-id-col","args":["fragmentId"]}]},{"ns":"op","fn":"order-by","args":[[{"ns":"op","fn":"desc","args":[{"ns":"op","fn":"col","args":["score"]}]}]]},{"ns":"op","fn":"join-doc","args":[{"ns":"op","fn":"col","args":["doc"]},{"ns":"op","fn":"fragment-id-col","args":["fragmentId"]}]},{"ns":"op","fn":"join-doc","args":[{"ns":"op","fn":"col","args":["src"]},{"ns":"op","fn":"fragment-id-col","args":["fragmentId"]}]},{"ns":"op","fn":"join-inner","args":[{"ns":"op","fn":"operators","args":[{"ns":"op","fn":"from-view","args":["epsm","tdsEpsmEmployee",null,{"ns":"op","fn":"fragment-id-col","args":["$$sourceId"]}]}]},[{"ns":"op","fn":"on","args":[{"ns":"op","fn":"col","args":["fragmentId"]},{"ns":"op","fn":"col","args":["$$sourceId"]}]}],null]},{"ns":"op","fn":"select","args":[[{"ns":"op","fn":"col","args":["uri"]},{"ns":"op","fn":"as","args":["work_facility",{"ns":"op","fn":"col","args":["facility"]}]},{"ns":"op","fn":"as","args":["employee_name",{"ns":"op","fn":"xpath","args":[{"ns":"op","fn":"col","args":["src"]},"//employee/name"]}]},{"ns":"op","fn":"as","args":["employee_email",{"ns":"op","fn":"xpath","args":[{"ns":"op","fn":"col","args":["src"]},"//email"]}]}],null]}]}};

    /**
     * Define and register the table column definitions
     * @param {*} schemaCallback 
     */
    connector.getSchema = (schemaCallback) => {
        // clone the query, limit to 1 result, and URI encode it
        const queryClone = JSON.parse(JSON.stringify(query));
        const limitTo1 = {"ns": "op","fn": "offset-limit","args": [null,1]};
        queryClone.$optic.args.push(limitTo1);
        const encodedQuery = encodeURI(JSON.stringify(queryClone));

        fetch('/db/v1/rows?plan=' + encodedQuery + '&column-types=header')
        .then(response => response.json())
        .then(data => {
            const cols = data.columns.map(col => {
                colResult = {
                    id: col.name,
                    dataType: tableau.dataTypeEnum.string
                };
                return colResult;
            });

            const tableInfo = {
                alias: "MarkLogic Search Connector",
                id: "SearchTable",
                columns: cols,
                incrementColumnId: "id"
            };

            schemaCallback([tableInfo]);
        })
    };


    /**
     * Get Data from Endpoint
     * This does a search in MarkLogic, then extracts URI, LastName, and FirstName
     * from the returned search results
     * @param {*} table  A table array to store results
     * @param {*} doneCallback
     */
    connector.getData = (table, doneCallback) => {
        const encodedQuery = encodeURI(JSON.stringify(query));
        fetch('/db/v1/rows?plan=' + encodedQuery + '&column-types=header')
            .then(response => response.json())
            .then(data => {
                const cols = data.columns, rows = data.rows, tableData = [];

                // Iterate over the rows
                rows.forEach(row => {
                    const rowResult = {};
                    cols.forEach(col => {
                        rowResult[col.name] = row[col.name];
                    })
                    tableData.push(rowResult);
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
