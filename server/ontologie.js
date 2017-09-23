class ClassDef{	
	constructor(id,name,isAbstract){
		this.id=id;
		this.name=name;
		this.isAbstract=isAbstract;
		this.propList=new Map();//propid>PropertyDef
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

function Constants(){
	/*constructor(){
		Constants.IDTO_STRING=7923;
		Constants.IDTO_BOOLEAN=7929;
		Constants.IDTO_INT=7920;
		Constants.IDTO_DOUBLE=7910;
	}*/
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
		case Constants.IDTO_STRING:
			return "TEXT";
		case Constants.IDTO_BOOLEAN:
			return "BOOL";
		case Constants.IDTO_INT:
			return "INT";
		case Constants.IDTO_DOUBLE:
			return "FLOAT";
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
		Constants.IDTO_STRING=7923;
		Constants.IDTO_BOOLEAN=7929;
		Constants.IDTO_INT=7920;
		Constants.IDTO_DOUBLE=7910;
		
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


	load(jsonprops,jsonclasses,jsoninheritances){
		for(var jsprop of jsonprops){
			let type=jsprop.objtype;
			let isobjprop=type!=undefined;
			//DOC: 
			//Type, en object prop, es el rango por defecto, que igualmente al ser utilizado por una clase será añadido al array range
			//Pero la propiedad asociada a una clase puede ser sobreescrita sus rangos con one
			if(!isobjprop) type=jsprop.datatype;
			let propDef=new PropertyDef(jsprop.id,jsprop.name,type,isobjprop);
			this.propertyByID.set(jsprop.id,propDef);
			this.propertyByName.set(propDef.name,propDef);
		}

		for(var jsoncls of jsonclasses){
			let clsDef= new ClassDef(jsoncls.id,jsoncls.name,false);
			this.addClass(clsDef);

			for(let propElem of jsoncls.props){			    
				let pdef;
				let typename=typeof(propElem);
				if(typename=="number"){
					pdef=this.propertyByID.get(propElem);
				}else{
					pdef=this.propertyByID.get(propElem.id);
				}
				
				if(pdef.isObjectProperty()){
					let rangeList=new Array();
					if(propElem.hasOwnProperty("oneof")){
						rangeList=propElem.oneof;
						pdef=new PropertyDef(pdef.id,name,pdef.type,pdef.isObjectProperty());
					}else{
						rangeList.push(pdef.type);
					}
										
					for(let rangeId of rangeList){
						pdef.addRange(rangeId);
						let propByRangeArr=this.propertyByRange.get(rangeId);
						if(propByRangeArr==null){
							propByRangeArr=new Array();
							this.propertyByRange.set(rangeId, propByRangeArr);
						}else{
							if(propByRangeArr.indexOf(pdef)<0) propByRangeArr.push(pdef);
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
				res+="\n<DATAPROP"+common+" type=\""+pdef.getDataPropertyTypeName()+"\"/>";				
			}else{
				//TODO En caso de haber especializados de rango, me quedo con la superior, y los formularios incluiran todo los de los hijos. Y en caso haber oneof deberia quedarme con un ID virtual
				let idrange=Array.from(pdef.getObjectPropertyRanges())[0];
				let clsRange=this.getClass(idrange);
				res+="\n<OBJECTPROP"+common+" RANGE_NAME=\""+clsRange.getName()+"\" RANGEID=\""+idrange+"\">";
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

	addIndividual(rind){
		this.rdnMap.push(rind);
	}
}