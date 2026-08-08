const intervalRateMs = 1000;
const maxCountdownStartTimeMs = 35 * 1000;
const minCountdownStartTimeMs = 5 * 1000;

const cssClassName_Wrapper = `meetings-page-auto-closer-for-zoom-wrapper`;
const cssClassName_MainPopOver = `meetings-page-auto-closer-for-zoom-main-pop-over`;
const cssClassName_CountdownText = `meetings-page-auto-closer-for-zoom-countdown-text`;
const cssClassName_CloseNowBtn = `meetings-page-auto-closer-for-zoom-close-now-btn`;
const cssClassName_StopLink = `meetings-page-auto-closer-for-zoom-stop-link`;

const cssClassName_SettingsMenu = `meetings-page-auto-closer-for-zoom-settings-menu`;
const cssClassName_SettingsOption = `meetings-page-auto-closer-for-zoom-settings-option`;

const localStorageKey_CountdownStartTimeMs = `b9d55053-5a15-4b65-98ce-73711e1d83f9`;

function log(text) {
  console.log(`MPACFZ: ${text}`);
}

log('loaded...');

var default_urls = [
  "*://*.zoom.us/a/*",
  "*://*.zoom.us/b/*",
  "*://*.zoom.us/c/*",
  "*://*.zoom.us/d/*",
  "*://*.zoom.us/e/*",
  "*://*.zoom.us/f/*",
  "*://*.zoom.us/g/*",
  "*://*.zoom.us/h/*",
  "*://*.zoom.us/i/*",
  "*://*.zoom.us/j/*",
  "*://*.zoom.us/k/*",
  "*://*.zoom.us/l/*",
  "*://*.zoom.us/m/*",
  "*://*.zoom.us/n/*",
  "*://*.zoom.us/o/*",
  "*://*.zoom.us/p/*",
  "*://*.zoom.us/q/*",
  "*://*.zoom.us/r/*",
  "*://*.zoom.us/s/*",
  "*://*.zoom.us/t/*",
  "*://*.zoom.us/u/*",
  "*://*.zoom.us/v/*",
  "*://*.zoom.us/w/*",
  "*://*.zoom.us/x/*",
  "*://*.zoom.us/y/*",
  "*://*.zoom.us/z/*",
  "*://*.zoom.us/postattendee*",
  "*://*.zoom.us/wc/leave*",
  "*://*.zoomgov.com/a/*",
  "*://*.zoomgov.com/b/*",
  "*://*.zoomgov.com/c/*",
  "*://*.zoomgov.com/d/*",
  "*://*.zoomgov.com/e/*",
  "*://*.zoomgov.com/f/*",
  "*://*.zoomgov.com/g/*",
  "*://*.zoomgov.com/h/*",
  "*://*.zoomgov.com/i/*",
  "*://*.zoomgov.com/j/*",
  "*://*.zoomgov.com/k/*",
  "*://*.zoomgov.com/l/*",
  "*://*.zoomgov.com/m/*",
  "*://*.zoomgov.com/n/*",
  "*://*.zoomgov.com/o/*",
  "*://*.zoomgov.com/p/*",
  "*://*.zoomgov.com/q/*",
  "*://*.zoomgov.com/r/*",
  "*://*.zoomgov.com/s/*",
  "*://*.zoomgov.com/t/*",
  "*://*.zoomgov.com/u/*",
  "*://*.zoomgov.com/v/*",
  "*://*.zoomgov.com/w/*",
  "*://*.zoomgov.com/x/*",
  "*://*.zoomgov.com/y/*",
  "*://*.zoomgov.com/z/*",
  "*://*.zoomgov.com/postattendee*",
  "*://*.zoomgov.com/wc/leave*",
  "*://*.slack.com/archives/*",
  "*://*.webex.com/wbxmjs/*",
  "*://*.webex.com/webappng/*"
]

var default_text_to_look_for = [
  'click open zoom.',
  'click launch meeting below',
  'having issues with zoom',
  'meeting has been launched',
  'having issues with zoom',
  'launching anjuna',
  "Launch meeting",
  "Join Meeting",
  "Chat on WhatsApp with"
]

