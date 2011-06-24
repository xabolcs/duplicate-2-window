


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
  require("menuitems").Menuitem({
    id: fileMenuitemID,
    menuid: "menu_FilePopup",
    insertbefore: "menu_FileQuitItem",
    "class": "menuitem-iconic",
    "label": _("restart"),
    "accesskey": _("restart.ak"),
    key: keyID,
    image: self.data.url("refresh_16.png"),
    onCommand: restart
  });

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


