class ClassDef{	
	constructor(id,name,isAbstract,individual_enum_list){
		this.id=id;
		this.name=name;
		this.isAbstract=isAbstract;
		this.propList=new Map();//propid>PropertyDef
		this.individual_enum_list=[];
		if(individual_enum_list!=undefined && individual_enum_list!=null){
			this.individual_enum_list=individual_enum_list;
		}
	}

	addProperty( pdef){
		this.propList.set(pdef.id,pdef);		
	}
	getAllProperties() {
		// List<PropertyDef> 
		return this.propList.values();		
	}

	getName() {
		return this.name;
	}

	isAbstractClass() {
		// boolean
		return this.isAbstract;
	}

	getProperty(id){
		//PropertyDef
		return this.propList.get(id);
	}
	
	get_enum_list(){
		return this.individual_enum_list;
	}

}

class PropertyDef{	
	constructor(id,name,type,isObjectProp){
		this.id=id;
		this.name=name;
		this.type=type;
		this.isObjectProp=isObjectProp;

		this.ranges=new Set();
		this.domains=new Set();
		this.qmin=0;
		this.qmax=-1;
	}
	
	isObjectProperty(){
		return this.isObjectProp;
	}
	addRange(rg){
		this.ranges.add(rg);
	}

	getName() {
		// TODO Auto-generated method stub
		return this.name;
	}
	getObjectPropertyRanges() {
		return this.ranges;
	}

	getDataPropertyType() {
		return this.type;
	}
	
	getDataPropertyTypeName() {
		switch(this.type){
		case IDTO_STRING:
			return "TEXT";
		case IDTO_BOOLEAN:
			return "BOOL";
		case IDTO_INT:
			return "INT";
		case IDTO_DOUBLE:
			return "FLOAT";
		case IDTO_DATE:
			return "DATE";
		case IDTO_MEMO:
			return "MEMO";
		case IDTO_TIME:
			return "TIME";
		case IDTO_DATETIME:
			return "DATETIME";
		case IDTO_IMAGE:
			return "IMAGE";
		case IDTO_FILE:;
			return "FILE";			
		};
	}
	
	getIdProp() {
		// TODO Auto-generated method stub
		return this.id;
	}

	equals(ob){
		if(typeof(ob)!="PropertyDef") return false;
		return ob.id==this.id;
	}
	
	clone(){
		return new PropertyDef(this.id,this.name,this.type,this.isObjectProp);
	}
}

class PropertyUnit {
	constructor(id,unit,exponent,magnitude){
		this.id=id;
		this.unit=unit;
		this.exponent=exponent;
		this.magnitude=magnitude;
	}
}


class PredefinedUnit {
	constructor(id,unit,property,classname){
		this.id=id;
		this.unit=unit;
		this.classname=classname;
		this.property=property;
	}
}

class OntologieMap{

	constructor(server){
		this.clscode=[125,133,198,338,404,427,628];
		
		this.init=false;
		
		this.classByName= new Map();//HashMap<String,ClassDef> 
		this.classById= new Map();//new HashMap<Integer,ClassDef>();
		this.rdnMap = new Array();//new ArrayList<rdnindividual>();
		this.propGroupMap=new Map();//new HashMap<String,ArrayList<PropertyDef>>() ;
		this.propertyByID= new Map();//new HashMap<String,PropertyDef>();
		this.propertyByName= new Map();//new HashMap<String,PropertyDef>();
		this.propertyByRange= new Map();//new HashMap<Integer,ArrayList<PropertyDef>>();
		this.magnUnits=new Map();//new HashMap<String,ArrayList<PropertyUnit>>();
		this.propMagnitudes=new Map();//new HashMap<String,ArrayList<PredefinedUnit>>();
		this.hierarchy= new Map();//key class id, value array superior classes
		//server=http://localhost:81/wsemantic_server;
		if(server!=null && typeof(server)!="undefined"){
			fetch(server+"?selection=init&query=METADATA").then(function(response) { 
				return response.json();
			}).then(function(j) {
				console.log(j); 
			});
		}
	
	}
	
