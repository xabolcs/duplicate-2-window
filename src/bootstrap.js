/* ***** BEGIN LICENSE BLOCK *****
 * Version: MIT/X11 License
 * 
 * Copyright (c) 2010 Erik Vold
 * 
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 * 
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 *
 * Contributor(s):
 *   Erik Vold <erikvvold@gmail.com> (Original Author)
 *   Greg Parris <greg.parris@gmail.com>
 *   Nils Maier <maierman@web.de>
 *   Szabolcs Hubai <szab.hu@gmail.com>
 *
 * ***** END LICENSE BLOCK ***** */
const PACKAGE = "duplicate2window";

var   EXPORTED_SYMBOLS = ['startupGecko19x'];

const {classes: Cc, interfaces: Ci, utils: Cu} = Components;

const reportError = Cu.reportError;

let Services;
try {
  Cu.import("resource://gre/modules/Services.jsm");
  Cu.import("resource://gre/modules/AddonManager.jsm");
} catch (ex) {

  Services = {
    prefs : Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService),
    scriptloader : Cc["@mozilla.org/moz/jssubscript-loader;1"].getService(Ci.mozIJSSubScriptLoader),
    wm: Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator),
    ww: Cc["@mozilla.org/embedcomp/window-watcher;1"].getService(Ci.nsIWindowWatcher),
    strings: Cc["@mozilla.org/intl/stringbundle;1"].getService(Ci.nsIStringBundleService),
  };
  
}

const NS_XUL = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
const keysetID = "duplicate-2-window-keyset";
const keyID = "DTW:NewWin";
const fileMenuitemID = "menu_FileDuplicateToWindowItem";
const addonID = "duplicate2window@szabolcs.hubai";

switch(Services.appinfo.name) {
case "Thunderbird":
  var XUL_APP_SPECIFIC = {
    windowType: "mail:3pane",
    baseKeyset: "mailKeys"
  };
  break;
default: //"Firefox", "SeaMonkey"
  var XUL_APP_SPECIFIC = {
    windowType: "navigator:browser",
    baseKeyset: "mainKeyset"
  };
}

const PREF_BRANCH = Services.prefs.getBranch("extensions."+ addonID +".");
// pref defaults
const PREFS = {
  get key() _("duplicate2window.ak", getPref("locale")),
  modifiers: "accel",
  locale: undefined
};
let PREF_OBSERVER = {
  observe: function(aSubject, aTopic, aData) {
    if ("nsPref:changed" != aTopic || !(aData in PREFS)) return;
    runOnWindows(function(win) {
      switch (aData) {
        case "locale":
          win.document.getElementById(keyID)
              .setAttribute("label", _("duplicate2window", getPref("locale")));
          break;
        case "key":
        case "modifiers":
          win.document.getElementById(keyID)
              .setAttribute(aData, getPref(aData));
          break;
      }
      refreshKS(win.document.getElementById(keyID).parentNode);
      addMenuItem(win);
    }, XUL_APP_SPECIFIC.windowType);
  }
}

const TYPE_BROWSER = "navigator:browser";

let logo = "";

(function(global) global.include = function include(src) (
    Services.scriptloader.loadSubScript(src, global)))(this);

if (!('setTimeout' in this)) {
  let Timer = Components.Constructor('@mozilla.org/timer;1', 'nsITimer', 'init');
  this.setTimeout = function(fun, timeout) new Timer({observe: function() fun()}, timeout, 0);
}    
    
function getPref(aName) {
  var pref = PREF_BRANCH;
  var type = pref.getPrefType(aName);

  // if the type is valid, then return the value
  switch(type) {
  case pref.PREF_STRING:
    return pref.getComplexValue(aName, Ci.nsISupportsString).data;
  case pref.PREF_BOOL:
    return pref.getBoolPref(aName);
  }

  // return default
  return PREFS[aName];
}

function addMenuItem(win) {
  var $ = function(id) win.document.getElementById(id);

  function removeMI() {
    var menuitem = $(fileMenuitemID);
    menuitem && menuitem.parentNode.removeChild(menuitem);
  }
  removeMI();

  // add the new menuitem to File menu
  let (D2WindowMI = win.document.createElementNS(NS_XUL, "menuitem")) {
    D2WindowMI.setAttribute("id", fileMenuitemID);
    D2WindowMI.setAttribute("label", _("duplicate2window", getPref("locale")));
    D2WindowMI.setAttribute("accesskey", getPref("key"));
    D2WindowMI.setAttribute("key", keyID);
    D2WindowMI.addEventListener("command", newWindow, true);

    $("menu_FilePopup").insertBefore(D2WindowMI, $("menu_newNavigator"));
  }

  unload(removeMI, win);
}

