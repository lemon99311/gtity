

(function(){
  var c = window.__TPL_CONFIG__ || {};
  var a = document.getElementById('tplSchema');
  var b = document.getElementById('tplExamples');
  if (a) a.textContent = JSON.stringify(c.tplSchema   || {});
  if (b) b.textContent = JSON.stringify(c.tplExamples || {});
})();
