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

let Services, addon;
try {
  Cu.import("resource://gre/modules/Services.jsm");
  
  addon = {
    getResourceURI: function(filePath) ({
      spec: __SCRIPT_URI_SPEC__ + "/../" + filePath
    })
  };
  
} catch (ex) {

  Services = {
    appinfo: Cc["@mozilla.org/xre/app-info;1"].getService(Ci.nsIXULAppInfo)
    , prefs : Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService)
    , scriptloader : Cc["@mozilla.org/moz/jssubscript-loader;1"].getService(Ci.mozIJSSubScriptLoader)
    , wm: Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator)
    , ww: Cc["@mozilla.org/embedcomp/window-watcher;1"].getService(Ci.nsIWindowWatcher)
    , strings: Cc["@mozilla.org/intl/stringbundle;1"].getService(Ci.nsIStringBundleService)
  };
  
  addon = {
    getResourceURI: function(filePath) ({
      spec: "resource://"+ PACKAGE + "/" + filePath
    })
  }
}

const NS_XUL = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
const keysetID = "duplicate-2-window-keyset";
const keyID = "DTW:NewWin";
const fileMenuitemID = "menu_FileDuplicateToWindowItem";
const addonID = "duplicate2window@szabolcs.hubai";
var XUL_APP = {name: Services.appinfo.name};

switch(Services.appinfo.name) {
case "Thunderbird":
  XUL_APP.winType = "mail:3pane";
  XUL_APP.baseKeyset = "mailKeys";
  break;
default: //"Firefox", "SeaMonkey"
  XUL_APP.winType = "navigator:browser";
  XUL_APP.baseKeyset = "mainKeyset";
}

const PREF_BRANCH = "extensions."+ addonID +".";
const PREFS = {
  modifiers: "accel",
  locale: Cc["@mozilla.org/chrome/chrome-registry;1"]
      .getService(Ci.nsIXULChromeRegistry).getSelectedLocale("global"),
  toolbar: "",
  "toolbar.before": "",
  get key() _(PACKAGE + ".ak", getPref("locale"))
};

var prefChgHandlers = [];
let PREF_OBSERVER = {
  observe: function(aSubject, aTopic, aData) {
    if ("nsPref:changed" != aTopic || !(aData in PREFS)) return;
    prefChgHandlers.forEach(function(func) func && func(aData));
  }
}

const TYPE_BROWSER = "navigator:browser";

let logo = "";


/* Includes a javascript file with loadSubScript
*
* @param src (String)
* The url of a javascript file to include.
*/
(function(global) global.include = function include(src) {
  var o = {};
  Components.utils.import("resource://gre/modules/Services.jsm", o);
  var uri = o.Services.io.newURI(
      src, null, o.Services.io.newURI(__SCRIPT_URI_SPEC__, null, null));
  o.Services.scriptloader.loadSubScript(uri.spec, global);
})(this);

/* Imports a commonjs style javascript file with loadSubScrpt
 * 
 * @param src (String)
 * The url of a javascript file.
 */
(function(global) {
  var modules = {};
  global.require = function require(src) {
    if (modules[src]) return modules[src];
    var scope = {require: global.require, exports: {}};
    var tools = {};
    Components.utils.import("resource://gre/modules/Services.jsm", tools);
    var baseURI = tools.Services.io.newURI(__SCRIPT_URI_SPEC__, null, null);
    try {
      var uri = tools.Services.io.newURI(
          "packages/" + src + ".js", null, baseURI);
      tools.Services.scriptloader.loadSubScript(uri.spec, scope);
    } catch (e) {
      var uri = tools.Services.io.newURI(src, null, baseURI);
      tools.Services.scriptloader.loadSubScript(uri.spec, scope);
    }
    return modules[src] = scope.exports;
  }
})(this);


var {unload} = require("unload");
var {runOnLoad, runOnWindows, watchWindows} = require("window-utils");
include("includes/l10n.js");
include("includes/prefs.js");


if (!('setTimeout' in this)) {
  let Timer = Components.Constructor('@mozilla.org/timer;1', 'nsITimer', 'init');
  this.setTimeout = function(fun, timeout) new Timer({observe: function() fun()}, timeout, 0);
}    
    
