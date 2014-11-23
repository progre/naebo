class Session {
    constructor(private session: any) {
    }

    user() {
        var passportUser = this.session.passport.user;
        if (passportUser == null) {
            return null;
        }
        return {
            provider: passportUser.provider,
            providerId: passportUser.providerId,
            displayName: passportUser.displayName,
            photo: passportUser.photo,

            twitterAccessToken() {
                return {
                    token: passportUser.token,
                    tokenSecret: passportUser.tokenSecret
                };
            }
        };
    }

    logout() {
        this.session.passport = null;
        this.session.save();
    }
}

export = Session;
