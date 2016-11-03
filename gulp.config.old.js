module.exports = (function() {
    var context = require('./config/_private.conf.json');
    var appConf = require('./config/app.conf.json');

    var Cpass = require("cpass");
    var cpass = new Cpass();

    context.password = cpass.decode(context.password);
    var config = {
        getFields: {
            listTitle: "Travel Requests",
            siteUrl: context.siteUrl
        },
        csom:{
            siteUrl:'https://jolera365.sharepoint.com/sites/senate/subsite/',
            listTitle:'TestList',
            listUrl: 'https://jolera365.sharepoint.com/sites/senate/subsite/Lists/',
            siteUrl: 'https://jolera365.sharepoint.com/sites/senate/subsite/',
            siteRelativeUrl: '/sites/senate/subsite/',
            webPartPage: 'Lists/custom/NewForm.aspx'
        }
    };

    return config;
})();