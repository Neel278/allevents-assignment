function isDataValid(data) {
    if (Object.values(data).length > 12) return false;
    if (data.event_id == null || data.event_id == "") return false;
    if (data.eventname == null || data.eventname == "") return false;
    if (data.start_time == null || data.start_time == "") return false;
    if (data.end_time == null || data.end_time == "") return false;
    if (data.timezone == null || data.timezone == "") return false;
    if (data.city == null || data.city == "") return false;
    if (data.state == null || data.state == "") return false;
    if (data.country == null || data.country == "") return false;
    if (data.description == null || data.description == "") return false;
    if (data.banner_url == null || data.banner_url == "") return false;
    if (data.score == null || data.score == "") return false;
    if (data.categories == null) return false;
    return true;
}

function isDataValidRealScenarios(data) {
    let d1 = new Date(data?.start_time);
    let d2 = new Date(data?.end_time);
    let curDate = new Date();
    let difference = d2.getTime() - d1.getTime();
    let difference2 = curDate.getTime() - d1.getTime();
    let totalHours = difference / (1000 * 3600); // difference in time between end_time and start_time
    let totalHours2 = difference2 / (1000 * 3600); // difference in time between current_time and start_time
    if (!isDataValid) {
        return {
            error: true,
            message: "Invalid data found",
            data: null,
        };
    } else if (d1 > d2) {
        return {
            error: true,
            message: "Event start time can't be after end time",
            data: null,
        };
    } else if (data?.description?.length < 128) {
        return {
            error: true,
            message:
                "Bigger discription makes it easier for people to understand about event.",
            data: null,
        };
    } else if (totalHours < 1) {
        return {
            error: true,
            message:
                "Event with duration less than one hour is not supported yet!",
            data: null,
        };
    } else if (totalHours2 < 24) {
        return {
            error: true,
            message: "Events starting time should be atleast after 24 hours.",
            data: null,
        };
    }
    return false;
}

module.exports = { isDataValidRealScenarios };