	set_individual_store(is){
		this.individual_store=is;
	}

	loadXMLHierarchy(rootxml){
		let root=rootxml.getElementsByTagName("HIERARCHIES");
    	let arr=root[0].getElementsByTagName("HIERARCHY");
    	for(let pos=0;pos<arr.length;pos++){
    		let item=arr[pos];
    		let idto= parseInt(item.getAttribute("ID_TO"));
    		let idtoSup= parseInt(item.getAttribute("ID_TO_PARENT"));
			let sup_list=this.hierarchy.get(idto);
			if(sup_list==undefined){
				sup_list=[];
				this.hierarchy.set(idto,sup_list);
			}
			sup_list.push(parseInt(idtoSup));
    	}
	}
    		
    loadXMLMetadata(comjs,xmldata){
		comjs.om.loadXMLProperties(xmldata);
		comjs.om.loadXMLHierarchy(xmldata);
		comjs.om.loadXMLClasses(comjs.jse,xmldata);
		comjs.om.loadXMLIndividualFacts(comjs.jse,xmldata.getElementsByTagName("ENUMERATEDCLASSES")[0]);
    }
    
	loadXMLProperties(propxml){
		let root=propxml.getElementsByTagName("PROPERTIES");
    	let arr=root[0].getElementsByTagName("PROPERTY");
    	for(let pos=0;pos<arr.length;pos++){
    		let property=arr[pos];
    		let id= parseInt(property.getAttribute("PROP"));
    		let name= property.getAttribute("NAME");
    		let category= parseInt(property.getAttribute("CAT"));
    		let isobjprop=category%2!=0;
    		
    		let type=parseInt(property.getAttribute("VALUECLS"));
    		if(isobjprop){
    			//is object Prop
    			type=null;
    			
    		}
			let propDef=new PropertyDef(id,name,type,isobjprop);
			this.propertyByID.set(id,propDef);
			this.propertyByName.set(name,propDef);			
    	}
	}
	
	loadXMLClasses(jse,clsxml){
		let insroot=clsxml.getElementsByTagName("INSTANCES");
    	let insarr=insroot[0].getElementsByTagName("INSTANCE");
    	let oldClass=0;
    	let clsDef;
    	let oldprop=0;
    	let propClassDef;
       	let adaptedIndiv=[];
       	
    	for(let pos=0;pos<insarr.length;pos++){
    		let factinstance=insarr[pos];
    		let idClass= parseInt(factinstance.getAttribute("IDTO"));    		
    		let name= factinstance.getAttribute("NAME");
			let propId=parseInt(factinstance.getAttribute("PROP"));
			let pdef=this.propertyByID.get(propId);
    		let operator=factinstance.getAttribute("OP");
    		if(operator==undefined) operator="";
    		
    		let ido=factinstance.getAttribute("IDO");
    		if(name.startsWith("Task_")){
    			//Cuando es Task_ viene con un idto ficticio
    			//Es una clase con varias propiedades, simulo es un individuo y será procesado al final
    			//Pueden apuntar a areas funcionales, que se procesan en este bucle con IDO!=null nates de procesarse al final estos individuos adaptados.
    			//Sin embargo aparecen en el XML despues de haber sido referenciadas aqui
    			
    			if(idClass<0){
    				factinstance.setAttribute("IDTO",UTASK);
    				factinstance.setAttribute("IDO",this.codeLegacyIdo(-idClass, UTASK, true));
    			}else{
    				factinstance.setAttribute("IDO",this.codeId(idClass,idClass));
    			}
    			
    			let adaptedRdn=false;
    			if(pdef.name=="rdn" && operator=="AND"){
    				factinstance.textContent=name.slice(5);
    				adaptedRdn=true;
    			}
    			let valcls=factinstance.getAttribute("VALCLS");
    			if(valcls!=undefined)	factinstance.setAttribute("VALUECLS",valcls);
    			let value=factinstance.getAttribute("VAL");
    			if(value!=undefined)	factinstance.setAttribute("RDNVALUE",value);
    			
    			//TODO capturar tambien cardinalidad
    			if(value!=undefined||adaptedRdn||pdef.isObjectProperty()) adaptedIndiv.push(factinstance);
    			continue;
    		}
    		
    		let virtual=factinstance.getAttribute("VIRTUAL");
    		if(virtual==undefined) virtual=false;
    		
			if(idClass!=oldClass){
				clsDef= new ClassDef(idClass,name,false);
				this.addClass(clsDef);
			}
    		
    		
    		if(ido!=undefined){
    			//AREAS FUNCIONALES
    			let tableid=this.getTableIdFromLegacyIdo(ido);
    			let id=this.codeId(idClass,tableid);
    			let ind=this.individual_store.getIndivById(id);
    			if(ind==undefined){
    				ind={class:idClass,id:id};    			
    				//estos individuos, como areas funcionales, no necesitan pasar por indexado en JSE.
    				//solo hay un nodo de cada
    				this.individual_store.insert(ind);
    			}
    			if(!pdef.isObjectProperty()){
    				//No hay otro caso que data prop rdn
    				
    				this.individual_store.set(idClass,id,pdef.name,factinstance.getAttribute("VAL"));
    			}
    			    			
    		}else if(virtual=="false"){
    			
    			propClassDef=this.loadInstanceProperty(operator,oldprop,clsDef,pdef,propClassDef,factinstance,"VALCLS");
				if(oldprop!=propClassDef.id) clsDef.addProperty(propClassDef);
				
    			oldClass=idClass;
    			oldprop=propId;
    		}    		
    	}
    	if(adaptedIndiv.length>0) this.loadXMLIndividualFacts(jse,adaptedIndiv);
	}
	
