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
 
function overrideKeySave(key, keyParent, win) {
  var $ = function(id) win.document.getElementById(id);
  
  let origKey = $("key_newNavigator");
  if (origKey && (origKey.getAttribute("modifiers") == getPref("modifiers") &&
    origKey.getAttribute("key") == getPref("key")))
  {
    //key = origKey.cloneNode(true);
    keyParent = origKey.parentNode;
    
    key = keyParent.removeChild(origKey);
    refreshKS(keyParent);
  }
}

function overrideKeyRestore(origKey, keyParent, win) {
  var $ = function(id) win.document.getElementById(id);
  
  if (origKey && (origKey.getAttribute("modifiers") != getPref("modifiers") ||
    origKey.getAttribute("key") != getPref("key")))
  {
    let insertedKey = origKey.cloneNode(true);
    origKey && keyParent.insertBefore(insertedKey, $("key_newNavigatorTab"));
    refreshKS(keyParent);
    origKey = null;
    keyParent = null;
  }
}

function main(win) {
  try {
  let doc = win.document;
  function $(id) doc.getElementById(id);
  function xul(type) doc.createElementNS(NS_XUL, type);

  let d2wKeyset = xul("keyset");
  d2wKeyset.setAttribute("id", keysetID);

  // add hotkey
  let (D2WindowKey = xul("key")) {
    D2WindowKey.setAttribute("id", keyID);
    D2WindowKey.setAttribute("key", getPref("key"));
    D2WindowKey.setAttribute("modifiers", getPref("modifiers"));
    D2WindowKey.setAttribute("oncommand", "void(0);");
    D2WindowKey.addEventListener("command", newWindow, true);
    /* $(XUL_APP.baseKeyset).insertBefore(D2WindowKey, $("key_newNavigator")); */
    $(XUL_APP.baseKeyset).parentNode.appendChild(d2wKeyset).appendChild(D2WindowKey);
  }
  
  updateNewNavigatorKey(win);
  
  // remove "key_newNavigator" until unload
  //let savedNewNavKey, savedNewNavKeyParent;
  //overrideKeySave(savedNewNavKey, savedNewNavKeyParent, win);

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
  
  // add toolbar button on FF4+
  let d2wTBB = $(PACKAGE + "-toolbarbutton") || xul("toolbarbutton");
  
  d2wTBB.setAttribute("id", PACKAGE + "-toolbarbutton");
  d2wTBB.setAttribute("type", "button");
  d2wTBB.setAttribute("image", logo);
  d2wTBB.setAttribute("class", "toolbarbutton-1 chromeclass-toolbar-additional");
  d2wTBB.setAttribute("label", _(PACKAGE, getPref("locale")));
  d2wTBB.setAttribute("oncommand", "void(0);");;
  
  d2wTBB.addEventListener("command", newWindow, true);
  let tbID = getPref("toolbar");
  if (appMenu) ($("navigator-toolbox") || $("mail-toolbox")).palette.appendChild(d2wTBB);
  if (tbID) {
    var tb = $(tbID);
    if (tb) {
      let b4ID = getPref("toolbar.before");
      let b4 = $(b4ID);
      if (!b4) { // fallback for issue 34
        let currentset = tb.getAttribute("currentset").split(",");
        let i = currentset.indexOf(d2wTBB.id) + 1;
        if (i > 0) {
          let len = currentset.length;
          for (; i < len; i++) {
            b4 = $(currentset[i]);
            if (b4) break;
          }
        }
      }
      tb.insertItem(d2wTBB.id, b4, null, false);
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
    
    updateNewNavigatorKey(win);

    addMenuItem(win);
  }) - 1;

  unload(function() {
    try {
    //var key = $(keyID);
    //var keyParent = key.parentNode;
    //key && key.parentNode.removeChild(key);
    d2wKeyset.parentNode.removeChild(d2wKeyset);
    appMenu && appMenu.removeChild(D2WindowAMI);
    //d2wKCNode.parentNode.removeChild(d2wKCNode);
    ////savedNewNavKey && overrideKeyRestore(savedNewNavKey, savedNewNavKeyParent, win);
    /* refreshKS(keyParent); */
    //d2wTBBB.parentNode.removeChild(d2wTBB);
    d2wTBB.parentNode.removeChild(d2wTBB);
    win.removeEventListener("aftercustomization", saveTBNodeInfo);
    prefChgHandlers[prefChgHanderIndex] = null;
    
    } catch(ex){ reportError(ex); }
  }, win);
  
  } catch(ex){ reportError(ex); }
}

