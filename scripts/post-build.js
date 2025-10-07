#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

// Create 404.html for GitHub Pages SPA support with redirect logic
const buildDir = 'build';
const indexPath = join(buildDir, 'index.html');
const notFoundPath = join(buildDir, '404.html');

try {
  const indexContent = readFileSync(indexPath, 'utf8');
  
  // Add SPA redirect script before SvelteKit initialization
  const spaRedirectScript = `
				// Single Page Apps for GitHub Pages
				// MIT License
				// https://github.com/rafgraph/spa-github-pages
				// This script takes the current url and converts the path and query
				// string into just a query string, and then redirects the browser
				// to the new url with only a query string and hash fragment,
				// e.g. https://www.foo.tld/one/two?a=b&c=d#qwe, becomes
				// https://www.foo.tld/?/one/two&a=b~and~c=d#qwe
				// Note: this 404.html file must be at least 512 bytes for it to work
				// with Internet Explorer (it is currently > 512 bytes)

				// If you're creating a Project Pages site and NOT using a custom domain,
				// then set pathSegmentsToKeep to 1 (enterprise users may need to set it to > 1).
				// This way the code will only replace the route part of the path, and not
				// the real directory in which the app resides, for example:
				// https://username.github.io/repo-name/one/two?a=b&c=d#qwe becomes
				// https://username.github.io/repo-name/?/one/two&a=b~and~c=d#qwe
				// Otherwise, leave pathSegmentsToKeep as 0.
				var pathSegmentsToKeep = 1;

				var l = window.location;
				l.replace(
					l.protocol + '//' + l.hostname + (l.port ? ':' + l.port : '') +
					l.pathname.split('/').slice(0, 1 + pathSegmentsToKeep).join('/') + '/?/' +
					l.pathname.slice(1).split('/').slice(pathSegmentsToKeep).join('/').replace(/&/g, '~and~') +
					(l.search ? '&' + l.search.slice(1).replace(/&/g, '~and~') : '') +
					l.hash
				);

				// SvelteKit app initialization`;

  // Replace the SvelteKit initialization script with SPA redirect + SvelteKit
  const updatedContent = indexContent.replace(
    /<script>\s*{[\s\S]*?}<\/script>/,
    `<script>${spaRedirectScript}
				{
					__sveltekit_1bebq6o = {
						base: "/gh-pr-management",
						assets: "/gh-pr-management"
					};

					const element = document.currentScript.parentElement;

					Promise.all([
						import("/gh-pr-management/_app/immutable/entry/start.Di1VdZya.js"),
						import("/gh-pr-management/_app/immutable/entry/app.DTme3Luv.js")
					]).then(([kit, app]) => {
						kit.start(app, element);
					});
				}
			</script>`
  );

  writeFileSync(notFoundPath, updatedContent);
  console.log('✅ Created 404.html for GitHub Pages SPA support with redirect logic');
} catch (error) {
  console.error('❌ Failed to create 404.html:', error.message);
  process.exit(1);
}