function setPref(aKey, aVal) {
  aVal = ("wrapper-" + PACKAGE + "-toolbarbutton" == aVal) ? "" : aVal;
  switch (typeof(aVal)) {
    case "string":
      var ss = Cc["@mozilla.org/supports-string;1"]
          .createInstance(Ci.nsISupportsString);
      ss.data = aVal;
      Services.prefs.getBranch(PREF_BRANCH)
          .setComplexValue(aKey, Ci.nsISupportsString, ss);
      break;
  }
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
    D2WindowMI.setAttribute("class", "menuitem-iconic");
    D2WindowMI.setAttribute("label", _(PACKAGE, getPref("locale")));
    D2WindowMI.setAttribute("accesskey", getPref("key"));
    D2WindowMI.setAttribute("key", keyID);
    D2WindowMI.addEventListener("command", newWindow, true);
    D2WindowMI.style.listStyleImage = "url('" + logo + "')";

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
  function xul(type) doc.createElementNS(NS_XUL, type);

  // add hotkey
  let (D2WindowKey = xul("key")) {
    D2WindowKey.setAttribute("id", keyID);
    D2WindowKey.setAttribute("key", getPref("key"));
    D2WindowKey.setAttribute("modifiers", getPref("modifiers"));
    D2WindowKey.setAttribute("oncommand", "void(0);");
    D2WindowKey.addEventListener("command", newWindow, true);
    $(XUL_APP.baseKeyset).insertBefore(D2WindowKey, $("key_newNavigator"));
  }
  
  refreshKS($(keyID).parentNode);

  // add menu bar item to File menu
  addMenuItem(win);


  // add app menu item to Firefox button for Windows 7
  let appMenu = $("appmenu_newNavigator"), D2WindowAMI;
  if (appMenu) {
    try {
      appMenu = appMenu.parentNode;
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
  
  // add toolbar button
  let d2wTBB = xul("toolbarbutton");
  d2wTBB.setAttribute("id", PACKAGE + "-toolbarbutton");
  d2wTBB.setAttribute("type", "button");
  d2wTBB.setAttribute("image", logo);
  d2wTBB.setAttribute("class", "toolbarbutton-1 chromeclass-toolbar-additional");
  d2wTBB.setAttribute("label", _(PACKAGE, getPref("locale")));
  d2wTBB.addEventListener("command", newWindow, true);
  let tbID = getPref("toolbar");
  ($("navigator-toolbox") || $("mail-toolbox")).palette.appendChild(d2wTBB);
  if (tbID) {
    var tb = $(tbID);
    if (tb) {
      let b4ID = getPref("toolbar.before");
      let b4 = $(b4ID);
      if (!b4) { // fallback for issue 34
        let currentset = tb.getAttribute("currentset").split(",");
        let i = currentset.indexOf(PACKAGE + "-toolbarbutton") + 1;
        if (i > 0) {
          let len = currentset.length;
          for (; i < len; i++) {
            b4 = $(currentset[i]);
            if (b4) break;
          }
        }
      }
      tb.insertItem(PACKAGE + "-toolbarbutton", b4, null, false);
    }
  }

  function saveTBNodeInfo(aEvt) {
    setPref("toolbar", d2wTBB.parentNode.getAttribute("id") || "");
    setPref("toolbar.before", (d2wTBB.nextSibling || "")
        && d2wTBB.nextSibling.getAttribute("id").replace(/^wrapper-/i, ""));
  }
  win.addEventListener("aftercustomization", saveTBNodeInfo, false);

  var prefChgHanderIndex = prefChgHandlers.push(function(aData) {
    switch (aData) {
      case "locale":
        let label = _(PACKAGE, getPref("locale"));
        $(keyID).setAttribute("label", label);
        d2wTBB.setAttribute("label", label);
        break;
      case "key":
      case "modifiers":
        $(keyID).setAttribute(aData, getPref(aData));
        break;
    }
    refreshKS(win.document.getElementById(keyID).parentNode);
    addMenuItem(win);
  }) - 1;

  unload(function() {
    try {
    var key = $(keyID);
    var keyParent = key.parentNode;
    key && key.parentNode.removeChild(key);
    appMenu && appMenu.removeChild(D2WindowAMI);
    refreshKS(keyParent);
    //d2wTBBB.parentNode.removeChild(d2wTBB);
    d2wTBB.parentNode.removeChild(d2wTBB);
    win.removeEventListener("aftercustomization", saveTBNodeInfo);
    prefChgHandlers[prefChgHanderIndex] = null;
    
    } catch(ex){ reportError(ex); }
  }, win);
  
  } catch(ex){ reportError(ex); }
}

function startupGecko19x(win) {
  var prefs = Services.prefs.getBranch(PREF_BRANCH);
  
  // utils
  include(addon.getResourceURI("includes/utils.js").spec);
  
  //l10n
  include(addon.getResourceURI("includes/l10n.js").spec);
  l10n(addon, PACKAGE + ".properties");
  unload(l10n.unload);  
  
  // prefs
  include(addon.getResourceURI("includes/prefs.js").spec);
  setDefaultPrefs();
  
  
  main(win);
}

function startupGecko2x() {
  try {
   
   var prefs = Services.prefs.getBranch(PREF_BRANCH);

  // setup l10n
  l10n(addon, PACKAGE + ".properties");
  unload(l10n.unload);

  // setup prefs
  setDefaultPrefs();

  logo = addon.getResourceURI("images/d2w_16.png").spec;
  watchWindows(main, XUL_APP.winType);
  prefs = prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);
  prefs.addObserver("", PREF_OBSERVER, false);
  unload(function() prefs.removeObserver("", PREF_OBSERVER));
  } catch(ex) { reportError(ex); }
}

function install(){}
function uninstall(){}
function startup(data) {
  startupGecko2x();
}
function shutdown(data, reason) unload()
