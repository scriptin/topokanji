'use strict';

var _ = require('lodash');

var argv;

var CMDS = {
  show: 'show',
  suggestAdd: 'suggest-add',
  suggestRemove: 'suggest-remove',
  coverage: 'coverage',
  save: 'save',
};

var ARGS = {
  num: 'num',
  perLine: 'per-line',
  freqTable: 'freq-table',
  meanType: 'mean-type',
};

function validate(argv) {
  if (argv._.length > 1) {
    throw new Error(
      'Only one command can be specified, ' +
        argv._.length +
        ' given: ' +
        argv._.join(', '),
    );
  } else if (argv._.length === 0) {
    throw new Error(
      'No command provided, use one of these: ' + _.values(CMDS).join(', '),
    );
  }

  var unknownCmds = _.difference(argv._, _.values(CMDS));
  if (unknownCmds.length > 0) {
    throw new Error('Unknown command: ' + unknownCmds.join(', '));
  }

  var unknownArgs = _.chain(_.keys(argv))
    .without('_')
    .difference(_.values(ARGS))
    .value();
  if (unknownArgs.length > 0) {
    throw new Error('Unknown argument(s): ' + unknownArgs.join(', '));
  }
}

function init(processArgv) {
  argv = require('minimist')(process.argv.slice(2));
  validate(argv);
}

function is(cmd) {
  return argv._[0] === cmd;
}

function getCharsPerLine() {
  return _.get(argv, ARGS.perLine, 50);
}

function getFreqTable() {
  if (
    !_.isUndefined(argv[ARGS.freqTable]) &&
    !_.isString(argv[ARGS.freqTable])
  ) {
    throw new Error(
      'Invalid value for argument --' +
        ARGS.freqTable +
        ': ' +
        argv[ARGS.freqTable],
    );
  }
  return argv[ARGS.freqTable];
}

function getNum() {
  if (
    _.isUndefined(argv[ARGS.num]) ||
    !_.isNumber(argv[ARGS.num]) ||
    argv[ARGS.num] < 0 ||
    argv[ARGS.num] % 1 !== 0
  ) {
    throw new Error(
      'Value of --' +
        ARGS.num +
        ' must be a positive integer, ' +
        argv[ARGS.num] +
        ' given',
    );
  }
  return argv[ARGS.num];
}

function getMeanType() {
  return _.get(argv, ARGS.meanType, 'harmonic');
}

exports.init = init;
exports.is = is;

exports.getCharsPerLine = getCharsPerLine;
exports.getFreqTable = getFreqTable;
exports.getNum = getNum;
exports.getMeanType = getMeanType;

exports.CMDS = CMDS;
exports.ARGS = ARGS;