	loadInstanceProperty(operator,oldprop,clsDef,pdef,propClassDef,factinstance,valclstag){
		if(pdef.id!=oldprop) propClassDef=pdef.clone();
		
		if(operator=="AND"){
			if(pdef.isObjectProperty()){			
				let rangeId= parseInt(factinstance.getAttribute(valclstag));
				propClassDef.addRange(rangeId);
				let propByRangeArr=this.propertyByRange.get(rangeId);
				if(propByRangeArr==null){
					propByRangeArr=new Array();
					this.propertyByRange.set(rangeId, propByRangeArr);
				}else{
					if(propByRangeArr.indexOf(pdef)<0) propByRangeArr.push(pdef);
				}					
			}	    			   
			
			pdef.domains.add(clsDef.id);							
		}
		
		if(operator=="CAR"){
			if(factinstance.getAttribute("QMIN")!=undefined)	propClassDef.qmin=parseInt(factinstance.getAttribute("QMIN"));
			if(factinstance.getAttribute("QMAX")!=undefined)	propClassDef.qmin=parseInt(factinstance.getAttribute("QMAX"));
		}
		
		if(operator=="ONEOF"){
			
			if(pdef.isObjectProperty()){
				/*
				 * 
				 Ignoro porque solo se da en enumerados, repitiendose los valores cuando ya la clase indica los individuos
				 let rangerdn= factinstance.getAttribute("VAL");
				let rangeclass=parseInt(factinstance.getAttribute("VALCLS"));
				let rangeInd=this.individual_store.getIndByRdn(rangeclass,rangerdn);
				if(rangeInd==undefined){    				
					//registro el rdn con id ficticio
					rdnmap.set(""+ind.class+"#"+ind.rdn,0);        				
				}*/
			}
		}
		return propClassDef;
	}
	
