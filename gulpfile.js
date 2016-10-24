var gulp = require('gulp');
var sppull = require('sppull').sppull;
var spsave = require("gulp-spsave");
var watch = require("gulp-watch");
var config = require('./gulp.config');
var Cpass = require("cpass");

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


gulp.task('getFields',function(){
    //read more here: https://github.com/s-KaiNet/sp-request
   
    var cpass = new Cpass();
    var credentialOptions = {
        'username':"dmolodtsov@jolera.com",
        'password': cpass.decode("14f3414621f03df837338e685c231b720243c83d242829f29bb594d7d4b7b13aca4a5aa5d23b4cc21f9d7b48dd69d8acU+mmWaDFhSdyAtRrYGSCvQ=="), //TODO: you can encript your credentials with CPASS module
        //'relyingParty':"",
        //'adfsUrl':"",
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

spr.get("https://jolera365.sharepoint.com/sites/senate/subsite/_api/web/lists/GetByTitle('SampleList')/fields?$filter=Hidden eq false")
  .then(function (response) {
    
    var results = response.body.d.results;
    var f = {};
    for (var x = 0; x < results.length; x++) {
        //  if (!results[x].ReadOnlyField) {
            if (!results[x].Hidden) {
                if (results[x].InternalName != 'ContentType') {
                    if (results[x].InternalName != 'Attachments') {
                        var field = initializeField(results[x]);
                        f[results[x].InternalName] = field;                
                    }
                }
            }
        // }
    }

    //console.log('result: ' + JSON.stringify(response.body.d.results, null, 4) );
    console.log('Title: ' + JSON.stringify(f.Title, null, 4));


  })
  .catch(function(err){
    console.log(err);
  });

});
