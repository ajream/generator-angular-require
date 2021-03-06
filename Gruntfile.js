'use strict';
var semver = require('semver');

module.exports = function (grunt) {
  require('load-grunt-tasks')(grunt);

  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    changelog: {
      options: {
        dest: 'CHANGELOG.md',
        versionFile: 'package.json'
      }
    },
    release: {
      options: {
        bump: false, // we have our own bump
        commitMessage: 'chore(release): Release version <%= version %>',
        file: 'package.json',
        github: {
          repo: 'aaronallport/generator-angular-require',
          usernameVar: 'GITHUB_USERNAME',
          passwordVar: 'GITHUB_AUTHTOKEN'
        },
        tagName: 'v<%= version %>',
      }
    },
    stage: {
      options: {
        files: ['CHANGELOG.md']
      }
    }
  });

  grunt.registerTask('default', ['jshint']);

  grunt.registerTask('bump', 'Bump manifest version', function (type) {
    var options = this.options({
      file: grunt.config('pkgFile') || 'package.json'
    });

    function setup(file, type) {
      var pkg = grunt.file.readJSON(file);
      var newVersion = pkg.version = semver.inc(pkg.version, type || 'patch');
      return {
        file: file,
        pkg: pkg,
        newVersion: newVersion
      };
    }

    var config = setup(options.file, type);
    grunt.file.write(config.file, JSON.stringify(config.pkg, null, '  ') + '\n');
    grunt.config('pkg', config.pkg);
    grunt.log.ok('Version bumped to ' + config.newVersion);
  });

  grunt.registerTask('stage', 'Git add files before running the release task', function () {
    var files = this.options().files;
    grunt.util.spawn({
      cmd: process.platform === 'win32' ? 'git.cmd' : 'git',
      args: ['add'].concat(files)
    }, grunt.task.current.async());
  });

  // grunt-release will only commit the package.json file by default. Until
  // https://github.com/geddski/grunt-release/pull/43/files lands, it should
  // be patched to do the same so it commits the changelog as well.
  grunt.registerTask('publish', function (type) {
    grunt.task.run([
      'default',
      'bump' + (type ? ':' + type : ''),
      'changelog',
      'stage',
      'release'
    ]);
  });
};
