document.addEventListener('DOMContentLoaded', function() {
    init();
}, false);

const IDTO_STRING=7923;
const IDTO_BOOLEAN=7929;
const IDTO_INT=7920;
const IDTO_DOUBLE=7910;
const IDTO_DATE=7912;
const IDTO_MEMO=7945;
const IDTO_TIME=7905;
const IDTO_DATETIME=7912;
const IDTO_UNIT=7925;
const IDTO_IMAGE=7926;
const IDTO_FILE=7927;
const IDTO_FILTER=0;
const IDTO_ENUMERATED=12;
const CLSNAME_FILTER="FILTER";
const MAX_DEEP_FILTER_LEVEL=3;

const TABLEIDOFFSET=100;

const RDN=2;
const UTASK=5;

class Common{

	constructor(stlis){
		this.om=new OntologieMap();	
		this.indstore=new individual_store(this.om);
		this.om.set_individual_store(this.indstore);
		this.jse=new jsengine(this.om,this.indstore,stlis);
		this.business_rules= new rules(this.jse);
		this.jse.setRules(this.business_rules);
	}
	
	init(response){
		this.om.loadXMLMetadata(this,response);				
		this.jse.init();
	}
	
	expandXML(doc,root){
		var c =root.children;
		var i;
		  for (i = 0; i < c.length; i++) {
			var ch=c[i];
			if(ch.hasAttribute("ref_node")){
				var ref=c[i].getAttribute("ref_node");
				var node=doc.querySelector("[id_node='"+ref+"']");
				var atmap=node.attributes;
				var a;
				for(a=0;a<atmap.length;a++){					
					ch.setAttribute(atmap[a].name,atmap[a].value);
				}
			}
			this.expandXML(doc,c[i]);
		  }
	}

	transform(xmldata,xslfile,document,node_id,click_handle){
		let xhttp = new XMLHttpRequest();
		let xsltProcessor = new XSLTProcessor();

		xhttp.onreadystatechange = function() {
			if (this.readyState == 4 && this.status == 200) {
				let xsldoc=this.responseXML;
				let xslstr=this.responseText;
				xsltProcessor.importStylesheet(xsldoc.firstElementChild);
				let result= xsltProcessor.transformToFragment(xmldata, document);
				//let str=new XMLSerializer().serializeToString(result);
				//var xmlText = new XMLSerializer().serializeToString(result);
				var owner_node=document.getElementById(node_id);
				var result_root_el=result.firstElementChild;
				
				owner_node.appendChild(document.adoptNode(result_root_el));//result_root_el);
				
				if(click_handle!="undefined" && click_handle!=null){
					for(let item of click_handle){
						$(item.select).click(item.handle);
					}
				}
			}
		};
		xhttp.open("GET", xslfile, true);
		xhttp.send();
	}
	
	postXMLfile(filename, poststr, handle_response){
		let xhttp = new XMLHttpRequest();
		let postaction=poststr!== undefined && poststr!=null;
		xhttp.open(postaction?"POST":"GET", filename, true);
		if(postaction){
			xhttp.setRequestHeader('Content-type', 'xml/text');
		}
		xhttp.onreadystatechange = function() {
			if (this.readyState == 4 && this.status == 200 && this.responseXML !==undefined) {
				handle_response(this.responseXML);
			}
		};

		if(postaction){
			xhttp.send(poststr);
		}else
			xhttp.send();
	}
		
	getXMLfile(filename, handle_response){
		this.postXMLfile(filename, null, handle_response);
	}
}