	loadColumns(jse,root){
		let insroot=root.getElementsByTagName("COLUMNS");
    	let insarr=insroot[0].getElementsByTagName("COLUMN");
    	let oldClass=0,oldClsParent=0;
    	let clsDef;
    	let oldprop=0;

       	let adaptedIndiv=[];
       	let columngroup=new Set();
       	let columorder=new Set();
       	
    	for(let pos=0;pos<insarr.length;pos++){
    		let column=insarr[pos];
    		let idClass= parseInt(column.getAttribute("CLASS"));
    		let idParent= column.getAttribute("CLASSPARENT");
    		
    		if(idParent==undefined) idParent=0;
    		else idParent= parseInt(idParent);
    		
    		let path= column.getAttribute("PROPPATH");
			let order=parseInt(column.getAttribute("ORDER"));
			
			let keygr=""+idParent+"#"+idClass;
			let keyorder=keygr+"#"+path;
			
			//TODO IDORDER, IDROOT son atributos añadidos a metadata y discontinuado por afectar al rendimiento, habria que actualizar todas las bases de datos con nueva s_columnproperties
			let idroot=parseInt(column.getAttribute("IDROOT"))
			let idoroot=""+this.codeLegacyIdo(idroot,idto,false)
			let idtoroot=this.getIdClassForName("COLUMNAS_TABLA");
			
			if(!columngroup.has(keygr)){
				let grdn=new Element("NEWFACT");
				
				grdn.setAttribute("IDTO",""+idto);
				grdn.setAttribute("NAME","COLUMNAS_TABLA");

				grdn.setAttribute("IDO",idtoroot);
				grdn.setAttribute("PROP",""+RDN);
				grdn.textContent(""+idroot);
				adaptedIndiv.push(grdn);
				
				if(idParent>0){
					let parent=new Element("NEWFACT");
					parent.setAttribute("IDTO",""+idto);
					parent.setAttribute("NAME","COLUMNAS_TABLA");
					parent.setAttribute("IDO",ido);
					parent.setAttribute("PROP",""+this.getPropertyId("dominio"));
					parent.setAttribute("VALCLS",idParent);
					adaptedIndiv.push(parent);
				}								
			}
			
			let propcolumn=new Element("NEWFACT");
			propcolumn.setAttribute("IDTO",""+idtoroot);
			propcolumn.setAttribute("NAME","COLUMNAS_TABLA");
			let idorder=parseInt(propcolumn.getAttribute("IDORDER"))
			let idoorder=""+this.codeLegacyIdo(idorder,idtorder,false);
			
			propcolumn.setAttribute("IDO",""+idoroot);
			propcolumn.setAttribute("PROP",""+this.getPropertyId("columnas"));
			propcolumn.setAttribute("VALUE",idoorder);
			propcolumn.setAttribute("VALUECLS",idParent);
			adaptedIndiv.push(propcolumn);
			//
			column.setAttribute("IDTO",""+idtorder);
			column.setAttribute("NAME","ORDEN_CAMPO_CON_FILTRO");			
			column.setAttribute("IDO",""+idoorder);
			column.setAttribute("PROP",""+this.getPropertyId("ruta_propiedad"));
			column.textContent(path);
			column.setAttribute("VALUECLS",""+IDTO_STRING);
			adaptedIndiv.push(column);
			//
			let orderfact=new Element("NEWFACT");
			orderfact.setAttribute("IDTO",""+idtorder);
			orderfact.setAttribute("NAME","ORDEN_CAMPO_CON_FILTRO");			
			orderfact.setAttribute("IDO",""+idoorder);
			orderfact.setAttribute("PROP",""+this.getPropertyId("orden"));
			orderfact.setAttribute("QMIN",""+order);
			orderfact.setAttribute("QMAX",""+order);
			orderfact.setAttribute("VALUECLS",""+IDTO_INT);
			adaptedIndiv.push(orderfact);
    	}
	}
	
