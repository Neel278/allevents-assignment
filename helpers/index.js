function isDataValid(data) {
    if ((Object.values(data)).length > 12) return false;
    if (data.event_id == null || data.event_id == '') return false;
    if (data.eventname == null || data.eventname == '') return false;
    if (data.start_time == null || data.start_time == '') return false;
    if (data.end_time == null || data.end_time == '') return false;
    if (data.timezone == null || data.timezone == '') return false;
    if (data.city == null || data.city == '') return false;
    if (data.state == null || data.state == '') return false;
    if (data.country == null || data.country == '') return false;
    if (data.description == null || data.description == '') return false;
    if (data.banner_url == null || data.banner_url == '') return false;
    if (data.score == null || data.score == '') return false;
    if (data.categories == null) return false
    return true;
}

module.exports = { isDataValid }
