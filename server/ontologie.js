class ClassDef{	
	constructor(id,name,isAbstract){
		this.id=id;
		this.name=name;
		this.isAbstract=isAbstract;
		this.propList=new Map();//propname>PropertyDef
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
		return propList.get(id);
	}
	
}

class Constants{
	constructor(){
		this.IDTO_STRING=7923;
		this.IDTO_BOOLEAN=7929;
		this.IDTO_INT=7920;
		this.IDTO_DOUBLE=7910;
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
	}
	
	addRange(rg){
		this.ranges.add(rg);
	}
	
	isObjectProperty() {
		// TODO Auto-generated method stub
		return this.ranges.size>0;
	}

	getName() {
		// TODO Auto-generated method stub
		return name;
	}
	getPropertyTypes() {
		return ranges;
	}

	getIdProp() {
		// TODO Auto-generated method stub
		return this.id;
	}
	
	equals(ob){
		if(typeof(ob)!="PropertyDef") return false;
		return ob.id==this.id;
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
	this.classByName= new Map();//HashMap<String,ClassDef> 
	this.classById= new Map();//new HashMap<Integer,ClassDef>();
	this.rdnMap = new Array();//new ArrayList<rdnindividual>();
	this.propGroupMap=new Map();//new HashMap<String,ArrayList<PropertyDef>>() ;
	this.propertyByID= new Map();//new HashMap<String,PropertyDef>();
	this.propertyByName= new Map();//new HashMap<String,PropertyDef>();
	this.propertyForRange= new Map();//new HashMap<Integer,ArrayList<PropertyDef>>();
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


    load(jsonprops,jsonclasses,jsoninheritances){
	for(var jsprop of jsonprops){
	    let type=jsprop.objtype;
	    let isobjprop=type!=undefined;
	    if(!isobjprop) type=jsprop.datatype;
	    var propDef=new PropertyDef(jsprop.id,jsprop.name,type,isobjprop);
	    this.propertyByID.set(jsprop.id,propDef);
	    this.propertyByName.set(propDef.name,propDef);
	}

	for(var jsoncls of jsonclasses){
	    var clsDef= new ClassDef(jsoncls.id,jsoncls.name,false);
	    this.addClass(clsDef);

	    for(var propElem of jsoncls.props){			    
		var pdef;
		var typename=typeof(propElem);
		if(typename=="number"){
		    pdef=this.propertyByID.get(propElem);
		}
		else{
		    pdef=this.propertyByID.get(propElem.id);
		    if(propElem.hasOwnProperty("oneof")){
			pdef=new PropertyDef(pdef.id,name,pdef.type,pdef.isObjectProp);
		    }
		    for(var rangeId of propElem.oneof){
			pdef.addRange(rangeId);
			var propForRangeArr=this.propertyForRange.get(rangeId);
			if(propForRangeArr==null){
			    propForRangeArr=new Array();
			    this.propertyForRange.set(rangeId, propForRangeArr);
			}else{
			    if(propForRangeArr.indexOf(pdef)<0) propForRangeArr.push(pdef);
			}
		    }
		}
		pdef.domains.add(clsDef.id);				
		clsDef.addProperty(pdef);
	    }

	}

	for(let jsonh of jsoninheritances){
	    let sup_list=this.hierarchy.get(jsonh.class);
	    if(sup_list==undefined){
		sup_list=[];
		this.hierarchy.set(jsonh.class,sup_list);
	    }
	    sup_list.push(parseInt(jsonh.super));
	}
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


    getDomain(property){ //Iterator<Integer> 
	var pdef=this.propertyByID.get(property);
	return pdef.domains;		
    }

    addClass(clsdef){
	this.classByName.set(clsdef.name, clsdef);
	this.classById.set(clsdef.id, clsdef);		
    }

    getClassByName(root_class) {
	return this.classByName.get(root_class);
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
    
    addIndividual(rind){
	this.rdnMap.push(rind);
    }
}