	loadXMLIndividualFacts(jse, root){
    	let arr=root;
    	if(root instanceof Element){
    		arr=root.getElementsByTagName("FACTS");
    		if(arr.length>0) arr=root.getElementsByTagName("FACT");
    	}
    	let oldid=0;
    	let ind;
    	let must_register=false;
    	let oldObjPropRange=0;
    	let propClassDef;
    	for(let pos=0;pos<arr.length;pos++){
    		let factparent=arr[pos];
    		let newfact=factparent.nodeName=="FACT"?factparent.getElementsByTagName("NEW_FACT")[0]:factparent;
    		let valuecls=parseInt(newfact.getAttribute("VALUECLS"));
    		
    		let ido=parseInt(newfact.getAttribute("IDO"));
    		let idClass=parseInt(newfact.getAttribute("IDTO"));
    		let id=this.codeId(idClass,this.getTableIdFromLegacyIdo(ido));
    		
    		if(id!=oldid){
    			if(must_register){
    				//registro individuo capturado en iteracion anterior, una vez capturadas todas las prop
    				jse.new_individual(ind);
    				must_register=false;
    			}
    				
    			ind=this.individual_store.getIndivById(id);
    		}
			if(ind==undefined){
				ind={class:idClass,id:id};
				must_register=true;				
			}

    		let operator=newfact.getAttribute("OP");
    		if(operator==undefined) operator="";
    		let clsDef=this.getClass(idClass);
    		
			let propId=parseInt(newfact.getAttribute("PROP"));			
			let pdef=this.propertyByID.get(propId);
			if(pdef.isObjectProperty()){
				let rangerdn= newfact.getAttribute("RDNVALUE");
				//TODO, soportar tambien value con legacy ido
				let rangeclass=parseInt(newfact.getAttribute("VALUECLS"));
				if(rangerdn!=undefined){	 				
	 				let rangeInd=this.individual_store.getIndByRdn(rangeclass,rangerdn);
	 				let valarr=ind[pdef.name];
	 				if(valarr==undefined){
	 					valarr=[];
	 					ind[pdef.name]=valarr;
	 				}
	 				if(valarr.indexOf(rangeInd.id)<0){
	 					valarr.push(rangeInd.id);
	 				}
				}else{
					if(!ind.hasOwnProperty(pdef.name)){//If individual own the property, shoul be oneof, so must keep oneof data
		    			propClassDef=this.loadInstanceProperty(operator,oldObjPropRange,clsDef,pdef,propClassDef,newfact,"VALCLS");
						if(oldObjPropRange!=propClassDef.id){
							ind[pdef.name]=propClassDef;
						}
						oldObjPropRange=pdef.id;
					}
				}
			}else{				
				if(valuecls==IDTO_STRING){
					ind[pdef.name]=newfact.textContent;
				}
				if(valuecls==IDTO_DOUBLE){
					ind[pdef.name]=parseFloat(newfact.getAttribute("QMIN"));
				}
				if(valuecls==IDTO_INT){
					ind[pdef.name]=parseInt(newfact.getAttribute("QMIN"));
				}
			}		
			oldid=id;
    	}
    	
		if(must_register){
			//registro individuo capturado en iteracion anterior
			jse.new_individual(ind);		
		}
	}
	
	getTableIdFromLegacyIdo(ido) {		
		if(ido<0)  return getTableIdNoCompress(ido);
		if(ido%2==1){
			ido=ido-1;
			ido=ido/2;			
			let res=parseInt(ido/10,10);
			return res-TABLEIDOFFSET;
		}else{
			ido=ido/2;
			//System.out.println("GET TABLEID C2 "+ido+" id "+ ido/1000);
			return parseInt(ido/1000,10);
		}			   		
   	}
	
	getTableIdNoCompress(ido) {
   		return ido/1000;
   	}
	
	codeId(idclass,tableid){
		return ""+idclass+"."+tableid;
	}
	
