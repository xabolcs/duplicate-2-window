


const NS_XUL = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
const keysetID = "restartless-restart-keyset";
const keyID = "RR:Restart";
const tbbID = "restartlessrestart-toolbarbutton";
const fileMenuitemID = "menu_FileRestartItem";

var prefs = require("preferences-service");
const { XulKey } = require("xulkeys");
var self = require("self");
var {restart} = require("restart");

// l10n
var _ = require("l10n").l10n({
  baseURL: require("self").data.url("locale"),
  filename: "rr.properties",
  defaultLocale: "en"
});

exports.main = function(options, callbacks) {
  if ("install" == options.loadReason) {
    prefs.set("extensions.restart-jetpack.key", "R");
  } else {
    
  }

  // add hotkey
  XulKey({
    id: keyID,
    modifiers: "accel,alt",
    key: prefs.get("extensions.restart-jetpack.key", "R"),
    onCommand: function() {console.log("pressed");
      restart();
    }
  });

  // add menuitem
  var delegate = {
    onTrack: function (window) {
      if ("chrome://browser/content/browser.xul" != window.location) return;

      // Modify the window!
      var $ = function(id) window.document.getElementById(id);

      // add the new menuitem to File menu
      let (restartMI = window.document.createElementNS(NS_XUL, "menuitem")) {
        restartMI.setAttribute("id", fileMenuitemID);
        restartMI.setAttribute("class", "menuitem-iconic");
        restartMI.setAttribute("label", _("restart"));
        restartMI.setAttribute("accesskey", _("restart.ak"));
        restartMI.setAttribute("key", keyID);
        restartMI.style.listStyleImage = "url('" + self.data.url("refresh_16.png") + "')";
        //restartMI.addEventListener("command", restart, true);

        $("menu_FilePopup").insertBefore(restartMI, $("menu_FileQuitItem"));
      }
    },
    onUntrack: function (window) {
      if ("chrome://browser/content/browser.xul" != window.location) return;

      var $ = function(id) window.document.getElementById(id);
      var menuitem = $(fileMenuitemID);
      menuitem && menuitem.parentNode.removeChild(menuitem);
    }
  };
  var winUtils = require("window-utils");
  var tracker = new winUtils.WindowTracker(delegate);

  // add toolbarbutton
  require("toolbarbutton").ToolbarButton({
    id: tbbID,
    image: require("self").data.url("refresh_16.png"),
    label: "Restart",
    onCommand: function () {
      restart();
    },
    //toolbarID: "",
    //insertbefore: "",
  });
};


