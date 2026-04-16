// Redireciona mobile para /mobile e desktop para /desktop
(function() {
  var isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  var path = window.location.pathname;
  if (isMobile && !path.startsWith('/mobile')) {
    window.location.replace('/mobile' + path);
  } else if (!isMobile && !path.startsWith('/desktop')) {
    window.location.replace('/desktop' + path);
  }
})();
