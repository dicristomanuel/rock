'use strict';

var fs = require('fs-extra');
var path = require('path');
var Targz = require('tar.gz');
var _ = require('underscore');

var getComponentsByDir = require('./get-components-by-dir');
var getLocalNpmModules = require('./get-local-npm-modules');
var packageComponents = require('./package-components');
var mock = require('./mock');
var validator = require('../../registry/domain/validators');

module.exports = function(dependencies){
  var logger = dependencies.logger;
  var targz = new Targz();

  return _.extend(this, {
    cleanup: function(compressedPackagePath, callback){
      return fs.unlink(compressedPackagePath, callback);
    },
    compress: function(input, output, callback){
      return targz.compress(input, output, callback);
    },
    getComponentsByDir: getComponentsByDir(dependencies),
    getLocalNpmModules: getLocalNpmModules(),
    init: function(componentName, templateType, callback){

      if(!validator.validateComponentName(componentName)){
        return callback('name not valid');
      }

      if(!validator.validateTemplateType(templateType)){
        return callback('template type not valid');
      }
      // if template type react
      try {
        var pathDir = '../../components/base-component-' + templateType,
        baseComponentDir = path.resolve(__dirname, pathDir),
        npmIgnorePath = path.resolve(__dirname, pathDir + '/.npmignore');

        fs.ensureDirSync(componentName);
        fs.copySync(baseComponentDir, componentName);
        fs.copySync(npmIgnorePath, componentName + '/.gitignore');
// add .gitignore
// react setup
// index.js with export name
        var componentPath = path.resolve(componentName, 'package.json'),
        component = _.extend(fs.readJsonSync(componentPath), {
          name: componentName,
           dependencies: {
            "babel-core": "^6.17.0",
            "babel-loader": "^6.2.5",
            "babel-preset-es2015": "^6.16.0"
          },
          devDependencies: {
            "css-loader": "^0.9.0",
            "extract-text-webpack-plugin": "^0.3.5",
            "style-loader": "^0.8.2",
            "stylus-loader": "^0.4.0",
            "webpack": "^1.4.13",
            "webpack-dev-server": "^1.6.6"
          }
        })
      fs.outputJsonSync(componentPath, component);

      return callback(null, { ok: true });
    } catch(e){
      return callback(e);
    }
  },
  mock: mock(),
  package: packageComponents()
});
};
