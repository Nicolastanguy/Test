script(type="text/javascript").
    //if this is a response from DYB we have arguments and a different link
    var url = window.location.href;
    url = url.split("?");
    if(url.length > 1){//remove arguments (that was saved on the server before)
      url = url[0];
      url = url.replace(/apps/, "#apps");
      url += "accountSettings";
      window.location = url;//and redirect to this correct page
    }
    // here is the code to do the request, to get all elements from the database and set all input values
    var accountSettingsData = {};//global object for accounts informations from server
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", "getAccountsInfos", false ); // false for synchronous request
    xmlHttp.send();
    if(xmlHttp.status == 200 || xmlHttp.status == 304){
      // accountSettings object getten from database and will be in the global scope
      accountSettingsData = JSON.parse(xmlHttp.responseText)[0] || {};//if this is the very first execution, that will be undefined so we want {}
      document.getElementById("apiKey").value = accountSettingsData.doYouBuzzAPIKey || "";
      document.getElementById("apiSecret").value = accountSettingsData.doYouBuzzAPISecret || "";
      document.getElementById("openBadgesEmail").value = accountSettingsData.openBadgesEmail || "";
      // if this is a response from a DoYouBuzz authentification we display the message to say that the account is connected
      if(accountSettingsData.DYBResponse == "OK"){//finally not unused due to the refresh above -> need to be enhanced for better UX
        //document.getElementById("DYBconnected").setAttribute("style", "");
      }
    }

    //function to request the url elements from database and to authenticate the DoYouBuzz account
    function getDYBConnection(){
      //remove potential authentication link
      document.getElementById("DYBAuthenticationLink").setAttribute("hidden", "true");
      if (missingArgsMessage) missingArgsMessage.setAttribute("hidden", "true");
      //loading animation
      document.getElementById("DYBloadingIcon").setAttribute("style", "");
      var DYBapiKey = document.getElementById("apiKey").value || "";
      var DYBapiSecret = document.getElementById("apiSecret").value || "";
      if(DYBapiKey == "" || DYBapiSecret == ""){
            // both elements are required, so if one is missing we stop here and inform the user
            var missingArgsMessage = document.getElementById("missingArguments");
            missingArgsMessage.innerHTML = "Les deux informations (clé et clé secrète) doivent être fournis pour connecter votre compte DoYouBuzz. Merci de les remplir.";
            missingArgsMessage.removeAttribute("hidden");
            document.getElementById("DYBloadingIcon").setAttribute("style", "display:none");
            return;
      }
      //the callback is the URL to get back after the user will confirm the authentication on DoYouBuzz platform
      var callback = window.location.href;//to come back to the cozycloud app
      //the request (asynchronous here)
      var xmlHttp = new XMLHttpRequest();
      //parameters for the request
      var parameters = "DYBapiKey=" + DYBapiKey + "&DYBapiSecret=" + DYBapiSecret + "&callback=" + callback;
      xmlHttp.open( "POST", "getDYBConnection", true ); // true for asynchronous request
      xmlHttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
      xmlHttp.onreadystatechange = function(){
        //if we got the correct elements, we open the url to the authentication page (in a new tab/window)
        if (xmlHttp.readyState == 4 && (xmlHttp.status == 200 || xmlHttp.status == 304)) {
          var uri = "http://www.doyoubuzz.com/fr/oauth/authorize" + "?" + xmlHttp.responseText;
          document.getElementById("DYBAuthenticationLink").href = uri;
          document.getElementById("DYBAuthenticationLink").removeAttribute("hidden");
          document.getElementById("DYBloadingIcon").setAttribute("style", "display:none");
        }else if(xmlHttp.readyState == 4){
          var missingArgsMessage = document.getElementById("missingArguments");
          missingArgsMessage.innerHTML = xmlHttp.responseText;
          missingArgsMessage.removeAttribute("hidden");
          document.getElementById("DYBloadingIcon").setAttribute("style", "display:none");
        }
      }
      xmlHttp.send( parameters );
    }

    //function to submit all information
    function submitAccountInfos(){
        //we hide missing argumets message if it's displayed
        document.getElementById("missingArguments").setAttribute("hidden", true);
        document.getElementById("savedMessage").setAttribute("hidden", true);
        //we get all inputs value
        var DYBapiKey = document.getElementById("apiKey").value || "";
        var DYBapiSecret = document.getElementById("apiSecret").value || "";
        var OBemail = document.getElementById("openBadgesEmail").value || "";

        //if we already have accountSettings object, we use its id to update it with this submiting
        var docId = accountSettingsData.id || "";
        //we need at least one element to save it into the database
        if(DYBapiKey == "" && DYBapiSecret == "" && OBemail == ""){
            var missingArgsMessage = document.getElementById("missingArguments");
            missingArgsMessage.innerHTML = "Aucun champs n'a été rempli. Veuillez en remplir pour enregistrer des informations.";
            missingArgsMessage.removeAttribute("hidden");
            return;
        }
        //set parameters for the request
        var parameters = "DYBapiKey=" + DYBapiKey + "&DYBapiSecret=" + DYBapiSecret + "&OBemail=" + OBemail + "&id=" + docId;
        var xhttpInfos = new XMLHttpRequest();
        //asynchronous request
        xhttpInfos.open("PUT", "updateAccountsInfos", false);
        xhttpInfos.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
        xhttpInfos.send(parameters);
        if(xhttpInfos.status != 200 && xhttpInfos.status != 304){
          var missingArgsMessage = document.getElementById("missingArguments");
          missingArgsMessage.innerHTML = "Echec de l'enregistrement des données.";
          missingArgsMessage.removeAttribute("hidden");
        }else{
          document.getElementById("savedMessage").removeAttribute("hidden");
          document.getElementById("savedMessage").innerHTML = "Vos paramètres sont enregistrées";
        }
    }