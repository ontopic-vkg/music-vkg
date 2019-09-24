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
/*
var querySimilarGroupNamesTpl = `PREFIX mo: <http://purl.org/ontology/mo/>
PREFIX foaf: <http://xmlns.com/foaf/0.1/>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>

SELECT  DISTINCT *
WHERE {
    ?group rdf:type mo:MusicArtist;
        foaf:name ?name ;
     FILTER regex(?name, "$groupName$", "i")
}`;
*/

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
    FILTER (?artist = <$artistName>)
}`;
