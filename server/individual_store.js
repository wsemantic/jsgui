/**
 * http://usejsdoc.org/
 */
class individual_store{

	constructor(ontologieMap){
		this.factArr=Immutable.Map({});	
		this.ontologieMap=ontologieMap;
		this.inverseArr=new Map();// TODO make inmutable
	}

	insert(ind){
		var classArr;

		if(!this.factArr.has(ind.class)){
			classArr=new Map();
			// Assign result to itself, because immutate return a new copy
			this.factArr=this.factArr.set(ind.class,classArr);
		}else{
			classArr=this.factArr.get(ind.class);
		}
		if(!classArr.has(ind.id)){
			var mutclassArr=classArr.set(ind.id,ind);
			this.factArr=this.factArr.set(ind.class,classArr);   
			let cls=this.ontologieMap.getClass(ind.class);
			for(let prop of cls.getAllProperties()){
				this.update_inverse_map(ind,prop);
			}
		}
	}

	getIndiv_list_ById(ind_list){
		let result=[];
		for(let id of ind_list){
			result.push(this.getIndivById(id));
		}
		return result;
	}

	getIndivById(id,clsid){
		if(clsid===undefined){
			clsid=this.ontologieMap.classId_of_rdn(id);
		}
		var clsmap=this.getClassMap(clsid);
		return clsmap.get(id);
	}

	getClassMap(idclass){
		if(this.factArr.has(idclass)) return this.factArr.get(idclass);
		else return new Map();
	}

	getClassMapByName(clsname){
		var clsDef=this.ontologieMap.getClassByName(clsname);
		if(this.factArr.has(clsDef.id)) return this.factArr.get(clsDef.id);
		else return new Map();
	}

	set(class_id,id,property_name,value){
		let ind= this.getIndivById(id,class_id);
		if(ind!=undefined){
			ind[property_name]=value;
			this.update_inverse_map(id,property_name,value);
		}

	}

	update_inverse_map_by_name(individual,property_name){
		update_inverse_map(individual,this.ontologieMap.getPropertyByName(property_name));
	}

	update_inverse_map(ind_dom,prop_def){
		let value=ind_dom[prop_def.name];
		if(value===undefined || value==null) return;

		if(prop_def.isObjectProp){
			if(Array.isArray(value)){
				for(let v of value){
					this.update_inverse_map_sub(ind_dom,prop_def,v);
				}
			}else{
				this.update_inverse_map_sub(ind_dom,prop_def,value);
			}
		}
	}

	update_inverse_map_sub(ind_dom,prop_def,value){
		let propArr=this.inverseArr.get(value);

		if(propArr==undefined){
			propArr=new Map();// key prop id
			this.inverseArr.set(value,propArr);
		}

		let valArr=propArr.get(value);
		if(valArr===undefined){
			valArr=[ind_dom.id];
			propArr.set(prop_def.id,valArr);	    
		}else{
			if(valArr.indexOf(ind_dom.id)<0){
				valArr.push(ind_dom.id);
			}
		}
	}

	getInverseDomain(this_individual,property_name){
		let prop_def=this.ontologieMap.getPropertyByName(property_name);
		let rangeMap=this.inverseArr.get(this_individual.id);
		if(rangeMap==undefined) return [];	
		let id_arr=rangeMap.get(prop_def.id);
		if(id_arr===undefined) return [];

		return this.getIndiv_list_ById(id_arr);
	}

	getRange(individual,property){
		return this.getIndiv_list_ById(individual[property]);
	}
}