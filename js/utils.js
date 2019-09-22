function findInListByField(list, field, needle) {
    let pos = null;
    for (let i=0; i < list.length; i++) {
        if (list[i][field] == needle) {
            pos = i;
            break;
        }
    }
    return pos;
}