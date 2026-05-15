// Redireciona mobile para /mobile/ e desktop para /desktop/.
(function() {
  var path = window.location.pathname;
  if (path.indexOf('/mobile') === 0 || path.indexOf('/desktop') === 0 || path.indexOf('/api') === 0) {
    return;
  }

  var hasCoarsePointer = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  var hasTouch = navigator.maxTouchPoints && navigator.maxTouchPoints > 0;
  var mobileUA = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  var targetRoot = (mobileUA || hasCoarsePointer || hasTouch) ? '/mobile/' : '/desktop/';
  var rest = path === '/' ? '' : path.replace(/^\/+/, '');

  window.location.replace(targetRoot + rest + window.location.search + window.location.hash);
})();
