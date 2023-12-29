/* eslint-disable @typescript-eslint/no-var-requires */
/* eslint-env node */
const { src, dest, series, parallel, watch } = require("gulp");
const browserSync = require("browser-sync").create();
const del = require("del");
const htmlMinify = require("gulp-htmlmin");
const sourcemaps = require("gulp-sourcemaps");
const sass = require("gulp-sass")(require("sass"));
const gulpEsbuild = require("gulp-esbuild").createGulpEsbuild({ incremental: false, piping: true });
const cssAutoPrefixer = require("gulp-autoprefixer");
const concat = require("gulp-concat");
const rename = require("gulp-rename");
const ejs = require("gulp-ejs");
const path = require("path");
const fs = require("fs");

// Utilities
function isArgumentPassed(...args) {
	for (let i = 0; i < args.length; i++) {
		if (!args[i].startsWith("--")) {
			if (args[i].length > 1) {
				args.unshift(`--${args[i]}`);
			} else {
				args.unshift(`-${args[i]}`);
			}

			i++;
		}
	}

	for (const key of args) {
		if (process.argv.includes(key)) return true;
		if (!key.startsWith("-") && key.toUpperCase() in process.env) return true;
	}

	return false;
}

// Env
const isProduction = isArgumentPassed("production", "prod");
console.log(isProduction ? "PRODUCTION" : "DEVELOPMENT");

// Options
const browserSyncOptions = {
	open: false,
	browser: false,
	ui: false,
	host: "0.0.0.0",
	server: {
		baseDir: "./dist",
		port: 3000,
	},
};

const esbuildOptions = {
	outfile: "bundle.js",
	bundle: true,
	sourcemap: isProduction ? undefined : "both",
	target: [
		"es2015",
		"chrome58",
		"edge16",
		"firefox57",
		"node12",
		"safari11"
	],
	platform: "browser",
	minify: isProduction,
	minifyWhitespace: isProduction,
	minifyIdentifiers: isProduction,
	minifySyntax: isProduction,
	treeShaking: true,
	define: {
		DEBUG: !isProduction,
	}
};

const htmlOptions = {
	collapseWhitespace: true,
	removeComments: true,
	removeRedundantAttributes: true,
};

const cssOptions = {
	outputStyle: "compressed",
	sourceComments: false,
	sourceMap: false,
};

// Tasks
function reloadBrowsers() {
	return browserSync.reload({ stream: true });
}

function clean() {
	return del("dist");
}

function initializeBrowserSync() {
	return browserSync.init(browserSyncOptions);
}

function handleHtml() {
	return src("src/views/index.ejs")
		.pipe(ejs({}))
		.pipe(htmlMinify(htmlOptions))
		.pipe(rename("index.html"))
		.pipe(dest("./dist"))
		.pipe(reloadBrowsers());
}

function watchHtml() {
	return watch(["src/**/*.html", "src/**/*.ejs"], handleHtml);
}

function handleTs() {
	return src("./src/scripts/main.ts")
		.pipe(gulpEsbuild(esbuildOptions))
		.pipe(dest("./dist/scripts"))
		.pipe(reloadBrowsers());
}

function watchTs() {
	return watch("src/scripts/**/*.ts", handleTs);
}

async function handleAssemblyScript(cb) {
	const asc = await import("assemblyscript/asc");

	const { error, stdout, stderr } = await asc.main([
		path.join(__dirname, "src", "assembly", "mandelbrot.ts"),
		"--config", "asconfig.json",
		"--target", "release"
		// "--target", isProduction ? "release" : "debug",
	]);

	if (error) {
		console.log(`Compilation failed: ${error.message}`);
		console.log(stderr.toString());
	} else {
		console.log(stdout.toString());

		fs.copyFileSync(
			path.join(__dirname, "dist", "assembly", "module.d.ts"),
			path.join(__dirname, "src", "assembly", "module.d.ts")
		);

		fs.copyFileSync(
			path.join(__dirname, "dist", "assembly", "module.js"),
			path.join(__dirname, "src", "assembly", "module.js")
		);

		browserSync.reload();
	}

	cb();
}

function watchAssemblyScript() {
	return watch(["src/assembly/mandelbrot.ts", "./asconfig.json", "src/assembly/tsconfig.json"], handleAssemblyScript);
}

function handleAssets() {
	return src("./src/assets/**/**.*").pipe(dest("./dist/assets")).pipe(reloadBrowsers());
}

function handleFavicon() {
	return src([
		"./src/assets/favicon/favicon.ico",
		"./src/assets/site.webmanifest"
	]).pipe(dest("./dist"));
}

function watchAssets() {
	return watch("./src/assets/**/**.*", series(handleAssets, handleFavicon));
}

function handleShaders() {
	return src("./src/shaders/**/**.*").pipe(dest("./dist/shaders")).pipe(reloadBrowsers());
}

function watchShaders() {
	return watch("./src/shaders/**/**.*", handleShaders);
}

function handleSCSS() {
	return src("./src/styles/**.scss")
		.pipe(sourcemaps.init())
		.pipe(sass(cssOptions).on("error", sass.logError))
		.pipe(cssAutoPrefixer())
		.pipe(concat("style.min.css"))
		.pipe(sourcemaps.write("./"))
		.pipe(dest("./dist/styles"))
		.pipe(reloadBrowsers());
}

function watchSCSS() {
	return watch("./src/styles/**.scss", handleSCSS);
}

// Export tasks
module.exports.shaders = handleShaders;
module.exports.assets = handleAssets;
module.exports.html = handleHtml;
module.exports.js = handleTs;
module.exports.scss = handleSCSS;
module.exports.clean = clean;
module.exports.build = series(clean, parallel(handleAssets, handleShaders, handleSCSS, handleHtml, handleTs, handleAssemblyScript, handleFavicon));
module.exports.dev = series(module.exports.build, parallel(watchAssets, watchShaders, watchSCSS, watchHtml, watchTs, watchAssemblyScript, initializeBrowserSync));
module.exports.default = module.exports.build;