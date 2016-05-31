//---------------------------------------------------------------------------------------------
// Set the production Paths
//---------------------------------------------------------------------------------------------

var src_path = 'src/';
var styles_src	= src_path + 'sass/*.scss'; // Location to source your scss files from. Usually a specific file, but you can use **/*.scss wildcard

var theme_path = 'web/assets/'
var styles_dest	= theme_path + 'css/'; // Destination to send your compiled CSS. Will also send a production ready minified css file to this directory

// Array of Javascript files to concatenate and minify
var js_concat = [
	src_path + 'js/scripts.js'
];

var js_dest		= theme_path + 'js'; // Destination to send your compiled JS scripts to. Will also send a production ready minified css file to this directory

var js_filename	= 'scripts.js';

// Array of Javascript files to move as-is. Will not concatenate or minify
var js_src = [
	src_path + 'vendor/jquery/dist/jquery.min.js',
];

// Array of directories (and those to skip) to validate HTML
var validate_src = 'htdocs/templates/**/*.html';

var img_src		= src_path + 'media/images/**/*'; // Directory to copy all images from. This will grab all file extensions.
var img_dest	= theme_path + 'media/images'; // Destination to send all images to.

// Directories to wipe out. Be careful. Everything in these directories will be deleted.
var clean_dir = [
	theme_path + 'css',
	theme_path + 'js',
	theme_path + 'media/images',
];


//---------------------------------------------------------------------------------------------
// Load the dependencies
//---------------------------------------------------------------------------------------------

var gulp			= require('gulp'),
    sass			= require('gulp-sass'),
    autoprefixer	= require('gulp-autoprefixer'),
    csscomb			= require('gulp-csscomb'),
    cssnano			= require('gulp-cssnano'),
    htmlhint		= require("gulp-htmlhint"),
    uglify 			= require('gulp-uglify'),
    imagemin 		= require('gulp-imagemin'),
    rename 			= require('gulp-rename'),
    rimraf			= require('gulp-rimraf'),
    concat 			= require('gulp-concat'),
    notify 			= require('gulp-notify'),
    plumber 		= require('gulp-plumber'),
    gutil			= require('gulp-util'),
    runSequence		= require('run-sequence'),
    pngquant        = require('imagemin-pngquant'),
    gulpif          = require('gulp-if'),
    filesize		= require('gulp-filesize'),
    modernizr		= require('gulp-modernizr');

var onError = function (err) {
  gutil.beep();
  console.log(err);
};


//---------------------------------------------------------------------------------------------
// TASK: Modernizr
//---------------------------------------------------------------------------------------------

gulp.task('modernizr', function() {
  gulp.src(src_path + 'js/scripts.js')
    .pipe(modernizr({
    // Based on default settings on http://modernizr.com/download/
    "options" : [
        "setClasses",
        "addTest",
        "html5printshiv",
        "testProp",
        "fnBind"
    ],
    // Define any tests you want to explicitly include
    "tests" : [
		"hiddenscroll",
		"ie8compat",
		"ligatures",
		"svg",
		"backgroundblendmode",
		"backgroundcliptext",
		"backgroundsizecover",
		"flexbox",
		"flexboxlegacy",
		"flexboxtweener",
		"lastchild",
		"objectfit",
		"vhunit",
		"vwunit"
    ],

}))
    .pipe(uglify())
    .pipe(gulp.dest(js_dest))

});

//---------------------------------------------------------------------------------------------
// TASK: Styles
//---------------------------------------------------------------------------------------------

 gulp.task('styles', function () {
	return gulp.src(styles_src)
		.pipe(plumber())
    	.pipe(sass({ style: 'expanded', require: 'susy',}).on('error', sass.logError).on('error', onError))
    	.pipe(autoprefixer('last 2 version'))
		.pipe(csscomb())
		.pipe(gulp.dest(styles_dest))
		.pipe(filesize())
		.pipe(rename({ suffix: '.min' }))
        .pipe(cssnano())
        .pipe(gulp.dest(styles_dest))
        .pipe(filesize())
		.pipe(notify({ message: 'Styles task complete' }));
});

//---------------------------------------------------------------------------------------------
// TASK: scripts
//---------------------------------------------------------------------------------------------

gulp.task('scripts', function() {

	gulp.src(js_src)
		.pipe(plumber())
		.pipe(gulp.dest(js_dest))
		.pipe(filesize())
		.pipe(notify({ message: 'Scripts copy task complete.' }));


	return gulp.src(js_concat)
		.pipe(plumber())
		.pipe(concat(js_filename))
		.pipe(gulp.dest(js_dest))
		.pipe(filesize())
		.pipe(rename({ suffix: '.min' }))
		.pipe(uglify())
		.pipe(gulp.dest(js_dest))
		.pipe(filesize())
		.pipe(notify({ message: 'Scripts concat task complete.' }));
});

//---------------------------------------------------------------------------------------------
// TASK: Images
//---------------------------------------------------------------------------------------------

gulp.task('images', function () {
    return gulp.src(img_src)
        .pipe(imagemin({
            progressive: true,
            svgoPlugins: [{removeViewBox: false}],
            use: [pngquant()]
        }))
        .pipe(gulp.dest(img_dest))
        .pipe(filesize());
});

//---------------------------------------------------------------------------------------------
// TASK: Validate
//---------------------------------------------------------------------------------------------

gulp.task('validate', function() {

  return gulp.src(validate_src)
    .pipe(htmlhint())
    .pipe(htmlhint.reporter())
});


//---------------------------------------------------------------------------------------------
// TASK: Clean
//---------------------------------------------------------------------------------------------

gulp.task('clean', function() {
  return gulp.src(clean_dir, { read: false }) // much faster
    .pipe(rimraf({ force: true }))
    .pipe(notify({ message: 'Clean task complete.' }));
});


//---------------------------------------------------------------------------------------------
// PRODUCTION TASK: Run `gulp prod`
// This is the production task, It will clean out all of the specified directories,
// compile and minify your sass, concatencate and minify your scripts, and compress and move images to the assets directory.
//---------------------------------------------------------------------------------------------

gulp.task('build', function() {
	runSequence('clean',
    ['styles', 'modernizr', 'scripts', 'images', 'validate']);
});

//---------------------------------------------------------------------------------------------
// DEVELOPMENT/WATCH TASK: Run `gulp`
// This is the development task. It is the task you will primarily use. It will watch
// for changes in your sass files, and recompile new CSS when it sees changes. It
// will do the same for javascript files as well.
//---------------------------------------------------------------------------------------------

gulp.task('default', function() {
	// Watch .scss files
	gulp.watch(src_path + '**/*.scss', function(event) {
	    console.log('File ' + event.path + ' was ' + event.type + ', running tasks...')
	    gulp.start('styles');
	});
	// Watch .js files
	gulp.watch(src_path + 'js/**/*.js', function(event) {
	    console.log('File ' + event.path + ' was ' + event.type + ', running tasks...')
	    gulp.start('scripts');
	});

	// Watch .html files
	gulp.watch('templates/**/*.html', function(event) {
	    console.log('File ' + event.path + ' was ' + event.type + ', running tasks...')
	    gulp.start('validate');
	});

});
