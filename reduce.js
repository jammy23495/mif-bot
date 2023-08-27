var _ = require('lodash');
let json = [{
        "ID": 8,
        "Posted_By": "ADMIN ADMIN",
        "Subject": "GAP ANALYSIS : IMPLEMENTATION OF CBPM",
        "Question": "A Study about implementation of CBPM in the IN was done by the Young Officers of MTU Mbi as a Training Exercise. The report submitted by them is shared on this forum to seek suggestions and guidance from the environment. Officers of NATAA  Professional Directorates at IHQ  Professional Depts at AA  other MTUs / Trials Teams and personnel who have served in MTUs but are now posted in other Units are requested to examine and comment. On receipt of suggestions and recommendations  a suitable case would be taken up with relevant stakeholdersCBPM Gap Analysis Study by Young Officers of MTU Mbi - Jun 22.pdf ",
        "FeedType": "Query",
        "Posted_On": "June 22nd 2012",
        "Likes": 3,
        "Comments": 1,
        "Views": 6,
        "Comment_By": "ADMIN",
        "Commented_On": "April 12th 2023",
        "Category": "Marine Engineering"
    },
    {
        "ID": 9,
        "Posted_By": "ADMIN ADMIN",
        "Subject": " FREQUENT LOSS OF SUCTION IN FIREMAIN AND OTHER SEA WATER PUMPS IN CASE OF FACS/ WJFACS/ SMALL CRAFTS",
        "Question": "  1.  Smaller draughts vessels (with draughts less than 2m) like FACs/ WJFACs have an inherent problem of frequent loss of suction in fire main pumps during high speed operations and choppy sea states. Quoting an instance from own personal experience  MCR had to request Bridge to come down in Engine revolutions in order to have a raise in the sea water head in the sea tube as it was prominently visible upon removal of suction strainer from the body/ housing that the sea water column is low and the centrifugal pump's impeller was rotating dry. Whereas  as soon as the vessel's speed was reduced  the sea water column rose and water started coming out of the opened strainer housing. Upon fitment of the strainer back in place and starting the pump  it immediately developed the required suction and discharge pressures.\r\n  2.  Upon close scrutiny of the EMAPS  it was also observed that the fire main pumps had been frequently overhauled with replacement of mechanical seals on almost every occasion. It was concluded that even though below the water line  the fire main pump sea tubes do not have sufficient water head/column when the vessel is operating at higher speeds and choppy sea states.\r\n  3.  Although CAT II ABER replacement of present M/s BE pumps (80 TPH) with M/s Johnson pumps are approved and being progressed  there is a need to consider this frequent problem faced by the ship staff and revamp/ improve upon the deign.\r\n    ",
        "FeedType": "Post",
        "Posted_On": "June 22nd 2012",
        "Likes": 1,
        "Comments": 1,
        "Views": 2,
        "Comment_By": "ADMIN",
        "Commented_On": "April 12th 2023",
        "Category": "Marine Engineering"

    }
]

function groupBy(dataToGroupOn, fieldNameToGroupOn, fieldNameForGroupName, fieldNameForChildren) {
    var result = _.chain(dataToGroupOn)
        .groupBy(fieldNameToGroupOn)
        .toPairs()
        .map(function (currentItem) {
            return _.zipObject([fieldNameForGroupName, fieldNameForChildren], currentItem);
        })
        .value();
    return result;
}

var result = groupBy(json, 'FeedType', 'FeedType', 'data');
console.log(JSON.stringify(result))