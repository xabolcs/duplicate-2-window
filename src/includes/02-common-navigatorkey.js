/* ***** BEGIN LICENSE BLOCK *****
 * Version: MIT/X11 License
 * 
 * Copyright (c) 2012 Szabolcs Hubai
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
 *   Szabolcs Hubai <szab.hu@gmail.com> (Original Author)
 *
 * ***** END LICENSE BLOCK ***** */
 
function updateNewNavigatorKey(win) {
  let $ = function(id) win.document.getElementById(id);
  let xul = function(type) win.document.createElementNS(NS_XUL, type);
  
  let navKeyID = "key_newNavigator";
  let navKey = $(navKeyID);
  if (!navKey)
    return;
  
  
  // create key container node if not exists
  let d2wKCNodeID = "duplicate-2-window-container";
  let d2wKCNode = $(d2wKCNodeID);
  if (!d2wKCNode) {
    d2wKCNode = xul("duplicate2window");
    d2wKCNode.setAttribute("id", d2wKCNodeID);
    $(XUL_APP.baseKeyset).parentNode.appendChild(d2wKCNode);
  }
  
  function refreshKS(aKeySet) {
    if (aKeySet) { try {
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
    } catch (ex) { reportError (ex); reportError (aKeySet);}
    }
  }
  
  function removeKey() {
    d2wKCNode.appendChild(navKey);
    navKey.setAttribute("d2wkey", navKey.getAttribute("key"));
    navKey.removeAttribute("key");
    navKey.setAttribute("d2wmodifiers", navKey.getAttribute("modifiers"));
    navKey.removeAttribute("modifiers");
    
    refreshKS($(XUL_APP.baseKeyset));
  }
  
  function restoreKey() {
    if ($("key_newNavigatorTab").previousSibling !== navKey)
      $(XUL_APP.baseKeyset).insertBefore(navKey, $("key_newNavigatorTab"));
    
    let attribute;
    attribute = navKey.getAttribute("d2wkey");
    if (attribute)
      navKey.setAttribute("key", attribute);
    navKey.removeAttribute("d2wkey");

    attribute = navKey.getAttribute("d2wmodifiers");
    if (attribute)
      navKey.setAttribute("modifiers", attribute);
    navKey.removeAttribute("d2wmodifiers");
    
    refreshKS($(XUL_APP.baseKeyset));
  }
  
  restoreKey();
  
  let navKeyAttrModifiers, navKeyAttrKey;
  navKeyAttrModifiers = navKey.getAttribute("modifiers");
  if (!navKeyAttrModifiers)
    navKeyAttrModifiers = navKey.getAttribute("d2wmodifiers");
  navKeyAttrKey = navKey.getAttribute("key");
  if (!navKeyAttrKey)
    navKeyAttrKey = navKey.getAttribute("d2wkey");
  
  if ((navKeyAttrModifiers.replace(/control/,"accel").toLowerCase() == getPref("modifiers").replace(/control/,"accel").toLowerCase() &&
    navKeyAttrKey.toLowerCase() == getPref("key").toLowerCase()))
  {
    removeKey();
  }
  
  unload(function() {
    restoreKey();
    d2wKCNode && d2wKCNode.parentNode.removeChild(d2wKCNode);
  }, win);
  
}

