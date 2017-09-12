//import Index from './index';
class threadData{
    constructor(callername,stepFocused){
	this.step=1;
	this.clean=false;
	this.callername=callername;			
	this.stepFocused=stepFocused;
    }
}

class storeListener{
    new_individual(clsdef_name,indiv_id){

    }
    set(indivudual,property,value){

    }	
}

class rule_data{
    constructor(rule_name,priority,handle_function,dependent_properties){
	this.rule_name=rule_name;
	this.priority=priority;
	this.handle_function=handle_function;
	this.dependent_properties=dependent_properties;
    }
}

class jsengine{
    constructor(ontologiemap,indstore,storelistener){
	this.storelistener=storelistener;
	this.indstore=indstore;
	this.om=ontologiemap;
	this.log_index=[];
	this.log_event=new Map();//prior>array of handle function
	this.log_accum=new Map();//key_accum_result>{prior,index of log}
	this.group_by_index=new Map();//key rule name>index
	this.index_map=new Map();
	this.event_map=new Map();//key index name>dependent property>handle func
	this.propagate_enable=true;
	this.accumulation=new Map();
    }

    new_accumulation(key,accum_value){	
	this.accumulation.set(key,new Accum_var(accum_var));
    }

    get_accumulation(key){
	let item=this.accumulation.get(key);

	if(item!=undefined && item!=null) return item.get();
	else return null;
    }

    new_group(rule_name,index_name,group_by,action_handle,reverse_handle,consequence_handle,prior){
	let index=this.index_map.get(index_name);
	this.group_by_index.set(rule_name,index);
	this.Parse_where(group_by);
	index.new_group(rule_name,group_by,action_handle,reverse_handle,consequence_handle,prior);
    }
    
    Parse_where(where_arr){
	for(let prop_where of where_arr){
	    if(prop_where instanceof Filter_Object_Property){
		if(typeof(prop_where.domain)=="string"){
		    //domain must be a index name
		    let index=this.index_map.get(prop_where.domain);
		    if(index instanceof Index){
			prop_where.domain=index;
		    }
		}
	    }
	}
    }
    
    setRules(rule_object){
	this.rule_object=rule_object;
    }

    init(){
	this.rule_object["index_build"]();
	for (let rule_name of Object.getOwnPropertyNames(Object.getPrototypeOf(this.rule_object))) {       
	    if (typeof this.rule_object[rule_name] == "function" && rule_name !="index_build" && rule_name!="constructor" ) {
		this.rule_object[rule_name]();
	    }
	}

    }

    getOntologieMap(){
	return this.om;
    }

    new_index(
	    name,
	    class_list,
	    where_obj_prop_list,
	    where_data_prop_list,
	    custom_where_function,
	    group_properties){

	let index=new Index(
		this,
		name,
		this.code_class(class_list),
		where_obj_prop_list,
		where_data_prop_list,
		custom_where_function,
		group_properties);
	this.index_map.set(name,index);
    }

    code_class(class_list_names){
	let res=[];
	for(let cls_name of class_list_names){
	    let cls=this.om.getClassByName(cls_name);
	    if(cls!=undefined)	res.push(this.om.getClassByName(cls_name).id);
	}
	return res;
    }

    getPerfil(indiv){
	var indivClass=indiv.clase;
	if(indivClass=="linea_articulos_materia"){
	    return lineaMap.get("124.1#427");
	}
	if(indivClass=="FACTURA_A_CLIENTE"){
	    return facturaMap.get("124");
	}
    }

    individual(idarr){
	var res= new Array();
	for(let id of idarr){
	    var pos=id.indexOf("#");
	    var fullid=id;
	    if(pos>0) id=id.slice(pos+1);
	    var classid=Number(id);
	    pos=id.indexOf(".");
	    //console.log("id "+id+" pos:"+pos);
	    if(pos>0) classid=Number(id.slice(0,pos));
	    //console.log("classid "+classid+" name:"+classlabel);
	    var ind=indstore.getIndivById(fullid,classid);
	    if(ind!=null) res.push(ind);
	}
	return res;
    }

    getInverseDomain(individual_range,property){
	//All domain source link to this individual by this property
	return this.indstore.getInverseDomain(individual_range,property);	    
    }

    getRange(individual,property){
	return this.indstore.getRange(individual,property);
    }

    setid(classid,id,property,value){
	var indiv=this.indstore.getIndivById(id,classid);
	indiv[property]=value;
	this.storelistener.set(indiv.id,property,value);					
    }

    set(indiv,property_name,value){	     
	//clone individual and insert again to fact array for immutable
	//TODO desactivado inmutable aqui por siguiente linea: let mutind=Immutable.Seq(indiv).toObject();	
	//TODO para desactivar inmutable es necesario hacer un set a individual store y actualizar arrInverse
	let mutind=indiv;
	//FIN desactivacion
	//this.indstore.insert(mutind);
	this.indstore.set(indiv.class,indiv.id,property_name,value);
	this.storelistener.set(indiv.class,indiv.id,property_name,value);	
	this.log_property_change(mutind,property_name,"set");
	this.propagate();
    }

