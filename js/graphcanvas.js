const MusicArtistTypes = {
    ARTIST: "artist",
    GROUP: "group",
    SOLO_ARTIST: "solo_artist",
    TAG: "tag"
}

class MusicGraphData {
    constructor (){
        this.cy = null;
        this.nodes = {};
        this.edges = [];
    }

    nodeType(typeFromSparql) {
        if (typeFromSparql === null) {
            throw "argument must not be null";
        }

        let lastSlashPos = typeFromSparql.lastIndexOf('/');
        let lastTerm = typeFromSparql.substring(lastSlashPos + 1);
        if (lastTerm == 'MusicGroup') {
            return MusicArtistTypes.GROUP;
        } else if (lastTerm == 'SoloMusicArtist') {
            return MusicArtistTypes.SOLO_ARTIST;
        } else if (lastTerm == 'MusicArtist') {
            return MusicArtistTypes.ARTIST;
        } else if (typeFromSparql == "http://purl.org/muto/core#Tagging"){
            return MusicArtistTypes.TAG;
        } else {
            throw typeFromSparql + " could not be classified";
        }
    }

    // clear data when starting over
    clear() {
        this.nodes = {};
        this.edges = []; 
        if (this.cy) {
            let collection = this.cy.elements('edge');
            this.cy.remove( collection );
            collection = this.cy.elements('node');
            this.cy.remove( collection );
            // this.cy.remove();
        } else {
            throw "error: cy not atached";
        }
    }

    // 
    add(record, attachTo) {
        let canvasDataList = [];
        let id = record['id'];
        if (!id) {
            throw "no valid id found";
        }
        let type = this.nodeType(record['type']);

        // check if node does not already exist
        if(!(id in this.nodes)) {
            this.nodes[id] = record;

            // TODO: add label
            let label = "no label set";
            if ('label' in record) {
                label = record['label']
            }
            let d = {group: 'nodes',
                     data: {
                        id: id,
                        label: label,
                        type: type
                    }};
            canvasDataList.push(d);
        }

        if (attachTo['id']) {
            let relation = {source: attachTo['id'], target:id};
            if (attachTo['label']) {
                relation['label'] = attachTo['label'];
            } else {
              relation['label'] = "no relation set";
            }
            this.edges.push(relation);
            let d = {group: 'edges', data:relation};
            canvasDataList.push(d);
        }

        if (this.cy) {
            this.cy.add(canvasDataList);
            this.cy.center();
        }
    }

    layout() {
        var layout = this.cy.layout({ name: 'cola' });
        layout.run();
    }
}

class MusicGraphSparqlConnector {
    constructor() {
        this.musicGraphData = null;
    }

    getArtistsFromGoupHandler(id) {
        // take the correct template and replace the criterium
        let query = queryGroupMembersTpl.replace("$group", this.musicGraphData.nodes[id]['id']);
        // this field will contain the id in the result set
        let artistIdKey = 'artist';
        // to which node should the result be attached to
        let attachTo = {id: id, label: 'has_member'};
        let params = new URLSearchParams();
        params.append('query', query);
        console.log(query);
        let options = {};
        let handler = sparqlResponseHandlerCallback(this.musicGraphData, artistIdKey, attachTo, options);
        return [params, handler];
    }

    getGroupsFromMemberHandler(id) {
        // take the correct template and replace the criterium
        let query = queryArtistIsMemberOfGroupsTpl.replace("$artist", this.musicGraphData.nodes[id]['id']);
        let attachTo = {id: id, label: 'member_of'};
        let artistIdKey = 'group';
        // new nodes will be groups
        let options = {type_hint: 'http://purl.org/ontology/mo/MusicGroup'};
        let params = new URLSearchParams();
        params.append('query', query);
        console.log(query);
        let handler = sparqlResponseHandlerCallback(this.musicGraphData, artistIdKey, attachTo, options);
        return [params, handler];
    }

