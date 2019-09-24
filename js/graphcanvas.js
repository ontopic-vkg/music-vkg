const MusicArtistTypes = {
    ARTIST: "artist",
    GROUP: "group",
    SOLO_ARTIST: "solo_artist"
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

    loadNodeNeighbors(id) {
        if (!id) {
            throw "no valid id found";
        }

        let type = this.musicGraphData.nodeType(this.musicGraphData.nodes[id]['type']);
        let params = new URLSearchParams();
        let handler, query, idKey, attachTo, options= {};
        if (type == MusicArtistTypes.GROUP) {
            // take the correct template and replace the criterium
            query = queryGroupMembersTpl.replace("$group", this.musicGraphData.nodes[id]['id']);
            // this field will contain the id in the result set
            idKey = 'artist';
            // to which node should the result be attached to
            attachTo = {id: id, label: 'has_member'};
        } else /* if (type = MusicArtistTypes.SOLO_ARTIST) */{
            query = queryArtistIsMemberOfGroupsTpl.replace("$artist", this.musicGraphData.nodes[id]['id']);
            attachTo = {id: id, label: 'member_of'};
            idKey = 'group';
            // new nodes will be groups
            options['type_hint'] = 'http://purl.org/ontology/mo/MusicGroup';
        //  } else {
        //    throw "not implemented";
        }
        options.launched_at = Date.now();
        params.append('query', query);
        handler = sparqlResponseHandlerCallback(this.musicGraphData, idKey, attachTo, options);
        axios.post(sparqlEndPoint, params).then(handler);
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
              'text-halign': 'center',
              'text-valign': 'center'
            }
          },
      
          // groups are green
          {
            selector: 'node[type="group"]',
            style: {
              'background-color': '#8F8',
            }
          },
          {
            selector: 'edge',
            style: {
              'width': 2,
              'line-color': '#fcc',
              'curve-style': 'bezier',
              'target-arrow-color': '#fcc',
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