    Log_event(priority,handle_function,individual,action){
	let log_of_prior=this.log_event.get(priority);
	if(log_of_prior==undefined){
	    log_of_prior=[];
	    this.log_event.set(priority,log_of_prior);
	}
	log_of_prior.push({individual:individual,handle_function:handle_function,action:action});
    }

    Log_accumulation(rule_name,result_key,prior){
	let prior_map=this.log_accum.get(prior);
	if(prior_map===undefined){
	    prior_map=new Map();
	    this.log_accum.set(prior,prior_map);
	}
	
	prior_map.set(result_key,rule_name);
    }
    
    Log_index(index,individual,existence){
	this.log_index.push({index:index,individual:individual,existence:existence});
    }

    log_property_change(individual,property,action){
	for(let [index_name,index] of this.index_map){
	    //check actualizara indice si toca, registrando en log
	    if(index.check(individual) && this.event_map.has(index_name)){
		this.log_property_change_byindex(index_name,individual,property,action);
	    }
	}
    }

    log_property_change_byindex(index_name,individual,property,action){
	let rule_list=this.event_map.get(index_name);
	for(let rule_data of rule_list){
	    //TODO es poco eficiente por cada cambio recorrer todas las reglas, deberia tener un mapa de propiedades dependientes hacia su regla
	    if(property===undefined||property==null||rule_data.dependent_properties.indexOf(property)>=0){
		//result.push(rule_data.handle_function);
		this.Log_event(rule_data.priority,rule_data.handle_function,individual,action);
	    }
	}

    }

    get_individual(group_key,key_context_result){
	return this.indstore.getIndivById(group_key.get_individual(key_context_result));
    }
    
    new_individual(indiv){
	this.indstore.insert(indiv);
	var clsdef=this.om.getClass(indiv.class);
	this.storelistener.new_individual(clsdef.name,indiv.id);
	this.log_property_change(indiv,null,"new");
	//al crearse individuos en JSE, se registran en log, y mas tarde se chequea su indexacion. En cargas masivas propagate esta inhabilitado hasta el final
	this.propagate();
    }

    delete_object(indiv){
	//TODO antes de actualizar los indices, debe propagarse la accion del, así los indices todavia saben cuando les afecta
    }

    is_specialized_of(class_child,class_sup){
	return this.om.is_specialized_of(class_child,class_sup);
    }

    getPropertyValue(individual,property){

    }

    log_clear(){
	log_index=[];
	log_event=[];
    }
    
    propagate_state(enable){
	this.propagate_enable=enable;
    }

    propagate(){
	if(this.propagate_enable){
	    this.propagate_index();
	    this.propagate_rules();
	}
    }

    propagate_index(){
	//TODO eliminar previamente log como en propagate rules
	let log_index_copy=this.log_index.slice(0);
	this.log_index=[];
	//al propagarse los indices, puede modificarse otros indices y registrarse en este log
	for(let log_entry of log_index_copy){
	    log_entry.index.propagate_index(log_entry.individual,log_entry.existence);
	}	
	//si otros indices se han modificado, reproceso recursivamente de nuevo
	if(this.log_index.length>0) this.propagate_index();
    }

    propagate_rules(){
	//TODO Una regla menos prioritaria puede ser que cuando se vaya a disparar no se cumple condiciones, debido a una regla previa
	//por tanto ese item de log deberia revisarse de nuevo, o no haber log
	
	let prio_list=new Set();
	for(let p of this.log_event.keys()){
	    prio_list.add(p);
	}
	
	for(let p of this.log_accum.keys()){
	    prio_list.add(p);
	}
	
	for(let priority of prio_list){	    
	    let data_arr=this.log_event.get(priority);
	    this.log_event.delete(priority);
	    if(data_arr!=undefined){
		for (let data of data_arr) {
		    data.handle_function(data.individual);
		}
	    }
	    let acc_prior_map=this.log_accum.get(priority);
	    this.log_accum.delete(priority);
	    if(acc_prior_map!=undefined){
		for(let [key,rule_name] of acc_prior_map){
		    let index=this.group_by_index.get(rule_name);
		    index.Group_consequence(rule_name,key);
		}
	    }
	}		    
    }

    add_listener_to_index(rule_name,index_name,priority,dependent_properties,handle_function){
	let rule_list=this.event_map.get(index_name);
	let data=new rule_data(rule_name,priority,handle_function,dependent_properties);

	if(rule_list==undefined){
	    rule_list=[];
	    this.event_map.set(index_name,rule_list);
	}

	rule_list.push(data);		    
    }
}