	codeLegacyIdo(tableId, idto, metadata_source) {
   		if(tableId>0){
   			let clspos= this.clscode.indexOf(idto);
   			let clase=idto;
   			if(clspos>=0){
   	   			let tableIdOff=tableId+TABLEIDOFFSET;//para que no colisiones con ids de clases que son menor de 1000
   				clase=clspos;   				 
   				return (tableIdOff*10+clase)*2+1;   			
   			}else{
   				if((tableId*1000+clase)*2>Math.pow(2, 31)-1){
   					console("ERROR, el table id supera el integer maximo y no tiene codificacion especial (tableid, idto: "+ tableId+","+ idto);
   				}
   				return (tableId*1000+clase)*2;
   			}
   		}else   		
   			return metadata_source!=undefined && metadata_source ? idto:getIdoNoCompress(tableId,idto);
   	}
	
	getIdtoNoCompress(ido) {
		let tableId = this.getTableIdNoCompress(ido);
		if(ido<0) return -(Math.abs(ido)-Math.abs(tableId)*1000);
   		return ido-(tableId*1000);
   	}
	
	is_specialized_of(class_child,class_sup){
		if(class_child===class_sup) return true;
		let sup_list=this.hierarchy.get(class_child);
		if(sup_list!=undefined){
			let pos= sup_list.indexOf(class_sup);
			return pos>=0;
		}

		return false;	    
	}

	classId_of_rdn(rdn){
		let type=typeof rdn;
		if(rdn==undefined || type!="string" ){
			return -1;
		}
		return parseInt(rdn.split(".")[0]);			
	}
	
	getDomain(property){ //Iterator<Integer> 
		var pdef=this.propertyByID.get(property);
		return pdef.domains;		
	}

	addClass(clsdef){
		this.classByName.set(clsdef.name, clsdef);
		this.classById.set(clsdef.id, clsdef);		
	}
	
	getIdClassForName(name){
		let clsdef=this.classByName.get(name);
		return clsdef.id;
	}

	getClassByName(root_class) {
		return this.classByName.get(root_class);
	}
	
	get_class_list(){
		return this.classByName.keys();
	}
	
	class_to_xml(class_name){
		//TODO soportar clasificacion de rangos. POr ejemplo, al seleccionar un producto se deduce la clase de la linea compatible a la clase del producto
		//Soporotar clases virtuales union de todos los especializados y de oneof, con fines gráficos (o que se resuelva al vuelo). Pero se predefine para referenciarse en configuraciones graficas
		
		let cls=this.getClassByName(class_name);
		let res=/*"<?xml version=\"1.0\" encoding=\"utf-8\"?>\n*/"<"+cls.getName()+">";
		for(let pdef of cls.getAllProperties()){
			let common=" name=\""+pdef.getName()+"\" ID=\""+pdef.getIdProp()+"\" " ;
			if(!pdef.isObjectProperty()){
				res+="\n\t<DATAPROP"+common+" type=\""+pdef.getDataPropertyTypeName()+"\"/>";				
			}else{
				//TODO En caso de haber especializados de rango, me quedo con la superior, y los formularios incluiran todo los de los hijos. Y en caso haber oneof deberia quedarme con un ID virtual
				
				let idrange=Array.from(pdef.getObjectPropertyRanges())[0];
				let clsRange=this.getClass(idrange);
				let ind_enum_list=clsRange.get_enum_list();
				res+="\n\t<OBJECTPROP"+common+" RANGE_NAME=\""+clsRange.getName()+"\" RANGEID=\""+idrange+"\" "+(ind_enum_list.length==0?"/":"")+">";
				for(let id of ind_enum_list){
					let ind=this.individual_store.getIndivById(id);
					res+="\n\t\t<ONEOF id=\""+id+"\" name=\""+ind.rdn+"\" />";
				}
				if(ind_enum_list.length>0) res+="\n\t</OBJECTPROP>";
			}
		}
		
		res+="\n</"+cls.getName()+">";
		return res;
	}

	getClass(id) {
		return this.classById.get(id);
	}

	getProperty(id){
		return this.propertyByID.get(id);
	}

	getPropertyByName(name){
		return this.propertyByName.get(name);
	}
	
	getPropertyId(name){
		return this.propertyByName.get(name).id;
	}

	addIndividual(rind){
		this.rdnMap.push(rind);
	}
}