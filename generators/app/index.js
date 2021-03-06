'use strict';
var path = require('path');
var yeoman = require('yeoman-generator');
var chalk = require('chalk');
var yosay = require('yosay');
var changeCase = require('change-case');

var licenses = [
  { name: 'Apache 2.0', value: 'Apache-2.0' },
  { name: 'MIT', value: 'MIT' },
  { name: 'Unlicense', value: 'unlicense' },
  { name: 'FreeBSD', value: 'BSD-2-Clause-FreeBSD' },
  { name: 'NewBSD', value: 'BSD-3-Clause' },
  { name: 'Internet Systems Consortium (ISC)', value: 'ISC' },
  { name: 'No License (Copyrighted)', value: 'nolicense' }
];

module.exports = yeoman.Base.extend({
  prompting: {
    greeting() {
      this.log(yosay(`Welcome to the sensational ${chalk.red('typings')} generator!`));
    },
    sourceUri() {
      var done = this.async();

      const uriExamples = [
        'facebook/react',
        'atom/atom',
        'microsoft/vscode',
        'angular/angular'
      ];

      this.prompt({
        type: 'input',
        name: 'sourceUri',
        message: `What is the ${chalk.green('author/module')} of the ${chalk.red('source')} on github?`,
        default: () => uriExamples[Math.round(Math.random() * 4 - 0.5)],
        validate: (value) => value.length > 0
      }, (props) => {
        this.sourceUri = props.sourceUri;
        this.sourcePackageUrl = `https://github.com/${props.sourceUri}`;
        this.sourcePackageName = props.sourceUri.split('/')[1];
        this.prettyPackageName = changeCase.titleCase(this.sourcePackageName.replace('-', ' '));
        done();
      });
    },
    isNpm() {
      var done = this.async();

      this.prompt({
        type: 'confirm',
        name: 'isNpm',
        message: `Is the source installable through NPM?`,
        default: true
      }, (props) => {
        this.isNpm = props.isNpm;
        done();
      });
    },
    npmName() {
      var done = this.async();

      this.prompt({
        type: 'input',
        name: 'npmName',
        message: `Name of the package on NPM is...`,
        when: () => this.isNpm,
        default: () => this.sourcePackageName
      }, (props) => {
        this.npmName = props.npmName;
        done();
      });
    },
    isAmbient() {
      var done = this.async();

      this.prompt({
        type: 'confirm',
        name: 'isAmbient',
        message: `Is this module ambient? i.e. does it declare itself globally?`,
        default: false
      }, (props) => {
        this.isAmbient = props.isAmbient;
        done();
      });
    },
    username() {
      var done = this.async();

      this.prompt({
        type: 'input',
        name: 'username',
        message: 'And your GitHub username is...',
        validate: (value) => value.length > 0,
        store: true
      }, (props) => {
        this.username = props.username;
        done();
      });
    },
    license() {
      var done = this.async();

      this.prompt({
        type: 'list',
        name: 'license',
        message: 'Which license do you want to use?',
        default: 'MIT',
        choices: licenses
      }, (props) => {
        this.license = props.license;
        done();
      });
    },
    nameOnLicense() {
      var done = this.async();

      this.prompt({
        type: 'input',
        name: 'name',
        message: 'Name to use on the license?',
        default: this.username
      }, (props) => {
        this.nameOnLicense = props.name;
        done();
      });
    }
  },

  writing: {
    copyFiles() {
      this.fs.copy(
        this.templatePath('.vscode/*'),
        this.destinationPath('.vscode')
      );
      this.fs.copy(
        this.templatePath('*'),
        this.destinationPath()
      );
      this.fs.copy(
        this.templatePath('.*'),
        this.destinationPath()
      );
    },
    createTypings() {
      this.fs.copyTpl(
        this.templatePath('template/typings.json'),
        this.destinationPath('typings.json'),
        {
          name: this.sourcePackageName,
          main: 'index.d.ts',
          homepage: `https://github.com/${this.sourceUri}`
        });
    },
    createREADME() {
      this.fs.copyTpl(
        this.templatePath('template/README.md'),
        this.destinationPath('README.md'),
        {
          prettyPackageName: this.prettyPackageName,
          sourcePackageName: this.sourcePackageName,
          sourcePackageUrl: this.sourcePackageUrl,
          license: this.license
        });
    },
    createTestFile() {
      this.fs.write('test/test.ts',
        [
          'import test = require(\'blue-tape\');',
          'import isCallable = require(\'is-callable\');',
          '',
          this.isAmbient ? '' : `import ${this.sourcePackageName} = require('${this.sourcePackageName}');`,
          ''
        ].join('\n'));
    },
    updatePackageJson() {
      this.fs.copyTpl(
        this.templatePath('template/package.json'),
        this.destinationPath('package.json'),
        {
          ambient: this.isAmbient ? ' --ambient' : ''
        });
    },
    createLICENSE() {
      var filename = `template/${this.license}.txt`;
      var author = this.nameOnLicense.trim();

      this.fs.copyTpl(
        this.templatePath(filename),
        this.destinationPath('LICENSE'),
        {
          year: (new Date()).getFullYear(),
          author: author
        }
      );
    }
  },
  install: {
    npm() {
      this.log(`Running ${chalk.green('npm install')}...`);
      this.spawnCommandSync('npm', ['install']);
    },
    npmInstallSource() {
      if (this.npmName) {
        this.log(`Installing ${chalk.green(this.sourcePackageName)}...`);
        this.spawnCommandSync('npm', ['install', '-D', '--save-exact', this.sourcePackageName]);
      }
    },
    typingsInstall() {
      this.log(`Running ${chalk.green('typings install')}...`);
      this.spawnCommandSync('typings', ['install']);
    },
    runBuild() {
      this.log(`Running ${chalk.green('npm run build')}...`);
      this.spawnCommandSync('npm', ['run', 'build']);
    },
    submodule() {
      this.log(`Downloading ${chalk.green(this.sourceUri)}...`);
      // Currently this step is needed to pass test. Will use nodegit for this.
      this.spawnCommandSync('git', ['init']);
      this.spawnCommandSync('git', ['submodule', 'add', `${this.sourcePackageUrl}`, 'source']);
    }
  },
  end: {
    isReady() {
      this.log('');
      this.log('I am done! Now it is your turn!');
    },
    installSource() {
      if (!this.isNpm) {
        // this.log('');
        // this.log('To run the test, you need to get the source package and reference it in test');
        // this.log('');
      }
    },
    tsdHint() {
      this.log('');
      this.log('If there are DefinitelyType support for the source,');
      this.log(` you can run ${chalk.green('tsd install <source>')} to download the file`);
      this.log(' so you can easily access those code.');
    },
    readyToTest() {
      this.log('');
      this.log(`Run ${chalk.green('npm run watch')} to update the definition automatically, or`);
      this.log(`Run ${chalk.green('npm run build')} to update the definition manually, and`);
      this.log(`Run ${chalk.green('npm test')} to test your definition!`);
    }
  }
});
