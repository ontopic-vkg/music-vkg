
function sparqlResponseHandler(currentObj, currList) {
    return function(response) {
        const rows = response.data.results.bindings;
        currentObj[currList] = [];
        if (rows.length > 0) {
            rows.forEach(function(item, index){
                var record = {};
                for (var prop in item) {
                    if (item.hasOwnProperty(prop)) {
                        record[prop] = item[prop].value;
                    }
                }
                currentObj[currList].push(record);
            })
        } else {
            console.log("no data from SPARQL end point");
        }
    }
}

function sparqlResponseHandlerCallback(musicGraphData, idKey, attachTo, options) {
    return function(response) {
        console.log(sparqlResponseHandlerCallback);
        const rows = response.data.results.bindings;
        let data = {};
        if (rows.length > 0) {
            console.log("rows");
            rows.forEach(function(item, index){
                var record = {};
                var id = null;
                for (var prop in item) {
                    if (!item.hasOwnProperty(prop)) {
                        continue;
                    }
                    record[prop] = item[prop].value;
                    if (prop == idKey) {
                        id = item[prop].value
                    }
                }
                if (id === null) {
                    console.log("no valid id was found as key '" + idKey + "'");
                } else {
                    if (!('id' in record)) {
                        console.log("set id");
                        record['id'] = id;
                    } else {
                        console.log("id already set");
                    }
                    if (!('type' in record) && ('type_hint' in options)) {
                        record['type'] = options['type_hint'];
                        console.log("type_hint used");
                    }                    
                    console.log(record);
                    data[id] = record;
                }

                musicGraphData.add(record, attachTo);
            });
            // start to layout the data
            musicGraphData.layout();
        } else {
            console.log("no data from SPARQL end point");
        }
    }
}
