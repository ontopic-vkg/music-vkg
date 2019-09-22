const MusicArtistTypes = {
    ARTIST: "artist",
    GROUP: "group",
    SOLO_ARTIST: "solo_artist"
}

function MusicGraphData () {
    this.cy = null;
    this.nodes = {};
    this.edges = [];

    this.nodeType = function(typeFromSparql) {
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
    this.clear = function() {
        this.nodes = {};
        this.edges = []; 
        if (this.cy) {
            let collection = this.cy.elements('edge');
            this.cy.remove( collection );
            collection = this.cy.elements('node');
            this.cy.remove( collection );
            // this.cy.remove();
        } else {
            console.log("error: no cy found");
        }
    }

    // 
    this.add = function(record, attachTo) {
        let canvasDataList = [];
        console.log(attachTo);
        let id = record['id'];
        if (!id) {
            console.log(record);
            throw "no valid id found";
        }
        let type = this.nodeType(record['type']);

        // check if node does not already exist
        if(!(id in this.nodes)) {
            console.log('adding node ' + id);
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
        console.log("after adding node");

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
        console.log(this.nodes);
        console.log(this.edges);

        if (this.cy) {
            console.log('adding to graph');
            this.cy.add(canvasDataList);
            this.cy.center();
        }
    }

    this.layout = function() {
        var layout = this.cy.layout({ name: 'cose' });
        layout.run();
    }
}

function MusicGraphSparqlConnector() {
  this.musicGraphData = null;

  this.loadNodeNeighbors = function(id) {
    if (!id) {
        throw "no valid id found";
    }

    console.log(id);
    console.log(this.musicGraphData.nodes);

    let type = this.musicGraphData.nodeType(this.musicGraphData.nodes[id]['type']);
    let params = new URLSearchParams();
    let handler, query, idKey, attachTo, options= {};
    if (type == MusicArtistTypes.GROUP) {
        query = queryGroupMembersTpl.replace("$groupName", this.musicGraphData.nodes[id]['label']);
        idKey = 'artist';
        attachTo = {id: id, label: 'has_member'};
    } else /* if (type = MusicArtistTypes.SOLO_ARTIST) */{
        query = queryArtistIsMemberOfGroupsTpl.replace("$artistName", this.musicGraphData.nodes[id]['label']);
        attachTo = {id: id, label: 'member_of'};
        idKey = 'group';
        // new nodes will be groups
        options['type_hint'] = 'http://purl.org/ontology/mo/MusicGroup';
    //  } else {
    //    throw "not implemented";
    }
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
              'background-color': '#666',
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
              'background-color': '#484',
            }
          },
          {
            selector: 'edge',
            style: {
              'width': 2,
              'line-color': '#ccc',
              'target-arrow-color': '#ccc',
              'target-arrow-shape': 'triangle',
              'label': 'data(label)',
              'target-arrow-shape': 'triangle',
              'font-size': '12px'
            }
          }
        ],
      
        layout: {
          name: 'grid',
          rows: 2
        },
        minZoom: 1e-1,
        maxZoom: 1e1,
        styleEnabled: true  
    }
}