// WebView HTML for rear (front-facing lens) camera via getUserMedia.
// baseUrl 'http://localhost/' makes Android WebView treat this as a secure
// context so getUserMedia is permitted without HTTPS.
export const REAR_CAMERA_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=1">
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    html,body{width:100%;height:100%;background:#0a0a0a;overflow:hidden}
    video{width:100%;height:100%;object-fit:cover;display:block}
  </style>
</head>
<body>
  <video id="v" autoplay playsinline muted></video>
  <script>
    (function(){
      var v=document.getElementById('v');
      if(!navigator.mediaDevices||!navigator.mediaDevices.getUserMedia){return;}
      var attempts=[
        {video:{facingMode:'user'},audio:false},
        {video:{facingMode:{ideal:'user'}},audio:false},
        {video:{facingMode:'environment'},audio:false},
        {video:true,audio:false}
      ];
      function tryNext(i){
        if(i>=attempts.length)return;
        navigator.mediaDevices.getUserMedia(attempts[i])
          .then(function(s){v.srcObject=s;})
          .catch(function(){tryNext(i+1);});
      }
      tryNext(0);
    })();
  </script>
</body>
</html>`;
