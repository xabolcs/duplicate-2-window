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

const EXPORTED_SYMBOLS = ['main'];

const {classes: Cc, interfaces: Ci, utils: Cu} = Components;

const reportError = Cu.reportError;

let Services;
try {
  Cu.import("resource://gre/modules/Services.jsm");
  Cu.import("resource://gre/modules/AddonManager.jsm");
} catch (ex) {
  Cu.import("resource://duplicate2window/includes/unload.js");
  Services = {
    prefs : Cc["@mozilla.org/preferences-service;1"].getService(Ci.nsIPrefService),
    scriptloader : Cc["@mozilla.org/moz/jssubscript-loader;1"].getService(Ci.mozIJSSubScriptLoader),
    wm: Cc["@mozilla.org/appshell/window-mediator;1"].getService(Ci.nsIWindowMediator),
    ww: Cc["@mozilla.org/embedcomp/window-watcher;1"].getService(Ci.nsIWindowWatcher)
  };
}

const NS_XUL = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
const keysetID = "duplicate-2-window-keyset";
const keyID = "DTW:NewWin";
const fileMenuitemID = "menu_FileDuplicateToWindowItem";
const addonID = "duplicate2window@szabolcs.hubai";


const PREF_BRANCH = Services.prefs.getBranch("extensions."+ addonID +".");
const PREFS = {
  key: "N",
  modifiers: "accel"
};
let PREF_OBSERVER = {
  observe: function(aSubject, aTopic, aData) {
    if ("nsPref:changed" != aTopic || !PREFS[aData]) return;
    runOnWindows(function(win) {
      win.document.getElementById(keyID).setAttribute(aData, getPref(aData));
      refreshKS(win.document.getElementById(keyID).parentNode);
      addMenuItem(win);
    });
  }
}

const TYPE_BROWSER = "navigator:browser";

let logo = "";

(function(global) global.include = function include(src) (
    Services.scriptloader.loadSubScript(src, global)))(this);

function getPref(aName) {
  try {
    return PREF_BRANCH.getComplexValue(aName, Ci.nsISupportsString).data;
  } catch(e) {}
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
    D2WindowMI.setAttribute("label", "Duplicate to New Window");
    D2WindowMI.setAttribute("accesskey", "N");
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
  let wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                   .getService(Components.interfaces.nsIWindowMediator);
  let window = wm.getMostRecentWindow(TYPE_BROWSER);
  
  let chromeUrl = "chrome://browser/content/";
  try
  {
    chromeUrl = window.gPrefService.getCharPref('browser.chromeURL');
  }
  catch (err) {}
  
  
  window.openDialog(chromeUrl, '_blank', 'chrome,all,dialog=no', window.gBrowser.currentURI.spec);
  
  return true;
}

function main(win) {
  let doc = win.document;
  function $(id) doc.getElementById(id);

  // add hotkey
  let (D2WindowKey = doc.createElementNS(NS_XUL, "key")) {
    D2WindowKey.setAttribute("id", keyID);
    D2WindowKey.setAttribute("key", getPref("key"));
    D2WindowKey.setAttribute("modifiers", getPref("modifiers"));
    D2WindowKey.setAttribute("oncommand", "void(0);");
    D2WindowKey.addEventListener("command", newWindow, true);
    $("mainKeyset").insertBefore(D2WindowKey, $("key_newNavigator"));
  }
  
  refreshKS($(keyID).parentNode);

  // add menu bar item to File menu
  addMenuItem(win);

  try {
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
      dump(addonID+' appmenu:'+ex.message+'\n');
    }
  }
  } catch(ex){}
  
  unload(function() {
    var key = $(keyID);
    var keyParent = key.parentNode;
    key && key.parentNode.removeChild(key);
    appMenu && appMenu.removeChild(D2WindowAMI);
    refreshKS(keyParent);
  }, win);
}

function install(){}
function uninstall(){}
function startup(data) AddonManager.getAddonByID(data.id, function(addon) {
  var prefs = PREF_BRANCH;
  include(addon.getResourceURI("includes/unload.js").spec);
  include(addon.getResourceURI("includes/utils.js").spec);
  logo = addon.getResourceURI("images/d2w_16.png").spec;
  watchWindows(main);
  prefs = prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);
  prefs.addObserver("", PREF_OBSERVER, false);
  unload(function() prefs.removeObserver("", PREF_OBSERVER));
});
function shutdown(data, reason) { if (reason !== APP_SHUTDOWN) unload(); }
