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

	transform(xmldata,xslfile,document,node_id,click_handle){
		let xhttp = new XMLHttpRequest();
		let xsltProcessor = new XSLTProcessor();

		xhttp.onreadystatechange = function() {
			if (this.readyState == 4 && this.status == 200) {
				let xsldoc=this.responseXML;
				let xslstr=this.responseText;
				xsltProcessor.importStylesheet(xsldoc);
				let result= xsltProcessor.transformToFragment(xmldata, document);
				let str=new XMLSerializer().serializeToString(result);
				document.getElementById(node_id).appendChild(result);
				
				if(click_handle!=undefined && click_handle!=null){
					for(let item of click_handle){
						$(item.select).click(item.handle);
					}
				}
			}
		};
		xhttp.open("GET", xslfile, true);
		xhttp.send();
	}
	
	getXMLfile(filename, handle_response){
		let xhttp = new XMLHttpRequest();
		xhttp.onreadystatechange = function() {
			if (this.readyState == 4 && this.status == 200) {
				handle_response(this.responseXML);
			}
		};
		xhttp.open("GET", filename, true);
		xhttp.send();
	}
}