var matching_urls = []
var text_to_look_for_from_config = []

// Get configuration - async - becuase this is the way to get it
function getConfigurationAsync() {
  return new Promise((resolve, reject) => {
    chrome.storage.sync.get(['urlsToMatch', 'matchingTextForAutoClose'], function(configItems) {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        resolve(configItems || {});
      }
    });
  });
}

// Example usage with async/await
async function getConfigurationSync() {
  // Always start from the built-in defaults, then layer on whatever the
  // user saved on the options page. This way the hardcoded defaults keep
  // working even if the user never opened/saved the options page, and
  // config values are additive rather than replacing the defaults.
  matching_urls = [...default_urls];
  text_to_look_for_from_config = [...default_text_to_look_for];

  try {
    const configItems = await getConfigurationAsync();
    console.log('Configuration loaded');

    if (configItems.urlsToMatch) {
      matching_urls = matching_urls.concat(configItems.urlsToMatch.split('\n').filter(Boolean));
    }
    console.log('urlsToMatch:', matching_urls);

    if (configItems.matchingTextForAutoClose) {
      text_to_look_for_from_config = text_to_look_for_from_config.concat(configItems.matchingTextForAutoClose.split('\n').filter(Boolean));
    }
    console.log('matchingTextForAutoClose:', text_to_look_for_from_config);
  } catch (error) {
    console.error('Error loading configuration:', error);
  }
}

getConfigurationSync();

let timeTillCloseMs = getCountdownStartTimeMs();
var intervalId = 0;

/*
chrome.storage.sync.get(['urlsToMatch'], function(data) {
  if (data) {
    matching_urls = data.urlsToMatch.split('\n');

    currentUrl = window.location.href;
    console.log(currentUrl);
    console.log(matching_urls);
    if (matching_urls.some(pattern => currentUrl.includes(pattern))) {
      console.log("This page is allowed by the config. Running extension logic.");

      intervalId = setInterval(countDownToClose, intervalRateMs);

    } else {
      console.log("This page is not allowed by the config. Skipping script.");
    }
  }
})
*/

function getCountdownStartTimeMs() {
  const defaultStartTimeMs = 21 * 1000;
  let startTimeMs = defaultStartTimeMs;
  try {
    startTimeMs = Number(localStorage.getItem(localStorageKey_CountdownStartTimeMs));
  } catch (e) {
    console.error(e);
  }
  if (!startTimeMs || startTimeMs <= minCountdownStartTimeMs || startTimeMs > maxCountdownStartTimeMs) {
    setCountdownStartTimeMs(defaultStartTimeMs); // Overwrite to self-correct
    startTimeMs = defaultStartTimeMs;
  }
  return startTimeMs;
}

function setCountdownStartTimeMs(startTimeMs) {
  localStorage.setItem(localStorageKey_CountdownStartTimeMs, startTimeMs);
}

function getWrapperEl() {
  return document.documentElement.querySelector(`.${cssClassName_Wrapper}`);
}

function countdownWithText(countdownTimeMs) {
  if (false) {//Used for freezing the countdown to debugging styling
    countdownTimeMs = getCountdownStartTimeMs();
    clearInterval(intervalId);
  }

  let wrapperEl = getWrapperEl();

  if (!wrapperEl) { // Lazy init the element
    wrapperEl = document.createElement('div');
    wrapperEl.classList.add(cssClassName_Wrapper);
    wrapperEl.innerHTML = `
    <div class='${cssClassName_MainPopOver}'>
      <div class='${cssClassName_CountdownText}'></div>
      <a class='${cssClassName_StopLink}'>cancel</a>
      <a class='${cssClassName_CloseNowBtn}'>close now</a>
    </div>
    `;
    document.body.appendChild(wrapperEl);

    wrapperEl.querySelector(`.${cssClassName_CloseNowBtn}`).onclick = () => {
      log('Closing tab now');
      closeThisTabNow();
    };

    wrapperEl.querySelector(`.${cssClassName_StopLink}`).onclick = () => {
      log('Canceled the countdown');
      clearInterval(intervalId);
      wrapperEl.remove();
    };

    injectAndUpdateSettingsMenu();
  }

  const countdownEl = wrapperEl.querySelector(`.${cssClassName_CountdownText}`);
  countdownEl.innerText = `Closing page in ${Math.round(countdownTimeMs / 1000)} seconds`;
}

