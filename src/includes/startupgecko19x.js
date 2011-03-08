  
var EXPORTED_SYMBOLS = ['_'];  

const StringService = Components.classes["@mozilla.org/intl/stringbundle;1"].getService(Components.interfaces.nsIStringBundleService);

let locale = Components.classes["@mozilla.org/chrome/chrome-registry;1"]
    .getService(Components.interfaces.nsIXULChromeRegistry).getSelectedLocale("global"); 

let strings = StringService.createBundle("resource://duplicate2window/locale/"+locale+"/duplicate2window.properties");
let stringsDefaultLang = StringService.createBundle("resource://duplicate2window/locale/en/duplicate2window.properties");
try {
  
  let stringsBaseLang;
  let splitter = /(\w+)-\w+/;
  let (locale_base = locale.match(splitter)) {
    if (locale_base) {

      stringsBaseLang = StringService.createBundle(
          "resource://duplicate2window/locale/"+locale_base[1]+"/duplicate2window.properties");
    }
  }
} catch(ex) { };

_ = function l10ngecko19x (aKey, aLocale) {
  let result;
  try {
    result = strings.GetStringFromName(aKey);
  } catch(ex) {
    try { 
      result = stringsBaseLang.GetStringFromName(aKey);
    } catch (aEx) {
      result = stringsDefaultLang.GetStringFromName(aKey);
    }
  }
  return result;
};