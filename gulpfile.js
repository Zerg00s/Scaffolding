var gulp = require('gulp');
var sppull = require('sppull').sppull;
var spsave = require("gulp-spsave");
var watch = require("gulp-watch");
var prompt = require("gulp-prompt");
var config = require('./gulp.config');
var configOld =require('./gulp.config.old.js');  
var _appConfig = require('./config/app.conf.json');
var _privateConfig = require("./config/_private.conf.json")
var open = require('open');

var Cpass = require("cpass");

var csomapi = require('csom-node')

gulp.task('touch-conf', function() {
    console.log("Checking configs...");
    gulp.src('')
        .pipe(prompt.prompt(config.prompts, function(res) {
            config = config.rebuildConfig(res, config);
        }));
});

gulp.task('sppull-all', ['touch-conf'], function(cb) {
    console.log("Pulling from SharePoint");
    sppull(config.sppull.context, config.sppull.options)
        .then(function() {
            cb();
        })
        .catch(function(err) {
            cb(err);
        });
});

gulp.task("watch-assets", ['touch-conf'], function () {
    console.log("Watch Assets");
    return watch(config.watch.assets, function (event) {
        console.log(event.path);
        gulp.src(event.path, {
            base: config.watch.base
        }).pipe(spsave(config.spsave.coreOptions, config.spsave.creds));
    });
});

gulp.task("publish", ['touch-conf'], function () {
    console.log("Publish Assets");
    return gulp.src(config.watch.assets, {
        base: config.watch.base
    }).pipe(spsave(config.spsave.coreOptions, config.spsave.creds));
});


//Replace contents of the file:
var fs = require('fs')
gulp.task("replace", function () {

    fs.readFile('foo.txt', 'utf8', function (err,data) {
        if (err) {
            return console.log(err);
        }
        var result = data.replace(/DENIS/g, 'ALEX');

        fs.writeFile('foo.txt', result, 'utf8', function (err) {
            if (err) return console.log(err);
        });
    });
 });




//get list of fields from the sp list
gulp.task('getFields',function() {
    //read more about Cpass here: https://github.com/s-KaiNet/sp-request
    var cpass = new Cpass();
    var credentialOptions = {
        'username': _privateConfig.username,
        'password': cpass.decode(_privateConfig.password),
    };

    function initializeField(result) {
        var retVal = {};
        retVal.Id = result.Id;
        retVal.FieldDisplayName = result.Title;
        retVal.FieldInternalName = result.InternalName;
        retVal.FieldType = result.TypeAsString;
        retVal.Required = result.Required;
        retVal.ReadOnlyField = result.ReadOnlyField;
        if (result.Choices) {
            retVal.Choices = result.Choices.results;
        }

        return retVal;
    };

    var spr = require('sp-request').create(credentialOptions);

    spr.get(configOld.getFields.siteUrl + "/_api/web/lists/GetByTitle('" + configOld.getFields.listTitle + "')/fields?$filter=Hidden eq false")
    .then(function (response) {
    
        var results = response.body.d.results;
        var f = {};
        for (var x = 0; x < results.length; x++) {
            if (!results[x].Hidden) {
                if (results[x].InternalName != 'ContentType') {
                    if (results[x].InternalName != 'Attachments') {
                        var field = initializeField(results[x]);
                        f[results[x].InternalName] = field;                
                    }
                }
            }
        }

        //console.log('Title: ' + JSON.stringify(f, null, 4));

    })
    .catch(function(err){
        console.log(err);
    });

})

gulp.task('csom', function(){
    var Cpass = require("cpass");
    var cpass = new Cpass();
    csomapi.setLoaderOptions({url: config.csom.siteUrl});  //set CSOM library settings
    var authCtx = new AuthenticationContext(config.csom.siteUrl);
    authCtx.acquireTokenForUser(_privateConfig.username, cpass.decode(_privateConfig.password), function (err, data) {

        var ctx = new SP.ClientContext(config.csom.siteRelativeUrl);  //set root web
        authCtx.setAuthenticationCookie(ctx);  //authenticate         
        var web = ctx.get_web();

        var webPartXml = '<?xml version="1.0" encoding="utf-8"?>' +
                        '<WebPart xmlns="http://schemas.microsoft.com/WebPart/v2">' +
                            '<Assembly>Microsoft.SharePoint, Version=16.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c</Assembly>' + 
                            '<TypeName>Microsoft.SharePoint.WebPartPages.ContentEditorWebPart</TypeName>' + 
                            '<Title>$Resources:core,ContentEditorWebPartTitle;</Title>' +
                            '<Description>$Resources:core,ContentEditorWebPartDescription;</Description>' +
                            '<PartImageLarge>/_layouts/15/images/mscontl.gif</PartImageLarge>' +
                        '</WebPart>';

        var file = web.getFileByServerRelativeUrl(config.csom.siteRelativeUrl + config.csom.webPartPage);
        var webPartMngr = file.getLimitedWebPartManager(SP.WebParts.PersonalizationScope.shared);
        var webPartDef = webPartMngr.importWebPart(webPartXml);
        var webPart = webPartDef.get_webPart();
        webPartMngr.addWebPart(webPart, 'Main', 1);

        ctx.load(webPart);
        ctx.executeQueryAsync(
        function() {
            console.log(webPart);
        },
            function(){console.log('error')}
        );
        
    });
})
//Get new secure string pass:
//Example of Use:
//gulp createPass --pass MySecrePass
gulp.task('createPass', function(){
    var Cpass = require("cpass");
    var cpass = new Cpass();
    var password = process.argv[4];
    var secured = cpass.encode(password);
    console.log(secured);
} );


gulp.task('open', function(){
    open('http://www.google.com');
})


gulp.task('scriptlink', function(){
    var cpass = new Cpass();
    var credentialOptions = {
        'username': _privateConfig.username,
        'password': cpass.decode(_privateConfig.password),
    };
    var spr = require('sp-request').create(credentialOptions);

    spr.get(config.getFields.siteUrl + "/_api/site/UserCustomActions")
    .then(function (response) {
        var results = response.body.d.results;
        for (var x = 0; x < results.length; x++) {
            var customAction = results[x];
            console.log(customAction);                
        }
    })
    .catch(function(err){
        console.log(err);
    });

    spr.requestDigest(config.getFields.siteUrl)
    .then(function (digest) {
        return spr.post(config.getFields.siteUrl + "/_api/site/UserCustomActions", {
            body: {
               '__metadata': { 'type': 'SP.UserCustomAction' }, 'Location':'ScriptLink',
                    'Sequence':'101', 'Title':'CustomForms', 'ScriptSrc':'~siteCollection/_catalogs/masterpage/src/form_templates.js' 
            },
            headers: {
                'X-RequestDigest': digest,
                "X-HTTP-Method": "POST"
            }
        })
        .then(function (response) {
            console.log('Custom action updated');
        }, function (err) {
            console.log(err);
        });
    });
});