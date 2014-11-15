var TwitterJS = require('twitter');
var secret = require('../../secret.json');
import promises = require('../../util/promises');

class Twitter {
    private twitter = new TwitterJS(secret.twitter);

    private caches: {
        [userId: string]: { lastUpdated: Date; name: any; }
    } = {};

    getDisplayName(userId: string) {
        var cache = this.caches[userId];
        if (cache != null && !isStale(cache.lastUpdated)) {
            return Promise.resolve(cache.name);
        }
        var url = '/statuses/user_timeline.json?user_id=' + userId;
        return new Promise((resolve, reject) => {
            this.twitter.get(url, promises.safe<void>(reject, (json: any) => {
                if (json.statusCode != null) {
                    if (json.statusCode !== 404)
                        throw new Error(json);
                    resolve(null);
                    return;
                }
                var name = json[0].user.name;
                this.caches[userId] = {
                    lastUpdated: new Date(),
                    name: name
                };
                resolve(name);
            }));
        });
    }
}

function isStale(date: Date) {
    var HOURS = 60 * 60 * 1000;
    var staleTime = date.getTime() + 1 * HOURS;
    return Date.now() > staleTime;
}

export = Twitter;
