/* -*- Mode: Java; tab-width: 2; indent-tabs-mode: nil; c-basic-offset: 2 -*-
 *
 * The contents of this file are subject to the Mozilla Public
 * License Version 1.1 (the "License"); you may not use this file
 * except in compliance with the License. You may obtain a copy of
 * the License at http://www.mozilla.org/MPL/
 * 
 * Software distributed under the License is distributed on an "AS
 * IS" basis, WITHOUT WARRANTY OF ANY KIND, either express or
 * implied. See the License for the specific language governing
 * rights and limitations under the License.
 *
 * The Original Code is mozilla.org code.
 *
 * The Initial Developer of the Original Code is Axel Hecht.
 * Portions created by Axel Hecht are Copyright (C) 2001 Axel Hecht.
 * All Rights Reserved.
 *
 * Contributor(s):
 *   Axel Hecht <axel@pike.org> (Original Author)
 */

var pop_last=0, pop_chunk=25;
var isinited=false;
var xalan_base, xalan_xml, xalan_elems, xalan_length, content_row, target;
var pref;

function loaderstuff(eve) {
  var ns = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
  content_row = document.createElementNS(ns,"row");
  content_row.setAttribute("flex","1");
  content_row.appendChild(document.createElementNS(ns,"checkbox"));
  content_row.appendChild(document.createElementNS(ns,"text"));
  content_row.appendChild(document.createElementNS(ns,"text"));
  content_row.appendChild(document.createElementNS(ns,"text"));
  netscape.security.PrivilegeManager.enablePrivilege('UniversalXPConnect');
  target = document.getElementById("xalan_grid");
  xalan_base = document.getElementById("xalan_base");
  xalan_xml = document.implementation.createDocument("","",null);
  xalan_xml.addEventListener("load", xalanIndexLoaded, false);
  xalan_xml.load("complete-xalanindex.xml");
  //xalan_xml.load("xalanindex.xml");
  return true;
}

function xalanIndexLoaded(e) {
  xalan_elems = xalan_xml.getElementsByTagName("test");
  xalan_length = xalan_elems.length;
  populate_xalan();
  return true;
}

function refresh_xalan() {
  while(target.hasChildNodes()) target.removeChild(target.lastChild);
  xalan_elems = xalan_xml.getElementsByTagName("test");
  xalan_length = xalan_elems.length;
  populate_xalan();
  return true;
}


function populate_xalan() {
  var upper=pop_last+pop_chunk;
  var current,test,i,j, re=/\/err\//;
  for (i=pop_last;i<Math.min(upper,xalan_length);i++){
    current = content_row.cloneNode(true);
    test = xalan_elems.item(i);
    if (!test.getAttribute("file").match(re)){
      current.childNodes.item(1).setAttribute("value",
  	  test.getAttribute("file"));
      for (j=0;j<test.childNodes.length;j++){
  	  if (test.childNodes.item(j).localName=="purpose")
  	    current.childNodes.item(2).setAttribute("value",
  	      test.childNodes.item(j).firstChild.nodeValue);
  	  if (test.childNodes.item(j).localName=="comment")
  	    current.childNodes.item(3).setAttribute("value",
  	      test.childNodes.item(j).firstChild.nodeValue);
      }
      target.appendChild(current);
    }
  }
  if (pop_last+pop_chunk<xalan_length){
    pop_last+=pop_chunk;
    window.status="Loaded "+Math.ceil(pop_last/xalan_length*100)+"% of xalanindex.xml";
    setTimeout("populate_xalan()",10);
  } else {
    window.status="";
  }
}

function dump_checked(){
  var nds = target.childNodes;
  var todo = new Array();
  for (i=1;i<nds.length;i++){
    node=nds.item(i).firstChild;
    if(node.hasAttribute("checked"))
      todo.push(node.nextSibling.getAttribute("value"));
  }
  do_transforms(todo);
}

function hide_checked(yes){
  var checks = document.getElementsByTagName("checkbox");
  for (i=0;i<checks.length;i++){
    node=checks.item(i);
    if (node.hasAttribute("checked")==yes)
      node.parentNode.parentNode.removeChild(node.parentNode);
  }
}

function select(){
  var se = document.getElementById("search-name");
  var searchField = document.getElementById("search-field");
  searchField = searchField.getAttribute("data");
  var re = new RegExp(se.value);
  if (searchField<1 || searchField>3) return;
  var nds = target.childNodes;
  for (i=1;i<nds.length;i++){
    node=nds.item(i).childNodes.item(searchField);
    if (re.test(node.getAttribute("value")))
      nds.item(i).firstChild.setAttribute("checked",true);
  }
}

function check(yes){
  var i, nds = target.childNodes;
  for (i=1;i<nds.length;i++){
    if (yes)
      nds.item(i).firstChild.setAttribute("checked",true);
    else
      nds.item(i).firstChild.removeAttribute("checked");
  }
}

function invert_check(){
  var i, checker, nds = target.childNodes;
  for (i=0;i<nds.length;i++){
    checker = nds.item(i).firstChild;
    if (checker.hasAttribute("checked"))
      checker.removeAttribute("checked");
    else
      checker.setAttribute("checked",true);
  }
}

function browse_base_dir(){
  netscape.security.PrivilegeManager.enablePrivilege('UniversalXPConnect');
  const nsIFilePicker = Components.interfaces.nsIFilePicker;
  var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(
                               nsIFilePicker);
  fp.init(window,'Xalan Tests Base Dir',nsIFilePicker.modeGetFolder);
  fp.appendFilters(nsIFilePicker.filterAll);
  var res = fp.show();

  if (res == nsIFilePicker.returnOK) {
    var furl = fp.fileURL, fconf=fp.fileURL, fgold=fp.fileURL;
    fconf.path = furl.path+'conf';
    fgold.path = furl.path+'conf-gold';
    if (!fconf.file.exists() || !fconf.file.isDirectory()){
      alert("Xalan Tests not found!");
      return;
    }
    if (!fgold.file.exists() || !fgold.file.isDirectory()){
      alert("Xalan Tests Reference solutions not found!");
      return;
    }
    xalan_base.setAttribute('value',fp.fileURL.path);
  }
}