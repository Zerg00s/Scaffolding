var config = require('./gulp.config');

config.extend =
{
    getFields: {
        listTitle: "Travel Requests"
    },
    csom : {
        siteUrl:'https://jolera365.sharepoint.com/sites/senate/subsite/',
        listTitle:'TestList',
        listUrl: 'https://jolera365.sharepoint.com/sites/senate/subsite/Lists/',
        siteRelativeUrl: '/sites/senate/subsite/',
        webPartPage: 'Lists/custom/NewForm.aspx'
    }
};
