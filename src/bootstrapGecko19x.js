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

var   EXPORTED_SYMBOLS = ['bootstrapGecko19x'];

const {classes: Cc, interfaces: Ci, utils: Cu} = Components;
const reportError = Cu.reportError;

let Services, addon;
Cu.import("resource://"+ PACKAGE + "/gecko19xModules/servicesGecko19x.js");
  
addon = {
  getResourceURI : function(filePath) ({
    spec: "resource://"+ PACKAGE + "/" + filePath
  })
};



/* Includes a javascript file with loadSubScript
*
* @param src (String)
* The url of a javascript file to include.
*/
(function(global) global.include = function include(src) {
  var o = {};
  try {
    Components.utils.import("resource://gre/modules/Services.jsm", o);
    var uri = o.Services.io.newURI(
        src, null, o.Services.io.newURI(__SCRIPT_URI_SPEC__, null, null));
  } catch (ex) {
    o.Services = Services;
    var uri = {
      spec: "resource://"+ PACKAGE + "/" + src
    }
  }
  try {
  o.Services.scriptloader.loadSubScript(uri.spec, global);
  } catch (ex) { reportError("uri.spec: " + src + ex); }
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
    try {
      Components.utils.import("resource://gre/modules/Services.jsm", tools);
      var baseURI = tools.Services.io.newURI(__SCRIPT_URI_SPEC__, null, null);
    } catch (ex) {
      tools.Services = {};
      tools.Services.scriptloader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
                  .getService(Components.interfaces.mozIJSSubScriptLoader);
      tools.Services.io = Components.classes["@mozilla.org/network/io-service;1"]
                  .getService(Components.interfaces.nsIIOService);
      var baseURI = {};
    }
    try {
      try {
        var uri = tools.Services.io.newURI(
            "packages/" + src + ".js", null, baseURI);
      } catch (ex) {
        var uri = {
          spec: "resource://"+ PACKAGE + "/" + "packages/" + src + ".js"
        }
      }
      tools.Services.scriptloader.loadSubScript(uri.spec, scope);
    } catch (e) {
      try {
        var uri = tools.Services.io.newURI(src, null, baseURI);
      } catch (ex){
        var uri = {
          spec: "resource://"+ PACKAGE + "/" + src
        }
      }
      tools.Services.scriptloader.loadSubScript(uri.spec, scope);
    }
    return modules[src] = scope.exports;
  }
})(this);



const NS_XUL = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";

include("includes/00-addon-constants.js");

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

include("includes/01-common-setup-prefs.js");

const TYPE_BROWSER = "navigator:browser";

let logo = "";


var {unload} = require("unload");
include("includes/l10n.js");
include("includes/prefs.js");

var {newWindow} = require("newwindow");

if (!('setTimeout' in this)) {
  let Timer = Components.Constructor('@mozilla.org/timer;1', 'nsITimer', 'init');
  this.setTimeout = function(fun, timeout) new Timer({observe: function() fun()}, timeout, 0);
}  

include("includes/02-common-menuitem.js");

include("includes/03-common-main.js");

function bootstrapGecko19x(win) {
  var prefs = Services.prefs.getBranch(PREF_BRANCH);
  
  // utils
  
  //l10n
  l10n(addon, PACKAGE + ".properties");
  unload(l10n.unload);  
  
  // prefs
  setDefaultPrefs();
  
  logo = addon.getResourceURI("images/d2w_16.png").spec;
  prefs = prefs.QueryInterface(Components.interfaces.nsIPrefBranch2);
  prefs.addObserver("", PREF_OBSERVER, false);
  unload(function() prefs.removeObserver("", PREF_OBSERVER));

  
  setTimeout( function() main(win),100);
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
