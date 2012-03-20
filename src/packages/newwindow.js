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
* Erik Vold <erikvvold@gmail.com> (Original Author)
* Greg Parris <greg.parris@gmail.com>
* Nils Maier <maierman@web.de>
* Szabolcs Hubai <szab.hu@gmail.com>
*
* ***** END LICENSE BLOCK ***** */


let sstore = Components.classes['@mozilla.org/browser/sessionstore;1']
  .getService(Components.interfaces.nsISessionStore);

exports.newWindow = function newWindow(aEvt) {
  let window = aEvt.originalTarget;
  
  // getting the root node ("main-window") to find our window
  while (window.parentNode && window.parentNode.id) {
    window = window.parentNode;
  }
  
  window = window.ownerDocument.defaultView
  
  let chromeUrl = "chrome://browser/content/";
  try
  {
    chromeUrl = window.gPrefService.getCharPref('browser.chromeURL');
  }
  catch (err) {}
  
  let newWindow;
  let oldTab = window.gBrowser.selectedTab;
  try {
    newWindow = window.openDialog(chromeUrl, '_blank', 'chrome,all,dialog=no');
    
    newWindow.addEventListener("load", function() {
      newWindow.removeEventListener("load", arguments.callee, false);
      
      let startTab = newWindow.gBrowser.selectedTab;
      startTab.collapsed = true;
      
      let newTab = sstore.duplicateTab(newWindow, oldTab);
      newTab.addEventListener("load", function() {
        newTab.removeEventListener("load", arguments.callee, false);
        
        newWindow.gBrowser.selectedTab = newTab;
        newWindow.gBrowser.removeTab(startTab);
      }, false);
    }, false);
  } catch (err) {}
  
  return true;
}