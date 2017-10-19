/**
 * http://usejsdoc.org/
 */
class individual_store{

	constructor(ontologieMap){
		this.factArr=Immutable.Map({});	//key classId=>Map (key id=>ind)
		this.ontologieMap=ontologieMap;
		this.inverseArr=new Map();// TODO make inmutable
		this.rdnmap=new Map();//key=idclass+#+rdn,value id
	}
	getIndByRdn(cls_id,rdn){
		let id=this.rdnmap.get(""+cls_id+"#"+rdn);
		if(id!=undefined) return this.getIndivById(id);
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
			let x;
			for(let prop of cls.getAllProperties()){
				this.update_inverse_map(ind,prop);
			}
		}
		if(ind.hasOwnProperty("rdn")){
			this.rdnmap.set(""+ind.class+"#"+ind.rdn,ind.id);
		}
	}

	individual_to_xml(class_name,groupby){//groupby array of properties names
		let cls=this.ontologieMap.getClassByName(class_name);
		let xml="<?xml version=\"1.0\" encoding=\"UTF-8\"?>";
		xml+="\n<INDIVIDUAL>";
		let indMap=this.getIndividualMap(cls.id);
		
		let groupedInd=new Map();//key groups ranges id string=>Array of ind
		if(groupby!=undefined && groupby!=null){
			indMap.forEach( (ind, key) =>{
				let grkey="";
				for(let propname of groupby){
					let propdef=this.ontologieMap.getPropertyByName(propname);
					let propOfClass=cls.getProperty(propdef.id);
					if(ind.hasOwnProperty(propname) && propdef.isObjectProperty()){
						let rangeIndArr=this.getRange(ind,propname);
						let clsidrange=Array.from(propOfClass.getObjectPropertyRanges())[0];
						let clsRange=this.ontologieMap.getClass(clsidrange);
						
						for(let rangeInd of rangeIndArr){
							grkey+=(grkey.length>0?",":"")+propdef.id+"#"+rangeInd.id;							
						}						
					}
				}
				let indArr=groupedInd.get(grkey);
				if(indArr==undefined){
					indArr=[];
					groupedInd.set(grkey,indArr);
				}
				indArr.push(ind);
			});
		}else{
			let key=""+RDN+"#0";
			groupedInd.set(key,Array.from(indMap));
		}
				
		let groupname="";
		let lastgroup="";
		let lastgroupClass="";
		groupedInd.forEach( (indArr, grkey) =>{	
			for(let ind of indArr){
				if(groupby!=undefined && groupby!=null){
					let grkeyArr=grkey.split(",");
					
					for(let item of grkeyArr){
						let strArr=item.split("#");
						let propId=parseInt(strArr[0]);
						let rangeId=strArr[1];
						
						let propdef=this.ontologieMap.getProperty(propId);					
						if(ind.hasOwnProperty(propdef.name) && propdef.isObjectProperty()){
							let rangeInd=this.getIndivById(rangeId);
							let propOfClass=cls.getProperty(propdef.id);
							
							let clsidrange=Array.from(propOfClass.getObjectPropertyRanges())[0];
							let clsRange=this.ontologieMap.getClass(clsidrange);
							groupname=rangeInd.rdn;
							if(groupname!=lastgroup){
								if(lastgroup.length>0){
									xml+="\n\t</"+lastgroupClass+">";
								}
								xml+="\n\t<"+clsRange.name+" rdn=\""+groupname+"\" id=\""+rangeInd.id+"\">";
								lastgroup=groupname;
								lastgroupClass=clsRange.name;
								break;
							}
						}							
					}
				}
			    xml+="\n\t"+(groupname.length>0?"\t":"")+"<"+class_name+" rdn=\""+ind.rdn+"\" id=\""+ind.id+"\"/>";//+ind.rdn+"</"+cls.name+">";
			    
			    /*var utasksMap=indstore.getIndividualMap(5);//5 is id class of UTASK (a menu), and target class is object properties wich link to range class
			    utasksMap.forEach( (utask, key) => {
				    areasHtml+="<LI style='text-decoration:underline' onclick='tagetForm("+utask.targetClass+",\""+utask.id+"\")'>"+utask.rdn+","+key+"</LI>";
			    });
			    xml+="</UL>";*/
			}
		});
	    if(groupname.length>0) xml+="\n\t</"+groupname+">";
		xml+="\n</INDIVIDUAL>";	 
		return xml;
	}
	
	getIndiv_list_ById(ind_list){
		let result=[];
		for(let id of ind_list){
			result.push(this.getIndivById(id));
		}
		return result;
	}

	getIndivById(id,clsid){
		if(clsid===undefined||clsid==null){
			clsid=this.ontologieMap.classId_of_rdn(id);
		}
		var clsmap=this.getIndividualMap(clsid);
		return clsmap.get(id);
	}

	getIndividualMap(idclass){
		if(this.factArr.has(idclass)) return this.factArr.get(idclass);
		else return new Map();
	}

	getIndividualMapByName(clsname){
		var clsDef=this.ontologieMap.getClassByName(clsname);
		if(this.factArr.has(clsDef.id)) return this.factArr.get(clsDef.id);
		else return new Map();
	}

	set(class_id,id,property_name,value){
		let ind= this.getIndivById(id,class_id);
		if(property_name=="rdn"){
			let oldrdn=ind.rdn;
			if(oldrdn!=undefined){
				this.rdnmap.delete(""+class_id+"#"+oldrdn);
			}
			this.rdnmap.set(""+class_id+"#"+value,id);
		}
		
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

	getRange(individual,property_name){
		return this.getIndiv_list_ById(individual[property_name]);
	}
}