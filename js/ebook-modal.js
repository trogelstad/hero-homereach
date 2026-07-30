(function(){
  var ML_GROUP_ID='184754345036744568';
  // ML_API_KEY removed — submissions now proxied through guide.herohomereach.com/api/ebook-lead
  var LOGO_URL='https://www.herohomereach.com/logo-mark_transparent.png';
  var ENDPOINT='https://guide.herohomereach.com/api/ebook-lead';

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
      <div class="hhm-eyebrow">Free Colorado Homebuyer Guide</div>
      <h2 class="hhm-title" id="hhm-modal-title">Most Colorado heroes leave thousands on the table. This guide shows you what to ask instead.</h2>
      <p class="hhm-subtitle">Plain-English breakdowns of CHFA, metroDPA, VA stacking strategies, seller credits, and the watch-outs most lenders never mention, written for Colorado educators, first responders, healthcare workers, and military buyers.</p>
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
      <div class="hhm-success-title">Your Guide Is Ready</div>
      <p class="hhm-success-body">We also sent a copy to your email. You can download the guide now and start exploring your Colorado homebuyer assistance options. Keep an eye on your inbox for additional Colorado homebuyer tips and resources from Hero HomeReach.</p>
      <a class="hhm-success-cta" href="https://guide.herohomereach.com/api/pdf-guide" target="_blank" rel="noopener">Download Your Guide &rarr;</a>
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
      // Skip any link inside the success screen — those must keep their real hrefs
      if(a.closest('#hhm-success-wrap')) return;
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

    fetch(ENDPOINT,{
      method:'POST',
      headers:{
        'Content-Type':'application/json',
        'Accept':'application/json'
      },
      body:JSON.stringify({
        first_name: first,
        last_name: last || undefined,
        email: email,
        hero_type: hero || undefined
      })
    })
    .then(function(res){
      return res.json().then(function(data){ return {ok: res.ok, data: data}; });
    })
    .then(function(result){
      if(result.ok && result.data && result.data.success){
        // Fire GTM event only on confirmed success
        window.dataLayer=window.dataLayer||[];
        window.dataLayer.push({event:'ebook_lead', hero_type: hero});
        document.getElementById('hhm-form-wrap').style.display='none';
        document.getElementById('hhm-success-wrap').style.display='block';
      } else {
        hhmResetBtn();
        var msg=(result.data && result.data.error) || 'Something went wrong. Please try again.';
        alert(msg);
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
