var gulp = require('gulp');
var sppull = require('sppull').sppull;
var spsave = require("gulp-spsave");
var watch = require("gulp-watch");
var config = require('./gulp.config');
var Cpass = require("cpass");
var _privateConfig = require("./config/_private.conf.json")

console.log(_privateConfig);

gulp.task('sppull-all', function(cb) {
    console.log("Pulling from SharePoint");
    console.log(config.sppull.context);
    console.log(config.sppull.options);
    sppull(config.sppull.context, config.sppull.options)
        .then(function() {
            cb();
        })
        .catch(function(err) {
            cb(err);
        });
});

gulp.task("watch-assets", function () {
    console.log("Watch Assets");
    return watch(config.watch.assets, function (event) {
        console.log(event.path);
        gulp.src(event.path, {
            base: config.watch.base
        }).pipe(spsave(config.spsave));
    });
});

gulp.task("publish", function () {
    console.log("Publish Assets");
    return gulp.src(
        config.watch.assets, {
            base: config.watch.base
        }).pipe(spsave(config.spsave));
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

    spr.get(config.getFields.siteUrl + "/_api/web/lists/GetByTitle('" + config.getFields.listTitle + "')/fields?$filter=Hidden eq false")
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

//---------- CEWP
    var webPartXml = '<?xml version="1.0" encoding="utf-8"?>' +
'<WebPart xmlns="http://schemas.microsoft.com/WebPart/v2">' +
    '<Assembly>Microsoft.SharePoint, Version=16.0.0.0, Culture=neutral, PublicKeyToken=71e9bce111e9429c</Assembly>' + 
    '<TypeName>Microsoft.SharePoint.WebPartPages.ContentEditorWebPart</TypeName>' + 
    '<Title>$Resources:core,ContentEditorWebPartTitle;</Title>' +
    '<Description>$Resources:core,ContentEditorWebPartDescription;</Description>' +
    '<PartImageLarge>/_layouts/15/images/mscontl.gif</PartImageLarge>' +
'</WebPart>';
    var zoneId = "Main";
    var zoneIndex = 10;
    var pageUrl = "/sites/senate/subsite/Lists/custom/NewForm.aspx"; 

    importWebPart("https://jolera365.sharepoint.com/sites/senate/subsite", pageUrl , webPartXml, zoneId, zoneIndex);

    function importWebPart(webUrl, pageUrl, webPartXml, zoneId,zoneIndex) {
        var url = webUrl + "/_api/web/getfilebyserverrelativeurl('" + pageUrl + "')/getlimitedwebpartmanager(1)/ImportWebPart";
       
        spr.requestDigest('https://jolera365.sharepoint.com/sites/senate/subsite/')
        .then(function (digest) {
            return spr.post(url, {
                body: {"webPartXml": webPartXml},
                headers: {
                    'X-RequestDigest': digest,
                    "Accept": "application/json;odata=verbose",
                }
            });
        })
        .then(function (response) {
            if (response.statusCode === 204) {
                console.log('Web part has been imported successfully');
            }
            else{
                console.log("status code: " +response.statusCode);
                console.log("Message: " + JSON.stringify(response.body.d));
            }
          
        }, function (err) {
            if (err.statusCode === 404) {
                console.log('Page not found!');
            } else {
               console.log(err);
            }
        });
    }


    
//---------- CEWP END


/// LIST TEST
return;
spr.requestDigest('https://jolera365.sharepoint.com/sites/senate/subsite')
  .then(function (digest) {
    return spr.post('https://jolera365.sharepoint.com/sites/senate/subsite/_api/web/lists/GetByTitle(\'custom\')', {
      body: {
        '__metadata': { 'type': 'SP.List' },
        'Title': 'TestList'
      },
      headers: {
        'X-RequestDigest': digest,
        'X-HTTP-Method': 'MERGE',
        'IF-MATCH': '*'
      }
    });
  })
  .then(function (response) {
    if (response.statusCode === 204) {
      console.log('List title updated!');
    }
  }, function (err) {
    if (err.statusCode === 404) {
      console.log('List not found!');
    } else {
      console.log(err);
    }
  });

});


//Get new secure string pass:
//Example of Use:
//gulp createPass --pass MySecretPass
gulp.task('createPass', function(){
    var Cpass = require("cpass");
    var cpass = new Cpass();
    var password = process.argv[4];
    var secured = cpass.encode(password);
    console.log(secured);
} );

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
        return spr.post(config.getFields.siteUrl + "/_api/site/UserCustomActions('1ce30295-be9f-4019-9c6d-bdc81e0a5b25')", {
            body: {
               '__metadata': { 'type': 'SP.UserCustomAction' }, 'Location':'ScriptLink',
                    'Sequence':'101', 'Title':'CustomForms', 'ScriptSrc':'~siteCollection/_catalogs/masterpage/src/form_templates.js' 
            },
            headers: {
                'X-RequestDigest': digest,
                "X-HTTP-Method": "MERGE"
            }
        })
        .then(function (response) {
            console.log('Custom action updated');
        }, function (err) {
            console.log(err);
        });
    });
});