#!/usr/bin/env node
const cheerio = require('cheerio');
const fs = require('fs');
const wrap = require('wordwrap')(2, 80);

const buildOptions = () => {
  const body = fs.readFileSync(
    `${__dirname}/../node_modules/daterangepicker/website/index.html`
  );
  const $ = cheerio.load(body);
  let options = $('h1 #options')
    .parent()
    .next('ul')
    .find('li code')
    .map(function() {
      return $(this)
        .text()
        .trim();
    })
    .get();
  // add options that aren't documented
  options.push('template');
  // de-dupe and sort
  options = options
    .filter(function(item, index) {
      return options.indexOf(item) === index;
    })
    .sort();
  fs.writeFileSync(
    './src/get-options.js',
    [
      '"use strict";',
      '/* generated by gulpfile.js */',
      'export default () => {',
      '\treturn ' + JSON.stringify(options, null, '\t\t') + ';',
      '};'
    ].join('\n'),
    'utf-8'
  );
  // fix options that contain html strings
  const readmeOptions = options.map(function(option) {
    return option.replace(/</gi, '&lt;').replace(/>/gi, '&gt;');
  });
  // update README.md
  const before = 'You can pass all the same props as the original plugin:';
  const after = 'You can listen to the following 7 events:';
  const readme = fs.readFileSync('./README.md').toString();
  const newReadme =
    readme.slice(0, readme.indexOf(before) + before.length) +
    '\n\n- **' +
    wrap(readmeOptions.join(', ')).slice(2) +
    '**\n\n' +
    readme.slice(readme.indexOf(after));
  fs.writeFileSync('./README.md', newReadme, 'utf-8');
  return options;
};

const printMissingOptions = includedOptions => {
  const dateRangeOptions = fs
    .readFileSync(
      `${__dirname}/../node_modules/daterangepicker/daterangepicker.js`,
      'utf-8'
    )
    .toString()
    .split(' ')
    .filter(item => {
      return item.indexOf('options.') === 0;
    })
    .map(item => {
      return item
        .split('.')[1]
        .split('[')[0]
        .replace(/[^a-zA-Z0-9<>]/gi, '');
    });
  const missingOptions = dateRangeOptions
    .filter((item, index) => {
      return dateRangeOptions.indexOf(item) === index;
    })
    .sort()
    .filter(item => {
      return includedOptions.indexOf(item) === -1;
    });
  // eslint-disable-next-line
  console.log(missingOptions);
};

const printMissingPropTypes = () => {
  /*
  var DatePicker = require('../dist/bundle');
  var picker = new DatePicker();
  var missing = picker.options.filter(function (o) {
    return !DatePicker.propTypes.hasOwnProperty(o);
  });
  console.log(missing);
  */
};

const options = buildOptions();
printMissingOptions(options);
printMissingPropTypes();