function injectAndUpdateSettingsMenu() {
  const incrementalSec = 5.0;
  const trueCountdownStartTimeSec = Math.round(getCountdownStartTimeMs() / incrementalSec / 1000.0) * incrementalSec;

  const optionsList = [];
  const decrementValSec = trueCountdownStartTimeSec - incrementalSec;
  const incrementValSec = trueCountdownStartTimeSec + incrementalSec;
  if (decrementValSec * 1000 >= minCountdownStartTimeMs) {
    optionsList.push(decrementValSec);
  }
  if (incrementValSec * 1000 < maxCountdownStartTimeMs) {
    optionsList.push(incrementValSec);
  }
  if (!optionsList) {
    log('no options');
    return;
  }
  const wrapperEl = getWrapperEl();
  wrapperEl.querySelector(`.${cssClassName_SettingsMenu}`)?.remove();

  const settingsEl = document.createElement('div');
  settingsEl.classList.add(cssClassName_SettingsMenu);
  settingsEl.innerHTML = `
  ${trueCountdownStartTimeSec} seconds not your speed?  Try 
  <a class='${cssClassName_SettingsOption}'>${optionsList[0]}s</a>
  `;
  if (optionsList.length > 1) {
    settingsEl.innerHTML += `
    or
    <a class='${cssClassName_SettingsOption}'>${optionsList[1]}s</a>
    `;
  }
  const optionsElList = settingsEl.querySelectorAll(`.${cssClassName_SettingsOption}`);
  for (let i = 0; i < optionsElList.length; i++) {
    const optionEl = optionsElList[i];
    const op = optionsList[i];
    optionEl.onclick = () => {
      log(`New option selected: ${op}`);
      const ms = (op + 1) * 1000;
      timeTillCloseMs = ms;
      setCountdownStartTimeMs(ms);
      injectAndUpdateSettingsMenu();
    };

  }
  wrapperEl.appendChild(settingsEl);
}

function getUrl() {
  return new URL(window.location.href);
}

function isWebClientLeave() {
  const url = getUrl();
  if (url.pathname && url.pathname.startsWith('/wc/leave')) {
    return true;
  } else {
    return false;
  }
}

function isPostAttendee() {
  const url = getUrl();
  if (url.pathname && url.pathname.startsWith('/postattendee')) {
    return true;
  } else {
    return false;
  }
}

function isMeetingStatusSuccess() {
  if (window.location.href.toLowerCase().includes('success')) {
    return true;
  }

  return false;
}

function isPageTextLikeMeetingLaunch() {
  const pageText = document?.body?.innerText?.toLowerCase() || '';

  for (var i = 0; i < text_to_look_for_from_config.length; i++) {
    text_to_look_for_lower = text_to_look_for_from_config[i].toLowerCase();

    if (pageText.includes(text_to_look_for_lower)) {
      return true;
    }
  }

  return false;
}

function countDownToClose() {
  timeTillCloseMs -= intervalRateMs;
  log(`TimeMs left: ${timeTillCloseMs} isPageText=${isPageTextLikeMeetingLaunch()} isSuccess=${isMeetingStatusSuccess()} isPostAttendee=${isPostAttendee()} isWebClientLeave=${isWebClientLeave()}`);

  if (isPageTextLikeMeetingLaunch() || isMeetingStatusSuccess() || isPostAttendee() || isWebClientLeave()) {
    log(`All checks good to auto close`);
  } else {
    timeTillCloseMs += intervalRateMs; // Put back the time
    return;
  }

  countdownWithText(timeTillCloseMs);

  if (timeTillCloseMs > 0) { return; }

  clearInterval(intervalId);

  closeThisTabNow();
}

function closeThisTabNow() {
  chrome.runtime.sendMessage({ pleaseCloseThisTab: true });
}

intervalId = setInterval(countDownToClose, intervalRateMs);