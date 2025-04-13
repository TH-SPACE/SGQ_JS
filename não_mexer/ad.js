const ActiveDirectory = require("activedirectory");

const config = {
    url: 'ldap://redecorp.br',            // servidor LDAP
    baseDN: "dc=redecorp,dc=com",         // domínio base
};

const ad = new ActiveDirectory(config);

module.exports = {
    authenticate: (username, password) => {
        return new Promise((resolve, reject) => {
            ad.authenticate(username, password, (err, auth) => {
                if (err) return reject(err);
                if (!auth) return reject(false);
                return resolve(true);
            });
        });
    }
};
