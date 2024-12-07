import axios from "axios";

export async function sortPosts(sort, posts) {
    let postsArray = Array.isArray(posts) ? [...posts] : [];

    if (sort === "Newest") {
        postsArray.sort((post1, post2) =>
            post1.postedDate < post2.postedDate ? 1 : -1
        );
    } else if (sort === "Oldest") {
        postsArray.sort((post1, post2) =>
            post1.postedDate > post2.postedDate ? 1 : -1
        );
    } else {
        const dict = {};

        for (const post of postsArray) {
            await getReplyComment(post._id, post.commentIDs, dict);
        }

        const otherDict = {};
        for (const [pID, comments] of Object.entries(dict)) {
            for (const comment of comments) {
                if (!otherDict[pID] || otherDict[pID].commentDate < comment.commentDate) {
                    otherDict[pID] = { commentID: comment.commentID, commentDate: comment.commentDate };
                }
            }
        }

        postsArray.sort((post1, post2) => {
            const date1 = otherDict[post1._id]?.commentDate || post1.postedDate;
            const date2 = otherDict[post2._id]?.commentDate || post2.postedDate;
            
            return date2 - date1;
        });
    }

    return postsArray;
}

async function getReplyComment(postID, commentIDs, dict) {
    if (!dict[postID]) {
        dict[postID] = [];
    }

    for (const commentID of commentIDs) {
        try {
            let comment = await axios.get(`http://localhost:8000/comments/${commentID}`);
            comment = comment.data;

            dict[postID].push({
                commentID,
                commentDate: new Date(comment.commentedDate),
            });

            if (comment.commentIDs && comment.commentIDs.length > 0) {
                await getReplyComment(postID, comment.commentIDs, dict);
            }
        } catch (error) {
            console.error(`Error fetching comment ${commentID}:`, error);
        }
    }
}

export function generateTimeStamp(date) {
    // console.log("DATE " + date);
    date = new Date(date);
    let currentDate = new Date();
    let difference = currentDate - date;
    //using milliseconds instead of directly comparing 
    //using Date methods since then we need to account for 
    //different months, years etc. for each case

    let dayDifference = Math.floor(difference / (1000 * 60 * 60 * 24));
    let hourDifference = Math.floor((difference / (1000 * 60 * 60)));
    let minuteDifference = Math.floor((difference / (1000 * 60)));
    let secondDifference = Math.floor((difference / 1000));

    if (dayDifference === 0) {
        if (hourDifference === 0) {
            if (minuteDifference === 0) {
                if (secondDifference === 0) {
                    return "Just now";
                }
                return (secondDifference === 1) ? secondDifference + " second ago" : secondDifference + " seconds ago";
            }
            return (minuteDifference === 1) ? minuteDifference + " minute ago" : minuteDifference + " minutes ago";
        }
        return (hourDifference === 1) ? hourDifference + " hour ago" : hourDifference + " hours ago";
    }

    //hourDifference here **should** be greater than 24 as a given, but just in case
    if (hourDifference >= 24 && dayDifference < 30) {
        return (dayDifference === 1) ? dayDifference + " day ago" : dayDifference + " days ago";
    }

    if (dayDifference < 365) {  //checks within a year

        //handles if months in different years, but not more than a year apart to get accurate differenec
        let yearDifference = (currentDate.getFullYear() - date.getFullYear());
        let monthDifference = yearDifference * 12 + (currentDate.getMonth() - date.getMonth());

        return (monthDifference === 1) ? monthDifference + " month ago" : monthDifference + " months ago";
    }

    // If more than a year
    let yearDifference = currentDate.getFullYear() - date.getFullYear();
    return (yearDifference === 1) ? "1 year ago" : yearDifference + " years ago";
};