var queryGroupMembersTpl = `PREFIX mo: <http://purl.org/ontology/mo/>
PREFIX foaf: <http://xmlns.com/foaf/0.1/>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

SELECT  DISTINCT ?artist ?artistName ?group ?groupName (?artistName AS ?label) ?type
WHERE {
    ?artist rdf:type ?type;
        foaf:name ?artistName ;
        mo:member_of ?group .
    ?group  foaf:name ?groupName .
    FILTER (?type = mo:MusicArtist && ?group=<$group>)
}`;

var queryArtistsByNameTpl = `PREFIX mo: <http://purl.org/ontology/mo/>
PREFIX foaf: <http://xmlns.com/foaf/0.1/>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

SELECT  DISTINCT *
WHERE {
    ?uri rdf:type ?type;
        foaf:name ?name.
    FILTER ((?type = mo:SoloMusicArtist || ?type = mo:MusicGroup )&& regex(?name, "$artistName", "i"))        
}`;

var queryArtistIsMemberOfGroupsTpl = `PREFIX mo: <http://purl.org/ontology/mo/>
PREFIX foaf: <http://xmlns.com/foaf/0.1/>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

SELECT  DISTINCT ?artist ?artistName ?group ?groupName (?groupName AS ?label)
WHERE {
    ?artist mo:member_of ?group;
           foaf:name ?artistName.
    ?group foaf:name ?groupName
    FILTER (?artist = <$artist>)
}`;

var queryGetTypesTpl = `PREFIX mo: <http://purl.org/ontology/mo/>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

SELECT  DISTINCT *
WHERE {
    <?uri> rdf:type ?o .
  FILTER (?o = ?type )
}`;

var getTagsQueryTpl = `PREFIX mo: <http://purl.org/ontology/mo/>
PREFIX foaf: <http://xmlns.com/foaf/0.1/>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX muto: <http://purl.org/muto/core#>

SELECT ?tag (?tagLabel AS ?label) (muto:Tagging AS ?type)
WHERE {
    ?tag muto:taggedResource ?artist;
         muto:hasTag ?tagName .
    ?artist rdf:type ?artistType .
    ?tagName muto:tagLabel ?tagLabel
    FILTER (?artistType = <$artistType> && ?artist=<$uri> )
}
LIMIT 20`;