var addonGecko19x = {
  makeURI: function makeURI(aURL, aOriginCharset, aBaseURI) {
    var ioService = Components.classes["@mozilla.org/network/io-service;1"]
                .getService(Components.interfaces.nsIIOService);
    return ioService.newURI(aURL, aOriginCharset, aBaseURI);
  }
  , getResourceURI: function getResourceURI(aURI) {
    const res = "resource://"+ PACKAGE + "/";

    return {spec: res+aURI};
  }
};