module.exports = (function() {
    var context = require('./config/_private.conf.json');
    var appConf = require('./config/app.conf.json');

    var Cpass = require("cpass");
    var cpass = new Cpass();

    context.password = cpass.decode(context.password);

    var config = {
        sppull: {
            context: context,
            options: {
                spRootFolder: appConf.spRootFolder,
                dlRootFolder: appConf.dlRootFolder
            }
        },
        spsave: {
            siteUrl: context.siteUrl,
            username: context.username,
            domain: context.domain,
            password: context.password,
            folder: appConf.spRootFolder,
            flatten: false,
            checkin: true,
            checkinType: 1
        },
        watch: {
            assets: appConf.dlRootFolder.replace("./", "") + "/**/*.*",
            base: appConf.dlRootFolder.replace("./", "")
        },
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