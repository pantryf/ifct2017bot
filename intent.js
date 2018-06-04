const abbreviations = require('@ifct2017/abbreviations');
const about = require('@ifct2017/about');
const methods = require('@ifct2017/methods');
const nutrients = require('@ifct2017/nutrients');
const request = require('request');
const message = require('./message');
const nlp = require('./nlp');

const SERVICE_NLP = 'https://ifct2017.herokuapp.com/nlp/';
const HELP_REGEX = {
  abbreviation: /abbreviat|short|acronym|full|expan/i,
  columns: /columns|nutrients|components|fields|list/i,
  column: /column|nutrient|component|field/i,
  method: /method|analy|experiment|measure|determin/i,
  description: /descripti|detail|food|composition/i,
  about: /about|describe|explain|narrate|discuss|i[\.\-\s]*f[\.\-\s]*c[\.\-\s]*t[\.\-\s]*/i,
  select: /select|query|hunt|look|scout|probe|detect|locate|discover|explore|find|search/i,
};

function fixText(txt) {
  if(txt==null) return txt;
  return txt.replace(/\s*%/g, ' percent').replace(/\s*\&\s*/g, ' and ');
};

function help(txt) {
  for(var k in HELP_REGEX)
    if(HELP_REGEX[k].test(txt)) return message('help_'+k);
  return null;
};

function ask_abbreviation(txt) {
  var ans = abbreviations(txt);
  if(ans==null) return null;
  var {abbr, full} = ans;
  abbr = abbr.includes('.')? abbr:abbr.replace(/(.)/g, '$1.');
  return `${abbr} stands for ${full}.`;
};

function ask_column(txt) {
  return fixText(nutrients(txt));
};

function ask_method(txt) {
  var ans = methods(txt);
  if(ans==null) return null;
  var {analyte, method, reference} = ans;
  return `${analyte} was measured using ${method}; ${reference}.`;
};

function ask_description(txt) {
  return null;
};

function ask_any(txt) {
  return ask_abbreviation(txt)||ask_column(txt)||ask_description(txt);
};

function query(txt) {
  return new Promise((fres, frej) => {
    var req = request(SERVICE_NLP+encodeURIComponent(txt), (err, res, body) => {
      if(err) return frej(err);
      console.log(body);
      var z = '', dat = JSON.parse(body);
      if(!dat.value.name) return fres(`This is a secret, i can't tell it to you`);
      for(var nam of dat.value.name.text)
        z += nam+'. ';
      return fres(z);
    });
  });
};

function intent(int, par) {
  if(int==='help') return help(par.text);
  if(int==='ask_abbreviation') return ask_abbreviation(par.text);
  if(int==='ask_column') return ask_column(par.text);
  if(int==='ask_method') return ask_method(par.text);
  if(int==='ask_description') return ask_description(par.text);
  if(int==='ask_any') return ask_any(par.text);
  if(int==='about') return fixText(about(par.text));
  if(int==='select') return query(par.text);
  return null;
};
module.exports = intent;
