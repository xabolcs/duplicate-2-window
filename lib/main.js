


const NS_XUL = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
const keysetID = "restartless-restart-keyset";
const keyID = "RR:Restart";
const fileMenuitemID = "menu_FileRestartItem";

var prefs = require("preferences-service");
const { Hotkey } = require("hotkeys");
var self = require("self");
var {restart} = require("restart");

exports.main = function(options, callbacks) {
  if ("install" == options.loadReason) {
    prefs.set("extensions.restart-jetpack.key", "R");
  } else {
    
  }
  Hotkey({
    combo: "control-alt-"+prefs.get("extensions.restart-jetpack.key", "R"),
    onPress: function() {console.log("pressed");
      restart();
    }
  });
  var delegate = {
    onTrack: function (window) {
      console.log("Tracking a window: " + window.location);
      if ("chrome://browser/content/browser.xul" != window.location) {
        return
      }
      // Modify the window!
      var $ = function(id) window.document.getElementById(id);

      // add the new menuitem to File menu
      let (restartMI = window.document.createElementNS(NS_XUL, "menuitem")) {
        restartMI.setAttribute("id", fileMenuitemID);
        restartMI.setAttribute("class", "menuitem-iconic");
        restartMI.setAttribute("label", "Restart"); // TODO: l10n
        restartMI.setAttribute("accesskey", "R");
        restartMI.style.listStyleImage = "url('" + self.data.url("refresh_16.png") + "')";
        //restartMI.addEventListener("command", restart, true);

        $("menu_FilePopup").insertBefore(restartMI, $("menu_FileQuitItem"));
      }
    },
    onUntrack: function (window) {
      console.log("Untracking a window: " + window.location);
      if ("chrome://browser/content/browser.xul" != window.location) {
        return
      }
      var $ = function(id) window.document.getElementById(id);
      var menuitem = $(fileMenuitemID);
      menuitem && menuitem.parentNode.removeChild(menuitem);
    }
  };
  var winUtils = require("window-utils");
  var tracker = new winUtils.WindowTracker(delegate);
};


