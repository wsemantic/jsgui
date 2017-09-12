/**
 * 
 */

class Filter_Object_Property{
    
    constructor(domain,property,range,inverse=true){
	this.domain=domain;
	this.property=property;
	this.range=range;
	this.inverse=inverse;//por defecto true porque lo normal es depender de un contexto superior, como linea que depende de un documento
    }
    included_in(where_obj_prop_list){
	if(where_obj_prop_list===undefined || where_obj_prop_list===null ) return false;
	//TODO comprobar dominio subconjunto de otro dominio es included
	for(let wp of where_obj_prop_list){
	    if(wp.property==this.property && this.inverse==wp.inverse){
		if(this.domain instanceof Index){
		    if(!(wp.domain instanceof Index) || wp.domain.name!=this.domain.name) continue;
		}else
		    if(this.range instanceof Index){
			if(!(wp.range instanceof Index) || wp.range.name!=this.range.name) continue;
		    }else continue;
		
		return true;
	    }
	}
	return false;
    }    
}

class Filter_Data_Property{
    
    constructor(property,value){
	this.property=property;
	this.value=value;
    }
    
}