    getTagsFromArtistHandler(id) {
        let query = getTagsQueryTpl.replace("$artistType", this.musicGraphData.nodes[id]['type']).replace("$uri", this.musicGraphData.nodes[id]['id']);
        let params = new URLSearchParams();
        params.append('query', query);
        console.log(query);
        let attachTo = {id: id, label: 'tag'};
        let options = {};
        let handler = sparqlResponseHandlerCallback(this.musicGraphData, 'tag', attachTo, options);
        return [params, handler];
    }

    loadNodeNeighbors(id) {
        if (!id) {
            throw "no valid id found";
        }

        let type = this.musicGraphData.nodeType(this.musicGraphData.nodes[id]['type']);
        let promise1, promise2;
        console.log("querying data for type " + type);
        if (type == MusicArtistTypes.GROUP) {
            console.log("In group");
            let [aparams, ahandler] = this.getArtistsFromGoupHandler(id);
            promise1 = axios.post(sparqlEndPoint, aparams).then(ahandler);
            let [tparams, thandler] = this.getTagsFromArtistHandler(id);
            promise2 = axios.post(sparqlEndPoint, tparams).then(thandler);
        } else if (type == MusicArtistTypes.SOLO_ARTIST || type == MusicArtistTypes.ARTIST) {
            let [gparams, ghandler] = this.getGroupsFromMemberHandler(id);
            promise1 = axios.post(sparqlEndPoint, gparams).then(ghandler);
            let [tparams, thandler] = this.getTagsFromArtistHandler(id);
            promise2 = axios.post(sparqlEndPoint, tparams).then(thandler);
        } else if (type == MusicArtistTypes.TAG) {
            console.log("error: nodes of type " + type + " should not be actionable");
            return;
            // let [aparams, ahandler] = this.getGroupMembersHandler(id);
            // promise1 = axios.post(sparqlEndPoint, aparams).then(ahandler);
            // let [gparams, ghandler] = this.getGroupOfArtistHandler(id);
            // promise2 = axios.post(sparqlEndPoint, gparams).then(ghandler);
        } else {
            console.log("error: there should be no nodes of type " + type);
            return;
        }
        // options.launched_at = Date.now();

        let mgd = this.musicGraphData;
        Promise.all([promise1, promise2]).then(function(r1, r2) {
            console.log('In callback: relayout the graph');
            // start to layout the data
            mgd.layout();
        });
    }
}

getInitGraphData = function(){
    return  {
        container: document.getElementById('graphcanvas'), // container to render in
        elements: [],
      
        style: [{
            // all nodes
            selector: 'node',
            style: {
              'background-color': '#999',
              'label': 'data(label)',
              'shape': 'rectangle',
              'width': 'label',
              'height': 'label',
              'font-size': '12px',
              'text-background-opacity': 1,
              'color': '#000',
              'text-background-color': '#888',
              'text-background-shape': 'roundrectangle',
              'text-background-opacity': 1, //              'text-margin-x': '10px'
              'text-background-padding': '3px',
              'text-halign': 'center',
              'text-valign': 'center'
            }
          },

          // groups are green
          {
            selector: 'node[type="group"]',
            style: {
              'background-color': '#80F080',
              'text-background-color': '#80F080'
            }
          },
      
          // artists are blue
          {
            selector: 'node[type="artist"]',
            style: {
              'background-color': '#80D7F0',
              'text-background-color': '#80D7F0'
            }
          },

          // tags are yellow
          {
            selector: 'node[type="tag"]',
            style: {
              'background-color': '#eaef72',
              'text-background-color': '#eaef72'
            }
          },

          {
            selector: 'edge',
            style: {
              'width': 1,
              'line-color': '#aaa',
              'curve-style': 'bezier',
              'target-arrow-color': '#aaa',
              'target-arrow-shape': 'vee',
              'label': 'data(label)',
              'font-size': '12px',
              'text-rotation': 'autorotate',
              'target-endpoint': 'outside-to-node-or-label',
              'source-endpoint': 'outside-to-node-or-label',
              'source-distance-from-node': '5px',
              'target-distance-from-node': '5px'
            }
          }
        ],
      
        layout: {
          name: 'cola'
        },
        minZoom: 1,
        maxZoom: 1,
        styleEnabled: true  
    }
}
