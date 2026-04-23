/**
 * Hero HomeReach — Lead Capture Form Handler
 * File: js/form.js
 *
 * Submits leads directly to MailerLite API and redirects to the thank-you page.
 * Works with any number of .hhr-lead-form instances on a page.
 *
 * Dependencies: none (vanilla JS, no libraries required)
 * Browser support: all modern browsers (Chrome, Firefox, Safari, Edge)
 *
 * Usage:
 *   1. Include <link rel="stylesheet" href="css/form.css"> in <head>
 *   2. Include <script src="js/form.js" defer></script> before </body>
 *   3. Paste the HTML snippet from form-snippet.html wherever you want a form
 */

(function () {
  'use strict';

  /* ── Configuration ─────────────────────────────────────────────────── */
  var CONFIG = {
    MAILERLITE_API_TOKEN: 'eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9.eyJhdWQiOiI0IiwianRpIjoiMDJhMDg4ZWMyNDQ5MmNjOGFjODJmZDg4YzNlYTQ2ZDlmNDliYzM0YmU5ZTdhZjI5MmNmNDI1NmNmN2QzMWY5NDNlMzUxOTQ0ZGZhOTk4ZWUiLCJpYXQiOjE3NzY5NTYxMTIuMTMwMzUyLCJuYmYiOjE3NzY5NTYxMTIuMTMwMzU0LCJleHAiOjQ5MzI2Mjk3MTIuMTI1OTE2LCJzdWIiOiIyMjg3NTQyIiwic2NvcGVzIjpbXX0.MB8WJnwZ5lG35JACvXlS_2oXjBPpRODveds6iG7e4lfdSH1TjNKBhkkbs-AZZux35lr9PbDSp7HwxwdpebCMH3zb_m8nQl7MRh4aN2j4ucPbcUFtwWwbnnL59Om_t8mD7IBF8gXcmgDGVNhnCzMRrcJn4_1y6y-9ba6wizpfPDG98YvFVIeSk8Jcl_pXiljER8ZgOUaWEr8AP5AJ9fNo3zUrYK54fc9KOoyQ9s36Mz46FYEpehsaTKoZ3WsR3NA18xWLfzhX2Elt3Bkv8NGaN2zFtnAh6vRntHiBIVyxH2xmGg4mUKQjjXMzKbYK7YjRe03vAveGGrKGNLBPidZgORZX_TyhfqcG1iVl9Yuy7xqsufS2JuXTzCcEkB9VHSFQ6lGsYBU3JJJesVxcFMUcVg8POKlGj-NM7JXR2SFYAxt-ziWVo6p3yNHIdb1tY6mTlvRY-96nPiIfNtrfYabSWhUfHcE8bw75IudWHRswypaapYfGLHxYzLFgQuAoCdNNYkMj_vHouQ7yOguAO5HYjADQqPhbBAq2-2UYZtPiCPNW7i_F8TFbwl1TzxmTRC36b7G7vDfbnavInmIgJj2NVlGS2UFn432xzFG600xVwcFUFQI9LHykOhUYHB0Bsu-6BW_OuY5jpCkYiypRpqbPxaSgUMvAAPv45ydTSi27wCQ',
    MAILERLITE_GROUP_ID: '184754345036744568',
    MAILERLITE_API_URL:  'https://connect.mailerlite.com/api/subscribers',
    THANK_YOU_URL:       'https://guide.herohomereach.com/thank-you'
  };

  /* ── Helpers ────────────────────────────────────────────────────────── */
  function isValidEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function setSubmitting(form, isSubmitting) {
    var btn    = form.querySelector('.hhr-submit-btn');
    var inputs = form.querySelectorAll('input, select');

    btn.disabled = isSubmitting;
    inputs.forEach(function (el) { el.disabled = isSubmitting; });

    if (isSubmitting) {
      btn.innerHTML = '<span class="hhr-spinner"></span><span>Sending…</span>';
    } else {
      btn.innerHTML = '<span>Send Me the Free Action Guide!</span>';
    }
  }

  function showError(wrap, message) {
    var el = wrap.querySelector('.hhr-error-msg');
    if (!el) return;
    el.textContent = message;
    el.classList.add('visible');
  }

  function hideError(wrap) {
    var el = wrap.querySelector('.hhr-error-msg');
    if (el) el.classList.remove('visible');
  }

  function showSuccess(wrap) {
    var formContainer = wrap.querySelector('.hhr-form-container');
    var successEl     = wrap.querySelector('.hhr-success-state');
    if (formContainer) formContainer.style.display = 'none';
    if (successEl)     successEl.classList.add('visible');
  }

  /* ── Submit handler ─────────────────────────────────────────────────── */
  function handleSubmit(e) {
    e.preventDefault();

    var form  = e.target;
    var wrap  = form.closest('.hhr-form-wrap') || form.parentElement;

    var nameEl       = form.querySelector('[name="hhr_name"]');
    var emailEl      = form.querySelector('[name="hhr_email"]');
    var professionEl = form.querySelector('[name="hhr_profession"]');

    var name       = nameEl       ? nameEl.value.trim()       : '';
    var email      = emailEl      ? emailEl.value.trim()      : '';
    var profession = professionEl ? professionEl.value.trim() : '';

    hideError(wrap);

    /* Client-side validation */
    if (!name) {
      showError(wrap, 'Please enter your name.');
      nameEl && nameEl.focus();
      return;
    }
    if (!email || !isValidEmail(email)) {
      showError(wrap, 'Please enter a valid email address.');
      emailEl && emailEl.focus();
      return;
    }
    if (!profession) {
      showError(wrap, 'Please select your profession.');
      professionEl && professionEl.focus();
      return;
    }

    setSubmitting(form, true);

    /* Build MailerLite payload */
    var nameParts = name.split(' ');
    var firstName = nameParts[0] || '';
    var lastName  = nameParts.slice(1).join(' ') || '';

    var payload = {
      email:  email,
      fields: {
        name:       firstName,
        last_name:  lastName,
        profession: profession
      },
      groups: [CONFIG.MAILERLITE_GROUP_ID],
      status: 'active'
    };

    fetch(CONFIG.MAILERLITE_API_URL, {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Accept':        'application/json',
        'Authorization': 'Bearer ' + CONFIG.MAILERLITE_API_TOKEN
      },
      body: JSON.stringify(payload)
    })
    .then(function (res) {
      if (res.status === 200 || res.status === 201) {
        /* Success — redirect to thank-you page */
        window.location.href = CONFIG.THANK_YOU_URL;
        return;
      }
      /* MailerLite returns 422 for duplicate/invalid — still treat as success
         so the user gets the guide even if already subscribed */
      if (res.status === 422) {
        window.location.href = CONFIG.THANK_YOU_URL;
        return;
      }
      return res.json().then(function (err) {
        throw new Error(err.message || 'Submission failed (' + res.status + ')');
      });
    })
    .catch(function (err) {
      console.error('[HHR Form] MailerLite error:', err);
      setSubmitting(form, false);
      showError(wrap, 'Something went wrong. Please try again or email us at hello@herohomereach.com');
    });
  }

  /* ── Init — attach listener to every form on the page ──────────────── */
  function init() {
    var forms = document.querySelectorAll('.hhr-lead-form');
    forms.forEach(function (form) {
      form.addEventListener('submit', handleSubmit);
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