function refreshKS(aKeySet) {
  if (aKeySet) {
    var parent = aKeySet.parentNode;
    var nextn = aKeySet.nextSibling;
    parent.removeChild(aKeySet);
    if (nextn) {
      parent.insertBefore(aKeySet, nextn);
    } else {
      parent.appendChild(aKeySet);
    }
    
    parent = void(0);
    nextn = void(0);
  }
}

function newWindow(aEvent) {
  let window = Services.wm.getMostRecentWindow(TYPE_BROWSER);
  let newWindowUrl = window.gBrowser.currentURI.spec;
  
  // to be Google translate safe
  newWindowUrl = newWindowUrl.replace(/\|/g, '%7C');
  
  let chromeUrl = "chrome://browser/content/";
  try
  {
    chromeUrl = window.gPrefService.getCharPref('browser.chromeURL');
  }
  catch (err) {}
  
  
  try {
    window.openDialog(chromeUrl, '_blank', 'chrome,all,dialog=no', newWindowUrl);
  } catch (err) {reportError(err); reportError(newWindowUrl); }
  
  return true;
}

function main(win) {
  try {
  let doc = win.document;
  function $(id) doc.getElementById(id);

  // add hotkey
  let (D2WindowKey = doc.createElementNS(NS_XUL, "key")) {
    D2WindowKey.setAttribute("id", keyID);
    D2WindowKey.setAttribute("key", getPref("key"));
    D2WindowKey.setAttribute("modifiers", getPref("modifiers"));
    D2WindowKey.setAttribute("oncommand", "void(0);");
    D2WindowKey.addEventListener("command", newWindow, true);
    $(XUL_APP_SPECIFIC.baseKeyset).insertBefore(D2WindowKey, $("key_newNavigator"));
  }
  
  refreshKS($(keyID).parentNode);

  // add menu bar item to File menu
  addMenuItem(win);


  // add app menu item to Firefox button for Windows 7
  let appMenu = $("appmenu_newNavigator").parentNode, D2WindowAMI;
  if (appMenu) {
    try {
      D2WindowAMI = $(fileMenuitemID).cloneNode(false);
      D2WindowAMI.setAttribute("id", "appmenu_DuplicateToWindowItem");
      D2WindowAMI.setAttribute("class", "menuitem-iconic menuitem-iconic-tooltip");
      D2WindowAMI.style.listStyleImage = "url('" + logo + "')";
      D2WindowAMI.addEventListener("command", newWindow, true);
      appMenu.insertBefore(D2WindowAMI, $("appmenu_newNavigator"));
    } catch(ex) {
      reportError(ex);
    }
  }
  
  unload(function() {
    try {
    var key = $(keyID);
    var keyParent = key.parentNode;
    key && key.parentNode.removeChild(key);
    appMenu && appMenu.removeChild(D2WindowAMI);
    refreshKS(keyParent);
    } catch(ex){ reportError(ex); }
  }, win);
  
  } catch(ex){ reportError(ex); }
}

function startupGecko19x(win) {
  include("resource://"+ PACKAGE +"/includes/startupgecko19x.js");
  
  include(addonGecko19x.getResourceURI("includes/l10n.js").spec);
  l10n(addonGecko19x, PACKAGE + ".properties");

  var prefs = PREF_BRANCH;
  include(addonGecko19x.getResourceURI("includes/utils.js").spec);
  main(win);
}

function install(){}
function uninstall(){}
function startup(data) setTimeout (function() AddonManager.getAddonByID(data.id, function(addon) {
  var prefs = PREF_BRANCH;
  include(addon.getResourceURI("includes/l10n.js").spec);
  include(addon.getResourceURI("includes/utils.js").spec);

  l10n(addon, PACKAGE + ".properties");
  unload(l10n.unload);

  logo = addon.getResourceURI("images/d2w_16.png").spec;
  watchWindows(main, XUL_APP_SPECIFIC.windowType);
  prefs = prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);
  prefs.addObserver("", PREF_OBSERVER, false);
  unload(function() prefs.removeObserver("", PREF_OBSERVER));
}), 100);
function shutdown(data, reason) { if (reason !== APP_SHUTDOWN) unload(); }
