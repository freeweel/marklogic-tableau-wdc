const register = () => {
    const connector = tableau.makeConnector();

    /**
     * This example shows how to register and query on more than one MarkLogic Optic queries.
     * This uses a generic function to register the tables since the Optic query already defines your
     * columns.
     * 
     * NOTE: Even though you can do multi-tables with WDC, and there are instances where this may be needed,
     *       you should consider that you have the full power of an Optic query that can join results from
     *       document searches, document properties, SQL, and triples.  It is likely to be faster and simpler 
     *       to do the work of joining in your Optic query and return the results as a single table.
     */

    /**
     * Provide multiple serialized optic queries as Javascript objects (will be converted to JSON)
     * NOTE: Optic queries may be serialized by running the query with the 'export()' instead of 'result()' method
     *       De-serialize an Optic query with the 'op.toSource()' method
     */
    const query1 ={"$optic":{"ns":"op","fn":"operators","args":[{"ns":"op","fn":"from-search","args":[{"ns":"cts","fn":"and-query","args":[[{"ns":"cts","fn":"collection-query","args":["person"]},{"ns":"cts","fn":"json-property-value-query","args":["lastName","nakonecznyj","lang=en",1]}],null]},null,null,null]},{"ns":"op","fn":"join-doc-uri","args":[{"ns":"op","fn":"col","args":["uri"]},{"ns":"op","fn":"fragment-id-col","args":["fragmentId"]}]},{"ns":"op","fn":"order-by","args":[[{"ns":"op","fn":"desc","args":[{"ns":"op","fn":"col","args":["score"]}]}]]},{"ns":"op","fn":"join-doc","args":[{"ns":"op","fn":"col","args":["doc"]},{"ns":"op","fn":"fragment-id-col","args":["fragmentId"]}]},{"ns":"op","fn":"join-doc","args":[{"ns":"op","fn":"col","args":["src"]},{"ns":"op","fn":"fragment-id-col","args":["fragmentId"]}]},{"ns":"op","fn":"select","args":[[{"ns":"op","fn":"as","args":["datasource",{"ns":"fn","fn":"string","args":[{"ns":"op","fn":"xpath","args":[{"ns":"op","fn":"col","args":["src"]},"/envelope/headers/dataSource"]}]}]},{"ns":"op","fn":"as","args":["firstname",{"ns":"fn","fn":"string","args":[{"ns":"op","fn":"xpath","args":[{"ns":"op","fn":"col","args":["src"]},"/envelope/instance/person/firstName"]}]}]},{"ns":"op","fn":"as","args":["lastname",{"ns":"fn","fn":"string","args":[{"ns":"op","fn":"xpath","args":[{"ns":"op","fn":"col","args":["src"]},"/envelope/instance/person/lastName"]}]}]},{"ns":"op","fn":"as","args":["ssn",{"ns":"fn","fn":"string","args":[{"ns":"op","fn":"xpath","args":[{"ns":"op","fn":"col","args":["src"]},"/envelope/instance/person/identifiers[type='SSN']/value"]}]}]}],null]},{"ns":"op","fn":"where-distinct","args":[]}]}};
    const query2 ={"$optic":{"ns":"op","fn":"operators","args":[{"ns":"op","fn":"from-search","args":[{"ns":"cts","fn":"and-query","args":[[{"ns":"cts","fn":"json-property-value-query","args":["lastName","nakonecznyj","lang=en",1]},{"ns":"cts","fn":"collection-query","args":["dependentChild"]}],null]},null,null,null]},{"ns":"op","fn":"join-doc-uri","args":[{"ns":"op","fn":"col","args":["uri"]},{"ns":"op","fn":"fragment-id-col","args":["fragmentId"]}]},{"ns":"op","fn":"order-by","args":[[{"ns":"op","fn":"desc","args":[{"ns":"op","fn":"col","args":["score"]}]}]]},{"ns":"op","fn":"join-doc","args":[{"ns":"op","fn":"col","args":["doc"]},{"ns":"op","fn":"fragment-id-col","args":["fragmentId"]}]},{"ns":"op","fn":"join-doc","args":[{"ns":"op","fn":"col","args":["src"]},{"ns":"op","fn":"fragment-id-col","args":["fragmentId"]}]},{"ns":"op","fn":"select","args":[[{"ns":"op","fn":"as","args":["lastname",{"ns":"fn","fn":"string","args":[{"ns":"op","fn":"xpath","args":[{"ns":"op","fn":"col","args":["src"]},"//person/lastName"]}]}]},{"ns":"op","fn":"as","args":["medicaidid",{"ns":"fn","fn":"string","args":[{"ns":"op","fn":"xpath","args":[{"ns":"op","fn":"col","args":["src"]},"//person/identifiers[type='MEDICAID_ID']/value"]}]}]},{"ns":"op","fn":"as","args":["ssn",{"ns":"fn","fn":"string","args":[{"ns":"op","fn":"xpath","args":[{"ns":"op","fn":"col","args":["src"]},"//person/identifiers[type='SSN']/value"]}]}]},{"ns":"op","fn":"as","args":["dob",{"ns":"fn","fn":"string","args":[{"ns":"op","fn":"xpath","args":[{"ns":"op","fn":"col","args":["src"]},"//person/birthInfo/dateOfBirth"]}]}]}],null]},{"ns":"op","fn":"where-distinct","args":[]}]}};
    
    /**
     * Internal method to generically get columns defined for an optic column-types='header' query
     * @param query A serialized Optic query as a JS object (will be converted to JSON)
     * @param tableName A table name string
     * @param tableAlias The alias for the table
     */
    const getColumnsFromOptic = (query, tableId, tableAlias) => {
        // Adjust the query to a 1 item return limit. Clone it so we don't change the original
        const limit1Json = {"ns": "op","fn": "offset-limit","args": [null,1]};
        const queryClone = JSON.parse(JSON.stringify(query));
        queryClone.$optic.args.push(limit1Json);
        const queryLimit1 = JSON.stringify(queryClone);
    
        return fetch('/db/v1/rows?plan=' + encodeURI(queryLimit1) + '&column-types=header')
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
                alias: tableAlias,
                id: tableId,
                columns: cols,
                incrementColumnId: "id"
            };

            return tableInfo;
        })
    }

    /**
     * Define and register the table column definitions
     * @param {*} schemaCallback 
     */
    connector.getSchema = (schemaCallback) => {
        const t1 = getColumnsFromOptic(query1, 'LastNameTable','Search Last Name Property');
        const t2 = getColumnsFromOptic(query2, 'DependentTable','Search Dependents with Last Name Property');
        Promise.all([t1,t2]).then(tableInfoArray => schemaCallback(tableInfoArray));
    };


    /**
     * Get Data from Endpoint
     * This does a search in MarkLogic, then extracts URI, LastName, and FirstName
     * from the returned search results
     * @param {*} table  A table array to store results
     * @param {*} doneCallback
     */
    connector.getData = (table, doneCallback) => {
        const tableId = table.tableInfo.id;
        
        let query = '';
        if (tableId === 'LastNameTable') query = JSON.stringify(query1);
        if (tableId === 'DependentTable') query = JSON.stringify(query2);

        fetch('/db/v1/rows?plan=' + encodeURI(query) + '&column-types=header')
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
