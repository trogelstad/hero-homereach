(function(){
  var ML_GROUP_ID='184754345036744568';
  var ML_API_KEY="eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI0IiwianRpIjoiMDM2ODI2OTg4YTQ1M2ZkODE5ZjBkNTQ2NTZjNTA1ZGNkOWZlZDAxOThiOGRmOWI0MWFjMjQ1ZGM5MzU3NmY5NGMyMzY2MjFhZWQzZWNiYWUiLCJpYXQiOjE3ODAzMjU5MDYuMTMwMjA0LCJuYmYiOjE3ODAzMjU5MDYuMTMwMjA3LCJleHAiOjQ5MzU5OTk1MDYuMTI1MTcxLCJzdWIiOiIyMjg3NTQyIiwic2NvcGVzIjpbXX0.dEkrujT95mQqU6G1ROcm2Kg9mAwtcxHx6qO7mzSf9AMJkJ4rmN9OExjQaew1VUnE_NYHpY7ddKpfpvCKtci0Xf3s6cATnlx1JLP6U6NY9b_LBVuK01UFlWzRGnbJbra4sOoZmwwqG-zaZjoOVkqnEIeg8vUbcEAzWWOE6NxCnhaWlGMBFuIRdmXIMFeF1RuNNN2m84dC9h3mt-QPBV4eMiLCFbiAq7BmLYjLDPeN7zeaqHX_rwdjXppeG98uD_vMhpshD6aYfLRUOnBmMIum8GeKybBsonoI8bgNyGLoGwMy29CkfaHVLRz7P3ZUdC-4UzjRkikT24BKS2zN9vN9O-tD76eLNLNhPs2Vt8N-Hy5ekv1xRLLnGXyojxrRmduK0IGmdkPcOGUUnb4yBpRgHC57Z20HSc_rqCKhHWxHbhGJlvc8izdg4Dq-V30oJqo2PiZnD8vQs5lvL2mQnAISMoo0k4caQpBuTAuKvc58PC_GWPr7DEFCqreiUszwQzML9MnxCEXrHgJTDEecdDiYqAdaRavNScypYwsMB7CcwTTNG_8SwXA9BzMnPsiKRQVMt5qQqpCb71j_9x14bypcW6SNDxDzlwllTbtDDFvWYpTr4ZBkxsE-78a1xB5m8JrNhAj8Y3BVkUgKrHtGfH4sJ_n2RBCQyYUW8tczhOe90_k";
  var LOGO_URL='https://www.herohomereach.com/logo-mark_transparent.png';

  function inject(){
    if(document.getElementById('hhm-backdrop')) return;

    var css=document.createElement('link');
    css.rel='stylesheet';
    css.href='/css/ebook-modal.css';
    document.head.appendChild(css);

    var html=`
<div id="hhm-backdrop" role="dialog" aria-modal="true" aria-labelledby="hhm-modal-title">
  <div id="hhm-modal">
    <div class="hhm-header">
      <button class="hhm-close" onclick="hhmClose()" aria-label="Close">&times;</button>
      <div class="hhm-logo-row">
        <img src="${LOGO_URL}" alt="Hero HomeReach shield logo">
        <div class="hhm-wordmark">Hero <span>HomeReach</span>™</div>
      </div>
      <div class="hhm-eyebrow">Free Colorado Guide</div>
      <h2 class="hhm-title" id="hhm-modal-title">Your Hero Homebuyer Guide Is Ready</h2>
      <p class="hhm-subtitle">Real Colorado assistance paths, grants, and strategies built for educators, first responders, healthcare workers, and veterans.</p>
    </div>
    <div class="hhm-body" id="hhm-form-wrap">
      <div class="hhm-guide-strip">
        <div class="hhm-guide-icon">
          <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm4 18H6V4h7v5h5v11z"/></svg>
        </div>
        <div>
          <div class="hhm-guide-label">Free eBook</div>
          <div class="hhm-guide-name">The Hero HomeReach Advantage</div>
          <div class="hhm-guide-pages">13 pages &middot; CHFA &middot; MetroDPA &middot; Chenoa &middot; VA &middot; Seller Credits</div>
        </div>
      </div>
      <div class="hhm-row-split">
        <div>
          <label class="hhm-label" for="hhm-first">First Name</label>
          <input class="hhm-input" type="text" id="hhm-first" placeholder="Jane" autocomplete="given-name">
        </div>
        <div>
          <label class="hhm-label" for="hhm-last">Last Name</label>
          <input class="hhm-input" type="text" id="hhm-last" placeholder="Smith" autocomplete="family-name">
        </div>
      </div>
      <div class="hhm-row">
        <label class="hhm-label" for="hhm-email">Email Address</label>
        <input class="hhm-input" type="email" id="hhm-email" placeholder="jane@district.org" autocomplete="email">
        <div class="hhm-error" id="hhm-email-err">Please enter a valid email address.</div>
      </div>
      <div class="hhm-row">
        <label class="hhm-label" for="hhm-hero">I Am A&hellip;</label>
        <select class="hhm-select" id="hhm-hero">
          <option value="">Select your profession</option>
          <option value="educator">Educator (Teacher / School Staff / Admin)</option>
          <option value="first_responder">First Responder (Firefighter / EMT / Police)</option>
          <option value="healthcare">Healthcare Worker (Nurse / Paramedic / Medical)</option>
          <option value="military">Military / Veteran / Active Duty</option>
          <option value="public_service">Other Public Service</option>
        </select>
      </div>
      <button class="hhm-btn" id="hhm-submit-btn" onclick="hhmSubmit()">
        <span id="hhm-btn-label">Send Me the Free Guide</span>
        <span id="hhm-btn-arrow">&rarr;</span>
        <span class="hhm-spinner" id="hhm-spinner" style="display:none"></span>
      </button>
      <div class="hhm-trust">
        <svg width="10" height="12" viewBox="0 0 11 13" fill="none"><rect x="1" y="5" width="9" height="7" rx="1.5" stroke="#bbb" stroke-width="1.2"/><path d="M3.5 5V3.5a2 2 0 014 0V5" stroke="#bbb" stroke-width="1.2" stroke-linecap="round"/></svg>
        No spam, ever. Unsubscribe anytime. Your information is safe.
      </div>
    </div>
    <div class="hhm-success" id="hhm-success-wrap">
      <div class="hhm-success-icon">&#10003;</div>
      <div class="hhm-success-title">Check Your Inbox</div>
      <p class="hhm-success-body">Your Hero HomeReach Advantage guide is on its way. Ready to go deeper? Book a free 30-minute strategy session and we will map your personal assistance path together.</p>
      <a class="hhm-success-cta" href="https://calendly.com/trogelstad-herohomereach/30min" target="_blank" rel="noopener">Book My Free Call &rarr;</a>
    </div>
  </div>
</div>`;

    document.body.insertAdjacentHTML('beforeend', html);

    document.getElementById('hhm-backdrop').addEventListener('click', function(e){
      if(e.target===this) hhmClose();
    });

    document.addEventListener('keydown', function(e){
      if(e.key==='Escape') hhmClose();
    });

    document.querySelectorAll('a').forEach(function(a){
      var href=a.getAttribute('href')||'';
      if(href.indexOf('guide.herohomereach.com')!==-1){
        a.setAttribute('href','#');
        a.addEventListener('click',function(e){e.preventDefault();hhmOpen();});
      }
    });
  }

  window.hhmOpen=function(){
    var bd=document.getElementById('hhm-backdrop');
    if(!bd) return;
    bd.classList.add('hhm-open');
    document.body.style.overflow='hidden';
    setTimeout(function(){
      var f=document.getElementById('hhm-first');
      if(f) f.focus();
    },120);
  };

  window.hhmClose=function(){
    var bd=document.getElementById('hhm-backdrop');
    if(!bd) return;
    bd.classList.remove('hhm-open');
    document.body.style.overflow='';
  };

  window.hhmSubmit=function(){
    var first=document.getElementById('hhm-first').value.trim();
    var last=document.getElementById('hhm-last').value.trim();
    var email=document.getElementById('hhm-email').value.trim();
    var hero=document.getElementById('hhm-hero').value;
    var errEl=document.getElementById('hhm-email-err');
    errEl.style.display='none';

    if(!first){document.getElementById('hhm-first').focus();return;}
    if(!email||!/\S+@\S+\.\S+/.test(email)){
      errEl.style.display='block';
      document.getElementById('hhm-email').focus();
      return;
    }

    var btn=document.getElementById('hhm-submit-btn');
    var lbl=document.getElementById('hhm-btn-label');
    var arrow=document.getElementById('hhm-btn-arrow');
    var spinner=document.getElementById('hhm-spinner');
    btn.disabled=true;
    lbl.textContent='Sending\u2026';
    arrow.style.display='none';
    spinner.style.display='inline-block';

    var fields={name:first+(last?' '+last:'')};
    if(hero) fields['hero_type']=hero;

    fetch('https://connect.mailerlite.com/api/subscribers',{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'Authorization':'Bearer '+ML_API_KEY,
        'Accept':'application/json'
      },
      body:JSON.stringify({email:email,fields:fields,groups:[ML_GROUP_ID],status:'active'})
    })
    .then(function(res){
      if(res.ok||res.status===200||res.status===201){
        window.dataLayer=window.dataLayer||[];
        window.dataLayer.push({event:'ebook_lead',hero_type:hero});
        document.getElementById('hhm-form-wrap').style.display='none';
        document.getElementById('hhm-success-wrap').style.display='block';
      } else {
        hhmResetBtn();
        alert('Something went wrong. Please try again.');
      }
    })
    .catch(function(){
      hhmResetBtn();
      alert('Network error. Please check your connection and try again.');
    });
  };

  function hhmResetBtn(){
    document.getElementById('hhm-submit-btn').disabled=false;
    document.getElementById('hhm-btn-label').textContent='Send Me the Free Guide';
    document.getElementById('hhm-btn-arrow').style.display='inline';
    document.getElementById('hhm-spinner').style.display='none';
  }

  if(document.readyState==='loading'){
    document.addEventListener('DOMContentLoaded',inject);
  } else {
    inject();
  }
})();
