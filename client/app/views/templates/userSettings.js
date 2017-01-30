script(type="text/javascript").
  var data = {}; //to store user infos from the database in the global scope
  //get all data from the database
  getInfos();
  
  function getInfos(){
    //remove all potential messages
    document.getElementById("ErrorMessage").setAttribute("hidden", "true");
    document.getElementById("savedMessage").setAttribute("hidden", "true");
    //requestion to the user information from the database
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", "getUserInfos", false ); // false for synchronous request
    xmlHttp.send();
    if(xmlHttp.status != 200 && xmlHttp.status != 304){ //erreur du côté serveur
      document.getElementById("ErrorMessage").innerHTML = "Erreur serveur";
      document.getElementById("ErrorMessage").removeAttribute("hidden");
    }
    data = JSON.parse(xmlHttp.responseText)[0] || {}; // there is only one document for userInfos, so this is the first element of the returned array, if this is the very first execution we create the object (because data will be undefined)
    for(var propertyName in data){ // for each information
      if(propertyName == "resumes"){//for resumes (array of resumes)
        //if there is at least one resume on DoYouBuzz, we display this part
        if(data[propertyName].length){
          document.getElementById("resumesPart").removeAttribute("hidden");
          for(var resume in data[propertyName]){
            if(document.getElementById("resumeId"+data[propertyName][resume].id) !== null) continue; //if this resume was already registered
            //we create the HTML structure of the resume to be displayed
            var resumeElement = document.createElement("div");
            resumeElement.className = "resume";
            resumeElement.addEventListener("click", function(){chooseResume(this);}, false); //user interface picking behavior
            //title part
            var titleElement = document.createElement("p");
            titleElement.innerHTML = data[propertyName][resume].title;
            titleElement.className = "resumeTitle";
            titleElement.id = "resumeId" + data[propertyName][resume].id;
            titleElement.setAttribute("resumeId", data[propertyName][resume].id);
            resumeElement.appendChild(titleElement); //we append the title element to the resume element
            document.getElementById("resumesContainer").appendChild(resumeElement); //we append the resume element to the page
          }
        }
        continue;
      }
      if(propertyName == "activeResumeId"){ //if a resume is already picked by the user
        if(document.getElementById("resumeId"+data[propertyName]) !== null)document.getElementById("resumeId"+data[propertyName]).parentNode.className = "resume choice";
      }
      if(document.getElementById(propertyName) === null) continue; //if for some reason the html structure for this property doesn't exist
      //we put the information into the correct input
      document.getElementById(propertyName).value = data[propertyName].value;
      //and set the visibility preference
      document.getElementById(propertyName+"CB").checked = data[propertyName].visibility;
    }
  }

  //function to submit information and save them into the database
  function submitInfos(){
    //remove all potential messages
    document.getElementById("ErrorMessage").setAttribute("hidden", "true");
    document.getElementById("savedMessage").setAttribute("hidden", "true");
    var formElements = document.getElementById("profilElements").getElementsByTagName("input");
    var description = document.getElementsByTagName("textarea")[0]; //for the description
    var dataToSend = {}; //object that will be sent to the database
    //propertie names of the user database model is the same than the name of all inputs(include textarea) here
    //for the description
    dataToSend[description.getAttribute("name")] = description.value;
    //for the resume choice
    var choice = document.getElementsByClassName("choice")[0];
    if(choice !== undefined) dataToSend.activeResumeId = choice.childNodes[0].getAttribute("resumeId");
    //for all other information
    for(var i=0; i<formElements.length; i++){
      if(formElements[i].getAttribute("name") === null) continue; //in case
      if(formElements[i].getAttribute('type') == 'checkbox'){ //for the visibility
        //we get the property name
        var name = formElements[i].getAttribute("name");
        dataToSend[name] = formElements[i].checked; //and the value
      }else{ // for all input values
        var name = [formElements[i].getAttribute("name")]; //we get the property
        dataToSend[name] = formElements[i].value; //and the value
      }
    }
    //parameters for the request, we need here the data object and the document id of the user document(gotten from the database in the global data object)
    var idToSent = data.id || "";//id of the document received (or nothing if this is the very first execution)
    var parameters = "data="+JSON.stringify(dataToSend)+"&id="+idToSent;
    //request
    var xhttpInfos = new XMLHttpRequest();
    xhttpInfos.open("PUT", "updateUserInfos", true);
    xhttpInfos.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhttpInfos.onreadystatechange = function(){
        if (xhttpInfos.readyState == 4 && (xhttpInfos.status == 200 || xhttpInfos.status == 304)) { //if success, we display a successful message
          document.getElementById("savedMessage").removeAttribute("hidden");
          document.getElementById("savedMessage").innerHTML = xhttpInfos.responseText;
        }else if(xhttpInfos.readyState == 4){ //if error, we display an error message
          document.getElementById("ErrorMessage").removeAttribute("hidden");
          document.getElementById("ErrorMessage").innerHTML = xhttpInfos.responseText;
        }
    }
    xhttpInfos.send(parameters);
  }
  
  //function to hande the UI resume selection, it takes the selected resume HTML element as parameter
  function chooseResume(element){
    //we get all resumes HTML elements
    var resumesDIVs = document.getElementById("resumesContainer").getElementsByClassName("resume");
    for(var i in resumesDIVs){ //put the default class name (to remove a potential previous selection)
      resumesDIVs[i].className = "resume";
    }
    element.className = "resume choice"; //and add the "choice" class name to the selected resume
  }
  
  
  function getDataFromDYBResume(){
    //remove all potential messages
    document.getElementById("ErrorMessage").setAttribute("hidden", "true");
    document.getElementById("savedMessage").setAttribute("hidden", "true");
    //we warn about the user about this update
    if(confirm("Cette action mettre à jour les champs nom, prénom, email ainsi que la liste de vos CV DoYouBuzz. Continuer?")){
      document.getElementById("DYBloadingIcon").setAttribute("style", ""); //we display the loading icon
      //the request
      var xmlHttp = new XMLHttpRequest();
      xmlHttp.open( "POST", "getDYBUserInfos", true ); // true for asynchronous request
      xmlHttp.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
      xmlHttp.onreadystatechange = function(){
          if (xmlHttp.readyState == 4 && (xmlHttp.status == 200 || xmlHttp.status == 304)) {//if success, we display a succesful message
            document.getElementById("DYBloadingIcon").setAttribute("style", "display:none");
            document.getElementById("savedMessage").removeAttribute("hidden");
            document.getElementById("savedMessage").innerHTML = xmlHttp.responseText;
            getInfos();
          }else if(xmlHttp.readyState == 4){ // if error, we display an error message
            document.getElementById("DYBloadingIcon").setAttribute("style", "display:none");
            document.getElementById("ErrorMessage").removeAttribute("hidden");
            document.getElementById("ErrorMessage").innerHTML = xmlHttp.responseText;
          }
      }
      xmlHttp.send();
    }
  }
  